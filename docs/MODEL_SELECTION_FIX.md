# モデル選択機能の修正ガイド

## 現状の問題

### 1. Lambda関数側
- `handler.ts`でモデルIDがハードコード
- ユーザー選択が反映されない
- 環境変数でのみ切り替え可能

### 2. フロントエンド側
- UI上でモデル選択可能
- しかし選択結果がLambdaに渡されていない

### 3. モデルリスト
- 古いモデルのみ（Claude 3系）
- 最新モデル（Claude 4系、Nova系）が未対応

---

## 修正手順

### ステップ1: 型定義の更新

`src/types/agent-preset.ts`を更新して最新モデルを追加：

```typescript
export type BedrockModel = 
  // Claude 4系（最新）
  | 'anthropic.claude-opus-4-1-20250805-v1:0'
  | 'anthropic.claude-sonnet-4-20250514-v1:0'
  | 'anthropic.claude-sonnet-4-5-20250929-v1:0'
  | 'anthropic.claude-haiku-4-5-20251001-v1:0'
  | 'anthropic.claude-3-7-sonnet-20250219-v1:0'
  // Claude 3.5系
  | 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  | 'anthropic.claude-3-5-sonnet-20240620-v1:0'
  | 'anthropic.claude-3-5-haiku-20241022-v1:0'
  // Claude 3系
  | 'anthropic.claude-3-opus-20240229-v1:0'
  | 'anthropic.claude-3-sonnet-20240229-v1:0'
  | 'anthropic.claude-3-haiku-20240307-v1:0'
  // Amazon Nova系
  | 'amazon.nova-premier-v1:0'
  | 'amazon.nova-pro-v1:0'
  | 'amazon.nova-lite-v1:0'
  | 'amazon.nova-micro-v1:0'
  // Meta Llama系
  | 'meta.llama4-scout-17b-instruct-v1:0'
  | 'meta.llama3-3-70b-instruct-v1:0'
  | 'meta.llama3-2-90b-instruct-v1:0'
  // その他
  | 'deepseek.r1-v1:0'
  | 'cohere.command-r-plus-v1:0'
  | 'mistral.pixtral-large-2502-v1:0';

export const AVAILABLE_MODELS: Array<{ 
  value: BedrockModel; 
  label: string; 
  description: string;
  provider: string;
  tier: 'premium' | 'standard' | 'economy';
}> = [
  // Claude 4系
  {
    value: 'anthropic.claude-opus-4-1-20250805-v1:0',
    label: 'Claude Opus 4.1',
    description: '最高性能。複雑な推論に最適',
    provider: 'Anthropic',
    tier: 'premium',
  },
  {
    value: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
    label: 'Claude Sonnet 4.5',
    description: '高速かつ高品質。推奨',
    provider: 'Anthropic',
    tier: 'standard',
  },
  {
    value: 'anthropic.claude-haiku-4-5-20251001-v1:0',
    label: 'Claude Haiku 4.5',
    description: '高速・低コスト',
    provider: 'Anthropic',
    tier: 'economy',
  },
  // Amazon Nova系
  {
    value: 'amazon.nova-premier-v1:0',
    label: 'Nova Premier',
    description: 'マルチモーダル最高性能',
    provider: 'Amazon',
    tier: 'premium',
  },
  {
    value: 'amazon.nova-pro-v1:0',
    label: 'Nova Pro',
    description: 'マルチモーダル・バランス型',
    provider: 'Amazon',
    tier: 'standard',
  },
  {
    value: 'amazon.nova-lite-v1:0',
    label: 'Nova Lite',
    description: 'マルチモーダル・軽量',
    provider: 'Amazon',
    tier: 'economy',
  },
  // ... 他のモデル
];
```

### ステップ2: リクエストペイロードの拡張

Lambda関数にモデル情報を渡すため、リクエストボディを拡張：

```typescript
// src/types/magi-request.ts
export interface MAGIRequest {
  question: string;
  agentConfigs?: {
    caspar?: {
      model: BedrockModel;
      temperature: number;
      maxTokens: number;
      topP: number;
      systemPrompt: string;
    };
    balthasar?: { /* 同様 */ };
    melchior?: { /* 同様 */ };
    solomon?: { /* 同様 */ };
  };
}
```

### ステップ3: Lambda関数の修正

`amplify/functions/magi-python-agents/handler.ts`を修正：

```typescript
// モデルIDをハードコードから動的取得に変更
async function consultAgent(
  agent: AgentConfig,
  question: string,
  stream: any,
  customConfig?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    systemPrompt?: string;
  }
): Promise<any> {
  console.log(`Consulting ${agent.name}...`);

  // カスタム設定があればそれを使用、なければデフォルト
  const modelId = customConfig?.model || MODEL_ID;
  const temperature = customConfig?.temperature ?? 0.7;
  const maxTokens = customConfig?.maxTokens ?? 1000;
  const topP = customConfig?.topP ?? 0.9;
  const systemPrompt = customConfig?.systemPrompt || agent.systemPrompt;

  console.log(`Using model: ${modelId} for ${agent.name}`);

  // エージェント開始イベント
  sendEvent(stream, 'agent_start', agent.id, {
    name: agent.name,
    type: agent.type,
    model: modelId, // モデル情報を追加
  });

  const startTime = Date.now();

  try {
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: modelId, // 動的に設定
      contentType: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: question }],
          },
        ],
      }),
    });

    // ... 残りの処理
  }
}

// メインハンドラーでカスタム設定を受け取る
export const handler = awslambda.streamifyResponse(
  async (event: any, responseStream: any, _context: Context) => {
    // ... 初期化処理

    // リクエストボディからカスタム設定を取得
    const agentConfigs = body.agentConfigs || {};

    // 3賢者を並列実行（カスタム設定を渡す）
    const agentPromises = AGENT_CONFIGS.map((agent) =>
      consultAgent(
        agent, 
        question, 
        httpStream,
        agentConfigs[agent.id] // カスタム設定を渡す
      )
    );
    
    // ... 残りの処理
  }
);
```

### ステップ4: フロントエンドからの送信

チャットインターフェースでプリセット設定を送信：

```typescript
// src/components/chat/ChatInterface.tsx
const sendMessage = async (message: string) => {
  // 現在のプリセット設定を取得
  const currentPreset = await getCurrentPreset();
  
  // Lambda関数に送信
  const response = await fetch('/api/magi-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: message,
      agentConfigs: {
        caspar: {
          model: currentPreset.configs.caspar.model,
          temperature: currentPreset.configs.caspar.temperature,
          maxTokens: currentPreset.configs.caspar.maxTokens,
          topP: currentPreset.configs.caspar.topP,
          systemPrompt: currentPreset.configs.caspar.systemPrompt,
        },
        balthasar: { /* 同様 */ },
        melchior: { /* 同様 */ },
        solomon: { /* 同様 */ },
      },
    }),
  });
};
```

### ステップ5: デフォルトプリセットの更新

推奨モデルに更新：

```typescript
export const DEFAULT_MAGI_PRESET: AgentPresetConfig = {
  name: 'MAGI標準設定（最新）',
  description: '最新モデルを使用した推奨設定',
  isDefault: true,
  isPublic: true,
  configs: {
    caspar: {
      // ... 他の設定
      model: 'anthropic.claude-3-7-sonnet-20250219-v1:0', // 保守的
      temperature: 0.3,
    },
    balthasar: {
      // ... 他の設定
      model: 'amazon.nova-pro-v1:0', // 革新的・マルチモーダル
      temperature: 0.7,
    },
    melchior: {
      // ... 他の設定
      model: 'anthropic.claude-sonnet-4-5-20250929-v1:0', // バランス型
      temperature: 0.5,
    },
    solomon: {
      // ... 他の設定
      model: 'anthropic.claude-opus-4-1-20250805-v1:0', // 最高性能
      temperature: 0.4,
    },
  },
};
```

---

## プリセット例

### 高速・低コスト構成
```typescript
{
  caspar: { model: 'anthropic.claude-3-5-haiku-20241022-v1:0' },
  balthasar: { model: 'amazon.nova-lite-v1:0' },
  melchior: { model: 'anthropic.claude-haiku-4-5-20251001-v1:0' },
  solomon: { model: 'anthropic.claude-3-7-sonnet-20250219-v1:0' },
}
```

### 最高品質構成
```typescript
{
  caspar: { model: 'anthropic.claude-opus-4-1-20250805-v1:0' },
  balthasar: { model: 'amazon.nova-premier-v1:0' },
  melchior: { model: 'anthropic.claude-sonnet-4-5-20250929-v1:0' },
  solomon: { model: 'anthropic.claude-opus-4-1-20250805-v1:0' },
}
```

### 実験的構成
```typescript
{
  caspar: { model: 'cohere.command-r-plus-v1:0' }, // RAG特化
  balthasar: { model: 'deepseek.r1-v1:0' }, // 推論特化
  melchior: { model: 'meta.llama3-3-70b-instruct-v1:0' }, // オープンソース
  solomon: { model: 'anthropic.claude-opus-4-1-20250805-v1:0' },
}
```

---

## テスト手順

1. **型定義の更新**: `agent-preset.ts`を更新
2. **Lambda関数の修正**: `handler.ts`を修正
3. **デプロイ**: `npx ampx sandbox`で再デプロイ
4. **UI確認**: 設定画面でモデル選択が表示されるか確認
5. **動作確認**: 実際にメッセージを送信してモデルが切り替わるか確認
6. **ログ確認**: CloudWatch Logsで使用モデルを確認

---

## 注意事項

### 1. モデルアクセス権限
新しいモデルを使用する前に、AWS Bedrockコンソールで**モデルアクセス**を有効化する必要があります。

### 2. リージョン対応
一部のモデルは特定リージョンでのみ利用可能です：
- `us-east-1`: 全モデル対応
- `ap-northeast-1`: 一部モデルのみ

### 3. コスト管理
高性能モデル（Opus 4.1、Nova Premier）は高コストです。
- 開発環境: Economy tier推奨
- 本番環境: Standard tier推奨
- プレミアム: Premium tier

### 4. エラーハンドリング
モデルが利用不可の場合のフォールバック処理を実装：

```typescript
try {
  const response = await bedrockClient.send(command);
  // ...
} catch (error) {
  if (error.name === 'ValidationException') {
    // モデルが利用不可 → フォールバック
    console.warn(`Model ${modelId} not available, falling back to default`);
    return consultAgent(agent, question, stream, {
      ...customConfig,
      model: TEST_MODEL, // デフォルトモデルにフォールバック
    });
  }
  throw error;
}
```

---

## まとめ

この修正により：
- ✅ ユーザーがUIでモデルを選択可能
- ✅ 各エージェントに異なるモデルを割り当て可能
- ✅ 最新モデル（Claude 4系、Nova系）に対応
- ✅ プリセット機能で簡単に切り替え可能
- ✅ コスト最適化が容易

実装優先度：
1. **高**: Lambda関数の修正（ユーザー選択を反映）
2. **中**: 型定義の更新（最新モデル追加）
3. **低**: プリセット例の追加（ユーザー利便性向上）
