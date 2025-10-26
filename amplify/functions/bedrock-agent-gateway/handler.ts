/**
 * MAGI Decision System - Strands Agents Gateway Handler
 * 
 * このファイルはStrands Agents SDKを使用したMAGI Decision Systemの
 * メインゲートウェイハンドラーです。
 * 
 * アーキテクチャ:
 * - SOLOMON Judge: 統括者として3賢者を管理・評価
 * - 3賢者Agents: CASPAR、BALTHASAR、MELCHIORによる多視点分析
 * - Strands Agents SDK: 実際のBedrock Claude APIとの統合
 * - OpenTelemetry: 分散トレーシングによる監視
 * 
 * 学習ポイント:
 * - Strands Agents SDKの実際の使用方法
 * - Lambda環境でのPython実行
 * - フロントエンド・バックエンド統合
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { spawn } from 'child_process';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// 型定義のインポート
import type { AskAgentRequest, AskAgentResponse } from '../../types/api';
import type { AgentResponse, JudgeResponse, AgentType, DecisionType } from '../../types/domain';

/**
 * OpenTelemetryトレーサーの初期化
 * 
 * 学習ポイント:
 * - 分散トレーシングの実装
 * - スパンの作成と管理
 * - メトリクス収集
 */
const tracer = trace.getTracer('magi-strands-gateway');

/**
 * Python MAGI Executorを実行
 * 
 * Lambda環境でPythonスクリプトを子プロセスとして実行し、
 * Strands Agents SDKを使用してMAGI Decision Systemを実行します。
 */
async function executePythonMAGI(request: AskAgentRequest, span: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      span.addEvent('python-process-spawn');
      
      // Python実行環境の設定
      const pythonPath = process.env.PYTHON_PATH || 'python3';
      const scriptPath = './magi_executor.py';
      
      // 子プロセスを起動
      const pythonProcess = spawn(pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: __dirname,
        env: {
          ...process.env,
          // AWS認証情報を継承
          AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        }
      });

      let stdout = '';
      let stderr = '';

      // 標準出力を収集
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // 標準エラーを収集
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // プロセス終了時の処理
      pythonProcess.on('close', (code) => {
        span.addEvent('python-process-complete', { exit_code: code });
        
        if (code === 0) {
          try {
            // 成功時: JSON出力を解析
            const result = JSON.parse(stdout);
            console.log('Python MAGI execution successful:', result.success);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            console.error('Raw stdout:', stdout);
            reject(new Error(`Failed to parse Python output: ${parseError}`));
          }
        } else {
          // エラー時
          console.error(`Python process exited with code ${code}`);
          console.error('stderr:', stderr);
          console.error('stdout:', stdout);
          reject(new Error(`Python process failed with code ${code}: ${stderr}`));
        }
      });

      // プロセスエラー時の処理
      pythonProcess.on('error', (error) => {
        span.addEvent('python-process-error', { error: error.message });
        console.error('Python process error:', error);
        reject(error);
      });

      // リクエストデータをJSONとして送信
      const requestJson = JSON.stringify(request);
      pythonProcess.stdin.write(requestJson);
      pythonProcess.stdin.end();

      // タイムアウト設定（5分）
      setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill();
          reject(new Error('Python process timeout'));
        }
      }, 300000); // 5分

    } catch (error) {
      span.recordException(error as Error);
      reject(error);
    }
  });
}

/**
 * フォールバック判断レスポンスを作成
 */
function createFallbackJudgeResponse(): JudgeResponse {
  return {
    finalDecision: 'REJECTED' as DecisionType,
    votingResult: {
      approved: 0,
      rejected: 1,
      abstained: 0,
      totalVotes: 1,
    },
    scores: [],
    summary: 'システムエラーにより判断を実行できませんでした',
    finalRecommendation: '技術的な問題を解決してから再試行してください',
    reasoning: 'MAGI システムの実行中にエラーが発生しました',
    confidence: 0.0,
    executionTime: 0,
    timestamp: new Date(),
  };
}

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
 * - Strands Agents SDKを使用した実際のClaude API統合
 * - Python子プロセスでMAGI Decision Systemを実行
 * - JSON入出力による言語間通信
 * - OpenTelemetryによる分散トレーシング
 * 
 * 学習ポイント:
 * - Lambda環境でのPython実行
 * - 子プロセス通信とエラーハンドリング
 * - 実際のLLM統合パターン
 */
async function executeMAGIDecisionSystem(
  request: AskAgentRequest,
  parentSpspan: any
): Promise<AskAgentResponse> {
  return tracer.startActiveSpan('magi-strands-execution', async (span) => {
    try {
      const startTime = Date.now();
      const traceId = span.spanContext().traceId;

      span.addEvent('magi-python-execution-start');
      
      // Python MAGI Executorを実行
      const magiResult = await executePythonMAGI(request, span);
      
      const executionTime = Date.now() - startTime;

      // レスポンスの構築
      const response: AskAgentResponse = {
        conversationId: magiResult.conversationId || `conv_${Date.now()}`,
        messageId: magiResult.messageId || `msg_${Date.now()}`,
        agentResponses: magiResult.agentResponses || [],
        judgeResponse: magiResult.judgeResponse || createFallbackJudgeResponse(),
        traceId: magiResult.traceId || traceId,
        executionTime,
        timestamp: new Date(),
      };

      span.setAttributes({
        'magi.execution_time': executionTime,
        'magi.final_decision': response.judgeResponse.finalDecision || 'UNKNOWN',
        'magi.python_success': magiResult.success || false,
      });

      span.addEvent('magi-python-execution-complete');
      return response;

    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

