# タイムアウト処理の実装分析 - A2A設計の考慮

## 🎯 問題の本質

MAGIシステムは**Agent-to-Agent (A2A)** 設計のため、以下の理由でタイムアウトが発生しやすい環境です。

### A2A設計の特性

```
┌─────────────────────────────────────────────────────────────┐
│ フロントエンド                                               │
│  - ユーザーがリクエスト送信                                   │
└─────────────────────────────────────────────────────────────┘
                         │ HTTP POST /invocations
                         ▼ (タイムアウトポイント①)
┌─────────────────────────────────────────────────────────────┐
│ Next.js Backend (AgentCore Runtime)                          │
│  - spawn('python', ['magi_agent.py'])                       │
└─────────────────────────────────────────────────────────────┘
                         │ 子プロセス実行
                         ▼ (タイムアウトポイント②)
┌─────────────────────────────────────────────────────────────┐
│ Python MAGI Agent                                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 3賢者の並列実行                                        │  │
│  │  ├─ CASPAR    → Bedrock API (10-30秒)  ◀ポイント③   │  │
│  │  ├─ BALTHASAR → Bedrock API (10-30秒)  ◀ポイント③   │  │
│  │  └─ MELCHIOR  → Bedrock API (10-30秒)  ◀ポイント③   │  │
│  └───────────────────────────────────────────────────────┘  │
│                         │ 並列完了待機                        │
│                         ▼ (タイムアウトポイント④)            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ SOLOMON Judge                                         │  │
│  │  └─ 統合評価 → Bedrock API (10-30秒)  ◀ポイント⑤    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 実測値（test_magi2.py より）

```
実行時間: 11.96秒
イベント数: 383イベント
```

**最悪ケースのシナリオ:**
- 3賢者の並列実行: 各30秒（ネットワーク遅延、API制限）
- SOLOMON Judge: 30秒
- バッファリング・処理時間: 10秒
- **合計: 最大70秒**

---

## 🔍 現在の実装状況

### ✅ 実装済み（部分的）

#### Python側: `agents/magi_agent.py:1110`

```python
async def _merge_streams(self, tasks):
    while completed_tasks < total_tasks:
        try:
            # ⭐ イベントキューからの取得に60秒タイムアウト
            task_id, event = await asyncio.wait_for(event_queue.get(), timeout=60.0)
            # ...
        except asyncio.TimeoutError:
            print("  ⚠️ Timeout waiting for sage responses")
            break
```

**問題点:**
- ✅ イベントキュー取得のタイムアウトは実装済み
- ❌ 個別の賢者（CASPAR/BALTHASAR/MELCHIOR）のLLM呼び出しにタイムアウトなし
- ❌ SOLOMON JudgeのLLM呼び出しにタイムアウトなし
- ❌ タイムアウト後のリカバリー処理が不十分

### ❌ 未実装

#### Next.js Backend: `agents/backend/app/api/invocations/route.ts`

```typescript
pythonProcess.on('close', (code) => {
  // プロセス終了時の処理のみ
});

pythonProcess.on('error', (error) => {
  // プロセス起動エラーのみ
});

// ❌ プロセス実行時間のタイムアウト処理なし
// ❌ ハングしたプロセスの強制終了なし
```

**問題点:**
- ❌ Pythonプロセスが無制限に実行され続ける
- ❌ ハングしたプロセスを検出・終了する機構なし
- ❌ フロントエンドに適切なエラー通知なし

---

## 🚨 A2A設計におけるタイムアウトの影響

### 1. カスケード障害のリスク

```
3賢者の1つがハング
  ↓
_merge_streams が60秒待機
  ↓
SOLOMON が不完全なデータで実行
  ↓
ユーザーに誤った判断を提供
```

### 2. リソース枯渇

```
タイムアウトなし
  ↓
複数のリクエストが同時にハング
  ↓
Pythonプロセスが蓄積
  ↓
メモリ・CPU枯渇
  ↓
サーバーダウン
```

### 3. ユーザー体験の悪化

```
ユーザーがリクエスト
  ↓
60秒待機（無反応）
  ↓
タイムアウトエラー
  ↓
結果が得られない（フラストレーション）
```

---

## 💡 推奨する実装案

### Phase 1: 多層タイムアウト戦略（即座に実施）

各レイヤーで適切なタイムアウトを設定し、障害の影響範囲を最小化します。

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: フロントエンド (SSEクライアント)                     │
│  - タイムアウト: 120秒（2分）                                │
│  - 理由: 最悪ケースでも完了を待つ                            │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Next.js Backend (Pythonプロセス監視)                │
│  - タイムアウト: 90秒                                        │
│  - アクション: プロセス強制終了 (SIGTERM → SIGKILL)          │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Python - 全体処理                                   │
│  - タイムアウト: 80秒                                        │
│  - アクション: 処理中断、部分結果を返す                      │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Python - 個別賢者                                   │
│  - タイムアウト: 45秒（各賢者）                              │
│  - アクション: ABSTAINEDとして扱う                           │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Python - SOLOMON Judge                              │
│  - タイムアウト: 30秒                                        │
│  - アクション: デフォルト判断を返す                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 実装コード例

### 1. Next.js Backend - プロセス監視タイムアウト

**ファイル**: `agents/backend/app/api/invocations/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const stream = new ReadableStream({
      start(controller) {
        console.log('🚀 Starting Python MAGI agent process...');

        const pythonProcess = spawn(PYTHON_PATH, [MAGI_SCRIPT_PATH], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        // ==========================================
        // 🕐 TIMEOUT HANDLING - Layer 2
        // ==========================================
        const PROCESS_TIMEOUT_MS = 90000; // 90秒
        let processCompleted = false;

        const timeoutId = setTimeout(() => {
          if (!processCompleted) {
            console.error('❌ Python process timeout - forcing termination');

            // エラーイベント送信
            const timeoutEvent = {
              type: 'error',
              data: {
                error: 'Processing timeout - the request took too long',
                code: 'PROCESS_TIMEOUT',
                timeout: PROCESS_TIMEOUT_MS,
              },
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(timeoutEvent)}\n\n`));

            // プロセス強制終了
            if (!pythonProcess.killed) {
              pythonProcess.kill('SIGTERM'); // 優雅な終了を試みる

              // 5秒後にまだ終了していなければSIGKILL
              setTimeout(() => {
                if (!pythonProcess.killed) {
                  console.error('❌ SIGTERM failed, sending SIGKILL');
                  pythonProcess.kill('SIGKILL');
                }
              }, 5000);
            }

            // ストリーム終了
            controller.close();
          }
        }, PROCESS_TIMEOUT_MS);

        // プロセス終了時にタイムアウトをクリア
        pythonProcess.on('close', (code) => {
          processCompleted = true;
          clearTimeout(timeoutId);

          console.log(`🏁 Python process exited with code ${code}`);

          // ... 既存の処理
          controller.close();
        });

        // ... 既存の処理（stdin, stdout, stderr）
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ /invocations endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### 2. Python - 個別賢者のタイムアウト

**ファイル**: `agents/magi_agent.py`

```python
async def _consult_sage_stream(
    self,
    agent: Agent,
    agent_id: str,
    question: str,
    trace_id: str,
    custom_role: Optional[str] = None
):
    """個別の賢者に相談（タイムアウト付き）"""

    # 開始イベント
    yield self._create_sse_event("agent_start", {
        "trace_id": trace_id
    }, agent_id=agent_id)

    try:
        # ==========================================
        # 🕐 TIMEOUT HANDLING - Layer 4
        # ==========================================
        SAGE_TIMEOUT_SECONDS = 45  # 各賢者45秒

        async def execute_with_timeout():
            """タイムアウト付きでLLM実行"""
            full_response = ""

            if custom_role:
                sage_json_format = _get_sage_json_format(self.sage_max_length)
                custom_prompt = custom_role + sage_json_format
                stream_kwargs = {'system_prompt': custom_prompt}
            else:
                stream_kwargs = {}

            async for chunk in agent.stream_async(question, **stream_kwargs):
                # チャンク処理（既存のロジック）
                chunk_text = None

                if isinstance(chunk, dict):
                    if 'event' in chunk:
                        event_data = chunk['event']
                        if isinstance(event_data, dict) and 'contentBlockDelta' in event_data:
                            delta = event_data['contentBlockDelta'].get('delta', {})
                            if isinstance(delta, dict) and 'text' in delta:
                                chunk_text = delta['text']
                elif isinstance(chunk, str):
                    chunk_text = chunk

                if not chunk_text:
                    continue

                if agent_id in self.sage_states and self._is_content_chunk(chunk_text):
                    self.sage_states[agent_id]["buffer"] += chunk_text

                full_response += chunk_text

                yield self._create_sse_event("agent_thinking", {
                    "text": chunk_text,
                    "trace_id": trace_id
                }, agent_id=agent_id)

            return full_response

        # タイムアウト付きで実行
        try:
            full_response = ""
            async for event in asyncio.wait_for(
                execute_with_timeout(),
                timeout=SAGE_TIMEOUT_SECONDS
            ):
                yield event
                if isinstance(event, str):
                    full_response = event

        except asyncio.TimeoutError:
            print(f"  ⚠️ {agent_id.upper()} timeout after {SAGE_TIMEOUT_SECONDS}s")

            # タイムアウトイベント
            yield self._create_sse_event("agent_timeout", {
                "trace_id": trace_id,
                "timeout": SAGE_TIMEOUT_SECONDS
            }, agent_id=agent_id)

            # デフォルト結果（ABSTAINED）
            default_result = {
                "decision": "ABSTAINED",
                "reasoning": f"タイムアウト（{SAGE_TIMEOUT_SECONDS}秒）により判断を保留しました",
                "confidence": 0.0
            }

            # ステートマシンに記録
            if agent_id in self.sage_states:
                self.sage_states[agent_id]["decision"] = default_result
                self.sage_states[agent_id]["completed"] = True

            yield self._create_sse_event("agent_complete", default_result, agent_id=agent_id)
            return

        # JSONパース（既存のロジック）
        # ...

    except Exception as e:
        print(f"  ❌ {agent_id.upper()} failed: {e}")
        # エラー処理（既存のロジック）
        # ...
```

---

### 3. Python - SOLOMON Judge のタイムアウト

**ファイル**: `agents/magi_agent.py`

```python
async def _solomon_judgment_stream(
    self,
    sage_responses: list,
    question: str,
    trace_id: str,
    custom_role: Optional[str] = None
):
    """SOLOMON Judgeによる統合評価（タイムアウト付き）"""

    try:
        # ==========================================
        # 🕐 TIMEOUT HANDLING - Layer 5
        # ==========================================
        SOLOMON_TIMEOUT_SECONDS = 30

        # 賢者データの準備（既存のロジック）
        # ...

        async def execute_solomon_with_timeout():
            """タイムアウト付きでSOLOMON実行"""
            full_response = ""

            async for chunk in self.solomon.stream_async(question, system_prompt=solomon_prompt):
                # チャンク処理（既存のロジック）
                chunk_text = None

                if isinstance(chunk, dict):
                    if 'event' in chunk:
                        event_data = chunk['event']
                        if isinstance(event_data, dict) and 'contentBlockDelta' in event_data:
                            delta = event_data['contentBlockDelta'].get('delta', {})
                            if isinstance(delta, dict) and 'text' in delta:
                                chunk_text = delta['text']
                elif isinstance(chunk, str):
                    chunk_text = chunk

                if not chunk_text:
                    continue

                full_response += chunk_text

                yield self._create_sse_event("judge_thinking", {
                    "text": chunk_text,
                    "trace_id": trace_id
                })

            return full_response

        # タイムアウト付きで実行
        try:
            full_response = ""
            async for event in asyncio.wait_for(
                execute_solomon_with_timeout(),
                timeout=SOLOMON_TIMEOUT_SECONDS
            ):
                yield event
                if isinstance(event, str):
                    full_response = event

        except asyncio.TimeoutError:
            print(f"  ⚠️ SOLOMON timeout after {SOLOMON_TIMEOUT_SECONDS}s")

            # デフォルト判断を返す
            # 3賢者の多数決で判断
            approved = sum(1 for r in sage_responses if r.get('decision') == 'APPROVED')
            rejected = sum(1 for r in sage_responses if r.get('decision') == 'REJECTED')

            default_result = {
                "final_decision": "APPROVED" if approved > rejected else "REJECTED",
                "reasoning": f"タイムアウト（{SOLOMON_TIMEOUT_SECONDS}秒）により、3賢者の多数決で判断しました（承認{approved}、却下{rejected}）",
                "confidence": 0.4,  # 低い信頼度
                "sage_scores": {
                    "caspar": 50,
                    "balthasar": 50,
                    "melchior": 50
                }
            }

            yield self._create_sse_event("judge_complete", default_result)
            return

        # JSON パース（既存のロジック）
        # ...

    except Exception as e:
        # エラー処理（既存のロジック）
        # ...
```

---

### 4. フロントエンド - SSEクライアントタイムアウト

**ファイル**: `src/hooks/useMAGIStream.ts` (新規作成)

```typescript
export function useMAGIStream() {
  const invokeMAGI = async (question: string) => {
    // ==========================================
    // 🕐 TIMEOUT HANDLING - Layer 1
    // ==========================================
    const SSE_TIMEOUT_MS = 120000; // 120秒（2分）

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('❌ SSE stream timeout');
      controller.abort();
    }, SSE_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AGENTCORE_URL}/api/invocations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question }),
          signal: controller.signal, // ⭐ AbortController
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      // SSEストリーミング処理
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          clearTimeout(timeoutId);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6);
            try {
              const event = JSON.parse(jsonStr);

              // イベント処理
              if (event.type === 'error' && event.data?.code === 'PROCESS_TIMEOUT') {
                console.error('Backend process timeout:', event.data);
                // ユーザーにフレンドリーなエラー表示
                throw new Error('処理に時間がかかりすぎています。もう一度お試しください。');
              }

              // 通常イベント処理
              // ...

            } catch (parseError) {
              console.warn('Failed to parse SSE event:', line);
            }
          }
        }
      }

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました。システムが応答していません。');
      }

      throw error;
    }
  };

  return { invokeMAGI };
}
```

---

## 📊 タイムアウト設定の根拠

### A2A設計における時間配分

| フェーズ | 想定時間 | タイムアウト | バッファ |
|---------|---------|------------|---------|
| **3賢者並列実行** | 平均20秒、最悪30秒 | 45秒 | +15秒 |
| **SOLOMON Judge** | 平均15秒、最悪20秒 | 30秒 | +10秒 |
| **Python全体処理** | 平均35秒、最悪50秒 | 80秒 | +30秒 |
| **Next.js監視** | - | 90秒 | Python+10秒 |
| **フロントエンド** | - | 120秒 | Next.js+30秒 |

### グレースフル・デグラデーション

```
賢者1つタイムアウト
  ↓
ABSTAINED として扱う
  ↓
残り2賢者 + SOLOMON で判断
  ↓
✅ ユーザーに（部分的な）結果を返す
```

---

## 🔄 Phase 2: リトライ戦略（将来実装）

### 1. 自動リトライ（エクスポネンシャル・バックオフ）

```python
async def _consult_sage_with_retry(self, agent, agent_id, question, max_retries=2):
    """リトライ機構付き賢者相談"""

    for attempt in range(max_retries + 1):
        try:
            result = await self._consult_sage_stream(agent, agent_id, question)
            return result

        except asyncio.TimeoutError:
            if attempt < max_retries:
                backoff = 2 ** attempt  # 1秒、2秒、4秒...
                print(f"  🔄 {agent_id} retry {attempt + 1}/{max_retries} after {backoff}s")
                await asyncio.sleep(backoff)
            else:
                # 最終的にABSTAINED
                return default_abstained_result
```

### 2. サーキットブレーカー

```python
class CircuitBreaker:
    """連続失敗時に一時的にリクエストを遮断"""

    def __init__(self, failure_threshold=3, timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.last_failure_time = None

    async def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            # 一定時間経過後にHALF_OPENへ
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = await func(*args, **kwargs)

            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0

            return result

        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"

            raise e
```

---

## ✅ 実装チェックリスト

### Phase 1: 基本タイムアウト（即座に実施）

- [ ] **Next.js Backend**: プロセス監視タイムアウト（90秒）
- [ ] **Python - 賢者**: 個別タイムアウト（45秒）
- [ ] **Python - SOLOMON**: タイムアウト（30秒）
- [ ] **フロントエンド**: SSEクライアントタイムアウト（120秒）
- [ ] **環境変数**: タイムアウト値を設定可能に

### Phase 2: エラーハンドリング強化

- [ ] タイムアウト時のユーザーフレンドリーなエラーメッセージ
- [ ] 部分結果の返却（グレースフル・デグラデーション）
- [ ] 監視ログの追加（タイムアウト発生頻度の追跡）

### Phase 3: リトライ・回復機構

- [ ] 自動リトライ（エクスポネンシャル・バックオフ）
- [ ] サーキットブレーカー
- [ ] キャッシング（同一質問の再利用）

---

## 📈 監視・メトリクス

タイムアウト処理実装後に追跡すべきメトリクス：

```typescript
// 監視項目
{
  "timeout_metrics": {
    "sage_timeouts": {
      "caspar": 2,      // CASPAR のタイムアウト回数
      "balthasar": 0,
      "melchior": 1
    },
    "solomon_timeouts": 1,
    "process_timeouts": 0,
    "average_execution_time": 12.3,  // 秒
    "p95_execution_time": 25.1,
    "p99_execution_time": 45.8
  }
}
```

---

## 🎯 まとめ

### A2A設計のタイムアウトが重要な理由

1. **複数のLLM呼び出し**: 3賢者 + SOLOMON = 4回のAPI呼び出し
2. **カスケード障害**: 1つの賢者の遅延が全体に影響
3. **リソース保護**: タイムアウトなしでは無制限にリソース消費

### 推奨アプローチ

✅ **多層タイムアウト**: 各レイヤーで適切な時間設定
✅ **グレースフル・デグラデーション**: 部分結果を返す
✅ **監視とアラート**: タイムアウト発生を追跡

### 次のアクション

Phase 1の実装を開始しますか？コード実装のサポートが必要な場合はお知らせください。
