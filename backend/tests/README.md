# MAGI System Tests

このディレクトリには、MAGIシステムの統合テストが含まれています。

## テストの種類

### test_integration.py

Next.js + Python統合版のAgentCore Runtimeとの統合テスト。

**テスト内容:**
- `/invocations` エンドポイントへのHTTP POSTリクエスト
- ストリーミングレスポンスの受信と検証
- 新しいイベント形式の検証（`agent_start`, `agent_chunk`, `agent_complete`）
- 3賢者（CASPAR, BALTHASAR, MELCHIOR）とSOLOMON Judgeの応答検証

**実行前提条件:**
- AgentCore Runtimeが起動していること（ローカルまたはデプロイ済み環境）
- 環境変数 `NEXT_PUBLIC_AGENTCORE_URL` が設定されていること（デフォルト: `http://localhost:8080`）
- AWS認証情報が設定されていること（Bedrock APIアクセス用）

**実行方法:**
```bash
# ディレクトリ移動
cd backend/tests

# 実行スクリプトを使用
./run_test.sh

# または直接実行
python test_integration.py
```

**出力:**
- コンソールにストリーミングイベントがリアルタイム表示
- テスト実行サマリー（実行時間、イベント数、3賢者の判断結果）

## アーキテクチャ

```
Test Client (test_integration.py)
    ↓ HTTP POST /invocations
AgentCore Runtime (Next.js)
    ↓ spawn('python', ['magi_agent.py'])
Python MAGI Agent (magi_agent.py)
    ↓ Strands Agents
Amazon Bedrock
```

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `NEXT_PUBLIC_AGENTCORE_URL` | AgentCore RuntimeのベースURL | `http://localhost:8080` |
| `AWS_REGION` | AWSリージョン | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS認証情報 | - |
| `AWS_SECRET_ACCESS_KEY` | AWS認証情報 | - |

## トラブルシューティング

### エラー: Connection refused
- AgentCore Runtimeが起動しているか確認
- `NEXT_PUBLIC_AGENTCORE_URL` が正しいか確認

### エラー: AWS credentials not found
- AWS認証情報が設定されているか確認
- `~/.aws/credentials` または環境変数を確認

### エラー: Timeout
- Bedrockへのネットワーク接続を確認
- リージョンが正しいか確認

## 出力ファイル

テスト実行時に生成される出力ファイルは `.gitignore` で除外されています。

```
tests/
├── streaming_output/        # git ignore対象
├── test_results/            # git ignore対象
└── *.log                    # git ignore対象
```
