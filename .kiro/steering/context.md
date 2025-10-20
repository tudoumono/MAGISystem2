# Context & Domain Knowledge

## 用語集

### エージェント関連
- **A2A (Agent-to-Agent)**: エージェント間通信プロトコル
- **MCP (Model Context Protocol)**: LLMとツール間の標準プロトコル
- **Guardrails**: AI出力の安全性・品質制御機構
- **Reasoning Trace**: エージェントの推論過程の記録
- **OTEL (OpenTelemetry)**: 分散トレーシング・メトリクス標準

### AWS関連
- **AgentCore**: Amazon Bedrock のエージェント実行基盤
- **Amplify Data/AI Kit**: データ管理 + AI機能統合パッケージ
- **Bedrock Runtime**: LLMモデル実行環境
- **AppSync**: GraphQL API + リアルタイム通信

### システム固有
- **MAGI System**: 3賢者 + 1統括者による意思決定システム
- **SOLOMON Judge**: 最終評価・統合を行う統括AI
- **Trace Step**: 実行ステップの詳細記録単位

## ドメインモデル

### Agent (エージェント)
```typescript
interface Agent {
  id: string;           // caspar | balthasar | melchior | solomon
  name: string;         // 表示名
  personality: string;  // 人格特性
  systemPrompt: string; // システムプロンプト
  status: AgentStatus;  // 実行状態
}
```

### Conversation (会話)
```typescript
interface Conversation {
  id: string;
  userId: string;       // オーナー
  title: string;        // 会話タイトル
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}
```

### Message (メッセージ)
```typescript
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  agentResponses?: AgentResponse[]; // 3賢者の回答
  judgeResponse?: JudgeResponse;    // SOLOMON評価
  traceId?: string;                // 実行トレースID
  createdAt: Date;
}
```

### TraceStep (トレースステップ)
```typescript
interface TraceStep {
  id: string;
  traceId: string;      // 実行トレース識別子
  stepNumber: number;   // ステップ番号
  agentId: string;      // 実行エージェント
  action: string;       // 実行アクション要約
  toolsUsed: string[];  // 使用ツール一覧
  citations: string[];  // 引用URL
  duration: number;     // 実行時間(ms)
  errorCount: number;   // エラー・リトライ回数
  timestamp: Date;
}
```

## 権限境界

### オーナー制限
- **会話データ**: ユーザーは自分の会話のみアクセス可能
- **トレース情報**: 自分が実行したトレースのみ参照可能
- **エクスポート**: 個人データのみエクスポート可能

### 公開APIキー設定
```typescript
// 環境変数による権限制御
interface APIPermissions {
  BEDROCK_MODEL_ACCESS: string[];    // 利用可能モデル
  AGENTCORE_EXECUTION_LIMIT: number; // 実行回数制限
  TRACE_RETENTION_DAYS: number;      // トレース保持期間
  EXPORT_RATE_LIMIT: number;         // エクスポート頻度制限
}
```

## アーキテクチャパターン

### Multi-Agent Decision Flow
```
User Question
    ↓
SOLOMON Orchestrator
    ↓
┌─────────────────────────────────┐
│  Parallel Agent Execution       │
├─────────┬─────────┬─────────────┤
│ CASPAR  │BALTHASAR│  MELCHIOR   │
│(保守的) │(革新的) │(バランス型) │
└─────────┴─────────┴─────────────┘
    ↓
SOLOMON Judge (評価・統合)
    ↓
Final Response + Scores
```

### Trace Correlation Pattern
```
Next.js UI (traceId: abc123)
    ↓ OTEL Context
AgentCore Runtime (traceId: abc123)
    ↓ Span Propagation  
Strands Agents (traceId: abc123)
    ↓ Step Recording
TraceStep Records → UI Display
```

## セキュリティ考慮事項

### データ保護
- **PII Handling**: 個人情報の適切な匿名化
- **Conversation Privacy**: ユーザー間データ分離
- **Trace Sanitization**: 機密情報のトレースからの除外

### AI Safety
- **Content Filtering**: 不適切な出力の検出・ブロック
- **Bias Mitigation**: 3賢者の多様性による偏見軽減
- **Hallucination Detection**: 事実確認機構の組み込み

### 運用セキュリティ
- **Rate Limiting**: API呼び出し頻度制限
- **Authentication**: 強固な認証機構
- **Audit Logging**: 全操作の監査ログ記録