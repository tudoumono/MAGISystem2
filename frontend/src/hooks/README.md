# Custom Hooks Implementation Guide

## 概要

このディレクトリには、MAGI Decision SystemのReactカスタムフックが含まれています。これらのフックは、Amplify Data APIとの統合、楽観的更新、リアルタイム通信、エラーハンドリングを提供します。

## 🎯 実装戦略: フロントエンドファースト開発

### Phase 1-2: モックデータ開発
- **現在の状態**: 全てのAPI呼び出しはモック実装を使用
- **目的**: UIロジック、ユーザー体験、エラーハンドリングに集中
- **利点**: 視覚的フィードバック、段階的学習、デバッグの容易さ

### Phase 3: 部分統合
- **移行対象**: 認証、会話履歴、プリセット管理
- **エージェント実行**: まだモックデータを使用
- **実装方法**: `withErrorHandling`内のコメントアウトを解除

### Phase 4-6: 完全統合
- **移行対象**: 全てのコンポーネント
- **実装方法**: 実際のStrands Agents + Bedrock AgentCore統合

## 📁 ファイル構成

```
src/hooks/
├── index.ts                 # 統合エクスポート
├── useConversations.ts      # 会話管理フック
├── useMessages.ts           # メッセージ管理フック
└── README.md               # このファイル
```

## 🔧 useConversations Hook

### 主要機能
- 会話一覧の取得（ページネーション対応）
- 会話の作成・更新・削除
- デバウンス検索機能
- リアルタイム更新
- 楽観的更新

### 使用例
```typescript
import { useConversations } from '@/hooks';

function ConversationList() {
  const {
    conversations,
    loading,
    error,
    createConversation,
    searchConversations,
    hasNextPage,
    loadMoreConversations
  } = useConversations({
    limit: 20,
    enableRealtime: true,
    enableOptimisticUpdates: true
  });

  const handleCreateConversation = async () => {
    const result = await createConversation({
      title: "新しい会話",
      agentPresetId: "preset-default"
    });
    
    if (result) {
      console.log('会話が作成されました:', result.id);
    }
  };

  const handleSearch = (query: string) => {
    searchConversations(query); // 300msデバウンス処理済み
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <SearchInput onChange={handleSearch} />
      <button onClick={handleCreateConversation}>
        新しい会話
      </button>
      
      {conversations.map(conv => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}
      
      {hasNextPage && (
        <button onClick={loadMoreConversations}>
          さらに読み込む
        </button>
      )}
    </div>
  );
}
```

### 楽観的更新の仕組み
1. **即座にUI更新**: API呼び出し前にローカル状態を更新
2. **一時ID管理**: `temp-{timestamp}-{random}` 形式の一時ID
3. **エラー時ロールバック**: API失敗時に楽観的更新を取り消し
4. **重複防止**: 実際のデータ受信時に一時IDを置き換え

## 🔧 useMessages Hook

### 主要機能
- 会話内メッセージの取得・表示
- ユーザーメッセージの送信
- エージェント応答の受信・表示
- リアルタイムメッセージ更新
- トレース情報の関連付け
- 段階的エージェント実行状態の表示

### 使用例
```typescript
import { useMessages } from '@/hooks';

function ChatInterface({ conversationId }: { conversationId: string }) {
  const {
    messages,
    loading,
    error,
    sendMessage,
    agentResponding,
    agentStatus,
    agentProgress,
    traceSteps
  } = useMessages(conversationId, {
    enableRealtime: true,
    enableOptimisticUpdates: true
  });

  const handleSendMessage = async (content: string) => {
    const result = await sendMessage(content);
    if (result) {
      console.log('メッセージが送信されました:', result.id);
    }
  };

  return (
    <div>
      <MessageList messages={messages} />
      
      {agentResponding && (
        <AgentStatusPanel 
          status={agentStatus}
          progress={agentProgress}
          traceSteps={traceSteps}
        />
      )}
      
      <MessageInput 
        onSend={handleSendMessage}
        disabled={agentResponding}
      />
    </div>
  );
}
```

### エージェント実行状態の管理
```typescript
// エージェント実行状態
type AgentExecutionStatus = 
  | 'idle'           // 待機中
  | 'analyzing'      // 質問分析中
  | 'executing'      // 3賢者実行中
  | 'judging'        // SOLOMON評価中
  | 'completed'      // 完了
  | 'error';         // エラー

// 各エージェントの進行状況
interface AgentProgress {
  caspar: 'pending' | 'running' | 'completed' | 'error';
  balthasar: 'pending' | 'running' | 'completed' | 'error';
  melchior: 'pending' | 'running' | 'completed' | 'error';
  solomon: 'pending' | 'running' | 'completed' | 'error';
}
```

## 🔄 Phase 3への移行手順

### 1. Amplifyリソースのデプロイ
```bash
# AWSリソースをデプロイ
npx ampx push

# 生成された設定ファイルを確認
ls amplify_outputs.json
```

### 2. 環境変数の設定
```bash
# .env.local ファイルを更新
NEXT_PUBLIC_USER_POOL_ID=your-actual-user-pool-id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-actual-client-id
NEXT_PUBLIC_GRAPHQL_ENDPOINT=your-actual-graphql-endpoint
```

### 3. 実際のAPI呼び出しの有効化
各フック内の以下のコメントを解除：

```typescript
// useConversations.ts
const response = await withErrorHandling(async () => {
  // 実際のAmplify実装（Phase 3で有効化）
  return await amplifyClient.models.Conversation.list({
    filter: filter || undefined,
    limit,
    nextToken: token || undefined,
    sortDirection: 'DESC'
  });
  
  // Phase 1-2: モック実装を使用
  // return await mockListConversations({...});
});
```

### 4. リアルタイム更新の有効化
```typescript
// 実際のAmplify Subscriptions（Phase 3で有効化）
subscriptionRef.current = subscribeToUpdates<Conversation>(
  'Conversation',
  (updatedConversations) => {
    // リアルタイム更新処理
  }
);
```

## 🎨 UI統合パターン

### エラーハンドリング
```typescript
function ConversationComponent() {
  const { conversations, error, createConversation } = useConversations();

  const handleCreate = async () => {
    try {
      await createConversation({ title: "新しい会話" });
      // 成功時の処理
    } catch (err) {
      // エラーは既にフック内で処理済み
      // 必要に応じて追加のUI更新
    }
  };

  if (error) {
    return (
      <ErrorBoundary 
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // 通常のUI
}
```

### ローディング状態
```typescript
function MessageComponent() {
  const { messages, loading, agentResponding } = useMessages(conversationId);

  return (
    <div>
      {loading && <SkeletonLoader />}
      {agentResponding && <AgentThinkingIndicator />}
      <MessageList messages={messages} />
    </div>
  );
}
```

## 🧪 テスト戦略

### モック実装の利点
1. **予測可能な動作**: 一貫したテスト結果
2. **エラーシミュレーション**: 様々なエラーケースのテスト
3. **パフォーマンステスト**: ネットワーク遅延のシミュレーション
4. **オフライン開発**: インターネット接続不要

### テスト例
```typescript
// __tests__/hooks/useConversations.test.ts
import { renderHook, act } from '@testing-library/react';
import { useConversations } from '@/hooks/useConversations';

describe('useConversations', () => {
  it('should create conversation with optimistic updates', async () => {
    const { result } = renderHook(() => useConversations({
      enableOptimisticUpdates: true
    }));

    await act(async () => {
      const conversation = await result.current.createConversation({
        title: 'テスト会話'
      });
      
      expect(conversation).toBeTruthy();
      expect(result.current.conversations).toHaveLength(1);
    });
  });

  it('should handle errors gracefully', async () => {
    // エラーケースのテスト
  });
});
```

## 🔍 デバッグガイド

### 開発者ツール
```typescript
// ブラウザコンソールでの状態確認
window.__MAGI_DEBUG__ = {
  conversations: conversations,
  messages: messages,
  agentStatus: agentStatus
};
```

### ログ出力
```typescript
// 詳細ログの有効化
localStorage.setItem('MAGI_DEBUG', 'true');

// フック内でのログ出力
if (localStorage.getItem('MAGI_DEBUG')) {
  console.log('Conversation created:', result);
}
```

## 📚 学習リソース

### 関連ドキュメント
- [Amplify Data API](https://docs.amplify.aws/react/build-a-backend/data/)
- [React Hooks](https://react.dev/reference/react)
- [GraphQL Subscriptions](https://docs.amplify.aws/react/build-a-backend/data/subscribe-data/)

### 実装パターン
- [楽観的更新](https://react.dev/learn/queueing-a-series-of-state-updates)
- [エラーハンドリング](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [パフォーマンス最適化](https://react.dev/learn/render-and-commit)

## 🚀 次のステップ

1. **Phase 2完了**: 認証UIとデザインシステムの構築
2. **Phase 3準備**: Amplifyリソースのデプロイ
3. **実データ統合**: モック実装から実際のAPI呼び出しへの移行
4. **エージェント統合**: Strands Agents + Bedrock AgentCoreの統合
5. **本格運用**: 完全なMAGI意思決定システムの完成

---

**注意**: このドキュメントは学習目的で詳細に記述されています。実際の開発では、必要な部分のみを参照してください。