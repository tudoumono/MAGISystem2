# MAGI System Tests

## テストファイル

### test_magi.py
MAGIシステムのストリーミングテスト。

3賢者（CASPAR、BALTHASAR、MELCHIOR）の意思決定プロセスを
リアルタイムでストリーミング受信し、各エージェントの思考を可視化します。

## 実行方法

### 基本実行（デバッグモード有効）

デフォルトでは、3賢者の並列ストリーミングをリアルタイムでコンソールに表示します。

#### Windows
```powershell
cd agents/tests
python test_magi.py
```

#### Unix/Linux/Mac
```bash
cd agents/tests
python test_magi.py
```

または、実行スクリプトを使用：
```bash
./run_streaming_test.sh
```

### デバッグモード制御

#### デバッグモードを有効にする（デフォルト）
```powershell
# Windows
$env:DEBUG_STREAMING="true"
python test_magi.py

# Unix/Linux/Mac
DEBUG_STREAMING=true python test_magi.py
```

#### デバッグモードを無効にする
```powershell
# Windows
$env:DEBUG_STREAMING="false"
python test_magi.py

# Unix/Linux/Mac
DEBUG_STREAMING=false python test_magi.py
```

### デバッグモードの動作

デバッグモードが有効な場合、以下の情報がリアルタイムでコンソールに表示されます：

- 🚀 **START**: 処理開始、質問内容、Trace ID
- 🤖 **SAGE_START**: 各賢者の思考開始
- 💭 **SAGE_CHUNK**: 各賢者の思考プロセス（全文表示）
- ✅ **SAGE_COMPLETE**: 各賢者の判断結果
- ⚖️ **JUDGE_START**: SOLOMON Judge評価開始
- 💭 **JUDGE_CHUNK**: SOLOMONの評価プロセス
- ✅ **JUDGE_COMPLETE**: SOLOMONの最終判断
- 🏁 **COMPLETE**: 処理完了、実行時間、投票結果

**重要**: 3賢者は並列実行されるため、イベントは到着順に表示されます。
CASPAR、BALTHASAR、MELCHIORのイベントが交互に表示される場合があります。

## 出力ファイル

テスト実行後、`streaming_output/`ディレクトリに以下のファイルが生成されます：

- `caspar_stream.txt` - CASPAR（保守的）の思考プロセス
- `balthasar_stream.txt` - BALTHASAR（革新的）の思考プロセス
- `melchior_stream.txt` - MELCHIOR（科学的）の思考プロセス
- `full_stream.json` - 全イベントのJSON記録
- `summary.txt` - テスト結果のサマリー

## テスト内容

デフォルトの質問：
```
新しいAIシステムを全社に導入すべきか？
コスト削減と効率化が期待されるが、従業員の反発も予想される。
```

この質問に対して、3賢者が異なる視点から判断を下します：

- **CASPAR**: 実行可能性、コスト、リスクを重視
- **BALTHASAR**: 革新性、倫理、長期的価値を重視
- **MELCHIOR**: データ、論理、バランスを重視

## 期待される結果

- 3賢者がそれぞれ独自の視点で分析
- リアルタイムでストリーミング受信
- 各賢者の判断（APPROVED/REJECTED/ABSTAINED）
- 信頼度スコア（0.0-1.0）
- 判断理由（200文字以内）

## トラブルシューティング

### エラー: "Runtime initialization time exceeded"
AgentCore Runtimeの初期化に時間がかかっています。
再デプロイしてください：
```powershell
cd agents
agentcore launch --auto-update-on-conflict
```

### エラー: "No module named 'strands'"
依存関係をインストールしてください：
```powershell
pip install -r requirements.txt
```

### ストリーミングイベントが空
AgentCore Runtimeが古いイメージを使用している可能性があります。
再デプロイしてください。
