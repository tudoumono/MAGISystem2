# アーキテクチャドキュメント

## 📚 概要

MAGI Decision Systemのアーキテクチャ設計に関するドキュメントです。

## 📖 ドキュメント

### [ARCHITECTURE.md](../ARCHITECTURE.md)

システム全体のアーキテクチャ設計書です。以下の内容を含みます：

- **参考記事**: [Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- **システム構成**: AgentCore Runtime（1つのDockerコンテナ）
- **技術スタック**: Next.js + Python + Strands Agents
- **通信フロー**: フロントエンド → AgentCore Runtime → Bedrock
- **設計判断**: なぜこのアーキテクチャを選択したか

## 🎯 重要なポイント

### AgentCore Runtimeは1つのDockerコンテナ

```
┌─────────────────────────────────────────────────────────────┐
│     Bedrock AgentCore Runtime (1つのDockerコンテナ)          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js Backend (新規作成)                           │  │
│  │  - ポート8080でHTTPリクエスト受信                      │  │
│  │  - POST /invocations                                  │  │
│  │  - GET /ping                                          │  │
│  │  ↓ spawn('python', ['magi_agent.py'])                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Python Agents (既存)                                 │  │
│  │  - 同一コンテナ内で子プロセスとして実行                │  │
│  │  - magi_agent.py                                      │  │
│  │  - Strands Agents 1.0                                 │  │
│  │  - CASPAR / BALTHASAR / MELCHIOR / SOLOMON           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 使用しないパターン

❌ **Lambda Response Streaming** - 複雑で未実証
❌ **Amplify defineFunction()** - ストリーミング非対応
❌ **独自のストリーミング実装** - 車輪の再発明

### 採用するパターン

✅ **参考記事完全準拠** - 実証済みのアーキテクチャ

---

詳細は [ARCHITECTURE.md](../ARCHITECTURE.md) を参照してください。
