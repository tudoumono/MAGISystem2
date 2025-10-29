/**
 * MAGI Decision System - Bedrock AgentCore Runtime Gateway Handler
 *
 * このファイルはAWS Bedrock AgentCore Runtimeを使用したMAGI Decision Systemの
 * メインゲートウェイハンドラーです。
 *
 * アーキテクチャ:
 * - Lambda Function: API GatewayとAgentCore Runtimeの橋渡し
 * - BedrockAgentRuntimeClient: AgentCore Runtime呼び出し
 * - AgentCore Runtime: デプロイ済みのPython magi_agent.py実行
 * - Bedrock API: Claude 3.5 Sonnetとの統合
 *
 * 学習ポイント:
 * - BedrockAgentRuntimeClientの使用方法
 * - ストリーミングレスポンスの処理
 * - Lambda環境でのエラーハンドリング
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as awslambda from 'aws-lambda';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandInput,
  InvokeAgentCommandOutput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

/**
 * OpenTelemetryトレーサーの初期化
 */
const tracer = trace.getTracer('magi-agentcore-gateway');

/**
 * Bedrock AgentCore Runtime クライアントの初期化
 *
 * 学習ポイント:
 * - Lambda環境ではIAM Roleの認証情報が自動的に使用される
 * - リージョンは環境変数から取得
 */
const bedrockClient = new BedrockAgentRuntimeClient({
  region: process.env.BEDROCK_REGION || 'ap-northeast-1',
});

/**
 * AgentCore Runtimeの設定
 *
 * agents/.bedrock_agentcore.yaml から取得した値
 */
const AGENTCORE_CONFIG = {
  agentId: process.env.MAGI_AGENT_ID || 'magi_agent-4ORNam2cHb',
  agentAliasId: process.env.MAGI_AGENT_ALIAS_ID || 'TSTALIASID',
  region: process.env.BEDROCK_REGION || 'ap-northeast-1',
};

/**
 * Lambda関数のストリーミングハンドラー
 *
 * みのるん氏の指摘への対応:
 * - Response Streaming対応のハンドラー
 * - AgentCore Runtimeからのストリーミングを段階的に配信
 * - Server-Sent Events形式でフロントエンドに送信
 *
 * 学習ポイント:
 * - Lambda Response Streamingの使用
 * - AgentCore Runtimeのストリーミング統合
 * - OpenTelemetryトレーシング
 */
export const handler = awslambda.streamifyResponse(
  async (event: APIGatewayProxyEvent, responseStream: NodeJS.WritableStream) => {
    // CORS ヘッダーの設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    // ヘッダーをメタデータとして送信
    const metadata = {
      statusCode: 200,
      headers: corsHeaders
    };

    // OpenTelemetryスパンの開始
    return tracer.startActiveSpan('bedrock-agentcore-gateway-stream', async (span) => {
      try {
        // OPTIONSリクエスト（CORS プリフライト）の処理
        if (event.httpMethod === 'OPTIONS') {
          span.setStatus({ code: SpanStatusCode.OK });
          responseStream.write('');
          responseStream.end();
          return metadata;
        }

        // リクエストボディの解析
        const requestBody = event.body ? JSON.parse(event.body) : {};
        const { question, sessionId } = requestBody;

        // バリデーション
        if (!question || typeof question !== 'string') {
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid request' });
          const errorData = JSON.stringify({
            error: 'Bad Request',
            message: 'Question is required and must be a string',
          });
          responseStream.write(`data: ${errorData}\n\n`);
          responseStream.end();
          return { ...metadata, statusCode: 400 };
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
          agentId: AGENTCORE_CONFIG.agentId,
          sessionId: sessionId || 'new',
          traceId: span.spanContext().traceId,
        });

        // MAGI AgentCore Runtimeのストリーミング実行
        await invokeMAGIAgentCoreStreaming(question, sessionId, responseStream, span);

        span.setStatus({ code: SpanStatusCode.OK });
        responseStream.end();
        return metadata;

      } catch (error) {
        // エラーログ出力
        console.error('Bedrock AgentCore Gateway Streaming Error:', error);

        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });

        const errorData = JSON.stringify({
          type: 'error',
          error: 'Internal Server Error',
          message: 'AgentCore Runtime実行中にエラーが発生しました',
          details: (error as Error).message,
          timestamp: new Date().toISOString(),
          traceId: span.spanContext().traceId,
        });

        responseStream.write(`data: ${errorData}\n\n`);
        responseStream.end();
        return { ...metadata, statusCode: 500 };
      } finally {
        span.end();
      }
    });
  }
);

/**
 * 従来の同期ハンドラー（後方互換性のため残す）
 */
export const handlerSync = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // CORS ヘッダーの設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  // OpenTelemetryスパンの開始
  return tracer.startActiveSpan('bedrock-agentcore-gateway', async (span) => {
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
      const requestBody = event.body ? JSON.parse(event.body) : {};
      const { question, sessionId } = requestBody;

      // バリデーション
      if (!question || typeof question !== 'string') {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid request' });
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Question is required and must be a string',
          }),
        };
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
      console.log('Bedrock AgentCore Runtime Request:', {
        method: event.httpMethod,
        path: event.path,
        agentId: AGENTCORE_CONFIG.agentId,
        sessionId: sessionId || 'new',
        traceId: span.spanContext().traceId,
      });

      // MAGI AgentCore Runtimeの実行
      const response = await invokeMAGIAgentCore(question, sessionId, span);

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
      console.error('Bedrock AgentCore Gateway Error:', error);

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
          message: 'AgentCore Runtime実行中にエラーが発生しました',
          details: (error as Error).message,
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
 * MAGI AgentCore Runtimeのストリーミング呼び出し
 *
 * みのるん氏の指摘への対応:
 * - AgentCore Runtimeからのストリーミングを段階的に配信
 * - チャンクを溜め込まず、受信次第フロントエンドに送信
 * - Server-Sent Events形式でフォーマット
 *
 * @param question - ユーザーの質問
 * @param sessionId - セッションID（オプション）
 * @param responseStream - レスポンスストリーム
 * @param parentSpan - 親スパン（トレーシング用）
 */
async function invokeMAGIAgentCoreStreaming(
  question: string,
  sessionId: string | undefined,
  responseStream: NodeJS.WritableStream,
  parentSpan: any
): Promise<void> {
  return tracer.startActiveSpan('magi-agentcore-streaming', async (span) => {
    try {
      const startTime = Date.now();

      // セッションIDの生成（指定がない場合）
      const effectiveSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      span.addEvent('agentcore-streaming-start', {
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

      console.log('Invoking AgentCore Runtime (Streaming):', {
        agentId: AGENTCORE_CONFIG.agentId,
        sessionId: effectiveSessionId,
      });

      // 開始イベントを送信
      const startEvent = JSON.stringify({
        type: 'start',
        sessionId: effectiveSessionId,
        agentId: AGENTCORE_CONFIG.agentId,
        timestamp: new Date().toISOString(),
      });
      responseStream.write(`data: ${startEvent}\n\n`);

      // AgentCore Runtimeの呼び出し
      const command = new InvokeAgentCommand(input);
      const agentResponse: InvokeAgentCommandOutput = await bedrockClient.send(command);

      let chunkCount = 0;
      let totalBytes = 0;

      // ストリーミングレスポンスの段階的配信
      if (agentResponse.completion) {
        for await (const chunk of agentResponse.completion) {
          // チャンクデータの送信
          if (chunk.chunk?.bytes) {
            const text = new TextDecoder().decode(chunk.chunk.bytes);
            totalBytes += chunk.chunk.bytes.length;
            chunkCount++;

            const chunkEvent = JSON.stringify({
              type: 'chunk',
              content: text,
              chunkNumber: chunkCount,
              timestamp: new Date().toISOString(),
            });

            responseStream.write(`data: ${chunkEvent}\n\n`);
          }

          // トレース情報の送信
          if (chunk.trace) {
            const traceEvent = JSON.stringify({
              type: 'trace',
              trace: chunk.trace,
              timestamp: new Date().toISOString(),
            });

            responseStream.write(`data: ${traceEvent}\n\n`);
          }
        }
      }

      const executionTime = Date.now() - startTime;

      // 完了イベントを送信
      const completeEvent = JSON.stringify({
        type: 'complete',
        sessionId: effectiveSessionId,
        agentId: AGENTCORE_CONFIG.agentId,
        executionTime,
        chunkCount,
        totalBytes,
        timestamp: new Date().toISOString(),
      });
      responseStream.write(`data: ${completeEvent}\n\n`);

      // トレーシング情報の追加
      span.setAttributes({
        'magi.execution_time': executionTime,
        'magi.chunk_count': chunkCount,
        'magi.total_bytes': totalBytes,
      });

      span.addEvent('agentcore-streaming-complete');
      console.log('AgentCore Runtime streaming completed:', {
        executionTime,
        chunkCount,
        totalBytes,
      });

    } catch (error) {
      console.error('AgentCore Runtime streaming failed:', error);

      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });

      // エラーイベントを送信
      const errorEvent = JSON.stringify({
        type: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
      responseStream.write(`data: ${errorEvent}\n\n`);

      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * MAGI AgentCore Runtimeの呼び出し（同期版）
 *
 * 設計理由:
 * - BedrockAgentRuntimeClientを使用してデプロイ済みのAgentCore Runtimeを呼び出し
 * - Python子プロセスの実行は不要（Runtime側で実行される）
 * - ストリーミングレスポンスに対応
 *
 * 学習ポイント:
 * - InvokeAgentCommandの使用方法
 * - ストリーミングレスポンスの処理
 * - エラーハンドリング
 *
 * @param question - ユーザーの質問
 * @param sessionId - セッションID（オプション）
 * @param parentSpan - 親スパン（トレーシング用）
 * @returns AgentCore Runtimeの実行結果
 */
async function invokeMAGIAgentCore(
  question: string,
  sessionId: string | undefined,
  parentSpan: any
): Promise<any> {
  return tracer.startActiveSpan('magi-agentcore-invocation', async (span) => {
    try {
      const startTime = Date.now();

      // セッションIDの生成（指定がない場合）
      const effectiveSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

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
        enableTrace: true,  // トレース情報を有効化
        endSession: false,  // セッションを継続
      };

      console.log('Invoking AgentCore Runtime:', {
        agentId: AGENTCORE_CONFIG.agentId,
        sessionId: effectiveSessionId,
        inputText: question.substring(0, 100) + '...',
      });

      // AgentCore Runtimeの呼び出し
      const command = new InvokeAgentCommand(input);
      const agentResponse: InvokeAgentCommandOutput = await bedrockClient.send(command);

      // ストリーミングレスポンスの処理
      let fullResponse = '';
      let traceData: any[] = [];

      if (agentResponse.completion) {
        for await (const chunk of agentResponse.completion) {
          // チャンクの処理
          if (chunk.chunk?.bytes) {
            const text = new TextDecoder().decode(chunk.chunk.bytes);
            fullResponse += text;
          }

          // トレース情報の収集
          if (chunk.trace) {
            traceData.push(chunk.trace);
          }
        }
      }

      const executionTime = Date.now() - startTime;

      // レスポンスの解析
      let parsedResponse: any = {};
      try {
        parsedResponse = JSON.parse(fullResponse);
      } catch (parseError) {
        console.warn('Failed to parse AgentCore response as JSON, using raw text');
        parsedResponse = {
          raw_response: fullResponse,
          success: true,
        };
      }

      // トレーシング情報の追加
      span.setAttributes({
        'magi.execution_time': executionTime,
        'magi.response_length': fullResponse.length,
        'magi.trace_events': traceData.length,
      });

      span.addEvent('agentcore-invoke-complete');

      // レスポンスの構築
      return {
        success: true,
        sessionId: effectiveSessionId,
        agentId: AGENTCORE_CONFIG.agentId,
        response: parsedResponse,
        fullResponse: fullResponse,
        executionTime,
        traceData: traceData.length > 0 ? traceData : undefined,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('AgentCore Runtime invocation failed:', error);

      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });

      throw new Error(`AgentCore Runtime呼び出しに失敗しました: ${(error as Error).message}`);
    } finally {
      span.end();
    }
  });
}
