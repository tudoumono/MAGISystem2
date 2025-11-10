# MAGI System Deployment Guide - AgentCore Runtime + Python統合版

## 📚 概要

このガイドは、[参考記事](https://qiita.com/moritalous/items/ea695f8a328585e1313b)のAgentCore Runtimeコンセプトを採用し、AWS Strands Agentsを使用したPython統合を追加した実装のデプロイ手順です。

### 参考記事との違い

**参考記事の実装:**
```
AgentCore Runtime → @ai-sdk/amazon-bedrock → Bedrock API
```

**MAGI実装:**
```
AgentCore Runtime → spawn(python) → Strands Agents → Bedrock API
```

MAGI独自の3賢者システム（CASPAR/BALTHASAR/MELCHIOR + SOLOMON Judge）をStrands Agentsで実装しています。

### アーキテクチャ

```
┌─────────────────────────────────────────┐
│   Amplify Hosting (Next.js Frontend)    │
│   - 静的ホスティング                     │
│   - fetch('/invocations')               │
└─────────────────────────────────────────┘
              ↓ HTTP POST
┌─────────────────────────────────────────┐
│ AgentCore Runtime (1つのDockerコンテナ)  │
│                                         │
│  ┌────────────────────────────────┐   │
│  │ Next.jsバックエンド (port 8080) │   │
│  │ - POST /api/invocations        │   │
│  │ - GET /api/ping                │   │
│  └────────────────────────────────┘   │
│              ↓ spawn()                 │
│  ┌────────────────────────────────┐   │
│  │ Python magi_agent.py           │   │
│  │ - 子プロセスとして実行          │   │
│  └────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓ InvokeModel
┌─────────────────────────────────────────┐
│      Amazon Bedrock API                 │
│      - Claude 3.5 Sonnet                │
└─────────────────────────────────────────┘
```

## 🚀 クイックスタート

### 1. AgentCore Runtimeのビルド

```bash
cd agents

# Dockerイメージのビルド
docker build -t magi-agentcore-runtime .

# ローカルで起動（テスト用）
docker run -p 8080:8080 \
  -e AWS_REGION=ap-northeast-1 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  magi-agentcore-runtime
```

### 2. ヘルスチェック

```bash
# Pingエンドポイント確認
curl http://localhost:8080/api/ping

# 期待されるレスポンス:
# {
#   "status": "healthy",
#   "service": "MAGI AgentCore Runtime",
#   "version": "1.0.0"
# }
```

### 3. 動作テスト

```bash
# Invocationsエンドポイントテスト
curl -X POST http://localhost:8080/api/invocations \
  -H "Content-Type: application/json" \
  -d '{"question": "Hello, MAGI System!"}'

# Server-Sent Eventsストリームが返ってくることを確認
```

## 📦 AgentCore Runtimeのデプロイ

### Option 1: AWS App Runner（推奨）

```bash
# 1. ECRリポジトリ作成
aws ecr create-repository \
  --repository-name magi-agentcore-runtime \
  --region ap-northeast-1

# 2. Dockerイメージをプッシュ
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

docker tag magi-agentcore-runtime:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/magi-agentcore-runtime:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/magi-agentcore-runtime:latest

# 3. App Runnerサービス作成（AWS Consoleまたはterraform推奨）
# - ポート: 8080
# - ヘルスチェック: /api/ping
# - 環境変数: AWS_REGION=ap-northeast-1
```

### Option 2: ECS Fargate

```bash
# 1. タスク定義作成（task-definition.json）
{
  "family": "magi-agentcore-runtime",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "agentcore",
    "image": "YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/magi-agentcore-runtime:latest",
    "portMappings": [{
      "containerPort": 8080,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "AWS_REGION", "value": "ap-northeast-1"},
      {"name": "NODE_ENV", "value": "production"}
    ],
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:8080/api/ping || exit 1"]
    }
  }]
}

# 2. サービス作成
aws ecs create-service \
  --cluster your-cluster \
  --service-name magi-agentcore-runtime \
  --task-definition magi-agentcore-runtime \
  --desired-count 1 \
  --launch-type FARGATE
```

## 🌐 Amplify Hostingのデプロイ

### 1. 環境変数の設定

Amplify Consoleで以下の環境変数を設定：

```bash
# AgentCore RuntimeのURL（必須）
NEXT_PUBLIC_AGENTCORE_URL=https://your-agentcore-runtime-url.awsapprunner.com

# AWSリージョン
NEXT_PUBLIC_AWS_REGION=ap-northeast-1

# その他の設定
NODE_ENV=production
```

### 2. Amplifyアプリの作成

```bash
# amplify pushでデプロイ
amplify push

# または、GitHubと連携して自動デプロイ
```

### 3. 動作確認

```bash
# フロントエンドからAgentCore Runtimeへの接続確認
# ブラウザで https://your-amplify-app.amplifyapp.com にアクセス
# ブラウザのDevToolsでネットワークタブを開き、
# /api/invocations へのリクエストが成功することを確認
```

## 🔧 トラブルシューティング

### AgentCore Runtimeに接続できない

**症状**: フロントエンドから /api/invocations に接続できない

**解決方法**:
1. `NEXT_PUBLIC_AGENTCORE_URL` が正しく設定されているか確認
2. AgentCore RuntimeのURLが正しいか確認
3. CORSエラーがないか確認（/api/invocations はCORS設定済み）
4. AgentCore Runtimeのヘルスチェック (`/api/ping`) が成功するか確認

```bash
# AgentCore Runtimeの状態確認
curl https://your-agentcore-runtime-url.awsapprunner.com/api/ping
```

### Pythonプロセスが起動しない

**症状**: /api/invocations が500エラーを返す

**解決方法**:
1. Dockerコンテナ内でPythonパスが正しいか確認
2. `magi_agent.py` が `/app/magi_agent.py` に存在するか確認
3. Python依存関係がインストールされているか確認

```bash
# Dockerコンテナ内で確認
docker exec -it <container_id> bash
python --version
ls -la /app/magi_agent.py
```

### ストリーミングが途中で切れる

**症状**: Server-Sent Eventsが途中で終了する

**解決方法**:
1. App RunnerまたはECSのタイムアウト設定を確認（最低120秒）
2. Pythonスクリプトのエラーログを確認
3. CloudWatch Logsで詳細なエラーを確認

## 📊 監視とログ

### CloudWatch Logs

AgentCore Runtimeのログは自動的にCloudWatch Logsに送信されます：

```bash
# ログストリームの確認
aws logs tail /aws/apprunner/magi-agentcore-runtime --follow
```

### ヘルスチェック

```bash
# 定期的にヘルスチェック
watch -n 5 'curl https://your-agentcore-runtime-url.awsapprunner.com/api/ping'
```

## 🔒 セキュリティ

### 推奨設定

1. **HTTPS必須**: AgentCore RuntimeはHTTPSでのみアクセス可能にする
2. **IAMロール**: EC2/ECS/App RunnerにBedrockアクセス用のIAMロールをアタッチ
3. **環境変数**: AWS認証情報は環境変数ではなくIAMロールを使用
4. **ネットワーク**: 可能であればVPC内に配置し、Amplify Hostingからのみアクセス可能にする

### IAMポリシー例

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

## 📚 参考資料

- [参考記事: Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Amazon ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Amplify Hosting Documentation](https://docs.aws.amazon.com/amplify/)

## ❓ よくある質問

### Q: Lambda Function URLは使わないのですか？

A: 参考記事では、AgentCore Runtime（Dockerコンテナ）として実装しています。Lambda Function URLではなく、App RunnerやECS Fargateを使用します。

### Q: AWS SDKは使わないのですか？

A: フロントエンドからAgentCore Runtimeへの呼び出しには通常のHTTP fetchを使用します。AgentCore Runtime内部では、Pythonスクリプトが `boto3` (AWS SDK for Python) を使用してBedrockにアクセスします。

### Q: 参考記事の実装とどう違うのですか？

A:
- **参考記事**: Next.jsから直接 `@ai-sdk/amazon-bedrock` でBedrock呼び出し
- **MAGI実装**: Next.jsから spawn() でPythonエージェント起動 → AWS Strands Agents使用

MAGIシステムは、参考記事のAgentCore Runtimeコンセプトを採用しつつ、既存のPythonエージェント（Strands Agents）を活用する独自の拡張を追加しています。

### Q: PR #5の実装（BedrockAgentCoreClient方式）とどう違うのですか？

A: PR #5では、フロントエンドから `BedrockAgentCoreClient` を使用してAWS SDKで直接呼び出す実装でしたが、これは誤った方向性でした。MAGIの正しい実装では、AgentCore Runtime内でNext.jsとPythonを統合し、spawn()で子プロセスとして呼び出すアーキテクチャを採用しています。

## 🎯 次のステップ

1. ローカルでの動作確認
2. AgentCore RuntimeのECRへのプッシュ
3. App RunnerまたはECS Fargateでのデプロイ
4. Amplify Hostingの環境変数設定
5. 本番環境での動作確認
6. 監視とアラートの設定

---

**更新日**: 2025-11-09
**バージョン**: 1.0
**ステータス**: ✅ 参考記事コンセプト + Python統合の実装完了
