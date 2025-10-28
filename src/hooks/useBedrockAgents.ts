/**
 * Bedrock Multi-Agent Collaboration React Hook
 * 
 * このファイルはReactコンポーネントでBedrock Multi-Agent Collaborationを
 * 使用するためのカスタムフックです。
 * 
 * 主要機能:
 * - MAGI Decision Systemの実行
 * - 実行状態の管理
 * - エラーハンドリング
 * - リアルタイム更新
 * 
 * 学習ポイント:
 * - React Hooksの設計パターン
 * - 非同期状態管理
 * - エラーハンドリング戦略
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  AskAgentRequest, 
  AskAgentResponse, 
  APIError 
} from '@/types/api';
import { 
  AgentConfig, 
  AgentResponse, 
  JudgeResponse 
} from '@/types/domain';
import { executeMAGIWithOrchestrator } from '@/lib/agents/orchestration';

/**
 * Hook の状態型定義
 */
interface UseBedrockAgentsState {
  // 実行状態
  isExecuting: boolean;
  isCompleted: boolean;
  hasError: boolean;
  
  // 結果データ
  response: AskAgentResponse | null;
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse | null;
  
  // エラー情報
  error: APIError | null;
  
  // 実行メタデータ
  executionTime: number;
  traceId: string | null;
  
  // 進行状況
  progress: {
    currentStep: string;
    completedSteps: string[];
    totalSteps: number;
  };
}

/**
 * Hook のオプション型定義
 */
interface UseBedrockAgentsOptions {
  // 自動リトライ設定
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  
  // キャッシュ設定
  useCache?: boolean;
  cacheTimeout?: number;
  
  // タイムアウト設定
  timeout?: number;
  
  // コールバック関数
  onStart?: () => void;
  onProgress?: (step: string) => void;
  onComplete?: (response: AskAgentResponse) => void;
  onError?: (error: APIError) => void;
}

/**
 * Bedrock Multi-Agent Collaboration Hook
 * 
 * 設計理由:
 * - 状態管理の一元化
 * - 再利用可能なロジック
 * - エラーハンドリングの統一
 * 
 * 学習ポイント:
 * - カスタムフックの実装パターン
 * - 非同期処理の状態管理
 * - useCallback と useRef の活用
 */
export function useBedrockAgents(options: UseBedrockAgentsOptions = {}) {
  const {
    autoRetry = true,
    maxRetries = 2,
    retryDelay = 1000,
    useCache = true,
    timeout = 60000,
    onStart,
    onProgress,
    onComplete,
    onError,
  } = options;

  // 状態管理
  const [state, setState] = useState<UseBedrockAgentsState>({
    isExecuting: false,
    isCompleted: false,
    hasError: false,
    response: null,
    agentResponses: [],
    judgeResponse: null,
    error: null,
    executionTime: 0,
    traceId: null,
    progress: {
      currentStep: '',
      completedSteps: [],
      totalSteps: 5, // SOLOMON初期化 → 3賢者実行 → SOLOMON評価
    },
  });

  // 実行制御用のRef
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  /**
   * 状態のリセット
   */
  const resetState = useCallback(() => {
    setState({
      isExecuting: false,
      isCompleted: false,
      hasError: false,
      response: null,
      agentResponses: [],
      judgeResponse: null,
      error: null,
      executionTime: 0,
      traceId: null,
      progress: {
        currentStep: '',
        completedSteps: [],
        totalSteps: 5,
      },
    });
    retryCountRef.current = 0;
  }, []);

  /**
   * 進行状況の更新
   */
  const updateProgress = useCallback((step: string) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        currentStep: step,
        completedSteps: [...prev.progress.completedSteps, step],
      },
    }));
    onProgress?.(step);
  }, [onProgress]);

  /**
   * MAGI Decision Systemの実行
   * 
   * 設計理由:
   * - 統一されたエントリーポイント
   * - 自動リトライとエラーハンドリング
   * - 進行状況の追跡
   * 
   * 学習ポイント:
   * - useCallback による最適化
   * - AbortController による実行制御
   * - エラー分類と適切な処理
   */
  const executeMAGI = useCallback(async (
    message: string,
    conversationId?: string,
    customConfig?: AgentConfig[]
  ): Promise<AskAgentResponse | null> => {
    // 既存の実行をキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController();
    
    // 状態をリセット
    resetState();
    
    // 実行開始
    setState(prev => ({ ...prev, isExecuting: true }));
    onStart?.();

    const startTime = Date.now();

    try {
      // 1. SOLOMON初期化
      updateProgress('SOLOMON Supervisor Agent初期化中...');
      await new Promise(resolve => setTimeout(resolve, 300)); // UI更新のための待機

      // 2. 3賢者への委託準備
      updateProgress('3賢者への質問委託準備中...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // 3. エージェント実行
      updateProgress('3賢者による並列分析実行中...');
      
      const response = await executeMAGIWithOrchestrator(
        message,
        conversationId,
        customConfig
      );

      // 4. SOLOMON評価
      updateProgress('SOLOMON Judgeによる統合評価中...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // 5. 完了
      updateProgress('MAGI Decision System実行完了');

      const executionTime = Date.now() - startTime;

      // 成功時の状態更新
      setState(prev => ({
        ...prev,
        isExecuting: false,
        isCompleted: true,
        hasError: false,
        response,
        agentResponses: response.agentResponses,
        judgeResponse: response.judgeResponse,
        executionTime,
        traceId: response.traceId,
      }));

      onComplete?.(response);
      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const apiError = error as APIError;

      console.error('Bedrock Agents Hook: Execution failed', {
        error: apiError,
        retryCount: retryCountRef.current,
        executionTime,
      });

      // リトライ判定
      if (autoRetry && 
          retryCountRef.current < maxRetries && 
          apiError.retryable !== false) {
        
        retryCountRef.current++;
        console.log(`Bedrock Agents Hook: Retrying (${retryCountRef.current}/${maxRetries})`);
        
        // リトライ前の待機
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, retryCountRef.current - 1))
        );
        
        // リトライ実行
        return executeMAGI(message, conversationId, customConfig);
      }

      // エラー時の状態更新
      setState(prev => ({
        ...prev,
        isExecuting: false,
        isCompleted: false,
        hasError: true,
        error: apiError,
        executionTime,
      }));

      onError?.(apiError);
      return null;
    }
  }, [
    autoRetry,
    maxRetries,
    retryDelay,
    resetState,
    updateProgress,
    onStart,
    onComplete,
    onError,
  ]);

  /**
   * 実行のキャンセル
   */
  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isExecuting: false,
      error: {
        error: 'Cancelled',
        message: '実行がキャンセルされました',
        code: 'EXECUTION_CANCELLED',
        timestamp: new Date(),
        retryable: false,
      } as APIError,
      hasError: true,
    }));
  }, []);

  /**
   * エラーのクリア
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasError: false,
      error: null,
    }));
  }, []);

  /**
   * コンポーネントのアンマウント時のクリーンアップ
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 戻り値
  return {
    // 状態
    ...state,
    
    // アクション
    executeMAGI,
    cancelExecution,
    clearError,
    resetState,
    
    // ヘルパー
    canRetry: state.hasError && state.error?.retryable !== false,
    progressPercentage: Math.round((state.progress.completedSteps.length / state.progress.totalSteps) * 100),
    
    // デバッグ情報
    debug: {
      retryCount: retryCountRef.current,
      maxRetries,
      abortController: abortControllerRef.current,
    },
  };
}

/**
 * 簡易版Hook（基本的な実行のみ）
 * 
 * 使用例:
 * ```typescript
 * const { executeMAGI, isExecuting, response, error } = useSimpleBedrockAgents();
 * 
 * const handleSubmit = async () => {
 *   const result = await executeMAGI('AIシステムを導入すべきでしょうか？');
 *   if (result) {
 *     console.log('Decision:', result.judgeResponse.finalDecision);
 *   }
 * };
 * ```
 */
export function useSimpleBedrockAgents() {
  const {
    executeMAGI,
    isExecuting,
    isCompleted,
    hasError,
    response,
    agentResponses,
    judgeResponse,
    error,
    clearError,
    resetState,
  } = useBedrockAgents();

  return {
    executeMAGI,
    isExecuting,
    isCompleted,
    hasError,
    response,
    agentResponses,
    judgeResponse,
    error,
    clearError,
    resetState,
  };
}

/**
 * プリセット管理付きHook
 * 
 * 使用例:
 * ```typescript
 * const { 
 *   executeWithPreset, 
 *   currentPreset, 
 *   setPreset 
 * } = useBedrockAgentsWithPresets();
 * 
 * // プリセットを設定
 * setPreset(academicPreset);
 * 
 * // プリセット設定で実行
 * const result = await executeWithPreset('研究提案を評価してください');
 * ```
 */
export function useBedrockAgentsWithPresets() {
  const bedrockHook = useBedrockAgents();
  const [currentPreset, setCurrentPreset] = useState<AgentConfig[] | null>(null);

  const setPreset = useCallback((configs: AgentConfig[]) => {
    setCurrentPreset(configs);
  }, []);

  const executeWithPreset = useCallback(async (
    message: string,
    conversationId?: string
  ) => {
    return bedrockHook.executeMAGI(message, conversationId, currentPreset || undefined);
  }, [bedrockHook.executeMAGI, currentPreset]);

  return {
    ...bedrockHook,
    currentPreset,
    setPreset,
    executeWithPreset,
  };
}

/**
 * 型エクスポート
 */
export type {
  UseBedrockAgentsState,
  UseBedrockAgentsOptions,
};