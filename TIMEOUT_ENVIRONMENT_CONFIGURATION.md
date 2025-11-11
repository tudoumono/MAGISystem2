# タイムアウト設定の環境変数化ガイド

## 🎯 目的

タイムアウト値をハードコードせず、環境変数で管理することで：
- ✅ 環境ごとの柔軟な設定（開発/ステージング/本番）
- ✅ デプロイ時の設定変更が容易
- ✅ A/Bテストやパフォーマンスチューニングが可能

---

## 📊 タイムアウト設定一覧

### Layer 1: フロントエンド (SSEクライアント)

| 環境変数 | デフォルト値 | 説明 |
|---------|------------|------|
| `NEXT_PUBLIC_SSE_TIMEOUT_MS` | `240000` (4分) | SSEストリームの最大待機時間 |

### Layer 2: Next.js Backend (Pythonプロセス監視)

| 環境変数 | デフォルト値 | 説明 |
|---------|------------|------|
| `AGENTCORE_PROCESS_TIMEOUT_MS` | `210000` (3.5分) | Pythonプロセスの最大実行時間 |

### Layer 3-5: Python MAGI Agent

| 環境変数 | デフォルト値 | 説明 |
|---------|------------|------|
| `MAGI_SAGE_TIMEOUT_SECONDS` | `90` (1.5分) | 個別賢者のLLM呼び出しタイムアウト |
| `MAGI_SOLOMON_TIMEOUT_SECONDS` | `60` (1分) | SOLOMON JudgeのLLM呼び出しタイムアウト |
| `MAGI_TOTAL_TIMEOUT_SECONDS` | `180` (3分) | Python全体処理のタイムアウト |
| `MAGI_EVENT_QUEUE_TIMEOUT_SECONDS` | `120` (2分) | イベントキュー取得のタイムアウト |

---

## 🔧 設定方法

### 1. ローカル開発環境

#### フロントエンド

`.env.local` ファイルを作成：

```bash
# プロジェクトルートで実行
cp .env.local.template .env.local
```

必要に応じて値を編集：

```bash
# .env.local

# フロントエンドのSSEタイムアウト
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000

# AgentCore Runtime URL
NEXT_PUBLIC_AGENTCORE_URL=http://localhost:8080
```

#### AgentCore Runtime (Next.js Backend)

```bash
# agents/backend/.env.local を作成
cd agents/backend
cp .env.template .env.local
```

編集：

```bash
# agents/backend/.env.local

# Pythonプロセス監視タイムアウト
AGENTCORE_PROCESS_TIMEOUT_MS=210000

# Pythonに渡すタイムアウト設定
MAGI_SAGE_TIMEOUT_SECONDS=90
MAGI_SOLOMON_TIMEOUT_SECONDS=60
MAGI_TOTAL_TIMEOUT_SECONDS=180
MAGI_EVENT_QUEUE_TIMEOUT_SECONDS=120
```

---

### 2. Docker環境

#### docker-compose.yml

```yaml
version: '3.8'

services:
  agentcore-runtime:
    build:
      context: .
      dockerfile: agents/Dockerfile
    ports:
      - "8080:8080"
    environment:
      # タイムアウト設定
      - AGENTCORE_PROCESS_TIMEOUT_MS=210000
      - MAGI_SAGE_TIMEOUT_SECONDS=90
      - MAGI_SOLOMON_TIMEOUT_SECONDS=60
      - MAGI_TOTAL_TIMEOUT_SECONDS=180
      - MAGI_EVENT_QUEUE_TIMEOUT_SECONDS=120

      # その他の設定
      - AWS_REGION=ap-northeast-1
      - PYTHON_PATH=python
      - MAGI_SCRIPT_PATH=/app/magi_agent.py

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SSE_TIMEOUT_MS=240000
      - NEXT_PUBLIC_AGENTCORE_URL=http://agentcore-runtime:8080
```

---

### 3. 本番環境（Amplify Hosting）

#### フロントエンド

Amplify Console → 環境変数：

```
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000
NEXT_PUBLIC_AGENTCORE_URL=https://your-agentcore-url.amplifyapp.com
```

#### AgentCore Runtime

デプロイ先のプラットフォームに応じて設定：

**AWS App Runner / ECS / Fargate:**
- コンソールまたはIaCツールで環境変数を設定

**例（Terraform）:**

```hcl
resource "aws_apprunner_service" "agentcore_runtime" {
  # ...

  source_configuration {
    image_repository {
      # ...
    }
  }

  instance_configuration {
    # ...
  }

  environment_variables = {
    AGENTCORE_PROCESS_TIMEOUT_MS = "210000"
    MAGI_SAGE_TIMEOUT_SECONDS = "90"
    MAGI_SOLOMON_TIMEOUT_SECONDS = "60"
    MAGI_TOTAL_TIMEOUT_SECONDS = "180"
    MAGI_EVENT_QUEUE_TIMEOUT_SECONDS = "120"
  }
}
```

---

## 💻 実装コード例

### Next.js Backend (TypeScript)

**`agents/backend/src/app/api/invocations/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { getTimeoutConfig, exportPythonEnv } from '@/lib/config/timeout';

export async function POST(request: NextRequest) {
  try {
    // タイムアウト設定をロード
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

        // ==========================================
        // 🕐 TIMEOUT HANDLING - Layer 2
        // ==========================================
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
          clearTimeout(timeoutId);
          // ...
        });

        // ... 残りの処理
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### Python MAGI Agent

**`agents/magi_agent.py`**

```python
import asyncio
from config.timeout import get_timeout_config

class MAGIDecisionSystem:
    def __init__(self):
        # タイムアウト設定をロード
        self.timeout_config = get_timeout_config()
        # ...

    async def _consult_sage_stream(self, agent, agent_id, question, trace_id):
        """個別の賢者に相談（タイムアウト付き）"""

        try:
            # ⭐ 環境変数から読み込んだ値
            timeout_seconds = self.timeout_config.sage_timeout_seconds

            async def execute_with_timeout():
                # LLM呼び出し処理
                async for chunk in agent.stream_async(question):
                    # ...
                    yield event

            # タイムアウト付きで実行
            async for event in asyncio.wait_for(
                execute_with_timeout(),
                timeout=timeout_seconds  # ⭐ 環境変数から取得
            ):
                yield event

        except asyncio.TimeoutError:
            print(f"  ⚠️ {agent_id.upper()} timeout after {timeout_seconds}s")
            # デフォルト結果を返す
            # ...

    async def _solomon_judgment_stream(self, sage_responses, question, trace_id):
        """SOLOMON Judgeによる統合評価（タイムアウト付き）"""

        try:
            # ⭐ 環境変数から読み込んだ値
            timeout_seconds = self.timeout_config.solomon_timeout_seconds

            async def execute_solomon_with_timeout():
                # SOLOMON LLM呼び出し
                async for chunk in self.solomon.stream_async(question):
                    # ...
                    yield event

            # タイムアウト付きで実行
            async for event in asyncio.wait_for(
                execute_solomon_with_timeout(),
                timeout=timeout_seconds  # ⭐ 環境変数から取得
            ):
                yield event

        except asyncio.TimeoutError:
            print(f"  ⚠️ SOLOMON timeout after {timeout_seconds}s")
            # デフォルト判断を返す
            # ...
```

---

### フロントエンド (React)

**`src/hooks/useMAGIStream.ts`**

```typescript
export function useMAGIStream() {
  const invokeMAGI = async (question: string) => {
    // ⭐ 環境変数から読み込み
    const sseTimeoutMs = parseInt(
      process.env.NEXT_PUBLIC_SSE_TIMEOUT_MS || '240000',
      10
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`❌ SSE stream timeout after ${sseTimeoutMs}ms`);
      controller.abort();
    }, sseTimeoutMs);  // ⭐ 環境変数から取得

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AGENTCORE_URL}/api/invocations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        }
      );

      // SSEストリーミング処理
      // ...

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`リクエストがタイムアウトしました（${sseTimeoutMs / 1000}秒）`);
      }

      throw error;
    }
  };

  return { invokeMAGI };
}
```

---

## ✅ バリデーション機能

設定ユーティリティには自動バリデーションが組み込まれています：

### 階層チェック

```
Layer 4 (賢者) < Layer 3 (全体処理) < Layer 2 (プロセス監視) < Layer 1 (フロントエンド)
```

**不正な設定例:**

```bash
MAGI_SAGE_TIMEOUT_SECONDS=200        # Layer 4
MAGI_TOTAL_TIMEOUT_SECONDS=180       # Layer 3 ← エラー！Layer 4より小さい
```

**警告メッセージ:**

```
⚠️ Timeout configuration warnings:
⚠️ MAGI_SAGE_TIMEOUT_SECONDS (200s) should be less than MAGI_TOTAL_TIMEOUT_SECONDS (180s)
These settings may cause unexpected timeout behavior.
```

### 値の検証

- 0以下の値: デフォルト値を使用
- 数値以外: デフォルト値を使用
- 未設定: デフォルト値を使用

---

## 🔍 デバッグ機能

### 設定のログ出力

環境変数 `DEBUG_STREAMING=true` を設定すると、起動時に設定値を出力：

**Next.js Backend:**

```
🕐 Timeout Configuration:
  Layer 2 (Process):      210000ms (210.0s)
  Layer 3 (Total):        180s
  Layer 4 (Sage):         90s
  Layer 5 (SOLOMON):      60s
  Event Queue:            120s
```

**Python:**

```
🕐 Python Timeout Configuration:
  Layer 3 (Total):        180s
  Layer 4 (Sage):         90s
  Layer 5 (SOLOMON):      60s
  Event Queue:            120s
```

---

## 🎯 環境別の推奨設定

### 開発環境（ローカル）

```bash
# 長めに設定してデバッグしやすく
NEXT_PUBLIC_SSE_TIMEOUT_MS=360000          # 6分
AGENTCORE_PROCESS_TIMEOUT_MS=300000        # 5分
MAGI_SAGE_TIMEOUT_SECONDS=150              # 2.5分
MAGI_SOLOMON_TIMEOUT_SECONDS=90            # 1.5分
MAGI_TOTAL_TIMEOUT_SECONDS=270             # 4.5分
```

### ステージング環境

```bash
# デフォルト値を使用
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000          # 4分
AGENTCORE_PROCESS_TIMEOUT_MS=210000        # 3.5分
MAGI_SAGE_TIMEOUT_SECONDS=90               # 1.5分
MAGI_SOLOMON_TIMEOUT_SECONDS=60            # 1分
MAGI_TOTAL_TIMEOUT_SECONDS=180             # 3分
```

### 本番環境

```bash
# 実測値に基づいてチューニング
NEXT_PUBLIC_SSE_TIMEOUT_MS=180000          # 3分
AGENTCORE_PROCESS_TIMEOUT_MS=150000        # 2.5分
MAGI_SAGE_TIMEOUT_SECONDS=60               # 1分
MAGI_SOLOMON_TIMEOUT_SECONDS=45            # 45秒
MAGI_TOTAL_TIMEOUT_SECONDS=120             # 2分
```

---

## 📊 パフォーマンスチューニング

### ステップ1: 現状測定

```bash
# ログから実行時間を収集
grep "Python process exited" logs/*.log | awk '{print $NF}'
```

### ステップ2: 分析

```
平均実行時間: 15秒
p95実行時間: 35秒
p99実行時間: 55秒
最大実行時間: 70秒
```

### ステップ3: タイムアウト設定

```
推奨設定 = p99実行時間 × 1.5 〜 2.0
         = 55秒 × 1.5
         = 82.5秒
         → 90秒に設定
```

---

## 🚀 まとめ

### 実装済み機能

✅ 環境変数からの自動読み込み
✅ デフォルト値によるフォールバック
✅ 階層バリデーション
✅ デバッグログ出力
✅ TypeScript/Python両対応

### 使用方法

1. `.env.local.template` をコピー
2. 必要に応じて値を編集
3. アプリケーション起動時に自動読み込み

### 次のステップ

Phase 1の実装チェックリストに従って、実際のコードに統合しますか？
