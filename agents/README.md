# MAGI System - Strands Agents実装

エヴァンゲリオンのMAGIシステムにインスパイアされた、3賢者による多視点意思決定システム。

## 概要

このシステムは、Strands Agentsフレームワークを使用して、3つの異なる視点から意思決定を行います：

- **CASPAR（カスパー）**: 保守的・現実的な視点
- **BALTHASAR（バルタザール）**: 革新的・感情的な視点
- **MELCHIOR（メルキオール）**: バランス型・科学的な視点
- **SOLOMON（ソロモン）**: 3賢者の判断を統合評価する統括AI

## 主な機能

### ✅ 実装済み機能

1. **Strands Agentsフレームワーク統合**
   - 実際のLLM推論（Amazon Bedrock Claude 3.5 Sonnet）
   - 3賢者の並列実行
   - SOLOMON Judgeによる統合評価

2. **リアルタイムストリーミング**
   - 思考プロセスのリアルタイム表示
   - SSE（Server-Sent Events）形式でのイベント配信
   - 各賢者の推論過程を可視化

3. **デバッグ機能**
   - `DEBUG_STREAMING`環境変数でデバッグモード制御
   - 全イベントのコンソール表示
   - タイムスタンプ付きログ

## ファイル構成

```
agents/
├── magi_agent.py              # メインエージェント実装
├── requirements.txt           # Python依存関係
├── .bedrock_agentcore.yaml   # AgentCore Runtime設定
├── tests/
│   ├── test_magi.py          # ストリーミングテスト
│   └── README.md             # テスト実行ガイド
├── DEBUG_GUIDE.md            # デバッグガイド
└── README.md                 # このファイル
```

## セットアップ

### 1. 依存関係のインストール

```powershell
cd agents
pip install -r requirements.txt
```

### 2. AgentCore Runtimeへのデプロイ

```powershell
cd agents
C:\Users\マサフミ\AppData\Roaming\Python\Python313\Scripts\agentcore.exe launch --auto-update-on-conflict
```

## 使用方法

### デバッグモードの有効化

`.bedrock_agentcore.yaml`で環境変数を設定：

```yaml
agents:
  magi_agent:
    environment:
      DEBUG_STREAMING: "true"
```

### テストの実行

```powershell
cd agents/tests
$env:PYTHONIOENCODING="utf-8"
python test_magi.py
```

## ストリーミングイベント

システムは以下のイベントをストリーミングで配信します：

| イベントタイプ | 説明 |
|--------------|------|
| `start` | 処理開始 |
| `sages_start` | 3賢者の分析開始 |
| `sage_start` | 個別賢者の思考開始 |
| `sage_thinking` | 賢者の思考プロセス（リアルタイム） |
| `sage_chunk` | 賢者の完全なレスポンス |
| `sage_complete` | 賢者の判断完了 |
| `judge_start` | SOLOMON評価開始 |
| `judge_thinking` | SOLOMONの評価プロセス（リアルタイム） |
| `judge_chunk` | SOLOMONの完全なレスポンス |
| `judge_complete` | SOLOMON評価完了 |
| `complete` | 全処理完了 |

## 出力例

```
[14:23:45.123] 🚀 START
  Question: 新しいAIシステムを全社に導入すべきか？
  Trace ID: trace-1234567890

[14:23:45.234] 🤖 SAGE_START: CASPAR
{
  "decision": "REJECTED",
  "reasoning": "実装コストが高く、ROIが不明確...",
  "confidence": 0.75
}

[14:23:47.890] ✅ SAGE_COMPLETE: CASPAR
  Decision: REJECTED
  Confidence: 0.75

[14:23:50.123] ⚖️ JUDGE_START
  SOLOMON evaluating 3 sages' responses...

[14:23:52.567] ✅ JUDGE_COMPLETE
  Final Decision: APPROVED
  Confidence: 0.82
  Sage Scores:
    CASPAR: 75/100
    BALTHASAR: 90/100
    MELCHIOR: 85/100
```

## トラブルシューティング

### 思考プロセスが表示されない

1. `DEBUG_STREAMING=true`が設定されているか確認
2. AgentCore Runtimeを再デプロイ
3. CloudWatch Logsを確認

### 文字化けが発生する

```powershell
$env:PYTHONIOENCODING="utf-8"
```

### エージェントが失敗する

CloudWatch Logsで詳細を確認：

```powershell
aws logs tail /aws/bedrock-agentcore/runtimes/magi_agent-4ORNam2cHb-DEFAULT --follow
```

## 技術スタック

- **Strands Agents**: マルチエージェントフレームワーク
- **Amazon Bedrock**: LLMプロバイダー（Claude 3.5 Sonnet）
- **AgentCore Runtime**: エージェント実行環境
- **Python 3.12+**: 実装言語

## 参考資料

- [Strands Agents公式ドキュメント](https://strandsagents.com/latest/)
- [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock/)
- [DEBUG_GUIDE.md](./DEBUG_GUIDE.md) - デバッグ詳細ガイド
- [tests/README.md](./tests/README.md) - テスト実行ガイド
