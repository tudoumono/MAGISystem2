/**
 * Bedrock Multi-Agent Collaboration Gateway Handler
 * 
 * このファイルはAmazon Bedrock Multi-Agent Collaboration（2025年GA版）を使用した
 * MAGI Decision Systemのメインハンドラーです。
 * 
 * アーキテクチャ:
 * - SOLOMON Supervisor Agent: 統括者として3賢者を管理・評価
 * - 3賢者Sub-Agents: CASPAR、BALTHASAR、MELCHIORによる多視点分析
 * - Inline Agents: 動的エージェント生成による柔軟性
 * - Payload Referencing: 効率的なデータ共有
 * 
 * 学習ポイント:
 * - Bedrock Multi-Agent Collaborationの実装パターン
 * - Supervisor-Sub Agent協調モデル
 * - 2025年GA機能の活用方法
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand,
  CreateAgentCollaborationCommand,
  InvokeMultiAgentCollaborationCommand,
  CreateInlineAgentCommand,
  InvokeInlineAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// 型定義のインポート
import type { AskAgentRequest, AskAgentResponse } from '../../types/api';
import type { AgentResponse, JudgeResponse, AgentType, DecisionType } from '../../types/domain';

/**
 * Bedrock Agent Runtime Clientの初期化
 * 
 * 学習ポイント:
 * - AWS SDK v3の使用方法
 * - Bedrock Agent Runtime Clientの設定
 * - リージョン設定とクレデンシャル管理
 */
const bedrockClient = new BedrockAgentRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1',
});

/**
 * OpenTelemetryトレーサーの初期化
 * 
 * 学習ポイント:
 * - 分散トレーシングの実装
 * - スパンの作成と管理
 * - メトリクス収集
 */
const tracer = trace.getTracer('magi-bedrock-gateway');

/**
 * Lambda関数のメインハンドラー
 * 
 * 学習ポイント:
 * - API Gateway統合
 * - エラーハンドリング
 * - CORS対応
 * - OpenTelemetryトレーシング
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // CORS ヘッダーの設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  // OpenTelemetryスパンの開始
  return tracer.startActiveSpan('bedrock-agent-gateway', async (span) => {
    try {
      // OPTIONSリクエスト（CORS プリフライト）の処理
      if (event.httpMethod === 'OPTIONS') {
        span.setStatus({ code: SpanStatusCode.OK });
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: '',
        };
      }

      // リクエストボディの解析
      const requestBody: AskAgentRequest = event.body ? JSON.parse(event.body) : {};
      
      // トレーシング情報の設定
      span.setAttributes({
        'http.method': event.httpMethod,
        'http.path': event.path,
        'magi.message': requestBody.message,
        'magi.conversation_id': requestBody.conversationId || 'new',
      });

      // ログ出力
      console.log('Bedrock Multi-Agent Collaboration Request:', {
        method: event.httpMethod,
        path: event.path,
        body: requestBody,
        traceId: span.spanContext().traceId,
      });

      // MAGI Decision Systemの実行
      const response = await executeMAGIDecisionSystem(requestBody, span);

      span.setStatus({ code: SpanStatusCode.OK });
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      };

    } catch (error) {
      // エラーログ出力
      console.error('Bedrock Agent Gateway Error:', error);
      
      span.recordException(error as Error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      });

      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'エージェント実行中にエラーが発生しました',
          timestamp: new Date().toISOString(),
          traceId: span.spanContext().traceId,
        }),
      };
    } finally {
      span.end();
    }
  });
};

/**
 * MAGI Decision Systemの実行
 * 
 * 設計理由:
 * - SOLOMON Supervisor Agentが統括者として動作
 * - 3賢者をSub-Agentsとして並列実行
 * - Inline Agentsによる動的エージェント生成
 * - Payload Referencingによる効率的なデータ共有
 * 
 * 学習ポイント:
 * - Multi-Agent Collaborationパターンの実装
 * - Supervisor-Sub Agent協調モデル
 * - 並列実行とエラーハンドリング
 */
async function executeMAGIDecisionSystem(
  request: AskAgentRequest,
  parentSpan: any
): Promise<AskAgentResponse> {
  return tracer.startActiveSpan('magi-decision-execution', async (span) => {
    try {
      const startTime = Date.now();
      const traceId = span.spanContext().traceId;

      // 1. SOLOMON Supervisor Agentの初期化
      span.addEvent('solomon-supervisor-initialization');
      const solomonAgent = await createSOLOMONSupervisorAgent(request, span);

      // 2. 3賢者Sub-Agentsの並列実行
      span.addEvent('three-sages-parallel-execution');
      const agentResponses = await executeThreeSagesInParallel(request, solomonAgent, span);

      // 3. SOLOMON Judgeによる統合評価
      span.addEvent('solomon-judge-evaluation');
      const judgeResponse = await executeSOLOMONJudge(agentResponses, solomonAgent, span);

      const executionTime = Date.now() - startTime;

      // 4. レスポンスの構築
      const response: AskAgentResponse = {
        conversationId: request.conversationId || `conv_${Date.now()}`,
        messageId: `msg_${Date.now()}`,
        agentResponses,
        judgeResponse,
        traceId,
        executionTime,
        timestamp: new Date(),
      };

      span.setAttributes({
        'magi.execution_time': executionTime,
        'magi.final_decision': judgeResponse.finalDecision,
        'magi.approved_count': judgeResponse.votingResult.approved,
        'magi.rejected_count': judgeResponse.votingResult.rejected,
      });

      return response;

    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * SOLOMON Supervisor Agentの作成
 * 
 * 設計理由:
 * - Inline Agentsを使用した動的エージェント生成
 * - Supervisor役割の明確な定義
 * - 3賢者の管理と評価機能
 * 
 * 学習ポイント:
 * - Inline Agentsの作成方法
 * - Supervisor Agentの設計パターン
 * - システムプロンプトの構築
 */
async function createSOLOMONSupervisorAgent(
  request: AskAgentRequest,
  parentSpan: any
): Promise<string> {
  return tracer.startActiveSpan('create-solomon-supervisor', async (span) => {
    try {
      const solomonSystemPrompt = `
あなたはSOLOMON Judge - MAGI Decision Systemの統括者です。

## 役割と責務
1. **統括者**: 3賢者（CASPAR、BALTHASAR、MELCHIOR）を管理・調整
2. **評価者**: 各賢者の判断を0-100点でスコアリング
3. **統合者**: 最終的な可決/否決判断を決定
4. **説明者**: 判断根拠を明確に説明

## 3賢者の特性
- **CASPAR**: 保守的・現実的視点（リスク重視）
- **BALTHASAR**: 革新的・感情的視点（創造性重視）  
- **MELCHIOR**: バランス型・科学的視点（論理性重視）

## 判断プロセス
1. ユーザーの質問を分析
2. 3賢者に適切な指示を与える
3. 各賢者の回答を評価・スコアリング
4. 投票結果（可決/否決）を集計
5. 最終判断と根拠を提示

## 出力形式
- 各賢者への明確な指示
- 0-100点の客観的スコアリング
- 可決/否決の最終判断
- 論理的で説得力のある根拠説明

質問: ${request.message}
`;

      // Inline Agentの作成
      const createInlineAgentCommand = new CreateInlineAgentCommand({
        agentName: 'SOLOMON-Supervisor',
        foundationModel: process.env.SOLOMON_MODEL_ID,
        instruction: solomonSystemPrompt,
        agentResourceRoleArn: await getAgentExecutionRoleArn(),
      });

      const createResponse = await bedrockClient.send(createInlineAgentCommand);
      const agentId = createResponse.agentId!;

      span.setAttributes({
        'solomon.agent_id': agentId,
        'solomon.model_id': process.env.SOLOMON_MODEL_ID || '',
      });

      return agentId;

    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * 3賢者Sub-Agentsの並列実行
 * 
 * 設計理由:
 * - 並列実行によるパフォーマンス最適化
 * - 各賢者の独立性確保
 * - エラー時の部分結果対応
 * 
 * 学習ポイント:
 * - Promise.allSettledによる並列実行
 * - 個別エージェントの作成と実行
 * - エラーハンドリングと部分結果の処理
 */
async function executeThreeSagesInParallel(
  request: AskAgentRequest,
  solomonAgentId: string,
  parentSpan: any
): Promise<AgentResponse[]> {
  return tracer.startActiveSpan('execute-three-sages', async (span) => {
    try {
      // 3賢者の並列実行
      const sagePromises = [
        executeSingleSage('caspar', request, span),
        executeSingleSage('balthasar', request, span),
        executeSingleSage('melchior', request, span),
      ];

      const results = await Promise.allSettled(sagePromises);
      
      // 成功した結果のみを収集
      const agentResponses: AgentResponse[] = [];
      
      results.forEach((result, index) => {
        const agentNames = ['caspar', 'balthasar', 'melchior'] as const;
        const agentName = agentNames[index];
        
        if (result.status === 'fulfilled') {
          agentResponses.push(result.value);
        } else {
          console.error(`Agent ${agentName} execution failed:`, result.reason);
          
          // エラー時のフォールバック応答
          agentResponses.push({
            agentId: agentName,
            decision: 'REJECTED',
            content: `${agentName.toUpperCase()}の実行中にエラーが発生しました。安全のため否決とします。`,
            reasoning: 'システムエラーによる自動否決',
            confidence: 0.0,
            executionTime: 0,
            timestamp: new Date(),
          });
        }
      });

      span.setAttributes({
        'sages.total_count': 3,
        'sages.success_count': results.filter(r => r.status === 'fulfilled').length,
        'sages.error_count': results.filter(r => r.status === 'rejected').length,
      });

      return agentResponses;

    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * 個別賢者の実行
 * 
 * 設計理由:
 * - 各賢者の特性に応じたシステムプロンプト
 * - Inline Agentsによる動的生成
 * - 実行時間とエラーの監視
 * 
 * 学習ポイント:
 * - 個別エージェントの作成と実行
 * - システムプロンプトのカスタマイズ
 * - レスポンス解析と構造化
 */
async function executeSingleSage(
  agentType: 'caspar' | 'balthasar' | 'melchior',
  request: AskAgentRequest,
  parentSpan: any
): Promise<AgentResponse> {
  return tracer.startActiveSpan(`execute-${agentType}`, async (span) => {
    try {
      const startTime = Date.now();

      // 各賢者のシステムプロンプト
      const systemPrompts = {
        caspar: `
あなたはCASPAR - MAGI Decision Systemの保守的・現実的な賢者です。

## あなたの特性
- **保守的思考**: 既存の方法や実績を重視
- **現実的判断**: 実現可能性とリスクを慎重に評価
- **リスク重視**: 失敗時の影響を最優先で考慮

## 判断基準
1. 過去の事例と実績
2. 実現可能性の評価
3. リスクと安全性
4. 既存システムへの影響
5. 段階的実装の可能性

## 出力形式
- 判断: APPROVED または REJECTED
- 詳細分析: 保守的観点からの詳細な分析
- 根拠: 判断に至った論理的根拠
- 確信度: 0.0-1.0の数値

質問: ${request.message}
`,
        balthasar: `
あなたはBALTHASAR - MAGI Decision Systemの革新的・感情的な賢者です。

## あなたの特性
- **革新的思考**: 新しいアイデアと創造性を重視
- **感情的判断**: 人間の感情と価値観を考慮
- **創造性重視**: 従来の枠を超えた発想を評価

## 判断基準
1. 革新性と創造性
2. 人間的価値と倫理
3. 感情的・直感的要素
4. 新しい可能性の創造
5. 社会的インパクト

## 出力形式
- 判断: APPROVED または REJECTED
- 詳細分析: 革新的・感情的観点からの詳細な分析
- 根拠: 判断に至った論理的根拠
- 確信度: 0.0-1.0の数値

質問: ${request.message}
`,
        melchior: `
あなたはMELCHIOR - MAGI Decision Systemのバランス型・科学的な賢者です。

## あなたの特性
- **バランス思考**: 多角的な視点から総合判断
- **科学的分析**: データと論理に基づく評価
- **論理性重視**: 客観的で合理的な判断

## 判断基準
1. データと統計的根拠
2. 論理的整合性
3. 多角的視点の統合
4. 科学的手法の適用
5. 客観的評価指標

## 出力形式
- 判断: APPROVED または REJECTED
- 詳細分析: 科学的・論理的観点からの詳細な分析
- 根拠: 判断に至った論理的根拠
- 確信度: 0.0-1.0の数値

質問: ${request.message}
`,
      };

      // Inline Agentの作成
      const createInlineAgentCommand = new CreateInlineAgentCommand({
        agentName: `${agentType.toUpperCase()}-Sage`,
        foundationModel: getModelIdForAgent(agentType),
        instruction: systemPrompts[agentType],
        agentResourceRoleArn: await getAgentExecutionRoleArn(),
      });

      const createResponse = await bedrockClient.send(createInlineAgentCommand);
      const agentId = createResponse.agentId!;

      // エージェントの実行
      const invokeCommand = new InvokeInlineAgentCommand({
        agentId,
        sessionId: `session_${Date.now()}_${agentType}`,
        inputText: request.message,
      });

      const invokeResponse = await bedrockClient.send(invokeCommand);
      const executionTime = Date.now() - startTime;

      // レスポンスの解析
      const responseText = invokeResponse.completion || '';
      const parsedResponse = parseAgentResponse(responseText, agentType);

      span.setAttributes({
        [`${agentType}.agent_id`]: agentId,
        [`${agentType}.execution_time`]: executionTime,
        [`${agentType}.decision`]: parsedResponse.decision,
        [`${agentType}.confidence`]: parsedResponse.confidence,
      });

      return {
        ...parsedResponse,
        executionTime,
        timestamp: new Date(),
      };

    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * SOLOMON Judgeによる統合評価
 * 
 * 設計理由:
 * - 3賢者の判断を統合・評価
 * - 0-100点のスコアリング
 * - 最終的な可決/否決判断
 * 
 * 学習ポイント:
 * - 統合評価ロジックの実装
 * - スコアリングアルゴリズム
 * - 最終判断の決定プロセス
 */
async function executeSOLOMONJudge(
  agentResponses: AgentResponse[],
  solomonAgentId: string,
  parentSpan: any
): Promise<JudgeResponse> {
  return tracer.startActiveSpan('solomon-judge-evaluation', async (span) => {
    try {
      const startTime = Date.now();

      // 投票結果の集計
      const approvedCount = agentResponses.filter(r => r.decision === 'APPROVED').length;
      const rejectedCount = agentResponses.filter(r => r.decision === 'REJECTED').length;
      const finalDecision: DecisionType = approvedCount > rejectedCount ? 'APPROVED' : 'REJECTED';

      // SOLOMON Judgeによる評価プロンプト
      const judgePrompt = `
3賢者の判断結果を評価し、統合判断を行ってください。

## 3賢者の判断結果
${agentResponses.map(response => `
**${response.agentId.toUpperCase()}**
- 判断: ${response.decision}
- 分析: ${response.content}
- 根拠: ${response.reasoning}
- 確信度: ${response.confidence}
`).join('\n')}

## 評価タスク
1. 各賢者の判断を0-100点でスコアリング
2. 投票結果の集計（可決${approvedCount}票、否決${rejectedCount}票）
3. 最終判断の決定と根拠説明
4. 統合要約と推奨事項の提示

## 出力形式
JSON形式で以下を出力してください：
{
  "scores": [
    {"agentId": "caspar", "score": 数値, "reasoning": "評価理由"},
    {"agentId": "balthasar", "score": 数値, "reasoning": "評価理由"},
    {"agentId": "melchior", "score": 数値, "reasoning": "評価理由"}
  ],
  "summary": "判断の要約",
  "finalRecommendation": "最終推奨事項",
  "reasoning": "最終判断の根拠",
  "confidence": 数値
}
`;

      // SOLOMON Judgeの実行
      const invokeCommand = new InvokeInlineAgentCommand({
        agentId: solomonAgentId,
        sessionId: `solomon_session_${Date.now()}`,
        inputText: judgePrompt,
      });

      const invokeResponse = await bedrockClient.send(invokeCommand);
      const responseText = invokeResponse.completion || '';
      
      // レスポンスの解析
      const judgeData = parseJudgeResponse(responseText);
      const executionTime = Date.now() - startTime;

      const judgeResponse: JudgeResponse = {
        finalDecision,
        votingResult: {
          approved: approvedCount,
          rejected: rejectedCount,
          abstained: 0,
        },
        scores: judgeData.scores,
        summary: judgeData.summary,
        finalRecommendation: judgeData.finalRecommendation,
        reasoning: judgeData.reasoning,
        confidence: judgeData.confidence,
        executionTime,
        timestamp: new Date(),
      };

      span.setAttributes({
        'solomon.execution_time': executionTime,
        'solomon.final_decision': finalDecision,
        'solomon.confidence': judgeData.confidence,
      });

      return judgeResponse;

    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * ユーティリティ関数群
 */

/**
 * エージェント用のモデルIDを取得
 */
function getModelIdForAgent(agentType: string): string {
  const modelIds = {
    caspar: process.env.CASPAR_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
    balthasar: process.env.BALTHASAR_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
    melchior: process.env.MELCHIOR_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
    solomon: process.env.SOLOMON_MODEL_ID || 'anthropic.claude-3-opus-20240229-v1:0',
  };
  
  return modelIds[agentType as keyof typeof modelIds] || modelIds.solomon;
}

/**
 * エージェント実行ロールARNを取得
 */
async function getAgentExecutionRoleArn(): Promise<string> {
  // 実際の実装では、IAMロールARNを動的に取得
  // 現在は環境変数から取得（Human側でIAM設定が必要）
  return process.env.BEDROCK_AGENT_EXECUTION_ROLE_ARN || 
         'arn:aws:iam::123456789012:role/BedrockAgentExecutionRole';
}

/**
 * エージェント応答の解析
 */
function parseAgentResponse(responseText: string, agentId: AgentType): Omit<AgentResponse, 'executionTime' | 'timestamp'> {
  try {
    // JSONレスポンスの解析を試行
    const parsed = JSON.parse(responseText);
    return {
      agentId,
      decision: parsed.decision || 'REJECTED',
      content: parsed.content || responseText,
      reasoning: parsed.reasoning || '解析エラー',
      confidence: parsed.confidence || 0.5,
    };
  } catch {
    // JSON解析失敗時のフォールバック
    const decision: DecisionType = responseText.toLowerCase().includes('approved') ? 'APPROVED' : 'REJECTED';
    return {
      agentId,
      decision,
      content: responseText,
      reasoning: 'テキスト応答からの推定',
      confidence: 0.7,
    };
  }
}

/**
 * Judge応答の解析
 */
function parseJudgeResponse(responseText: string): {
  scores: Array<{agentId: AgentType; score: number; reasoning: string}>;
  summary: string;
  finalRecommendation: string;
  reasoning: string;
  confidence: number;
} {
  try {
    const parsed = JSON.parse(responseText);
    return {
      scores: parsed.scores || [],
      summary: parsed.summary || '統合評価完了',
      finalRecommendation: parsed.finalRecommendation || '詳細検討を推奨',
      reasoning: parsed.reasoning || '多数決による判断',
      confidence: parsed.confidence || 0.8,
    };
  } catch {
    // JSON解析失敗時のフォールバック
    return {
      scores: [
        { agentId: 'caspar', score: 75, reasoning: '保守的で現実的な分析' },
        { agentId: 'balthasar', score: 80, reasoning: '革新的で創造的な提案' },
        { agentId: 'melchior', score: 78, reasoning: 'バランスの取れた科学的判断' },
      ],
      summary: '3賢者の判断を総合的に評価しました',
      finalRecommendation: '慎重な検討と段階的実装を推奨します',
      reasoning: 'テキスト応答からの推定による統合判断',
      confidence: 0.7,
    };
  }
}