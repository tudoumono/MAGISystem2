# AgentCore Runtime - Next.jsバックエンド

**役割**: AgentCore Runtime内のNext.jsバックエンドAPI

このディレクトリは、AgentCore Runtime内でHTTP APIを提供するNext.jsアプリケーションです。Python Strands Agentsとの統合ブリッジとして機能します。

## アーキテクチャ構成

```
agents/backend/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/invocations/   # メインAPI エンドポイント
│   │   ├── api/ping/          # ヘルスチェック
│   │   ├── layout.tsx         # ルートレイアウト
│   │   └── page.tsx           # ホームページ
│   ├── lib/
│   │   ├── config/timeout.ts  # タイムアウト設定
│   │   └── python-bridge.ts   # Python統合ブリッジ
│   └── types/magi.ts          # MAGI型定義
├── package.json               # Node.js依存関係
├── tsconfig.json              # TypeScript設定
└── next.config.js             # Next.js設定
```

## 主要機能

- **HTTP API提供**: ポート8080でAgentCore Runtime標準API
- **Python統合**: `spawn('python', ['magi_agent.py'])` による子プロセス実行
- **ストリーミング対応**: Server-Sent Events (SSE) によるリアルタイム配信
- **エラーハンドリング**: Python実行エラーの適切な処理

## API エンドポイント

### POST /invocations
```typescript
// リクエスト
{
  "question": "ユーザーの質問"
}

// レスポンス (ストリーミング)
data: {"type": "sage_start", "data": {"agent_id": "caspar"}}
data: {"type": "sage_chunk", "data": {"agent_id": "caspar", "chunk": "..."}}
data: {"type": "judge_complete", "data": {"final_decision": "..."}}
```

### GET /ping
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T12:00:00Z"
}
```

## データフロー

```
フロントエンドUI (src/)
    ↓ POST /api/agentcore/invocations
Next.jsバックエンド (agents/backend/)
    ↓ HTTP Request (ポート8080)
POST /invocations エンドポイント
    ↓ spawn('python', ['../magi_agent.py'])
Python Strands Agents
    ↓ ストリーミング応答
SSE形式でフロントエンドに配信
```

## 実装パターン

### Python統合ブリッジ
```typescript
// src/lib/python-bridge.ts
export async function executePythonAgent(question: string) {
  const pythonProcess = spawn('python', ['../magi_agent.py'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // ストリーミング処理
  return new ReadableStream({
    start(controller) {
      pythonProcess.stdout.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
    }
  });
}
```

### API Route実装
```typescript
// src/app/api/invocations/route.ts
export async function POST(request: Request) {
  const { question } = await request.json();
  
  const stream = await executePythonAgent(question);
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

## 開発・テスト

```bash
# 依存関係インストール
npm install

# 開発サーバー起動 (ポート8080)
npm run dev

# ヘルスチェック
curl http://localhost:8080/ping

# API テスト
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"question": "テスト質問"}'
```

## 重要な注意

⚠️ **このNext.jsアプリはAgentCore Runtime専用です**

- フロントエンドUI: `src/` ディレクトリの別Next.jsアプリ
- バックエンドAPI: `agents/backend/` ディレクトリのこのNext.jsアプリ
- 同一Dockerコンテナ内でPython + Node.js統合実行

## 関連ファイル

- `../magi_agent.py` - Strands Agents実装
- `../../src/` - フロントエンドUI
- `../../amplify/` - AWS設定・インフラ定義