# 統合実装計画 - MAGI Decision System

## 🎯 統合戦略: 重複排除と効率化

### 📊 **統合による改善点**
- **重複排除**: 3つのSpecで重複していた作業を1つに統合
- **実装順序最適化**: フロントエンドファースト → バックエンド → エージェント → 運用
- **学習効果最大化**: 視覚的フィードバックによる段階的学習
- **技術統一**: 一貫したアーキテクチャと設計判断

---

## 📋 AWS MCP参照タスク（継続的実施）

- [x] **AWS MCP継続参照**: 2025年最新情報の確認と反映 **[🤖 Kiro]**
  - **2025年新機能**: Amplify Gen2 TypeScript Data client for Lambda（2025年1月GA）
  - **Bedrock Multi-Agent Collaboration GA**: 2025年3月GA、Inline Agents、Payload Referencing
  - **AgentCore Runtime**: 2025年プレビュー版、Observability機能
  - **CloudWatch Application Signals**: SLI/SLO自動計算、Machine Learning Insights
  - **AWS Distro for OpenTelemetry (ADOT)**: W3C Trace Context対応
  - _学習戦略: 2025年最新のAWS機能を活用した統合実装_

---

## Phase 1: 統合基盤とフロントエンド実装

### 1. プロジェクト統合セットアップ **[🤖 Kiro]**

- [x] 1.1 統合プロジェクト構造の作成 **[🤖 Kiro]**
  - Next.js 15 + TypeScript + Tailwind CSSプロジェクト（既存活用）
  - Amplify Gen2統合設定（認証、データ、関数）
  - Strands Agents統合ディレクトリ構造
  - 統一された型定義とインターフェース
  - **🤖 AI可読性**: 統合アーキテクチャの設計判断を詳細解説
  - _統合元: magi-decision-ui/1, infra-amplify-agentcore/1, agent-gateway/1_

- [x] 1.2 統合データモデルの実装 **[🤖 Kiro]**
  - User、Conversation、Message、TraceStep、AgentPresetモデル統合
  - オーナーベースアクセス制御の統一実装
  - GraphQLサブスクリプション統合設定
  - モック→実データ移行の基盤構築
  - _統合元: magi-decision-ui/2, infra-amplify-agentcore/3_

- [x] 1.3 統合認証システムの実装 **[🤖 Kiro]**
  - Cognito User Pool統合設定
  - SSR認証フローの統一実装
  - セキュリティ強化設定の統合
  - 認証UIコンポーネントの統合
  - _統合元: magi-decision-ui/6, infra-amplify-agentcore/2_

### 2. 統合UIコンポーネントシステム **[🤖 Kiro]**

- [x] 2.1 MAGIデザインシステムの統合実装 **[🤖 Kiro]**
  - エヴァンゲリオン風デザインシステム
  - 3賢者 + SOLOMON Judge用UIコンポーネント
  - 可決/否決判断の視覚的表示システム
  - アクセシビリティ対応（色+アイコン併用）
  - レスポンシブデザイン対応
  - _統合元: magi-decision-ui/4,7, agent-gateway/1.5_

- [x] 2.2 統合チャットインターフェースの実装 **[🤖 Kiro]**
  - 会話管理サイドバー統合
  - メッセージ表示とエージェント応答パネル統合
  - リアルタイム更新機能統合
  - トレース表示機能統合
  - _統合元: magi-decision-ui/8,9, agent-gateway/1.5_

### 3. 統合モックデータシステム **[🤖 Kiro]**

- [x] 3.1 包括的モックデータライブラリ **[🤖 Kiro]**
  - 様々なシナリオ（全員一致、意見分裂、エラー）対応
  - リアルな応答時間シミュレーション
  - MAGI投票結果のモックデータ
  - トレースステップのモックデータ
  - モック→実データ移行の容易な設計
  - _統合元: magi-decision-ui/5, agent-gateway/1_

---

## Phase 2: バックエンド統合とリアルタイム機能

### 4. Amplify統合バックエンド実装 **[🤖 Kiro + 👤 Human]**

- [x] 4.1 統合Amplify Data実装 **[🤖 Kiro + 👤 Human]**
  - **[🔄 準備完了]** 実際のAmplify Dataデプロイ（Phase 1完了後に有効化）
  - **[🔄 実装完了]** モック→実データクライアント切り替え機能
  - **[🔄 実装完了]** 環境変数による開発/本番環境自動切り替え
  - **[🔄 実装完了]** データシーディング機能（2025年新機能活用）
  - _統合元: magi-decision-ui/10, infra-amplify-agentcore/3_

- [x] 4.2 統合リアルタイム機能実装 **[🤖 Kiro]**
  - GraphQL Subscriptionsによるリアルタイム会話更新
  - トレースステップのライブ更新
  - 楽観的更新と実データ同期
  - WebSocket接続管理とスケーラビリティ対策
  - _統合元: magi-decision-ui/10, infra-amplify-agentcore/3_

### 5. 統合カスタムハンドラー実装 **[🤖 Kiro]**

- [ ] 5.1 統合エージェントゲートウェイ実装 **[🤖 Kiro]**
  - Amplify Functions統合（agent-gateway）
  - Bedrock AgentCore Runtime統合（2025年プレビュー版）
  - Strands Agents 1.0統合
  - エラーハンドリングとフォールバック統合
  - _統合元: agent-gateway/4, infra-amplify-agentcore/5_

- [ ] 5.2 統合セキュリティ実装 **[🤖 Kiro + 👤 Human]**
  - IAM権限の統合設定
  - VPCエンドポイントとプライベート通信
  - セキュリティグループ統合設定
  - プロンプトインジェクション対策
  - _統合元: agent-gateway/4, infra-amplify-agentcore/5,12_

---

## Phase 3: エージェント統合とMAGI実装

### 6. 統合Strands Agents実装 **[🤖 Kiro + 👤 Human]**

- [x] 6.1 MAGI統括システム統合実装 **[🤖 Kiro]**
  - SOLOMON統括エージェント（オーケストレーター）
  - 3賢者エージェント（CASPAR、BALTHASAR、MELCHIOR）
  - A2A（Agent-to-Agent）プロトコル統合
  - MAGI投票システム（可決/否決判断）
  - 従来機能（詳細分析、スコアリング）との統合
  - _統合元: agent-gateway/1,2, magi-decision-ui/11_

- [ ] 6.2 Bedrock Multi-Agent Collaboration統合 **[👤 Human + 🤖 Kiro]**
  - **[👤 Human]** Bedrock モデルアクセス権限設定
  - **[👤 Human]** Multi-Agent Collaboration設定（2025年GA版）
  - **[🤖 Kiro]** Supervisor Agent（SOLOMON）実装
  - **[🤖 Kiro]** Sub-Agents（3賢者）実装
  - **[🤖 Kiro]** Inline AgentsとPayload Referencing活用
  - _統合元: magi-decision-ui/11, agent-gateway/3, infra-amplify-agentcore/4_

### 7. 統合エージェント設定システム **[🤖 Kiro]**

- [ ] 7.1 統合プリセット管理システム **[🤖 Kiro]**
  - エージェント設定コンポーネント統合
  - デフォルトプリセット（デフォルト、学術研究、ビジネス分析）
  - プリセット管理インターフェース（作成、編集、削除、複製）
  - 動的設定切り替え機能
  - _統合元: magi-decision-ui/12, agent-gateway/設定管理_

- [ ] 7.2 統合再実行・比較機能 **[🤖 Kiro]**
  - 結果比較付き「再質問」機能
  - 応答履歴とバージョン比較
  - 応答評価とフィードバック収集
  - 設定変更通知と確認機能
  - _統合元: magi-decision-ui/13_

---

## Phase 4: 統合観測システムと運用準備

### 8. 統合分散トレーシング実装 **[🤖 Kiro]**

- [ ] 8.1 統合OpenTelemetry実装 **[🤖 Kiro]**
  - Next.js + Amplify + Strands Agents統合トレーシング
  - W3C Trace Context対応のトレースID伝播
  - UI → Gateway → AgentCore → Strands Agentsの一連トレース
  - カスタムメトリクス統合定義
  - _統合元: agent-gateway/3, infra-amplify-agentcore/6_

- [ ] 8.2 統合CloudWatch Application Signals **[🤖 Kiro + 👤 Human]**
  - **[🤖 Kiro]** Application Signalsメトリクス収集統合
  - **[🤖 Kiro]** SLI/SLO自動計算機能統合
  - **[👤 Human]** 統合ダッシュボード作成
  - **[👤 Human]** Machine Learning Insights活用アラート設定
  - _統合元: agent-gateway/8, infra-amplify-agentcore/7_

### 9. 基本パフォーマンス最適化 **[🤖 Kiro]**

- [ ] 9.1 基本キャッシュ実装 **[🤖 Kiro]**
  - ブラウザキャッシュとローカルストレージ活用
  - エージェント応答の基本キャッシュ
  - プリセット設定のローカル保存
  - 簡単なTTL管理
  - _学習目的: キャッシュの基本概念理解_

- [ ] 9.2 基本リソース管理 **[🤖 Kiro]**
  - Lambda関数の基本設定（メモリ、タイムアウト）
  - DynamoDBオンデマンド課金の活用
  - 不要なリソースの手動削除
  - 基本的なエラーハンドリング
  - _学習目的: AWSリソース管理の基礎_

---

## Phase 5: 基本デプロイメントと学習

### 10. 基本デプロイメント **[🤖 Kiro + 👤 Human]**

- [ ] 10.1 シンプルデプロイメント **[🤖 Kiro + 👤 Human]**
  - **[👤 Human]** `npx ampx push` による手動デプロイ
  - **[🤖 Kiro]** Amplify Hostingのデフォルト設定を使用
  - **[🤖 Kiro]** CloudFrontが自動的に有効化される（Amplify標準機能）
  - **[🤖 Kiro]** 必要に応じてAmplify Console設定を調整
  - **[🤖 Kiro]** 基本的な環境変数設定
  - **[🤖 Kiro]** 開発環境のみの構成
  - **[🤖 Kiro]** 基本的なエラーログ確認方法
  - _学習目的: Amplifyデプロイの基礎理解とCDN自動設定_

- [ ] 10.2 基本セキュリティ **[🤖 Kiro + 👤 Human]**
  - **[🤖 Kiro]** Amplify標準のHTTPS設定
  - **[🤖 Kiro]** 基本的なCognito認証設定
  - **[🤖 Kiro]** 環境変数による機密情報管理
  - **[🤖 Kiro]** 基本的なIAM権限設定
  - _学習目的: AWS基本セキュリティの理解_

### 11. 基本テスト実装（学習用）

- [ ]* 11.1 基本単体テスト **[🤖 Kiro]**
  - 重要フック（useConversations、useMessages）の基本テスト
  - エージェント応答処理の基本テスト
  - 基本的なエラーハンドリングテスト
  - _学習目的: テスト駆動開発の基礎理解_

- [ ]* 11.2 手動E2Eテスト **[🤖 Kiro]**
  - 基本的な会話作成フローの手動テスト
  - エージェント応答表示の動作確認
  - 基本的なエラーケースの確認
  - _学習目的: システム全体の動作理解_

---

## Phase 5: 学習用ドキュメント作成

### 12. 学習用ドキュメント **[🤖 Kiro]**

- [ ] 12.1 開発学習ガイド作成 **[🤖 Kiro]**
  - システムアーキテクチャの学習ガイド
  - 各技術スタックの学習ポイント
  - 実装パターンの解説
  - トラブルシューティング基礎
  - _学習目的: 技術理解の深化_

- [ ] 12.2 実装手順書作成 **[🤖 Kiro]**
  - ステップバイステップの実装手順
  - 各段階での学習ポイント
  - よくある問題と解決方法
  - 次のステップへの発展方法
  - _学習目的: 実践的な開発スキル習得_

---

## 🔄 統合移行手順

### Phase 1完了後の移行
1. **MOCKモード強制解除**
   ```typescript
   // src/lib/amplify/config.ts
   const FORCE_MOCK_UNTIL_PHASE2_COMPLETE = false; // true → false
   ```

2. **統合環境ステータス確認**
   - 🔧 **Development Mode** 自動切り替え
   - ☁️ **Connected** 状態確認

3. **Phase 2統合機能有効化**
   - 実際のAWS接続開始
   - 統合データシーディング実行
   - 統合リアルタイム機能開始

---

## 📚 統合学習資料更新

- [ ] **統合学習ドキュメント作成**: 各Phase完了時
  - `docs/learning/consolidated-system/README.md` 新規作成
  - `docs/learning/consolidated-system/architecture-decisions.md` 新規作成
  - `docs/learning/consolidated-system/integration-patterns.md` 新規作成
  - 統合アーキテクチャの設計判断をドキュメント化
  - 重複排除による効率化ポイントを記録
  - _学習戦略: 統合システム構築の完全ガイド_

---

## 🎯 個人学習開発に最適化された効果

### 学習効率向上
- **重複作業排除**: 3つのSpec → 1つの統合Spec
- **実装順序最適化**: フロントエンドファースト戦略
- **シンプル構成**: 学習に集中できる最小構成

### 学習効果最大化
- **視覚的フィードバック**: UIから始まる段階的実装
- **段階的複雑性**: 自然な学習曲線
- **実践的経験**: 実際に動くシステムでの学習

### コスト効率と実用性
- **無料枠活用**: AWS無料利用枠内での運用
- **シンプルデプロイ**: 手動デプロイによる理解促進
- **基本セキュリティ**: 学習に必要な最小限のセキュリティ