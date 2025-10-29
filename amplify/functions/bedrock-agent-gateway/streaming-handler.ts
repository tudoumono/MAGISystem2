/**
 * MAGI Decision System - Bedrock AgentCore Runtime Streaming Gateway Handler
 *
 * このファイルはLambda Response Streamingを使用して、AgentCore Runtimeからの
 * ストリーミングレスポンスを直接フロントエンドに転送します。
 *
 * アーキテクチャ:
 * AgentCore Runtime → Lambda (streaming) → API Route (SSE) → Frontend
 *
 * 学習ポイント:
 * - Lambda Response Streamingの使用方法
 * - AgentCore Runtimeのストリーミング処理
 * - リアルタイムレスポンス配信
 * - OpenTelemetryトレーシング
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { trace, SpanStatusCode } from '@opentelemetry/api';

/**
 * OpenTelemetryトレーサーの初期化
 */
const tracer = trace.getTracer('magi-agentcore-streaming-gateway');

/**
 * Bedrock AgentCore Runtime クライアントの初期化
 */
const bedrockClient = new BedrockAgentRuntimeClient({
  region: process.env.BEDROCK_REGION || 'ap-northeast-1',
});

/**
 * AgentCore Runtimeの設定
 */
const AGENTCORE_CONFIG = {
  agentId: process.env.MAGI_AGENT_ID || 'magi_agent-4ORNam2cHb',
  agentAliasId: process.env.MAGI_AGENT_ALIAS_ID || 'TSTALIASID',
  region: process.env.BEDROCK_REGION || 'ap-northeast-1',
};

/**
 * Lambda Response Streaming Handler
 *
 * 設計理由:
 * - AgentCore Runtimeからのストリーミングを直接転送
 * - 2-10分の処理時間でもリアルタイムに結果を配信
 * - メモリ使用量を最小化（全レスポンスを溜め込まない）
 *
 * 学習ポイント:
 * - awslambda.streamifyResponse()の使用
 * - AsyncIterableの処理
 * - Server-Sent Events形式での配信
 */
export const handler = awslambda.streamifyResponse(
  async (event: APIGatewayProxyEvent, responseStream: any) => {
    return tracer.startActiveSpan('bedrock-agentcore-streaming-gateway', async (span) => {
      try {
        // リクエストボディの解析
        const requestBody = event.body ? JSON.parse(event.body) : {};
        const { question, sessionId } = requestBody;

        // バリデーション
        if (!question || typeof question !== 'string') {
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid request' });
          
          responseStream.write(JSON.stringify({
            error: 'Bad Request',
            message: 'Question is required and must be a string',
          }));
          responseStream.end();
          return;
        }

        // トレーシング情報の設定
        span.setAttributes({
          'http.method': event.httpMethod,
          'http.path': event.path,
          'magi.question': question,
          'magi.session_id': sessionId || 'new',
          'agentcore.agent_id': AGENTCORE_CONFIG.agentId,
        });

        // ログ出力
        console.log('Bedrock AgentCore Runtime Streaming Request:', {
          method: event.httpMethod,
          path: event.path,
          agentId: AGENTCORE_CONFIG.agentId,
          sessionId: sessionId || 'new',
          traceId: span.spanContext().traceId,
        });

        // セッションIDの生成
        const effectiveSessionId = sessionId || 
          `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        span.addEvent('agentcore-invoke-start', {
          agentId: AGENTCORE_CONFIG.agentId,
          sessionId: effectiveSessionId,
        });

        // InvokeAgentCommandの作成
        const input: InvokeAgentCommandInput = {
          agentId: AGENTCORE_CONFIG.agentId,
          agentAliasId: AGENTCORE_CONFIG.agentAliasId,
          sessionId: effectiveSessionId,
          inputText: question,
          enableTrace: true,
          endSession: false,
        };

        console.log('Invoking AgentCore Runtime (streaming mode):', {
          agentId: AGENTCORE_CONFIG.agentId,
          sessionId: effectiveSessionId,
          inputText: question.substring(0, 100) + '...',
        });

        // AgentCore Runtimeの呼び出し
        const command = new InvokeAgentCommand(input);
        const agentResponse = await bedrockClient.send(command);

        // ストリーミングレスポンスの転送
        let chunkCount = 0;
        let totalBytes = 0;
        const startTime = Date.now();

        if (agentResponse.completion) {
          for await (const chunk of agentResponse.completion) {
            // チャンクの処理
            if (chunk.chunk?.bytes) {
              const text = new TextDecoder().decode(chunk.chunk.bytes);
              totalBytes += chunk.chunk.bytes.length;
              chunkCount++;

              // Server-Sent Events形式で配信
              const sseData = {
                type: 'chunk',
                content: text,
                chunkNumber: chunkCount,
                timestamp: new Date().toISOString(),
              };

              // ストリームに書き込み
              responseStream.write(`data: ${JSON.stringify(sseData)}\n\n`);

              console.log(`Streamed chunk ${chunkCount}: ${text.substring(0, 50)}...`);
            }

            // トレース情報の配信
            if (chunk.trace) {
              const traceData = {
                type: 'trace',
                trace: chunk.trace,
                timestamp: new Date().toISOString(),
              };

              responseStream.write(`data: ${JSON.stringify(traceData)}\n\n`);
            }
          }
        }

        const executionTime = Date.now() - startTime;

        // 完了通知
        const completeData = {
          type: 'complete',
          sessionId: effectiveSessionId,
          agentId: AGENTCORE_CONFIG.agentId,
          executionTime,
          chunkCount,
          totalBytes,
          timestamp: new Date().toISOString(),
        };

        responseStream.write(`data: ${JSON.stringify(completeData)}\n\n`);

        // トレーシング情報の追加
        span.setAttributes({
          'magi.execution_time': executionTime,
          'magi.chunk_count': chunkCount,
          'magi.total_bytes': totalBytes,
        });

        span.addEvent('agentcore-invoke-complete');
        span.setStatus({ code: SpanStatusCode.OK });

        console.log('Streaming completed:', {
          executionTime,
          chunkCount,
          totalBytes,
        });

      } catch (error) {
        console.error('AgentCore Runtime streaming error:', error);

        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });

        // エラー通知
        const errorData = {
          type: 'error',
          error: 'Internal Server Error',
          message: 'AgentCore Runtime実行中にエラーが発生しました',
          details: (error as Error).message,
          timestamp: new Date().toISOString(),
        };

        responseStream.write(`data: ${JSON.stringify(errorData)}\n\n`);
      } finally {
        span.end();
        responseStream.end();
      }
    });
  }
);

/**
 * Lambda Response Streamingの設定
 *
 * 学習ポイント:
 * - Lambda関数URLでのストリーミング有効化
 * - Content-Typeの設定
 * - タイムアウトの調整
 */
export const config = {
  invokeMode: 'RESPONSE_STREAM',
  timeout: 600, // 10分
  memorySize: 2048,
};
