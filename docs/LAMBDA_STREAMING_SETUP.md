# Lambda Response Streaming セットアップガイド

このガイドでは、Bedrock Agent Streaming Lambda関数のデプロイと設定方法を説明します。

## 📋 前提条件

- AWS CLI がインストールされていること
- Amplify CLI がインストールされていること
- AWS アカウントの認証情報が設定されていること

## 🚀 デプロイ手順

### 1. Amplifyバックエンドのデプロイ

```bash
# Amplify Sandboxを起動（開発環境）
npx ampx sandbox

# または本番環境にデプロイ
npx ampx deploy
```

### 2. Lambda関数名の確認

デプロイ後、Lambda関数名を確認します:

```bash
# Amplifyスタック名を確認
aws cloudformation list-stacks --query "StackSummaries[?contains(StackName, 'amplify')].StackName"

# Lambda関数名を確認
aws lambda list-functions --query "Functions[?contains(FunctionName, 'bedrock-agent-streaming')].FunctionName"
```

### 3. Lambda Response Streamingの有効化

**重要**: Amplify Gen2では現在、Lambda Response Streamingの設定が自動化されていないため、
デプロイ後に手動で設定する必要があります。

```bash
# Lambda関数のinvokeModeをRESPONSE_STREAMに変更
aws lambda update-function-configuration \
  --function-name <your-function-name> \
  --invoke-mode RESPONSE_STREAM
```

例:
```bash
aws lambda update-function-configuration \
  --function-name amplify-magiapp-dev-bedrockAgentStreaming \
  --invoke-mode RESPONSE_STREAM
```

### 4. Lambda関数URLの作成

Lambda関数URLを作成して、HTTPSエンドポイントを取得します:

```bash
# Lambda関数URLを作成
aws lambda create-function-url-config \
  --function-name <your-function-name> \
  --auth-type NONE \
  --cors '{
    "AllowOrigins": ["*"],
    "AllowMethods": ["POST"],
    "AllowHeaders": ["Content-Type"],
    "MaxAge": 86400
  }'
```

**セキュリティ注意**: 本番環境では`auth-type`を`AWS_IAM`に変更し、
適切な認証を設定してください。

### 5. Lambda関数URLの確認

作成されたLambda関数URLを確認します:

```bash
aws lambda get-function-url-config \
  --function-name <your-function-name>
```

出力例:
```json
{
  "FunctionUrl": "https://abc123xyz.lambda-url.ap-northeast-1.on.aws/",
  "FunctionArn": "arn:aws:lambda:ap-northeast-1:123456789012:function:amplify-magiapp-dev-bedrockAgentStreaming",
  "AuthType": "NONE",
  "Cors": {
    "AllowOrigins": ["*"],
    "AllowMethods": ["POST"],
    "AllowHeaders": ["Content-Type"],
    "MaxAge": 86400
  },
  "CreationTime": "2024-01-01T00:00:00.000Z"
}
```

### 6. 環境変数の設定

Lambda関数URLを`.env.local`に追加します:

```bash
# .env.local
BEDROCK_STREAMING_LAMBDA_URL=https://abc123xyz.lambda-url.ap-northeast-1.on.aws/
```

### 7. 動作確認

開発サーバーを起動して動作を確認します:

```bash
npm run dev
```

ブラウザで`http://localhost:3000/chat`にアクセスし、
メッセージを送信してストリーミングが動作することを確認します。

## 🔧 トラブルシューティング

### Lambda関数が見つからない

```bash
# すべてのLambda関数を確認
aws lambda list-functions --query "Functions[].FunctionName"
```

### Lambda関数URLが作成できない

Lambda関数URLは、Lambda関数がデプロイされた後にのみ作成できます。
Amplifyのデプロイが完了していることを確認してください。

### ストリーミングが動作しない

1. Lambda関数の`invokeMode`が`RESPONSE_STREAM`に設定されているか確認:

```bash
aws lambda get-function-configuration \
  --function-name <your-function-name> \
  --query "InvokeMode"
```

2. Lambda関数URLが正しく設定されているか確認:

```bash
echo $BEDROCK_STREAMING_LAMBDA_URL
```

3. CloudWatch Logsでエラーを確認:

```bash
aws logs tail /aws/lambda/<your-function-name> --follow
```

## 📊 パフォーマンス監視

### CloudWatch Metricsの確認

```bash
# Lambda関数のメトリクスを確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=<your-function-name> \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average,Maximum
```

### ストリーミングパフォーマンスの確認

- **初回応答時間**: <2秒
- **チャンク配信間隔**: 20-50ms
- **メモリ使用量**: <512MB（ストリーミング時）

## 🔐 セキュリティ設定（本番環境）

### 1. IAM認証の有効化

```bash
# Lambda関数URLの認証タイプを変更
aws lambda update-function-url-config \
  --function-name <your-function-name> \
  --auth-type AWS_IAM
```

### 2. IAMポリシーの作成

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunctionUrl",
      "Resource": "arn:aws:lambda:ap-northeast-1:123456789012:function:amplify-magiapp-prod-bedrockAgentStreaming"
    }
  ]
}
```

### 3. Cognito認証との統合

Next.js API Routeで認証トークンを検証し、Lambda関数URLにリクエストを転送します。

## 📚 参考資料

- [AWS Lambda Response Streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html)
- [Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
- [Bedrock Agent Runtime Streaming](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-streaming.html)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🎯 次のステップ

1. ✅ Lambda関数のデプロイ
2. ✅ Response Streamingの有効化
3. ✅ Lambda関数URLの作成
4. ⏳ Bedrock AgentCoreとの統合
5. ⏳ OpenTelemetryトレーシングの追加
6. ⏳ 本番環境へのデプロイ
