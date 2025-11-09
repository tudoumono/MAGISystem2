/**
 * MAGI Decision System - ストリーミングAPI Route
 *
 * このファイルはMAGIシステムのストリーミング対応APIエンドポイントです。
 * Amazon Bedrock AgentCore Runtime（独立デプロイ）にHTTPSリクエストを送信します。
 *
 * 主要機能:
 * - Server-Sent Eventsによるストリーミングレスポンス
 * - AgentCore RuntimeへのHTTPSリクエスト
 * - 認証・権限チェック
 * - エラーハンドリングとフォールバック
 *
 * 学習ポイント:
 * - Next.js API Routesでのストリーミング実装
 * - 外部APIとの通信
 * - Server-Sent Eventsプロトコル
 *
 * アーキテクチャ:
 * Amplify Hosting (Next.js)
 *   ↓ HTTPS POST /invocations
 * Amazon Bedrock AgentCore Runtime (独立デプロイ)
 *   ↓ AWS SDK
 * Amazon Bedrock (Claude 3.5 Sonnet)
 *
 * 参考:
 * - AgentCore Runtime: 独立したDockerコンテナとしてデプロイ
 * - エンドポイント: /invocations, /ping
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { validateRequestBody } from '@/lib/security/request-validator';

/**
 * AgentCore RuntimeへHTTPSリクエストを送信
 *
 * アーキテクチャ:
 * Next.js API Route
 *   ↓ HTTPS
 * AgentCore Runtime /invocations
 *   ↓ AWS SDK
 * Bedrock (Claude)
 */
async function invokeAgentCoreRuntime(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  question: string,
  sessionId?: string
) {
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

    // AgentCore Runtime エンドポイント URL
    const agentCoreUrl = process.env.AGENTCORE_RUNTIME_URL;

    if (!agentCoreUrl) {
      throw new Error('AGENTCORE_RUNTIME_URL environment variable is not set');
    }

    const endpoint = `${agentCoreUrl}/invocations`;

    sendMessage('system', `AgentCore Runtime に接続中: ${endpoint}`);

    // AgentCore Runtime にHTTPSリクエスト送信
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // AWS Signature V4 が必要な場合はここに追加
      },
      body: JSON.stringify({
        question,
        sessionId: sessionId || `session-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`AgentCore Runtime returned ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('AgentCore Runtime response body is empty');
    }

    sendMessage('system', 'AgentCore Runtime からストリーミング受信中...');

    // ストリーミングレスポンスを読み取る
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // チャンクをデコード
        buffer += decoder.decode(value, { stream: true });

        // 改行で分割してJSON Linesをパース
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最後の不完全な行はバッファに残す

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const event = JSON.parse(trimmed);

            // AgentCore Runtimeからのイベントをそのまま転送
            if (event.type && event.content) {
              sendMessage(event.type, event.content, event.agentId);
            } else {
              // フォールバック: JSON全体を送信
              sendMessage('agent_chunk', trimmed);
            }
          } catch (parseError) {
            // JSON parseエラー時はテキストとして送信
            console.warn('Failed to parse JSON line:', trimmed, parseError);
            sendMessage('agent_chunk', trimmed);
          }
        }
      }

      // バッファに残ったデータを処理
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer.trim());
          if (event.type && event.content) {
            sendMessage(event.type, event.content, event.agentId);
          }
        } catch (parseError) {
          sendMessage('agent_chunk', buffer.trim());
        }
      }

      sendMessage('phase', 'MAGI Decision Complete');
      sendMessage('complete', 'MAGI Decision System: 分析が完了しました。');

    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('AgentCore Runtime error:', error);

    try {
      sendMessage('error', `AgentCore Runtime エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } catch (controllerError) {
      console.error('Controller error:', controllerError);
    }

    // 開発環境でのみフォールバック
    if (process.env.NODE_ENV !== 'production') {
      sendMessage('system', '開発環境: フォールバックモードで継続します');
      await sendDevelopmentFallback(controller, encoder, question);
    } else {
      throw error;
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
    sendMessage('note', '※ 現在はモックモードで動作しています。AgentCore Runtime URLを設定してください。');

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

          console.log('🚀 Invoking AgentCore Runtime...');
          await invokeAgentCoreRuntime(controller, encoder, question, sessionId);

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
