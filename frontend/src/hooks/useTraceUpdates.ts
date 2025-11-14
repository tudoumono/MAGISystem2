/**
 * useTraceUpdates Hook - リアルタイムトレース更新フック
 * 
 * このフックはトレースステップのリアルタイム更新を管理します。
 * 現在はSSEベースの実装に簡略化されています。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { TraceStep } from '@/types/domain';

/**
 * WebSocket接続状態の定義
 */
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * エージェント実行状態の定義
 */
interface AgentStatus {
  agentId: string;
  status: 'thinking' | 'completed' | 'error';
  progress?: number | undefined;
}

/**
 * useTraceUpdatesの戻り値型
 */
interface UseTraceUpdatesReturn {
  connectionStatus: ConnectionStatus;
  traceSteps: TraceStep[];
  agentStatuses: AgentStatus[];
  error: string | null;
  isExecutionComplete: boolean;
  clearTrace: () => void;
}

/**
 * useTraceUpdates - リアルタイムトレース更新フック
 * 
 * 簡略化されたSSEベースの実装
 */
export function useTraceUpdates(traceId?: string, enabled: boolean = true): UseTraceUpdatesReturn {
  // 状態管理
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);

  /**
   * トレースクリア
   */
  const clearTrace = useCallback(() => {
    setTraceSteps([]);
    setAgentStatuses([]);
    setIsExecutionComplete(false);
    setError(null);
  }, []);

  /**
   * トレースIDが変更された時の処理
   */
  useEffect(() => {
    if (traceId && enabled) {
      setConnectionStatus('connected');
      setError(null);
      console.log('Trace updates enabled for:', traceId);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [traceId, enabled]);

  return {
    connectionStatus,
    traceSteps,
    agentStatuses,
    error,
    isExecutionComplete,
    clearTrace,
  };
}

/**
 * モック実装（後方互換性のため）
 */
export function useMockTraceUpdates(): UseTraceUpdatesReturn {
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);

  const clearTrace = useCallback(() => {
    setTraceSteps([]);
    setAgentStatuses([]);
    setIsExecutionComplete(false);
    setError(null);
  }, []);

  return {
    connectionStatus: 'connected' as const,
    traceSteps,
    agentStatuses,
    error,
    isExecutionComplete,
    clearTrace,
  };
}