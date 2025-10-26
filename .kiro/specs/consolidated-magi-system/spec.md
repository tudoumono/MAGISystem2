# MAGI Decision System - 統合実装仕様

## 概要
エヴァンゲリオンのMAGIシステムにインスパイアされた多視点分析システムの統合実装仕様。
3つの分離されたSpecを統合し、重複を排除した効率的な実装計画。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    MAGI Decision System                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 15)                                     │
│  ├─ Chat Interface                                          │
│  ├─ Agent Response Panels                                   │
│  ├─ SOLOMON Judge Display                                   │
│  └─ Trace Visualization                                     │
├─────────────────────────────────────────────────────────────┤
│  Backend (Amplify Gen2)                                     │
│  ├─ Auth (Cognito)                                          │
│  ├─ Data (DynamoDB + GraphQL)                              │
│  ├─ Functions (Lambda)                                      │
│  └─ Real-time (AppSync Subscriptions)                      │
├─────────────────────────────────────────────────────────────┤
│  Agent Layer (Strands Agents 1.0)                          │
│  ├─ SOLOMON (Orchestrator)                                  │
│  ├─ CASPAR (Conservative)                                   │
│  ├─ BALTHASAR (Innovative)                                  │
│  └─ MELCHIOR (Balanced)                                     │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure (AWS)                                       │
│  ├─ Bedrock AgentCore                                       │
│  ├─ OpenTelemetry (ADOT)                                    │
│  ├─ CloudWatch Application Signals                          │
│  └─ VPC + Security                                          │
└─────────────────────────────────────────────────────────────┘
```

## 統合実装戦略

### Phase 1: 基盤構築（フロントエンドファースト）
**目標**: ユーザーが触れる部分を最優先で完成させる

### Phase 2: バックエンド統合
**目標**: 実際のデータ保存とリアルタイム機能

### Phase 3: エージェント統合
**目標**: 実際のAI機能とMAGI判断システム

### Phase 4: 運用準備
**目標**: 監視、最適化、デプロイメント

## 技術スタック

### フロントエンド
- **Next.js 15** + **React 19** + **TypeScript**
- **Tailwind CSS** + **Headless UI** + **Radix UI**
- **App Router** + **Server Components**

### バックエンド
- **AWS Amplify Gen2** (TypeScript設定)
- **Amazon Cognito** (認証)
- **DynamoDB** + **AppSync GraphQL** (データ)
- **Lambda Functions** (カスタムロジック)

### AI/エージェント
- **Strands Agents 1.0** (Durable Sessions, A2A Protocol)
- **Amazon Bedrock** (Foundation Models)
- **AgentCore Runtime** (2025年プレビュー版)

### 観測・監視
- **AWS Distro for OpenTelemetry (ADOT)**
- **CloudWatch Application Signals**
- **W3C Trace Context** (分散トレーシング)

## 要件マッピング

### 機能要件
1. **多視点分析**: 3賢者による並列分析
2. **MAGI判断**: 可決/否決投票システム
3. **SOLOMON統括**: 最終評価と統合判断
4. **リアルタイム**: ライブ更新とトレース表示
5. **会話管理**: 履歴保存と検索機能

### 非機能要件
1. **パフォーマンス**: 初回応答 <2秒、操作応答 <100ms
2. **可用性**: システム稼働率 >99.5%
3. **セキュリティ**: 認証、認可、データ保護
4. **スケーラビリティ**: 自動スケーリング対応
5. **観測性**: 分散トレーシングとメトリクス収集

## 統合による利点

### 重複排除
- **フロントエンド実装**: 1つのNext.jsプロジェクトに統合
- **Amplify設定**: 1つの設定ファイルで管理
- **エージェント統合**: 統一されたStrands Agents実装
- **観測機能**: 一元化された監視システム

### 開発効率向上
- **段階的実装**: フロントエンドファーストで視覚的フィードバック
- **モック→実データ移行**: スムーズな開発体験
- **統一された型定義**: TypeScriptによる型安全性
- **一貫したアーキテクチャ**: 設計判断の統一

### 学習効果最大化
- **視覚的進捗**: UIから始まる実装で成果が見える
- **段階的複雑性**: 徐々に機能を追加する自然な学習曲線
- **詳細コメント**: AI可読性を重視した実装解説
- **実践的経験**: 最新技術スタックの実装経験

## 次のステップ

1. **統合タスクファイルの作成**: 重複を排除した実装計画
2. **既存Specの無効化**: 混乱を避けるため古いSpecを無効化
3. **実装開始**: Phase 1から順次実装開始