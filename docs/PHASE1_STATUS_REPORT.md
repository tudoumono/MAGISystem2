# Phase 1 タイムアウト実装状況レポート

**最終更新**: 2025-11-10
**対象ブランチ**: `claude/review-code-011CUyix3DAtcQauKZLdGmD8`
**PR #7マージ後**: 確認済み

---

## 📊 実装進捗サマリー

| カテゴリ | 進捗率 | ステータス |
|---------|-------|-----------|
| 🛠️ **インフラ・設定** | **100%** | ✅ 完了 |
| 💻 **コード統合** | **0%** | ❌ 未実装 |
| **全体** | **50%** | 🟡 実装中 |

---

## ✅ 完了済み項目

### 1. 環境変数システム

#### `.env.local.template`
- ✅ 6つのタイムアウト環境変数を定義
- ✅ 詳細なコメントとデフォルト値
- ✅ A2A設計の多層タイムアウト戦略を文書化

**定義済み変数:**
```bash
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000           # Layer 1: Frontend (4 min)
AGENTCORE_PROCESS_TIMEOUT_MS=210000         # Layer 2: Next.js Backend (3.5 min)
MAGI_SAGE_TIMEOUT_SECONDS=90                # Layer 4: Individual Sages (1.5 min)
MAGI_SOLOMON_TIMEOUT_SECONDS=60             # Layer 5: SOLOMON Judge (1 min)
MAGI_TOTAL_TIMEOUT_SECONDS=180              # Layer 3: Python Total (3 min)
MAGI_EVENT_QUEUE_TIMEOUT_SECONDS=120        # Event queue (2 min)
```

#### `agents/backend/.env.template`
- ✅ AgentCore Runtime用の環境変数テンプレート
- ✅ Pythonプロセスに渡すタイムアウト設定を定義

### 2. 設定管理ユーティリティ

#### TypeScript: `agents/backend/src/lib/config/timeout.ts`
- ✅ `TimeoutConfig` インターフェース定義
- ✅ `loadTimeoutConfig()`: 環境変数から安全に読み込み
- ✅ `getTimeoutConfig()`: グローバル設定のシングルトンパターン
- ✅ `validateTimeoutHierarchy()`: 階層関係のバリデーション
- ✅ `exportPythonEnv()`: Python環境変数エクスポート
- ✅ デバッグログ出力機能

#### Python: `agents/config/timeout.py`
- ✅ `TimeoutConfig` dataclass定義
- ✅ `load_timeout_config()`: 環境変数から安全に読み込み
- ✅ `get_timeout_config()`: グローバル設定のシングルトンパターン
- ✅ `_validate_timeout_hierarchy()`: 階層関係のバリデーション
- ✅ デバッグログ出力機能

### 3. ドキュメンテーション

#### `TIMEOUT_IMPLEMENTATION_ANALYSIS.md`
- ✅ A2A設計のタイムアウト課題分析
- ✅ 5層タイムアウト戦略の詳細説明
- ✅ 拡張後のタイムアウト値（240s/210s/180s/90s/60s）
- ✅ コード例とベストプラクティス

#### `TIMEOUT_ENVIRONMENT_CONFIGURATION.md`
- ✅ 環境変数の完全ガイド
- ✅ ローカル/Docker/本番環境の設定方法
- ✅ コード統合例
- ✅ 環境別推奨設定
- ✅ パフォーマンスチューニング手法

---

## ❌ 未実装項目（Phase 1の残作業）

### Layer 1: フロントエンド SSEタイムアウト

**ファイル**: `src/lib/agents/stream-client.ts`

**現状**: タイムアウト処理が一切実装されていない

**必要な実装**:
```typescript
export async function streamMAGIResponse(options: StreamOptions): Promise<string> {
  const { question, sessionId, onMessage, onError, onComplete } = options;

  return new Promise((resolve, reject) => {
    // ⭐ タイムアウト設定
    const sseTimeoutMs = parseInt(
      process.env.NEXT_PUBLIC_SSE_TIMEOUT_MS || '240000',
      10
    );

    // ⭐ AbortController作成
    const controller = new AbortController();

    // ⭐ タイムアウト設定
    const timeoutId = setTimeout(() => {
      console.error(`❌ SSE stream timeout after ${sseTimeoutMs}ms`);
      controller.abort();
      const error = new Error(`リクエストがタイムアウトしました（${sseTimeoutMs / 1000}秒）`);
      onError?.(error);
      reject(error);
    }, sseTimeoutMs);

    try {
      fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sessionId }),
        signal: controller.signal,  // ⭐ AbortSignal追加
      })
      .then(response => {
        // 既存の処理...
      })
      .catch(error => {
        clearTimeout(timeoutId);  // ⭐ タイムアウトクリア
        if (error.name === 'AbortError') {
          const timeoutError = new Error(`リクエストがタイムアウトしました（${sseTimeoutMs / 1000}秒）`);
          onError?.(timeoutError);
          reject(timeoutError);
        } else {
          onError?.(error);
          reject(error);
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      // エラー処理...
    }
  });
}
```

**影響範囲**: `src/lib/agents/stream-client.ts` (56-181行目)

---

### Layer 2: Next.js Backend プロセス監視タイムアウト

**ファイル**: `agents/backend/app/api/invocations/route.ts`

**現状**: Pythonプロセスのタイムアウト処理が一切実装されていない

**必要な実装**:
```typescript
import { getTimeoutConfig, exportPythonEnv } from '@/lib/config/timeout';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ⭐ タイムアウト設定をロード
    const timeoutConfig = getTimeoutConfig();

    const stream = new ReadableStream({
      start(controller) {
        console.log('🚀 Starting Python MAGI agent process...');

        // Pythonプロセスを起動
        const pythonProcess = spawn(PYTHON_PATH, [MAGI_SCRIPT_PATH], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            ...exportPythonEnv(timeoutConfig),  // ⭐ タイムアウト設定を渡す
          }
        });

        // ⭐ TIMEOUT HANDLING - Layer 2
        let processCompleted = false;

        const timeoutId = setTimeout(() => {
          if (!processCompleted) {
            console.error(`❌ Python process timeout after ${timeoutConfig.processTimeoutMs}ms`);

            // プロセス強制終了
            if (!pythonProcess.killed) {
              pythonProcess.kill('SIGTERM');

              setTimeout(() => {
                if (!pythonProcess.killed) {
                  pythonProcess.kill('SIGKILL');
                }
              }, 5000);
            }

            // エラーイベント送信
            const timeoutEvent = {
              type: 'error',
              data: {
                error: 'Processing timeout',
                code: 'PROCESS_TIMEOUT',
                timeout: timeoutConfig.processTimeoutMs,
              },
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(timeoutEvent)}\n\n`));
            controller.close();
          }
        }, timeoutConfig.processTimeoutMs);  // ⭐ 環境変数から読み込んだ値

        pythonProcess.on('close', (code) => {
          processCompleted = true;
          clearTimeout(timeoutId);  // ⭐ タイムアウトクリア
          // 既存の処理...
        });

        // 既存のストリーミング処理...
      }
    });

    return new NextResponse(stream, {
      headers: { /* 既存のヘッダー */ },
    });

  } catch (error) {
    // エラー処理...
  }
}
```

**影響範囲**: `agents/backend/app/api/invocations/route.ts` (36-170行目)

---

### Layer 4: Python 個別賢者タイムアウト

**ファイル**: `agents/magi_agent.py`

**現状**:
- ❌ `_consult_sage_stream()` メソッドにLLM呼び出しのタイムアウト未実装
- ⚠️ Line 1110に`asyncio.wait_for(event_queue.get(), timeout=60.0)`があるが、これはイベントキュー用でLLM呼び出しではない

**必要な実装**:
```python
from config.timeout import get_timeout_config

class MAGIStrandsAgent:
    def __init__(self, custom_prompts: Optional[Dict[str, str]] = None):
        # ⭐ タイムアウト設定をロード
        self.timeout_config = get_timeout_config()
        # 既存の初期化処理...

    async def _consult_sage_stream(
        self,
        agent: Agent,
        agent_id: str,
        question: str,
        trace_id: str,
        custom_role: Optional[str] = None
    ):
        """個別の賢者に相談（タイムアウト付き）"""

        yield self._create_sse_event("agent_start", {
            "trace_id": trace_id
        }, agent_id=agent_id)

        print(f"  🤖 Consulting {agent_id.upper()}...")

        try:
            # ⭐ 環境変数から読み込んだ値
            timeout_seconds = self.timeout_config.sage_timeout_seconds

            # カスタムロールの処理...
            if custom_role:
                sage_json_format = _get_sage_json_format(self.sage_max_length)
                custom_prompt = custom_role + sage_json_format
                stream_kwargs = {'system_prompt': custom_prompt}
            else:
                stream_kwargs = {}

            full_response = ""

            # ⭐ タイムアウト付きで実行
            async def execute_with_timeout():
                async for chunk in agent.stream_async(question, **stream_kwargs):
                    # 既存のチャンク処理...
                    yield chunk

            # ⭐ asyncio.wait_for でタイムアウト制御
            async for chunk in asyncio.wait_for(
                execute_with_timeout(),
                timeout=timeout_seconds  # ⭐ 環境変数から取得
            ):
                # 既存の処理...
                chunk_text = None
                if isinstance(chunk, dict):
                    # チャンク処理...

                if chunk_text:
                    full_response += chunk_text
                    yield self._create_sse_event("agent_thinking", {
                        "text": chunk_text,
                        "trace_id": trace_id
                    }, agent_id=agent_id)

            # 完了処理...

        except asyncio.TimeoutError:
            print(f"  ⚠️ {agent_id.upper()} timeout after {timeout_seconds}s")
            # デフォルト結果を返す
            default_result = {
                "decision": "ABSTAINED",
                "reasoning": f"{agent_id.upper()} timed out after {timeout_seconds}s",
                "confidence": 0.0
            }
            yield self._create_sse_event("agent_complete", default_result, agent_id=agent_id)
```

**影響範囲**: `agents/magi_agent.py` (685-842行目)

---

### Layer 5: Python SOLOMON Judgeタイムアウト

**ファイル**: `agents/magi_agent.py`

**現状**: `_solomon_judgment_stream()` メソッドにタイムアウト未実装

**必要な実装**:
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
        # ⭐ 環境変数から読み込んだ値
        timeout_seconds = self.timeout_config.solomon_timeout_seconds

        # 既存のプロンプト構築処理...
        sage_summary = json.dumps(sage_data, ensure_ascii=False, indent=2)

        if custom_role:
            solomon_role = custom_role
        else:
            solomon_role = DEFAULT_SOLOMON_ROLE

        if '{sage_responses}' not in solomon_role:
            solomon_role += "\n\n【入力】\n3賢者の判断結果：\n{sage_responses}"

        solomon_role_with_data = solomon_role.format(sage_responses=sage_summary)
        solomon_json_format = _get_solomon_json_format(self.solomon_max_length)
        solomon_prompt = solomon_role_with_data + solomon_json_format

        full_response = ""
        chunk_count = 0

        # ⭐ タイムアウト付きで実行
        async def execute_solomon_with_timeout():
            async for chunk in self.solomon.stream_async(question, system_prompt=solomon_prompt):
                yield chunk

        async for chunk in asyncio.wait_for(
            execute_solomon_with_timeout(),
            timeout=timeout_seconds  # ⭐ 環境変数から取得
        ):
            # 既存のチャンク処理...
            chunk_text = None
            if isinstance(chunk, dict):
                # チャンク処理...

            if chunk_text:
                full_response += chunk_text
                yield self._create_sse_event("judge_thinking", {
                    "text": chunk_text,
                    "trace_id": trace_id
                })

        # JSON パース処理...

    except asyncio.TimeoutError:
        print(f"  ⚠️ SOLOMON timeout after {timeout_seconds}s")
        # デフォルト判断を返す
        default_result = {
            "final_decision": "REJECTED",
            "reasoning": f"SOLOMON evaluation timed out after {timeout_seconds}s",
            "confidence": 0.5,
            "sage_scores": {
                "caspar": 50,
                "balthasar": 50,
                "melchior": 50
            }
        }
        yield self._create_sse_event("judge_complete", default_result)
```

**影響範囲**: `agents/magi_agent.py` (844-1059行目)

---

## 📋 PR #7 との関係

### PR #7 の内容
```
520c74a fix(agents): Update to Strands Agents 1.0 API - remove deprecated kwargs usage
321c83e test(agents): Add comprehensive MAGI AgentCore Runtime test suite
```

### 影響
- ✅ **競合なし**: PR #7はテストとAPI更新のみで、タイムアウト実装とは独立
- ✅ **互換性**: Strands Agents 1.0 APIを使用したタイムアウト実装が可能
- ✅ **テストカバレッジ**: PR #7で追加されたテストは、タイムアウト実装後の動作確認に利用可能

---

## 🎯 Phase 1 完了のためのチェックリスト

### 実装タスク

- [ ] **Layer 1: フロントエンド SSEタイムアウト**
  - [ ] `src/lib/agents/stream-client.ts` にAbortControllerとタイムアウト処理を追加
  - [ ] タイムアウト時のエラーメッセージをユーザーフレンドリーに
  - [ ] 環境変数 `NEXT_PUBLIC_SSE_TIMEOUT_MS` を使用

- [ ] **Layer 2: Next.js Backend プロセス監視タイムアウト**
  - [ ] `agents/backend/app/api/invocations/route.ts` にタイムアウト処理を追加
  - [ ] `getTimeoutConfig()` で設定をロード
  - [ ] `exportPythonEnv()` でPythonに環境変数を渡す
  - [ ] SIGTERM → SIGKILL のグレースフルシャットダウン実装

- [ ] **Layer 4: Python 個別賢者タイムアウト**
  - [ ] `agents/magi_agent.py` の `_consult_sage_stream()` に `asyncio.wait_for` 追加
  - [ ] `get_timeout_config()` で設定をロード
  - [ ] タイムアウト時のデフォルト結果（ABSTAINED）を返す
  - [ ] デバッグログ出力

- [ ] **Layer 5: Python SOLOMON Judgeタイムアウト**
  - [ ] `agents/magi_agent.py` の `_solomon_judgment_stream()` に `asyncio.wait_for` 追加
  - [ ] タイムアウト時のデフォルト判断（REJECTED, confidence=0.5）を返す
  - [ ] デバッグログ出力

### テスト・検証

- [ ] **ローカル環境でのテスト**
  - [ ] `.env.local` にタイムアウト値を設定
  - [ ] 各レイヤーのタイムアウトが正常に動作することを確認
  - [ ] タイムアウト時のグレースフルデグラデーションを確認

- [ ] **デバッグログ確認**
  - [ ] `DEBUG_STREAMING=true` でタイムアウト設定が正しく読み込まれることを確認
  - [ ] タイムアウト発生時のログメッセージを確認

- [ ] **エラーハンドリング確認**
  - [ ] Layer 1でタイムアウト → ユーザーにエラー表示
  - [ ] Layer 2でタイムアウト → Pythonプロセス強制終了
  - [ ] Layer 4でタイムアウト → 該当賢者はABSTAINED
  - [ ] Layer 5でタイムアウト → REJECTED判定

---

## 📈 次のステップ

### Phase 1完了後
1. **PR作成**: 現在のブランチ (`claude/review-code-011CUyix3DAtcQauKZLdGmD8`) でPR作成
2. **レビュー**: タイムアウト実装のコードレビュー
3. **マージ**: mainブランチへのマージ

### Phase 2（将来の拡張）
- ユーザーフレンドリーなエラーメッセージ
- グレースフルデグラデーション（部分結果の活用）
- 監視ログの強化

### Phase 3（高度な機能）
- リトライ機構
- サーキットブレーカーパターン
- キャッシング

---

## 📝 まとめ

### ✅ 強み
- 環境変数システムが完璧に設計・実装されている
- TypeScript/Python両方の設定管理ユーティリティが完成
- バリデーション・デバッグ機能が充実
- ドキュメンテーションが包括的

### ❌ 弱み
- 実際のコード統合が一切行われていない
- 4つのレイヤー全てでタイムアウト処理が未実装

### 🎯 優先順位
1. **最優先**: Layer 4 (Python賢者タイムアウト) - A2A設計の中核
2. **高**: Layer 2 (Next.jsプロセス監視) - 全体の安全弁
3. **中**: Layer 1 (フロントエンドSSE) - ユーザー体験向上
4. **低**: Layer 5 (SOLOMON) - 既にフォールバック機構あり

### ⏱️ 推定作業時間
- Layer 4実装: 1-2時間
- Layer 2実装: 1時間
- Layer 1実装: 30分
- Layer 5実装: 30分
- テスト・検証: 1-2時間
- **合計**: 4-6時間

---

**次のアクション**: Layer 4（Python賢者タイムアウト）の実装から開始することを推奨します。
