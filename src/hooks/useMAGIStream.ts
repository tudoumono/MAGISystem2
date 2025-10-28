/**
 * MAGI Decision System - ストリーミングReact Hook
 * 
 * このファイルはMAGIストリーミング機能をReactコンポーネントで使いやすくするカスタムフックです。
 * 状態管理とライフサイクル管理を自動化し、コンポーネントでの使用を簡素化します。
 * 
 * 主要機能:
 * - ストリーミング状態の管理
 * - 自動クリーンアップ
 * - エラーハンドリング
 * - TypeScript型安全性
 * 
 * 学習ポイント:
 * - カスタムReact Hooksの作成
 * - useEffect, useStateの活用
 * - ストリーミングAPIとReactの統合
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  streamMAGIResponse, 
  StreamMessage, 
  StreamState, 
  initialStreamState 
} from '@/lib/agents/stream-client';

export interface UseMAGIStreamOptions {
  onComplete?: (response: string) => void;
  onError?: (error: Error) => void;
  sessionId?: string;
}

export interface UseMAGIStreamReturn {
  streamState: StreamState;
  messages: StreamMessage[];
  startStream: (question: string) => Promise<void>;
  abortStream: () => void;
  clearMessages: () => void;
}

/**
 * MAGI Decision System ストリーミングReact Hook
 * 
 * 目的: MAGIストリーミング機能をReactコンポーネントで簡単に使用できるようにする
 * 設計理由: 状態管理とライフサイクル管理の自動化
 * 
 * @param options - フック設定オプション
 * @returns ストリーミング制御インターフェース
 * 
 * 使用例:
 * ```typescript
 * const { streamState, messages, startStream } = useMAGIStream({
 *   onComplete: (response) => console.log('完了:', response),
 *   onError: (error) => console.error('エラー:', error)
 * });
 * 
 * // ストリーミング開始
 * await startStream('AIの倫理的課題について');
 * ```
 * 
 * 関連: src/lib/agents/stream-client.ts, src/components/agents/MAGIChat.tsx
 */
export function useMAGIStream(options: UseMAGIStreamOptions = {}): UseMAGIStreamReturn {
  const { onComplete, onError, sessionId } = options;

  // ストリーミング状態管理
  const [streamState, setStreamState] = useState<StreamState>(initialStreamState);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  
  // 中断制御用のRef
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  /**
   * ストリーミング開始
   */
  const startStream = useCallback(async (question: string) => {
    if (isStreamingRef.current) {
      console.warn('Stream is already running');
      return;
    }

    // 前回の状態をクリア
    setStreamState(initialStreamState);
    setMessages([]);
    
    // 中断コントローラー作成
    abortControllerRef.current = new AbortController();
    isStreamingRef.current = true;

    // ストリーミング状態を開始に設定
    setStreamState(prev => ({
      ...prev,
      isStreaming: true,
      error: null,
      isComplete: false,
    }));

    try {
      const response = await streamMAGIResponse({
        question,
        sessionId: sessionId || `hook-session-${Date.now()}`,
        
        // メッセージ受信ハンドラー
        onMessage: (message: StreamMessage) => {
          setMessages(prev => [...prev, message]);
          
          // 現在のメッセージ内容を更新
          if (message.type === 'chunk' && message.content) {
            setStreamState(prev => ({
              ...prev,
              currentMessage: prev.currentMessage + message.content,
            }));
          } else if (message.type === 'mock' && message.content) {
            setStreamState(prev => ({
              ...prev,
              currentMessage: message.content || '',
            }));
          }
        },

        // エラーハンドラー
        onError: (error: Error) => {
          setStreamState(prev => ({
            ...prev,
            isStreaming: false,
            error,
            isComplete: false,
          }));
          onError?.(error);
        },

        // 完了ハンドラー
        onComplete: () => {
          setStreamState(prev => ({
            ...prev,
            isStreaming: false,
            error: null,
            isComplete: true,
          }));
          isStreamingRef.current = false;
        },
      });

      // 完了時のコールバック実行
      onComplete?.(response);

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown streaming error');
      
      setStreamState(prev => ({
        ...prev,
        isStreaming: false,
        error: err,
        isComplete: false,
      }));
      
      isStreamingRef.current = false;
      onError?.(err);
    }
  }, [onComplete, onError, sessionId]);

  /**
   * ストリーミング中断
   */
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    isStreamingRef.current = false;
    
    setStreamState(prev => ({
      ...prev,
      isStreaming: false,
      isComplete: false,
    }));
  }, []);

  /**
   * メッセージクリア
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamState(initialStreamState);
  }, []);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (isStreamingRef.current) {
        abortStream();
      }
    };
  }, [abortStream]);

  return {
    streamState,
    messages,
    startStream,
    abortStream,
    clearMessages,
  };
}