# Design Document

## Overview

エヴァンゲリオンのMAGIシステムにインスパイアされた多エージェント意思決定システムのWebユーザーインターフェースを設計します。システムは3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる多視点分析を提供し、リアルタイムな推論過程の可視化と柔軟なエージェント設定機能を備えます。

## Architecture

### システム全体アーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Auth UI     │  │ Chat UI     │  │ Reasoning Trace UI  │  │
│  │ (Cognito)   │  │ (3賢者+Judge)│  │ (OTEL Visualization)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                 Amplify Data/AI Kit                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ User/Conv   │  │ Message     │  │ TraceStep           │  │
│  │ Models      │  │ Models      │  │ Models              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                 Custom Handlers                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Agent Gateway (Bedrock Integration)           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Amazon Bedrock AgentCore                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Runtime     │  │ Observability│  │ Memory              │  │
│  │ Service     │  │ (OTEL)      │  │ Service             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Strands Agents                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              SOLOMON Judge (Orchestrator)              │ │
│  │  • Analyzes Question                                   │ │
│  │  • Delegates to 3 Sages as Tools                      │ │
│  │  • Evaluates & Integrates Responses                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼ Tool Calls                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ CASPAR  │  │BALTHASAR│  │MELCHIOR │                     │
│  │(保守的) │  │(革新的) │  │(バランス)│                     │
│  │ Tool    │  │ Tool    │  │ Tool    │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### データフロー
```
User Question → Agent Gateway → Bedrock AgentCore → Strands Agents
     ↓                                                      ↓
UI Updates ← TraceStep Records ← OTEL Traces ← SOLOMON Orchestrator
     ↓                                                      ↓
Final Response ← SOLOMON Judge ← 3賢者 Tool Execution (Internal)
```

## Components and Interfaces

### Frontend Components

#### 1. Authentication Components
```typescript
// src/components/auth/SignInForm.tsx
interface SignInFormProps {
  onSignIn: (credentials: SignInCredentials) => Promise<void>;
  loading?: boolean;
}

// src/components/auth/AuthProvider.tsx  
interface AuthContextType {
  user: AuthUser | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}
```

#### 2. Chat Interface Components
```typescript
// src/components/chat/ChatInterface.tsx
interface ChatInterfaceProps {
  conversationId?: string;
  onNewMessage: (message: string) => Promise<void>;
}

// src/components/agents/AgentResponsePanel.tsx
interface AgentResponsePanelProps {
  agent: AgentType;
  response: AgentResponse;
  loading?: boolean;
}

// src/components/agents/MAGIVotingPanel.tsx
interface MAGIVotingPanelProps {
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse;
  loading?: boolean;
}

// src/components/agents/AgentConfigPanel.tsx
interface AgentConfigPanelProps {
  agents: AgentConfig[];
  presets: AgentPreset[];
  onConfigChange: (config: AgentConfig[]) => void;
  onPresetSelect: (preset: AgentPreset) => void;
}
```

#### 3. Reasoning Trace Components
```typescript
// src/components/trace/ReasoningTracePanel.tsx
interface ReasoningTracePanelProps {
  traceId: string;
  steps: TraceStep[];
  realTimeUpdates?: boolean;
  orchestratorMode?: 'solomon_orchestrated' | 'parallel'; // 新規追加
}

// src/components/trace/TraceStepItem.tsx
interface TraceStepItemProps {
  step: TraceStep;
  expanded?: boolean;
  onToggle: () => void;
}
```

#### 4. Conversation Management
```typescript
// src/components/sidebar/ConversationSidebar.tsx
interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
}
```

### API Interfaces

#### 1. Agent Gateway APIs
```typescript
// src/types/api.ts
interface AskRequest {
  message: string;
  conversationId?: string;
  agentConfig?: AgentConfig[];
}

interface AskResponse {
  conversationId: string;
  messageId: string;
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse;
  traceId: string;
}

interface AgentResponse {
  agentId: AgentType;
  decision: 'APPROVED' | 'REJECTED';  // 可決/否決の判断（MAGI機能）
  content: string;                    // 詳細な回答内容（従来機能）
  reasoning: string;                  // 判断に至った論理的根拠
  confidence: number;                 // 判断の確信度 (0.0-1.0)
  executionTime: number;
}

interface JudgeResponse {
  // MAGI投票システム
  finalDecision: 'APPROVED' | 'REJECTED';  // SOLOMONの最終判断
  votingResult: {
    approved: number;    // 可決票数
    rejected: number;    // 否決票数
    abstained: number;   // 棄権票数（エラー等）
  };
  
  // 従来のスコアリングシステム
  scores: AgentScore[];                    // 各賢者への0-100点評価
  summary: string;                         // 判断の要約
  finalRecommendation: string;             // 最終推奨（従来機能）
  reasoning: string;                       // 最終判断の根拠
  confidence: number;                      // 最終判断の確信度
}

interface AgentScore {
  agentId: AgentType;
  score: number;        // 0-100点のスコア
  reasoning: string;    // スコアの根拠
}
```

#### 2. Configuration Management
```typescript
// src/types/config.ts
interface AgentConfig {
  agentId: AgentType;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface AgentPreset {
  id: string;
  name: string;
  description: string;
  configs: AgentConfig[];
  isDefault: boolean;
}
```

## Data Models

### Amplify Data Schema
```typescript
// amplify/data/schema.ts
export const schema = a.schema({
  User: a.model({
    id: a.id().required(),
    email: a.string().required(),
    name: a.string(),
    preferences: a.json(),
    conversations: a.hasMany('Conversation', 'userId')
  }).authorization(allow => [allow.owner()]),

  Conversation: a.model({
    id: a.id().required(),
    userId: a.id().required(),
    title: a.string().required(),
    agentPresetId: a.string(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    user: a.belongsTo('User', 'userId'),
    messages: a.hasMany('Message', 'conversationId')
  }).authorization(allow => [allow.owner()]),

  Message: a.model({
    id: a.id().required(),
    conversationId: a.id().required(),
    role: a.enum(['user', 'assistant']),
    content: a.string().required(),
    agentResponses: a.json(),
    judgeResponse: a.json(),
    traceId: a.string(),
    createdAt: a.datetime().required(),
    conversation: a.belongsTo('Conversation', 'conversationId'),
    traceSteps: a.hasMany('TraceStep', 'messageId')
  }).authorization(allow => [allow.owner()]),

  TraceStep: a.model({
    id: a.id().required(),
    messageId: a.id().required(),
    traceId: a.string().required(),
    stepNumber: a.integer().required(),
    agentId: a.string().required(),
    action: a.string().required(),
    toolsUsed: a.string().array(),
    citations: a.string().array(),
    duration: a.integer().required(),
    errorCount: a.integer().default(0),
    timestamp: a.datetime().required(),
    message: a.belongsTo('Message', 'messageId')
  }).authorization(allow => [allow.owner()]),

  AgentPreset: a.model({
    id: a.id().required(),
    name: a.string().required(),
    description: a.string(),
    configs: a.json().required(),
    isDefault: a.boolean().default(false),
    isPublic: a.boolean().default(false),
    createdBy: a.string(),
    createdAt: a.datetime().required()
  }).authorization(allow => [
    allow.owner(),
    allow.authenticated().to(['read'])
  ])
});
```

### TypeScript Type Definitions
```typescript
// src/types/domain.ts
export type AgentType = 'caspar' | 'balthasar' | 'melchior' | 'solomon';
export type DecisionType = 'APPROVED' | 'REJECTED';

// MAGIシステムの賢者説明
export const AGENT_DESCRIPTIONS = {
  solomon: 'SOLOMON Judge - 統括者として3賢者の投票を集計し、最終的な可決/否決を決定',
  caspar: 'CASPAR - 保守的・現実的な視点で可決/否決を判断（リスク重視）',
  balthasar: 'BALTHASAR - 革新的・感情的な視点で可決/否決を判断（創造性重視）',
  melchior: 'MELCHIOR - バランス型・科学的な視点で可決/否決を判断（論理性重視）'
};

// 判断結果の表示用設定
export const DECISION_STYLES = {
  APPROVED: {
    color: 'green',
    icon: '✓',
    label: '可決',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800'
  },
  REJECTED: {
    color: 'red', 
    icon: '✗',
    label: '否決',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800'
  }
};

export interface AgentScore {
  agentId: AgentType;
  score: number;
  reasoning: string;
}

export interface TraceStep {
  id: string;
  traceId: string;
  stepNumber: number;
  agentId: string;
  action: string;
  toolsUsed: string[];
  citations: string[];
  duration: number;
  errorCount: number;
  timestamp: Date;
}
```

## Error Handling

### Frontend Error Boundaries
```typescript
// src/components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  // エラーキャッチとフォールバックUI表示
}
```

### API Error Handling
```typescript
// src/lib/api/errorHandler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
  }
}

export const handleAPIError = (error: unknown): APIError => {
  // エラー分類と適切なメッセージ生成
};
```

### Agent Execution Error Recovery
```typescript
// Agent実行エラーの自動リトライとフォールバック
interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  fallbackAgent?: AgentType;
}
```

## Testing Strategy

### Unit Testing
```typescript
// Jest + React Testing Library
describe('AgentResponsePanel', () => {
  it('should display agent response correctly', () => {
    // コンポーネントの単体テスト
  });
});

// API関数のテスト
describe('askAgent', () => {
  it('should handle successful response', async () => {
    // API関数のテスト
  });
});
```

### Integration Testing
```typescript
// Playwright E2E Testing
test('complete conversation flow', async ({ page }) => {
  // ログイン → 質問投稿 → 3賢者回答 → SOLOMON評価の一連フロー
});
```

### Agent Testing
```python
# agents/tests/test_agents.py
def test_caspar_conservative_response():
    """CASPAR エージェントの保守的回答をテスト"""
    pass

def test_solomon_judge_scoring():
    """SOLOMON Judge のスコアリング精度をテスト"""
    pass
```

## Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Next.js App Routerによる自動コード分割
- **Image Optimization**: Next.js Image componentによる最適化
- **Bundle Analysis**: `@next/bundle-analyzer`による継続監視
- **Virtual Scrolling**: 大量の会話履歴の効率的表示

### Real-time Updates
- **GraphQL Subscriptions**: AWS AppSyncによるリアルタイム更新
- **Optimistic Updates**: UI応答性向上のための楽観的更新
- **Connection Management**: WebSocket接続の効率的管理

### Caching Strategy
- **Browser Caching**: 静的アセットの適切なキャッシュ設定
- **API Response Caching**: 頻繁にアクセスされるデータのキャッシュ
- **Agent Response Caching**: 同一質問の結果キャッシュ（オプション）

## Security Considerations

### Authentication & Authorization
- **JWT Token Validation**: サーバーサイドでのトークン検証
- **CSRF Protection**: Next.js標準のCSRF保護
- **XSS Prevention**: Content Security Policy設定

### Data Protection
- **Conversation Privacy**: ユーザー間データ完全分離
- **Trace Sanitization**: 機密情報のトレースからの除外
- **Input Validation**: 全入力データの検証とサニタイゼーション

### Agent Security
- **Prompt Injection Protection**: システムプロンプトの保護
- **Output Filtering**: 不適切な出力の検出とブロック
- **Rate Limiting**: API呼び出し頻度制限