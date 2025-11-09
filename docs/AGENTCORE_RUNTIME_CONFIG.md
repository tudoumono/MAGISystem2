# AgentCore Runtime Configuration Guide

AgentCore Runtime環境での設定管理について説明します。

## 環境の違い

### ローカル開発環境
- `.env`ファイルが利用可能
- `python-dotenv`で自動読み込み
- ファイルシステムアクセス可能

### AgentCore Runtime環境
- Dockerコンテナ内で実行
- `.env`ファイルは利用不可
- 環境変数のみ利用可能
- `.bedrock_agentcore.yaml`から自動設定

## 設定方法

### 1. AgentCore Runtime環境変数

AgentCore Runtimeでは以下の環境変数が自動設定されます：

```bash
# AWS基本設定
AWS_REGION=ap-northeast-1
AWS_ACCOUNT_ID=123456789012

# AgentCore Runtime固有
BEDROCK_AGENTCORE_RUNTIME=true
MAGI_AGENT_ARN=arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/magi_agent-xxxxx
MAGI_AGENT_ID=magi_agent-xxxxx

# デバッグ設定
DEBUG_STREAMING=true
```

### 2. .bedrock_agentcore.yaml連携

AgentCore Runtime起動時に`.bedrock_agentcore.yaml`から自動的に環境変数を設定：

```python
# magi_agent.py内で自動実行
config = MAGIConfig.for_agentcore_runtime()
# → .bedrock_agentcore.yamlから環境変数を自動設定
```

### 3. 手動環境変数設定

必要に応じて手動で環境変数を設定：

```bash
# AgentCore Runtime デプロイ時
agentcore configure \
  --env DEBUG_STREAMING=true \
  --env VERBOSE_OUTPUT=true \
  --env REQUEST_TIMEOUT=300
```

## 設定優先順位（AgentCore Runtime）

1. **手動環境変数** - 最優先
2. **.bedrock_agentcore.yaml** - 自動設定
3. **デフォルト値** - フォールバック

## 実装パターン

### magi_agent.py での使用

```python
# AgentCore Runtime対応の設定読み込み
from shared.config import MAGIConfig

# AgentCore Runtime用設定
config = MAGIConfig.for_agentcore_runtime()

# 設定値の取得
debug_mode = config.is_debug_enabled()
region = config.get_region()
```

### 環境判定

```python
# 実行環境の判定
if config._is_agentcore_runtime():
    print("Running in AgentCore Runtime")
else:
    print("Running in local development")
```

## トラブルシューティング

### 設定が読み込まれない

**症状:**
```
⚠️ Config module not available: No module named 'shared.config'
```

**解決方法:**
1. `shared/config.py`がAgentCore Runtimeに含まれているか確認
2. `requirements.txt`に`python-dotenv`が含まれているか確認
3. フォールバックモードで動作することを確認

### 環境変数が設定されない

**症状:**
```
❌ 設定エラー: MAGI_AGENT_ARN が設定されていません
```

**解決方法:**
1. `.bedrock_agentcore.yaml`の内容を確認
2. AgentCore Runtimeの再デプロイ
3. 手動環境変数設定

### デバッグモードが効かない

**症状:**
デバッグ出力が表示されない

**解決方法:**
```bash
# 環境変数を明示的に設定
agentcore configure --env DEBUG_STREAMING=true

# または .bedrock_agentcore.yaml に追加
agents:
  magi_agent:
    environment:
      DEBUG_STREAMING: "true"
```

## ベストプラクティス

### 1. 開発・本番環境の統一

```python
# 環境に依存しない設定読み込み
config = MAGIConfig.for_agentcore_runtime()
```

### 2. フォールバック実装

```python
try:
    from shared.config import MAGIConfig
    config = MAGIConfig.for_agentcore_runtime()
except ImportError:
    # フォールバック: 環境変数のみ
    DEBUG_STREAMING = os.getenv('DEBUG_STREAMING', 'false').lower() == 'true'
```

### 3. 設定の可視化

```python
# 起動時に設定を表示
config.print_config()
```

## 参考

- [AgentCore Runtime Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore-runtime.html)
- [Docker Environment Variables](https://docs.docker.com/engine/reference/commandline/run/#env)
- [AWS Lambda Environment Variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)