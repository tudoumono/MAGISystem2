/**
 * MAGI AgentCore Runtime - /invocations endpoint
 *
 * このエンドポイントはPython magi_agent.pyを呼び出し、
 * Strands Agentsベースのマルチエージェント推論を実行します。
 *
 * アーキテクチャ:
 * Frontend → /invocations (Next.js) → spawn('python', ['magi_agent.py'])
 *                                      ↓
 *                              Strands Agents実行
 *                                      ↓
 *                              ストリーミングレスポンス (SSE)
 *
 * 入出力形式:
 * - 入力（標準入力）: JSON { question, sessionId, agentConfigs }
 * - 出力（標準出力）: JSON Lines（1行ずつJSON）
 * - クライアントへ: Server-Sent Events (SSE) 形式
 */

import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export const maxDuration = 300; // 5分（MAGI推論時間を考慮）

interface InvocationRequest {
  question: string;
  sessionId?: string;
  agentConfigs?: any;
}

export async function POST(req: NextRequest) {
  try {
    const body: InvocationRequest = await req.json();
    const { question, sessionId, agentConfigs } = body;

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Server-Sent Events (SSE) ストリームを作成
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // SSE形式でメッセージを送信
        const sendSSE = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Python環境変数から実行パスを取得
          const pythonPath = process.env.PYTHON_PATH || 'python';
          const scriptPath = process.env.MAGI_SCRIPT_PATH || '/app/magi_agent.py';

          console.log(`[AgentCore] Starting Python process: ${pythonPath} ${scriptPath}`);

          // Pythonプロセスを起動
          const pythonProcess = spawn(pythonPath, [scriptPath], {
            env: {
              ...process.env,
              PYTHONPATH: process.env.PYTHONPATH || '/app',
              PYTHONUNBUFFERED: '1', // バッファリング無効化
            },
          });

          // 入力データをPythonプロセスに送信
          const inputData = JSON.stringify({
            question,
            sessionId: sessionId || `session-${Date.now()}`,
            agentConfigs: agentConfigs || {},
          });

          console.log(`[AgentCore] Sending input to Python: ${inputData.substring(0, 100)}...`);
          pythonProcess.stdin.write(inputData);
          pythonProcess.stdin.end();

          // 標準出力からJSON Linesを読み取り、SSEとして送信
          let buffer = '';
          pythonProcess.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 最後の不完全な行を保持

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const event = JSON.parse(line);
                  sendSSE(event);
                  console.log(`[AgentCore] Event: ${event.type} ${event.agentId || ''}`);
                } catch (err) {
                  console.error(`[AgentCore] Failed to parse line: ${line}`, err);
                }
              }
            }
          });

          // 標準エラー出力をログ
          pythonProcess.stderr.on('data', (data) => {
            console.error(`[AgentCore] Python stderr: ${data.toString()}`);
          });

          // プロセス終了時の処理
          pythonProcess.on('close', (code) => {
            console.log(`[AgentCore] Python process exited with code ${code}`);

            // 残りのバッファを処理
            if (buffer.trim()) {
              try {
                const event = JSON.parse(buffer);
                sendSSE(event);
              } catch (err) {
                console.error(`[AgentCore] Failed to parse final buffer: ${buffer}`, err);
              }
            }

            // ストリームを終了
            controller.close();
          });

          // エラーハンドリング
          pythonProcess.on('error', (err) => {
            console.error(`[AgentCore] Python process error:`, err);
            sendSSE({
              type: 'error',
              data: { error: err.message, code: 'PYTHON_PROCESS_ERROR' },
              timestamp: new Date().toISOString(),
            });
            controller.close();
          });

        } catch (error) {
          console.error('[AgentCore] Stream error:', error);
          sendSSE({
            type: 'error',
            data: { error: String(error), code: 'STREAM_ERROR' },
            timestamp: new Date().toISOString(),
          });
          controller.close();
        }
      },
    });

    // SSE レスポンスを返す
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[AgentCore] Request error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
