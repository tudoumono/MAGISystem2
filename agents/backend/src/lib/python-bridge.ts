/**
 * Python Bridge - Next.js to Python Communication
 * 
 * このファイルはNext.jsからPythonエージェントを呼び出すためのブリッジです。
 * 子プロセスとしてPythonスクリプトを実行し、ストリーミング出力を処理します。
 */

import { spawn, ChildProcess } from 'child_process';
import { MAGIRequest, StreamEvent, MAGIError } from '../types/magi';

export class PythonBridge {
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    // Dockerコンテナ内のパス設定
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = process.env.MAGI_SCRIPT_PATH || '/app/magi_agent.py';
  }

  /**
   * MAGIエージェントを実行してストリーミング結果を返す
   */
  executeMAGI(request: MAGIRequest): AsyncGenerator<StreamEvent, void, unknown> {
    return this.streamPythonExecution(request);
  }

  /**
   * Pythonプロセスを起動してストリーミング出力を処理
   */
  private async *streamPythonExecution(request: MAGIRequest): AsyncGenerator<StreamEvent, void, unknown> {
    let pythonProcess: ChildProcess | null = null;
    
    try {
      console.log('🐍 Starting Python MAGI process...');
      
      // Pythonプロセス起動
      pythonProcess = spawn(this.pythonPath, [this.scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          MAGI_REQUEST: JSON.stringify(request),
          PYTHONUNBUFFERED: '1',  // バッファリング無効化
          PYTHONIOENCODING: 'utf-8'  // UTF-8エンコーディング強制（Windows対応）
        }
      });

      if (!pythonProcess.stdout || !pythonProcess.stderr) {
        throw new Error('Failed to create Python process streams');
      }

      // 開始イベントを送信
      yield {
        type: 'start',
        data: {
          message: 'MAGI decision process started',
          sessionId: request.sessionId,
          question: request.question
        },
        timestamp: new Date().toISOString()
      };

      // ストリーミング処理のためのPromiseベース実装
      const events: StreamEvent[] = [];
      let processCompleted = false;
      let buffer = '';

      // 標準出力の処理
      pythonProcess.stdout.on('data', (data: Buffer) => {
        buffer += data.toString();
        
        // 行ごとに処理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最後の不完全な行は保持
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = this.parseStreamEvent(line);
              if (event) {
                events.push(event);
              }
            } catch (error) {
              console.error('Failed to parse stream event:', line, error);
            }
          }
        }
      });

      // エラー出力の処理
      pythonProcess.stderr.on('data', (data: Buffer) => {
        const errorText = data.toString();
        console.error('Python stderr:', errorText);
        
        // 重要なエラーはイベントとして送信
        if (errorText.includes('ERROR') || errorText.includes('Exception')) {
          events.push({
            type: 'error',
            data: {
              error: errorText,
              code: 'PYTHON_RUNTIME_ERROR'
            },
            timestamp: new Date().toISOString()
          });
        }
      });

      // プロセス終了の監視
      const processPromise = new Promise<void>((resolve, reject) => {
        pythonProcess!.on('close', (code) => {
          processCompleted = true;
          if (code === 0) {
            console.log('✅ Python process completed successfully');
            resolve();
          } else {
            console.error(`❌ Python process exited with code ${code}`);
            reject(new Error(`Python process exited with code ${code}`));
          }
        });

        pythonProcess!.on('error', (error) => {
          processCompleted = true;
          console.error('❌ Python process error:', error);
          reject(error);
        });
      });

      // イベントを順次yield（ポーリング方式）
      while (!processCompleted) {
        // 蓄積されたイベントを順次送信
        while (events.length > 0) {
          const event = events.shift()!;
          yield event;
        }
        
        // 短時間待機
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // プロセス完了を待機
      await processPromise;

      // 残りのイベントを送信
      while (events.length > 0) {
        const event = events.shift()!;
        yield event;
      }

      // 完了イベントを送信
      yield {
        type: 'complete',
        data: {
          message: 'MAGI decision process completed',
          sessionId: request.sessionId
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Python execution error:', error);
      
      // エラーイベントを送信
      yield {
        type: 'error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'PYTHON_EXECUTION_ERROR'
        },
        timestamp: new Date().toISOString()
      };
    } finally {
      // プロセスのクリーンアップ
      if (pythonProcess && !pythonProcess.killed) {
        console.log('🧹 Cleaning up Python process...');
        pythonProcess.kill('SIGTERM');
        
        // 強制終了のタイムアウト
        setTimeout(() => {
          if (pythonProcess && !pythonProcess.killed) {
            pythonProcess.kill('SIGKILL');
          }
        }, 5000);
      }
    }
  }

  /**
   * Python出力行をStreamEventにパース
   */
  private parseStreamEvent(line: string): StreamEvent | null {
    try {
      // JSON形式の出力を期待
      const parsed = JSON.parse(line);
      
      if (parsed.type && parsed.data) {
        return {
          type: parsed.type,
          data: parsed.data,
          timestamp: parsed.timestamp || new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      // JSON以外の出力は無視（デバッグ出力など）
      return null;
    }
  }

  /**
   * ヘルスチェック - Pythonスクリプトの動作確認
   */
  async healthCheck(): Promise<boolean> {
    try {
      const process = spawn(this.pythonPath, ['-c', 'print("OK")'], {
        stdio: 'pipe'
      });

      return new Promise<boolean>((resolve) => {
        let output = '';
        
        process.stdout?.on('data', (data) => {
          output += data.toString();
        });

        process.on('close', (code) => {
          resolve(code === 0 && output.trim() === 'OK');
        });

        process.on('error', () => {
          resolve(false);
        });

        // 5秒でタイムアウト
        setTimeout(() => {
          process.kill();
          resolve(false);
        }, 5000);
      });
    } catch (error) {
      return false;
    }
  }
}