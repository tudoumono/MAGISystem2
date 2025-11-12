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
  startStreaming: (question: string, conversationId: string, agentConfigs?: any) => Promise<void>;
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
  const startStreaming = useCallback(async (question: string, conversationId: string, agentConfigs?: any) => {
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
      // 参考記事準拠: AgentCore Runtime の /invocations エンドポイントを直接呼び出し
      const agentCoreUrl = process.env.NEXT_PUBLIC_AGENTCORE_URL || 'http://localhost:8080';

      // ⭐ 環境変数の検証と警告
      if (!process.env.NEXT_PUBLIC_AGENTCORE_URL) {
        console.warn('⚠️ NEXT_PUBLIC_AGENTCORE_URL is not set - using fallback:', agentCoreUrl);
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          console.error('❌ CRITICAL: NEXT_PUBLIC_AGENTCORE_URL must be set in production!');
          console.error('📖 See: docs/03-deployment/AMPLIFY_HOSTING_ENV_VARS.md');
        }
      }

      console.log(`🔗 Connecting to AgentCore Runtime: ${agentCoreUrl}/api/invocations`);

      const response = await fetch(`${agentCoreUrl}/api/invocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          sessionId: conversationId,
          agentConfigs, // プリセット設定を送信
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // レスポンスボディをストリームとして読み取る
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // ストリームを読み取る
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          break;
        }

        // チャンクをデコード
        buffer += decoder.decode(value, { stream: true });
        
        // 改行で分割してイベントを処理
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最後の不完全な行を保持

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6); // 'data: ' を削除
              const streamEvent: StreamEvent = JSON.parse(data);
              handleStreamEvent(streamEvent);
            } catch (error) {
              console.error('Failed to parse stream event:', error, 'Raw data:', line);
            }
          }
        }
      }

    } catch (error) {
      // ⭐ AbortErrorの場合は状態をリセットしない（新しいストリームが開始された可能性がある）
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted (likely replaced by new request)');
        return; // 状態を更新せず、新しいストリームが続行できるようにする
      }

      console.error('Failed to start streaming:', error);

      // ⭐ より詳細なエラーメッセージ
      let errorMessage = 'ストリーミング開始エラー';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'AgentCore Runtimeに接続できません。環境変数 NEXT_PUBLIC_AGENTCORE_URL が正しく設定されているか確認してください。';
          console.error('❌ Connection failed. Check NEXT_PUBLIC_AGENTCORE_URL environment variable.');
          console.error('📖 Documentation: docs/03-deployment/AMPLIFY_HOSTING_ENV_VARS.md');
        } else {
          errorMessage = error.message;
        }
      }

      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        error: new Error(errorMessage)
      }));
    }
  }, []);

  /**
   * ストリーミングイベントの処理
   */
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    console.log('Processing stream event:', event.type, event.agentId, event.data);
    switch (event.type) {
      case 'agent_start':
        // エージェント開始
        if (event.agentId) {
          const agentId = event.agentId;
          console.log('Agent started:', agentId);
          setStreamingState(prev => {
            const newState = {
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
            };
            console.log('Updated state for agent_start:', newState);
            return newState;
          });
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
        if (event.agentId) {
          setStreamingState(prev => {
            const newContent = (prev.agentResponses[event.agentId!]?.content || '') + event.data.text;
            const newState = {
              ...prev,
              agentResponses: {
                ...prev.agentResponses,
                [event.agentId!]: {
                  ...prev.agentResponses[event.agentId!],
                  content: newContent
                }
              }
            };
            // ログを削減（パフォーマンス向上）
            if (newContent.length % 10 === 0) {
              console.log(`Agent ${event.agentId} chunk update:`, newContent.length, 'chars');
            }
            return newState;
          });
        }
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
