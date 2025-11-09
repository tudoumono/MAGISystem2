# アーキテクチャ比較：参考記事 vs MAGI実装

## 📚 概要

このドキュメントは、[参考記事](https://qiita.com/moritalous/items/ea695f8a328585e1313b)の実装とMAGIシステムの実装の違いを明確にするためのものです。

## 🎯 設計方針

### 共通の目的
- **Amplify Hostingのストリーミング制限を回避**
- AgentCore Runtime（Dockerコンテナ）を使用したバックエンド実装
- Server-Sent Events (SSE)によるリアルタイムストリーミング

### MAGI独自の要件
- **既存のPythonエージェントコード（Strands Agents）を活用**
- 3賢者システム（CASPAR/BALTHASAR/MELCHIOR + SOLOMON Judge）
- マルチエージェント並列実行と統合評価

## 🏗️ アーキテクチャ比較

### 参考記事の実装

```
┌─────────────────────────────────────────┐
│   Amplify Hosting (Next.js Frontend)    │
│   - useChat (Vercel AI SDK)             │
└─────────────────────────────────────────┘
              ↓ HTTP POST /invocations
┌─────────────────────────────────────────┐
│ AgentCore Runtime (Dockerコンテナ)      │
│  ┌────────────────────────────────┐    │
│  │ Next.jsバックエンド (port 8080) │    │
│  │ - @ai-sdk/amazon-bedrock       │    │
│  │ - streamText()                 │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
              ↓ AWS SDK
┌─────────────────────────────────────────┐
│      Amazon Bedrock API                 │
│      - Claude / その他のモデル           │
└─────────────────────────────────────────┘
```

**特徴:**
- TypeScript/JavaScriptのみで実装
- `@ai-sdk/amazon-bedrock` を使用
- シンプルで直接的な実装

### MAGI実装

```
┌─────────────────────────────────────────┐
│   Amplify Hosting (Next.js Frontend)    │
│   - useStreamingAgent (カスタムHook)     │
└─────────────────────────────────────────┘
              ↓ HTTP POST /api/invocations
┌─────────────────────────────────────────┐
│ AgentCore Runtime (Dockerコンテナ)      │
│  ┌────────────────────────────────┐    │
│  │ Next.jsバックエンド (port 8080) │    │
│  │ - spawn('python')              │    │
│  └────────────────────────────────┘    │
│              ↓ 標準入出力               │
│  ┌────────────────────────────────┐    │
│  │ Python magi_agent.py           │    │
│  │ - AWS Strands Agents           │    │
│  │ - 3賢者並列実行                 │    │
│  │ - SOLOMON Judge統合            │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
              ↓ boto3 (AWS SDK for Python)
┌─────────────────────────────────────────┐
│      Amazon Bedrock API                 │
│      - Claude 3.5 Sonnet               │
└─────────────────────────────────────────┘
```

**特徴:**
- Next.js + Python のハイブリッド実装
- `spawn()` で子プロセス起動
- AWS Strands Agents を使用
- 既存のPythonコードを活用

## 📊 詳細比較表

| 項目 | 参考記事 | MAGI実装 |
|------|---------|---------|
| **言語** | TypeScript/JavaScript | TypeScript + Python |
| **Bedrock呼び出し** | `@ai-sdk/amazon-bedrock` | `boto3` |
| **Agent Framework** | Vercel AI SDK | AWS Strands Agents |
| **プロセス構成** | 単一プロセス | マルチプロセス（spawn） |
| **コンテナ内容** | Node.js + Next.js | Node.js + Python + Next.js |
| **既存コード活用** | なし | Python エージェント活用 |
| **実装複雑度** | シンプル | 中程度 |

## 🔧 技術的な違い

### 1. Bedrock呼び出し方法

#### 参考記事
```typescript
// backend/app/invocations/route.ts
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { streamText } from 'ai'

const bedrock = createAmazonBedrock({
  region: 'us-west-2',
  credentialProvider: fromNodeProviderChain(),
})

export async function POST(req: Request) {
  const result = streamText({
    model: bedrock('anthropic.claude-3-5-sonnet-20241022-v2:0'),
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
```

#### MAGI実装
```typescript
// agents/backend/app/api/invocations/route.ts
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const pythonProcess = spawn(PYTHON_PATH, [MAGI_SCRIPT_PATH])

      pythonProcess.stdin.write(JSON.stringify(body))
      pythonProcess.stdin.end()

      pythonProcess.stdout.on('data', (data) => {
        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
      })
    }
  })

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

```python
# agents/magi_agent.py
from strands_agents import Agent

async def main():
    input_data = sys.stdin.read()
    payload = json.loads(input_data)

    # Strands Agentsで3賢者実行
    magi_strands = MAGIStrandsAgent()
    async for event in magi_strands.process_decision_stream(payload):
        print(json.dumps(event), flush=True)
```

### 2. Dockerfile構成

#### 参考記事（推測）
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

#### MAGI実装
```dockerfile
FROM ubuntu:22.04
WORKDIR /app

# Node.js + Python インストール
RUN apt-get update && apt-get install -y \
    nodejs npm python3.11 python3-pip

# Python依存関係
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Pythonエージェント
COPY magi_agent.py ./

# Next.jsバックエンド
COPY backend/ ./backend/
RUN cd backend && npm ci && npm run build

EXPOSE 8080
CMD ["npm", "start"]
```

## 🎯 選択理由

### 参考記事の実装を選ぶ場合
- TypeScript/JavaScriptのみで実装したい
- シンプルな構成を維持したい
- Vercel AI SDKの機能を活用したい
- 新規プロジェクトで既存コードがない

### MAGI実装を選ぶ場合
- **既存のPythonエージェントコードがある**（✅ MAGI）
- AWS Strands Agentsの高度な機能を使いたい
- マルチエージェントシステムを実装したい
- Python エコシステムを活用したい

## ⚠️ 重要な注意点

### MAGI実装の追加考慮事項

1. **複雑性の増加**
   - Node.js + Python の両方のランタイム管理
   - プロセス間通信の実装とエラーハンドリング
   - Dockerイメージサイズの増加

2. **メリット**
   - 既存のPythonコードを再利用
   - Strands Agentsの強力な機能
   - Pythonエコシステムの活用

3. **トレードオフ**
   - 参考記事: シンプル、軽量、TypeScriptのみ
   - MAGI実装: 複雑、重い、既存資産活用

## 📚 参考資料

- [参考記事: Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- [参考記事のGitHubリポジトリ](https://github.com/moritalous/agentcore-amplify-nextjs)
- [AWS Strands Agents](https://strandsagents.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/)

## 🔄 まとめ

MAGIシステムは、参考記事の**コンセプト**（AgentCore Runtime、/invocationsエンドポイント、Dockerコンテナ）を採用しつつ、**独自の拡張**（spawn()によるPython統合、Strands Agents使用）を追加した実装です。

これにより、Amplify Hostingのストリーミング制限を回避しながら、既存のPythonエージェントコードを活用することができます。

---

**更新日**: 2025-11-09
**バージョン**: 1.0
