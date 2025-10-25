---
inclusion: always
---

# 技術アーキテクチャ & 開発ガイドライン

## コアスタック要件

### フロントエンド (Next.js 15 + TypeScript)
- **必須使用**: App Router、デフォルトでServer Components、必要時のみClient Components
- **状態管理**: クライアント状態よりサーバー状態を優先、React Server Componentsを使用
- **スタイリング**: Tailwind CSSとコンポーネントバリアント、複雑なコンポーネントはHeadless UI + Radix UI
- **認証**: Amplify Gen 2 Auth、`runWithAmplifyServerContext()`でSSR認証

### バックエンド統合 (Amplify Gen 2)
- **AWS Amplify Gen 2**: TypeScriptベースの設定、`amplify/backend.ts`で定義
- **データ管理**: `defineData()`でスキーマ定義、型安全なクライアント生成
- **認証**: `defineAuth()`でCognito設定、SSRサポート
- **カスタム関数**: `defineFunction()`でLambda関数、Bedrock統合用
- **リアルタイム**: AppSync GraphQLサブスクリプション（自動生成）

## マルチエージェントシステムパターン

### エージェントアーキテクチャ (MAGIシステム)
- **SOLOMON**: Judge/オーケストレーター - 他エージェントを評価・スコアリング (0-100点)
- **CASPAR**: 保守的・現実的視点 - 実行可能性に焦点
- **BALTHASAR**: 革新的・感情的視点 - 倫理と創造性
- **MELCHIOR**: バランス型・科学的視点 - データと論理

### 実装ルール
- **並列実行**: 3エージェントを常に並行実行、逐次実行は禁止
- **トレース相関**: 実行チェーン全体でtraceIdを渡す (UI → AgentCore → Strands)
- **エラーハンドリング**: エージェント失敗時の優雅な劣化、常に部分結果を返す

## 開発制約

### 認証・セキュリティ (Gen 2パターン)
- **サーバーアクション**: `runWithAmplifyServerContext()`で認証チェック
- **SSR認証**: `cookies()`からAmplifyトークンを抽出、`getCurrentUser()`で検証
- **データ分離**: スキーマレベルで`@auth`ルール適用、オーナーベースアクセス
- **型安全性**: 生成されたクライアント型でコンパイル時チェック

### パフォーマンス要件
- **初回応答**: 最初のエージェント応答まで2秒未満
- **UI操作**: 全ユーザー操作100ms未満
- **トレース表示**: GraphQLサブスクリプションによるリアルタイム更新

### 可観測性統合
- **トレーシング**: Next.jsとAgentCore両方でOpenTelemetryを使用
- **相関**: 全システム間でtraceId一貫性を維持
- **メトリクス**: トークン使用量、レイテンシ、エラー率、セッション数を追跡

## コード組織パターン

### ファイル構造ルール (Gen 2準拠)
- `src/app/`: Next.js App RouterページとAPIルート
- `src/components/`: Reactコンポーネント (ui/, agents/, trace/ サブディレクトリ)
- `src/lib/`: ユーティリティ (auth/, agents/, trace/ サブディレクトリ)
- `amplify/`: Gen 2設定ディレクトリ
  - `backend.ts`: メインバックエンド定義
  - `auth/resource.ts`: 認証リソース定義
  - `data/resource.ts`: データスキーマ定義
  - `functions/`: カスタムLambda関数
- `agents/`: Python Strandsエージェント (caspar/, balthasar/, melchior/, solomon/)

### API設計 (Gen 2パターン)
- **スキーマ定義**: `amplify/data/resource.ts`でTypeScript定義
- **型生成**: 自動生成されたクライアント型を使用
- **認証統合**: `@auth`ディレクティブでアクセス制御
- **カスタム関数**: `defineFunction()`でBedrock統合
- **リアルタイム**: `@subscribe`ディレクティブで自動サブスクリプション

### エラーハンドリング戦略
- **エージェント失敗**: 利用可能エージェントで継続、失敗したものはUIでマーク
- **ネットワーク問題**: 指数バックオフによるリトライロジック実装
- **認証失敗**: ログインにリダイレクト、会話状態は保持
- **型エラー**: 生成された型との不整合は即座に修正

## Gen 2開発制約

### 必須パターン
- **バックエンド定義**: 全リソースを`amplify/`ディレクトリで管理
- **型安全性**: 自動生成されたクライアント型を必ず使用
- **認証フロー**: `runWithAmplifyServerContext()`パターンを厳守
- **スキーマ変更**: `amplify/data/resource.ts`のみで管理、手動GraphQL禁止

### 禁止事項
- **直接AWS SDK使用**: Amplifyクライアント経由でのみアクセス
- **手動GraphQL**: 生成されたクライアントメソッドを使用
- **Gen 1パターン**: `amplify init`や`amplify configure`は使用禁止