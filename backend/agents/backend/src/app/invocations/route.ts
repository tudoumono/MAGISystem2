/**
 * AgentCore Runtime /invocations エンドポイント
 * 
 * 🎯 PHASE 2 COMPLETE - WORKING BASELINE ✅
 * ===========================================
 * 
 * ✅ 動作確認済み (2025-11-06): 参考記事準拠のNext.js + Python統合パターンが完全動作
 * ✅ テスト結果: test_magi2.py で11.96秒、383イベント、3賢者完全動作を確認
 * ✅ ストリーミング: Server-Sent Events による完全なリアルタイムストリーミング
 * ✅ 3賢者システム: CASPAR/BALTHASAR/MELCHIOR が並列実行で正常動作
 * 
 * 🔄 ROLLBACK POINT: このファイルは動作確認済みベースライン
 * 問題が発生した場合は、このバージョンに戻すこと
 * 
 * 参考記事準拠アーキテクチャ:
 *   Amplify Hosting (Next.js Frontend)
 *       ↓ HTTP POST /invocations
 *   AgentCore Runtime (Docker Container)
 *       ├─ Next.jsバックエンド (ポート8080) ← このファイル
 *       │   ├─ POST /invocations ← 動作確認済み
 *       │   └─ GET /ping
 *       └─ Python magi_agent.py (子プロセス) ← 動作確認済み
 * 
 * このファイルはMAGI Pythonエージェントを子プロセスとして実行し、
 * ストリーミングレスポンスを返します。
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { getTimeoutConfig, exportPythonEnv } from '../../lib/config/timeout';

// 環境変数からPythonスクリプトのパスを取得
const MAGI_SCRIPT_PATH = process.env.MAGI_SCRIPT_PATH || '/app/magi_agent.py';
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

export async function POST(request: NextRequest) {
  console.log('🔥 /invocations endpoint called');
  
  try {
    // リクエストボディを取得
    const body = await request.json();
    console.log('📥 Request payload:', JSON.stringify(body, null, 2));
    
    // ⭐ タイムアウト設定をロード
    const timeoutConfig = getTimeoutConfig();
    console.log(`⏱️  Process timeout: ${timeoutConfig.processTimeoutMs}ms (${(timeoutConfig.processTimeoutMs / 1000).toFixed(1)}s)`);

    // ⭐⭐⭐ 変数をストリーム外で定義（cancelコールバックからアクセスできるようにする）
    let pythonProcess: ReturnType<typeof spawn> | null = null;
    let processTimeoutId: NodeJS.Timeout | null = null;
    let processCompleted = false;
    let streamClosed = false;

    // ストリーミングレスポンスを作成
    const stream = new ReadableStream({
      start(controller) {
        console.log('🚀 Starting Python MAGI agent process...');

        // Pythonプロセスを起動
        pythonProcess = spawn(PYTHON_PATH, [MAGI_SCRIPT_PATH], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            // ⭐ Python環境変数としてタイムアウト設定を渡す
            ...exportPythonEnv(timeoutConfig),
            // AgentCore Runtime環境変数を設定しない（子プロセスなので）
            AGENTCORE_RUNTIME_PORT: undefined,
            AGENTCORE_RUNTIME_HOST: undefined,
          }
        });

        // ⭐ ストリームのnullチェック（TypeScript strict mode対応）
        if (!pythonProcess.stdin || !pythonProcess.stdout || !pythonProcess.stderr) {
          throw new Error('Failed to create Python process streams');
        }

        // 入力データをPythonプロセスに送信
        pythonProcess.stdin.write(JSON.stringify(body));
        pythonProcess.stdin.end();

        // ⭐⭐⭐ TIMEOUT HANDLING - Layer 2: Next.js Process Monitor ⭐⭐⭐
        const startTime = Date.now();

        // プロセス監視タイムアウト設定
        processTimeoutId = setTimeout(() => {
          if (!processCompleted) {
            const elapsed = Date.now() - startTime;
            console.error(`❌ Python process TIMEOUT after ${elapsed}ms (limit: ${timeoutConfig.processTimeoutMs}ms)`);

            // タイムアウトイベントを送信
            const timeoutEvent = {
              type: 'error',
              data: {
                error: 'Python process timeout',
                code: 'PROCESS_TIMEOUT',
                timeout: timeoutConfig.processTimeoutMs,
                elapsed: elapsed
              },
              timestamp: new Date().toISOString()
            };

            try {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(timeoutEvent)}\n\n`));
            } catch (error) {
              console.error('❌ Error sending timeout event:', error);
            }

            // ⭐ Graceful shutdown: SIGTERM → SIGKILL
            if (pythonProcess && !pythonProcess.killed) {
              console.log('🛑 Sending SIGTERM to Python process...');
              pythonProcess.kill('SIGTERM');

              // SIGTERM後5秒待ってもプロセスが終了しない場合はSIGKILL
              setTimeout(() => {
                if (pythonProcess && !pythonProcess.killed) {
                  console.error('❌ Process did not respond to SIGTERM, sending SIGKILL...');
                  pythonProcess.kill('SIGKILL');
                }
              }, 5000); // 5秒待機
            }

            // ストリームを閉じる
            streamClosed = true;
            controller.close();
          }
        }, timeoutConfig.processTimeoutMs);

        // 不完全な行をバッファリングするための変数
        let buffer = '';

        // Pythonプロセスの標準出力を処理
        pythonProcess.stdout.on('data', (data) => {
          // バッファに追加
          buffer += data.toString();

          // 行ごとに分割
          const lines = buffer.split('\n');
          // 最後の要素は不完全な行の可能性があるため保持
          buffer = lines.pop() || '';

          // 完全な行のみ処理
          for (const line of lines) {
            if (line.trim()) {
              console.log('📤 Python output (complete line):', line);

              // ストリームが閉じられていない場合のみenqueue
              if (!streamClosed) {
                try {
                  controller.enqueue(new TextEncoder().encode(`data: ${line}\n\n`));
                } catch (error) {
                  console.error('❌ Error encoding line (stream may be closed):', error);
                  streamClosed = true; // Mark as closed to prevent further attempts
                }
              }
            }
          }
        });
        
        // Pythonプロセスのエラー出力を処理
        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString();
          console.error('❌ Python error:', error);

          // エラーもストリーミングで送信（ストリームが閉じられていない場合のみ）
          if (!streamClosed) {
            const errorEvent = {
              type: 'error',
              data: { error: error.trim(), code: 'PYTHON_RUNTIME_ERROR' },
              timestamp: new Date().toISOString()
            };
            try {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
            } catch (error) {
              console.error('❌ Error sending stderr event (stream may be closed):', error);
              streamClosed = true;
            }
          }
        });
        
        // Pythonプロセス終了時の処理
        pythonProcess.on('close', (code) => {
          // ⭐ プロセス完了フラグを設定してタイムアウトをクリア
          processCompleted = true;
          if (processTimeoutId) {
            clearTimeout(processTimeoutId);
            processTimeoutId = null;
          }

          const elapsed = Date.now() - startTime;
          console.log(`🏁 Python process exited with code ${code} (elapsed: ${elapsed}ms)`);

          // バッファに残っている不完全な行を処理
          if (buffer.trim() && !streamClosed) {
            console.log('📤 Flushing remaining buffer:', buffer);
            try {
              controller.enqueue(new TextEncoder().encode(`data: ${buffer}\n\n`));
            } catch (error) {
              console.error('❌ Error flushing buffer (stream may be closed):', error);
              streamClosed = true;
            }
          }

          if (code !== 0 && !streamClosed) {
            const errorEvent = {
              type: 'error',
              data: { error: `Python process exited with code ${code}`, code: 'PYTHON_EXECUTION_ERROR' },
              timestamp: new Date().toISOString()
            };
            try {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
            } catch (error) {
              console.error('❌ Error sending exit error event (stream may be closed):', error);
              streamClosed = true;
            }
          }

          // ストリーム終了
          if (!streamClosed) {
            streamClosed = true;
            controller.close();
          }
        });
        
        // プロセス起動エラーの処理
        pythonProcess.on('error', (error) => {
          console.error('❌ Failed to start Python process:', error);

          if (!streamClosed) {
            const errorEvent = {
              type: 'error',
              data: { error: `Failed to start Python process: ${error.message}`, code: 'PYTHON_SPAWN_ERROR' },
              timestamp: new Date().toISOString()
            };
            try {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
            } catch (error) {
              console.error('❌ Error sending spawn error event (stream may be closed):', error);
              streamClosed = true;
            }
          }

          if (!streamClosed) {
            streamClosed = true;
            controller.close();
          }
        });
      },

      // ⭐⭐⭐ CANCEL HANDLING - Client Disconnection ⭐⭐⭐
      cancel(reason) {
        console.log(`🚫 Client disconnected (reason: ${reason || 'unknown'})`);

        // タイムアウトをクリア（メモリリーク防止）
        if (processTimeoutId) {
          clearTimeout(processTimeoutId);
          processTimeoutId = null;
        }

        // Pythonプロセスを終了
        if (pythonProcess && !pythonProcess.killed) {
          console.log('🛑 Terminating Python process due to client disconnection...');

          // フラグを設定してタイムアウトハンドラとの競合を防止
          processCompleted = true;
          streamClosed = true;

          // SIGTERM送信
          pythonProcess.kill('SIGTERM');

          // 5秒後にSIGKILLで強制終了（プロセスが応答しない場合）
          setTimeout(() => {
            if (pythonProcess && !pythonProcess.killed) {
              console.error('❌ Process did not respond to SIGTERM, sending SIGKILL...');
              pythonProcess.kill('SIGKILL');
            }
          }, 5000);
        }
      }
    });

    // Server-Sent Eventsヘッダーでレスポンス
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    });
    
  } catch (error) {
    console.error('❌ /invocations endpoint error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// OPTIONSメソッド（CORS対応）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}