# Amplify Data Integration - MAGI Decision UI

このディレクトリには、AWS Amplify Data/AI Kitとの統合に必要な全ての型定義、フック、ユーティリティが含まれています。

## 📁 ファイル構成

```
src/lib/amplify/
├── types.ts           # TypeScript型定義
├── mock-client.ts     # Phase 1-2用モッククライアント
├── index.ts          # 統合エクスポート
└── README.md         # このファイル
```

## 🎯 Phase別開発戦略

### Phase 1-2: モックデータ開発
- **目的**: フロントエンドファースト開発
- **使用**: `mock-client.ts`のモッククライアント
- **特徴**: ローカルストレージベースのデータ永続化

### Phase 3: 部分統合
- **目的**: 認証・データは実データ、エージェントはモック
- **移行**: `generateClient()`への切り替え
- **特徴**: 実際のAmplify Data/AI Kit使用開始

### Phase 4-6: 完全統合
- **目的**: 全機能の実データ化
- **特徴**: Strands Agents + Bedrock AgentCore統合

## 🔧 使用方法

### 基本的なインポート

```typescript
import { 
  User, 
  Conversation, 
  Message,
  useConversations,
  useMessages 
} from '@/lib/amplify';
```

### フックの使用例

#### 会話管理

```typescript
function ConversationList() {
  const {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    searchConversations
  } = useConversations();

  const handleCreate = async () => {
    await createConversation({
      title: '新しい会話',
      agentPresetId: 'default'
    });
  };

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <div>
      {conversations.map(conv => (
        <div key={conv.id}>{conv.title}</div>
      ))}
    </div>
  );
}
```

#### メッセージ管理

```typescript
function ChatInterface({ conversationId }: { conversationId: string }) {
  const {
    messages,
    loading,
    isAgentExecuting,
    sendMessage
  } = useMessages(conversationId);

  const handleSend = async (content: string) => {
    await sendMessage({ content });
  };

  return (
    <div>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isAgentExecuting && <TypingIndicator />}
    </div>
  );
}
```

## 🎨 楽観的更新

全てのフックは楽観的更新をサポートしています：

```typescript
// 即座にUIが更新される
await createConversation({ title: '新しい会話' });

// エラー時は自動的にロールバック
try {
  await updateConversation({ id: 'conv-1', title: '更新された会話' });
} catch (error) {
  // UIは自動的に元の状態に戻る
  console.error('更新に失敗:', error);
}
```

## 🔄 Phase移行ガイド

### Phase 1-2 → Phase 3

1. **クライアントの切り替え**:
```typescript
// Before (Phase 1-2)
import { generateMockClient } from '@/lib/amplify/mock-client';
const client = generateMockClient<Schema>();

// After (Phase 3)
import { generateClient } from 'aws-amplify/data';
const client = generateClient<Schema>();
```

2. **環境変数での制御**:
```typescript
const client = process.env.NODE_ENV === 'development' 
  ? generateMockClient<Schema>()
  : generateClient<Schema>();
```

### Phase 3 → Phase 4-6

1. **エージェント実行の実装**:
```typescript
// モック実行を実際のStrands Agents呼び出しに置き換え
const agentResponse = await executeMAGIAgents(question, config);
```

2. **トレース機能の有効化**:
```typescript
// OpenTelemetryトレーシングの統合
const traceId = await startAgentTrace(conversationId);
```

## 🧪 テスト・デバッグ

### 開発用サンプルコンポーネント

```typescript
import { ConversationExample } from '@/components/examples/ConversationExample';

export default function TestPage() {
  return <ConversationExample />;
}
```

### モックデータの確認

ブラウザの開発者ツール → Application → Local Storage で確認可能：
- `magi-conversations`: 会話データ
- `magi-messages`: メッセージデータ

### デバッグ情報

```typescript
const { conversations, loading, error } = useConversations();

console.log('会話数:', conversations.length);
console.log('ローディング:', loading);
console.log('エラー:', error);
```

## 📚 型定義リファレンス

### 主要な型

- `User`: ユーザー情報
- `Conversation`: 会話スレッド
- `Message`: メッセージ（ユーザー/アシスタント）
- `AgentResponse`: エージェント応答
- `JudgeResponse`: SOLOMON Judge評価
- `TraceStep`: 実行トレースステップ

### エージェント関連

- `AgentType`: `'caspar' | 'balthasar' | 'melchior' | 'solomon'`
- `DecisionType`: `'APPROVED' | 'REJECTED'`
- `MessageRole`: `'user' | 'assistant'`

## 🔧 カスタマイズ

### 新しいフックの追加

```typescript
// src/hooks/useTraceSteps.ts
export function useTraceSteps(messageId: string) {
  // トレースステップ管理ロジック
}
```

### 型の拡張

```typescript
// src/lib/amplify/extended-types.ts
export interface ExtendedMessage extends Message {
  customField: string;
}
```

## 🚀 パフォーマンス最適化

### メモ化の活用

```typescript
const memoizedConversations = useMemo(() => 
  searchConversations(searchQuery), 
  [searchConversations, searchQuery]
);
```

### 仮想化スクロール

大量のデータには`react-window`等を使用：

```typescript
import { FixedSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={conversations.length}
  itemSize={80}
>
  {ConversationItem}
</List>
```

## 🔗 関連ファイル

- `src/hooks/useConversations.ts`: 会話管理フック
- `src/hooks/useMessages.ts`: メッセージ管理フック
- `src/lib/optimistic-updates.ts`: 楽観的更新ユーティリティ
- `amplify/data/resource.ts`: Amplify Dataスキーマ定義

## 📖 学習リソース

- [AWS Amplify Data/AI Kit Documentation](https://docs.amplify.aws/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [React Hooks Patterns](https://reactjs.org/docs/hooks-intro.html)
- [Optimistic Updates Pattern](https://www.apollographql.com/docs/react/performance/optimistic-ui/)