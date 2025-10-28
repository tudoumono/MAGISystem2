# 統合実装計画 - MAGI Decision System

## 🚨 **重要な設計変更: AgentCore Runtime + ストリーミング対応**

**みのるん氏の指摘を受けた緊急修正**:
- AWS AmplifyのdefineFunction()はストリーミングレスポンス（RESPONSE_STREAM）に対応していない
- MAGIシステムでは4エージェント並列実行で2-10分の待機時間が発生し、UXが完全に破綻
- 解決策: Next.js API Routes + AgentCore Runtime呼び出し + ストリーミング対応

## 🎯 **修正された実装戦略**

### 📊 **新しいアーキテクチャ**
```
Amplify Hosting (Next.js App)
├── フロントエンド: React コンポーネント（継続使用）
├── データ: Amplify Data + AppSync（継続使用）
├── 認証: Amplify Auth（継続使用）
└── API: Next.js API Routes（新規実装）
    └── AgentCore Runtime呼び出し + ストリーミング
```

### 📊 **実装順序最適化による効果**
- **ストリーミング対応**: リアルタイムエージェント応答
- **UX向上**: ChatGPT並みの体験実現
- **AgentCore Runtime活用**: 8時間実行、高度なエージェント機能
- **既存資産活用**: UI、認証、データベースそのまま
- **学習効果向上**: ストリーミング技術の習得

---

## 🔄 **修正された実装タスク**

### ステップ0: 既存AgentCore Runtime基盤（完了済み）

- [x] 0.1 AgentCore Runtime開発環境構築 **[🤖 Kiro]** ✅ **完了**
  - Python 3.11+ 仮想環境の作成
  - bedrock-agentcore、strands-agents、bedrock-agentcore-starter-toolkitのインストール
  - AWS認証情報の設定（ap-northeast-1リージョン）
  - 基本的な動作確認
  - _完了状況: agents/venv/, agents/requirements.txt, agents/.python-version_

- [x] 0.2 基本MAGI Agent実装 **[🤖 Kiro]** ✅ **完了**
  - `magi_agent.py`の作成（BedrockAgentCoreApp使用）
  - 単一エージェントでの基本動作確認
  - エントリーポイント関数の実装
  - Strands Agentsフレームワーク統合
  - _完了状況: agents/magi_agent.py, agents/magi_strands_agents.py_

- [x] 0.3 AgentCore設定 **[🤖 Kiro]** ✅ **完了**
  - `agentcore configure`による設定ファイル生成
  - ap-northeast-1リージョンの指定
  - `.bedrock_agentcore.yaml`設定の最適化
  - メモリ・タイムアウト設定（個人開発用）
  - _完了状況: agents/.bedrock_agentcore.yaml_

- [x] 0.4 ローカル動作確認 **[🤖 Kiro]** ✅ **完了**
  - ローカルエージェントサーバーの起動（ポート8080）
  - curlによる基本動作テスト
  - レスポンス形式の確認
  - 基本的なエラーハンドリング
  - _完了状況: agents/local_server.py, agents/test_local_server.py_

### ステップ1: AgentCore Runtime デプロイ（完了済み）

- [x] 1.1 初回デプロイ実行 **[🤖 Kiro + 👤 Human]** ✅ **完了**
  - Claude 3.5 Sonnetモデルアクセスの有効化 **[👤 Human]**
  - `agentcore launch`によるデプロイ **[🤖 Kiro]**
  - Agent ARNの取得・記録: `arn:aws:bedrock-agentcore:ap-northeast-1:262152767881:runtime/magi_agent-4ORNam2cHb`
  - デプロイ成功の確認
  - _完了状況: AgentCore Runtime完全デプロイ済み_

- [x] 1.2 デプロイ済みエージェントテスト **[🤖 Kiro]** ✅ **完了**
  - `agentcore invoke`による動作確認
  - MAGIシステム完全動作確認（3賢者 + SOLOMON Judge）
  - エラーケースのテスト
  - パフォーマンス測定: 36.954秒実行時間
  - _完了状況: MAGIシステム完璧動作、投票システム確認済み_

### ステップ2: ストリーミング対応API実装

- [x] 2.1 Next.js API Routes基盤構築 **[🤖 Kiro]** ✅ **完了**
  - `app/api/magi/stream/route.ts`の作成
  - Server-Sent Eventsによるストリーミング実装
  - AWS SDK for Bedrock Agent Runtime統合
  - 基本的なエラーハンドリング
  - _完了状況: ストリーミングAPI Route実装済み、モックモード動作確認済み_

- [x] 2.2 AgentCore Runtime呼び出し実装 **[🤖 Kiro]** ✅ **完了**
  - BedrockAgentRuntimeClientの設定
  - InvokeAgentCommandの実装（ストリーミング対応）
  - デプロイ済みAgentCore Runtime ARN統合
  - 認証・権限設定（環境変数対応）
  - _完了状況: AWS SDK統合完了、環境変数による認証設定済み_

- [x] 2.3 ストリーミング動作確認 **[🤖 Kiro]** ✅ **完了**
  - ローカル開発サーバーでのテスト
  - curlによるストリーミングレスポンステスト
  - モックモードでの動作確認
  - フロントエンド統合テスト
  - _完了状況: Server-Sent Events正常動作、モックレスポンス配信確認済み_

### ステップ3: AgentCore Runtime内MAGI Decision System実装

- [x] 3.1 AgentCore Runtime内3賢者エージェント実装 **[🤖 Kiro]** ✅ **完了**
  - 既存のmagi_agent.pyの拡張（完了済み）
  - CASPAR（保守的）、BALTHASAR（革新的）、MELCHIOR（バランス型）の実装（完了済み）
  - Strands Agentsフレームワークでの並列実行（完了済み）
  - ストリーミングレスポンス対応（API Route統合完了）
  - _完了状況: 既存AgentCore Runtime実装を活用、ストリーミングAPI統合完了_

- [x] 3.2 SOLOMON Judge統合評価実装 **[🤖 Kiro]** ✅ **完了**
  - AgentCore Runtime内での統括者実装（完了済み）
  - 3賢者判断の統合ロジック実装（完了済み）
  - 投票結果集計機能（可決/否決/棄権）（完了済み）
  - 最終判断とスコアリング機能のストリーミング対応（完了済み）
  - _完了状況: 既存SOLOMON Judge実装を活用、ストリーミング表示対応完了_

- [ ] 3.3 AgentCore Runtimeストリーミングエラーハンドリング **[🤖 Kiro]**
  - 個別エージェント失敗時のストリーミング継続
  - 段階的機能縮退（部分的結果による継続）
  - 自動リトライ機構（AgentCore Runtime内）
  - リアルタイムエラー通知
  - _理由: AgentCore Runtime内での安定したストリーミング動作保証_

### ステップ4: フロントエンド統合

- [x] 4.1 ストリーミングクライアント実装 **[🤖 Kiro]** ✅ **完了**
  - `src/lib/agents/stream-client.ts`の新規作成
  - Server-Sent Events受信ロジック
  - リアルタイムレスポンス処理
  - エラーハンドリングとフォールバック
  - _完了状況: ストリーミングクライアント実装済み、TypeScript型安全性確保_

- [x] 4.2 既存UIのストリーミング対応 **[🤖 Kiro]** ✅ **完了**
  - `MAGIStreamInterface`コンポーネント新規作成
  - `useMAGIStream` React Hook実装
  - リアルタイムエージェント応答表示
  - ストリーミング進行状況の視覚化
  - _完了状況: ストリーミング対応UI完成、テストページ作成済み_

- [ ] 4.3 レガシーAmplify Function削除 **[🤖 Kiro]**
  - `amplify/functions/bedrock-agent-gateway/`の削除
  - `amplify/backend.ts`からの関数定義削除
  - 不要な依存関係の整理
  - 設定ファイルのクリーンアップ
  - _理由: システムの簡素化とメンテナンス性向上_

### ステップ5: エンドツーエンド統合テスト

- [ ] 5.1 統合動作確認 **[🤖 Kiro]**
  - UI → API → AgentCore Runtime → MAGI Agentsの完全フロー
  - ストリーミング表示の動作確認
  - エラーケース・復旧テスト
  - 基本的なパフォーマンステスト
  - _理由: システム全体の動作保証_

- [ ] 5.2 既存Lambda実装のクリーンアップ **[🤖 Kiro]**
  - 不要なLambda関数の削除
  - 古い設定ファイルの削除
  - ドキュメントの更新
  - 依存関係の整理
  - _理由: システムの簡素化とメンテナンス性向上_

### ステップ6: 高度な機能実装（オプション）

- [ ] 6.1 MAGI投票システムUI強化 **[🤖 Kiro]** ⭐ **オプション**
  - 各賢者の投票判断（approve/reject/abstain）の視覚的表示
  - 色分け + アイコンによる判断結果表示システム
  - 投票パターン分析（全員一致、多数決、意見分裂）の実装
  - 最終判断（approved/rejected/abstain）の統合表示
  - _理由: ユーザーエクスペリエンスの向上_

- [ ] 6.2 エージェント設定システム **[🤖 Kiro]** ⭐ **オプション**
  - エージェント設定コンポーネント統合
  - デフォルトプリセット（デフォルト、学術研究、ビジネス分析）
  - プリセット管理インターフェース（作成、編集、削除、複製）
  - 動的設定切り替え機能
  - _理由: システムの柔軟性向上_

- [ ] 6.3 セッション管理・コンテキスト保持 **[🤖 Kiro]** ⭐ **オプション**
  - セッションIDによる会話継続
  - コンテキスト情報の管理
  - 長時間セッション（8時間）の活用
  - セッション分離の確認
  - _理由: AgentCore Runtimeの長時間実行能力活用_

### ステップ7: 個人開発用監視・運用

- [ ] 7.1 基本監視設定 **[🤖 Kiro + 👤 Human]**
  - AgentCore Runtime標準監視機能の活用
  - 基本メトリクス収集（実行時間、エラー率）
  - シンプルダッシュボード作成（学習用）
  - 基本アラート設定（メール通知）
  - _理由: 基本的な運用監視の確立_

- [ ] 7.2 コスト効率化 **[🤖 Kiro]**
  - AWS無料枠の最大活用
  - 不要なリソースの定期削除
  - コスト監視アラート（無料枠超過防止）
  - 基本的なリソース使用量監視
  - _理由: 個人開発でのコスト管理_

### ステップ8: 本番デプロイメント

- [ ] 8.1 Amplify Hostingデプロイ **[🤖 Kiro + 👤 Human]**
  - `npx ampx push`によるAmplify Hostingデプロイ
  - CloudFrontの自動設定確認
  - 基本的なセキュリティ設定確認
  - 環境変数の設定
  - _理由: フロントエンドの本番環境デプロイ_

- [ ] 8.2 統合動作確認 **[🤖 Kiro]**
  - 本番環境でのエンドツーエンドテスト
  - パフォーマンス測定
  - エラーケースの確認
  - 基本的な負荷テスト
  - _理由: 本番環境での動作保証_

### ステップ9: 学習・ドキュメント作成（オプション）

- [ ] 9.1 個人開発学習ガイド作成 **[🤖 Kiro]** ⭐ **オプション**
  - AgentCore Runtimeの学習ポイント
  - AWS公式ツールの実践的使用方法
  - 個人開発でのコスト管理方法
  - 基本的なトラブルシューティング
  - _理由: 学習効果の最大化と知識の定着_

- [ ] 9.2 段階的スキルアップガイド作成 **[🤖 Kiro]** ⭐ **オプション**
  - 基本実装から応用への発展手順
  - 各技術の学習リソース紹介
  - 実際の問題解決経験の記録
  - 次のプロジェクトへの応用方法
  - _理由: 継続的な学習とスキル向上_

### ステップ10: 基本テスト実装（オプション）

- [ ] 10.1 基本単体テスト **[🤖 Kiro]** ⭐ **オプション**
  - 重要フック（useConversations、useMessages）の基本テスト
  - エージェント応答処理の基本テスト
  - MAGI投票システムの基本テスト
  - 基本的なエラーハンドリングテスト
  - _理由: コード品質の向上と学習_

- [ ] 10.2 統合テスト **[🤖 Kiro]** ⭐ **オプション**
  - 3賢者並列実行の統合テスト
  - MAGI投票システムの統合テスト
  - ストリーミング表示の統合テスト
  - エラーハンドリングの統合テスト
  - _理由: システム全体の品質保証_

---

## 📊 最適化された実装順序の効果

### 🎯 **新しい実装順序の利点**

| ステップ | 目的 | 効果 | 推定時間 |
|---------|------|------|----------|
| **1-3** | AgentCore Runtime基盤 | 早期動作確認、リスク軽減 | 2-3時間 |
| **4** | フロントエンド統合 | 既存UI活用、効率化 | 1-2時間 |
| **5** | 統合テスト | 動作保証、品質確保 | 1時間 |
| **6** | 高度機能（オプション） | UX向上、柔軟性 | 2-3時間 |
| **7-8** | 監視・デプロイ | 運用準備、本番化 | 1-2時間 |
| **9-10** | 学習・テスト（オプション） | 知識定着、品質向上 | 2-3時間 |

### 🚀 **実装戦略**

#### **必須ステップ（1-5）**: 約5-7時間
- 基本的なMAGI Decision Systemの完成
- AgentCore Runtimeでの動作確認
- フロントエンド統合とストリーミング表示

#### **オプションステップ（6, 9-10）**: 約4-6時間
- UI/UX強化とユーザビリティ向上
- 学習効果最大化とスキル定着
- テスト実装とコード品質向上

### 🎯 **次のアクション**

**ステップ1.1「初回デプロイ実行」から開始してください。**

既存のAgentCore Runtime基盤を活用し、効率的なストリーミング対応実装が可能になります！

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