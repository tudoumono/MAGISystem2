# MAGI Agent System

🎯 **PHASE 2 COMPLETE - WORKING BASELINE** ✅

## 概要

エヴァンゲリオンのMAGIシステムにインスパイアされた3賢者による意思決定支援システム。
Strands Agentsフレームワークを使用し、Amazon Bedrockと統合した実際のLLM推論を実行します。

## 🏗️ アーキテクチャ (動作確認済み)

```
Amplify Hosting (Next.js Frontend)
    ↓ HTTP POST /invocations
AgentCore Runtime (Docker Container)
    ├─ Next.jsバックエンド (ポート8080) ✅ 動作確認済み
    │   ├─ POST /invocations
    │   └─ GET /ping
    └─ Python magi_agent.py (子プロセス) ✅ 動作確認済み
        ├─ 標準入力: JSON リクエスト受信
        ├─ 標準出力: JSON Lines ストリーミング出力
        └─ 3賢者 + SOLOMON Judge 並列実行
```

## 🤖 3賢者システム

### CASPAR (カスパー)
- **特性**: 保守的・現実的な視点
- **役割**: 実行可能性とリスクを重視した判断
- **動作確認**: ✅ 5,265文字の詳細分析を出力

### BALTHASAR (バルタザール)  
- **特性**: 革新的・感情的な視点
- **役割**: 倫理と創造性を考慮した判断
- **動作確認**: ✅ 7,643文字の革新的提案を出力

### MELCHIOR (メルキオール)
- **特性**: バランス型・科学的な視点
- **役割**: データと論理に基づいた客観的判断
- **動作確認**: ✅ 5,859文字のバランス評価を出力

### SOLOMON Judge
- **役割**: 3賢者の回答を統合・評価する統括AI
- **機能**: 0-100点のスコアリングと最終判断

## 🚀 クイックスタート

### 1. 動作確認テスト

```bash
cd agents/tests
python test_magi2.py
```

**期待結果:**
- ✅ 11.96秒で完了
- ✅ 383イベントを正常処理
- ✅ 3賢者が並列実行で正常動作

### 2. AgentCore Runtime デプロイ

```bash
cd agents
agentcore launch --auto-update-on-conflict
```

### 3. 直接テスト

```bash
agentcore invoke '{"question": "新しいAIシステムを導入すべきか？"}'
```

## 📁 ディレクトリ構造

```
agents/
├── magi_agent.py                    # メインPythonエージェント ✅ 動作確認済み
├── backend/                         # Next.jsバックエンド
│   └── app/api/invocations/route.ts # APIエンドポイント ✅ 動作確認済み
├── tests/
│   ├── test_magi2.py               # Phase 2テスト ✅ 動作確認済み
│   └── streaming_output_phase2/    # テスト結果出力
├── shared/                         # 共通モジュール
├── requirements.txt                # Python依存関係
├── Dockerfile                      # Docker設定
└── PHASE2_BASELINE_COMPLETE.md    # 🔄 ROLLBACK POINT
```

## 🔄 ROLLBACK POINT

**問題が発生した場合は、以下のファイルが動作確認済みベースラインです:**

1. **`agents/magi_agent.py`** - Python MAGIエージェント
2. **`agents/backend/app/api/invocations/route.ts`** - Next.js APIエンドポイント  
3. **`agents/tests/test_magi2.py`** - 動作確認テスト

詳細は `PHASE2_BASELINE_COMPLETE.md` を参照してください。

## 📊 パフォーマンス

- **初回応答**: 即座に開始
- **総実行時間**: 11.96秒 (3賢者並列実行)
- **ストリーミング**: リアルタイムでイベント配信
- **スループット**: 383イベント/12秒 = 約32イベント/秒

## 🛠️ 技術スタック

- **フレームワーク**: Strands Agents (v1.0)
- **LLM**: Amazon Bedrock (Claude 3.5 Sonnet)
- **バックエンド**: Next.js 15 + TypeScript
- **ランタイム**: AgentCore Runtime (Docker)
- **通信**: Server-Sent Events (SSE)
- **認証**: AWS SigV4

## 📝 ログとデバッグ

### CloudWatch Logs
```bash
aws logs tail /aws/bedrock-agentcore/runtimes/magi_agent-4ORNam2cHb-DEFAULT --follow
```

### ローカルテスト出力
```
agents/tests/streaming_output_phase2/
├── caspar_stream.txt      # CASPAR賢者の完全応答
├── balthasar_stream.txt   # BALTHASAR賢者の完全応答  
├── melchior_stream.txt    # MELCHIOR賢者の完全応答
├── full_stream.json       # 全イベントのJSON記録
└── summary.txt            # 実行統計サマリー
```

## 🔧 開発・デバッグ

### 環境変数
```bash
export DEBUG_STREAMING=true          # ストリーミングデバッグ
export MAGI_AGENT_ARN="arn:aws:..."  # AgentCore Runtime ARN
```

### テスト実行
```bash
# Phase 2テスト (HTTP POST)
cd agents/tests && python test_magi2.py

# 直接AgentCore呼び出し
agentcore invoke '{"question": "テスト質問"}'
```

---

**🎯 Status: PHASE 2 COMPLETE - 参考記事準拠アーキテクチャ動作確認済み** ✅