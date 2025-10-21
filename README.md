# MAGI Decision System

エヴァンゲリオンのMAGIシステムにインスパイアされた多エージェント意思決定システム

## 🎯 プロジェクト概要

MAGI Decision Systemは、3賢者（CASPAR、BALTHASAR、MELCHIOR）による多視点分析とSOLOMON Judgeによる統合評価を提供するWebアプリケーションです。AWS Amplify、Amazon Bedrock AgentCore、Strands Agentsを基盤とし、リアルタイムな推論過程の可視化と会話履歴管理を実現します。

### 🤖 エージェント構成

- **CASPAR（カスパー）**: 保守的・現実的な視点（リスク重視）
- **BALTHASAR（バルタザール）**: 革新的・感情的な視点（創造性重視）
- **MELCHIOR（メルキオール）**: バランス型・科学的な視点（論理性重視）
- **SOLOMON Judge**: 統括者として3賢者の判断を集約・評価

## 🚀 段階的開発アプローチ

このプロジェクトは**フロントエンドファースト**の開発戦略を採用し、学習効果を最大化しながら段階的にシステムを構築します。

### Phase 1-2: モックデータ開発 🎭 (現在)
- ✅ Next.js 15 + TypeScript + Tailwind CSSプロジェクト構築
- ✅ エージェント応答のモックデータライブラリ
- ✅ UIコンポーネントとデザインシステム
- ✅ 認証システム（Amplify Auth）
- 🔄 会話管理インターフェース
- 🔄 エージェント応答パネル
- 🔄 トレース可視化コンポーネント

### Phase 3: 部分統合 🔗 (予定)
- 📋 Amplify Data統合（認証・会話履歴・プリセット管理）
- 📋 リアルタイム機能の動作確認
- 📋 エージェント実行部分はモック継続

### Phase 4-6: 完全統合 🤖 (将来)
- 📋 Amazon Bedrock AgentCore統合
- 📋 Strands Agents実装
- 📋 OpenTelemetryトレーシング
- 📋 本格的MAGIシステム完成

## 🛠 技術スタック

### フロントエンド
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Headless UI + Radix UI
- **State Management**: React Server Components + Client Components

### バックエンド・インフラ
- **Hosting**: AWS Amplify Hosting (SSR対応)
- **Authentication**: AWS Amplify Auth (Amazon Cognito)
- **Data Management**: AWS Amplify Data/AI Kit
- **Database**: Amazon DynamoDB
- **Real-time**: AWS AppSync (GraphQL Subscriptions)
- **Functions**: AWS Lambda (Node.js 20.x)

### AI・エージェント基盤
- **LLM Gateway**: Amazon Bedrock カスタムハンドラー
- **Agent Runtime**: Amazon Bedrock AgentCore
- **Multi-Agent Framework**: Strands Agents (Python)
- **Agent Orchestration**: SOLOMON = Judge, 3賢者 = Workers

### 観測・監視
- **Tracing**: OpenTelemetry + AWS X-Ray
- **Monitoring**: Amazon CloudWatch
- **Logging**: CloudWatch Logs
- **Metrics**: カスタムメトリクス + Core Web Vitals

## 📁 プロジェクト構造

```
magi-decision-ui/
├── src/                          # ソースコード
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # 認証が必要なページ
│   │   ├── api/                 # API Routes
│   │   ├── globals.css          # グローバルスタイル
│   │   ├── layout.tsx           # ルートレイアウト
│   │   └── page.tsx             # ホームページ
│   ├── components/              # React Components
│   │   ├── ui/                  # 基本UIコンポーネント
│   │   ├── agents/              # エージェント関連
│   │   ├── auth/                # 認証関連
│   │   ├── chat/                # チャット関連
│   │   ├── sidebar/             # サイドバー関連
│   │   └── trace/               # トレース表示
│   ├── lib/                     # ユーティリティ
│   │   ├── auth/                # 認証関連
│   │   ├── agents/              # エージェント連携
│   │   ├── mock/                # モックデータ
│   │   └── trace/               # トレース処理
│   ├── types/                   # TypeScript型定義
│   │   ├── domain.ts            # ドメインモデル
│   │   └── api.ts               # API型定義
│   └── hooks/                   # カスタムフック
├── amplify/                     # AWS Amplify設定
│   ├── auth/                    # 認証設定
│   ├── data/                    # データモデル設定
│   ├── functions/               # Lambda関数
│   │   └── agent-gateway/       # エージェントゲートウェイ
│   └── backend.ts               # バックエンド設定
├── agents/                      # Strands Agents (将来実装)
│   ├── caspar/                  # CASPAR エージェント
│   ├── balthasar/               # BALTHASAR エージェント
│   ├── melchior/                # MELCHIOR エージェント
│   ├── solomon/                 # SOLOMON Judge
│   └── shared/                  # 共通ユーティリティ
└── docs/                        # ドキュメント
```

## 🚀 セットアップ・実行方法

### ⚡ クイックスタート

**5分でセットアップ完了！** → [**QUICKSTART.md**](QUICKSTART.md)

### 📋 詳細な手順書

完全なセットアップ手順 → [**ユーザーアクション手順書**](docs/deployment/user-action-guide.md)

### 基本セットアップ

#### 前提条件

- Node.js 18+ 
- AWS アカウント
- AWS CLI

#### 1. 依存関係のインストール

```bash
npm install
```

#### 2. AWS認証とデプロイ

```bash
# AWS認証設定
aws configure

# Amplifyリソースデプロイ
npx ampx configure profile
npx ampx push
```

#### 3. 環境変数の自動設定

```bash
# 環境変数を自動設定
npm run setup-env
```

#### 4. アプリケーション起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 🧪 開発・テスト

### 型チェック

```bash
npm run type-check
```

### リンティング

```bash
npm run lint
```

### フォーマット

```bash
npx prettier --write .
```

### ビルド

```bash
npm run build
```

## 📚 学習ポイント

このプロジェクトは以下の技術の学習を目的としています：

### 1. Next.js 15の新機能
- **App Router**: ファイルベースルーティングの新方式
- **React Server Components**: サーバーサイドレンダリングの最適化
- **Streaming**: 段階的なページ読み込み
- **Metadata API**: SEO最適化の新しいアプローチ

### 2. AWS Amplify Gen2
- **defineBackend**: TypeScriptベースの設定方式
- **Data/AI Kit**: GraphQL + DynamoDBの統合管理
- **Auth**: Cognitoによる認証システム
- **Functions**: カスタムビジネスロジックの実装

### 3. Amazon Bedrock AgentCore
- **Agent Runtime**: エージェント実行環境
- **Observability**: OpenTelemetryによるトレーシング
- **Memory Service**: 会話コンテキストの管理
- **Tool Integration**: 外部ツールとの連携

### 4. Strands Agents
- **Multi-Agent Framework**: 複数エージェントの協調
- **Agent-to-Agent Protocol**: エージェント間通信
- **Orchestration**: 統括エージェントによる制御
- **Parallel Execution**: 並列実行の最適化

### 5. TypeScript設計パターン
- **Domain Modeling**: ドメイン駆動設計
- **Type Safety**: 型安全性の確保
- **API Contract**: インターフェース設計
- **Error Handling**: エラーハンドリング戦略

### 6. AI可読性重視の開発
- **自己文書化コード**: 他の生成AIによるレビューが可能な詳細コメント
- **設計判断の記録**: 実装選択の理由を明確化
- **標準化されたコメント**: 一貫したドキュメント品質

## 🎨 デザインシステム

### カラーパレット

```css
/* MAGI System Colors */
--magi-caspar: #3b82f6;      /* 青系 - 保守的 */
--magi-balthasar: #ef4444;   /* 赤系 - 革新的 */
--magi-melchior: #22c55e;    /* 緑系 - バランス型 */
--magi-solomon: #a855f7;     /* 紫系 - 統括者 */

/* Decision Colors */
--decision-approved: #22c55e; /* 可決 - 緑 */
--decision-rejected: #ef4444; /* 否決 - 赤 */
--decision-pending: #f59e0b;  /* 保留 - 黄 */
```

### コンポーネント設計原則

1. **再利用性**: 汎用的なコンポーネント設計
2. **アクセシビリティ**: WCAG 2.1 AA準拠
3. **レスポンシブ**: モバイルファーストデザイン
4. **パフォーマンス**: 遅延読み込みと最適化
5. **一貫性**: デザインシステムの統一

## 🔧 設定ファイル

### TypeScript設定 (`tsconfig.json`)
- 厳密な型チェック有効
- パスエイリアス設定
- Next.js最適化

### ESLint設定 (`.eslintrc.json`)
- Next.js推奨ルール
- TypeScript統合
- インポート順序の統一

### Prettier設定 (`.prettierrc`)
- コードフォーマットの統一
- Tailwind CSS統合

### Tailwind設定 (`tailwind.config.ts`)
- MAGIテーマカラー
- カスタムアニメーション
- レスポンシブブレークポイント

## 📊 パフォーマンス目標

- **First Contentful Paint**: < 1.0秒
- **Largest Contentful Paint**: < 2.5秒
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Time to Interactive**: < 3.0秒

## 🔒 セキュリティ考慮事項

### 認証・認可
- Amazon Cognito User Pool
- JWT トークン検証
- オーナーベースアクセス制御
- セッション管理

### データ保護
- 会話データの暗号化
- PII情報の適切な処理
- トレース情報のサニタイゼーション
- CORS設定

### AI安全性
- プロンプトインジェクション対策
- 出力フィルタリング
- レート制限
- 監査ログ

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

### コミットメッセージ規約

```
type(scope): description

feat(agents): add CASPAR agent implementation
fix(ui): resolve responsive layout issue
docs(readme): update setup instructions
style(components): improve button styling
refactor(api): optimize agent gateway performance
test(agents): add unit tests for SOLOMON judge
```

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- **エヴァンゲリオン**: MAGIシステムのインスピレーション
- **AWS**: 強力なクラウドインフラストラクチャ
- **Next.js Team**: 優れたReactフレームワーク
- **Tailwind CSS**: 効率的なスタイリングシステム
- **TypeScript Team**: 型安全性の向上

## 📞 サポート・お問い合わせ

- **Issues**: [GitHub Issues](https://github.com/your-org/magi-decision-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/magi-decision-ui/discussions)
- **Email**: support@magi-decision.example.com

---

**MAGI Decision System** - 3賢者による多視点分析で最適な意思決定をサポート