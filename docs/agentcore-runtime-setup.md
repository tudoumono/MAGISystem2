# AgentCore Runtime セットアップガイド

## 概要

このドキュメントでは、MAGI Decision SystemのAgentCore Runtime環境構築について詳しく説明します。

## 目次

1. [ECRデプロイ資材の準備](#ecr-deploy-materials)
2. [agentcore configureコマンドの詳細](#agentcore-configure-command)
3. [設定プロセスの解説](#configuration-process)
4. [生成されるAWSリソース](#aws-resources)

---

## ECRデプロイ資材の準備 {#ecr-deploy-materials}

### AgentCore設定で準備されるもの

AgentCore Runtime設定により、以下のECRデプロイ用資材が自動生成されます：

```
agents/
├── .bedrock_agentcore/
│   └── magi_decision_system/
│       └── Dockerfile          # コンテナイメージ用
├── .dockerignore               # Docker用除外設定
├── .bedrock_agentcore.yaml     # デプロイ設定
├── magi_agent.py              # エントリーポイント
└── requirements.txt           # 依存関係
```

### ECR統合の設定内容

```yaml
# .bedrock_agentcore.yaml
ecr_repository: null        # 自動作成
ecr_auto_create: true       # ECRリポジトリを自動生成
platform: linux/arm64      # AgentCore Runtime用プラットフォーム
container_runtime: none     # ローカルDocker不要
```

### デプロイフローの準備

次の`agentcore launch`で実行される処理：

1. **ECRリポジトリ作成**
   ```
   262152767881.dkr.ecr.ap-northeast-1.amazonaws.com/magi_decision_system
   ```

2. **CodeBuildプロジェクト作成**
   - ソースコード（magi_agent.py + requirements.txt）をビルド
   - Dockerイメージ作成
   - ECRにプッシュ

3. **AgentCore Runtime作成**
   - 専用マイクロVM環境
   - ECRイメージからコンテナ起動
   - 8時間実行対応

4. **IAMロール・権限設定**
   - 実行ロール作成
   - Bedrock、ECR、CloudWatchアクセス権限

### 従来のLambda vs AgentCore Runtime

| 項目 | Lambda | AgentCore Runtime |
|------|--------|-------------------|
| 実行時間制限 | 15分 | 8時間 ✅ |
| パッケージング | 手動 | 自動コンテナ化 ✅ |
| 依存関係管理 | 複雑 | 自動解決 ✅ |
| スケーリング | 手動設定 | 自動スケーリング ✅ |

---

## agentcore configureコマンドの詳細 {#agentcore-configure-command}

### コマンド構文

```bash
venv\Scripts\agentcore configure --entrypoint magi_agent.py --name magi_decision_system --region ap-northeast-1 --requirements-file requirements.txt
```

### パラメータ詳細

#### `venv\Scripts\agentcore`
- **意味**: 仮想環境内のagentcoreコマンドを実行
- **役割**: bedrock-agentcore-starter-toolkitのCLIツール
- **場所**: `agents/venv/Scripts/agentcore.exe`

#### `configure`
- **意味**: AgentCore Runtime用の設定を作成
- **役割**: デプロイ前の設定ファイル生成
- **出力**: `.bedrock_agentcore.yaml`

#### `--entrypoint magi_agent.py`
- **意味**: エージェントのメインファイルを指定
- **役割**: AgentCore Runtimeが最初に実行するPythonファイル
- **要件**: `handler()`関数が必要

#### `--name magi_decision_system`
- **意味**: エージェントの識別名
- **役割**: AWS リソース名のベース
- **制約**: 英数字とアンダースコアのみ、1-48文字

#### `--region ap-northeast-1`
- **意味**: デプロイ先のAWSリージョン
- **役割**: 全AWSリソースの作成場所
- **選択理由**: 東京リージョン（日本語対応、低レイテンシ）

#### `--requirements-file requirements.txt`
- **意味**: Python依存関係ファイルを指定
- **役割**: コンテナビルド時の依存関係インストール
- **内容**: strands-agents、bedrock-agentcore等

---

## 設定プロセスの解説 {#configuration-process}

### ステップ1: 基本情報確認
```
✓ Using file: magi_agent.py
✓ Using requirements file: requirements.txt
```

### ステップ2: 実行ロール設定
```
🔐 Execution Role
Press Enter to auto-create execution role, or provide execution role ARN/name to use existing
Execution role ARN/name (or press Enter to auto-create): arn:aws:iam::262152767881:user/magi-developer
```

**選択内容**:
- **既存ロール使用**: `arn:aws:iam::262152767881:user/magi-developer`
- **理由**: 既存のIAMユーザーを実行ロールとして使用

### ステップ3: ECRリポジトリ設定
```
🏗️  ECR Repository
Press Enter to auto-create ECR repository, or provide ECR Repository URI to use existing
ECR Repository URI (or press Enter to auto-create):
```

**選択内容**:
- **自動作成**: 新しいECRリポジトリを自動生成
- **名前**: `magi_decision_system`
- **URI**: `262152767881.dkr.ecr.ap-northeast-1.amazonaws.com/magi_decision_system`

### ステップ4: 認証設定
```
🔐 Authorization Configuration
By default, Bedrock AgentCore uses IAM authorization.
Configure OAuth authorizer instead? (yes/no) [no]:
```

**選択内容**:
- **IAM認証**: デフォルトのIAM認証を使用
- **理由**: シンプルで安全、個人開発に適している

### ステップ5: リクエストヘッダー設定
```
🔒 Request Header Allowlist
Configure which request headers are allowed to pass through to your agent.
Common headers: Authorization, X-Amzn-Bedrock-AgentCore-Runtime-Custom-*
Configure request header allowlist? (yes/no) [no]:
```

**選択内容**:
- **デフォルト設定**: 標準的なヘッダー許可
- **理由**: 基本的なAPI呼び出しには十分

### ステップ6: メモリ設定
```
Memory Configuration
Enable long-term memory? (yes/no) [no]:
```

**選択内容**:
- **短期メモリのみ**: セッション内会話保持
- **理由**: コスト効率化、個人開発には十分

---

## 生成されるAWSリソース {#aws-resources}

### 設定ファイル（.bedrock_agentcore.yaml）

```yaml
default_agent: magi_decision_system
agents:
  magi_decision_system:
    name: magi_decision_system
    entrypoint: F:/10_code/06_kiro/MAGISystem2/MAGISystem2/agents/magi_agent.py
    platform: linux/arm64                    # AgentCore Runtime用
    aws:
      execution_role: arn:aws:iam::262152767881:user/magi-developer
      region: ap-northeast-1
      ecr_auto_create: true                   # ECR自動作成
    memory:
      mode: STM_ONLY                          # 短期メモリのみ
      event_expiry_days: 30                   # 30日保持
```

### デプロイ時に作成されるAWSリソース

1. **ECRリポジトリ**: コンテナイメージ保存
2. **CodeBuildプロジェクト**: イメージビルド
3. **AgentCore Runtime**: 実行環境
4. **CloudWatchログ**: 実行ログ
5. **IAMロール**: 必要な権限

### コスト最適化設定

- **短期メモリのみ**: 長期メモリ無効でコスト削減
- **自動スケーリング**: 使用時のみリソース消費
- **個人開発用**: 最小限のリソース設定

---

## まとめ

この設定により、AWS公式ツールチェーンを使った確実で効率的なデプロイが可能になります。ECRを使用したコンテナベースのデプロイメントにより、依存関係の管理が自動化され、8時間の長時間実行が可能なAgentCore Runtime環境が構築されます。

## 関連ドキュメント

- [MAGI Decision System 設計書](../specs/consolidated-magi-system/design.md)
- [MAGI Decision System 要件定義](../specs/consolidated-magi-system/requirements.md)
- [MAGI Decision System タスク一覧](../specs/consolidated-magi-system/tasks.md)