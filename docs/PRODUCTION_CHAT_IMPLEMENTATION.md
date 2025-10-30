# 本番チャット画面実装ドキュメント

## 概要

MAGIシステムの本番用チャット画面を実装しました。推奨デザイン（分割ビュー）を採用し、3賢者の応答と推論トレースをリアルタイムで表示します。

## 実装日時

2025-10-31

## 実装内容

### 1. 本番チャット画面 (`/chat`)

**ファイル**: `src/app/(protected)/chat/page.tsx`

#### 特徴

- **3カラムレイアウト**:
  - 左: 会話履歴サイドバー (280px)
  - 中央: チャットインターフェース (flex-1)
  - 右: 推論トレースパネル (380px, 折りたたみ可能)

- **既存コンポーネントの活用**:
  - `ConversationSidebar`: 会話履歴管理
  - `ChatInterface`: メッセージ送受信
  - `TracePanel`: 推論トレース表示（新規作成）

- **UI/UX機能**:
  - 新規会話作成
  - 会話タイトル編集
  - 会話検索
  - 会話削除
  - トレースパネルの折りたたみ
  - レスポンシブ対応（将来実装）

#### コード構造

```typescript
export default function ChatPage() {
  // 会話管理
  const { conversations, loading, createConversation, ... } = useConversations();
  
  // UI状態管理
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [showTracePanel, setShowTracePanel] = useState(true);
  
  return (
    <div className="h-screen flex">
      {/* 左: 会話履歴 */}
      <ConversationSidebar ... />
      
      {/* 中央: チャット */}
      <ChatInterface ... />
      
      {/* 右: トレース（折りたたみ可能） */}
      {showTracePanel && <TracePanel ... />}
    </div>
  );
}
```

### 2. トレースパネルコンポーネント

**ファイル**: `src/components/trace/TracePanel.tsx`

#### 特徴

- **常時表示パネル**: モーダルではなく固定パネルとして実装
- **リアルタイム更新**: `useTraceUpdates`フックでリアルタイム更新
- **折りたたみ可能**: 画面を広く使える
- **外部ページで開く**: 新しいタブで詳細表示可能

#### コード構造

```typescript
export const TracePanel: React.FC<TracePanelProps> = ({
  traceId,
  onClose,
  className
}) => {
  const { traceSteps, error, connectionStatus } = useTraceUpdates(traceId, true);
  
  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="p-4 border-b">...</div>
      
      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        <ReasoningTracePanel ... />
      </div>
      
      {/* フッター */}
      <div className="p-3 border-t">...</div>
    </div>
  );
};
```

### 3. ダッシュボード更新

**ファイル**: `src/app/(protected)/dashboard/page.tsx`

#### 変更内容

- チャット機能カードを有効化
- `/chat`へのナビゲーションを追加
- 「近日公開」から「チャットを開始」に変更

```typescript
<Card onClick={() => router.push('/chat')}>
  <CardHeader>
    <CardTitle>チャット</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="outline" size="sm">
      チャットを開始
    </Button>
  </CardContent>
</Card>
```

## アーキテクチャ

### コンポーネント階層

```
/chat (page.tsx)
├── ConversationSidebar (既存)
│   ├── 会話一覧
│   ├── 検索機能
│   └── 新規作成ボタン
├── ChatInterface (既存)
│   ├── ConversationHeader
│   ├── MessageList
│   │   └── MessageBubble (既存)
│   │       ├── UserMessage
│   │       └── AssistantMessage
│   │           ├── AgentResponsePanel (既存)
│   │           └── JudgeResponsePanel (既存)
│   └── MessageInput
└── TracePanel (新規)
    ├── パネルヘッダー
    ├── ReasoningTracePanel (既存)
    └── パネルフッター
```

### データフロー

```
useConversations() → ConversationSidebar
                  ↓
            activeConversationId
                  ↓
useMessages(conversationId) → ChatInterface
                            ↓
                      Message.traceId
                            ↓
useTraceUpdates(traceId) → TracePanel
```

## 使用している既存コンポーネント

### 1. ConversationSidebar
- **場所**: `src/components/sidebar/ConversationSidebar.tsx`
- **機能**: 会話履歴の表示、検索、作成、削除
- **フック**: `useConversations`

### 2. ChatInterface
- **場所**: `src/components/chat/ChatInterface.tsx`
- **機能**: メッセージ送受信、会話表示
- **フック**: `useMessages`

### 3. MessageBubble
- **場所**: `src/components/chat/MessageBubble.tsx`
- **機能**: ユーザー/アシスタントメッセージの表示
- **サブコンポーネント**: AgentResponsePanel, JudgeResponsePanel

### 4. ReasoningTracePanel
- **場所**: `src/components/trace/ReasoningTracePanel.tsx`
- **機能**: トレースステップの詳細表示
- **フック**: `useTraceUpdates`

## 新規作成コンポーネント

### TracePanel
- **場所**: `src/components/trace/TracePanel.tsx`
- **目的**: TraceModalを常時表示パネルに変更
- **特徴**:
  - 折りたたみ可能
  - リアルタイム更新
  - 外部ページで開く機能
  - エラーハンドリング

## 使用しているフック

### 1. useConversations
- **場所**: `src/hooks/useConversations.ts`
- **機能**: 会話のCRUD操作、リアルタイム更新

### 2. useMessages
- **場所**: `src/hooks/useMessages.ts`
- **機能**: メッセージのCRUD操作、エージェント実行

### 3. useTraceUpdates
- **場所**: `src/hooks/useTraceUpdates.ts`
- **機能**: トレースステップのリアルタイム更新

## デザインシステム

### カラーコーディング

```typescript
// 3賢者のカラー
const agentColors = {
  caspar: 'bg-blue-50 border-blue-200',      // 保守的 = 青
  balthasar: 'bg-purple-50 border-purple-200', // 革新的 = 紫
  melchior: 'bg-green-50 border-green-200',   // バランス = 緑
  solomon: 'bg-amber-50 border-amber-200'     // 統括者 = 金
};
```

### レイアウト寸法

- **サイドバー幅**: 280px (w-80)
- **トレースパネル幅**: 380px (w-96)
- **チャットエリア**: flex-1 (残り全部)

### レスポンシブ対応（将来実装）

- **デスクトップ (1920px以上)**: 3カラム表示
- **タブレット (768px-1920px)**: トレースを展開式に
- **モバイル (768px未満)**: タブ切り替え方式

## アクセス方法

### 1. ダッシュボードから

```
/dashboard → チャットカードをクリック → /chat
```

### 2. 直接アクセス

```
https://your-domain.com/chat
```

### 3. 認証要件

- 保護されたルート: `(protected)`グループ内
- 認証が必要: `ProtectedRoute`コンポーネントでガード
- 未認証時: `/signin`にリダイレクト

## 今後の実装予定

### Phase 1: 基本機能の完成（完了）
- ✅ 3カラムレイアウト
- ✅ 会話履歴管理
- ✅ チャットインターフェース
- ✅ トレースパネル

### Phase 2: エージェント統合（次のステップ）
- ⏳ 3賢者の応答表示（カラーコーディング）
- ⏳ SOLOMON Judge評価表示
- ⏳ リアルタイムストリーミング
- ⏳ エージェント実行状態の表示

### Phase 3: 高度な機能
- ⏳ エージェント設定のカスタマイズ
- ⏳ プリセット管理
- ⏳ エクスポート機能
- ⏳ 検索・フィルター強化

### Phase 4: レスポンシブ対応
- ⏳ タブレット対応
- ⏳ モバイル対応
- ⏳ タッチジェスチャー対応

## テスト方法

### 1. ローカル開発環境

```bash
npm run dev
# http://localhost:3000/chat にアクセス
```

### 2. 本番環境

```bash
# デプロイ後
https://main.d34f7t08qc7jiy.amplifyapp.com/chat
```

### 3. 確認項目

- [ ] 会話履歴が表示される
- [ ] 新規会話が作成できる
- [ ] メッセージが送信できる
- [ ] トレースパネルが表示される
- [ ] トレースパネルが折りたたみできる
- [ ] 会話タイトルが編集できる
- [ ] 会話が削除できる
- [ ] 検索機能が動作する

## トラブルシューティング

### 問題1: トレースパネルが表示されない

**原因**: `selectedTraceId`が設定されていない

**解決策**: メッセージに`traceId`が含まれているか確認

```typescript
// ChatInterface.tsx
onTraceView={handleTraceView}
```

### 問題2: 会話が作成できない

**原因**: `useConversations`フックのエラー

**解決策**: ブラウザコンソールでエラーを確認

```typescript
// useConversations.ts
console.error('Failed to create conversation:', err);
```

### 問題3: レイアウトが崩れる

**原因**: Tailwind CSSのクラスが適用されていない

**解決策**: `globals.css`が読み込まれているか確認

## パフォーマンス考慮事項

### 1. 仮想スクロール（将来実装）

大量のメッセージがある場合、仮想スクロールを実装:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
```

### 2. メモ化

不要な再レンダリングを防ぐ:

```typescript
const memoizedMessages = useMemo(() => messages, [messages]);
```

### 3. 遅延読み込み

トレースパネルの遅延読み込み:

```typescript
const TracePanel = lazy(() => import('@/components/trace/TracePanel'));
```

## セキュリティ考慮事項

### 1. 認証ガード

```typescript
// (protected)グループ内のため自動的に保護
export default function ChatPage() { ... }
```

### 2. データ分離

```typescript
// useConversations内でオーナーベースアクセス制御
authMode: 'userPool'
```

### 3. XSS対策

```typescript
// メッセージ内容のサニタイズ
<p className="whitespace-pre-wrap">{sanitize(content)}</p>
```

## 関連ドキュメント

- [UI_DESIGN_PROPOSAL.md](./UI_DESIGN_PROPOSAL.md) - デザイン提案
- [ARCHITECTURE_DECISION.md](./ARCHITECTURE_DECISION.md) - アーキテクチャ決定
- [TEST_STRUCTURE.md](./TEST_STRUCTURE.md) - テスト構造
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - 開発ガイド

## まとめ

本番用チャット画面の基本実装が完了しました。既存のテストページ(`/test/data/conversation`)をベースに、推奨デザイン（分割ビュー）を採用し、以下を実現しました：

1. ✅ 3カラムレイアウト（会話履歴・チャット・トレース）
2. ✅ 既存コンポーネントの再利用
3. ✅ トレースパネルの常時表示
4. ✅ 折りたたみ可能なUI
5. ✅ ダッシュボードからのナビゲーション

次のステップは、エージェント統合（3賢者の応答表示、SOLOMON Judge評価）の実装です。
