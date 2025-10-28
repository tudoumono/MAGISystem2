# Environment Setup Guide - MAGI Decision System

このガイドでは、MAGI Decision SystemのPhase 1-2（モックデータ）からPhase 3（実AWS環境）への移行方法を説明します。

## 📋 概要

MAGI Decision Systemは段階的開発アプローチを採用しており、以下の3つの環境モードをサポートしています：

- **MOCK Mode (Phase 1-2)**: モックデータを使用したフロントエンド開発
- **DEVELOPMENT Mode (Phase 3)**: 実AWS環境での開発・テスト
- **PRODUCTION Mode (Phase 4-6)**: 本番環境での運用

## 🚀 クイックスタート

### 自動セットアップ（推奨）

```bash
# 自動セットアップスクリプトを実行
npm run setup:amplify
```

このスクリプトが以下を自動実行します：
1. 環境状態の診断
2. AWS リソースのデプロイ
3. 環境変数の設定
4. 開発サーバーの再起動指示

### 手動セットアップ

1. **AWS リソースのデプロイ**
   ```bash
   npx ampx push
   ```

2. **環境変数の設定**
   ```bash
   # .env.local ファイルを作成
   cp .env.local.template .env.local
   
   # amplify_outputs.json から値をコピー
   # 詳細は後述の「環境変数設定」セクションを参照
   ```

3. **開発サーバーの再起動**
   ```bash
   npm run dev
   ```

## 🔧 詳細セットアップ手順

### 1. 前提条件の確認

```bash
# Node.js バージョン確認（18以上が必要）
node --version

# npm バージョン確認
npm --version

# AWS CLI 設定確認
aws configure list
```

### 2. 依存関係のインストール

```bash
# プロジェクトの依存関係をインストール
npm install

# Amplify CLI の確認
npx ampx --version
```

### 3. AWS 認証情報の設定

AWS リソースをデプロイするには、適切な権限を持つAWS認証情報が必要です。

#### 必要な権限

- `PowerUserAccess` または以下の個別権限：
  - `AmazonCognitoFullAccess`
  - `AmazonDynamoDBFullAccess`
  - `AWSAppSyncAdministrator`
  - `IAMFullAccess`
  - `AWSCloudFormationFullAccess`

#### 認証情報の設定方法

```bash
# AWS CLI での設定
aws configure

# または環境変数での設定
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ap-northeast-1
```

### 4. Amplify リソースのデプロイ

```bash
# サンドボックス環境でのデプロイ（5-10分程度）
npx ampx sandbox --once

# または継続的なサンドボックス環境
npx ampx sandbox

# デプロイ状況の確認
npx ampx info
```

デプロイが完了すると、`amplify_outputs.json` ファイルが生成されます。

### 5. 環境変数の設定

`amplify_outputs.json` から必要な値を `.env.local` にコピーします：

```bash
# .env.local ファイルの作成
cat > .env.local << EOF
# AWS Region
NEXT_PUBLIC_AWS_REGION=ap-northeast-1

# Cognito Configuration
NEXT_PUBLIC_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_IDENTITY_POOL_ID=ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# AppSync Configuration
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://xxxxxxxxxxxxxxxxxxxxxxxxxx.appsync-api.ap-northeast-1.amazonaws.com/graphql
NEXT_PUBLIC_API_KEY=da2-xxxxxxxxxxxxxxxxxxxxxxxxxx

# Environment Mode
AMPLIFY_MODE=DEVELOPMENT
EOF
```

### 6. 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスし、環境状態を確認します。

## 📊 環境状態の確認

### 環境ステータスコンポーネント

開発環境では、画面右下に環境状態を表示するコンポーネントが表示されます：

- **🔧 Development Mode**: AWS リソースに接続済み
- **📱 Mock Mode**: モックデータを使用中
- **🚀 Production Mode**: 本番環境

### コマンドラインでの確認

```bash
# Amplify リソースの状態確認
npm run amplify:status

# 環境設定の検証
npm run check:amplify

# AWS ログの確認
npm run amplify:logs
```

## 🌱 データシーディング（2025年新機能）

開発環境では、サンプルデータを自動投入できます：

### 自動シーディング

```typescript
import { seedDevelopmentData } from '@/lib/amplify/seeding';

// 開発データの投入
await seedDevelopmentData({
  environment: 'development',
  enablePresets: true,
  enableSampleConversations: true,
  enableTraceData: true,
});
```

### 投入されるデータ

1. **エージェントプリセット**
   - デフォルト設定
   - 学術研究用設定
   - ビジネス分析用設定
   - 創造的思考用設定

2. **サンプル会話**
   - AIの倫理的活用
   - リモートワーク制度
   - 新技術への投資判断
   - サステナビリティ戦略

3. **トレースデータ**
   - 実行ステップの履歴
   - パフォーマンスメトリクス
   - エラー・リトライ情報

## 🔄 環境モードの切り替え

### 環境変数による制御

```bash
# モックモードに切り替え
export AMPLIFY_MODE=MOCK

# 開発モードに切り替え
export AMPLIFY_MODE=DEVELOPMENT

# 本番モードに切り替え
export AMPLIFY_MODE=PRODUCTION
```

### プログラムでの制御

```typescript
import { getCurrentEnvironmentMode, isProductionMode, isDevelopmentMode } from '@/lib/amplify/config';

// 現在のモードを取得
const mode = getCurrentEnvironmentMode();

// 本番環境判定
if (isProductionMode()) {
  console.log('Running in production mode');
}

// 開発環境判定
if (isDevelopmentMode()) {
  console.log('Running in development mode');
}
```

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### 1. `amplify_outputs.json` が見つからない

```bash
# 解決方法: AWS リソースをデプロイ
npx ampx push
```

#### 2. 認証エラー

```bash
# AWS 認証情報を確認
aws configure list

# 権限を確認
aws sts get-caller-identity
```

#### 3. デプロイエラー

```bash
# 詳細ログでデプロイを実行
npx ampx push --debug

# CloudFormation スタックを確認
aws cloudformation describe-stacks
```

#### 4. 環境変数が反映されない

```bash
# 開発サーバーを再起動
npm run dev

# 環境変数を確認
echo $AMPLIFY_MODE
```

### ログの確認

```bash
# Amplify ログ
npm run amplify:logs

# CloudWatch ログ
aws logs describe-log-groups --log-group-name-prefix "/aws/amplify"

# Next.js ログ
# ブラウザの開発者ツールでコンソールを確認
```

## 📚 関連ドキュメント

- [Amplify Gen2 Documentation](https://docs.amplify.aws/)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [AWS Cognito User Guide](https://docs.aws.amazon.com/cognito/)
- [AWS AppSync Developer Guide](https://docs.aws.amazon.com/appsync/)

## 🔐 セキュリティ考慮事項

### 開発環境

- `.env.local` ファイルは `.gitignore` に含まれています
- API キーは開発・テスト用途のみに使用
- 本番環境では Cognito 認証を使用

### 本番環境

- 環境変数は安全な方法で管理
- API キー認証は無効化
- CloudWatch ログで監査証跡を確保

## 💡 ベストプラクティス

### 開発フロー

1. **Phase 1-2**: モックデータでUI開発
2. **Phase 3**: 実AWS環境で統合テスト
3. **Phase 4-6**: 本番環境でのデプロイ

### データ管理

- 開発環境では定期的にデータをリセット
- 本番データは適切にバックアップ
- 個人情報は適切に匿名化

### パフォーマンス

- 開発環境では詳細ログを有効化
- 本番環境では必要最小限のログ
- CloudWatch メトリクスで監視

## 🆘 サポート

問題が解決しない場合は、以下の情報を含めてサポートに連絡してください：

1. 環境情報（OS、Node.js バージョン等）
2. エラーメッセージの全文
3. 実行したコマンドの履歴
4. `amplify_outputs.json` の存在確認
5. AWS 認証情報の設定状況

```bash
# 診断レポートの生成
npm run check:amplify > diagnostic-report.txt
```