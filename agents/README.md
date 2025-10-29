# MAGI Decision System - Python Agents

## 概要

このディレクトリには、MAGIシステムのPythonベースのエージェント実装が含まれています。
Amazon Bedrock AgentCoreにデプロイされ、3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる多視点分析を提供します。

## ディレクトリ構造

```
agents/
├── caspar/              # CASPAR（保守的・現実的視点）
│   ├── __init__.py
│   └── agent.py
│
├── balthasar/           # BALTHASAR（革新的・感情的視点）
│   ├── __init__.py
│   └── agent.py
│
├── melchior/            # MELCHIOR（バランス型・科学的視点）
│   ├── __init__.py
│   └── agent.py
│
├── solomon/             # SOLOMON Judge（統括者）
│   ├── __init__.py
│   ├── agent.py
│   └── tools.py
│
├── shared/              # 共通ユーティリティ
│   ├── __init__.py
│   ├── prompts.py      # プロンプトテンプレート
│   ├── types.py        # 型定義
│   └── utils.py        # ユーティリティ関数
│
├── tests/               # テストコード
│   ├── __init__.py
│   ├── test_agents.py
│   └── test_integration.py
│
├── archive/             # 非推奨・アーカイブ
│   └── ...
│
├── magi_agent.py        # メインエージェント（AgentCore用）
├── requirements.txt     # Python依存関係
├── pyproject.toml       # プロジェクト設定
└── README.md           # このファイル
```

## セットアップ

### 1. Python環境の準備

```bash
# Python 3.13以上が必要
python --version

# 仮想環境の作成
python -m venv venv

# 仮想環境の有効化
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt
```

### 2. 環境変数の設定

```bash
# .env ファイルを作成（agents/.env）
AWS_REGION=ap-northeast-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

## エージェント構成

### CASPAR（カスパー）
- **視点**: 保守的・現実的
- **重視**: 実行可能性、安全性、リスク管理
- **特徴**: 慎重なアプローチ、段階的な実装を推奨

### BALTHASAR（バルタザール）
- **視点**: 革新的・感情的
- **重視**: 創造性、倫理、人間的側面
- **特徴**: 革新的なアプローチ、新しい可能性の探求

### MELCHIOR（メルキオール）
- **視点**: バランス型・科学的
- **重視**: データ、論理、統計的分析
- **特徴**: バランスの取れた解決策、科学的根拠

### SOLOMON Judge（ソロモン）
- **役割**: 統括者・最終判断
- **機能**: 3賢者の回答を評価・統合
- **出力**: 0-100点のスコアリング、最終判断、推奨事項

## 開発

### ローカルテスト

```bash
# 単体テスト
python -m pytest tests/

# 統合テスト
python -m pytest tests/test_integration.py

# 特定のエージェントテスト
python -m pytest tests/test_agents.py::test_caspar
```

### デバッグ

```bash
# ローカルサーバーの起動（開発用）
python local_server.py

# エージェントの直接実行
python magi_agent.py
```

## デプロイ

### Amazon Bedrock AgentCoreへのデプロイ

1. **AgentCore設定の確認**
```bash
# .bedrock_agentcore.yaml が正しく設定されているか確認
cat .bedrock_agentcore.yaml
```

2. **デプロイ実行**
```bash
# AWS CLIでデプロイ
aws bedrock-agent create-agent \
  --agent-name magi_agent \
  --agent-resource-role-arn <ROLE_ARN> \
  --foundation-model anthropic.claude-3-5-sonnet-20241022-v2:0
```

3. **動作確認**
```bash
# テストリクエストの送信
python agentcore_test.py
```

## API仕様

### 入力形式

```json
{
  "question": "新しいAIシステムを導入すべきでしょうか？",
  "context": {
    "user_id": "user123",
    "session_id": "session456"
  }
}
```

### 出力形式

```json
{
  "agent_responses": [
    {
      "agent_id": "caspar",
      "decision": "慎重に進めるべき",
      "reasoning": "...",
      "confidence": 0.85
    },
    {
      "agent_id": "balthasar",
      "decision": "積極的に導入すべき",
      "reasoning": "...",
      "confidence": 0.90
    },
    {
      "agent_id": "melchior",
      "decision": "段階的に導入すべき",
      "reasoning": "...",
      "confidence": 0.88
    }
  ],
  "final_decision": "段階的な導入を推奨",
  "voting_result": {
    "approved": 2,
    "rejected": 0,
    "abstained": 1
  },
  "confidence": 0.87,
  "summary": "...",
  "recommendation": "...",
  "execution_time": 2500
}
```

## トラブルシューティング

### よくある問題

1. **ImportError: No module named 'boto3'**
   ```bash
   pip install -r requirements.txt
   ```

2. **AWS認証エラー**
   ```bash
   aws configure
   # または
   export AWS_ACCESS_KEY_ID=xxx
   export AWS_SECRET_ACCESS_KEY=xxx
   ```

3. **Bedrock APIエラー**
   - リージョンが正しいか確認
   - モデルIDが正しいか確認
   - IAMロールに適切な権限があるか確認

## 関連ドキュメント

- [プロジェクト全体のREADME](../README.md)
- [環境セットアップガイド](../docs/ENVIRONMENT_SETUP.md)
- [Amplify Gen2ガイド](../docs/learning/03-aws-amplify-gen2.md)
- [AgentCore統合ガイド](../docs/learning/06-bedrock-agentcore.md)

## ライセンス

このプロジェクトは内部使用のみを目的としています。
