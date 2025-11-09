# アーキテクチャ設計判断記録

このドキュメントでは、MAGI Decision Systemの主要な技術選択とその理由を記録します。

## 採用技術スタック

### フロントエンド

**Next.js 15 + App Router**
- **理由**: Server Componentsによるパフォーマンス最適化、SSR対応
- **判断日**: 2024年初期設計時
- **代替案**: Remix、SvelteKit（学習コスト・エコシステムで劣る）

**Tailwind CSS + Radix UI**
- **理由**: ユーティリティファーストの開発速度、アクセシビリティ対応
- **判断日**: 2024年初期設計時
- **代替案**: Chakra UI、MUI（カスタマイズ性で劣る）

### バックエンド

**AWS Amplify Gen 2**
- **理由**: TypeScript型安全性、インフラコード統合、認証統合
- **判断日**: 2024年中期
- **代替案**: Amplify Gen 1（型安全性なし）、手動AWS SDK（複雑）

**Amazon Bedrock**
- **理由**: マネージドLLMサービス、複数モデル対応、AWS統合
- **判断日**: 2024年初期設計時
- **代替案**: OpenAI API（ベンダーロックイン）、自前ホスティング（運用コスト）

### エージェントフレームワーク

**Strands Agents**
- **理由**: 本番環境対応、A2Aプロトコル、Bedrock最適化
- **判断日**: 2025年7月（v1.0リリース後）
- **代替案**: LangChain（複雑）、独自実装（保守コスト）
- **参考**: [AWS公式ブログ](https://aws.amazon.com/blogs/opensource/introducing-strands-agents-1-0-production-ready-multi-agent-orchestration-made-simple/)

## 主要設計判断

### 1. AgentCore Runtime統合パターン

**採用**: 参考記事準拠のNext.js + Python統合コンテナ

**理由**:
- 1コンテナでフロントエンド・バックエンド統合
- Amplify Hostingへの直接デプロイ可能
- ストリーミング対応の実証済みパターン

**参考記事**: [Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)

**判断日**: 2025年11月

**代替案**:
- ❌ Lambda Response Streaming: 複雑、未実証
- ❌ Amplify defineFunction(): ストリーミング非対応

### 2. MAGIシステムアーキテクチャ

**採用**: 3賢者 + 1統括者（SOLOMON Judge）

**理由**:
- 多視点分析による意思決定品質向上
- エヴァンゲリオンMAGIシステムへのオマージュ
- 並列実行によるレイテンシ最適化

**判断日**: 2024年初期設計時

**実装詳細**:
- CASPAR: 保守的・現実的視点
- BALTHASAR: 革新的・感情的視点
- MELCHIOR: バランス型・科学的視点
- SOLOMON: 統合評価・スコアリング

### 3. ストリーミング実装

**採用**: SSE (Server-Sent Events) + 非同期処理

**理由**:
- リアルタイム進捗表示
- ユーザー体験向上（初回応答2秒未満）
- エージェント別チャンク分類

**判断日**: 2025年10月（Phase 2実装時）

**検証**: `agents/tests/test_magi.py`で実証済み

### 4. 認証・認可

**採用**: Amplify Gen 2 Auth (Cognito)

**理由**:
- SSR対応の`runWithAmplifyServerContext()`
- 型安全な認証フロー
- データ分離（オーナーベースアクセス）

**判断日**: 2024年中期

## 却下された代替案

### Lambda Response Streaming

**却下理由**:
- 実装複雑度が高い
- ストリーミング動作の実証が不十分
- AgentCore Runtime統合パターンの方が実績あり

**却下日**: 2025年11月

### 独自エージェントフレームワーク

**却下理由**:
- Strands Agents v1.0が本番対応完了
- 保守コスト・学習コストが高い
- A2Aプロトコル標準対応が困難

**却下日**: 2025年7月

### LangChain

**却下理由**:
- 過度に複雑な抽象化
- Bedrock統合がStrands Agentsより劣る
- エンタープライズ採用実績がStrands Agentsに劣る

**却下日**: 2025年7月

## 今後の検討事項

### 1. フロントエンド状態管理

**現状**: React Server Components + useOptimistic
**検討**: Zustand、Jotai導入の必要性

### 2. 可観測性強化

**現状**: OpenTelemetry基本実装
**検討**: AWS X-Ray統合、カスタムメトリクス追加

### 3. コスト最適化

**現状**: Bedrock On-Demand料金
**検討**: Provisioned Throughput導入タイミング

## 参考資料

- [Strands Agents公式ドキュメント](https://strandsagents.com/latest/)
- [Amplify Gen 2ドキュメント](https://docs.amplify.aws/react/)
- [Amazon Bedrockドキュメント](https://docs.aws.amazon.com/bedrock/)
- [参考記事: AgentCore Runtime統合](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
