# MAGI Decision System - ユーザーアクション手順書

## 📋 概要

Task 2.2 完了後、実際のAWSリソースをデプロイし、アプリケーションを動作させるための手順書です。

## 🚀 Step 1: AWS認証情報の設定

### 1.1 AWS CLIのインストール（未インストールの場合）

```bash
# Windows (PowerShell)
winget install Amazon.AWSCLI

# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 1.2 AWS認証情報の設定

```bash
# AWS認証情報を設定
aws configure

# 入力項目:
# AWS Access Key ID: [あなたのアクセスキー]
# AWS Secret Access Key: [あなたのシークレットキー]
# Default region name: ap-northeast-1
# Default output format: json
```

### 1.3 認証確認

```bash
# 認証情報の確認
aws sts get-caller-identity

# 正常な場合の出力例:
# {
#     "UserId": "AIDACKCEVSQ6C2EXAMPLE",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

## 🏗️ Step 2: Amplify リソースのデプロイ

### 2.1 Amplify プロジェクトの初期化

```bash
# プロジェクトルートで実行
npx ampx configure profile

# プロファイル名を入力（例: magi-dev）
# 上記で設定したAWS認証情報を使用
```

### 2.2 リソースのデプロイ

```bash
# 全リソースをデプロイ
npx ampx push

# デプロイ内容の確認:
# ✅ Auth (Amazon Cognito)
# ✅ Data (DynamoDB + AppSync)
# ✅ Functions (Lambda)
```

**⚠️ 重要**: デプロイには5-10分程度かかります。完了まで待機してください。

### 2.3 デプロイ完了の確認

```bash
# デプロイ状況の確認
npx ampx status

# 成功時の出力例:
# Current Environment: dev
# 
# | Category | Resource name   | Operation | Provider plugin   |
# | -------- | --------------- | --------- | ----------------- |
# | Auth     | magi-auth       | Create    | awscloudformation |
# | Api      | magi-api        | Create    | awscloudformation |
# | Function | agent-gateway   | Create    | awscloudformation |
```

## ⚙️ Step 3: 環境変数の設定

### 3.1 自動設定スクリプトの実行

```bash
# 環境変数自動設定スクリプトを実行
node scripts/setup-env.js
```

### 3.2 手動設定（自動設定が失敗した場合）

1. **amplify_outputs.json の確認**
   ```bash
   # ファイルが存在することを確認
   ls -la amplify_outputs.json
   ```

2. **.env.local ファイルの作成**
   ```bash
   # .env.local ファイルを作成
   touch .env.local
   ```

3. **環境変数の設定**
   ```env
   # .env.local に以下を記載
   NEXT_PUBLIC_AWS_REGION=ap-northeast-1
   NEXT_PUBLIC_USER_POOL_ID=[Cognito User Pool ID]
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=[Cognito Client ID]
   NEXT_PUBLIC_IDENTITY_POOL_ID=[Identity Pool ID]
   NEXT_PUBLIC_GRAPHQL_ENDPOINT=[AppSync GraphQL Endpoint]
   NEXT_PUBLIC_API_KEY=[AppSync API Key]
   ```

### 3.3 環境変数の値の取得方法

**amplify_outputs.json から取得:**
```bash
# User Pool ID
cat amplify_outputs.json | jq -r '.auth.user_pool_id'

# GraphQL Endpoint
cat amplify_outputs.json | jq -r '.data.url'
```

**AWS Console から取得:**
1. [AWS Console](https://console.aws.amazon.com/) にログイン
2. Cognito → User pools → 作成されたプール → General settings
3. AppSync → APIs → 作成されたAPI → Settings

## 🔐 Step 4: 認証設定の確認

### 4.1 Cognito User Pool の設定確認

```bash
# User Pool の詳細確認
aws cognito-idp describe-user-pool --user-pool-id [YOUR_USER_POOL_ID]
```

### 4.2 必要な設定項目の確認

**✅ チェックリスト:**
- [ ] Email認証が有効
- [ ] パスワードポリシーが設定済み
- [ ] MFA設定（オプション）
- [ ] ドメイン設定（オプション）

### 4.3 テストユーザーの作成（オプション）

```bash
# テストユーザーの作成
aws cognito-idp admin-create-user \
  --user-pool-id [YOUR_USER_POOL_ID] \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

## 🚀 Step 5: アプリケーションの起動と確認

### 5.1 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# または
yarn dev
```

### 5.2 動作確認

1. **アクセス確認**
   - ブラウザで http://localhost:3000 にアクセス
   - ページが正常に表示されることを確認

2. **認証機能の確認**
   - サインアップページの表示確認
   - サインインページの表示確認
   - 認証フローの動作確認

3. **API接続の確認**
   - ブラウザの開発者ツールでコンソールエラーがないことを確認
   - ネットワークタブでGraphQL APIへの接続確認

### 5.3 トラブルシューティング

**よくある問題と解決方法:**

1. **認証エラー**
   ```
   Error: Invalid credentials
   ```
   **解決方法**: AWS認証情報を再設定
   ```bash
   aws configure
   ```

2. **環境変数エラー**
   ```
   Error: Missing environment variables
   ```
   **解決方法**: .env.local ファイルの内容を確認

3. **GraphQL接続エラー**
   ```
   Error: Network error
   ```
   **解決方法**: GraphQLエンドポイントとAPI Keyを確認

## 📊 Step 6: 動作確認テスト

### 6.1 基本機能テスト

```bash
# テストスクリプトの実行
npm run test

# E2Eテストの実行（オプション）
npm run test:e2e
```

### 6.2 手動テストシナリオ

**✅ テストチェックリスト:**

1. **認証機能**
   - [ ] ユーザー登録
   - [ ] メール認証
   - [ ] ログイン
   - [ ] ログアウト

2. **データ操作**
   - [ ] 会話作成
   - [ ] メッセージ送信
   - [ ] 会話履歴表示
   - [ ] 会話削除

3. **エージェント機能（モック）**
   - [ ] メッセージ送信時のエージェント応答
   - [ ] 3賢者の応答表示
   - [ ] SOLOMON Judgeの評価表示

## 🔧 Step 7: 本番環境への準備（オプション）

### 7.1 本番環境用の設定

```bash
# 本番環境の作成
npx ampx push --environment production
```

### 7.2 ドメイン設定

```bash
# カスタムドメインの設定
npx ampx add hosting
```

### 7.3 CI/CD設定

```bash
# GitHub Actions用の設定
npx ampx configure cicd
```

## 📞 サポート情報

### 問題が発生した場合

1. **ログの確認**
   ```bash
   # Amplify ログの確認
   npx ampx logs
   
   # Next.js ログの確認
   npm run dev -- --verbose
   ```

2. **設定の再確認**
   ```bash
   # Amplify 設定の確認
   npx ampx status
   
   # 環境変数の確認
   cat .env.local
   ```

3. **リソースの再デプロイ**
   ```bash
   # 強制再デプロイ
   npx ampx push --force
   ```

### 参考リンク

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/)

## ✅ 完了確認

全ての手順が完了したら、以下を確認してください:

- [ ] AWS リソースが正常にデプロイされている
- [ ] 環境変数が正しく設定されている
- [ ] アプリケーションが正常に起動する
- [ ] 認証機能が動作する
- [ ] 基本的なデータ操作が可能

**🎉 おめでとうございます！** 
MAGI Decision System の基盤が正常に構築されました。次のフェーズでエージェント機能の実装に進むことができます。