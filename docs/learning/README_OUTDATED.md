# ⚠️ このディレクトリの学習資料について

## 注意事項

このディレクトリ（`docs/learning/`）の学習資料は、Lambda関数やAPI Gatewayを使用する**古いアーキテクチャ**に基づいています。

特に以下のファイルは現在のアーキテクチャと異なります：

- `03-aws-amplify-gen2.md` - defineFunction()の説明（現在は使用しない）
- その他Lambda関数関連の説明

## 現在のアーキテクチャ

現在のプロジェクトは[参考記事](https://qiita.com/moritalous/items/ea695f8a328585e1313b)のアーキテクチャを**完全準拠**で実装します。

```
Amplify Hosting (Next.js Frontend)
    ↓ useChat() → /invocations
AgentCore Runtime (1つのDockerコンテナ)
    ├─ Next.jsバックエンド（ポート8080）
    └─ Python magi_agent.py（子プロセス）
```

## 正しい学習リソース

最新のアーキテクチャを学習するには以下を参照してください：

1. **[docs/ARCHITECTURE.md](../ARCHITECTURE.md)** - アーキテクチャ設計書
2. **[参考記事](https://qiita.com/moritalous/items/ea695f8a328585e1313b)** - 実装パターンの元ネタ
3. **[Strands Agents公式ドキュメント](https://strandsagents.com/latest/)** - エージェントフレームワーク

## このディレクトリの扱い

このディレクトリの学習資料は**参考資料**として残していますが、
現在のアーキテクチャとは異なる部分があることに注意してください。
