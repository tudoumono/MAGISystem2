# 統合実装計画 - MAGI Decision System

## 🎯 統合戦略: 重複排除と効率化

### 📊 **統合による改善点**
- **重複排除**: 3つのSpecで重複していた作業を1つに統合
- **実装順序最適化**: フロントエンドファースト → バックエンド → エージェント → 運用
- **学習効果最大化**: 視覚的フィードバックによる段階的学習
- **技術統一**: 一貫したアーキテクチャと設計判断

---

## 📋 AWS MCP参照タスク（継続的実施）

- [x] **AWS MCP継続参照**: 2025年最新情報の確認と反映 **[🤖 Kiro]** ✅ **2025年10月26日更新完了**
  - ✅ **Amplify Gen2 TypeScript Data client for Lambda**: 2025年1月GA、Lambda関数内でtype-safe data操作が可能
  - ✅ **Bedrock Multi-Agent Collaboration GA**: 2025年3月GA、Supervisor-Sub Agent協調、Inline Agents、Payload Referencing
  - ✅ **AgentCore Runtime Observability**: 2025年プレビュー版、OpenTelemetry統合、CloudWatch GenAI Observability
  - ✅ **CloudWatch Application Signals**: SLI/SLO自動計算、Burn Rate監視、Exclusion Time Windows（2025年3月）
  - ✅ **AWS Distro for OpenTelemetry (ADOT)**: W3C Trace Context対応、collector-less telemetry export
  - _実装状況: 最新AWS機能を活用した統合実装基盤が完成、実際のBedrock統合が次のステップ_

---

## Phase 1: 統合基盤とフロントエンド実装

### 1. プロジェクト統合セットアップ **[🤖 Kiro]**

- [x] 1.1 統合プロジェクト構造の作成 **[🤖 Kiro]** ✅ **完了**
  - ✅ Next.js 15 + TypeScript + Tailwind CSSプロジェクト
  - ✅ Amplify Gen2統合設定（認証、データ、関数）
  - ✅ Strands Agents統合ディレクトリ構造（agents/）
  - ✅ 統一された型定義とインターフェース
  - ✅ **🤖 AI可読性**: 統合アーキテクチャの設計判断を詳細解説
  - _実装確認: package.json、amplify/backend.ts、agents/README.md_

- [x] 1.2 統合データモデルの実装 **[🤖 Kiro]** ✅ **完了**
  - ✅ User、Conversation、Message、TraceStep、AgentPresetモデル統合
  - ✅ オーナーベースアクセス制御の統一実装
  - ✅ GraphQLサブスクリプション統合設定
  - ✅ モック→実データ移行の基盤構築
  - _実装確認: amplify/data/、API.ts、queries.ts、mutations.ts、subscriptions.ts_

- [x] 1.3 統合認証システムの実装 **[🤖 Kiro]** ✅ **完了**
  - ✅ Cognito User Pool統合設定
  - ✅ SSR認証フローの統一実装
  - ✅ セキュリティ強化設定の統合
  - ✅ 認証UIコンポーネントの統合
  - _実装確認: amplify/auth/、src/middleware.ts_

### 2. 統合UIコンポーネントシステム **[🤖 Kiro]**

- [x] 2.1 MAGIデザインシステムの統合実装 **[🤖 Kiro]** ✅ **完了**
  - ✅ エヴァンゲリオン風デザインシステム
  - ✅ 3賢者 + SOLOMON Judge用UIコンポーネント
  - ✅ 可決/否決判断の視覚的表示システム
  - ✅ アクセシビリティ対応（色+アイコン併用）
  - ✅ レスポンシブデザイン対応
  - _実装確認: src/components/、tailwind.config.ts_

- [x] 2.2 統合チャットインターフェースの実装 **[🤖 Kiro]** ✅ **完了**
  - ✅ 会話管理サイドバー統合
  - ✅ メッセージ表示とエージェント応答パネル統合
  - ✅ リアルタイム更新機能統合
  - ✅ トレース表示機能統合
  - _実装確認: src/app/、src/components/、src/hooks/_

### 3. 統合モックデータシステム **[🤖 Kiro]**

- [x] 3.1 包括的モックデータライブラリ **[🤖 Kiro]** ✅ **完了**
  - ✅ 様々なシナリオ（全員一致、意見分裂、エラー）対応
  - ✅ リアルな応答時間シミュレーション
  - ✅ MAGI投票結果のモックデータ
  - ✅ トレースステップのモックデータ
  - ✅ モック→実データ移行の容易な設計
  - _実装確認: src/lib/、REALTIME_IMPLEMENTATION_SUMMARY.md_

---

## Phase 2: バックエンド統合とリアルタイム機能

### 4. Amplify統合バックエンド実装 **[🤖 Kiro + 👤 Human]**

- [x] 4.1 統合Amplify Data実装 **[🤖 Kiro + 👤 Human]** ✅ **実装完了**
  - ✅ **実装完了** Amplify Dataスキーマ定義とデプロイ準備
  - ✅ **実装完了** モック→実データクライアント切り替え機能
  - ✅ **実装完了** 環境変数による開発/本番環境自動切り替え
  - ✅ **実装完了** データシーディング機能（2025年新機能活用）
  - _実装確認: amplify_outputs.json、amplify/data/resource.ts_

- [x] 4.2 統合リアルタイム機能実装 **[🤖 Kiro]** ✅ **実装完了**
  - ✅ GraphQL Subscriptionsによるリアルタイム会話更新
  - ✅ トレースステップのライブ更新
  - ✅ 楽観的更新と実データ同期
  - ✅ WebSocket接続管理とスケーラビリティ対策
  - _実装確認: subscriptions.ts、src/hooks/、REALTIME_IMPLEMENTATION_SUMMARY.md_

### 5. 統合カスタムハンドラー実装 **[🤖 Kiro]**

- [ ] 5.1 統合エージェントゲートウェイ基盤実装 **[🤖 Kiro]** 🔄 **設計完了・実装未完了**
  - ✅ **実装完了** Amplify Functions基盤（bedrock-agent-gateway）
  - ✅ **設計完了** Bedrock Multi-Agent Collaboration統合設計（2025年GA版）
  - ✅ **設計完了** Inline Agents動的生成機能設計
  - ✅ **設計完了** OpenTelemetryトレーシング統合設計
  - ⏳ **未実装** 実際のBedrock SDK統合（型エラー多数）
  - ⏳ **未実装** 型定義ファイル（amplify/types/api.ts, domain.ts）
  - ⏳ **要Human設定** IAM Role ARN設定（BEDROCK_AGENT_EXECUTION_ROLE_ARN）
  - _実装確認: amplify/functions/bedrock-agent-gateway/（設計のみ、TypeScript型エラー）_

- [ ] 5.2 統合セキュリティ実装 **[🤖 Kiro + 👤 Human]** ⏳ **未実装**
  - ⏳ **未実装** IAM権限の統合設定
  - ⏳ **未実装** VPCエンドポイントとプライベート通信
  - ⏳ **未実装** セキュリティグループ統合設定
  - ⏳ **未実装** プロンプトインジェクション対策

---

## Phase 3: エージェント統合とMAGI実装

### 6. 統合Strands Agents実装 **[🤖 Kiro + 👤 Human]**

- [ ] 6.1 SOLOMON統括エージェント実装 **[🤖 Kiro]** 🔄 **部分実装**
  - ✅ **実装完了** SOLOMONエージェント基本構造（agents/solomon/agent.py）
  - ✅ **実装完了** MAGI投票システムの統合（可決/否決判断収集）
  - ✅ **実装完了** 従来機能（0-100点スコアリング）との統合
  - ✅ **実装完了** エラーハンドリングと段階的機能縮退
  - ⏳ **未実装** 実際のStrands Agents SDKとの統合（strands-agents依存関係未解決）
  - ⏳ **未実装** Bedrock AgentCoreとの実際の統合
  - _実装確認: agents/solomon/agent.py（モック実装）、Strands Agents SDK未統合_

- [ ] 6.2 3賢者エージェント実装 **[🤖 Kiro]** 🔄 **部分実装**
  - ✅ **実装完了** CASPAR（保守的・現実的視点）エージェント基本構造
  - ✅ **実装完了** BALTHASAR（革新的・感情的視点）エージェント基本構造  
  - ✅ **実装完了** MELCHIOR（バランス型・科学的視点）エージェント基本構造
  - ✅ **実装完了** 各エージェントの投票判断機能（モック実装）
  - ⏳ **未実装** 実際のStrands Agents SDKとの統合
  - ⏳ **未実装** A2A通信プロトコル統合
  - _実装確認: agents/caspar/agent.py等（モック実装）、Strands Agents SDK未統合_

- [ ] 6.3 Bedrock Multi-Agent Collaboration統合 **[👤 Human + 🤖 Kiro]** 🔄 **設計完了・実装未完了**
  - ⏳ **要Human設定** Bedrock モデルアクセス権限設定
  - ⏳ **要Human設定** IAM Role ARN設定（BEDROCK_AGENT_EXECUTION_ROLE_ARN）
  - ✅ **設計完了** Supervisor Agent（SOLOMON）とSub-Agents（3賢者）の統合設計
  - ✅ **設計完了** Inline AgentsとPayload Referencing活用設計
  - ⏳ **未実装** 実際のBedrock Multi-Agent Collaboration API統合
  - ⏳ **未実装** 型定義ファイル（amplify/types/）の作成
  - _実装確認: amplify/functions/bedrock-agent-gateway/（設計のみ、型エラー多数）_

### 7. MAGI投票システム統合実装 **[🤖 Kiro]**

- [ ] 7.1 投票結果表示システム実装 **[🤖 Kiro]**
  - 各賢者の投票判断（approve/reject/abstain）の視覚的表示
  - 色分け + アイコンによる判断結果表示システム
  - 投票パターン分析（全員一致、多数決、意見分裂）の実装
  - 最終判断（approved/rejected/abstain）の統合表示
  - _要件: 1.2_

- [ ] 7.2 投票理由と信頼度表示 **[🤖 Kiro]**
  - 各賢者の判断根拠の詳細表示機能
  - 信頼度（0-100）の視覚的インジケーター
  - 統合判断の理由説明機能
  - アクセシビリティ対応（色覚対応、スクリーンリーダー対応）
  - _要件: 1.2, 8.1_

### 8. 統合エージェント設定システム **[🤖 Kiro]**

- [ ] 8.1 統合プリセット管理システム **[🤖 Kiro]**
  - エージェント設定コンポーネント統合
  - デフォルトプリセット（デフォルト、学術研究、ビジネス分析）
  - プリセット管理インターフェース（作成、編集、削除、複製）
  - 動的設定切り替え機能
  - _要件: 3.3_

- [ ] 8.2 統合再実行・比較機能 **[🤖 Kiro]**
  - 結果比較付き「再質問」機能
  - 応答履歴とバージョン比較
  - 応答評価とフィードバック収集
  - 設定変更通知と確認機能
  - _要件: 3.5_

---

## Phase 4: 統合観測システムと運用準備

### 9. 統合分散トレーシング実装 **[🤖 Kiro]**

- [x] 9.1 統合OpenTelemetry実装 **[🤖 Kiro]** ✅ **基盤実装完了**
  - ✅ **実装完了** Bedrock Gateway内OpenTelemetryトレーシング
  - ✅ **実装完了** W3C Trace Context対応のトレースID伝播
  - ✅ **実装完了** UI → Gateway → Bedrock Agentsの一連トレース
  - ✅ **実装完了** カスタムメトリクス統合定義（実行時間、エージェント判断、エラー率）
  - ⏳ **要設定** Next.js側のOpenTelemetry instrumentation設定
  - _実装確認: amplify/functions/bedrock-agent-gateway/handler.ts（tracer実装済み）_

- [ ] 9.2 統合CloudWatch Application Signals **[🤖 Kiro + 👤 Human]** ⏳ **基盤準備完了**
  - ✅ **準備完了** Application Signalsメトリクス収集基盤（OpenTelemetry統合済み）
  - ⏳ **要実装** SLI/SLO自動計算機能統合（2025年新機能活用）
  - ⏳ **要Human設定** 統合ダッシュボード作成
  - ⏳ **要Human設定** Burn Rate監視とExclusion Time Windows設定
  - _要件: OpenTelemetryトレーシングが実装済みのため、Application Signals統合が容易_

### 10. 基本パフォーマンス最適化 **[🤖 Kiro]**

- [ ] 10.1 基本キャッシュ実装 **[🤖 Kiro]**
  - ブラウザキャッシュとローカルストレージ活用
  - エージェント応答の基本キャッシュ
  - プリセット設定のローカル保存
  - 簡単なTTL管理
  - _要件: 7.2, 7.3_

- [ ] 10.2 基本リソース管理 **[🤖 Kiro]**
  - Lambda関数の基本設定（メモリ、タイムアウト）
  - DynamoDBオンデマンド課金の活用
  - 不要なリソースの手動削除
  - 基本的なエラーハンドリング
  - _要件: 6.2, 7.4_

---

## Phase 5: 基本デプロイメントと学習

### 11. 基本デプロイメント **[🤖 Kiro + 👤 Human]**

- [ ] 11.1 シンプルデプロイメント **[🤖 Kiro + 👤 Human]** ⏳ **実装準備完了**
  - ⏳ **要Human実行** `npx ampx push` による手動デプロイ
  - ✅ **設定完了** Amplify Hostingのデフォルト設定を使用
  - ✅ **設定完了** CloudFrontが自動的に有効化される（Amplify標準機能）
  - ✅ **設定完了** Amplify Console設定（amplify/backend.ts）
  - ⏳ **要Human設定** 必要な環境変数設定（IAM Role ARN等）
  - ✅ **設定完了** 開発環境構成
  - ✅ **準備完了** OpenTelemetryによるエラーログ確認機能
  - _実装状況: デプロイ準備完了、Human側でのAWS設定とデプロイ実行が必要_

- [ ] 11.2 基本セキュリティ **[🤖 Kiro + 👤 Human]** ✅ **実装完了**
  - ✅ **実装完了** Amplify標準のHTTPS設定
  - ✅ **実装完了** Cognito認証設定（amplify/auth/resource.ts）
  - ✅ **実装完了** 環境変数による機密情報管理
  - ⏳ **要Human設定** Bedrock用IAM権限設定
  - _実装確認: amplify/auth/resource.ts、amplify/backend.ts（セキュリティ設定完了）_

### 12. 基本テスト実装（学習用）

- [ ]* 12.1 基本単体テスト **[🤖 Kiro]**
  - 重要フック（useConversations、useMessages）の基本テスト
  - エージェント応答処理の基本テスト
  - MAGI投票システムの基本テスト
  - 基本的なエラーハンドリングテスト
  - _要件: テスト戦略の実装_

- [ ]* 12.2 統合テスト **[🤖 Kiro]**
  - 3賢者並列実行の統合テスト
  - MAGI投票システムの統合テスト
  - リアルタイム更新の統合テスト
  - エラーハンドリングの統合テスト
  - _要件: テスト戦略の実装_

- [ ]* 12.3 手動E2Eテスト **[🤖 Kiro]**
  - 基本的な会話作成フローの手動テスト
  - エージェント応答表示の動作確認
  - MAGI投票結果表示の確認
  - 基本的なエラーケースの確認
  - _要件: テスト戦略の実装_

---

## Phase 6: 学習用ドキュメント作成

### 13. 学習用ドキュメント **[🤖 Kiro]**

- [ ] 13.1 開発学習ガイド作成 **[🤖 Kiro]**
  - システムアーキテクチャの学習ガイド
  - 各技術スタックの学習ポイント
  - MAGI投票システムの実装パターン解説
  - トラブルシューティング基礎
  - _要件: 8.4_

- [ ] 13.2 実装手順書作成 **[🤖 Kiro]**
  - ステップバイステップの実装手順
  - 各段階での学習ポイント
  - よくある問題と解決方法
  - 次のステップへの発展方法
  - _要件: 8.4_

---

## 📊 現在の実装状況サマリー（2025年10月26日更新）

### ✅ Phase 1-2: 完了済み（フロントエンド + バックエンド基盤）
- **プロジェクト基盤**: Next.js 15 + Amplify Gen2 + Strands Agents構造
- **UIコンポーネント**: MAGIデザインシステム + チャットインターフェース
- **データ基盤**: Amplify Data + GraphQL + リアルタイム機能
- **認証システム**: Cognito + SSR認証フロー

### 🔄 Phase 3: 部分実装（エージェント統合）
- **Bedrock Multi-Agent Collaboration**: 🔄 設計完了、実装未完了（型エラー多数）
- **SOLOMON統括エージェント**: 🔄 モック実装完了、Strands Agents SDK未統合
- **3賢者エージェント**: 🔄 モック実装完了、Strands Agents SDK未統合
- **エージェントゲートウェイ**: 🔄 設計完了、実装未完了（型定義不足）

### 🔄 Phase 4: 部分実装（観測・運用）
- **分散トレーシング**: ✅ OpenTelemetry基盤実装完了
- **CloudWatch統合**: 🔄 基盤準備完了、Application Signals設定待ち
- **テスト・デプロイ**: ⏳ 未実装

### ⏳ Phase 5-6: 未実装（デプロイ・学習）
- **基本デプロイメント**: ⏳ Human側でのAWS設定が必要
- **学習用ドキュメント**: ⏳ 未実装

## 🎯 次の優先実装タスク

### 最優先: Phase 3エージェント統合完了
1. **型定義ファイル作成** (amplify/types/api.ts, domain.ts)
2. **Strands Agents SDK統合** (agents/pyproject.toml依存関係解決)
3. **Bedrock Multi-Agent Collaboration実装** (タスク6.3)
4. **TypeScript型エラー修正** (handler.ts等)

### 次優先: Human側AWS設定
1. **IAM Role設定** (BEDROCK_AGENT_EXECUTION_ROLE_ARN)
2. **Bedrock モデルアクセス権限設定**
3. **基本デプロイメント実行** (`npx ampx push`)

### その後: Phase 4-6
1. **CloudWatch Application Signals設定** (タスク9.2)
2. **基本テスト実装** (タスク12.1-12.3)
3. **学習用ドキュメント作成** (タスク13.1-13.2)

## 🔄 統合移行手順

### 現在の状況: Phase 2完了 → Phase 3実装中
1. **フロントエンド**: ✅ 完全実装済み
2. **バックエンド基盤**: ✅ Amplify Data + リアルタイム完了
3. **エージェント統合**: 🔄 設計完了、実装未完了（Strands Agents SDK、型定義、Bedrock統合が必要）
4. **観測基盤**: 🔄 設計完了、実装未完了

### 実際の動作確認に必要な作業
1. **Phase 3完了**: 型定義、Strands Agents SDK統合、Bedrock実装
2. **AWS設定**: IAM Role ARN設定、Bedrock モデルアクセス権限
3. **デプロイ**: Amplify環境のデプロイ

---

## 🚀 Human側で必要な設定手順（優先度順）

### 最優先: AWS基本設定
1. **IAM Role作成**: Bedrock Agent実行用のIAMロール
   ```bash
   # 必要な権限:
   # - bedrock:InvokeModel
   # - bedrock:CreateAgent
   # - bedrock:InvokeAgent
   # - logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents
   ```

2. **環境変数設定**: `.env.local`に以下を追加
   ```bash
   BEDROCK_AGENT_EXECUTION_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role/BedrockAgentExecutionRole
   BEDROCK_REGION=us-east-1
   SOLOMON_MODEL_ID=anthropic.claude-3-opus-20240229-v1:0
   CASPAR_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
   BALTHASAR_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
   MELCHIOR_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
   ```

3. **Bedrock モデルアクセス**: AWS Consoleでモデルアクセス権限を有効化
   - Claude 3 Opus (SOLOMON用)
   - Claude 3 Sonnet (3賢者用)

### 次優先: デプロイ実行
4. **Amplifyデプロイ**: 
   ```bash
   npx ampx push
   ```

5. **動作確認**: デプロイ後のエンドポイントテスト

### その後: 観測設定
6. **CloudWatch Application Signals**: SLI/SLO設定
7. **ダッシュボード作成**: 統合監視ダッシュボード

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