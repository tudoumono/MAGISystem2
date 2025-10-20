# Design Document

## Overview

UIからの質問を受け取り、Strands Agentsフレームワークを使用して3賢者とSOLOMON Judgeを並列実行し、統合された結果を返すエージェントゲートウェイシステムを設計します。Amazon Bedrock AgentCore Runtimeで観測機能を有効化し、OpenTelemetryによる分散トレーシングとAmplify Dataへのトレース永続化を実現します。

**学習目的**: Amazon Bedrock AgentCore、Strands Agents、OpenTelemetryの統合パターンを学習し、実用的なマルチエージェントシステムの構築方法を習得します。

## Architecture

### システム全体アーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              POST /api/ask                              │ │
│  │  { message, conversationId, agentConfig? }             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Amplify Custom Handler                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Agent Gateway Orchestrator                    │ │
│  │  • Request Validation & Authentication                  │ │
│  │  • Agent Configuration Management                       │ │
│  │  • Trace ID Generation                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Amazon Bedrock AgentCore                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Runtime     │  │ Observability│  │ Memory              │  │
│  │ Service     │  │ (OTEL)      │  │ Service             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Strands Agents                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ CASPAR  │  │BALTHASAR│  │MELCHIOR │  ← Parallel Exec    │
│  │(保守的) │  │(革新的) │  │(バランス)│                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                     │                                       │
│                     ▼ A2A Protocol                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              SOLOMON Judge                              │ │
│  │  • Aggregate 3 Sage Responses                          │ │
│  │  • Score & Evaluate (0-100)                           │ │
│  │  • Generate Final Recommendation                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Observability & Storage                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ CloudWatch  │  │ AWS X-Ray   │  │ Amplify Data        │  │
│  │ Metrics     │  │ Traces      │  │ TraceStep Storage   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### データフロー詳細
```
1. Request Flow:
   UI → Amplify Handler → AgentCore → Strands Agents

2. Agent Execution Flow (SOLOMON統括):
   User Question → SOLOMON Judge (Orchestrator)
                      ↓
                   ┌─────────────────────┐
                   │  SOLOMON delegates  │
                   │  to 3 Sages         │
                   └─────────────────────┘
                      ↓
   CASPAR ┐
   BALTHASAR ├─ Parallel Execution
   MELCHIOR ┘
                      ↓
   SOLOMON Judge ← Results Aggregation
                      ↓
   Final Response (Scores + Recommendation)

3. Observability Flow:
   SOLOMON → 3 Sages → OTEL Traces → X-Ray + CloudWatch
   
4. Storage Flow:
   TraceSteps → Amplify Data → DynamoDB
```

## Components and Interfaces

### 1. Amplify Custom Handler
```typescript
// amplify/functions/agent-gateway/handler.ts
export const handler = defineFunction({
  name: 'agent-gateway',
  entry: './index.ts',
  environment: {
    BEDROCK_REGION: 'us-east-1',
    AGENTCORE_ENDPOINT: process.env.AGENTCORE_ENDPOINT,
    STRANDS_GATEWAY_URL: process.env.STRANDS_GATEWAY_URL,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_ENDPOINT
  },
  timeout: 300, // 5分タイムアウト
  memoryMB: 1024
});

interface AskRequest {
  message: string;
  conversationId?: string;
  agentConfig?: AgentConfig[];
  userId: string; // Amplify Authから取得
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

interface AskResponse {
  conversationId: string;
  messageId: string;
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse;
  traceId: string;
  executionTime: number;
}
```

### 2. Agent Configuration Management
```typescript
// src/lib/agent-config.ts
interface AgentConfig {
  agentId: AgentType;
  modelId: string;           // claude-3-sonnet, gpt-4, etc.
  systemPrompt: string;      // エージェント固有のプロンプト
  temperature: number;       // 0.0-1.0
  maxTokens: number;         // 最大トークン数
  tools?: ToolConfig[];      // 利用可能ツール
}

interface AgentPreset {
  id: string;
  name: string;
  description: string;
  configs: Record<AgentType, AgentConfig>;
  isDefault: boolean;
}

// システムプロンプト定義（MAGI可決/否決システム）
const CASPAR_CONSERVATIVE_PROMPT = `
あなたはCASPAR（カスパー）です。エヴァンゲリオンのMAGIシステムの一部として、保守的で現実的な視点から判断を行います。

判断基準：
- リスクを慎重に評価し、安全性を最優先
- 既存の実績や前例を重視
- 実行可能性と現実性を厳格に検証
- 不確実性が高い場合は慎重な判断を下す

出力形式：
判断: [可決] または [否決]
理由: 判断に至った具体的な根拠
リスク評価: 想定されるリスクと対策
`;

const BALTHASAR_INNOVATIVE_PROMPT = `
あなたはBALTHASAR（バルタザール）です。エヴァンゲリオンのMAGIシステムの一部として、革新的で感情的な視点から判断を行います。

判断基準：
- 創造性と革新性を重視
- 人間的な感情や倫理的側面を考慮
- 新しい可能性や機会を積極的に評価
- 長期的な価値や意義を重視

出力形式：
判断: [可決] または [否決]
理由: 判断に至った具体的な根拠
革新性評価: 新しい価値や可能性の分析
`;

const MELCHIOR_BALANCED_PROMPT = `
あなたはMELCHIOR（メルキオール）です。エヴァンゲリオンのMAGIシステムの一部として、科学的でバランスの取れた視点から判断を行います。

判断基準：
- データと論理に基づいた客観的分析
- 複数の観点を総合的に評価
- 科学的根拠と合理性を重視
- バランスの取れた中立的な判断

出力形式：
判断: [可決] または [否決]
理由: 判断に至った具体的な根拠
科学的分析: データと論理に基づく評価
`;

const SOLOMON_JUDGE_PROMPT = `
あなたはSOLOMON Judgeです。エヴァンゲリオンのMAGIシステムの統括者として、3賢者の判断を統合し最終決定を行います。

役割：
1. 3賢者（CASPAR、BALTHASAR、MELCHIOR）に質問を委託
2. 各賢者の可決/否決判断を収集・分析
3. 投票結果と根拠を総合して最終判断を決定
4. 判断の透明性と説明責任を確保

最終判断ルール：
- 3票中2票以上の合意で決定
- 1-1-1の場合は詳細分析により判断
- 各賢者の判断根拠の妥当性も考慮

出力形式：
各賢者の判断結果
投票集計: 可決X票、否決Y票
最終判断: [可決] または [否決]
統合根拠: 最終判断に至った理由
`;

// デフォルトプリセット例
const DEFAULT_PRESETS: AgentPreset[] = [
  {
    id: 'default',
    name: 'デフォルト（MAGI標準）',
    description: 'エヴァンゲリオンMAGIシステムの標準設定',
    configs: {
      caspar: {
        agentId: 'caspar',
        modelId: 'claude-3-sonnet',
        systemPrompt: CASPAR_CONSERVATIVE_PROMPT,
        temperature: 0.3,
        maxTokens: 2000
      },
      balthasar: {
        agentId: 'balthasar', 
        modelId: 'claude-3-sonnet',
        systemPrompt: BALTHASAR_INNOVATIVE_PROMPT,
        temperature: 0.8,
        maxTokens: 2000
      },
      melchior: {
        agentId: 'melchior',
        modelId: 'claude-3-sonnet', 
        systemPrompt: MELCHIOR_BALANCED_PROMPT,
        temperature: 0.5,
        maxTokens: 2000
      },
      solomon: {
        agentId: 'solomon',
        modelId: 'claude-3-opus',
        systemPrompt: SOLOMON_JUDGE_PROMPT,
        temperature: 0.2,
        maxTokens: 1500
      }
    },
    isDefault: true
  }
];
```

### 3. Strands Agents Integration
```python
# agents/gateway/orchestrator.py
from strands import Agent, Swarm
from strands.protocols import A2AProtocol
import asyncio
from typing import List, Dict, Any

class MAGIOrchestrator:
    """
    MAGIシステムのメインオーケストレーター
    SOLOMONが統括者として3賢者を制御し、最終判断を行う
    """
    
    def __init__(self, config: Dict[str, AgentConfig]):
        # 3賢者をSOLOMONのツールとして定義
        self.caspar = Agent(
            name="CASPAR",
            model=config['caspar']['modelId'],
            system_prompt=config['caspar']['systemPrompt'],
            temperature=config['caspar']['temperature']
        )
        
        self.balthasar = Agent(
            name="BALTHASAR", 
            model=config['balthasar']['modelId'],
            system_prompt=config['balthasar']['systemPrompt'],
            temperature=config['balthasar']['temperature']
        )
        
        self.melchior = Agent(
            name="MELCHIOR",
            model=config['melchior']['modelId'], 
            system_prompt=config['melchior']['systemPrompt'],
            temperature=config['melchior']['temperature']
        )
        
        # SOLOMON Judge - 統括者として3賢者を制御
        self.solomon = Agent(
            name="SOLOMON",
            model=config['solomon']['modelId'],
            system_prompt=config['solomon']['systemPrompt'],
            temperature=config['solomon']['temperature'],
            tools=[
                self._create_sage_tool(self.caspar),
                self._create_sage_tool(self.balthasar), 
                self._create_sage_tool(self.melchior)
            ]
        )
    
    def _create_sage_tool(self, sage_agent: Agent):
        """賢者をSOLOMONのツールとして定義"""
        async def sage_consultation(question: str) -> str:
            """SOLOMONが賢者に相談するためのツール"""
            return await sage_agent.run(question)
        
        return {
            'name': f'consult_{sage_agent.name.lower()}',
            'description': f'Consult with {sage_agent.name} for their perspective',
            'function': sage_consultation
        }
    
    async def execute_magi_decision(
        self, 
        question: str, 
        trace_id: str
    ) -> Dict[str, Any]:
        """
        MAGIシステムの意思決定プロセスを実行
        
        SOLOMONが統括者として：
        1. 質問を分析
        2. 3賢者に相談（並列実行）
        3. 各賢者の回答を評価・統合
        4. 最終判断と推奨を提供
        """
        
        with tracer.start_as_current_span("magi_decision_process") as span:
            span.set_attribute("trace_id", trace_id)
            span.set_attribute("question_length", len(question))
            
            start_time = time.time()
            
            # SOLOMONが統括者として実行
            # 内部で3賢者のツールを並列実行
            solomon_response = await self.solomon.run(
                f"""
                質問: {question}
                
                あなたはSOLOMON Judgeとして、以下の手順で意思決定を行ってください：
                
                1. まず3賢者（CASPAR、BALTHASAR、MELCHIOR）に相談
                2. 各賢者の回答を0-100点で評価
                3. 統合的な判断と最終推奨を提供
                
                各賢者の特性：
                - CASPAR: 保守的・現実的な視点
                - BALTHASAR: 革新的・感情的な視点  
                - MELCHIOR: バランス型・科学的な視点
                """
            )
            
            execution_time = time.time() - start_time
            
            # SOLOMONの応答から構造化データを抽出
            parsed_response = self._parse_solomon_response(solomon_response)
            
            span.set_attribute("execution_time", execution_time)
            span.set_attribute("sages_consulted", len(parsed_response['agentResponses']))
            
            return {
                'agentResponses': parsed_response['agentResponses'],
                'judgeResponse': parsed_response['judgeResponse'],
                'traceId': trace_id,
                'executionTime': execution_time
            }
    
    def _parse_solomon_response(self, solomon_response: str) -> Dict[str, Any]:
        """
        SOLOMONの応答から構造化データを抽出
        
        SOLOMONの応答には以下が含まれる：
        - 各賢者への相談結果
        - 各賢者の回答に対する評価・スコア
        - 統合的な判断と最終推奨
        """
        
        # SOLOMONの応答をパースして構造化
        # 実際の実装では、SOLOMONに構造化された出力を要求するか、
        # LLMの応答をパースするロジックを実装
        
        try:
            # 簡略化された例 - 実際はより堅牢なパースが必要
            lines = solomon_response.split('\n')
            
            agent_responses = []
            judge_response = {
                'summary': '',
                'scores': [],
                'finalRecommendation': '',
                'confidence': 0.0
            }
            
            current_section = None
            current_agent = None
            
            for line in lines:
                line = line.strip()
                
                if 'CASPAR' in line.upper():
                    current_agent = 'caspar'
                    current_section = 'sage_response'
                elif 'BALTHASAR' in line.upper():
                    current_agent = 'balthasar'
                    current_section = 'sage_response'
                elif 'MELCHIOR' in line.upper():
                    current_agent = 'melchior'
                    current_section = 'sage_response'
                elif '評価' in line or 'SCORE' in line.upper():
                    current_section = 'scoring'
                elif '最終判断' in line or 'FINAL' in line.upper():
                    current_section = 'final_judgment'
                
                # 各セクションの内容を抽出
                if current_section == 'sage_response' and current_agent:
                    # 賢者の応答を抽出
                    pass
                elif current_section == 'scoring':
                    # スコアを抽出
                    pass
                elif current_section == 'final_judgment':
                    # 最終判断を抽出
                    pass
            
            return {
                'agentResponses': agent_responses,
                'judgeResponse': judge_response
            }
            
        except Exception as e:
            logger.error(f"Failed to parse SOLOMON response: {e}")
            # フォールバック: 基本的な応答を返す
            return {
                'agentResponses': [
                    {
                        'agentId': 'solomon_integrated',
                        'content': solomon_response,
                        'confidence': 0.8,
                        'executionTime': 0,
                        'reasoning': 'Integrated response from SOLOMON'
                    }
                ],
                'judgeResponse': {
                    'summary': solomon_response[:200] + '...',
                    'scores': [],
                    'finalRecommendation': solomon_response,
                    'confidence': 0.8
                }
            }
```

### 4. OpenTelemetry Integration
```python
# agents/shared/observability.py
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider

def setup_observability():
    """
    OpenTelemetryの設定
    AWS X-Ray + CloudWatchとの統合
    """
    
    # Trace設定
    trace.set_tracer_provider(TracerProvider())
    tracer = trace.get_tracer(__name__)
    
    # X-Rayエクスポーター設定
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT"),
        headers={
            "x-aws-region": os.getenv("AWS_REGION", "us-east-1")
        }
    )
    
    # Metrics設定
    metrics.set_meter_provider(MeterProvider())
    meter = metrics.get_meter(__name__)
    
    # カスタムメトリクス定義
    agent_execution_counter = meter.create_counter(
        "magi_agent_executions_total",
        description="Total number of agent executions"
    )
    
    agent_execution_duration = meter.create_histogram(
        "magi_agent_execution_duration_seconds", 
        description="Agent execution duration in seconds"
    )
    
    token_usage_counter = meter.create_counter(
        "magi_token_usage_total",
        description="Total tokens used by agents"
    )
    
    return tracer, meter, {
        'execution_counter': agent_execution_counter,
        'execution_duration': agent_execution_duration,
        'token_usage': token_usage_counter
    }
```

### 5. TraceStep Storage
```typescript
// amplify/functions/agent-gateway/trace-storage.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

const client = generateClient<Schema>();

interface TraceStepData {
  messageId: string;
  traceId: string;
  stepNumber: number;
  agentId: string;
  action: string;
  toolsUsed: string[];
  citations: string[];
  duration: number;
  errorCount: number;
  metadata?: Record<string, any>;
}

export class TraceStepStorage {
  /**
   * トレースステップをAmplify Dataに保存
   * リアルタイム更新でUIに配信
   */
  async saveTraceStep(stepData: TraceStepData): Promise<void> {
    try {
      await client.models.TraceStep.create({
        messageId: stepData.messageId,
        traceId: stepData.traceId,
        stepNumber: stepData.stepNumber,
        agentId: stepData.agentId,
        action: stepData.action,
        toolsUsed: stepData.toolsUsed,
        citations: stepData.citations,
        duration: stepData.duration,
        errorCount: stepData.errorCount,
        timestamp: new Date().toISOString(),
        metadata: stepData.metadata ? JSON.stringify(stepData.metadata) : null
      });
      
      console.log(`TraceStep saved: ${stepData.traceId}:${stepData.stepNumber}`);
      
    } catch (error) {
      console.error('Failed to save TraceStep:', error);
      // エラーでも実行は継続（観測データの保存失敗で本処理を止めない）
    }
  }
  
  /**
   * トレースステップのバッチ保存
   * 複数ステップを効率的に保存
   */
  async saveTraceStepsBatch(steps: TraceStepData[]): Promise<void> {
    const promises = steps.map(step => this.saveTraceStep(step));
    await Promise.allSettled(promises); // 一部失敗しても継続
  }
}
```

## Error Handling

### 1. Agent Execution Errors
```python
# agents/shared/error_handling.py
from enum import Enum
from typing import Optional, Dict, Any

class AgentErrorType(Enum):
    TIMEOUT = "timeout"
    MODEL_ERROR = "model_error"
    RATE_LIMIT = "rate_limit"
    CONFIGURATION_ERROR = "configuration_error"
    NETWORK_ERROR = "network_error"

class AgentExecutionError(Exception):
    def __init__(
        self, 
        error_type: AgentErrorType,
        message: str,
        agent_id: str,
        recoverable: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.error_type = error_type
        self.agent_id = agent_id
        self.recoverable = recoverable
        self.metadata = metadata or {}
        super().__init__(message)

class ErrorRecoveryStrategy:
    """エージェント実行エラーの回復戦略"""
    
    @staticmethod
    async def handle_agent_error(
        error: AgentExecutionError,
        fallback_config: Optional[AgentConfig] = None
    ) -> Optional[Dict[str, Any]]:
        """
        エージェントエラーの処理と回復
        
        1. リトライ可能エラー → 指数バックオフでリトライ
        2. 設定エラー → フォールバック設定で再実行
        3. 回復不可能エラー → 部分結果で継続
        """
        
        if error.error_type == AgentErrorType.RATE_LIMIT:
            # レート制限 → 指数バックオフ
            await asyncio.sleep(2 ** error.metadata.get('retry_count', 1))
            return await retry_agent_execution(error.agent_id)
            
        elif error.error_type == AgentErrorType.CONFIGURATION_ERROR:
            # 設定エラー → デフォルト設定で再実行
            if fallback_config:
                return await execute_with_fallback_config(
                    error.agent_id, 
                    fallback_config
                )
                
        elif error.error_type == AgentErrorType.TIMEOUT:
            # タイムアウト → 部分結果を返却
            return {
                'agentId': error.agent_id,
                'content': 'エージェント実行がタイムアウトしました',
                'confidence': 0.0,
                'executionTime': 0,
                'error': True,
                'errorType': error.error_type.value
            }
        
        # 回復不可能 → None返却（他のエージェント結果で継続）
        return None
```

### 2. Graceful Degradation
```python
# agents/gateway/degradation.py
class GracefulDegradation:
    """システム障害時の段階的機能縮退"""
    
    async def execute_with_degradation(
        self, 
        question: str, 
        trace_id: str
    ) -> Dict[str, Any]:
        """
        段階的機能縮退での実行
        
        Level 1: 全エージェント正常実行
        Level 2: 一部エージェント失敗 → 利用可能エージェントで継続
        Level 3: SOLOMON失敗 → 3賢者の平均スコアで代替
        Level 4: 全エージェント失敗 → エラーレスポンス
        """
        
        sage_responses = []
        failed_agents = []
        
        # 3賢者の実行（失敗しても継続）
        for agent_name, agent in [
            ('caspar', self.caspar),
            ('balthasar', self.balthasar), 
            ('melchior', self.melchior)
        ]:
            try:
                response = await self._execute_sage(agent, question, trace_id)
                sage_responses.append(response)
            except Exception as e:
                failed_agents.append(agent_name)
                logger.warning(f"Agent {agent_name} failed: {e}")
        
        # Level 4: 全エージェント失敗
        if not sage_responses:
            return self._create_error_response(
                "全てのエージェントが実行に失敗しました", 
                trace_id
            )
        
        # Level 2-3: 部分的成功でSOLOMON実行
        try:
            judge_response = await self._execute_solomon_judge(
                question, sage_responses, trace_id
            )
        except Exception as e:
            # Level 3: SOLOMON失敗 → 代替評価
            logger.warning(f"SOLOMON Judge failed: {e}")
            judge_response = self._create_fallback_judgment(sage_responses)
        
        return {
            'agentResponses': sage_responses,
            'judgeResponse': judge_response,
            'traceId': trace_id,
            'degradationLevel': len(failed_agents),
            'failedAgents': failed_agents
        }
```

## Testing Strategy

### 1. Agent Unit Testing
```python
# tests/test_agents.py
import pytest
from agents.gateway.orchestrator import MAGIOrchestrator

@pytest.mark.asyncio
async def test_caspar_conservative_response():
    """CASPAR エージェントの保守的回答をテスト"""
    config = load_test_config()
    orchestrator = MAGIOrchestrator(config)
    
    question = "新しい技術を導入すべきでしょうか？"
    response = await orchestrator._execute_sage(
        orchestrator.caspar, 
        question, 
        "test-trace-id"
    )
    
    assert response['agentId'] == 'caspar'
    assert 'リスク' in response['content']  # 保守的な観点
    assert response['confidence'] > 0.0

@pytest.mark.asyncio 
async def test_solomon_judge_scoring():
    """SOLOMON Judge のスコアリング精度をテスト"""
    mock_sage_responses = [
        {'agentId': 'caspar', 'content': '慎重に検討すべき', 'confidence': 0.8},
        {'agentId': 'balthasar', 'content': '積極的に導入すべき', 'confidence': 0.9},
        {'agentId': 'melchior', 'content': 'バランスを考慮して', 'confidence': 0.7}
    ]
    
    config = load_test_config()
    orchestrator = MAGIOrchestrator(config)
    
    judge_response = await orchestrator._execute_solomon_judge(
        "テスト質問", mock_sage_responses, "test-trace-id"
    )
    
    assert len(judge_response['scores']) == 3
    assert all(0 <= score['score'] <= 100 for score in judge_response['scores'])
    assert judge_response['finalRecommendation']
```

### 2. Integration Testing
```python
# tests/test_integration.py
@pytest.mark.asyncio
async def test_full_magi_execution():
    """完全なMAGI実行フローをテスト"""
    config = load_test_config()
    orchestrator = MAGIOrchestrator(config)
    
    question = "AIの倫理的な使用について教えてください"
    trace_id = "integration-test-trace"
    
    result = await orchestrator.execute_magi_decision(question, trace_id)
    
    # 基本構造の検証
    assert 'agentResponses' in result
    assert 'judgeResponse' in result
    assert 'traceId' in result
    assert result['traceId'] == trace_id
    
    # 3賢者の応答検証
    assert len(result['agentResponses']) == 3
    agent_ids = {resp['agentId'] for resp in result['agentResponses']}
    assert agent_ids == {'caspar', 'balthasar', 'melchior'}
    
    # SOLOMON評価の検証
    judge = result['judgeResponse']
    assert len(judge['scores']) == 3
    assert judge['summary']
    assert judge['finalRecommendation']
```

## Performance Optimizations

### 1. Parallel Execution
- **3賢者並列実行**: `asyncio.gather()` で同時実行
- **非同期I/O**: Strands Agentsの非同期機能活用
- **リソース効率化**: AgentCoreの自動スケーリング

### 2. Caching Strategy
```python
# agents/shared/caching.py
from functools import lru_cache
import hashlib

class ResponseCache:
    """エージェント応答のキャッシュ管理"""
    
    def __init__(self, ttl_seconds: int = 3600):
        self.ttl_seconds = ttl_seconds
        self.cache = {}
    
    def _generate_cache_key(
        self, 
        question: str, 
        agent_config: AgentConfig
    ) -> str:
        """質問とエージェント設定からキャッシュキーを生成"""
        config_hash = hashlib.md5(
            f"{agent_config.modelId}:{agent_config.temperature}:{agent_config.systemPrompt}".encode()
        ).hexdigest()
        
        question_hash = hashlib.md5(question.encode()).hexdigest()
        return f"{agent_config.agentId}:{question_hash}:{config_hash}"
    
    async def get_or_execute(
        self, 
        question: str,
        agent_config: AgentConfig,
        executor_func
    ) -> Dict[str, Any]:
        """キャッシュから取得、なければ実行してキャッシュ"""
        cache_key = self._generate_cache_key(question, agent_config)
        
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.ttl_seconds:
                return cached_result
        
        # キャッシュミス → 実行
        result = await executor_func()
        self.cache[cache_key] = (result, time.time())
        
        return result
```

### 3. Resource Management
- **Connection Pooling**: Bedrock APIの接続プール
- **Memory Management**: 大きなレスポンスの効率的処理
- **Timeout Management**: 適切なタイムアウト設定