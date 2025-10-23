# Design Document

## Overview

エヴァンゲリオンのMAGIシステムにインスパイアされた多エージェント意思決定システムのWebユーザーインターフェースを設計します。システムは3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる多視点分析を提供し、リアルタイムな推論過程の可視化と柔軟なエージェント設定機能を備えます。

## Development Approach

### フロントエンドファースト開発戦略

学習効果と開発効率を最大化するため、**フロントエンドファースト**のアプローチを採用します。

#### 段階的開発フロー

**Phase 1-2: モックデータ開発** 🎭
- エージェント応答は事前定義されたモックデータを使用
- UIロジック、デザインシステム、ユーザー体験に集中
- 様々なシナリオ（成功、エラー、ローディング、エッジケース）を網羅的にテスト
- 視覚的フィードバックによる学習効果の最大化

**Phase 3: 部分統合** 🔗
- Amplify Data（認証・会話履歴・プリセット管理）は実データ
- エージェント実行部分はまだモックデータを使用
- データ永続化とリアルタイム機能の動作確認

**Phase 4-6: 完全統合** 🤖
- 全てのコンポーネントが実データで動作
- Strands Agents + Bedrock AgentCore統合
- 本格的なMAGI意思決定システムとして完成

#### 学習メリット
- **視覚的フィードバック**: 進捗が目に見えてモチベーション維持
- **段階的複雑性**: 簡単なものから複雑なものへ自然に学習
- **早期検証**: UIコンセプトとユーザー体験を早期に確認
- **デバッグ容易性**: フロントエンドの方がエラーが分かりやすい

#### 学習資料作成戦略
- **Phase完了時更新**: 各Phase完了時に学習ドキュメントを更新
- **実装連動**: 実際のソースコードと学習資料の完全連携
- **段階的詳細化**: Phase進行に応じた学習内容の深化
- **実践重視**: 理論と実装を組み合わせた学習体験の提供

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
  executionTime: number;
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

interface TraceStep {
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

### Mock Data Strategy

#### Phase 1-2: モックデータ実装
```typescript
// src/lib/mock/magi-responses.ts
export const mockMAGIDecision = (question: string): Promise<AskResponse> => {
  return new Promise((resolve) => {
    // リアルな応答時間をシミュレート
    setTimeout(() => {
      resolve({
        conversationId: generateId(),
        messageId: generateId(),
        agentResponses: [
          {
            agentId: 'caspar',
            decision: 'REJECTED',
            content: '慎重な検討が必要です。過去の事例を分析すると、このような急進的な変更は予期しない問題を引き起こす可能性があります。',
            reasoning: 'リスク分析の結果、成功確率が低く、失敗時の影響が大きいと判断',
            confidence: 0.85,
            executionTime: 1200
          },
          {
            agentId: 'balthasar',
            decision: 'APPROVED',
            content: '革新的で素晴らしいアイデアです！新しい可能性を切り開く挑戦として、積極的に取り組むべきです。',
            reasoning: '創造性と革新性の観点から、大きな価値創造の可能性を評価',
            confidence: 0.92,
            executionTime: 980
          },
          {
            agentId: 'melchior',
            decision: 'APPROVED',
            content: 'データを総合的に分析した結果、適切な準備と段階的実装により成功可能と判断します。',
            reasoning: '科学的分析により、リスクを管理しながら実行可能と結論',
            confidence: 0.78,
            executionTime: 1450
          }
        ],
        judgeResponse: {
          finalDecision: 'APPROVED',
          votingResult: { approved: 2, rejected: 1, abstained: 0 },
          scores: [
            { agentId: 'caspar', score: 75, reasoning: '慎重で現実的な分析' },
            { agentId: 'balthasar', score: 88, reasoning: '創造的で前向きな提案' },
            { agentId: 'melchior', score: 82, reasoning: 'バランスの取れた科学的判断' }
          ],
          summary: '3賢者の判断を総合すると、適切な準備により実行可能',
          finalRecommendation: '段階的実装によるリスク管理を推奨',
          reasoning: '多数決により可決。ただし、CASPARの懸念を考慮した慎重な実行が必要',
          confidence: 0.85
        },
        traceId: generateTraceId(),
        executionTime: 1450
      });
    }, 1500); // 1.5秒の応答時間をシミュレート
  });
};

// 様々なシナリオのモックデータ
export const mockScenarios = {
  unanimous_approval: () => mockMAGIDecision('全員一致で可決されるケース'),
  unanimous_rejection: () => mockMAGIDecision('全員一致で否決されるケース'),
  split_decision: () => mockMAGIDecision('意見が分かれるケース'),
  error_scenario: () => Promise.reject(new Error('エージェント実行エラー')),
  timeout_scenario: () => new Promise(() => {}) // タイムアウトシミュレート
};
```

#### Phase 3: 部分統合パターン
```typescript
// src/lib/api/hybrid-execution.ts
export const executeMAGIDecision = async (
  question: string,
  config?: AgentConfig[]
): Promise<AskResponse> => {
  // Phase 3: 認証・データは実データ、エージェントはモック
  const user = await getCurrentUser(); // 実データ
  const conversation = await createConversation(user.id); // 実データ
  
  // エージェント実行はまだモック
  const magiResult = await mockMAGIDecision(question);
  
  // メッセージ保存は実データ
  await saveMessage(conversation.id, question, magiResult);
  
  return magiResult;
};
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
  enabled: boolean;
}

interface AgentPreset {
  id: string;
  name: string;
  description: string;
  configs: AgentConfig[];
  isDefault: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: Date;
}

// プリセット管理用の追加インターフェース
interface PresetManagement {
  createPreset: (preset: Omit<AgentPreset, 'id' | 'createdAt'>) => Promise<AgentPreset>;
  updatePreset: (id: string, updates: Partial<AgentPreset>) => Promise<AgentPreset>;
  deletePreset: (id: string) => Promise<void>;
  duplicatePreset: (id: string, newName: string) => Promise<AgentPreset>;
  exportPreset: (id: string) => Promise<string>;
  importPreset: (data: string) => Promise<AgentPreset>;
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
- **Virtual Scrolling**: 大量の会話履歴の効率的表示（要件5.4対応）
- **Skeleton Loading**: エージェント実行中の逐次到着描画（要件5.3対応）

### Real-time Updates
- **GraphQL Subscriptions**: AWS AppSyncによるリアルタイム更新（要件4.1対応）
- **Optimistic Updates**: UI応答性向上のための楽観的更新（要件5.2対応）
- **Connection Management**: WebSocket接続の効率的管理
- **Progressive Loading**: トレースステップの段階的表示（要件4.2対応）

### Caching Strategy
- **Browser Caching**: 静的アセットの適切なキャッシュ設定
- **API Response Caching**: 頻繁にアクセスされるデータのキャッシュ
- **Agent Response Caching**: 同一質問の結果キャッシュ（オプション）
- **Conversation Pagination**: 無限スクロールによる効率的データ読み込み（要件2.5対応）

### Performance Targets
- **First Contentful Paint**: <1.0秒（要件5.1対応）
- **UI Response Time**: <100ms（要件5.2対応）
- **Agent Response**: 初回応答<2秒（KPI要件対応）
- **Error Recovery**: 適切なエラーメッセージと再試行（要件5.5対応）

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

## Accessibility and Internationalization

### User-Friendly Accessibility
```typescript
// src/components/ui/AccessibleComponents.tsx
// ユーザーフレンドリーなアクセシビリティ実装

// フォーカス管理とキーボードナビゲーション
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-md font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === 'primary' 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
        }
      `}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};

// スクリーンリーダー対応のステータス表示
export const AccessibleStatus: React.FC<{
  status: 'loading' | 'success' | 'error';
  message: string;
}> = ({ status, message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`
        p-3 rounded-md flex items-center gap-2
        ${status === 'loading' ? 'bg-blue-50 text-blue-800' : ''}
        ${status === 'success' ? 'bg-green-50 text-green-800' : ''}
        ${status === 'error' ? 'bg-red-50 text-red-800' : ''}
      `}
    >
      <span className="sr-only">
        {status === 'loading' && '読み込み中: '}
        {status === 'success' && '成功: '}
        {status === 'error' && 'エラー: '}
      </span>
      {message}
    </div>
  );
};
```

### Enhanced Decision Display
```typescript
// src/styles/colors.ts
// 色覚特性に配慮した視覚的区別
export const DECISION_STYLES = {
  APPROVED: {
    color: 'green',
    icon: '✓',
    label: '可決',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    // アクセシビリティ強化
    ariaLabel: '可決されました',
    pattern: 'diagonal-lines', // 色以外の視覚的手がかり
    contrast: 'high' // 高コントラスト対応
  },
  REJECTED: {
    color: 'red', 
    icon: '✗',
    label: '否決',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    // アクセシビリティ強化
    ariaLabel: '否決されました',
    pattern: 'cross-hatch', // 色以外の視覚的手がかり
    contrast: 'high' // 高コントラスト対応
  }
};

// キーボードナビゲーション対応
export const KEYBOARD_SHORTCUTS = {
  'Ctrl+Enter': '質問を送信',
  'Escape': 'モーダルを閉じる',
  'Tab': '次の要素に移動',
  'Shift+Tab': '前の要素に移動',
  'Space': 'ボタンを実行',
  'Enter': '選択を確定'
};
```

### Screen Reader Support
```typescript
// src/hooks/useScreenReader.ts
// スクリーンリーダー対応の強化
export const useScreenReader = () => {
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // クリーンアップ
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };
  
  return { announceToScreenReader };
};

// 使用例: エージェント応答完了時の通知
// announceToScreenReader('3賢者の回答が完了しました。SOLOMON Judgeによる評価を開始します。');
```

### Japanese Language Support
```typescript
// src/lib/constants/labels.ts
// 日本語ラベルの定数管理（i18nライブラリは使用せず）
export const LABELS = {
  agents: {
    caspar: 'CASPAR（保守的）',
    balthasar: 'BALTHASAR（革新的）', 
    melchior: 'MELCHIOR（バランス型）',
    solomon: 'SOLOMON Judge'
  },
  decisions: {
    approved: '可決',
    rejected: '否決'
  },
  ui: {
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    retry: '再試行'
  }
};
```

## Observability and Tracing (Basic Implementation)

### Basic Trace Display
```typescript
// src/lib/tracing/basic-trace.ts
// シンプルなトレース表示（Phase 1-2はモックデータ）
interface BasicTraceStep {
  id: string;
  traceId: string;
  stepNumber: number;
  agentId: string;
  action: string;
  duration: number;
  timestamp: Date;
}

// 要件4.1, 4.2対応: 基本的なトレース表示
export const displayTraceSteps = (steps: BasicTraceStep[]) => {
  return steps.map(step => ({
    ...step,
    formattedDuration: `${step.duration}ms`,
    formattedTime: step.timestamp.toLocaleTimeString('ja-JP')
  }));
};
```

### AgentCore Integration (Phase 4以降)
```typescript
// src/lib/observability/agentcore-basic.ts
// Phase 4以降で実装予定の基本的なAgentCore連携
interface AgentCoreTrace {
  traceId: string;
  agentId: string;
  latency: number;
  tokenUsage: number;
  errorCount: number;
}

// 将来の拡張ポイント
export const integrateAgentCoreObservability = () => {
  // Phase 4以降で詳細実装
  console.log('AgentCore Observability integration - Phase 4');
};
```

## Agent Configuration and Preset Management

### Configuration Interface Design
```typescript
// src/components/config/AgentConfigPanel.tsx
// 要件7.1対応: 3賢者とSOLOMONの独立した設定画面
interface AgentConfigPanelProps {
  agentId: AgentType;
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
  presets: AgentPreset[];
  onPresetSelect: (preset: AgentPreset) => void;
}

// 要件7.2対応: 複数の事前プリセット提供
export const DEFAULT_PRESETS: AgentPreset[] = [
  {
    id: 'default',
    name: 'デフォルト設定',
    description: 'バランスの取れた標準設定',
    configs: [
      { agentId: 'caspar', modelId: 'claude-3-sonnet', temperature: 0.3, maxTokens: 1000, enabled: true },
      { agentId: 'balthasar', modelId: 'claude-3-sonnet', temperature: 0.8, maxTokens: 1000, enabled: true },
      { agentId: 'melchior', modelId: 'claude-3-sonnet', temperature: 0.5, maxTokens: 1000, enabled: true }
    ],
    isDefault: true,
    isPublic: true,
    createdAt: new Date()
  },
  {
    id: 'academic',
    name: '学術研究用',
    description: '厳密性と論理性を重視した設定',
    configs: [
      { agentId: 'caspar', modelId: 'claude-3-opus', temperature: 0.1, maxTokens: 2000, enabled: true },
      { agentId: 'balthasar', modelId: 'claude-3-sonnet', temperature: 0.4, maxTokens: 2000, enabled: true },
      { agentId: 'melchior', modelId: 'claude-3-opus', temperature: 0.2, maxTokens: 2000, enabled: true }
    ],
    isDefault: false,
    isPublic: true,
    createdAt: new Date()
  }
];
```

### Dynamic Configuration Management
```typescript
// src/lib/config/presetManager.ts
// 要件7.3, 7.4, 7.5対応: プリセット管理と動的設定変更
export class PresetManager {
  async createCustomPreset(preset: Omit<AgentPreset, 'id' | 'createdAt'>): Promise<AgentPreset> {
    // カスタムプリセットの作成・保存
  }
  
  async applyPreset(presetId: string, conversationId?: string): Promise<void> {
    // プリセットの適用と設定変更通知
  }
  
  async compareConfigurations(config1: AgentConfig[], config2: AgentConfig[]): Promise<ConfigDiff> {
    // 設定比較と差分可視化
  }
  
  async reExecuteWithSettings(messageId: string, newConfig: AgentConfig[]): Promise<AskResponse> {
    // 要件7.6対応: 設定変更後の再実行と結果比較
  }
}
```