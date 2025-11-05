# ⚠️ このディレクトリのドキュメントは古い情報です

## 理由

このディレクトリのドキュメントは、Lambda関数やAPI Gatewayを使用する**古いアーキテクチャ**に基づいています。

現在のプロジェクトは[参考記事](https://qiita.com/moritalous/items/ea695f8a328585e1313b)のアーキテクチャを**完全準拠**で実装します。

## 正しいアーキテクチャドキュメント

最新のアーキテクチャ情報は以下を参照してください：

- **[docs/ARCHITECTURE.md](../ARCHITECTURE.md)** - 最新のアーキテクチャ設計書
- **[.kiro/specs/consolidated-magi-system/spec.md](../../.kiro/specs/consolidated-magi-system/spec.md)** - 実装仕様
- **[.kiro/steering/tech.md](../../.kiro/steering/tech.md)** - 技術ガイドライン

## 現在のアーキテクチャ（正しい）

```
Amplify Hosting (Next.js Frontend)
    ↓ useChat() → /invocations
AgentCore Runtime (1つのDockerコンテナ)
    ├─ Next.jsバックエンド（ポート8080）
    └─ Python magi_agent.py（子プロセス）
```

## このディレクトリの扱い

このディレクトリ（`docs/architecture/`）は**参考資料**として残していますが、
**実装には使用しないでください**。

新しい実装は必ず上記の最新ドキュメントを参照してください。
