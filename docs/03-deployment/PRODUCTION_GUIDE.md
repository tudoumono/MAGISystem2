# 本番環境デプロイガイド

MAGI Decision Systemを本番環境にデプロイする手順を説明します。

## 📋 前提条件

- AWS アカウント（管理者権限）
- Amazon Bedrock有効化（ap-northeast-1）
- Claude 3.5 Sonnetモデルアクセス権限
- AWS CLI v2インストール済み

## 🚀 デプロイ手順

### 1. AWS認証情報の設定

```bash
aws configure
# AWS Access Key ID: [管理者キー]
# AWS Secret Access Key: [シークレット]
# Default region name: ap-northeast-1
# Default output format: json
```

### 2. CDKブートストラップ（初回のみ）

```bash
# CDK環境の初期化
npx cdk bootstrap aws://ACCOUNT-ID/ap-northeast-1
```

**注意**: 管理者権限が必要です。一度実行すれば以降不要。

### 3. Amplify Gen 2デプロイ

```bash
# Amplifyリソースのデプロイ
npx ampx sandbox

# 本番環境へのデプロイ
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

### 4. AgentCore Runtimeのデプロイ

```bash
cd agents

# Dockerイメージのビルド
docker build -t magi-agentcore -f Dockerfile .

# ECRへのプッシュ
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com

docker tag magi-agentcore:latest ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com/magi-agentcore:latest
docker push ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com/magi-agentcore:latest
```

### 5. Amplify Hostingの設定

1. **AWSコンソール** → **Amplify** → **アプリを選択**
2. **ホスティング** → **ビルド設定**
3. `amplify.yml`を以下のように設定:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 6. 環境変数の設定

Amplifyコンソールで以下の環境変数を設定:

```
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
AGENTCORE_URL=https://your-agentcore-endpoint.amazonaws.com
```

### 7. デプロイの確認

```bash
# デプロイ状態の確認
npx ampx sandbox status

# エンドポイントのテスト
curl https://your-app.amplifyapp.com/api/ping
```

## 🔍 トラブルシューティング

### Bedrock権限エラー

```bash
# IAMポリシーを確認
aws iam get-user-policy --user-name YOUR_USER --policy-name BedrockAccess

# 必要に応じてポリシーを追加
aws iam put-user-policy --user-name YOUR_USER --policy-name BedrockAccess --policy-document file://bedrock-policy.json
```

### Dockerビルドエラー

```bash
# キャッシュをクリアして再ビルド
docker build --no-cache -t magi-agentcore -f Dockerfile .
```

### Amplifyデプロイエラー

```bash
# ログを確認
npx ampx sandbox logs

# リソースを再作成
npx ampx sandbox delete
npx ampx sandbox
```

## 📊 デプロイ後の確認

### 1. ヘルスチェック

```bash
# フロントエンド
curl https://your-app.amplifyapp.com

# AgentCore Runtime
curl https://your-agentcore-endpoint.amazonaws.com/api/ping
```

### 2. MAGIエージェントのテスト

```bash
# テストリクエスト
curl -X POST https://your-app.amplifyapp.com/api/invocations \
  -H "Content-Type: application/json" \
  -d '{"question": "AIの未来について教えてください"}'
```

### 3. モニタリング設定

- **CloudWatch Logs**: エラーログの確認
- **X-Ray**: トレース分析
- **CloudWatch Metrics**: パフォーマンス監視

## 🔒 セキュリティ設定

### 1. 認証の有効化

Amplify Authを使用してユーザー認証を設定:

```typescript
// amplify/auth/resource.ts
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
```

### 2. CORS設定

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ];
  },
};
```

## 💰 コスト最適化

### 推奨設定

- **Bedrock**: On-Demand料金（初期）→ Provisioned Throughput（高負荷時）
- **Lambda**: メモリ最適化（1024MB推奨）
- **CloudWatch Logs**: 保持期間7日間

詳細は[コスト見積もりガイド](../05-operations/COST_ESTIMATION.md)を参照。

## 📚 関連ドキュメント

- [デプロイチェックリスト](./CHECKLIST.md)
- [アーキテクチャ概要](../02-architecture/OVERVIEW.md)
- [AgentCore設定](../04-agent-configuration/AGENTCORE_SETUP.md)
