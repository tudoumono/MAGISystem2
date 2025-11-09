# JavaScript/TypeScript での AgentCore Runtime 実装ガイド

## 🎯 重要な修正（2025-11-10）

**以前の誤った情報を訂正します：**

❌ **誤り**: `BedrockAgentRuntimeClient`は使えない、手動でSigV4署名が必要  
✅ **正しい**: `@aws-sdk/client-bedrock-agentcore`パッケージが存在し、公式サポートされています

## 📦 利用可能なパッケージ

### @aws-sdk/client-bedrock-agentcore

- **バージョン**: v3.927.0（2025-11-07更新）
- **npm**: https://www.npmjs.com/package/@aws-sdk/client-bedrock-agentcore
- **GitHub**: https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-bedrock-agentcore
- **ライセンス**: Apache-2.0
- **メンテナ**: AWS SDK Bot（公式）

```bash
npm install @aws-sdk/client-bedrock-agentcore
```

## 🔧 実装パターン比較

### パターンA: AWS SDK直接呼び出し（✅ 推奨）

**メリット:**
- ✅ TypeScript/JavaScriptのみで完結
- ✅ AWS公式SDKのメンテナンス保証
- ✅ ストリーミング対応がネイティブ
- ✅ 型安全性（TypeScript完全対応）
- ✅ エラーハンドリングが標準化
- ✅ 長期的な保守性が高い

**デメリット:**
- ⚠️ AWS公式ドキュメントにJavaScript例が少ない（Python例のみ）
- ⚠️ 新しいパッケージのため、コミュニティ情報が少ない

### パターンB: Python Proxyパターン（Phase 2実装）

**メリット:**
- ✅ Phase 2で検証済み（11.96秒、383イベント）
- ✅ Python側のboto3実装がそのまま使える
- ✅ 認証情報の管理が一元化
- ✅ 豊富なPythonエコシステム

**デメリット:**
- ❌ Pythonプロセスのオーバーヘッド
- ❌ プロセス間通信の複雑さ
- ❌ デバッグの難しさ
- ❌ 言語混在による保守コスト

## 💻 実装例

### パターンA: AWS SDK直接実装

#### 1. パッケージインストール

```bash
npm install @aws-sdk/client-bedrock-agentcore
```

#### 2. Next.js API Route実装

```typescript
// app/api/invoke/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  BedrockAgentCoreClient, 
  InvokeAgentRuntimeCommand 
} from '@aws-sdk/client-bedrock-agentcore';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    // 1. BedrockAgentCoreClientの初期化
    const client = new BedrockAgentCoreClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN
      }
    });
    
    // 2. セッションID生成（33文字以上必要）
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    // 3. ペイロード準備
    const payload = JSON.stringify({ question });
    
    // 4. InvokeAgentRuntimeCommandの実行
    const command = new InvokeAgentRuntimeCommand({
      agentRuntimeArn: process.env.MAGI_AGENT_ARN!,
      runtimeSessionId: sessionId,
      payload: new TextEncoder().encode(payload)
    });
    
    const response = await client.send(command);
    
    // 5. Server-Sent Eventsでストリーミング
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // response.responseはAsyncIterableStream
          if (response.response) {
            for await (const event of response.response) {
              // イベントをSSE形式で送信
              const sseData = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseData));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          const errorEvent = {
            type: 'error',
            data: { 
              error: error instanceof Error ? error.message : 'Unknown error',
              code: 'STREAM_PROCESSING_ERROR'
            }
          };
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
          controller.close();
        }
      }
    });
    
    // 6. SSEレスポンスを返す
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// CORS対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

#### 3. フロントエンド統合（useChat）

```typescript
// hooks/useMAGIChat.ts
import { useChat } from 'ai/react';

export function useMAGIChat() {
  const { messages, append, isLoading, error } = useChat({
    api: '/api/invoke',
    onError: (error) => {
      console.error('MAGI Chat Error:', error);
    },
    onFinish: (message) => {
      console.log('MAGI Decision Complete:', message);
    }
  });
  
  return { messages, append, isLoading, error };
}
```

```typescript
// components/MAGIChat.tsx
'use client';

import { useMAGIChat } from '@/hooks/useMAGIChat';

export function MAGIChat() {
  const { messages, append, isLoading } = useMAGIChat();
  
  const handleSubmit = async (question: string) => {
    await append({
      role: 'user',
      content: question
    });
  };
  
  return (
    <div>
      {messages.map((message, i) => (
        <div key={i}>
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}
      
      <button 
        onClick={() => handleSubmit('新しいAIシステムを導入すべきか？')}
        disabled={isLoading}
      >
        {isLoading ? '処理中...' : 'MAGI決定を実行'}
      </button>
    </div>
  );
}
```

### パターンB: Python Proxyパターン（Phase 2実装）

Phase 2で動作確認済みの実装を継続使用する場合：

```typescript
// app/api/invocations/route.ts（既存実装）
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const stream = new ReadableStream({
    start(controller) {
      // Pythonプロセスを起動
      const pythonProcess = spawn('python', ['magi_agent.py'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // 入力データを送信
      pythonProcess.stdin.write(JSON.stringify(body));
      pythonProcess.stdin.end();
      
      // 標準出力を処理
      pythonProcess.stdout.on('data', (data) => {
        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
      });
      
      pythonProcess.on('close', () => {
        controller.close();
      });
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## 📊 実装パターン比較表

| 項目 | AWS SDK直接 | HTTP + SigV4 | Python Proxy |
|------|------------|--------------|--------------|
| 実装の簡潔さ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| パフォーマンス | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 保守性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 既存資産活用 | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| エコシステム | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 型安全性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| デバッグ容易性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

## 🎯 推奨実装戦略

### 新規実装の場合

**AWS SDK直接呼び出し（パターンA）を強く推奨**

理由：
- TypeScript/JavaScriptのみで完結
- AWS公式SDKのメンテナンス保証
- 長期的な保守性とパフォーマンス
- 型安全性による開発効率向上

### Phase 2からの移行の場合

**段階的移行を推奨**

1. **Phase 2.5**: Python実装を一旦そのまま使用
2. **Phase 3**: TypeScript実装を並行構築
3. **Phase 4**: 動作確認後に切り替え
4. **Phase 5**: Python依存を完全削除

## 🔐 セキュリティ考慮事項

### 認証情報の管理

```typescript
// ❌ 悪い例：フロントエンドで直接呼び出し
// クライアント側でAWS認証情報を露出してしまう
const client = new BedrockAgentCoreClient({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: 'AKIA...', // 危険！
    secretAccessKey: 'xxx'  // 危険！
  }
});

// ✅ 良い例：Next.jsバックエンドで呼び出し
// app/api/invoke/route.ts（サーバーサイド）
const client = new BedrockAgentCoreClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});
```

### 推奨アーキテクチャ

```
フロントエンド (Next.js Client)
    ↓ useChat() → HTTP POST /api/invoke
Next.jsバックエンド (API Route) ← 認証・認可層
    ↓ BedrockAgentCoreClient
AgentCore Runtime (AWS)
    ↓
Python magi_agent.py
    ↓
3賢者 + SOLOMON Judge
```

**メリット：**
- ✅ AWS認証情報をフロントエンドに露出しない
- ✅ セッション管理の一元化
- ✅ レート制限・認可の実装が容易
- ✅ 監査ログの一元管理

## 📚 参考資料

### AWS公式ドキュメント
- [Invoke an AgentCore Runtime agent](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-invoke-agent.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

### npmパッケージ
- [@aws-sdk/client-bedrock-agentcore](https://www.npmjs.com/package/@aws-sdk/client-bedrock-agentcore)
- [GitHub Repository](https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-bedrock-agentcore)

### Phase 2動作確認
- `agents/tests/test_magi2.py` - HTTP POST版テスト（動作確認済み）
- `agents/backend/app/api/invocations/route.ts` - Python Proxy実装（動作確認済み）
- `agents/PHASE2_BASELINE_COMPLETE.md` - Phase 2完了ドキュメント

## 🚀 次のステップ

### Phase 3: TypeScript実装への移行

1. **パッケージインストール**
   ```bash
   cd agents/backend
   npm install @aws-sdk/client-bedrock-agentcore
   ```

2. **新しいAPI Route作成**
   ```bash
   # 既存のPython Proxy実装を保持
   agents/backend/app/api/invocations/route.ts（既存）
   
   # 新しいTypeScript実装を追加
   agents/backend/app/api/invoke-ts/route.ts（新規）
   ```

3. **並行テスト**
   - Python Proxy版: `/api/invocations`
   - TypeScript版: `/api/invoke-ts`
   - 両方の動作を比較検証

4. **切り替え**
   - TypeScript版の動作確認完了後
   - `/api/invocations`をTypeScript実装に置き換え
   - Python依存を段階的に削除

5. **最終クリーンアップ**
   - Python関連ファイルの削除
   - ドキュメントの更新
   - デプロイ設定の簡素化
