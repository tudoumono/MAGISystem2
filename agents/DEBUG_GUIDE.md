# MAGIシステム デバッグガイド

## ストリーミングデバッグ機能

3賢者の並列処理によるストリーミングレスポンスをリアルタイムでコンソールに表示します。

## 機能概要

### デバッグモードで表示される情報

- **タイムスタンプ**: 各イベントの発生時刻（ミリ秒精度）
- **イベントタイプ**: START, SAGE_START, SAGE_CHUNK, SAGE_COMPLETE, JUDGE_START, JUDGE_COMPLETE, COMPLETE
- **エージェント情報**: どの賢者（CASPAR/BALTHASAR/MELCHIOR）からのイベントか
- **思考プロセス**: 各賢者の推論内容（全文表示）
- **判断結果**: 決定（APPROVED/REJECTED/ABSTAINED）、信頼度、理由
- **実行時間**: 各ステップと全体の実行時間

### 並列処理の可視化

3賢者は並列実行されるため、イベントは**到着順**に表示されます。

例：
```
[14:23:45.123] 🤖 SAGE_START: CASPAR
[14:23:45.234] 🤖 SAGE_START: BALTHASAR
[14:23:45.345] 🤖 SAGE_START: MELCHIOR
[14:23:47.567] 💭 SAGE_CHUNK: BALTHASAR
  {"decision": "APPROVED", ...
[14:23:48.123] 💭 SAGE_CHUNK: CASPAR
  {"decision": "REJECTED", ...
[14:23:48.789] 💭 SAGE_CHUNK: MELCHIOR
  {"decision": "APPROVED", ...
```

## 使用方法

### 1. AgentCore Runtimeでのデバッグ

#### デバッグモードを有効にする

`.bedrock_agentcore.yaml`に環境変数を設定：

```yaml
agents:
  magi_agent:
    environment:
      DEBUG_STREAMING: "true"
```

#### 再デプロイ

```powershell
cd agents
agentcore launch --auto-update-on-conflict
```

#### CloudWatch Logsで確認

```powershell
# ログストリームを確認
aws logs tail /aws/bedrock-agentcore/magi_agent --follow
```

### 2. テストスクリプトでのデバッグ

#### デバッグモード有効（デフォルト）

```powershell
# Windows（UTF-8エンコーディングを設定）
cd agents/tests
$env:PYTHONIOENCODING="utf-8"
python test_magi.py

# Unix/Linux/Mac
cd agents/tests
python test_magi.py
```

#### デバッグモード無効

```powershell
# Windows
cd agents/tests
$env:DEBUG_STREAMING="false"
$env:PYTHONIOENCODING="utf-8"
python test_magi.py

# Unix/Linux/Mac
cd agents/tests
DEBUG_STREAMING=false python test_magi.py
```

## 出力例

### 開始イベント
```
================================================================================
[14:23:45.123] 🚀 START
  Question: 新しいAIシステムを全社に導入すべきか？
  Trace ID: trace-1234567890
================================================================================
```

### 賢者の思考プロセス
```
[14:23:45.234] 🤖 SAGE_START: CASPAR
[14:23:47.567] 💭 SAGE_CHUNK: CASPAR
  {
    "decision": "REJECTED",
    "reasoning": "実装コストが高く、ROIが不明確。段階的導入を推奨。",
    "confidence": 0.75
  }

[14:23:47.890] ✅ SAGE_COMPLETE: CASPAR
  Decision: REJECTED
  Confidence: 0.75
  Reasoning: 実装コストが高く、ROIが不明確。段階的導入を推奨。
```

### SOLOMON Judge評価
```
[14:23:50.123] ⚖️  JUDGE_START
  SOLOMON evaluating 3 sages' responses...

[14:23:52.456] 💭 JUDGE_CHUNK
  {
    "final_decision": "APPROVED",
    "reasoning": "3賢者の意見を総合すると、段階的導入により実現可能。",
    "confidence": 0.82,
    "sage_scores": {
      "caspar": 75,
      "balthasar": 90,
      "melchior": 85
    }
  }

[14:23:52.567] ✅ JUDGE_COMPLETE
  Final Decision: APPROVED
  Confidence: 0.82
  Reasoning: 3賢者の意見を総合すると、段階的導入により実現可能。
  Sage Scores:
    CASPAR: 75/100
    BALTHASAR: 90/100
    MELCHIOR: 85/100
```

### 完了イベント
```
================================================================================
[14:23:52.678] 🏁 COMPLETE
  Final Decision: APPROVED
  Execution Time: 7555ms
  Voting Result:
    Approved: 2
    Rejected: 1
    Abstained: 0
================================================================================
```

## トラブルシューティング

### デバッグ出力が表示されない

1. 環境変数が正しく設定されているか確認
   ```powershell
   echo $env:DEBUG_STREAMING
   ```

2. AgentCore Runtimeを再デプロイ
   ```powershell
   cd agents
   agentcore launch --auto-update-on-conflict
   ```

3. CloudWatch Logsを確認
   ```powershell
   aws logs tail /aws/bedrock-agentcore/magi_agent --follow
   ```

### イベントの順序がバラバラ

これは正常な動作です。3賢者は並列実行されるため、イベントは到着順に表示されます。

各イベントには以下の情報が含まれているため、後から整理できます：
- タイムスタンプ
- エージェントID（caspar/balthasar/melchior/solomon）
- イベントタイプ

### 一部の賢者のイベントが表示されない

1. エラーイベントを確認
   ```
   [14:23:47.567] ❌ SAGE_ERROR: BALTHASAR
     Error: Model invocation failed
   ```

2. CloudWatch Logsで詳細を確認
   ```powershell
   aws logs tail /aws/bedrock-agentcore/magi_agent --follow
   ```

## パフォーマンスへの影響

デバッグモードは以下の影響があります：

- **CloudWatch Logs**: ログ出力量が増加（約10-20KB/リクエスト）
- **実行時間**: ほぼ影響なし（<10ms）
- **コスト**: CloudWatch Logsの料金が増加

本番環境では`DEBUG_STREAMING=false`を推奨します。

## 関連ファイル

- `agents/magi_agent.py`: デバッグ機能の実装
- `agents/tests/test_magi.py`: テストスクリプト
- `agents/.bedrock_agentcore.yaml`: AgentCore設定
- `agents/tests/README.md`: テスト実行ガイド
