# Streaming Backend セットアップガイド

このドキュメントは、Amplify Hostingのストリーミング制限を回避するため、バックエンドAPIをAgentCore Runtimeにデプロイする手順を説明します。

## 背景

AWS Amplify Hostingには以下の技術的制約があります：

- **ストリーミングレスポンス未対応**: HTTPストリーミングがサポートされていない
- **30秒タイムアウト制限**: 長時間処理でタイムアウトが発生
- **Lambda制約**: サーバーレス環境の制限

これらの制約により、リアルタイムなAIチャット体験の提供が困難です。

## 解決策アーキテクチャ

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Amplify Hosting │ ← フロントエンド（静的ホスティング）
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AgentCore       │ ← バックエンドAPI（ストリーミング対応）
│   Runtime       │
│  (Container)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Amazon Bedrock  │
│   (Claude AI)   │
└─────────────────┘
```

## セットアップ手順

### 1. 前提条件

- AWS CLIがインストール・設定済み
- Docker Desktop（Buildx対応）がインストール済み
- 適切なIAM権限（ECR、AgentCore、Bedrock）

### 2. 環境変数設定

`.env.local`に以下を追加：

```bash
# 開発環境
NEXT_PUBLIC_LOCAL_BACKEND_URL=http://localhost:8080

# プロダクション環境（デプロイ後に設定）
# NEXT_PUBLIC_AGENT_ARN=arn:aws:bedrock-agentcore:ap-northeast-1:YOUR_ACCOUNT_ID:runtime/magisystem-backend
# NEXT_PUBLIC_AWS_REGION=ap-northeast-1
# NEXT_PUBLIC_QUALIFIER=DEFAULT
```

### 3. ローカル開発

バックエンドAPIをローカルで起動：

```bash
# ポート8080で起動
npm run dev

# 別ターミナルでヘルスチェック
curl http://localhost:8080/ping
```

### 4. ECRへのデプロイ

デプロイスクリプトを実行：

```bash
# スクリプトに実行権限を付与
chmod +x scripts/deploy-backend.sh

# デプロイ実行
./scripts/deploy-backend.sh
```

出力されるイメージURIをメモしてください：
```
YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/magisystem-backend:latest
```

### 5. AgentCore Runtime設定

#### 5.1 ランタイム作成

1. AWS Bedrock AgentCoreコンソールにアクセス
2. 「Runtimes」→「Create runtime」
3. 設定値：
   - **名前**: `magisystem-backend`
   - **コンテナイメージURI**: 上記のイメージURI
   - **ポート**: `8080`
   - **アーキテクチャ**: `ARM64`

#### 5.2 インバウンド認証設定

1. 「Inbound identity configuration」
2. 設定値：
   - **認証タイプ**: `Use JSON Web Tokens (JWT)`
   - **JWT Schema**: `Use existing identity provider configuration`
   - **Discovery URL**: `https://cognito-idp.ap-northeast-1.amazonaws.com/{USER_POOL_ID}/.well-known/openid-configuration`
   - **Allowed clients**: CognitoクライアントID

#### 5.3 IAMロール設定

AgentCore Runtimeの実行ロールに以下のポリシーを追加：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

### 6. フロントエンド環境変数更新

AgentCore Runtimeのデプロイ後、ARNを取得して環境変数を更新：

```bash
# .env.localを更新
NEXT_PUBLIC_AGENT_ARN=arn:aws:bedrock-agentcore:ap-northeast-1:YOUR_ACCOUNT_ID:runtime/magisystem-backend
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
NEXT_PUBLIC_QUALIFIER=DEFAULT
```

### 7. Amplifyへのデプロイ

フロントエンドをAmplifyにデプロイ：

```bash
# Amplify環境変数を設定
amplify env add prod

# デプロイ
amplify push
```

## API仕様

### POST /invocations

チャット処理エンドポイント

**リクエスト**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "こんにちは"
    }
  ]
}
```

**レスポンス**: ストリーミング形式（Server-Sent Events）

### GET /ping

ヘルスチェックエンドポイント

**レスポンス**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "magisystem-backend",
  "version": "1.0.0"
}
```

## トラブルシューティング

### ローカルでストリーミングが動作しない

- ポート8080が使用中でないか確認
- `npm run dev`でサーバーが起動しているか確認

### AgentCore Runtimeでエラーが発生

- IAMロールにBedrock権限があるか確認
- コンテナログをCloudWatch Logsで確認
- イメージがARM64アーキテクチャでビルドされているか確認

### 認証エラー

- Cognito User Pool IDが正しいか確認
- クライアントIDがAllowed clientsに含まれているか確認
- JWTトークンが有効期限内か確認

## 参考資料

- [Qiita記事: Amplify HostingでのStreaming制限回避](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- [AWS Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/)
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
