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

// 環境変数からPythonスクリプトのパスを取得
const MAGI_SCRIPT_PATH = process.env.MAGI_SCRIPT_PATH || '/app/magi_agent.py';
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

export async function POST(request: NextRequest) {
  console.log('🔥 /invocations endpoint called');
  
  try {
    // リクエストボディを取得
    const body = await request.json();
    console.log('📥 Request payload:', JSON.stringify(body, null, 2));
    
    // ストリーミングレスポンスを作成
    const stream = new ReadableStream({
      start(controller) {
        console.log('🚀 Starting Python MAGI agent process...');
        
        // Pythonプロセスを起動
        const pythonProcess = spawn(PYTHON_PATH, [MAGI_SCRIPT_PATH], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            // AgentCore Runtime環境変数を設定しない（子プロセスなので）
            AGENTCORE_RUNTIME_PORT: undefined,
            AGENTCORE_RUNTIME_HOST: undefined,
          }
        });
        
        // 入力データをPythonプロセスに送信
        pythonProcess.stdin.write(JSON.stringify(body));
        pythonProcess.stdin.end();
        
        // Pythonプロセスの標準出力を処理
        pythonProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('📤 Python output:', output);
          
          // ストリーミングデータとしてクライアントに送信
          try {
            // JSON行ごとに分割して送信
            const lines = output.split('\n').filter((line: string) => line.trim());
            for (const line of lines) {
              if (line.trim()) {
                controller.enqueue(new TextEncoder().encode(`data: ${line}\n\n`));
              }
            }
          } catch (error) {
            console.error('❌ Error processing Python output:', error);
          }
        });
        
        // Pythonプロセスのエラー出力を処理
        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString();
          console.error('❌ Python error:', error);
          
          // エラーもストリーミングで送信
          const errorEvent = {
            type: 'error',
            data: { error: error.trim(), code: 'PYTHON_RUNTIME_ERROR' },
            timestamp: new Date().toISOString()
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
        });
        
        // Pythonプロセス終了時の処理
        pythonProcess.on('close', (code) => {
          console.log(`🏁 Python process exited with code ${code}`);
          
          if (code !== 0) {
            const errorEvent = {
              type: 'error',
              data: { error: `Python process exited with code ${code}`, code: 'PYTHON_EXECUTION_ERROR' },
              timestamp: new Date().toISOString()
            };
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          }
          
          // ストリーム終了
          controller.close();
        });
        
        // プロセス起動エラーの処理
        pythonProcess.on('error', (error) => {
          console.error('❌ Failed to start Python process:', error);
          
          const errorEvent = {
            type: 'error',
            data: { error: `Failed to start Python process: ${error.message}`, code: 'PYTHON_SPAWN_ERROR' },
            timestamp: new Date().toISOString()
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          controller.close();
        });
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