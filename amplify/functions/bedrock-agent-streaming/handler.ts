/**
 * Bedrock Agent Streaming Lambda Handler
 * 
 * Lambda Response Streamingを使用してエージェントの応答をリアルタイムで配信します。
 * AgentCore Runtimeからのストリーミングを即座に転送することで、
 * メモリ使用量を最小化し、ユーザー体験を大幅に改善します。
 * 
 * 学習ポイント:
 * - Lambda Response Streamingの実装
 * - Server-Sent Events (SSE)形式での配信
 * - Amazon Bedrock AgentCoreとの統合
 * - メモリ効率の良いストリーミング処理
 */

import { Context } from 'aws-lambda';

// Lambda Response Streaming用の型定義
// Note: @types/aws-lambdaにはstreamifyResponseの型定義がないため、
// 実行時にグローバルから取得します
declare const awslambda: {
  streamifyResponse: (handler: (event: any, responseStream: any, context: Context) => Promise<void>) => any;
  HttpResponseStream: {
    from: (responseStream: any, metadata: any) => any;
  };
};

/**
 * ストリーミングイベントの型定義
 */
interface StreamEvent {
  type: 'agent_start' | 'agent_thinking' | 'agent_chunk' | 'agent_complete' | 
        'judge_start' | 'judge_chunk' | 'judge_complete' | 'error' | 'complete';
  agentId?: string;
  data?: any;
  error?: string;
}

/**
 * SSEイベントの送信
 */
function sendEvent(httpStream: any, event: StreamEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  httpStream.write(data);
}

/**
 * エージェント実行のシミュレーション（ストリーミング版）
 * 
 * Phase 3で実際のBedrock AgentCore統合に置き換え
 */
async function* streamAgentExecution(question: string, httpStream: any) {
  const agents = [
    { id: 'melchior', name: 'MELCHIOR', type: 'バランス型' },
    { id: 'caspar', name: 'CASPAR', type: '保守型' },
    { id: 'balthasar', name: 'BALTHASAR', type: '革新型' }
  ];

  // 各エージェントを順次実行
  for (const agent of agents) {
    // エージェント開始
    sendEvent(httpStream, {
      type: 'agent_start',
      agentId: agent.id,
      data: { name: agent.name, type: agent.type }
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // 思考プロセス（4ステップ）
    const thinkingSteps = [
      '質問の解析',
      '情報収集',
      '分析と評価',
      '結論の導出'
    ];

    for (const step of thinkingSteps) {
      sendEvent(httpStream, {
        type: 'agent_thinking',
        agentId: agent.id,
        data: { text: `${step}を実行中...\n` }
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 回答のストリーミング（文字単位から単語単位に変更）
    const response = getAgentResponse(agent.id, question);
    const words = response.content.split('');
    
    // 2-5文字ずつまとめて送信（チャンクサイズを大きく）
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join('');
      sendEvent(httpStream, {
        type: 'agent_chunk',
        agentId: agent.id,
        data: { text: chunk }
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // エージェント完了
    sendEvent(httpStream, {
      type: 'agent_complete',
      agentId: agent.id,
      data: {
        decision: response.decision,
        confidence: response.confidence,
        executionTime: response.executionTime
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // SOLOMON Judge開始
  sendEvent(httpStream, {
    type: 'judge_start',
    data: { name: 'SOLOMON JUDGE' }
  });

  await new Promise(resolve => setTimeout(resolve, 300));

  // SOLOMON Judgeの回答ストリーミング（単語単位に変更）
  const judgeSummary = '3賢者の判断を総合すると、適切な準備により実行可能です。';
  const judgeWords = judgeSummary.split('');
  
  // 3-5文字ずつまとめて送信
  for (let i = 0; i < judgeWords.length; i += 4) {
    const chunk = judgeWords.slice(i, i + 4).join('');
    sendEvent(httpStream, {
      type: 'judge_chunk',
      data: { text: chunk }
    });
    await new Promise(resolve => setTimeout(resolve, 80));
  }

  // SOLOMON Judge完了
  sendEvent(httpStream, {
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
  });

  // 全体完了
  sendEvent(httpStream, {
    type: 'complete',
    data: { message: 'All agents completed successfully' }
  });
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
 * Lambda Response Streaming Handler
 * 
 * awslambda.streamifyResponse()を使用してストリーミングレスポンスを実装
 */
export const handler = awslambda.streamifyResponse(
  async (event: any, responseStream: any, context: Context) => {
    let httpStream: any;
    
    try {
      console.log('Streaming Lambda: Raw event', JSON.stringify(event));
      
      // 1) メタデータ付きのHttpResponseStreamに変換
      const metadata = {
        statusCode: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      };
      
      httpStream = awslambda.HttpResponseStream.from(responseStream, metadata);
      
      // 2) 最初のバイトを早めに送る（フラッシュ用）
      const padding = ' '.repeat(256);
      httpStream.write(`: open ${padding}\n\n`);
      
      // リクエストボディの解析
      let body: any;
      if (typeof event.body === 'string') {
        try {
          // エスケープされたJSONを処理
          const cleanBody = event.body.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
          body = JSON.parse(cleanBody);
        } catch (e) {
          console.error('Failed to parse body:', e, 'Raw body:', event.body);
          // フォールバック: イベント全体から取得
          body = {
            question: event.question || 'テスト質問',
            conversationId: event.conversationId || 'test'
          };
        }
      } else {
        body = event.body || event;
      }
      
      const question = body.question || body.message || 'テスト質問';
      
      console.log('Streaming Lambda: Request received', {
        question: question.substring(0, 100),
        conversationId: body.conversationId,
        timestamp: new Date().toISOString()
      });

      // 3) エージェント実行をストリーミング
      await streamAgentExecution(question, httpStream);

      // 4) ストリームを閉じる
      httpStream.end();

    } catch (error) {
      console.error('Streaming Lambda Error:', error);
      
      // エラーイベントを送信（httpStreamが初期化されていない場合はresponseStreamを使用）
      const stream = httpStream || responseStream;
      const errorData = `data: ${JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })}\n\n`;
      
      stream.write(errorData);
      stream.end();
    }
  }
);

/**
 * 将来の実装予定（Phase 3-4）:
 * 
 * 1. Amazon Bedrock AgentCore統合
 *    - BedrockAgentRuntimeClient の初期化
 *    - InvokeAgent API のストリーミング呼び出し
 *    - チャンクの即座転送
 * 
 * 2. 実際のストリーミング実装例:
 * ```typescript
 * import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
 * 
 * const client = new BedrockAgentRuntimeClient({ region: 'ap-northeast-1' });
 * 
 * const command = new InvokeAgentCommand({
 *   agentId: process.env.AGENT_ID,
 *   agentAliasId: process.env.AGENT_ALIAS_ID,
 *   sessionId: body.sessionId,
 *   inputText: question
 * });
 * 
 * const response = await client.send(command);
 * 
 * for await (const chunk of response.completion) {
 *   if (chunk.chunk?.bytes) {
 *     const text = new TextDecoder().decode(chunk.chunk.bytes);
 *     sendEvent(responseStream, {
 *       type: 'agent_chunk',
 *       agentId: currentAgent,
 *       data: { text }
 *     });
 *   }
 * }
 * ```
 * 
 * 3. OpenTelemetryトレーシング
 *    - ストリーミング中のトレース記録
 *    - パフォーマンスメトリクス収集
 * 
 * 4. エラーハンドリング強化
 *    - ストリーム中断時の適切な処理
 *    - リトライロジック
 */
