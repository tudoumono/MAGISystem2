# MAGI Decision System - ドキュメント

## 📚 ドキュメント構成

このプロジェクトは**AgentCore Runtime + Strands Agents**アーキテクチャで実装されています。

### 🏗️ アーキテクチャ

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - システム全体のアーキテクチャ設計
  - AgentCore Runtime（1つのDockerコンテナ）
  - Next.js + Python統合パターン
  - 参考記事完全準拠の実装方針

### 🚀 セットアップ・デプロイ

- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - 開発環境のセットアップ手順
- **[agentcore-runtime-setup.md](./agentcore-runtime-setup.md)** - AgentCore Runtimeのセットアップ
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - デプロイ前のチェックリスト
- **[deployment/](./deployment/)** - 詳細なデプロイ手順
  - [bedrock-agentcore-setup.md](./deployment/bedrock-agentcore-setup.md)
  - [user-action-guide.md](./deployment/user-action-guide.md)

### 🤖 エージェント・AI

- **[bedrock-models-for-magi.md](./bedrock-models-for-magi.md)** - Bedrockモデル設定
- **[agents/README.md](../agents/README.md)** - Strands Agents実装ガイド
- **[agents/DEBUG_GUIDE.md](../agents/DEBUG_GUIDE.md)** - エージェントデバッグガイド

### 💰 運用・コスト

- **[magi-system-cost-estimation.md](./magi-system-cost-estimation.md)** - コスト見積もり

### 🛠️ 開発

- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - 開発ガイド
- **[learning/](./learning/)** - 学習リソース
  - [uv-python-management.md](./learning/uv-python-management.md) - Python環境管理

---

## 🎯 クイックスタート

### 1. システム理解
まずは **[ARCHITECTURE.md](./ARCHITECTURE.md)** を読んで、全体像を把握してください。

### 2. 開発環境構築
**[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** に従って、ローカル開発環境を構築してください。

### 3. AgentCore Runtimeセットアップ
**[agentcore-runtime-setup.md](./agentcore-runtime-setup.md)** でエージェント実行環境をセットアップしてください。

### 4. デプロイ
**[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** を確認してデプロイしてください。

---

## 📋 重要な設計判断

### AgentCore Runtime統合パターン

このプロジェクトは以下の記事のアーキテクチャを**完全準拠**で実装します：

**[Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)**

### 主要な特徴

1. **1つのDockerコンテナ** - Next.js + Pythonが同じコンテナ内で動作
2. **ストリーミング対応** - Server-Sent Eventsによるリアルタイム応答
3. **Strands Agents 1.0** - 本番対応のマルチエージェントフレームワーク
4. **既存資産活用** - フロントエンド・バックエンドの再利用

---

## 🔄 ドキュメント更新履歴

| 日付 | 更新内容 |
|------|----------|
| 2025-11-06 | 古い設計のドキュメントを削除、AgentCore Runtime準拠に整理 |
| 2025-10-26 | 初版ドキュメント作成 |

---

**MAGI Development Team**
