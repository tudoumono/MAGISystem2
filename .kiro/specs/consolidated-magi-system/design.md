# 統合設計書 - MAGI Decision System (AgentCore Runtime版)

## 概要

MAGI Decision Systemは、AWS公式の`bedrock-agentcore-starter-toolkit`を使用してAmazon Bedrock AgentCore Runtime上に実装される、エヴァンゲリオンのMAGIシステムにインスパイアされた多視点分析システムです。3賢者（CASPAR、BALTHASAR、MELCHIOR）による並列分析とSOLOMON統括システムによる最終判断を組み合わせ、包括的な意思決定支援を提供します。

### 設計原則（個人開発最適化）

- **多視点分析**: 3つの異なる視点による並列分析で偏見を軽減
- **学習効果重視**: AgentCore Runtimeによる最新技術の実践学習
- **シンプル構成**: 理解しやすく保守しやすい基本構成
- **AWS公式サポート**: bedrock-agentcore-starter-toolkitによる確実なデプロイ
- **コスト効率**: 個人開発に適したリソース使用量
- **基本監視**: 学習に必要な基本的な監視機能

## アーキテクチャ

### 設計の参考元
このプロジェクトのアーキテクチャは以下の記事を参考にしています：
- **参考記事**: [Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- **採用パターン**: フロントエンド/バックエンド分離、Next.js `useChat` + AgentCore Runtime直接呼び出し
- **設計思想**: Amplify Hostingのストリーミング制限を回避し、開発体験を損なわずに本番環境対応を実現
- **主な利点**: 
  - ストリーミングレスポンス対応によるリアルタイムUX
  - AgentCore Runtime標準仕様（ポート8080、`/invocations`エンドポイント）準拠
  - 既存Amplify資産（認証、データ、UI）の継続活用

### システム全体構成（ストリーミングパターン）

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │────│  API Gateway    │────│ AgentCore       │
│  (Frontend)     │    │   (REST API)    │    │ Runtime         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ Request + Stream      │ InvokeAgentRuntime    │ MAGI処理
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ ストリーミング   │    │   IAM Roles     │    │ 専用マイクロVM   │
│ 表示更新        │    │ (Authentication)│    │ (8時間実行)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       │                       │
         │ チャンク配信           │                       ▼
         │                       ▼                ┌─────────────────┐
┌─────────────────┐    ┌─────────────────┐     │ Strands Agents  │
│   DynamoDB      │    │ AgentCore       │     │ 並列実行        │
│ (会話履歴)      │    │ Observability   │     │ CASPAR/BALTHASAR│
└─────────────────┘    └─────────────────┘     │ MELCHIOR/SOLOMON│
         ▲                                      └─────────────────┘
         │ 最終結果保存                                  │
         └──────────────────────────────────────────────┘
        CW[CloudWatch]
        XRay[X-Ray Tracing]
    end
    
    UI --> Auth
    UI --> GQL
    UI --> RT
    GQL --> Gateway
    Gateway --> Orchestrator
    Orchestrator --> CASPAR
    Orchestrator --> BALTHASAR
    Orchestrator --> MELCHIOR
    Orchestrator --> SOLOMON
    Gateway --> DDB
    Gateway --> S3
    Gateway --> OTEL
    OTEL --> CW
    OTEL --> XRay
```

### 技術スタック選択理由

#### フロントエンド: Next.js 15 + TypeScript
- **App Router**: 最新のReactパターンとSSR最適化
- **Server Components**: 初期ロード性能向上
- **TypeScript**: 型安全性とIDE支援
- **Tailwind CSS**: 高速プロトタイピングと一貫性

#### バックエンド: AWS Amplify Gen 2
- **TypeScript設定**: フロントエンドとの型共有
- **自動生成**: GraphQLスキーマからの型生成
- **統合認証**: Cognito User Poolsとの seamless統合
- **リアルタイム**: AppSync Subscriptionsの標準サポート

#### エージェント: Strands Agents 1.0 + Amazon Bedrock
- **Durable Sessions**: 長時間実行とコンテキスト保持
- **Native Async**: 並列実行の最適化
- **A2A Protocol**: エージェント間通信の標準化
- **Multi-Agent Collaboration**: 2025年GA機能の活用

## コンポーネントとインターフェース

### 1. フロントエンドコンポーネント

#### MAGIデザインシステム
```typescript
/**
 * エヴァンゲリオン風デザインシステム
 * 
 * 設計理由: 
 * - 視覚的一貫性とブランド認知
 * - 3賢者の個性を色とアイコンで表現
 * - アクセシビリティ対応（色+アイコン併用）
 */
interface MAGITheme {
  colors: {
    caspar: '#FF6B35';    // オレンジ - 保守的
    balthasar: '#4ECDC4'; // ティール - 革新的
    melchior: '#45B7D1';  // ブルー - バランス型
    solomon: '#9B59B6';   // パープル - 統括
    success: '#27AE60';
    warning: '#F39C12';
    error: '#E74C3C';
  };
  
  icons: {
    caspar: 'Shield';     // 保守的
    balthasar: 'Lightbulb'; // 革新的
    melchior: 'Scale';    // バランス型
    solomon: 'Crown';     // 統括
  };
}
```

#### チャットインターフェース
```typescript
/**
 * 統合チャットインターフェース
 * 
 * 設計理由:
 * - 会話履歴の永続化とリアルタイム同期
 * - エージェント応答の並列表示
 * - トレース情報の統合表示
 */
interface ChatInterface {
  sidebar: ConversationSidebar;
  messageArea: MessageDisplay;
  agentPanel: AgentResponsePanel;
  traceViewer: TraceViewer;
}

interface AgentResponsePanel {
  casparResponse: AgentCard;
  balthasarResponse: AgentCard;
  melchiorResponse: AgentCard;
  solomonJudgment: JudgeCard;
  votingResult: MAGIVotingDisplay; // 新機能
}
```

#### MAGI投票システム（新機能）
```typescript
/**
 * MAGI投票システム - 新機能
 * 
 * 設計理由:
 * - 明確な可決/否決判断の可視化
 * - 各賢者の判断根拠の透明性
 * - 統合判断プロセスの理解促進
 */
interface MAGIVotingDisplay {
  votes: {
    caspar: VoteCard;
    balthasar: VoteCard;
    melchior: VoteCard;
  };
  finalDecision: FinalDecisionCard;
  confidence: ConfidenceIndicator;
}

interface VoteCard {
  vote: 'approve' | 'reject' | 'abstain';
  confidence: number; // 0-100
  reasoning: string;
  visualIndicator: {
    color: string;
    icon: string;
    animation?: string;
  };
}
```

### 2. バックエンドコンポーネント

#### データモデル設計
```typescript
/**
 * 統合データモデル
 * 
 * 設計理由:
 * - オーナーベースアクセス制御
 * - GraphQLサブスクリプション対応
 * - 型安全性とコンパイル時チェック
 */

// Amplify Data Schema
const schema = a.schema({
  User: a.model({
    id: a.id().required(),
    email: a.email().required(),
    name: a.string().required(),
    preferences: a.json(), // UserPreferences型
    conversations: a.hasMany('Conversation', 'userId'),
    agentPresets: a.hasMany('AgentPreset', 'userId'),
  }).authorization(allow => [
    allow.owner()
  ]),

  Conversation: a.model({
    id: a.id().required(),
    userId: a.id().required(),
    title: a.string().required(),
    messages: a.hasMany('Message', 'conversationId'),
    user: a.belongsTo('User', 'userId'),
  }).authorization(allow => [
    allow.owner().to(['read', 'create', 'update', 'delete'])
  ]),

  Message: a.model({
    id: a.id().required(),
    conversationId: a.id().required(),
    role: a.enum(['user', 'assistant']),
    content: a.string().required(),
    agentResponses: a.json(), // AgentResponse[]
    judgeResponse: a.json(),  // JudgeResponse
    magiVoting: a.json(),     // MAGIVotingResult - 新機能
    traceId: a.string(),
    conversation: a.belongsTo('Conversation', 'conversationId'),
  }).authorization(allow => [
    allow.owner().to(['read', 'create'])
  ]),

  TraceStep: a.model({
    id: a.id().required(),
    traceId: a.string().required(),
    stepNumber: a.integer().required(),
    agentId: a.string().required(),
    action: a.string().required(),
    toolsUsed: a.string().array(),
    citations: a.string().array(),
    duration: a.integer().required(),
    errorCount: a.integer().default(0),
  }).authorization(allow => [
    allow.owner().to(['read', 'create'])
  ]),
});
```

#### エージェントゲートウェイ
```typescript
/**
 * 統合エージェントゲートウェイ
 * 
 * 設計理由:
 * - Strands AgentsとBedrock AgentCoreの統合
 * - トレースID伝播とコンテキスト管理
 * - エラーハンドリングと段階的機能縮退
 */
export const agentGateway = defineFunction({
  name: 'bedrock-agent-gateway',
  entry: './bedrock-agent-gateway/handler.ts',
  environment: {
    BEDROCK_REGION: 'us-east-1',
    AGENTCORE_RUNTIME_ENDPOINT: process.env.AGENTCORE_ENDPOINT,
    STRANDS_AGENTS_ENDPOINT: process.env.STRANDS_ENDPOINT,
  },
  timeout: '15 minutes', // 長時間実行対応
});

interface AgentGatewayRequest {
  traceId: string;
  userId: string;
  conversationId: string;
  message: string;
  agentPreset?: AgentPreset;
}

interface AgentGatewayResponse {
  traceId: string;
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse;
  magiVoting: MAGIVotingResult; // 新機能
  executionMetrics: ExecutionMetrics;
}
```

### 3. エージェントシステム

#### SOLOMON統括システム
```python
"""
SOLOMON統括システム

設計理由:
- Agents-as-Toolsパターンによる3賢者制御
- 並列実行とA2A通信の最適化
- 従来機能（スコアリング）と新機能（投票）の統合
"""

class SOLOMONOrchestrator:
    def __init__(self):
        self.caspar_agent = CasparAgent()
        self.balthasar_agent = BalthasarAgent()
        self.melchior_agent = MelchiorAgent()
        self.judge = SOLOMONJudge()
    
    async def execute_magi_analysis(
        self, 
        query: str, 
        trace_id: str
    ) -> MAGIAnalysisResult:
        """
        MAGI分析の実行
        
        1. 3賢者の並列実行
        2. 投票結果の収集
        3. SOLOMON統合判断
        """
        # 並列実行（逐次実行禁止）
        tasks = [
            self.caspar_agent.analyze(query, trace_id),
            self.balthasar_agent.analyze(query, trace_id),
            self.melchior_agent.analyze(query, trace_id)
        ]
        
        agent_responses = await asyncio.gather(*tasks)
        
        # MAGI投票システム（新機能）
        voting_result = await self._collect_magi_votes(
            agent_responses, trace_id
        )
        
        # SOLOMON統合判断
        judge_response = await self.judge.evaluate(
            agent_responses, voting_result, trace_id
        )
        
        return MAGIAnalysisResult(
            agent_responses=agent_responses,
            voting_result=voting_result,
            judge_response=judge_response,
            trace_id=trace_id
        )
```

#### 3賢者エージェント設計
```python
"""
3賢者エージェント設計

設計理由:
- 各エージェントの個性と専門性の明確化
- 一貫したインターフェースと異なる実装
- Bedrock Multi-Agent Collaborationとの統合
"""

class BaseMAGIAgent:
    def __init__(self, personality: AgentPersonality):
        self.personality = personality
        self.bedrock_client = BedrockAgentClient()
        self.tracer = get_tracer(__name__)
    
    async def analyze(self, query: str, trace_id: str) -> AgentResponse:
        with self.tracer.start_as_current_span(
            f"{self.personality.name}_analysis",
            attributes={"trace_id": trace_id}
        ):
            # エージェント固有の分析ロジック
            analysis = await self._perform_analysis(query)
            
            # 投票判断（新機能）
            vote_decision = await self._make_vote_decision(analysis)
            
            return AgentResponse(
                agent_id=self.personality.id,
                analysis=analysis,
                vote_decision=vote_decision,
                confidence=self._calculate_confidence(analysis),
                trace_id=trace_id
            )

class CasparAgent(BaseMAGIAgent):
    """保守的・現実的視点エージェント"""
    def __init__(self):
        super().__init__(AgentPersonality(
            id="caspar",
            name="CASPAR",
            focus="実行可能性と現実性",
            bias="保守的判断"
        ))

class BalthasarAgent(BaseMAGIAgent):
    """革新的・感情的視点エージェント"""
    def __init__(self):
        super().__init__(AgentPersonality(
            id="balthasar", 
            name="BALTHASAR",
            focus="倫理と創造性",
            bias="革新的判断"
        ))

class MelchiorAgent(BaseMAGIAgent):
    """バランス型・科学的視点エージェント"""
    def __init__(self):
        super().__init__(AgentPersonality(
            id="melchior",
            name="MELCHIOR", 
            focus="データと論理",
            bias="バランス型判断"
        ))
```

### 3.7 Strands Agents実装パターン（必須）

#### ⚠️ CRITICAL: 実装時の必須ルール

**このプロジェクトでは、全エージェントでStrands Agentsフレームワークを必ず使用すること。**

#### ✅ 正しい実装パターン（統合アーキテクチャ）

**重要**: 個別エージェントファイルは不要です。全エージェントは単一ファイルに統合実装されています。

```python
# agents/magi_agent.py - 統合実装（推奨パターン）
"""
MAGI Agent - AgentCore Runtime統合実装

全4エージェント（CASPAR、BALTHASAR、MELCHIOR、SOLOMON）を
単一クラス内で管理する統合アーキテクチャ。

設計理由:
- Strands Agentsは軽量で、個別ファイル分離は不要
- プロンプトは shared/prompts.py で一元管理
- 保守性とコードの重複回避
"""

from strands import Agent
from shared.prompts import get_agent_prompt
from shared.types import AgentType

class MAGIAgentCore:
    """全エージェントを統合管理するコアクラス"""
    
    def __init__(self):
        self.agents = {}
        self._initialize_agents()
    
    def _initialize_agents(self):
        """全エージェントを初期化"""
        agent_configs = {
            AgentType.CASPAR: {"model": "anthropic.claude-3-5-sonnet-20240620-v1:0"},
            AgentType.BALTHASAR: {"model": "anthropic.claude-3-5-sonnet-20240620-v1:0"},
            AgentType.MELCHIOR: {"model": "anthropic.claude-3-5-sonnet-20240620-v1:0"},
            AgentType.SOLOMON: {"model": "anthropic.claude-3-5-sonnet-20240620-v1:0"}
        }
        
        for agent_type, config in agent_configs.items():
            # Strands Agentを動的に作成
            agent = Agent(model=config["model"])
            self.agents[agent_type] = agent
    
    async def _consult_single_sage(self, sage_type: AgentType, question: str) -> dict:
        """個別エージェントに相談"""
        agent = self.agents[sage_type]
        
        # システムプロンプトを取得（shared/prompts.pyから）
        system_prompt = get_agent_prompt(sage_type.value)
        full_prompt = f"{system_prompt}\n\n## 質問\n{question}"
        
        # Strands Agentで実行
        result = agent(full_prompt)
        
        return self._parse_response(str(result), sage_type)
```

**ディレクトリ構造**:
```
agents/
├── magi_agent.py              # 統合実装（全エージェント）
├── magi_strands_agents.py     # スタンドアロン版
├── shared/
│   ├── prompts.py            # プロンプト一元管理
│   ├── types.py              # 型定義
│   └── utils.py              # ユーティリティ
└── scripts/                   # テストスクリプト
```

#### ❌ 禁止パターン（絶対に実装しないこと）

```python
# ❌ パターン1: 独自エージェントフレームワーク（禁止）
class CasparAgent:
    def _evaluate_risk_factors(self, question: str) -> Dict[str, float]:
        """キーワードベースの独自ロジック - 禁止"""
        risk_keywords = ["new", "experimental", "untested"]
        risk_score = sum(1 for keyword in risk_keywords if keyword in question.lower())
        return {"technical": risk_score / len(risk_keywords)}

# ❌ パターン2: boto3直接呼び出し（禁止）
import boto3

class CasparAgent:
    def __init__(self):
        self.bedrock_client = boto3.client('bedrock-runtime')
    
    def analyze(self, question: str):
        response = self.bedrock_client.invoke_model(
            modelId="anthropic.claude-3-sonnet",
            body=json.dumps({"prompt": question})
        )
        # 禁止: Strands Agentsを使用すること

# ❌ パターン3: LangChainへの置き換え（禁止）
from langchain.agents import Agent as LangChainAgent

class CasparAgent:
    def __init__(self):
        self.agent = LangChainAgent(...)  # 禁止

# ❌ パターン4: モックロジック（禁止）
class CasparAgent:
    def analyze(self, question: str):
        # キーワードカウントによる判断 - 禁止
        if "risk" in question.lower():
            return {"decision": "REJECTED"}
        return {"decision": "APPROVED"}
```

#### 🔍 実装チェックリスト

実装時に以下を必ず確認すること：

- [ ] `from strands import Agent`をインポートしているか
- [ ] `Agent(model=..., system_prompt=..., tools=...)`でエージェントを作成しているか
- [ ] boto3やLangChainを直接使用していないか
- [ ] キーワードベースのモックロジックを実装していないか
- [ ] 非同期処理（`async/await`）を適切に使用しているか
- [ ] エラーハンドリングが適切に実装されているか

#### 📚 参考資料

- **公式ドキュメント**: https://strandsagents.com/latest/
- **AWS公式ブログ**: https://aws.amazon.com/blogs/opensource/introducing-strands-agents-1-0-production-ready-multi-agent-orchestration-made-simple/
- **実装例**: 
  - `agents/magi_agent.py` - AgentCore Runtime統合版（推奨）
  - `agents/magi_strands_agents.py` - スタンドアロン版
  - `agents/shared/prompts.py` - プロンプト一元管理

## データモデル

### 統合データ設計

#### 新機能: MAGI投票システム
```typescript
/**
 * MAGI投票システムデータモデル
 * 
 * 設計理由:
 * - 明確な可決/否決判断の記録
 * - 判断根拠の透明性確保
 * - 統計分析とパターン認識の基盤
 */
interface MAGIVotingResult {
  caspar: VoteDecision;
  balthasar: VoteDecision;
  melchior: VoteDecision;
  finalDecision: 'approved' | 'rejected' | 'abstain';
  confidence: number; // 0-100
  reasoning: string;
  votingPattern: VotingPattern;
  timestamp: Date;
}

interface VoteDecision {
  vote: 'approve' | 'reject' | 'abstain';
  confidence: number; // 0-100
  reasoning: string;
  factors: DecisionFactor[];
}

interface VotingPattern {
  unanimity: boolean;        // 全員一致
  majority: 'approve' | 'reject' | null;
  dissent: AgentId[];       // 反対票
  abstentions: AgentId[];   // 棄権票
}
```

#### トレースデータ拡張
```typescript
/**
 * 拡張トレースデータモデル
 * 
 * 設計理由:
 * - エージェント実行の詳細可視化
 * - パフォーマンス分析とボトルネック特定
 * - デバッグとトラブルシューティング支援
 */
interface EnhancedTraceStep {
  id: string;
  traceId: string;
  stepNumber: number;
  agentId: string;
  action: string;
  toolsUsed: ToolUsage[];
  citations: Citation[];
  duration: number;
  errorCount: number;
  retryCount: number;
  memoryUsage?: number;
  tokenUsage?: TokenUsage;
  timestamp: Date;
}

interface ToolUsage {
  toolName: string;
  inputSize: number;
  outputSize: number;
  executionTime: number;
  success: boolean;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  modelId: string;
}
```

### データアクセスパターン

#### オーナーベースアクセス制御
```typescript
/**
 * データアクセス制御設計
 * 
 * 設計理由:
 * - プライバシー保護とデータ分離
 * - GDPR/CCPA準拠
 * - マルチテナント対応
 */

// GraphQL Authorization Rules
const authRules = {
  User: [allow.owner()],
  Conversation: [allow.owner().to(['read', 'create', 'update', 'delete'])],
  Message: [allow.owner().to(['read', 'create'])],
  TraceStep: [allow.owner().to(['read', 'create'])],
  AgentPreset: [allow.owner().to(['read', 'create', 'update', 'delete'])]
};

// データクエリパターン
const conversationQueries = {
  // ユーザーの会話一覧
  listUserConversations: `
    query ListUserConversations($userId: ID!) {
      listConversations(filter: {userId: {eq: $userId}}) {
        items {
          id
          title
          createdAt
          updatedAt
        }
      }
    }
  `,
  
  // 会話詳細とメッセージ
  getConversationWithMessages: `
    query GetConversationWithMessages($id: ID!) {
      getConversation(id: $id) {
        id
        title
        messages {
          items {
            id
            role
            content
            agentResponses
            judgeResponse
            magiVoting
            traceId
            createdAt
          }
        }
      }
    }
  `
};
```

## エラーハンドリング

### 段階的機能縮退設計

```typescript
/**
 * エラーハンドリング戦略
 * 
 * 設計理由:
 * - システム全体の可用性確保
 * - 部分的な機能提供による継続性
 * - ユーザー体験の最適化
 */

interface ErrorHandlingStrategy {
  // レベル1: 単一エージェント失敗
  singleAgentFailure: {
    action: 'continue_with_available_agents';
    fallback: 'mark_failed_agent_in_ui';
    notification: 'show_warning_message';
  };
  
  // レベル2: 複数エージェント失敗
  multipleAgentFailure: {
    action: 'attempt_fallback_models';
    fallback: 'provide_basic_response';
    notification: 'show_degraded_service_warning';
  };
  
  // レベル3: システム全体失敗
  systemFailure: {
    action: 'switch_to_offline_mode';
    fallback: 'cached_responses_only';
    notification: 'show_maintenance_message';
  };
}

class ErrorRecoveryManager {
  async handleAgentFailure(
    agentId: string, 
    error: Error, 
    context: ExecutionContext
  ): Promise<RecoveryResult> {
    // エラー分類
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'RATE_LIMIT':
        return await this.handleRateLimit(agentId, context);
      
      case 'MODEL_UNAVAILABLE':
        return await this.switchToFallbackModel(agentId, context);
      
      case 'TIMEOUT':
        return await this.retryWithBackoff(agentId, context);
      
      case 'AUTHENTICATION':
        return await this.refreshCredentials(agentId, context);
      
      default:
        return await this.gracefulDegradation(agentId, context);
    }
  }
}
```

### フォールバック機構

```typescript
/**
 * フォールバック機構設計
 * 
 * 設計理由:
 * - 基本的な安定性確保
 * - 学習用の異なるモデル体験
 * - 個人開発でのコスト管理
 */

interface FallbackConfiguration {
  primary: ModelConfiguration;
  fallbacks: ModelConfiguration[];
  switchingCriteria: SwitchingCriteria;
}

interface ModelConfiguration {
  provider: 'bedrock' | 'openai' | 'anthropic';
  modelId: string;
  maxTokens: number;
  temperature: number;
  costPerToken: number;
}

class FallbackManager {
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    config: FallbackConfiguration
  ): Promise<T> {
    let lastError: Error;
    
    // プライマリモデル試行
    try {
      return await this.executeWithModel(operation, config.primary);
    } catch (error) {
      lastError = error;
      this.logModelFailure(config.primary, error);
    }
    
    // フォールバックモデル順次試行
    for (const fallback of config.fallbacks) {
      try {
        return await this.executeWithModel(operation, fallback);
      } catch (error) {
        lastError = error;
        this.logModelFailure(fallback, error);
      }
    }
    
    throw new FallbackExhaustedException(lastError);
  }
}
```

## テスト戦略

### 統合テスト設計

```typescript
/**
 * テスト戦略
 * 
 * 設計理由:
 * - エージェント間相互作用の検証
 * - リアルタイム機能の信頼性確保
 * - パフォーマンス要件の継続的検証
 */

describe('MAGI System Integration Tests', () => {
  describe('Multi-Agent Analysis', () => {
    it('should execute 3 agents in parallel', async () => {
      const startTime = Date.now();
      const result = await magiSystem.analyze(testQuery);
      const executionTime = Date.now() - startTime;
      
      // 並列実行の検証
      expect(result.agentResponses).toHaveLength(3);
      expect(executionTime).toBeLessThan(10000); // 10秒未満
      
      // 各エージェントの応答検証
      expect(result.agentResponses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ agentId: 'caspar' }),
          expect.objectContaining({ agentId: 'balthasar' }),
          expect.objectContaining({ agentId: 'melchior' })
        ])
      );
    });
    
    it('should handle single agent failure gracefully', async () => {
      // CASPARエージェントを意図的に失敗させる
      jest.spyOn(casparAgent, 'analyze').mockRejectedValue(
        new Error('Model unavailable')
      );
      
      const result = await magiSystem.analyze(testQuery);
      
      // 残り2エージェントで継続実行
      expect(result.agentResponses).toHaveLength(2);
      expect(result.errors).toContain('caspar_failed');
      expect(result.judgeResponse).toBeDefined();
    });
  });
  
  describe('MAGI Voting System', () => {
    it('should collect votes from all agents', async () => {
      const result = await magiSystem.analyze(testQuery);
      
      expect(result.magiVoting).toBeDefined();
      expect(result.magiVoting.caspar.vote).toMatch(/approve|reject|abstain/);
      expect(result.magiVoting.balthasar.vote).toMatch(/approve|reject|abstain/);
      expect(result.magiVoting.melchior.vote).toMatch(/approve|reject|abstain/);
      expect(result.magiVoting.finalDecision).toMatch(/approved|rejected|abstain/);
    });
    
    it('should calculate voting patterns correctly', async () => {
      const result = await magiSystem.analyze(testQuery);
      const pattern = result.magiVoting.votingPattern;
      
      if (pattern.unanimity) {
        expect(pattern.dissent).toHaveLength(0);
      } else {
        expect(pattern.majority).toBeDefined();
      }
    });
  });
  
  describe('Real-time Updates', () => {
    it('should stream trace steps in real-time', async () => {
      const traceSteps: TraceStep[] = [];
      
      // GraphQL Subscription監視
      const subscription = subscribeToTraceSteps(testTraceId);
      subscription.subscribe({
        next: (step) => traceSteps.push(step),
        error: (error) => fail(error),
        complete: () => {}
      });
      
      await magiSystem.analyze(testQuery);
      
      // リアルタイム更新の検証
      expect(traceSteps.length).toBeGreaterThan(0);
      expect(traceSteps[0].stepNumber).toBe(1);
    });
  });
});
```

### パフォーマンステスト

```typescript
/**
 * パフォーマンステスト設計
 * 
 * 設計理由:
 * - レスポンス時間要件の継続的検証
 * - スケーラビリティの確認
 * - リソース使用量の監視
 */

describe('Performance Tests', () => {
  it('should meet response time requirements', async () => {
    const metrics = await performanceTest({
      concurrent_users: 10,
      test_duration: '60s',
      ramp_up: '10s'
    });
    
    expect(metrics.avg_response_time).toBeLessThan(2000); // 2秒未満
    expect(metrics.p95_response_time).toBeLessThan(5000); // 95%ile 5秒未満
    expect(metrics.error_rate).toBeLessThan(0.01); // エラー率1%未満
  });
  
  it('should handle concurrent agent executions', async () => {
    const promises = Array.from({ length: 5 }, () => 
      magiSystem.analyze(testQuery)
    );
    
    const results = await Promise.all(promises);
    
    // 全て成功することを確認
    results.forEach(result => {
      expect(result.agentResponses).toHaveLength(3);
      expect(result.judgeResponse).toBeDefined();
    });
  });
});
```

## 設計判断の根拠

### 1. 並列実行の選択
**判断**: 3賢者エージェントの並列実行を必須とする
**根拠**: 
- レスポンス時間の大幅短縮（3倍の性能向上）
- リソース使用効率の最適化
- ユーザー体験の向上

### 2. GraphQL Subscriptionsの採用
**判断**: リアルタイム更新にGraphQL Subscriptionsを使用
**根拠**:
- AppSyncの標準機能で実装コストが低い
- 型安全性とスキーマ駆動開発
- WebSocketの自動管理

### 3. オーナーベースアクセス制御
**判断**: Amplify Dataの@authディレクティブを活用
**根拠**:
- プライバシー保護の確実な実装
- GDPR/CCPA準拠の簡素化
- 実装とメンテナンスの効率化

### 4. MAGI投票システムの追加
**判断**: 従来のスコアリングに加えて投票システムを実装
**根拠**:
- 意思決定プロセスの透明性向上
- ユーザーの理解促進
- 統計分析とパターン認識の基盤

### 5. 段階的機能縮退の実装
**判断**: エージェント失敗時の継続実行機能
**根拠**:
- システム全体の可用性確保
- 部分的な価値提供による継続性
- ユーザー満足度の維持

この設計により、要件で定義された全ての機能要件を満たしつつ、拡張性と保守性を確保した統合システムを構築できます。
## ストリーミ
ング処理パターン設計（ChatGPT風）

### ストリーミングフロー詳細

#### 1. ストリーミングAPI実装
```typescript
// API Route: /api/agents/ask-stream
export async function POST(request: NextRequest) {
  const { message, conversationId } = await request.json();
  
  // ReadableStreamを作成
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. AgentCore Runtime呼び出し（ストリーミング）
        const response = await client.send(new InvokeAgentRuntimeCommand({
          agentRuntimeArn: process.env.MAGI_AGENT_ARN,
          runtimeSessionId: conversationId,
          payload: JSON.stringify({ prompt: message })
        }));
        
        // 2. ストリーミングレスポンスを処理
        if (response.response) {
          for await (const chunk of response.response) {
            // 3. チャンクをフロントエンドに送信
            const data = JSON.stringify({
              type: 'chunk',
              data: chunk,
              timestamp: new Date().toISOString()
            });
            
            controller.enqueue(`data: ${data}\n\n`);
          }
        }
        
        // 4. ストリーム終了
        controller.enqueue('data: [DONE]\n\n');
        controller.close();
        
      } catch (error) {
        controller.error(error);
      }
    }
  });
  
  // 5. Server-Sent Eventsとして返却
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

#### 2. フロントエンドストリーミング受信
```typescript
// React Hook: ストリーミング処理
function useStreamingMAGI() {
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const askMAGIStream = async (message: string, conversationId: string) => {
    setIsStreaming(true);
    setStreamingResponse('');
    
    try {
      // 1. Server-Sent Events接続
      const response = await fetch('/api/agents/ask-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId })
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      // 2. ストリーミングデータを受信
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setIsStreaming(false);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              // 3. リアルタイム表示更新
              if (parsed.type === 'agent_response') {
                updateAgentResponse(parsed.data);
              } else if (parsed.type === 'chunk') {
                setStreamingResponse(prev => prev + parsed.data);
              }
            } catch (e) {
              // JSON解析エラーは無視
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setIsStreaming(false);
    }
  };
  
  return { askMAGIStream, streamingResponse, isStreaming };
}
```

#### 3. MAGI並列ストリーミング
```typescript
// AgentCore Runtime内でのストリーミング実装
class MAGIStreamingSystem {
  async processStreamingDecision(prompt: string, streamCallback: Function) {
    // 1. 処理開始通知
    streamCallback({
      type: 'status',
      data: { status: 'starting', agents: ['caspar', 'balthasar', 'melchior'] }
    });
    
    // 2. 3賢者並列実行（ストリーミング）
    const agentPromises = [
      this.streamAgentResponse('caspar', prompt, streamCallback),
      this.streamAgentResponse('balthasar', prompt, streamCallback),
      this.streamAgentResponse('melchior', prompt, streamCallback)
    ];
    
    const agentResponses = await Promise.all(agentPromises);
    
    // 3. SOLOMON統合判断（ストリーミング）
    const judgeResponse = await this.streamSolomonJudgment(
      agentResponses, 
      prompt, 
      streamCallback
    );
    
    // 4. 最終結果
    streamCallback({
      type: 'final_result',
      data: {
        agentResponses,
        judgeResponse,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  async streamAgentResponse(agentId: string, prompt: string, streamCallback: Function) {
    const agent = this.agents[agentId];
    
    // エージェント開始通知
    streamCallback({
      type: 'agent_start',
      data: { agentId, status: 'thinking' }
    });
    
    // ストリーミング実行
    let fullResponse = '';
    const result = await agent.stream(prompt, (chunk: string) => {
      fullResponse += chunk;
      
      // チャンクごとに通知
      streamCallback({
        type: 'agent_chunk',
        data: { agentId, chunk, fullResponse }
      });
    });
    
    // エージェント完了通知
    streamCallback({
      type: 'agent_complete',
      data: { 
        agentId, 
        decision: result.decision,
        reasoning: result.reasoning,
        confidence: result.confidence
      }
    });
    
    return result;
  }
}
```

#### 4. UI表示コンポーネント
```typescript
// ストリーミング表示コンポーネント
function StreamingMAGIResponse({ 
  streamingData, 
  isStreaming 
}: {
  streamingData: StreamingData;
  isStreaming: boolean;
}) {
  return (
    <div className="magi-streaming-container">
      {/* 3賢者の並列表示 */}
      <div className="agents-grid">
        {['caspar', 'balthasar', 'melchior'].map(agentId => (
          <AgentStreamingCard
            key={agentId}
            agentId={agentId}
            status={streamingData.agents[agentId]?.status}
            response={streamingData.agents[agentId]?.response}
            isStreaming={isStreaming && streamingData.activeAgent === agentId}
          />
        ))}
      </div>
      
      {/* SOLOMON統合判断 */}
      <SolomonStreamingCard
        judgeResponse={streamingData.solomon}
        isStreaming={isStreaming && streamingData.activeAgent === 'solomon'}
      />
      
      {/* 進捗表示 */}
      <StreamingProgress
        totalAgents={4}
        completedAgents={streamingData.completedCount}
        currentAgent={streamingData.activeAgent}
      />
    </div>
  );
}

function AgentStreamingCard({ agentId, status, response, isStreaming }) {
  return (
    <div className={`agent-card ${agentId}`}>
      <div className="agent-header">
        <AgentIcon agentId={agentId} />
        <span className="agent-name">{agentId.toUpperCase()}</span>
        <StreamingIndicator isActive={isStreaming} />
      </div>
      
      <div className="agent-response">
        {status === 'thinking' && (
          <ThinkingAnimation />
        )}
        
        {response && (
          <div className="response-content">
            <div className="decision-badge">
              {response.decision}
            </div>
            <div className="reasoning">
              {response.reasoning}
              {isStreaming && <BlinkingCursor />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### ストリーミングパターンの利点

#### 1. ChatGPT風UX
- **即座の反応**: タイピング開始の視覚的フィードバック
- **進捗表示**: どのエージェントが処理中かリアルタイム表示
- **段階的表示**: 各エージェントの判断が順次表示

#### 2. 長時間処理対応
- **AgentCore Runtime**: 8時間実行でタイムアウトなし
- **接続維持**: Server-Sent Eventsで安定した接続
- **エラー回復**: 接続断時の自動再接続

#### 3. パフォーマンス最適化
- **並列処理**: 3賢者の真の並列実行
- **メモリ効率**: ストリーミングによる低メモリ使用
- **レスポンシブ**: UIブロックなしの応答性

この同期ストリーミングパターンにより、ChatGPTのような優れたユーザーエクスペリエンスを提供しながら、AgentCore Runtimeの長時間実行能力を最大限活用できます。