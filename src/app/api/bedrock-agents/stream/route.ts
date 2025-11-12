/**
 * Bedrock Agents Streaming API Route
 *
 * Server-Sent Events (SSE)を使用してエージェントの応答をストリーミング配信します。
 * Lambda Response Streamingを使用して、Bedrock AgentCoreからの応答を
 * リアルタイムで転送します。
 *
 * エンドポイント: GET /api/bedrock-agents/stream
 *
 * クエリパラメータ:
 * - question: ユーザーの質問
 * - conversationId: 会話ID
 *
 * レスポンス形式: Server-Sent Events (text/event-stream)
 *
 * アーキテクチャ:
 * 1. 開発環境: モックデータでストリーミング
 * 2. 本番環境: Lambda関数URLを使用してストリーミング
 */

import { NextRequest } from 'next/server';
import type { BackendRequestPayload } from '@/types/backend-request';

/**
 * ストリーミングイベントの送信
 */
function sendEvent(controller: ReadableStreamDefaultController, event: any) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
}

/**
 * エージェント実行のシミュレーション（ストリーミング版）
 * 
 * Phase 3で実際のBedrock AgentCore統合に置き換え
 */
async function* streamAgentExecution(question: string) {
  const agents = [
    { id: 'melchior', name: 'MELCHIOR', type: 'バランス型' },
    { id: 'caspar', name: 'CASPAR', type: '保守型' },
    { id: 'balthasar', name: 'BALTHASAR', type: '革新型' }
  ];

  // 各エージェントを順次実行
  for (const agent of agents) {
    // エージェント開始
    yield {
      type: 'agent_start',
      agentId: agent.id,
      data: { name: agent.name, type: agent.type }
    };

    await new Promise(resolve => setTimeout(resolve, 300));

    // 思考プロセス（4ステップ）
    const thinkingSteps = [
      '質問の解析',
      '情報収集',
      '分析と評価',
      '結論の導出'
    ];

    for (const step of thinkingSteps) {
      yield {
        type: 'agent_thinking',
        agentId: agent.id,
        data: { text: `${step}を実行中...\n` }
      };
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 回答のストリーミング
    const response = getAgentResponse(agent.id, question);
    const words = response.content.split('');
    
    for (const word of words) {
      yield {
        type: 'agent_chunk',
        agentId: agent.id,
        data: { text: word }
      };
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // エージェント完了
    yield {
      type: 'agent_complete',
      agentId: agent.id,
      data: {
        decision: response.decision,
        confidence: response.confidence,
        executionTime: response.executionTime
      }
    };

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // SOLOMON Judge開始
  yield {
    type: 'judge_start',
    data: { name: 'SOLOMON JUDGE' }
  };

  await new Promise(resolve => setTimeout(resolve, 300));

  // SOLOMON Judgeの回答ストリーミング
  const judgeSummary = '3賢者の判断を総合すると、適切な準備により実行可能です。';
  const judgeWords = judgeSummary.split('');
  
  for (const word of judgeWords) {
    yield {
      type: 'judge_chunk',
      data: { text: word }
    };
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  // SOLOMON Judge完了
  yield {
    type: 'judge_complete',
    data: {
      finalDecision: 'APPROVED',
      votingResult: { approved: 2, rejected: 1, abstained: 0 },
      scores: [
        { agentId: 'caspar', score: 75, reasoning: '慎重で現実的な分析' },
        { agentId: 'balthasar', score: 88, reasoning: '創造的で前向きな提案' },
        { agentId: 'melchior', score: 82, reasoning: 'バランスの取れた科学的判断' }
      ],
      finalRecommendation: '段階的実装によるリスク管理を推奨',
      reasoning: '多数決により可決。ただし、CASPARの懸念を考慮した慎重な実行が必要',
      confidence: 0.85
    }
  };

  // 全体完了
  yield {
    type: 'complete',
    data: { message: 'All agents completed successfully' }
  };
}

/**
 * エージェント応答の取得（モック）
 */
function getAgentResponse(agentId: string, question: string) {
  const responses: Record<string, any> = {
    melchior: {
      content: 'データを総合的に分析した結果、適切な準備と段階的実装により成功可能と判断します。',
      decision: 'APPROVED',
      confidence: 0.82,
      executionTime: 1450
    },
    caspar: {
      content: '慎重な検討が必要です。過去の事例を分析すると、このような急進的な変更は予期しない問題を引き起こす可能性があります。',
      decision: 'REJECTED',
      confidence: 0.85,
      executionTime: 1200
    },
    balthasar: {
      content: '革新的で素晴らしいアイデアです！新しい可能性を切り開く挑戦として、積極的に取り組むべきです。',
      decision: 'APPROVED',
      confidence: 0.92,
      executionTime: 980
    }
  };

  return responses[agentId] || responses.melchior;
}

/**
 * OPTIONS /api/bedrock-agents/stream - CORS プリフライトリクエスト対応
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * POST /api/bedrock-agents/stream
 * 
 * エージェント設定を含むリクエストボディを受け取る
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, conversationId, agentConfigs } = body;

    if (!question || !conversationId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    console.log('POST /api/bedrock-agents/stream', {
      question: question.substring(0, 50),
      conversationId,
      hasAgentConfigs: !!agentConfigs,
    });

    return await handleStreamRequest(question, conversationId, agentConfigs);
  } catch (error) {
    console.error('POST request error:', error);
    return new Response('Invalid request body', { status: 400 });
  }
}

/**
 * GET /api/bedrock-agents/stream (後方互換性のため維持)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const question = searchParams.get('question');
  const conversationId = searchParams.get('conversationId');

  if (!question || !conversationId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  console.log('GET /api/bedrock-agents/stream', {
    question: question.substring(0, 50),
    conversationId,
  });

  return await handleStreamRequest(question, conversationId);
}

/**
 * ストリーミングリクエストの共通処理
 */
async function handleStreamRequest(
  question: string,
  conversationId: string,
  agentConfigs?: any
) {

  // 本番環境: Python Lambda関数URLを使用
  const lambdaUrl = process.env.MAGI_PYTHON_AGENTS_LAMBDA_URL || process.env.BEDROCK_STREAMING_LAMBDA_URL;
  
  if (lambdaUrl && process.env.NODE_ENV === 'production') {
    try {
      console.log('Using Lambda Function URL for streaming', {
        hasAgentConfigs: !!agentConfigs,
      });

      // フロントエンド形式からバックエンド形式への変換
      const backendPayload: BackendRequestPayload = {
        question,
        conversationId,
      };

      if (agentConfigs) {
        // custom_prompts: システムプロンプト辞書
        backendPayload.custom_prompts = {
          caspar: agentConfigs.caspar?.systemPrompt,
          balthasar: agentConfigs.balthasar?.systemPrompt,
          melchior: agentConfigs.melchior?.systemPrompt,
          solomon: agentConfigs.solomon?.systemPrompt,
        };

        // model_configs: モデルID辞書
        backendPayload.model_configs = {
          caspar: agentConfigs.caspar?.model,
          balthasar: agentConfigs.balthasar?.model,
          melchior: agentConfigs.melchior?.model,
          solomon: agentConfigs.solomon?.model,
        };

        // runtime_configs: LLMパラメータ辞書
        backendPayload.runtime_configs = {
          caspar: {
            temperature: agentConfigs.caspar?.temperature,
            max_tokens: agentConfigs.caspar?.maxTokens,
            top_p: agentConfigs.caspar?.topP,
          },
          balthasar: {
            temperature: agentConfigs.balthasar?.temperature,
            max_tokens: agentConfigs.balthasar?.maxTokens,
            top_p: agentConfigs.balthasar?.topP,
          },
          melchior: {
            temperature: agentConfigs.melchior?.temperature,
            max_tokens: agentConfigs.melchior?.maxTokens,
            top_p: agentConfigs.melchior?.topP,
          },
          solomon: {
            temperature: agentConfigs.solomon?.temperature,
            max_tokens: agentConfigs.solomon?.maxTokens,
            top_p: agentConfigs.solomon?.topP,
          },
        };

        console.log('Converted agent configs:', {
          customPrompts: backendPayload.custom_prompts 
            ? Object.keys(backendPayload.custom_prompts).filter(
                k => backendPayload.custom_prompts?.[k]
              )
            : [],
          modelConfigs: backendPayload.model_configs,
          runtimeConfigs: backendPayload.runtime_configs
            ? Object.keys(backendPayload.runtime_configs).map(
                k => `${k}: temp=${backendPayload.runtime_configs?.[k]?.temperature}`
              )
            : [],
        });
      }

      // Lambda関数URLにリクエストを転送（変換後の形式で送信）
      const response = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload),
      });

      if (!response.ok) {
        throw new Error(`Lambda request failed: ${response.statusText}`);
      }

      // ストリームを直接転送
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          // CORS設定を追加
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Expose-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      console.error('Lambda streaming error:', error);
      // フォールバックとしてモックを使用
    }
  }

  // 開発環境またはフォールバック: モックデータでストリーミング
  console.log('Using mock data for streaming', {
    hasAgentConfigs: !!agentConfigs,
    models: agentConfigs ? {
      caspar: agentConfigs.caspar?.model,
      balthasar: agentConfigs.balthasar?.model,
      melchior: agentConfigs.melchior?.model,
      solomon: agentConfigs.solomon?.model,
    } : null,
  });
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // エージェント実行をストリーミング
        for await (const event of streamAgentExecution(question)) {
          sendEvent(controller, event);
        }

        // ストリームを閉じる
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        sendEvent(controller, {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        controller.close();
      }
    },
    cancel() {
      console.log('Stream cancelled by client');
    }
  });

  // SSEレスポンスを返す
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      // CORS設定を追加
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Expose-Headers': 'Content-Type',
    },
  });
}
