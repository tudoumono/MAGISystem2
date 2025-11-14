# フロントエンドUI (Next.js)

**役割**: フロントエンドUI (Next.js)

このディレクトリは、ユーザー向けWebインターフェースを提供するNext.jsアプリケーションです。

## アーキテクチャ構成

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 認証が必要なページ
│   ├── api/                 # API Routes
│   └── globals.css          # グローバルスタイル
├── components/              # Reactコンポーネント
│   ├── ui/                  # 基本UIコンポーネント
│   ├── agents/              # エージェント関連
│   └── trace/               # トレース表示
├── lib/                     # ユーティリティ
│   ├── auth/                # 認証関連
│   ├── agents/              # エージェント連携
│   └── trace/               # トレース処理
├── types/                   # TypeScript型定義
└── hooks/                   # カスタムReactフック
```

## 主要機能

- **MAGI Chat Interface**: 3賢者との対話UI
- **リアルタイム表示**: ストリーミング応答の表示
- **トレース可視化**: エージェント実行過程の表示
- **認証統合**: AWS Amplify認証
- **レスポンシブデザイン**: モバイル対応UI

## データフロー

```
ユーザー (Webブラウザ)
    ↓ HTTP Request
フロントエンドUI (src/)
    ↓ POST /api/agentcore/invocations
AgentCore Runtime (agents/backend/)
    ↓ spawn('python', ['magi_agent.py'])
Strands Agents (agents/magi_agent.py)
    ↓ Amazon Bedrock API
3賢者 + SOLOMON Judge実行
```

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Server Components優先
- **Authentication**: AWS Amplify Gen 2 Auth
- **Real-time**: Server-Sent Events (SSE)

## 開発・起動

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm start
```

## API統合

### AgentCore Runtime連携
```typescript
// AgentCore Runtime呼び出し
const response = await fetch('/api/agentcore/invocations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: userInput })
});
```

### Amplify認証統合
```typescript
// 認証状態確認
const session = await getServerSession();
if (!session) {
  redirect('/login');
}
```

## 関連ディレクトリ

- `agents/` - AgentCore Runtime (Next.js + Strands Agents)
- `amplify/` - AWS設定・インフラ定義