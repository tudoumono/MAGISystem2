# 統合実装計画 - MAGI Decision System

## 🚨 **重要な設計変更: AgentCore Runtime + ストリーミング対応**

### 📚 **アーキテクチャ設計の参考元**
このプロジェクトの実装方針は以下の記事を参考にしています：
- **参考記事**: [Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- **核心的なパターン**: 
  - フロントエンドとバックエンドを別々のNext.jsアプリとして構築
  - フロントエンド: Amplify Hosting、バックエンド: AgentCore Runtimeコンテナ
  - `useChat`フックで`/invocations`エンドポイントを直接呼び出し
  - AgentCore Runtime仕様準拠（ポート8080、POST `/invocations`、GET `/ping`）

### 🔧 **技術的課題と解決策**
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

## 🔄 **実装タスク（参考記事完全準拠・バックエンドファースト）**

### ✅ Phase 0: AgentCore Runtime基盤（完了済み）

- [x] 0.1 AgentCore Runtime開発環境構築 **[🤖 Kiro]** ✅ **完了**
  - Python 3.11+ 仮想環境の作成
  - bedrock-agentcore、strands-agents、bedrock-agentcore-starter-toolkitのインストール
  - AWS認証情報の設定（ap-northeast-1リージョン）
  - 基本的な動作確認
  - _完了状況: agents/venv/, agents/requirements.txt, agents/.python-version_

- [x] 0.2 MAGI Agent実装（Python + Strands Agents） **[🤖 Kiro]** ✅ **完了**
  - `magi_agent.py`の作成（BedrockAgentCoreApp使用）
  - 3賢者（CASPAR/BALTHASAR/MELCHIOR）実装
  - SOLOMON Judge実装
  - Strands Agentsフレームワーク統合
  - _完了状況: agents/magi_agent.py, agents/shared/_

- [x] 0.3 AgentCore Runtime デプロイ **[🤖 Kiro + 👤 Human]** ✅ **完了**
  - Claude 3.5 Sonnetモデルアクセスの有効化 **[👤 Human]**
  - `agentcore launch`によるデプロイ **[🤖 Kiro]**
  - Agent ARN取得: `arn:aws:bedrock-agentcore:REGION:YOUR_ACCOUNT_ID:runtime/YOUR_AGENT_NAME`
  - _完了状況: AgentCore Runtime完全デプロイ済み_

- [x] 0.4 ストリーミング動作確認 **[🤖 Kiro]** ✅ **完了**
  - `agents/tests/test_magi.py`によるストリーミング検証
  - 3賢者 + SOLOMON Judge並列実行確認
  - Server-Sent Eventsストリーミング受信確認
  - 実行時間: 36.954秒
  - _完了状況: ストリーミング出力保存完了（agents/tests/streaming_output/）_
  - _重要: この動作確認が全ての基盤となる_

---

### ✅ Phase 1: AgentCore Runtime内Next.jsバックエンド構築（完了済み）

⚠️ **重要**: AgentCore Runtimeは**1つのDockerコンテナ**です。Next.jsとPythonは同じコンテナ内で動作します。

- [x] 1.1 Next.jsバックエンドプロジェクト作成 **[🤖 Kiro]** ✅ **完了**
  - `agents/backend/`ディレクトリ作成
  - `package.json`作成（Next.js 15 + TypeScript）
  - `next.config.js`設定（ポート8080、standalone出力）
  - `tsconfig.json`設定
  - 基本的なディレクトリ構造作成
  - _完了状況: agents/backend/package.json, agents/backend/next.config.js_

- [x] 1.2 `/invocations`エンドポイント実装 **[🤖 Kiro]** ✅ **完了**
  - `agents/backend/app/api/invocations/route.ts`作成
  - POSTリクエスト受信処理
  - Pythonスクリプト呼び出し（`spawn('python', ['/app/magi_agent.py'])`）
  - ストリーミングレスポンス転送（Server-Sent Events）
  - エラーハンドリング
  - _完了状況: agents/backend/app/api/invocations/route.ts_

- [x] 1.3 `/ping`エンドポイント実装 **[🤖 Kiro]** ✅ **完了**
  - `agents/backend/app/api/ping/route.ts`作成
  - ヘルスチェック応答
  - Pythonプロセス起動確認
  - _完了状況: agents/backend/app/api/ping/route.ts_

- [x] 1.4 Python呼び出しブリッジ実装 **[🤖 Kiro]** ✅ **完了**
  - `agents/backend/src/lib/python-bridge.ts`作成
  - 子プロセス管理（spawn、stdout/stderr処理）
  - ストリーミング出力のパース
  - プロセスライフサイクル管理
  - _完了状況: agents/backend/src/lib/python-bridge.ts_

- [x] 1.5 Dockerfile作成（Node.js + Python統合） **[🤖 Kiro]** ✅ **完了**
  - `agents/Dockerfile`作成
  - ベースイメージ: `ubuntu:22.04`
  - Node.js 18.x + Python 3.11インストール
  - Pythonエージェントコピー
  - Next.jsバックエンドビルド＆コピー
  - CMD: `npm start`（ポート8080）
  - _完了状況: agents/Dockerfile_

---

### ✅ Phase 2: ローカル動作確認（完了済み）

- [x] 2.1 ローカルNext.jsバックエンド起動確認 **[🤖 Kiro]** ✅ **完了**
  - `cd agents/backend && npm run dev`で起動確認
  - ポート8080でリッスン確認
  - _完了状況: ローカル開発環境動作確認済み_

- [x] 2.2 `/invocations`エンドポイントテスト **[🤖 Kiro]** ✅ **完了**
  - `agents/tests/test_magi2.py`によるHTTP POSTテスト
  - ストリーミングレスポンス受信確認
  - 3賢者 + SOLOMON Judge動作確認
  - 実行時間: 11.96秒、383イベント処理
  - _完了状況: agents/tests/streaming_output_phase2/、agents/PHASE2_BASELINE_COMPLETE.md_

- [x] 2.3 `/ping`エンドポイントテスト **[🤖 Kiro]** ✅ **完了**
  - ヘルスチェック応答確認
  - _完了状況: 動作確認済み_

---

### ✅ Phase 3: フロントエンド統合（完了済み）

- [x] 3.1 useMAGIStream Hook実装 **[🤖 Kiro]** ✅ **完了**
  - `src/hooks/useMAGIStream.ts`作成
  - カスタムReact Hookでストリーミング状態管理
  - `src/lib/agents/stream-client.ts`との統合
  - Server-Sent Eventsストリーミング処理
  - _完了状況: src/hooks/useMAGIStream.ts_

- [x] 3.2 ストリーミングクライアント実装 **[🤖 Kiro]** ✅ **完了**
  - `src/lib/agents/stream-client.ts`作成
  - `/invocations`エンドポイント呼び出し
  - SSEパース処理
  - エラーハンドリング
  - _完了状況: src/lib/agents/stream-client.ts（推定）_

- [x] 3.3 UIコンポーネント実装 **[🤖 Kiro]** ✅ **完了**
  - `src/components/agents/`にMAGI関連コンポーネント
  - `src/components/chat/`にチャットUIコンポーネント
  - 3賢者応答パネル表示
  - SOLOMON Judge表示
  - _完了状況: src/components/agents/, src/components/chat/_

- [x] 3.4 型定義整備 **[🤖 Kiro]** ✅ **完了**
  - `src/types/magi-request.ts`作成
  - `src/types/api.ts`作成
  - TypeScript型安全性確保
  - _完了状況: src/types/_

---

### 🔄 Phase 4: AgentCore Runtime本番デプロイ（未実装）

- [ ] 4.1 AgentCore Runtime設定更新 **[🤖 Kiro]**
  - `.bedrock_agentcore.yaml`更新（Dockerfileパス指定）
  - エントリーポイント設定（Next.jsバックエンド）
  - ポート8080設定確認
  - _理由: Next.js統合版をデプロイするための設定_

- [ ] 4.2 AgentCore Runtime再デプロイ **[🤖 Kiro + 👤 Human]**
  - `agentcore launch --auto-update-on-conflict`実行
  - 新しいAgent ARN取得（または既存ARN更新確認）
  - デプロイ成功確認
  - _理由: Next.js + Python統合版をAWSにデプロイ_

- [ ] 4.3 デプロイ済みエンドポイント動作確認 **[🤖 Kiro]**
  - AWS CLIで`/invocations`テスト
  - AWS CLIで`/ping`テスト
  - ストリーミングレスポンス確認
  - 3賢者 + SOLOMON Judge動作確認
  - _理由: 本番環境での動作保証_

---

### 🔄 Phase 5: フロントエンド本番デプロイ（オプション）

- [ ] 5.1 環境変数設定 **[👤 Human]**
  - `NEXT_PUBLIC_AGENTCORE_URL`設定（AgentCore RuntimeのURL）
  - Amplify Console環境変数設定
  - _理由: フロントエンドからAgentCore Runtimeに接続_

- [ ] 5.2 Amplify Hostingデプロイ **[👤 Human]**
  - `npx ampx push`実行
  - CloudFront自動設定確認
  - _理由: フロントエンドを本番環境にデプロイ_

- [ ] 5.3 本番環境動作確認 **[🤖 Kiro + 👤 Human]**
  - 本番URLでチャットUI動作確認
  - AgentCore Runtime接続確認
  - ストリーミング表示確認
  - パフォーマンス測定
  - _理由: 本番環境での動作保証_

---

### 🔄 Phase 6: 高度な機能実装（オプション）

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

### 🔄 Phase 7: 個人開発用監視・運用（オプション）

- [ ] 7.1 基本監視設定 **[🤖 Kiro + 👤 Human]** ⭐ **オプション**
  - AgentCore Runtime標準監視機能の活用
  - 基本メトリクス収集（実行時間、エラー率）
  - シンプルダッシュボード作成（学習用）
  - 基本アラート設定（メール通知）
  - _理由: 基本的な運用監視の確立_

- [ ] 7.2 コスト効率化 **[🤖 Kiro]** ⭐ **オプション**
  - AWS無料枠の最大活用
  - 不要なリソースの定期削除
  - コスト監視アラート（無料枠超過防止）
  - 基本的なリソース使用量監視
  - _理由: 個人開発でのコスト管理_



---

## 🔥 ステップ11: Strands Agents完全統合（完了済み）

### ✅ 実装完了: 単一ファイルアーキテクチャ

**個別エージェントファイルは不要です。全エージェントは`magi_agent.py`と`magi_strands_agents.py`に統合実装されています。**

### 11.1 エージェント実装アーキテクチャ（完了済み）

- [x] 11.1.1 統合エージェント実装 **[🤖 Kiro]** ✅ **完了**
  - `agents/magi_agent.py`: AgentCore Runtime統合版（全4エージェント含む）
  - `agents/magi_strands_agents.py`: スタンドアロン版（全4エージェント含む）
  - `agents/shared/prompts.py`: システムプロンプト一元管理
  - Strands Agents SDKを使用した正しい実装
  - Bedrock統合とストリーミング対応
  - 非同期処理（`async/await`）の実装
  - エラーハンドリングの実装
  - _完了状況: 個別ディレクトリ（caspar/、balthasar/、melchior/、solomon/）削除済み_
  - _設計理由: Strands Agentsは軽量で、個別ファイル分離は不要。プロンプト一元管理で保守性向上_

### 📁 現在のディレクトリ構造

```
agents/
├── magi_agent.py              # メイン実装（AgentCore Runtime版）
├── shared/                    # 共通コード
│   ├── prompts.py            # プロンプト管理（全エージェント）
│   ├── types.py              # 型定義
│   └── utils.py              # ユーティリティ
├── scripts/                   # 開発用スクリプト
└── tests/                     # テストコード
```

### ✅ 実装品質確認

- [x] `from strands import Agent`を使用
- [x] `Agent(model=...)`でエージェント作成
- [x] boto3直接呼び出しなし
- [x] キーワードベースのモックロジックなし
- [x] 非同期処理（`async/await`）実装済み
- [x] エラーハンドリング実装済み
- [x] 4エージェント（CASPAR、BALTHASAR、MELCHIOR、SOLOMON）全て統合実装

### 11.2 ステアリングルール（既存）

- [x] 11.2.1 tech.mdにStrands Agents必須ルール **[🤖 Kiro]** ✅ **完了**
  - AI提案時の必須チェック項目（既存）
  - 禁止パターンと正しいパターン（既存）
  - 意思決定ツリー（既存）
  - 提案コードのチェックリスト（既存）
  - 例外申請プロセス（既存）
  - _完了状況: tech.mdに既に実装済み_

### 11.3 統合テストと検証（次のステップ）

- [ ] 11.3.1 Strands Agents統合テスト **[🤖 Kiro]** 🔥 **必須**
  - 統合実装（magi_agent.py、magi_strands_agents.py）の動作確認
  - Bedrock統合の動作確認
  - 並列実行の動作確認
  - エラーハンドリングの動作確認
  - _目的: 実装品質の保証_

- [ ] 11.3.2 パフォーマンステスト **[🤖 Kiro]** ⭐ **オプション**
  - レスポンス時間の測定
  - リソース使用量の測定
  - 並列実行のパフォーマンス確認
  - ボトルネックの特定
  - _目的: システムパフォーマンスの最適化_

---

## 📊 実装進捗サマリー

### ✅ **完了済みフェーズ**

| Phase | 内容 | 状態 | 完了日 |
|-------|------|------|--------|
| **Phase 0** | AgentCore Runtime基盤 | ✅ 完了 | 2025-11-06 |
| **Phase 1** | Next.jsバックエンド構築 | ✅ 完了 | 2025-11-06 |
| **Phase 2** | ローカル動作確認 | ✅ 完了 | 2025-11-06 |
| **Phase 3** | フロントエンド統合 | ✅ 完了 | 推定完了 |

### 🔄 **未実装フェーズ**

| Phase | 内容 | 優先度 | 推定時間 |
|-------|------|--------|----------|
| **Phase 4** | AgentCore Runtime本番デプロイ | 🔥 高 | 1-2時間 |
| **Phase 5** | フロントエンド本番デプロイ | ⭐ 中 | 1時間 |
| **Phase 6** | 高度な機能実装 | ⭐ オプション | 2-3時間 |
| **Phase 7** | 監視・運用 | ⭐ オプション | 1-2時間 |

### 🎯 **次のアクション**

**推奨: Phase 4「AgentCore Runtime本番デプロイ」から開始**

現在、ローカル環境では完全動作していますが、本番環境へのデプロイが未完了です。
Phase 4を完了すれば、本番環境でMAGIシステムが利用可能になります。

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