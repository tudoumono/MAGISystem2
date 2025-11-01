/**
 * useStreamingAgent Hook - エージェントストリーミング実行
 * 
 * Server-Sent Events (SSE)を使用してエージェントの応答をリアルタイムで受信します。
 * 各エージェントの思考プロセスと回答を段階的に表示することで、
 * ユーザーに待機時間を感じさせない優れた体験を提供します。
 * 
 * 目的:
 * - エージェント応答のストリーミング受信
 * - 各エージェントの段階的更新
 * - 思考プロセスのリアルタイム表示
 * - エラーハンドリングと再接続
 * 
 * 設計理由:
 * - SSEによる効率的なストリーミング
 * - 各エージェントの独立した更新
 * - メモリ効率の良いチャンク処理
 * - ユーザー体験の大幅な改善
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { AgentResponse, JudgeResponse } from '@/lib/amplify/types';

/**
 * ストリーミングイベントの型定義
 */
interface StreamEvent {
  type: 'agent_start' | 'agent_thinking' | 'agent_chunk' | 'agent_complete' | 'judge_start' | 'judge_chunk' | 'judge_complete' | 'error' | 'complete';
  agentId?: string;
  data?: any;
  error?: string;
}

/**
 * ストリーミング状態の型定義
 */
interface StreamingState {
  isStreaming: boolean;
  currentAgent: string | null;
  agentResponses: Partial<Record<string, Partial<AgentResponse>>>;
  judgeResponse: Partial<JudgeResponse> | null;
  error: Error | null;
}

/**
 * フックの戻り値型定義
 */
interface UseStreamingAgentReturn {
  streamingState: StreamingState;
  startStreaming: (question: string, conversationId: string) => Promise<void>;
  stopStreaming: () => void;
}

/**
 * useStreamingAgent Hook Implementation
 */
export function useStreamingAgent(): UseStreamingAgentReturn {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentAgent: null,
    agentResponses: {},
    judgeResponse: null,
    error: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * ストリーミングの開始
   */
  const startStreaming = useCallback(async (question: string, conversationId: string) => {
    // 既存のストリーミングを停止
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController();

    // 状態をリセット
    setStreamingState({
      isStreaming: true,
      currentAgent: null,
      agentResponses: {},
      judgeResponse: null,
      error: null
    });

    try {
      // SSEエンドポイントに接続
      const url = new URL('/api/bedrock-agents/stream', window.location.origin);
      url.searchParams.set('question', question);
      url.searchParams.set('conversationId', conversationId);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      // メッセージイベントのハンドリング
      eventSource.onmessage = (event) => {
        try {
          const streamEvent: StreamEvent = JSON.parse(event.data);
          handleStreamEvent(streamEvent);
        } catch (error) {
          console.error('Failed to parse stream event:', error);
        }
      };

      // エラーハンドリング
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          error: new Error('ストリーミング接続エラー')
        }));
        eventSource.close();
      };

    } catch (error) {
      console.error('Failed to start streaming:', error);
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error : new Error('ストリーミング開始エラー')
      }));
    }
  }, []);

  /**
   * ストリーミングイベントの処理
   */
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'agent_start':
        // エージェント開始
        if (event.agentId) {
          const agentId = event.agentId;
          setStreamingState(prev => ({
            ...prev,
            currentAgent: agentId,
            agentResponses: {
              ...prev.agentResponses,
              [agentId]: {
                agentId: agentId as any,
                content: '',
                reasoning: '',
                confidence: 0
              }
            }
          }));
        }
        break;

      case 'agent_thinking':
        // 思考プロセスの更新
        setStreamingState(prev => ({
          ...prev,
          agentResponses: {
            ...prev.agentResponses,
            [event.agentId!]: {
              ...prev.agentResponses[event.agentId!],
              reasoning: (prev.agentResponses[event.agentId!]?.reasoning || '') + event.data.text
            }
          }
        }));
        break;

      case 'agent_chunk':
        // エージェント応答のチャンク
        setStreamingState(prev => ({
          ...prev,
          agentResponses: {
            ...prev.agentResponses,
            [event.agentId!]: {
              ...prev.agentResponses[event.agentId!],
              content: (prev.agentResponses[event.agentId!]?.content || '') + event.data.text
            }
          }
        }));
        break;

      case 'agent_complete':
        // エージェント完了
        setStreamingState(prev => ({
          ...prev,
          agentResponses: {
            ...prev.agentResponses,
            [event.agentId!]: {
              ...prev.agentResponses[event.agentId!],
              ...event.data,
              decision: event.data.decision,
              confidence: event.data.confidence,
              executionTime: event.data.executionTime
            }
          }
        }));
        break;

      case 'judge_start':
        // SOLOMON Judge開始
        setStreamingState(prev => ({
          ...prev,
          currentAgent: 'solomon',
          judgeResponse: {
            summary: '',
            reasoning: ''
          }
        }));
        break;

      case 'judge_chunk':
        // SOLOMON Judgeのチャンク
        setStreamingState(prev => ({
          ...prev,
          judgeResponse: {
            ...prev.judgeResponse,
            summary: (prev.judgeResponse?.summary || '') + event.data.text
          }
        }));
        break;

      case 'judge_complete':
        // SOLOMON Judge完了
        setStreamingState(prev => ({
          ...prev,
          judgeResponse: {
            ...prev.judgeResponse,
            ...event.data
          }
        }));
        break;

      case 'complete':
        // 全体完了
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          currentAgent: null
        }));
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        break;

      case 'error':
        // エラー
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          error: new Error(event.error || 'ストリーミングエラー')
        }));
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        break;
    }
  }, []);

  /**
   * ストリーミングの停止
   */
  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingState(prev => ({
      ...prev,
      isStreaming: false,
      currentAgent: null
    }));
  }, []);

  return {
    streamingState,
    startStreaming,
    stopStreaming
  };
}
