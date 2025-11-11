# MAGI Decision System - ドキュメント

MAGI Decision Systemの技術ドキュメントへようこそ。

## 📖 クイックナビゲーション

### 🚀 はじめに

- **[5分クイックスタート](01-getting-started/QUICKSTART.md)** - 今すぐ始める
- **[開発環境セットアップ](01-getting-started/DEVELOPMENT_SETUP.md)** - 詳細な環境構築手順

### 🏗️ アーキテクチャ

- **[システム概要](02-architecture/OVERVIEW.md)** - MAGI Systemの全体像
- **[設計判断記録](02-architecture/DESIGN_DECISIONS.md)** - 技術選択の理由と経緯
- **[詳細設計](02-architecture/DETAILS.md)** - 実装の詳細

### 🚢 デプロイ

- **[デプロイチェックリスト](03-deployment/CHECKLIST.md)** - デプロイ前の確認事項
- **[本番環境デプロイ](03-deployment/PRODUCTION_GUIDE.md)** - 本番環境への展開手順

### ⚙️ エージェント設定

- **[AgentCore Runtime](04-agent-configuration/AGENTCORE_SETUP.md)** - AgentCore環境構築
- **[カスタムプロンプト](04-agent-configuration/CUSTOM_PROMPTS.md)** - プロンプト設定
- **[モデル設定](04-agent-configuration/MODEL_CONFIGURATION.md)** - Bedrockモデル選択

### 📊 運用

- **[コスト見積もり](05-operations/COST_ESTIMATION.md)** - AWS利用料金の試算

### 📚 参考資料

- **[学習リソース](99-reference/learning/)** - 技術学習資料
- **[アーカイブ](99-reference/archive-deployment/)** - 過去のドキュメント
- **[実装アーカイブ](99-reference/archive-implementation/)** - 非推奨・参考実装

## 🎯 ドキュメント構成

```
docs/
├── 01-getting-started/      # 入門ガイド
├── 02-architecture/         # アーキテクチャ設計
├── 03-deployment/           # デプロイ手順
├── 04-agent-configuration/  # エージェント設定
├── 05-operations/           # 運用ガイド
└── 99-reference/            # 参考資料・アーカイブ
```

## 🔍 ドキュメントの探し方

### 初めての方

1. [5分クイックスタート](01-getting-started/QUICKSTART.md)で動作確認
2. [開発環境セットアップ](01-getting-started/DEVELOPMENT_SETUP.md)で詳細構築
3. [システム概要](02-architecture/OVERVIEW.md)でアーキテクチャ理解

### 開発者向け

- **フロントエンド開発**: [開発環境セットアップ](01-getting-started/DEVELOPMENT_SETUP.md)
- **エージェント開発**: [AgentCore Runtime](04-agent-configuration/AGENTCORE_SETUP.md)
- **プロンプト調整**: [カスタムプロンプト](04-agent-configuration/CUSTOM_PROMPTS.md)

### 運用担当者向け

- **デプロイ**: [本番環境デプロイ](03-deployment/PRODUCTION_GUIDE.md)
- **コスト管理**: [コスト見積もり](05-operations/COST_ESTIMATION.md)
- **トラブルシューティング**: 各ガイドのトラブルシューティングセクション

## 🤝 貢献

ドキュメントの改善提案は[GitHub Issues](https://github.com/tudoumono/MAGISystem2/issues)へお願いします。

## 🔄 アーキテクチャの進化

MAGIシステムは段階的に進化してきました：

- **❌ PR #5 (2025-11)**: BedrockAgentCoreClient方式を試行
  - AWS SDKを使用した直接呼び出しアプローチ
  - 参考記事のコンセプトと異なることが判明
  - 詳細: [deprecated-bedrock-client-approach.ts](99-reference/archive-implementation/deprecated-bedrock-client-approach.ts)

- **✅ PR #6以降 (2025-11)**: AgentCore Runtime方式に統一
  - Next.js → Python子プロセス → Strands Agents
  - 参考記事準拠のアーキテクチャ
  - 実装: `agents/backend/app/api/invocations/route.ts`

詳細な比較は[アーキテクチャ設計判断](02-architecture/DESIGN_DECISIONS.md)を参照してください。

## 📝 ドキュメント更新履歴

- **2025-11-10**: ドキュメント構造を大幅リファクタリング（17→10ファイル）
- **2025-11-10**: 非推奨実装をアーカイブディレクトリに移動
- **2025-11**: Phase 2完了、AgentCore Runtime統合
- **2024**: プロジェクト開始、初期ドキュメント作成

## 🔗 外部リンク

- **[GitHub Repository](https://github.com/tudoumono/MAGISystem2)**
- **[Strands Agents公式](https://strandsagents.com/latest/)**
- **[AWS Amplify Gen 2](https://docs.amplify.aws/react/)**
- **[Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)**
