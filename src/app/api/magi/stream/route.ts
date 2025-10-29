/**
 * MAGI Decision System - ストリーミングAPI Route
 * 
 * このファイルはMAGIシステムのストリーミング対応APIエンドポイントです。
 * AgentCore Runtimeとの統合により、リアルタイムエージェント応答を実現します。
 * 
 * 主要機能:
 * - Server-Sent Eventsによるストリーミングレスポンス
 * - AWS Bedrock Agent Runtime統合
 * - 認証・権限チェック
 * - エラーハンドリングとフォールバック
 * 
 * 学習ポイント:
 * - Next.js API Routesでのストリーミング実装
 * - AWS SDK v3の使用方法
 * - Server-Sent Eventsプロトコル
 */

import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { validateRequestBody } from '@/lib/security/request-validator';

/**
 * Lambda クライアント設定
 *
 * 設計理由:
 * - API Route → Lambda Function → AgentCore Runtime のアーキテクチャ
 * - Lambda関数内でBedrockAgentRuntimeClientを使用
 * - API Routeは軽量なゲートウェイとして機能
 */
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  // 本番環境では IAM Role を使用、開発環境では環境変数から取得
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  } : {}),
});

// Lambda関数名（Amplify Gen2が自動生成）
// 形式: <backend-id>-bedrockAgentGateway-<hash>
// 実際の関数名は amplify sandbox または amplify deploy 後に確認
const LAMBDA_FUNCTION_NAME = process.env.BEDROCK_GATEWAY_LAMBDA_NAME || 'bedrock-agent-gateway';

/**
 * Lambda関数経由でMAGI AgentCore Runtimeを呼び出し
 *
 * アーキテクチャ:
 * API Route → Lambda Function → BedrockAgentRuntimeClient → AgentCore Runtime
 *
 * 設計理由:
 * - Lambda関数でBedrockAgentRuntimeClientを使用（IAM Role認証）
 * - API Routeは軽量なゲートウェイとして機能
 * - ストリーミングレスポンスを段階的に配信
 */
async function invokeMAGIAgentCore(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  question: string,
  sessionId?: string
) {
  // ヘルパー関数: 遅延
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // ヘルパー関数: メッセージ送信
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

    // Lambda関数経由でAgentCore Runtimeを呼び出し
    sendMessage('system', 'Lambda関数経由でAgentCore Runtimeを呼び出し中...');
    await delay(500);

    try {
      // Lambda関数の呼び出し
      const lambdaPayload = {
        httpMethod: 'POST',
        path: '/magi/invoke',
        body: JSON.stringify({
          question: question,
          sessionId: sessionId,
        }),
      };

      sendMessage('system', 'Lambda関数実行中...');
      await delay(300);

      const command = new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(lambdaPayload),
      });

      // リトライロジック付きでLambda呼び出し
      const lambdaResponse = await invokeLambdaWithRetry(command, 3, 1000);

      // Lambda応答の解析
      const responsePayload = JSON.parse(
        new TextDecoder().decode(lambdaResponse.Payload)
      );

      sendMessage('system', 'Lambda関数からレスポンス受信');
      await delay(300);

      // エラーチェック
      if (lambdaResponse.FunctionError) {
        throw new Error(`Lambda function error: ${lambdaResponse.FunctionError}`);
      }

      if (responsePayload.statusCode !== 200) {
        throw new Error(`Lambda returned status ${responsePayload.statusCode}: ${responsePayload.body}`);
      }

      // レスポンスボディの解析
      const responseBody = typeof responsePayload.body === 'string'
        ? JSON.parse(responsePayload.body)
        : responsePayload.body;

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
            // パース失敗時はそのまま使用
            parsedResponse = null;
          }
        } else {
          parsedResponse = magiResponse;
        }

        // 構造化されたMAGI応答を表示
        if (parsedResponse && parsedResponse.body) {
          await displayStructuredMAGIResponse(parsedResponse.body, sendMessage, delay);
        } else if (responseBody.fullResponse) {
          // fullResponseをパースして表示
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
        throw new Error('Invalid response format from Lambda function');
      }

    } catch (lambdaError) {
      console.error('Lambda invocation failed after retries:', lambdaError);

      // エラーの詳細をユーザーに通知
      sendMessage('error', 'Lambda関数の呼び出しに失敗しました');
      await delay(300);
      
      const errorMessage = lambdaError instanceof Error ? lambdaError.message : 'Unknown error';
      sendMessage('error', `エラー詳細: ${errorMessage}`);
      await delay(300);
      
      // 開発環境でのみフォールバック
      if (process.env.NODE_ENV !== 'production') {
        sendMessage('system', '開発環境: フォールバックモードで継続します');
        await delay(500);
        await sendDevelopmentFallback(controller, encoder, question);
        return;
      }
      
      // 本番環境ではエラーをthrow
      sendMessage('error', '本番環境ではフォールバックは利用できません。システム管理者に連絡してください。');
      throw new Error(`AgentCore Runtime invocation failed: ${errorMessage}`);
    }

    // Phase 5: 完了
    sendMessage('phase', 'MAGI Decision Complete');
    await delay(300);
    
    sendMessage('complete', 'MAGI Decision System: 実際のAI分析が完了しました。');

  } catch (error) {
    console.error('AgentCore Runtime error:', error);
    
    // エラーメッセージを送信（コントローラーが開いている場合のみ）
    try {
      sendMessage('error', `AgentCore Runtime error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } catch (controllerError) {
      console.error('Controller error:', controllerError);
    }
  } finally {
    // コントローラーが開いている場合のみ閉じる
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
  // Phase: 結果の構造化表示
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
 * リトライロジック付きLambda呼び出し
 * 
 * 指数バックオフによるリトライを実装
 */
async function invokeLambdaWithRetry(
  command: any,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await lambdaClient.send(command);
    } catch (error) {
      lastError = error as Error;
      console.error(`Lambda invocation attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Lambda invocation failed after retries');
}

/**
 * 開発環境用のフォールバックレスポンス
 * 
 * 注意: 本番環境では使用されません
 */
async function sendDevelopmentFallback(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  question: string
) {
  // ヘルパー関数: 遅延
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // ヘルパー関数: メッセージ送信
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
    await delay(800);
    
    sendMessage('system', 'SOLOMON Judge: システム起動中...');
    await delay(500);
    
    sendMessage('system', 'SOLOMON Judge: 3賢者エージェント初期化中...');
    await delay(700);

    // Phase 2: 質問分析
    sendMessage('phase', 'Question Analysis Phase');
    await delay(400);
    
    sendMessage('system', `SOLOMON Judge: 質問を分析しています - "${question}"`);
    await delay(600);
    
    sendMessage('system', 'SOLOMON Judge: 3賢者への並列実行を開始します...');
    await delay(500);

    // Phase 3: 3賢者並列実行開始
    sendMessage('phase', '3 Wise Men Parallel Execution');
    await delay(300);

    // CASPAR開始
    sendMessage('agent_start', 'CASPAR（保守的視点）: 分析を開始します...', 'caspar');
    await delay(400);
    
    // BALTHASAR開始
    sendMessage('agent_start', 'BALTHASAR（革新的視点）: 分析を開始します...', 'balthasar');
    await delay(300);
    
    // MELCHIOR開始
    sendMessage('agent_start', 'MELCHIOR（バランス型視点）: 分析を開始します...', 'melchior');
    await delay(500);

    // Phase 4: CASPAR分析結果（段階的配信）
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

    // Phase 5: BALTHASAR分析結果（段階的配信）
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

    // Phase 6: MELCHIOR分析結果（段階的配信）
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

    // Phase 7: SOLOMON Judge統合評価
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

    // Phase 8: 完了
    sendMessage('phase', 'MAGI Decision Complete');
    await delay(300);
    
    sendMessage('complete', 'MAGI Decision System: 全ての分析が完了しました。');
    await delay(200);

    // モックモード注記
    sendMessage('note', '※ 現在はモックモードで動作しています。実際のAWS Bedrock Agent Runtimeに接続するには、AWS認証情報を設定してください。');

  } catch (error) {
    sendMessage('error', `Streaming simulation error: ${error}`);
  } finally {
    controller.close();
  }
}

/**
 * MAGI Decision System ストリーミングエンドポイント
 * 
 * 目的: ユーザーの質問に対して3賢者 + SOLOMON Judgeによる多視点分析をストリーミング配信
 * 設計理由: 2-10分の処理時間に対するUX改善のため
 * 
 * @param request - ユーザーの質問を含むPOSTリクエスト
 * @returns ReadableStream - Server-Sent Eventsストリーム
 * 
 * 使用例:
 * ```typescript
 * const response = await fetch('/api/magi/stream', {
 *   method: 'POST',
 *   body: JSON.stringify({ question: 'AIの倫理的課題について' })
 * });
 * ```
 * 
 * 関連: src/lib/agents/bedrock-client.ts, agents/magi_agent.py
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    // TODO: Amplify Auth統合完了後にコメントを解除
    /*
    import { getCurrentUser } from '@aws-amplify/auth/server';
    const user = await getCurrentUser({ request });
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      );
    }
    */
    
    // 本番環境では認証必須（Amplify Auth統合前の安全策）
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

    // レート制限チェック（IPアドレスベース）
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const rateLimit = checkRateLimit(clientIp, 10, 60000); // 1分間に10リクエスト
    
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
          // ストリーム開始通知
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'start',
              message: 'MAGI Decision System starting...',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          // AgentCore Runtime統合（正しいAgent IDを使用）
          console.log('🚀 Calling Amazon Bedrock AgentCore Runtime');
          await invokeMAGIAgentCore(controller, encoder, question, sessionId);

        } catch (error) {
          console.error('AgentCore Runtime error:', error);
          
          // エラー通知
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