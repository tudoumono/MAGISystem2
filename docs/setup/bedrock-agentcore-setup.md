# Amazon Bedrock AgentCore統合セットアップガイド

このドキュメントは、MAGI Decision UIとAmazon Bedrock AgentCoreの統合に必要な手順を詳しく説明します。

## 📋 前提条件

- AWS アカウント
- AWS CLI がインストール・設定済み
- Node.js 18+ がインストール済み
- 適切なIAM権限を持つAWSユーザー

## 🔧 必要なIAM権限

### 基本権限

以下のAWS管理ポリシーをIAMユーザーまたはロールにアタッチしてください：

```bash
# 必須ポリシー
AmazonBedrockFullAccess
BedrockAgentCoreFullAccess

# 追加推奨ポリシー（観測可能性用）
CloudWatchFullAccess
AWSXRayFullAccess
```

### カスタムポリシー（最小権限の場合）

より細かい権限制御が必要な場合は、以下のカスタムポリシーを作成してください：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockAgentCoreBasic",
      "Effect": "Allow",
      "Action": [
        "bedrock-agentcore:*",
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels",
        "bedrock:GetFoundationModel"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ObservabilityServices",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
        "xray:GetSamplingRules",
        "xray:GetSamplingTargets"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMRoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/*BedrockAgentCore*",
        "arn:aws:iam::*:role/service-role/*BedrockAgentCore*"
      ]
    }
  ]
}
```

## 🚀 セットアップ手順

### Step 1: AWS Console での設定

#### 1.1 Bedrock モデルアクセス権限の有効化

1. AWS Consoleにログイン
2. Amazon Bedrockサービスに移動
3. 左側メニューから「Model access」を選択
4. 以下のモデルへのアクセスを有効化：
   - **Anthropic Claude 3.5 Sonnet** (推奨)
   - **Anthropic Claude 3 Haiku** (コスト効率)
   - **Amazon Titan Text G1 - Express** (バックアップ)

#### 1.2 CloudWatch Transaction Search の有効化

1. CloudWatch コンソールに移動
2. 左側メニューから「Application Signals」→「Transaction Search」を選択
3. 「Enable Transaction Search」をクリック
4. スパンのインデックス化率を設定（開発環境: 100%、本番環境: 1-10%推奨）

### Step 2: 環境変数の設定

#### 2.1 観測可能性設定ファイルのコピー

```bash
# 観測可能性設定テンプレートをコピー
cp .env.local.observability.template .env.local.observability

# メインの環境設定ファイルに追記
cat .env.local.observability >> .env.local
```

#### 2.2 必須環境変数の設定

`.env.local` ファイルに以下を追加：

```bash
# AWS基本設定
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# 観測可能性設定
OBSERVABILITY_ENABLED=true
OTEL_ENABLED=true
XRAY_ENABLED=true
CLOUDWATCH_ENABLED=true

# サービス識別
SERVICE_NAME=magi-decision-ui
SERVICE_VERSION=1.0.0
```

### Step 3: 依存関係のインストール

```bash
# 観測可能性関連の依存関係をインストール
npm install

# または yarn を使用する場合
yarn install
```

### Step 4: AgentCore Runtime実行ロールの作成

#### 4.1 信頼ポリシーの作成

`agentcore-trust-policy.json` ファイルを作成：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssumeRolePolicy",
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock-agentcore.amazonaws.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "YOUR_ACCOUNT_ID"
        },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:bedrock-agentcore:us-east-1:YOUR_ACCOUNT_ID:*"
        }
      }
    }
  ]
}
```

#### 4.2 実行ポリシーの作成

`agentcore-execution-policy.json` ファイルを作成：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockModelInvocation",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/*",
        "arn:aws:bedrock:us-east-1:YOUR_ACCOUNT_ID:*"
      ]
    },
    {
      "Sid": "ObservabilityPermissions",
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
        "xray:GetSamplingRules",
        "xray:GetSamplingTargets",
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Resource": "*"
    },
    {
      "Sid": "GetAgentAccessToken",
      "Effect": "Allow",
      "Action": [
        "bedrock-agentcore:GetWorkloadAccessToken",
        "bedrock-agentcore:GetWorkloadAccessTokenForJWT",
        "bedrock-agentcore:GetWorkloadAccessTokenForUserId"
      ],
      "Resource": [
        "arn:aws:bedrock-agentcore:us-east-1:YOUR_ACCOUNT_ID:workload-identity-directory/default",
        "arn:aws:bedrock-agentcore:us-east-1:YOUR_ACCOUNT_ID:workload-identity-directory/default/workload-identity/magi-*"
      ]
    }
  ]
}
```

#### 4.3 IAMロールの作成

```bash
# YOUR_ACCOUNT_IDを実際のAWSアカウントIDに置換
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ファイル内のプレースホルダーを置換
sed -i "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" agentcore-trust-policy.json
sed -i "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" agentcore-execution-policy.json

# IAMロールの作成
aws iam create-role \
  --role-name MAGIAgentCoreExecutionRole \
  --assume-role-policy-document file://agentcore-trust-policy.json

# ポリシーの作成とアタッチ
aws iam create-policy \
  --policy-name MAGIAgentCoreExecutionPolicy \
  --policy-document file://agentcore-execution-policy.json

aws iam attach-role-policy \
  --role-name MAGIAgentCoreExecutionRole \
  --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/MAGIAgentCoreExecutionPolicy
```

### Step 5: 動作確認

#### 5.1 観測可能性機能のテスト

```bash
# 開発サーバーを起動
npm run dev

# 別のターミナルで健全性チェック
curl http://localhost:3000/api/health/observability
```

#### 5.2 CloudWatch での確認

1. CloudWatch コンソールに移動
2. 「Metrics」→「bedrock-agentcore」名前空間を確認
3. 「Logs」→「/aws/magi-decision-ui」ログループを確認
4. 「X-Ray」→「Service map」でトレースを確認

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 問題1: "Access Denied" エラー

**症状**: Bedrock AgentCore APIへのアクセスが拒否される

**解決方法**:
1. IAM権限を確認
2. リージョンが正しく設定されているか確認
3. モデルアクセス権限が有効化されているか確認

```bash
# 権限確認
aws iam list-attached-user-policies --user-name YOUR_USERNAME
aws bedrock list-foundation-models --region us-east-1
```

#### 問題2: OpenTelemetry初期化エラー

**症状**: OTEL関連のエラーが発生する

**解決方法**:
1. 依存関係を再インストール
2. 環境変数を確認
3. Node.jsバージョンを確認（18+必須）

```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# 環境変数の確認
npm run validate-env
```

#### 問題3: CloudWatch Transaction Search が動作しない

**症状**: トレースがCloudWatchに表示されない

**解決方法**:
1. Transaction Searchが有効化されているか確認
2. 適切なサンプリング率が設定されているか確認
3. 10分程度待ってから再確認

```bash
# X-Ray設定の確認
aws xray get-trace-segment-destination
aws xray get-indexing-rules
```

### デバッグ用環境変数

問題の切り分けのために、以下の環境変数を設定してください：

```bash
# 詳細ログの有効化
OBSERVABILITY_DEBUG=true
VERBOSE_OBSERVABILITY_LOGS=true

# 特定機能の無効化（問題切り分け用）
OTEL_ENABLED=false
XRAY_ENABLED=false
CLOUDWATCH_ENABLED=false
```

## 📚 参考資料

- [Amazon Bedrock AgentCore Developer Guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/)
- [AWS X-Ray Developer Guide](https://docs.aws.amazon.com/xray/latest/devguide/)
- [Amazon CloudWatch User Guide](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)

## 🆘 サポート

問題が解決しない場合は、以下の情報を含めてサポートに連絡してください：

1. エラーメッセージの全文
2. 環境変数の設定（機密情報は除く）
3. AWS CLIの出力結果
4. ブラウザの開発者ツールのログ

```bash
# デバッグ情報の収集
npm run validate-env > debug-info.txt
aws sts get-caller-identity >> debug-info.txt
aws bedrock list-foundation-models --region us-east-1 >> debug-info.txt 2>&1
```