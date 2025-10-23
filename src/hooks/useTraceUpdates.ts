/**
 * useTraceUpdates Hook - リアルタイムトレース更新フック
 * 
 * このフックはWebSocket接続を通じてリアルタイムでトレースステップを受信し、
 * UIコンポーネントに段階的な更新を提供します。
 * 
 * 設計理由:
 * - WebSocket接続の抽象化とライフサイクル管理
 * - エラーハンドリングと自動再接続
 * - 型安全なメッセージ処理
 * - React Suspenseとの統合準備
 * 
 * 学習ポイント:
 * - WebSocket APIの使用方法
 * - React hooksでの非同期処理管理
 * - エラー境界とフォールバック処理
 * - TypeScriptでの型安全なWebSocket通信
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TraceStep } from '@/types/domain';
import { 
  WebSocketMessageType,
  TraceStepUpdateMessage,
  AgentStatusUpdateMessage,
  ExecutionCompleteMessage,
  ErrorMessage,
  isTraceStepUpdateMessage,
  isAgentStatusUpdateMessage,
  isExecutionCompleteMessage,
  isErrorMessage
} from '@/types/api';

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
 * フックの戻り値の型定義
 */
interface UseTraceUpdatesReturn {
  // 接続状態
  connectionStatus: ConnectionStatus;
  
  // トレースデータ
  traceSteps: TraceStep[];
  agentStatuses: AgentStatus[];
  
  // 制御関数
  startTracing: (traceId: string) => void;
  stopTracing: () => void;
  clearTrace: () => void;
  
  // エラー情報
  error: string | null;
  
  // 実行状態
  isExecutionComplete: boolean;
}

/**
 * WebSocket設定
 */
interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001/trace',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
};

/**
 * useTraceUpdates - リアルタイムトレース更新フック
 * 
 * 機能:
 * - WebSocket接続の確立と管理
 * - トレースステップのリアルタイム受信
 * - エージェント状態の更新
 * - 自動再接続とエラーハンドリング
 * - 実行完了の検出
 * 
 * 要件対応:
 * - 4.1: ライブトレース更新用WebSocket接続
 * - 4.2: 到着時の段階的トレースステップレンダリング
 * - 4.6: トレース完了状態と進行状況インジケーター
 */
export function useTraceUpdates(config: WebSocketConfig = {}): UseTraceUpdatesReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 状態管理
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);
  const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);
  
  // WebSocket参照
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  /**
   * WebSocketメッセージの処理
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // メッセージタイプの検証
      if (!data || typeof data !== 'object' || !data.type || !data.timestamp) {
        console.warn('Invalid WebSocket message format:', data);
        return;
      }

      const message = data as WebSocketMessageType;

      // トレースステップ更新
      if (isTraceStepUpdateMessage(message)) {
        handleTraceStepUpdate(message);
      }
      // エージェント状態更新
      else if (isAgentStatusUpdateMessage(message)) {
        handleAgentStatusUpdate(message);
      }
      // 実行完了
      else if (isExecutionCompleteMessage(message)) {
        handleExecutionComplete(message);
      }
      // エラーメッセージ
      else if (isErrorMessage(message)) {
        handleErrorMessage(message);
      }
      else {
        console.warn('Unknown message type:', (message as any).type);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
      setError('メッセージの解析に失敗しました');
    }
  }, []);

  /**
   * トレースステップ更新の処理
   */
  const handleTraceStepUpdate = useCallback((message: TraceStepUpdateMessage) => {
    // 現在のトレースIDと一致する場合のみ更新
    if (message.traceId === currentTraceId) {
      setTraceSteps(prev => {
        // 重複チェック
        const exists = prev.some(step => step.id === message.step.id);
        if (exists) {
          return prev;
        }
        
        // ステップ番号順にソート
        const newSteps = [...prev, message.step];
        return newSteps.sort((a, b) => a.stepNumber - b.stepNumber);
      });
    }
  }, [currentTraceId]);

  /**
   * エージェント状態更新の処理
   */
  const handleAgentStatusUpdate = useCallback((message: AgentStatusUpdateMessage) => {
    setAgentStatuses(prev => {
      const existingIndex = prev.findIndex(status => status.agentId === message.agentId);
      
      const newStatus: AgentStatus = {
        agentId: message.agentId,
        status: message.status,
        progress: message.progress ?? undefined,
      };
      
      if (existingIndex >= 0) {
        const newStatuses = [...prev];
        newStatuses[existingIndex] = newStatus;
        return newStatuses;
      } else {
        return [...prev, newStatus];
      }
    });
  }, []);

  /**
   * 実行完了の処理
   */
  const handleExecutionComplete = useCallback((message: ExecutionCompleteMessage) => {
    if (message.traceId === currentTraceId) {
      setIsExecutionComplete(true);
      
      // 最終的なエージェント状態を更新
      setAgentStatuses(prev => 
        prev.map(status => ({
          ...status,
          status: 'completed' as const,
          progress: 100
        }))
      );
    }
  }, [currentTraceId]);

  /**
   * エラーメッセージの処理
   */
  const handleErrorMessage = useCallback((message: ErrorMessage) => {
    setError(message.error.message);
    
    // エラーに関連するエージェントの状態を更新
    if (message.error.traceId === currentTraceId) {
      setAgentStatuses(prev => 
        prev.map(status => ({
          ...status,
          status: 'error' as const
        }))
      );
    }
  }, [currentTraceId]);

  /**
   * WebSocket接続の確立
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(finalConfig.url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // ハートビート開始
        startHeartbeat();
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        stopHeartbeat();
        
        // 自動再接続（意図的な切断でない場合）
        if (event.code !== 1000 && reconnectAttemptsRef.current < finalConfig.maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setError('WebSocket接続エラーが発生しました');
      };

    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setConnectionStatus('error');
      setError('WebSocket接続の作成に失敗しました');
    }
  }, [finalConfig.url, handleMessage]);

  /**
   * 再接続のスケジュール
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttemptsRef.current++;
    console.log(`Reconnecting in ${finalConfig.reconnectInterval}ms (attempt ${reconnectAttemptsRef.current})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, finalConfig.reconnectInterval);
  }, [connect, finalConfig.reconnectInterval]);

  /**
   * ハートビートの開始
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: new Date() }));
      }
    }, finalConfig.heartbeatInterval);
  }, [finalConfig.heartbeatInterval]);

  /**
   * ハートビートの停止
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * WebSocket接続の切断
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, [stopHeartbeat]);

  /**
   * トレース開始
   */
  const startTracing = useCallback((traceId: string) => {
    setCurrentTraceId(traceId);
    setTraceSteps([]);
    setAgentStatuses([]);
    setIsExecutionComplete(false);
    setError(null);

    // WebSocket接続が確立されていない場合は接続
    if (connectionStatus === 'disconnected') {
      connect();
    }

    // トレース開始メッセージを送信
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'start_trace',
        traceId,
        timestamp: new Date()
      }));
    }
  }, [connectionStatus, connect]);

  /**
   * トレース停止
   */
  const stopTracing = useCallback(() => {
    if (currentTraceId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_trace',
        traceId: currentTraceId,
        timestamp: new Date()
      }));
    }

    setCurrentTraceId(null);
    setIsExecutionComplete(true);
  }, [currentTraceId]);

  /**
   * トレースクリア
   */
  const clearTrace = useCallback(() => {
    setTraceSteps([]);
    setAgentStatuses([]);
    setIsExecutionComplete(false);
    setError(null);
    setCurrentTraceId(null);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    traceSteps,
    agentStatuses,
    startTracing,
    stopTracing,
    clearTrace,
    error,
    isExecutionComplete,
  };
}

/**
 * Phase 1-2用のモックWebSocket実装
 * 
 * 実際のWebSocket接続の代わりにモックデータを使用します。
 * Phase 3以降で実際のWebSocket実装に切り替えます。
 */
export function useMockTraceUpdates(): UseTraceUpdatesReturn {
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);

  const startTracing = useCallback(async (traceId: string) => {
    setCurrentTraceId(traceId);
    setTraceSteps([]);
    setAgentStatuses([]);
    setIsExecutionComplete(false);
    setError(null);

    // モックデータを使用してリアルタイム更新をシミュレート
    const { simulateRealTimeTrace } = await import('@/lib/trace/mock-trace-data');
    
    try {
      const traceGenerator = simulateRealTimeTrace(traceId, 'standard');
      
      for await (const step of traceGenerator) {
        setTraceSteps(prev => [...prev, step]);
        
        // エージェント状態も更新
        setAgentStatuses(prev => {
          const existingIndex = prev.findIndex(status => status.agentId === step.agentId);
          const newStatus: AgentStatus = {
            agentId: step.agentId,
            status: step.action.includes('完了') ? 'completed' : 'thinking',
            progress: step.action.includes('完了') ? 100 : undefined,
          };
          
          if (existingIndex >= 0) {
            const newStatuses = [...prev];
            newStatuses[existingIndex] = newStatus;
            return newStatuses;
          } else {
            return [...prev, newStatus];
          }
        });
      }
      
      setIsExecutionComplete(true);
    } catch (err) {
      setError('モックトレースの実行に失敗しました');
      console.error('Mock trace error:', err);
    }
  }, []);

  const stopTracing = useCallback(() => {
    setCurrentTraceId(null);
    setIsExecutionComplete(true);
  }, []);

  const clearTrace = useCallback(() => {
    setTraceSteps([]);
    setAgentStatuses([]);
    setIsExecutionComplete(false);
    setError(null);
    setCurrentTraceId(null);
  }, []);

  return {
    connectionStatus: 'connected', // モックでは常に接続状態
    traceSteps,
    agentStatuses,
    startTracing,
    stopTracing,
    clearTrace,
    error,
    isExecutionComplete,
  };
}