# Bedrock AgentCore Runtime統合 TODO

## 現在の状況
- ✅ モックデータで3賢者とSOLOMON Judgeの動作を実装済み
- ✅ フロントエンドUIは完成
- ✅ データモデル（Conversation, Message, TraceStep）は実装済み
- ❌ 実際のBedrock AgentCore Runtime統合は未実装

## 統合に必要な作業

### 1. AgentCore Runtimeのデプロイ

#### Python Agentsのデプロイ
```bash
# agents/ディレクトリに移動
cd agents

# AgentCore Runtimeにデプロイ
# （具体的なコマンドは環境に応じて調整）
```

**必要なファイル**:
- `agents/magi_agent.py` - メインエージェント
- `agents/caspar/` - CASPAR エージェント
- `agents/balthasar/` - BALTHASAR エージェント
- `agents/melchior/` - MELCHIOR エージェント
- `agents/solomon/` - SOLOMON Judge

### 2. API Routeの実装

#### `/api/bedrock-agents/execute/route.ts`の修正

```typescript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

// Bedrock Clientの初期化
const bedrockClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 認証チェック
    // ...
    
    // 実際のBedrock AgentCore Runtime呼び出し
    const command = new InvokeAgentCommand({
      agentId: process.env.MAGI_AGENT_ID,
      agentAliasId: process.env.MAGI_AGENT_ALIAS_ID,
      sessionId: body.sessionId || generateSessionId(),
      inputText: body.question,
      enableTrace: true,
    });
    
    const response = await bedrockClient.send(command);
    
    // ストリーミングレスポンスの処理
    let fullResponse = '';
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          fullResponse += text;
        }
      }
    }
    
    // レスポンスの解析と返却
    const parsedResponse = JSON.parse(fullResponse);
    return NextResponse.json(parsedResponse);
    
  } catch (error) {
    console.error('Bedrock API Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message
    }, { status: 500 });
  }
}
```

### 3. ストリーミング対応

#### `/api/magi/stream/route.ts`の実装

```typescript
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        
        const command = new InvokeAgentCommand({
          agentId: process.env.MAGI_AGENT_ID,
          agentAliasId: process.env.MAGI_AGENT_ALIAS_ID,
          sessionId: body.sessionId,
          inputText: body.question,
          enableTrace: true,
        });
        
        const response = await bedrockClient.send(command);
        
        // ストリーミングレスポンスをリアルタイムに送信
        if (response.completion) {
          for await (const chunk of response.completion) {
            if (chunk.chunk?.bytes) {
              const text = new TextDecoder().decode(chunk.chunk.bytes);
              
              // Server-Sent Events形式で送信
              const data = `data: ${JSON.stringify({
                type: 'chunk',
                content: text,
                timestamp: new Date().toISOString()
              })}\n\n`;
              
              controller.enqueue(encoder.encode(data));
            }
          }
        }
        
        // 完了通知
        const completeData = `data: ${JSON.stringify({
          type: 'complete',
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        controller.enqueue(encoder.encode(completeData));
        controller.close();
        
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 4. 環境変数の設定

`.env.local`に以下を追加：

```bash
# Bedrock AgentCore Runtime
MAGI_AGENT_ID=magi_agent-4ORNam2cHb
MAGI_AGENT_ALIAS_ID=TSTALIASID
AWS_REGION=ap-northeast-1

# 開発環境でモックを無効化
USE_MOCK_DATA=false
```

### 5. IAM権限の設定

Lambda実行ロール（Amplify Hostingが自動作成）に以下の権限を追加：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent",
        "bedrock:InvokeAgentWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:ap-northeast-1:*:agent/*",
        "arn:aws:bedrock:ap-northeast-1:*:agent-alias/*"
      ]
    }
  ]
}
```

### 6. テスト

#### ローカルテスト
```bash
# モックデータでテスト
npm run dev

# ブラウザで http://localhost:3000/test/integration/magi-stream にアクセス
```

#### 本番環境テスト
```bash
# Amplifyにデプロイ
git push origin main

# デプロイ後、実際のBedrock AgentCore Runtimeを呼び出し
```

## 段階的な移行計画

### Phase 1: モックデータ（現在）
- ✅ UIとデータフローの確認
- ✅ フロントエンドの動作確認
- ✅ ユーザー体験の検証

### Phase 2: Bedrock統合（次のステップ）
- ❌ AgentCore Runtimeのデプロイ
- ❌ API Routeの実装
- ❌ IAM権限の設定
- ❌ 統合テスト

### Phase 3: ストリーミング対応
- ❌ リアルタイムストリーミングの実装
- ❌ トレース情報の表示
- ❌ エラーハンドリングの強化

### Phase 4: 本番運用
- ❌ パフォーマンス最適化
- ❌ モニタリングとログ
- ❌ セキュリティ強化

## 参考資料
- [AWS Bedrock AgentCore Runtime Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-runtime.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
