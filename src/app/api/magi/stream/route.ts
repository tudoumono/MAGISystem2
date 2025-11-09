/**
 * ⚠️ DEPRECATED - このファイルは非推奨です ⚠️
 *
 * PR #5で誤って実装されたBedrockAgentCoreClient方式のAPI Routeです。
 * 参考記事のコンセプトとMAGIの要件から逸脱しています。
 *
 * 🎯 正しい実装:
 * - agents/backend/app/api/invocations/route.ts を使用してください
 * - フロントエンドは AgentCore Runtime の /api/invocations を直接呼び出します
 *
 * MAGIアーキテクチャ（参考記事コンセプト + Python統合）:
 *   Amplify Hosting (Next.js Frontend)
 *       ↓ fetch(NEXT_PUBLIC_AGENTCORE_URL + '/api/invocations')
 *   AgentCore Runtime (Docker Container)
 *       ├─ Next.jsバックエンド (ポート8080)
 *       │   └─ spawn('python', ['magi_agent.py'])
 *       └─ Python magi_agent.py (AWS Strands Agents使用)
 *
 * ❌ このファイルのアーキテクチャ（誤り）:
 * Amplify Hosting (Next.js)
 *   ↓ BedrockAgentCoreClient.send() ← 誤った方向性
 *   ↓ AWS SigV4認証
 * Amazon Bedrock AgentCore Runtime (独立デプロイ)
 *   └─ magi_agent.py
 *
 * 理由: MAGIシステムは既存のPythonエージェント（Strands Agents）を活用し、
 *       参考記事のAgentCore Runtimeコンセプトを採用しています。
 *       BedrockAgentCoreClientでの独立した呼び出しは、この方針と異なります。
 *
 * 参考:
 * - 参考記事: https://qiita.com/moritalous/items/ea695f8a328585e1313b
 * - 正しい実装: agents/backend/app/api/invocations/route.ts
 * - Python側実装: agents/magi_agent.py
 *
 * ==========================================
 * 以下は学習目的のため残されています（使用しないでください）
 * ==========================================
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand
} from '@aws-sdk/client-bedrock-agentcore';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { validateRequestBody } from '@/lib/security/request-validator';

// Next.js設定
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AgentCore RuntimeへAWS SDK経由で呼び出し
 *
 * アーキテクチャ:
 * Next.js API Route
 *   ↓ BedrockAgentCoreClient
 *   ↓ AWS SigV4認証（自動）
 * AgentCore Runtime
 *   ↓ magi_agent.py
 * Bedrock (Claude)
 */
async function invokeAgentCoreRuntime(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  question: string,
  sessionId: string
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

    // AgentCore Runtime ARN
    const agentRuntimeArn = process.env.MAGI_AGENT_ARN;

    if (!agentRuntimeArn) {
      throw new Error('MAGI_AGENT_ARN environment variable is not set');
    }

    console.log(`[MAGI] Invoking AgentCore Runtime: ARN=${agentRuntimeArn}, Session=${sessionId}`);
    sendMessage('system', `AgentCore Runtime に接続中...`);

    // 1. BedrockAgentCoreClient初期化
    const client = new BedrockAgentCoreClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
      // 認証情報は自動取得（環境変数またはIAMロール）
      // - ローカル開発: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
      // - Amplify Hosting: IAMロール（自動）
    });

    // 2. InvokeAgentRuntimeCommand実行
    const command = new InvokeAgentRuntimeCommand({
      agentRuntimeArn,  // ARNを指定
      runtimeSessionId: sessionId,
      payload: new TextEncoder().encode(JSON.stringify({ question }))
    });

    const response = await client.send(command);

    sendMessage('system', 'AgentCore Runtime からストリーミング受信中...');

    // 3. ストリーミングレスポンスを処理（リアルタイム）
    let eventCount = 0;

    if (response.response) {
      // ✅ 正しい実装: AsyncIterableとして処理（リアルタイムストリーミング）
      // TypeScript型エラーを回避するため as any を使用
      const eventStream = response.response as any;

      for await (const event of eventStream) {
        eventCount++;

        // magi_agent.pyの標準出力がevent.chunk.bytesに含まれる
        if ('chunk' in event && event.chunk?.bytes) {
          const chunkText = new TextDecoder().decode(event.chunk.bytes);

          // デバッグログ（本番環境では削除推奨）
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[MAGI] Event ${eventCount}:`, chunkText.substring(0, 150));
          }

          // magi_agent.pyの出力はJSON Lines形式
          // 各行がJSONオブジェクト: {"type": "...", "data": {...}}
          const lines = chunkText.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.type && parsed.data) {
                // magi_agent.pyの形式: {"type": "...", "data": {...}}
                // SSE形式に変換: data: {"type": "...", "content": {...}, ...}
                sendMessage(
                  parsed.type,
                  typeof parsed.data === 'string' ? parsed.data : JSON.stringify(parsed.data),
                  parsed.data.agent_id || parsed.data.agentId
                );
              } else {
                // フォールバック: そのまま転送
                sendMessage('agent_chunk', line);
              }
            } catch (parseError) {
              // JSON parseエラー時はテキストとして送信
              console.warn('[MAGI] Failed to parse JSON:', line.substring(0, 100), parseError);
              sendMessage('agent_chunk', line);
            }
          }
        } else if ('trace' in event) {
          // トレース情報（デバッグ用）
          if (process.env.NODE_ENV !== 'production') {
            console.log('[MAGI] Trace:', event.trace);
          }
        }
      }
    }

    console.log(`[MAGI] Stream complete: ${eventCount} events received`);
    sendMessage('phase', 'MAGI Decision Complete');
    sendMessage('complete', 'MAGI Decision System: 分析が完了しました。');

  } catch (error) {
    console.error('[MAGI] AgentCore Runtime error:', error);

    try {
      sendMessage('error', `AgentCore Runtime エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } catch (controllerError) {
      console.error('[MAGI] Controller error:', controllerError);
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
      console.error('[MAGI] Controller close error:', closeError);
    }
  }
}

/**
 * 開発環境用のフォールバックレスポンス
 * MAGI_AGENT_ARNが未設定の場合や接続エラー時に使用
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
    sendMessage('phase', 'MAGI System Initialization (Mock)...');
    await delay(800);

    sendMessage('system', 'SOLOMON Judge: システム起動中... (Mock)');
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
    sendMessage('note', '※ 現在はモックモードで動作しています。MAGI_AGENT_ARNを設定してください。');

  } catch (error) {
    sendMessage('error', `Mock streaming error: ${error}`);
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
      // TODO: Amplify Auth統合後、ここで認証チェックを実装
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
    const { question } = body;

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

    // セッションID生成（33文字以上必須）
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const sessionId = `magi-session-${timestamp}-${random}`.padEnd(33, '0');

    // Server-Sent Eventsストリーム作成
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'start',
              message: 'MAGI Decision System starting...',
              sessionId,
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          console.log('🚀 Invoking AgentCore Runtime via AWS SDK...');
          await invokeAgentCoreRuntime(controller, encoder, question, sessionId);

        } catch (error) {
          console.error('[MAGI] API Route error:', error);

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
        'X-Accel-Buffering': 'no', // nginxバッファリング無効化
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('[MAGI] API Route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
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
