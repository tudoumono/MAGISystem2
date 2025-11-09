# AgentCore Runtime セットアップガイド

MAGI Decision SystemのAgentCore Runtime環境構築手順を説明します。

## 📋 概要

AgentCore Runtimeは、Amazon Bedrockのマネージド実行環境です。Dockerコンテナとして実行され、自動スケーリング・モニタリングが提供されます。

## 🏗️ アーキテクチャ

```
Amplify Hosting (Next.js Frontend)
    ↓ useChat() → /invocations
┌─────────────────────────────────────────────────────────┐
│ AgentCore Runtime (1つのDockerコンテナ)                 │
│                                                          │
│  Next.jsバックエンド                                     │
│  - ポート8080でHTTPリクエスト受信                        │
│  - POST /invocations                                    │
│  - GET /ping                                            │
│  ↓ spawn('python', ['magi_agent.py'])                  │
│                                                          │
│  Python magi_agent.py                                   │
│  - Strands Agents実装                                   │
│  - 3賢者 + SOLOMON Judge                                │
│                                                          │
│  Dockerfile: FROM ubuntu:22.04 + Node.js + Python      │
└─────────────────────────────────────────────────────────┘
```

## 🚀 セットアップ手順

### 1. Dockerfileの確認

`agents/Dockerfile`が参考記事準拠の構成になっていることを確認:

```dockerfile
# ベースイメージ: Ubuntu 22.04
FROM ubuntu:22.04

# Node.js 18.x + Python 3.11
# Next.jsバックエンド + Pythonエージェント統合
# ポート8080公開
```

### 2. ローカルビルドテスト

```bash
cd agents

# Dockerイメージのビルド
docker build -t magi-agentcore -f Dockerfile .

# ローカル実行テスト
docker run -p 8080:8080 \
  -e AWS_REGION=ap-northeast-1 \
  -e AWS_ACCESS_KEY_ID=your-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret \
  magi-agentcore
```

### 3. エンドポイントのテスト

```bash
# ヘルスチェック
curl http://localhost:8080/api/ping

# MAGIエージェント実行
curl -X POST http://localhost:8080/api/invocations \
  -H "Content-Type: application/json" \
  -d '{"question": "AIの未来について教えてください"}'
```

## 🔧 環境変数設定

### 必須環境変数

```bash
# AWS基本設定
AWS_REGION=ap-northeast-1
AWS_ACCOUNT_ID=123456789012

# Python実行設定
PYTHONPATH=/app
MAGI_SCRIPT_PATH=/app/magi_agent.py
PYTHON_PATH=python

# Next.js設定
NODE_ENV=production
PORT=8080
HOSTNAME=0.0.0.0
```

### オプション環境変数

```bash
# デバッグモード
DEBUG_STREAMING=true

# AgentCore Runtime ARN（デプロイ後に設定）
MAGI_AGENT_ARN=arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/magi_agent-xxxxx
```

## 📦 ECRへのデプロイ

### 1. ECRリポジトリの作成

```bash
# ECRリポジトリ作成
aws ecr create-repository \
  --repository-name magi-agentcore \
  --region ap-northeast-1
```

### 2. Dockerイメージのプッシュ

```bash
# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com

# イメージのタグ付け
docker tag magi-agentcore:latest \
  ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com/magi-agentcore:latest

# プッシュ
docker push ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com/magi-agentcore:latest
```

### 3. AgentCore Runtimeの作成

AWSコンソールで以下を設定:

1. **Bedrock** → **AgentCore Runtime** → **Create runtime**
2. **Runtime name**: `magi-agentcore`
3. **Container image**: ECRイメージURI
4. **Port**: `8080`
5. **Environment variables**: 上記の必須環境変数を設定

## 🔍 トラブルシューティング

### Dockerビルドエラー

```bash
# キャッシュをクリアして再ビルド
docker build --no-cache -t magi-agentcore -f Dockerfile .

# ビルドログの詳細表示
docker build --progress=plain -t magi-agentcore -f Dockerfile .
```

### Python依存関係エラー

```bash
# requirements.txtの確認
cat requirements.txt

# 依存関係の手動インストールテスト
pip install -r requirements.txt
```

### Next.jsビルドエラー

```bash
# backend/ディレクトリの確認
ls -la agents/backend/

# package.jsonの確認
cat agents/backend/package.json
```

### ポート8080接続エラー

```bash
# コンテナ内のプロセス確認
docker exec -it <container-id> ps aux

# ポート使用状況の確認
docker exec -it <container-id> netstat -tuln | grep 8080
```

## 📊 モニタリング

### CloudWatch Logs

```bash
# ログストリームの確認
aws logs describe-log-streams \
  --log-group-name /aws/bedrock/agentcore/magi-agentcore \
  --region ap-northeast-1

# ログの取得
aws logs tail /aws/bedrock/agentcore/magi-agentcore --follow
```

### メトリクス

- **Invocations**: リクエスト数
- **Duration**: 実行時間
- **Errors**: エラー率
- **Throttles**: スロットリング発生数

## 🔗 関連ドキュメント

- [カスタムプロンプト設定](./CUSTOM_PROMPTS.md)
- [モデル設定](./MODEL_CONFIGURATION.md)
- [本番デプロイガイド](../03-deployment/PRODUCTION_GUIDE.md)

## 📚 参考資料

- [参考記事: Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- [Amazon Bedrock AgentCore ドキュメント](https://docs.aws.amazon.com/bedrock/)
- [Strands Agents公式ドキュメント](https://strandsagents.com/latest/)
