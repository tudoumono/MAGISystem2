# 推奨アーキテクチャ：ストリーミング対応版

## 構成変更の詳細

### 変更しないもの（継続使用）
- ✅ **Amplify Hosting**: フロントエンドデプロイ
- ✅ **Amplify Data**: DynamoDB + AppSync
- ✅ **Amplify Auth**: Cognito認証
- ✅ **既存UI**: React コンポーネント
- ✅ **既存デザイン**: MAGIシステムUI

### 変更するもの（ストリーミング対応）
- ❌ **Amplify defineFunction**: Lambda関数（ストリーミング不可）
- ✅ **Next.js API Routes**: ストリーミング対応API

## 新しいアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                 Amplify Hosting                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Next.js Frontend                     │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │         既存UIコンポーネント            │   │   │
│  │  │  - AgentPanel.tsx                      │   │   │
│  │  │  - ConversationList.tsx                │   │   │
│  │  │  - MessageDisplay.tsx                  │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │                    ↓                           │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │      Next.js API Routes                │   │   │
│  │  │  app/api/magi/stream/route.ts          │   │   │
│  │  │  ↓ Server-Sent Events                  │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                 AWS Services                            │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ Amplify Data    │  │      Amazon Bedrock         │   │
│  │ - DynamoDB      │  │  ┌─────────────────────┐   │   │
│  │ - AppSync       │  │  │ Claude 3 Sonnet     │   │   │
│  │ - リアルタイム  │  │  │ (CASPAR)            │   │   │
│  └─────────────────┘  │  └─────────────────────┘   │   │
│                       │  ┌─────────────────────┐   │   │
│  ┌─────────────────┐  │  │ Claude 3 Sonnet     │   │   │
│  │ Amplify Auth    │  │  │ (BALTHASAR)         │   │   │
│  │ - Cognito       │  │  └─────────────────────┘   │   │
│  │ - 認証・認可    │  │  ┌─────────────────────┐   │   │
│  └─────────────────┘  │  │ Claude 3 Sonnet     │   │   │
│                       │  │ (MELCHIOR)          │   │   │
│                       │  └─────────────────────┘   │   │
│                       │  ┌─────────────────────┐   │   │
│                       │  │ Claude 3 Opus       │   │   │
│                       │  │ (SOLOMON)           │   │   │
│                       │  └─────────────────────┘   │   │
│                       └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 実装の詳細

### 1. フロントエンド（変更なし）
```typescript
// 既存のUIコンポーネントをそのまま使用
// src/components/agents/AgentPanel.tsx
// src/components/conversation/ConversationList.tsx
// src/components/messages/MessageDisplay.tsx

// APIエンドポイントのみ変更
const response = await fetch('/api/magi/stream', {
  method: 'POST',
  body: JSON.stringify({ message: userMessage }),
});
```

### 2. API Routes（新規実装）
```typescript
// app/api/magi/stream/route.ts
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

export async function POST(request: Request) {
  const { message } = await request.json();
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // CASPAR（保守的分析）
        await streamAgent(controller, encoder, 'CASPAR', message, casparPrompt);
        
        // BALTHASAR（革新的分析）
        await streamAgent(controller, encoder, 'BALTHASAR', message, balthasarPrompt);
        
        // MELCHIOR（バランス分析）
        await streamAgent(controller, encoder, 'MELCHIOR', message, melchiorPrompt);
        
        // SOLOMON（統合判断）
        await streamAgent(controller, encoder, 'SOLOMON', message, solomonPrompt);
        
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

async function streamAgent(controller, encoder, agentName, message, prompt) {
  const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
  
  const command = new InvokeModelWithResponseStreamCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1500,
      messages: [{ role: 'user', content: `${prompt}\n\n質問: ${message}` }]
    })
  });
  
  const response = await bedrock.send(command);
  
  // ストリーミングレスポンスの処理
  for await (const chunk of response.body) {
    if (chunk.chunk?.bytes) {
      const text = new TextDecoder().decode(chunk.chunk.bytes);
      const data = JSON.parse(text);
      
      if (data.delta?.text) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          agent: agentName,
          content: data.delta.text,
          type: 'stream'
        })}\n\n`));
      }
    }
  }
  
  // エージェント完了通知
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    agent: agentName,
    type: 'complete'
  })}\n\n`));
}
```

### 3. データ保存（変更なし）
```typescript
// 既存のAmplify Dataをそのまま使用
// src/lib/amplify/data.ts

// 会話履歴の保存
await client.models.Conversation.create({
  title: conversationTitle,
  userId: user.userId,
});

await client.models.Message.create({
  conversationId: conversation.id,
  content: userMessage,
  role: 'user',
});
```

## メリット

### 1. 既存資産の活用
- ✅ **UI/UXそのまま**: 既存のReactコンポーネント
- ✅ **デザインシステム**: MAGIテーマ継続
- ✅ **認証システム**: Amplify Auth継続
- ✅ **データベース**: DynamoDB + AppSync継続

### 2. ストリーミング対応
- ✅ **リアルタイム表示**: エージェント回答の段階的表示
- ✅ **UX向上**: 待機時間の大幅短縮
- ✅ **競合優位**: ChatGPT並みの体験

### 3. 実装・運用の簡素化
- ✅ **デバッグ容易**: シンプルなAPI Routes
- ✅ **学習効果**: ストリーミングの仕組み理解
- ✅ **コスト削減**: 中間層排除

## 移行手順

### Phase 1: API Routes実装
1. `app/api/magi/stream/route.ts` 作成
2. Bedrock直接呼び出し実装
3. ストリーミングレスポンス実装

### Phase 2: フロントエンド調整
1. 既存UIのAPIエンドポイント変更
2. Server-Sent Events受信実装
3. ストリーミング表示の調整

### Phase 3: 既存Lambda削除
1. `amplify/functions/` 削除
2. 不要な設定ファイル削除
3. `amplify/backend.ts` 調整

## 結論

この構成により：
- **Amplifyの利点**（ホスティング、認証、データ）を維持
- **ストリーミング問題**を完全解決
- **実装の簡素化**と学習効果向上
- **コスト効率**の大幅改善

が実現できます。