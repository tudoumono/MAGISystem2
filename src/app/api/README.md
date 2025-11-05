# ⚠️ このディレクトリは使用されません

## 理由

このプロジェクトは[参考記事](https://qiita.com/moritalous/items/ea695f8a328585e1313b)のアーキテクチャを完全準拠で実装します。

**参考記事のアーキテクチャ:**
```
Amplify Hosting (Next.js Frontend)
    ↓ useChat() → /invocations
AgentCore Runtime (Next.js Backend)
    ├─ POST /invocations
    ├─ GET /ping
    └─ Python magi_agent.py呼び出し
```

## 正しい実装場所

- **バックエンドAPI**: `agents/backend/app/api/` （新規作成予定）
- **フロントエンド**: `src/app/dashboard/` （既存）
- **通信**: `useChat()` フック使用

## このディレクトリの扱い

このディレクトリ（`src/app/api/`）は**削除予定**です。

参考記事のパターンでは、Next.jsのAPI RoutesはAgentCore Runtime内で動作し、
Amplify Hosting側のNext.jsアプリには含まれません。

## 参考資料

- [参考記事: Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- [アーキテクチャ設計書](../../docs/ARCHITECTURE.md)
