/**
 * MAGI Decision System - ストリーミングクライアント
 * 
 * このファイルはフロントエンドからストリーミングAPIを呼び出すためのクライアントです。
 * Server-Sent Eventsを受信し、リアルタイムでエージェント応答を処理します。
 * 
 * 主要機能:
 * - Server-Sent Events受信ロジック
 * - リアルタイムレスポンス処理
 * - エラーハンドリングとフォールバック
 * - TypeScript型安全性
 * 
 * 学習ポイント:
 * - EventSourceの使用方法
 * - ストリーミングデータの処理
 * - React Hooksとの統合
 */

export interface StreamMessage {
  type: 'start' | 'chunk' | 'mock' | 'complete' | 'error' | 'phase' | 'system' | 'agent_start' | 'agent_thinking' | 'agent_chunk' | 'agent_complete' | 'judge_thinking' | 'judge_chunk' | 'note';
  content?: string;
  message?: string;
  error?: string;
  agentId?: string;
  timestamp: string;
}

export interface StreamOptions {
  question: string;
  sessionId?: string;
  onMessage?: (message: StreamMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

/**
 * MAGI Decision System ストリーミングクライアント
 * 
 * 目的: フロントエンドからストリーミングAPIを呼び出し、リアルタイム応答を処理
 * 設計理由: ChatGPT並みのUX実現のため
 * 
 * @param options - ストリーミング設定オプション
 * @returns Promise<string> - 完全なレスポンステキスト
 * 
 * 使用例:
 * ```typescript
 * const response = await streamMAGIResponse({
 *   question: 'AIの倫理的課題について',
 *   onMessage: (msg) => console.log(msg),
 *   onError: (err) => console.error(err)
 * });
 * ```
 * 
 * 関連: src/app/api/magi/stream/route.ts, src/hooks/useMAGIStream.ts
 */
export async function streamMAGIResponse(options: StreamOptions): Promise<string> {
  const { question, sessionId, onMessage, onError, onComplete } = options;

  return new Promise((resolve, reject) => {
    let fullResponse = '';
    let eventSource: EventSource | null = null;

    try {
      // Server-Sent Events接続
      const url = new URL('/api/magi/stream', window.location.origin);
      
      // POSTリクエストのためにfetchを使用
      fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          sessionId: sessionId || `client-session-${Date.now()}`,
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        // ReadableStreamを処理
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        function readStream(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              onComplete?.();
              resolve(fullResponse);
              return;
            }

            // チャンクをデコード
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = line.slice(6); // 'data: ' を除去
                  if (data.trim()) {
                    const message: StreamMessage = JSON.parse(data);
                    
                    // メッセージタイプに応じた処理
                    switch (message.type) {
                      case 'start':
                      case 'phase':
                      case 'system':
                      case 'agent_start':
                      case 'agent_thinking':
                      case 'judge_thinking':
                      case 'note':
                        onMessage?.(message);
                        break;
                      
                      case 'chunk':
                      case 'agent_chunk':
                      case 'judge_chunk':
                        if (message.content) {
                          fullResponse += message.content;
                        }
                        onMessage?.(message);
                        break;
                      
                      case 'mock':
                        if (message.content) {
                          fullResponse = message.content;
                        }
                        onMessage?.(message);
                        break;
                      
                      case 'agent_complete':
                        onMessage?.(message);
                        break;
                      
                      case 'complete':
                        onMessage?.(message);
                        onComplete?.();
                        resolve(fullResponse);
                        return;
                      
                      case 'error':
                        const error = new Error(message.error || 'Unknown streaming error');
                        onError?.(error);
                        reject(error);
                        return;
                    }
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE message:', line, parseError);
                }
              }
            }

            // 次のチャンクを読み続ける
            return readStream();
          });
        }

        return readStream();
      })
      .catch(error => {
        console.error('Streaming error:', error);
        onError?.(error);
        reject(error);
      });

    } catch (error) {
      console.error('Stream setup error:', error);
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      reject(err);
    }
  });
}

/**
 * ストリーミング接続の中断
 * 
 * 目的: 長時間実行中のストリーミングを安全に中断
 * 
 * @param eventSource - 中断するEventSourceインスタンス
 */
export function abortStream(eventSource: EventSource | null) {
  if (eventSource) {
    eventSource.close();
  }
}

/**
 * ストリーミング状態の型定義
 */
export interface StreamState {
  isStreaming: boolean;
  currentMessage: string;
  error: Error | null;
  isComplete: boolean;
}

/**
 * 初期ストリーミング状態
 */
export const initialStreamState: StreamState = {
  isStreaming: false,
  currentMessage: '',
  error: null,
  isComplete: false,
};