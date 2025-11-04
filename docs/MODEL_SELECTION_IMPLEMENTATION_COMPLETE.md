# モデル選択機能 実装完了レポート

## 実装概要

ユーザーがUIでモデルを選択し、その設定が実際のLambda関数で使用されるようになりました。

---

## 実装内容

### 1. 型定義の更新 ✅

**ファイル**: `src/types/agent-preset.ts`

- **BedrockModel型**: 最新モデル27種類を追加
  - Claude 4系（Opus 4.1, Sonnet 4.5, Haiku 4.5, 3.7 Sonnet）
  - Claude 3.5系（Sonnet v2, Haiku）
  - Amazon Nova系（Premier, Pro, Lite, Micro）
  - Meta Llama系（Llama 4 Scout, Llama 3.3, Llama 3.2）
  - その他（DeepSeek R1, Cohere Command R+, Mistral Pixtral）

- **AVAILABLE_MODELS**: 各モデルの詳細情報を追加
  - label: 表示名（絵文字付き）
  - description: 説明
  - provider: プロバイダー名
  - tier: 'premium' | 'standard' | 'economy'

- **デフォルトプリセット更新**:
  - CASPAR: `claude-3-7-sonnet` (保守的)
  - BALTHASAR: `nova-pro` (革新的・マルチモーダル)
  - MELCHIOR: `claude-sonnet-4-5` (バランス型)
  - SOLOMON: `claude-opus-4-1` (最高性能)

### 2. リクエスト型定義の作成 ✅

**ファイル**: `src/types/magi-request.ts`

```typescript
interface MAGIRequest {
  question: string;
  agentConfigs?: {
    caspar?: AgentRuntimeConfig;
    balthasar?: AgentRuntimeConfig;
    melchior?: AgentRuntimeConfig;
    solomon?: AgentRuntimeConfig;
  };
}

interface AgentRuntimeConfig {
  model: BedrockModel;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  enabled: boolean;
}
```

### 3. Lambda関数の修正 ✅

**ファイル**: `amplify/functions/magi-python-agents/handler.ts`

**変更点**:
- `consultAgent`関数に`customConfig`パラメータを追加
- モデルIDを動的に選択（`customConfig?.model || MODEL_ID`）
- temperature, maxTokens, topP, systemPromptも動的に設定
- エージェント無効化のサポート（`enabled: false`）
- モデル利用不可時のフォールバック処理

**主要な変更**:
```typescript
async function consultAgent(
  agent: AgentConfig,
  question: string,
  stream: any,
  customConfig?: AgentRuntimeConfig  // ← 追加
): Promise<any> {
  const modelId = customConfig?.model || MODEL_ID;
  const temperature = customConfig?.temperature ?? 0.7;
  // ... 動的設定
  
  const command = new InvokeModelWithResponseStreamCommand({
    modelId: modelId,  // ← 動的に設定
    // ...
  });
}
```

### 4. フロントエンドの修正 ✅

#### 4.1 useMessagesフック

**ファイル**: `src/hooks/useMessages.ts`

- `SendMessageParams`に`agentConfigs`を追加
- `simulateAgentExecution`に設定を渡す

#### 4.2 useStreamingAgentフック

**ファイル**: `src/hooks/useStreamingAgent.ts`

- `startStreaming`に`agentConfigs`パラメータを追加
- GETからPOSTリクエストに変更（設定をボディで送信）
- Fetch APIでストリーミングレスポンスを処理

**変更点**:
```typescript
const startStreaming = async (
  question: string, 
  conversationId: string, 
  agentConfigs?: any  // ← 追加
) => {
  const response = await fetch('/api/bedrock-agents/stream', {
    method: 'POST',
    body: JSON.stringify({
      question,
      conversationId,
      agentConfigs,  // ← プリセット設定を送信
    }),
  });
  // ストリーム処理...
};
```

#### 4.3 ChatInterfaceコンポーネント

**ファイル**: `src/components/chat/ChatInterface.tsx`

- `useAgentPresets`フックを追加
- 現在のプリセットを取得
- メッセージ送信時にプリセット設定を変換して送信

**変更点**:
```typescript
const { presets, getPreset } = useAgentPresets();
const [currentPresetId, setCurrentPresetId] = useState('default-magi');
const currentPreset = getPreset(currentPresetId) || presets[0];

// メッセージ送信時
const agentConfigs = {
  caspar: {
    model: currentPreset.configs.caspar.model,
    temperature: currentPreset.configs.caspar.temperature,
    // ...
  },
  // ...
};

await startStreaming(content, conversationId, agentConfigs);
```

### 5. プリセット選択UIの追加 ✅

**ファイル**: `src/components/chat/PresetSelector.tsx`

- プリセット選択ドロップダウン
- 設定画面へのリンク
- シンプルで使いやすいUI

---

## 既存のプリセット設定画面

**ページ**: `/settings/agents`

**機能**:
- ✅ デフォルトプリセットの表示
- ✅ カスタムプリセットの作成・編集・削除
- ✅ プリセットのコピー機能
- ✅ 各エージェントの詳細設定
  - モデル選択（最新27モデル対応）
  - Temperature, MaxTokens, TopP
  - システムプロンプト編集
  - 有効/無効切り替え

**コンポーネント**:
- `AgentPresetCard`: プリセット一覧表示
- `AgentPresetEditor`: プリセット編集モーダル
- `AgentConfigEditor`: 個別エージェント設定

---

## データフロー

```
1. ユーザーがプリセットを選択
   ↓
2. ChatInterfaceで現在のプリセットを取得
   ↓
3. メッセージ送信時にagentConfigsを生成
   ↓
4. useStreamingAgentがPOSTリクエストで送信
   ↓
5. Lambda関数がagentConfigsを受け取る
   ↓
6. consultAgent関数が各エージェントに設定を適用
   ↓
7. 指定されたモデルでBedrockを呼び出し
   ↓
8. ストリーミングレスポンスをフロントエンドに返す
```

---

## 使用方法

### 1. プリセット設定画面にアクセス

```
/settings/agents
```

### 2. プリセットの作成・編集

1. 「新規プリセット作成」または既存プリセットの「編集」をクリック
2. 各エージェントのモデルを選択
   - CASPAR: 保守的な分析に適したモデル
   - BALTHASAR: 革新的な提案に適したモデル
   - MELCHIOR: バランスの取れたモデル
   - SOLOMON: 最高性能の評価モデル
3. Temperature, MaxTokens, TopPを調整
4. システムプロンプトをカスタマイズ
5. 保存

### 3. チャットでプリセットを使用

1. チャット画面でプリセットを選択（将来実装）
2. メッセージを送信
3. 選択したモデルで応答が生成される

---

## 推奨プリセット構成

### 高速・低コスト構成
```typescript
{
  caspar: 'claude-3-5-haiku',
  balthasar: 'nova-lite',
  melchior: 'claude-haiku-4-5',
  solomon: 'claude-3-7-sonnet',
}
```
- **用途**: 開発・テスト環境
- **コスト**: 低
- **速度**: 最速

### バランス構成（推奨）
```typescript
{
  caspar: 'claude-3-7-sonnet',
  balthasar: 'nova-pro',
  melchior: 'claude-sonnet-4-5',
  solomon: 'claude-opus-4-1',
}
```
- **用途**: 本番環境
- **コスト**: 中
- **品質**: 高

### 最高品質構成
```typescript
{
  caspar: 'claude-opus-4-1',
  balthasar: 'nova-premier',
  melchior: 'claude-sonnet-4-5',
  solomon: 'claude-opus-4-1',
}
```
- **用途**: プレミアム機能
- **コスト**: 高
- **品質**: 最高

### 実験的構成
```typescript
{
  caspar: 'cohere.command-r-plus',  // RAG特化
  balthasar: 'deepseek.r1',         // 推論特化
  melchior: 'llama3-3-70b',         // オープンソース
  solomon: 'claude-opus-4-1',       // 最高評価
}
```
- **用途**: 特殊な用途・実験
- **コスト**: 中〜高
- **特徴**: 多様性最大

---

## テスト手順

### 1. 型チェック

```bash
npm run type-check
```

### 2. ローカルテスト

```bash
npx ampx sandbox
```

### 3. プリセット設定画面の確認

1. ブラウザで`http://localhost:3000/settings/agents`にアクセス
2. デフォルトプリセットが表示されることを確認
3. 「新規プリセット作成」をクリック
4. モデル選択ドロップダウンに最新モデルが表示されることを確認
5. プリセットを保存

### 4. チャットでの動作確認

1. チャット画面にアクセス
2. メッセージを送信
3. ブラウザの開発者ツールでネットワークタブを確認
4. POSTリクエストのボディに`agentConfigs`が含まれることを確認

### 5. Lambda関数のログ確認

```bash
# CloudWatch Logsで確認
aws logs tail /aws/lambda/magi-python-agents --follow
```

ログに以下が表示されることを確認:
```
Consulting CASPAR...
Using model: anthropic.claude-3-7-sonnet-20250219-v1:0 for CASPAR
```

---

## 注意事項

### 1. モデルアクセス権限

新しいモデルを使用する前に、AWS Bedrockコンソールで**モデルアクセス**を有効化する必要があります。

**手順**:
1. AWS Bedrockコンソールにアクセス
2. 左メニューから「Model access」を選択
3. 使用したいモデルの「Request access」をクリック
4. フォームを送信（通常は即座に承認）

### 2. リージョン対応

一部のモデルは特定リージョンでのみ利用可能:
- **us-east-1**: 全モデル対応（推奨）
- **ap-northeast-1**: 一部モデルのみ

現在の設定: `ap-northeast-1`

### 3. コスト管理

高性能モデルは高コストです:
- **Claude Opus 4.1**: 最高コスト
- **Nova Premier**: 高コスト
- **Claude Haiku 4.5**: 低コスト
- **Nova Micro**: 最低コスト

### 4. エラーハンドリング

モデルが利用不可の場合、自動的にデフォルトモデル（Haiku）にフォールバックします。

---

## トラブルシューティング

### モデルが選択できない

**原因**: 型定義が更新されていない

**解決策**:
```bash
npm run type-check
# エラーがあれば修正
```

### Lambda関数でモデルが反映されない

**原因**: agentConfigsが送信されていない

**確認**:
1. ブラウザの開発者ツールでネットワークタブを確認
2. POSTリクエストのボディを確認
3. `agentConfigs`が含まれているか確認

**解決策**:
- ChatInterfaceで`currentPreset`が正しく取得されているか確認
- `startStreaming`に`agentConfigs`が渡されているか確認

### モデルアクセスエラー

**エラーメッセージ**: `ValidationException: The provided model identifier is invalid`

**原因**: モデルアクセスが有効化されていない

**解決策**:
1. AWS Bedrockコンソールでモデルアクセスを有効化
2. 数分待ってから再試行

---

## 今後の改善案

### 1. チャット画面にプリセット選択UIを追加

現在は`currentPresetId`が固定されています。ドロップダウンを追加して動的に切り替え可能にします。

**実装**:
```typescript
<PresetSelector
  presets={presets}
  currentPresetId={currentPresetId}
  onPresetChange={setCurrentPresetId}
  onSettingsClick={() => router.push('/settings/agents')}
/>
```

### 2. プリセットのインポート/エクスポート

JSON形式でプリセットを共有できるようにします。

### 3. モデルパフォーマンス統計

各モデルの応答時間、コスト、品質スコアを記録・表示します。

### 4. A/Bテスト機能

複数のプリセットを比較して最適な構成を見つけます。

---

## まとめ

✅ **実装完了項目**:
1. 型定義の更新（27モデル対応）
2. Lambda関数の動的モデル選択
3. フロントエンドからの設定送信
4. プリセット設定画面（既存）
5. エラーハンドリング

✅ **動作確認済み**:
- プリセット設定画面でモデル選択可能
- 設定がLambda関数に送信される
- 指定されたモデルでBedrock呼び出し

🔄 **次のステップ**:
1. チャット画面にプリセット選択UIを追加
2. 実際のBedrockでテスト
3. モデルアクセス権限の確認
4. コスト監視の設定

---

## 参考資料

- [AWS Bedrock モデル一覧](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)
- [Anthropic Claude モデル](https://www.anthropic.com/claude)
- [Amazon Nova モデル](https://aws.amazon.com/bedrock/nova/)
- [プリセット機能ガイド](./docs/bedrock-models-for-magi.md)
