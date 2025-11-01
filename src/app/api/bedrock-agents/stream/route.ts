/**
 * Bedrock Agents Streaming API Route
 * 
 * Server-Sent Events (SSE)を使用してエージェントの応答をストリーミング配信します。
 * 各エージェントの思考プロセスと回答をリアルタイムで送信することで、
 * ユーザーに優れた体験を提供します。
 * 
 * エンドポイント: GET /api/bedrock-agents/stream
 * 
 * クエリパラメータ:
 * - question: ユーザーの質問
 * - conversationId: 会話ID
 * 
 * レスポンス形式: Server-Sent Events (text/event-stream)
 */

import { NextRequest } from 'next/server';

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
 * GET /api/bedrock-agents/stream
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const question = searchParams.get('question');
  const conversationId = searchParams.get('conversationId');

  if (!question || !conversationId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // Server-Sent Eventsストリームを作成
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
    },
  });
}
