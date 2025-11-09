/**
 * MAGI Decision System - ストリーミングAPI Route
 *
 * このファイルはMAGIシステムのストリーミング対応APIエンドポイントです。
 * AgentCore Runtimeとの統合により、リアルタイムエージェント応答を実現します。
 *
 * 主要機能:
 * - Server-Sent Eventsによるストリーミングレスポンス
 * - AgentCore Runtime統合
 * - 認証・権限チェック
 * - エラーハンドリングとフォールバック
 *
 * 学習ポイント:
 * - Next.js API Routesでのストリーミング実装
 * - AgentCore Runtime呼び出し
 * - Server-Sent Eventsプロトコル
 *
 * アーキテクチャ:
 * Next.js API Route → AgentCore Runtime (port 8080) → magi_agent.py → Bedrock
 *
 * 参考: https://qiita.com/moritalous/items/ea695f8a328585e1313b
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { validateRequestBody } from '@/lib/security/request-validator';

/**
 * AgentCore Runtime URL設定
 *
 * 環境別URL:
 * - ローカル開発: http://localhost:8080
 * - Amplify Hosting: https://your-app.amplifyapp.com (環境変数で設定)
 */
const AGENTCORE_URL = process.env.AGENTCORE_URL || 'http://localhost:8080';

/**
 * AgentCore Runtime経由でMAGI Agentを呼び出し
 *
 * アーキテクチャ:
 * API Route → AgentCore Runtime /invocations → Python magi_agent.py
 */
async function invokeMAGIAgentCore(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  question: string,
  sessionId?: string
) {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendMessage = (type: string, content: string, agentId?: string) => {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({
        type,
        content,
        agentId,
        timestamp: new Date().toISOString()
      })}\n\n`)
    );
  };

  try {
    // Phase 1: システム初期化
    sendMessage('phase', 'MAGI System Initialization...');
    await delay(500);

    sendMessage('system', 'AgentCore Runtime: 接続中...');
    await delay(300);

    sendMessage('system', 'AgentCore Runtime: MAGI Agent起動中...');
    await delay(700);

    // Phase 2: AgentCore Runtime呼び出し
    sendMessage('phase', 'AgentCore Runtime Execution');
    await delay(400);

    sendMessage('system', `質問をAgentCore Runtimeに送信: "${question}"`);
    await delay(600);

    sendMessage('system', 'AgentCore Runtime経由でMAGI Agentを呼び出し中...');
    await delay(500);

    try {
      // AgentCore Runtime /invocations エンドポイント呼び出し
      const agentcorePayload = {
        question: question,
        sessionId: sessionId || `session-${Date.now()}`,
      };

      sendMessage('system', 'AgentCore Runtime実行中...');
      await delay(300);

      const agentcoreResponse = await fetch(`${AGENTCORE_URL}/invocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentcorePayload),
      });

      if (!agentcoreResponse.ok) {
        throw new Error(`AgentCore Runtime returned status ${agentcoreResponse.status}`);
      }

      sendMessage('system', 'AgentCore Runtimeからレスポンス受信');
      await delay(300);

      // レスポンスの解析
      const responseBody = await agentcoreResponse.json();

      sendMessage('system', 'AgentCore Runtime実行完了');
      await delay(400);

      // Phase 3: レスポンス処理
      sendMessage('phase', 'Processing MAGI Response');
      await delay(300);

      // AgentCore Runtimeからの構造化レスポンスを表示
      if (responseBody.success && responseBody.response) {
        const magiResponse = responseBody.response;

        // レスポンスが文字列の場合はパース
        let parsedResponse;
        if (typeof magiResponse === 'string') {
          try {
            parsedResponse = JSON.parse(magiResponse);
          } catch (e) {
            parsedResponse = null;
          }
        } else {
          parsedResponse = magiResponse;
        }

        // 構造化されたMAGI応答を表示
        if (parsedResponse && parsedResponse.body) {
          await displayStructuredMAGIResponse(parsedResponse.body, sendMessage, delay);
        } else if (responseBody.fullResponse) {
          try {
            const fullParsed = JSON.parse(responseBody.fullResponse);
            if (fullParsed.body) {
              await displayStructuredMAGIResponse(fullParsed.body, sendMessage, delay);
            }
          } catch (e) {
            sendMessage('system', 'AgentCore Runtime実行完了（レスポンス形式が異なります）');
            sendMessage('agent_chunk', responseBody.fullResponse || JSON.stringify(responseBody.response));
          }
        }
      } else {
        throw new Error('Invalid response format from AgentCore Runtime');
      }

    } catch (agentcoreError) {
      console.error('AgentCore Runtime invocation failed:', agentcoreError);

      sendMessage('error', 'AgentCore Runtimeの呼び出しに失敗しました');
      await delay(300);

      const errorMessage = agentcoreError instanceof Error ? agentcoreError.message : 'Unknown error';
      sendMessage('error', `エラー詳細: ${errorMessage}`);
      await delay(300);

      // 開発環境でのみフォールバック
      if (process.env.NODE_ENV !== 'production') {
        sendMessage('system', '開発環境: フォールバックモードで継続します');
        await delay(500);
        await sendDevelopmentFallback(controller, encoder, question);
        return;
      }

      sendMessage('error', '本番環境ではフォールバックは利用できません。システム管理者に連絡してください。');
      throw new Error(`AgentCore Runtime invocation failed: ${errorMessage}`);
    }

    // Phase 5: 完了
    sendMessage('phase', 'MAGI Decision Complete');
    await delay(300);

    sendMessage('complete', 'MAGI Decision System: 実際のAI分析が完了しました。');

  } catch (error) {
    console.error('AgentCore Runtime error:', error);

    try {
      sendMessage('error', `AgentCore Runtime error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } catch (controllerError) {
      console.error('Controller error:', controllerError);
    }
  } finally {
    try {
      controller.close();
    } catch (closeError) {
      console.error('Controller close error:', closeError);
    }
  }
}

/**
 * 構造化されたMAGI応答の表示
 */
async function displayStructuredMAGIResponse(
  responseBody: any,
  sendMessage: (type: string, content: string, agentId?: string) => void,
  delay: (ms: number) => Promise<unknown>
) {
  sendMessage('phase', 'MAGI Decision Results');
  await delay(400);

  // 各エージェントの結果を段階的に表示
  if (responseBody.agent_responses) {
    sendMessage('system', '3賢者の判断結果:');
    await delay(300);

    for (const agentResponse of responseBody.agent_responses) {
      const agentName = agentResponse.agent_id.toUpperCase();
      const decision = agentResponse.decision;
      const confidence = (agentResponse.confidence * 100).toFixed(0);

      sendMessage('agent_complete',
        `${agentName}: ${decision} (確信度: ${confidence}%)`,
        agentResponse.agent_id.toLowerCase()
      );
      await delay(400);

      sendMessage('agent_chunk',
        `理由: ${agentResponse.reasoning}`,
        agentResponse.agent_id.toLowerCase()
      );
      await delay(300);
    }
  }

  // SOLOMON Judgeの最終判断
  sendMessage('phase', 'SOLOMON Judge Final Decision');
  await delay(500);

  sendMessage('judge_thinking', 'SOLOMON Judge: 統合評価完了');
  await delay(400);

  sendMessage('judge_chunk', `【最終判断】: ${responseBody.final_decision}`);
  await delay(400);

  sendMessage('judge_chunk', `【投票結果】: 可決${responseBody.voting_result.approved}票 / 否決${responseBody.voting_result.rejected}票`);
  await delay(400);

  sendMessage('judge_chunk', `【統合評価】: ${responseBody.summary}`);
  await delay(400);

  sendMessage('judge_chunk', `【推奨事項】: ${responseBody.recommendation}`);
  await delay(400);

  sendMessage('judge_chunk', `【確信度】: ${(responseBody.confidence * 100).toFixed(0)}%`);
  await delay(400);

  sendMessage('judge_chunk', `【実行時間】: ${responseBody.execution_time}ms`);
  await delay(300);
}

/**
 * 開発環境用のフォールバックレスポンス
 */
async function sendDevelopmentFallback(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  question: string
) {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendMessage = (type: string, content: string, agentId?: string) => {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({
        type,
        content,
        agentId,
        timestamp: new Date().toISOString()
      })}\n\n`)
    );
  };

  try {
    sendMessage('phase', 'MAGI System Initialization...');
    await delay(800);

    sendMessage('system', 'SOLOMON Judge: システム起動中...');
    await delay(500);

    sendMessage('system', 'SOLOMON Judge: 3賢者エージェント初期化中...');
    await delay(700);

    sendMessage('phase', 'Question Analysis Phase');
    await delay(400);

    sendMessage('system', `SOLOMON Judge: 質問を分析しています - "${question}"`);
    await delay(600);

    sendMessage('system', 'SOLOMON Judge: 3賢者への並列実行を開始します...');
    await delay(500);

    sendMessage('phase', '3 Wise Men Parallel Execution');
    await delay(300);

    // CASPAR
    sendMessage('agent_start', 'CASPAR（保守的視点）: 分析を開始します...', 'caspar');
    await delay(400);
    sendMessage('agent_thinking', 'CASPAR: 実用性の観点から検討中...', 'caspar');
    await delay(800);
    sendMessage('agent_chunk', 'CASPAR: 【保守的・現実的視点】\n\n', 'caspar');
    await delay(400);
    sendMessage('agent_chunk', 'この問題について、実用性と安全性を重視した分析を行います。\n\n', 'caspar');
    await delay(600);
    sendMessage('agent_chunk', '現実的な制約を考慮すると、段階的なアプローチが最も適切です。', 'caspar');
    await delay(500);
    sendMessage('agent_complete', 'CASPAR: 分析完了 - 慎重なアプローチを推奨', 'caspar');
    await delay(700);

    // BALTHASAR
    sendMessage('agent_start', 'BALTHASAR（革新的視点）: 分析を開始します...', 'balthasar');
    await delay(300);
    sendMessage('agent_thinking', 'BALTHASAR: 倫理的側面を検討中...', 'balthasar');
    await delay(900);
    sendMessage('agent_chunk', 'BALTHASAR: 【革新的・感情的視点】\n\n', 'balthasar');
    await delay(400);
    sendMessage('agent_chunk', '創造性と倫理的側面を重視した分析を行います。\n\n', 'balthasar');
    await delay(700);
    sendMessage('agent_chunk', '革新的なアプローチにより、新たな可能性を探求すべきです。', 'balthasar');
    await delay(500);
    sendMessage('agent_complete', 'BALTHASAR: 分析完了 - 革新的アプローチを推奨', 'balthasar');
    await delay(600);

    // MELCHIOR
    sendMessage('agent_start', 'MELCHIOR（バランス型視点）: 分析を開始します...', 'melchior');
    await delay(300);
    sendMessage('agent_thinking', 'MELCHIOR: データ分析中...', 'melchior');
    await delay(800);
    sendMessage('agent_chunk', 'MELCHIOR: 【バランス型・科学的視点】\n\n', 'melchior');
    await delay(400);
    sendMessage('agent_chunk', 'データと論理に基づいた総合的な分析を行います。\n\n', 'melchior');
    await delay(600);
    sendMessage('agent_chunk', '統計的データと論理的推論により、バランスの取れた解決策を提案します。', 'melchior');
    await delay(500);
    sendMessage('agent_complete', 'MELCHIOR: 分析完了 - バランス型アプローチを推奨', 'melchior');
    await delay(800);

    // SOLOMON Judge
    sendMessage('phase', 'SOLOMON Judge Integration Phase');
    await delay(500);
    sendMessage('judge_thinking', 'SOLOMON Judge: 3賢者の判断を統合中...');
    await delay(1000);
    sendMessage('judge_chunk', 'SOLOMON Judge: 【統合評価】\n\n');
    await delay(400);
    sendMessage('judge_chunk', '3賢者の多様な視点を総合的に評価した結果：\n\n');
    await delay(600);
    sendMessage('judge_chunk', '• CASPAR（保守的）: 慎重なアプローチを推奨\n');
    await delay(300);
    sendMessage('judge_chunk', '• BALTHASAR（革新的）: 革新的アプローチを推奨\n');
    await delay(300);
    sendMessage('judge_chunk', '• MELCHIOR（バランス型）: バランス型アプローチを推奨\n\n');
    await delay(500);
    sendMessage('judge_chunk', '最終判断: 段階的な革新アプローチを採用し、');
    await delay(400);
    sendMessage('judge_chunk', 'リスク管理を行いながら創造的解決策を実装することを推奨します。');
    await delay(600);

    sendMessage('phase', 'MAGI Decision Complete');
    await delay(300);
    sendMessage('complete', 'MAGI Decision System: 全ての分析が完了しました。');
    await delay(200);
    sendMessage('note', '※ 現在はモックモードで動作しています。AgentCore Runtime (AGENTCORE_URL) への接続を確認してください。');

  } catch (error) {
    sendMessage('error', `Streaming simulation error: ${error}`);
  } finally {
    controller.close();
  }
}

/**
 * MAGI Decision System ストリーミングエンドポイント
 *
 * @param request - ユーザーの質問を含むPOSTリクエスト
 * @returns ReadableStream - Server-Sent Eventsストリーム
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック（本番環境では必須）
    if (process.env.NODE_ENV === 'production' && !process.env.SKIP_AUTH_CHECK) {
      return NextResponse.json(
        {
          error: 'Authentication Required',
          message: '本番環境では認証が必要です。Amplify Auth統合を完了してください。'
        },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️ Development mode: Authentication bypassed');
    }

    // リクエストボディの解析
    const body = await request.json();
    const { question, sessionId } = body;

    // リクエストの検証
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation Error', message: validation.error },
        { status: 400 }
      );
    }

    // レート制限チェック
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const rateLimit = checkRateLimit(clientIp, 10, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: 'リクエスト制限を超えました。しばらく待ってから再試行してください。',
          resetTime: new Date(rateLimit.resetTime).toISOString()
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    // Server-Sent Eventsストリーム作成
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'start',
              message: 'MAGI Decision System starting...',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          console.log(`🚀 Calling AgentCore Runtime at ${AGENTCORE_URL}`);
          await invokeMAGIAgentCore(controller, encoder, question, sessionId);

        } catch (error) {
          console.error('AgentCore Runtime error:', error);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    // Server-Sent Eventsレスポンス
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('API Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * CORS対応のためのOPTIONSハンドラー
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
