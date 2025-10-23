# 観測可能性実装ドキュメント

このドキュメントは、MAGI Decision UIに実装された観測可能性機能の詳細を説明します。

## 📊 実装概要

Amazon Bedrock AgentCoreとの統合に必要な観測可能性機能を実装しました：

- **OpenTelemetry**: 分散トレーシングとメトリクス収集
- **AWS X-Ray**: AWSネイティブな分散トレーシング
- **Amazon CloudWatch**: メトリクス・ログ・アラーム管理
- **統合ダッシュボード**: 全体的な監視とデバッグ

## 🏗️ アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Instrumentation Layer                      │ │
│  │  • OpenTelemetry Auto-instrumentation                  │ │
│  │  • X-Ray Context Propagation                           │ │
│  │  • Custom Span Creation                                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Observability Stack                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │OpenTelemetry│  │   X-Ray     │  │    CloudWatch       │  │
│  │   - Traces  │  │ - Segments  │  │  - Metrics          │  │
│  │   - Metrics │  │ - Subseg.   │  │  - Logs             │  │
│  │   - Context │  │ - Service   │  │  - Alarms           │  │
│  │             │  │   Map       │  │  - Dashboards       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Amazon Bedrock AgentCore                       │
│  • Agent Execution Tracing                                 │
│  • SOLOMON Evaluation Monitoring                           │
│  • Performance Metrics Collection                          │
└─────────────────────────────────────────────────────────────┘
```

## 📁 実装ファイル構成

```
src/lib/observability/
├── index.ts                    # メインエクスポートと初期化
├── otel-config.ts             # OpenTelemetry設定
├── cloudwatch-integration.ts  # CloudWatch統合
└── xray-integration.ts        # X-Ray統合

instrumentation.ts              # Next.js instrumentation
.env.local.observability.template # 環境変数テンプレート
docs/setup/bedrock-agentcore-setup.md # セットアップガイド
```

## 🔧 主要コンポーネント

### 1. OpenTelemetry設定 (`otel-config.ts`)

**機能**:
- AWS X-Ray互換のトレースID生成
- 自動計装の設定
- メトリクス・トレースエクスポーター設定
- コンテキスト伝播管理

**主要クラス・関数**:
```typescript
// OpenTelemetry SDK初期化
initializeOTEL(): NodeSDK | null

// トレースコンテキスト管理
extractTraceContext(traceHeader: string): TraceContext | null
generateTraceHeader(sessionId?: string): string

// MAGI固有メトリクス定義
MAGI_METRICS: {
  AGENT_EXECUTION_DURATION: string;
  SOLOMON_EVALUATION_DURATION: string;
  // ...
}
```

### 2. CloudWatch統合 (`cloudwatch-integration.ts`)

**機能**:
- カスタムメトリクスの送信
- 構造化ログの出力
- エージェント実行状況の監視
- パフォーマンス指標の追跡

**主要クラス**:
```typescript
// メトリクス送信
class MAGIMetricsPublisher {
  publishAgentMetrics(agentId: string, metrics: {...}): Promise<void>
  publishSolomonMetrics(metrics: {...}): Promise<void>
  publishSystemMetrics(metrics: {...}): Promise<void>
}

// 構造化ログ
class MAGIStructuredLogger {
  logAgentExecution(entry: {...}): Promise<void>
  logSolomonEvaluation(entry: {...}): Promise<void>
  logError(error: Error, context: {...}): Promise<void>
}
```

### 3. X-Ray統合 (`xray-integration.ts`)

**機能**:
- 分散トレーシング
- セグメント・サブセグメント管理
- AgentCoreとのトレース相関
- カスタムアノテーション追加

**主要クラス**:
```typescript
// MAGI専用トレース管理
class MAGITraceManager {
  traceAgentExecution<T>(context: MAGITraceContext, agentId: string, operation: () => Promise<T>): Promise<T>
  traceSolomonEvaluation<T>(context: MAGITraceContext, agentResponses: any[], operation: () => Promise<T>): Promise<T>
  traceConversation<T>(context: MAGITraceContext, userMessage: string, operation: () => Promise<T>): Promise<T>
}

// X-Rayユーティリティ
class XRayUtils {
  static getCurrentTraceId(): string | null
  static createTraceHeader(sessionId?: string): string
  static addAnnotation(key: string, value: string | number | boolean): void
}
```

## 🚀 使用方法

### 基本的な使用例

```typescript
import { 
  traceAgentExecution, 
  publishAgentMetrics, 
  logAgentExecution 
} from '@/lib/observability';

// エージェント実行のトレーシング
const result = await traceAgentExecution(
  {
    conversationId: 'conv-123',
    messageId: 'msg-456',
    agentIds: ['caspar', 'balthasar', 'melchior'],
    executionMode: 'parallel',
    solomonEnabled: true,
  },
  'caspar',
  async () => {
    // エージェント実行ロジック
    return await executeAgent('caspar', userMessage);
  }
);

// メトリクスの送信
await publishAgentMetrics('caspar', {
  executionDuration: 1500,
  success: true,
  tokenUsage: 250,
});

// ログの記録
await logAgentExecution({
  agentId: 'caspar',
  traceId: 'trace-789',
  executionStart: startTime,
  executionEnd: endTime,
  success: true,
});
```

### SOLOMON評価のトレーシング

```typescript
import { traceSolomonEvaluation, publishSolomonMetrics } from '@/lib/observability';

const judgeResult = await traceSolomonEvaluation(
  context,
  agentResponses,
  async () => {
    return await solomonJudge.evaluate(agentResponses);
  }
);

await publishSolomonMetrics({
  evaluationDuration: 800,
  consensusAchieved: true,
  confidenceScore: 0.85,
  votingResult: { approved: 2, rejected: 1, abstained: 0 },
});
```

## 📈 監視可能な指標

### エージェント実行メトリクス

- **実行時間**: 各エージェントの応答時間
- **成功率**: エージェント実行の成功/失敗率
- **トークン使用量**: LLMトークン消費量
- **エラー率**: エラータイプ別の発生率

### SOLOMON評価メトリクス

- **評価時間**: SOLOMON Judgeの評価時間
- **合意達成率**: 3賢者間の合意率
- **信頼度スコア**: 最終判断の信頼度
- **投票結果**: 可決/否決/棄権の分布

### システム全体メトリクス

- **レスポンス時間**: エンドツーエンドの応答時間
- **スループット**: 1秒あたりの処理数
- **アクティブユーザー数**: 同時接続ユーザー数
- **エラー率**: システム全体のエラー率

## 🔍 トレース情報

### トレース階層

```
Conversation Trace
├── Agent Execution (CASPAR)
│   ├── Model Invocation
│   ├── Tool Usage
│   └── Response Generation
├── Agent Execution (BALTHASAR)
│   ├── Model Invocation
│   ├── Tool Usage
│   └── Response Generation
├── Agent Execution (MELCHIOR)
│   ├── Model Invocation
│   ├── Tool Usage
│   └── Response Generation
└── SOLOMON Evaluation
    ├── Response Analysis
    ├── Scoring
    └── Final Decision
```

### カスタムアノテーション

各トレースには以下のアノテーションが自動的に追加されます：

- `agentId`: 実行エージェントID
- `conversationId`: 会話ID
- `messageId`: メッセージID
- `sessionId`: セッションID（利用可能な場合）
- `userId`: ユーザーID（利用可能な場合）
- `executionMode`: 実行モード（parallel/sequential）

## 📊 CloudWatch ダッシュボード

### 自動作成されるメトリクス

CloudWatchの `MAGI/DecisionUI` 名前空間に以下のメトリクスが送信されます：

- `AgentExecutionDuration`
- `AgentExecutionSuccess`
- `SolomonEvaluationDuration`
- `SolomonConsensusRate`
- `SystemResponseTime`
- `SystemThroughput`

### ログ構造

CloudWatch Logsの `/aws/magi-decision-ui` ログループに構造化ログが出力されます：

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "magi-decision-ui",
  "traceId": "1-65a4d123-abcdef1234567890",
  "component": "agent-caspar",
  "message": "Agent execution completed",
  "metadata": {
    "executionDuration": 1500,
    "agentId": "caspar",
    "success": true
  }
}
```

## 🔧 設定オプション

### 環境変数

主要な設定オプション：

```bash
# 基本設定
OBSERVABILITY_ENABLED=true
SERVICE_NAME=magi-decision-ui
AWS_REGION=us-east-1

# OpenTelemetry
OTEL_ENABLED=true
OTEL_SAMPLING_RATE=0.1

# X-Ray
XRAY_ENABLED=true
XRAY_SAMPLING_RATE=0.1

# CloudWatch
CLOUDWATCH_ENABLED=true
METRICS_SAMPLING_RATE=1.0

# デバッグ
OBSERVABILITY_DEBUG=false
VERBOSE_OBSERVABILITY_LOGS=false
```

### パフォーマンス調整

本番環境での推奨設定：

```bash
# サンプリング率を下げてパフォーマンス向上
OTEL_SAMPLING_RATE=0.05
XRAY_SAMPLING_RATE=0.05

# バッチサイズを調整
METRICS_BATCH_SIZE=20
TRACE_BATCH_SIZE=100

# デバッグ機能を無効化
OBSERVABILITY_DEBUG=false
OBSERVABILITY_CONSOLE=false
```

## 🚨 アラート設定

### 推奨アラーム

CloudWatchで以下のアラームを設定することを推奨します：

1. **高エラー率アラーム**
   - メトリクス: `SystemErrorRate`
   - 閾値: > 5%
   - 期間: 5分

2. **高レスポンス時間アラーム**
   - メトリクス: `SystemResponseTime`
   - 閾値: > 5000ms
   - 期間: 5分

3. **SOLOMON評価失敗アラーム**
   - メトリクス: `SolomonEvaluationSuccess`
   - 閾値: < 95%
   - 期間: 10分

## 🔍 トラブルシューティング

### 健全性チェック

```bash
# 観測可能性コンポーネントの状態確認
curl http://localhost:3000/api/health/observability
```

### よくある問題

1. **トレースが表示されない**
   - CloudWatch Transaction Searchが有効化されているか確認
   - サンプリング率が適切に設定されているか確認
   - 10分程度待ってから再確認

2. **メトリクスが送信されない**
   - AWS認証情報を確認
   - CloudWatch権限を確認
   - ネットワーク接続を確認

3. **パフォーマンスが低下する**
   - サンプリング率を下げる
   - バッチサイズを調整
   - デバッグ機能を無効化

## 📚 学習リソース

- [OpenTelemetry公式ドキュメント](https://opentelemetry.io/docs/)
- [AWS X-Ray開発者ガイド](https://docs.aws.amazon.com/xray/latest/devguide/)
- [Amazon CloudWatch ユーザーガイド](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/)
- [Amazon Bedrock AgentCore 観測可能性](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability.html)