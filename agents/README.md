# MAGI Agents Configuration

MAGI Decision Systemのエージェント設定管理について説明します。

## 設定方法

### 1. .envファイルでの設定（推奨）

```bash
# agents/.env.template をコピー
cp .env.template .env

# 設定を編集
# MAGI_AGENT_ARN=arn:aws:bedrock-agentcore:ap-northeast-1:YOUR_ACCOUNT:runtime/YOUR_AGENT
```

### 2. 環境変数での設定

```bash
# PowerShell
$env:MAGI_AGENT_ARN = "arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/magi_agent-xxxxx"
$env:AWS_REGION = "ap-northeast-1"

# Bash
export MAGI_AGENT_ARN="arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/magi_agent-xxxxx"
export AWS_REGION="ap-northeast-1"
```

### 3. 自動設定（フォールバック）

`.bedrock_agentcore.yaml`ファイルが存在する場合、自動的に設定を読み取ります。

## 設定優先順位

1. **環境変数** - 最優先
2. **agents/.env** - 推奨
3. **プロジェクトルート/.env.local** - フォールバック
4. **.bedrock_agentcore.yaml** - 自動フォールバック

## 必須設定項目

| 項目 | 説明 | 例 |
|------|------|-----|
| `MAGI_AGENT_ARN` | AgentCore Runtime ARN | `arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/magi_agent-xxxxx` |
| `AWS_REGION` | AWSリージョン | `ap-northeast-1` |

## オプション設定項目

| 項目 | デフォルト | 説明 |
|------|------------|------|
| `DEBUG_STREAMING` | `true` | ストリーミングデバッグ表示 |
| `VERBOSE_OUTPUT` | `true` | 詳細出力モード |
| `TEST_OUTPUT_DIR` | `tests/streaming_output` | テスト出力ディレクトリ |
| `REQUEST_TIMEOUT` | `300` | リクエストタイムアウト（秒） |
| `CONNECT_TIMEOUT` | `10` | 接続タイムアウト（秒） |
| `MAX_RETRIES` | `3` | 最大リトライ回数 |

## テスト実行

### Pingテスト

```bash
cd agents/tests
python test_ping.py
```

### MAGIストリーミングテスト

```bash
cd agents/tests
python test_magi.py
```

### 設定確認

```bash
cd agents/tests
python -c "from pathlib import Path; import sys; sys.path.append(str(Path.cwd().parent)); from shared.config import get_config; get_config().print_config()"
```

## トラブルシューティング

### 設定エラー

```
❌ 設定エラー: MAGI_AGENT_ARN が設定されていません
```

**解決方法:**
1. `agents/.env`ファイルを作成
2. `MAGI_AGENT_ARN`を正しく設定
3. `.bedrock_agentcore.yaml`の存在確認

### python-dotenvエラー

```
⚠️ python-dotenv not installed. Using environment variables only.
```

**解決方法:**
```bash
pip install python-dotenv
```

### パースエラー

```
python-dotenv could not parse statement starting at line X
```

**解決方法:**
- .envファイルの該当行を確認
- コメント行の改行を修正
- 不正な文字を削除

## ファイル構成

```
agents/
├── .env                    # 設定ファイル（gitignore対象）
├── .env.template          # 設定テンプレート
├── shared/
│   └── config.py          # 設定管理モジュール
├── tests/
│   ├── test_ping.py       # Pingテスト
│   ├── test_magi.py       # MAGIテスト
│   └── test_magi2.py      # MAGI Phase2テスト
└── requirements.txt       # Python依存関係
```

## セキュリティ

- `.env`ファイルはGitで追跡されません
- 本番環境ではIAM Roleを使用
- AWS認証情報は.envファイルに保存しない（推奨）