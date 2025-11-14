/**
 * ReasoningTracePanel Component - 推論トレース可視化パネル
 * 
 * このコンポーネントはエージェントの推論過程を可視化します。
 * リアルタイム更新、段階的レンダリング、進行状況表示を提供し、
 * ユーザーがエージェントの思考プロセスを理解できるようにします。
 * 
 * 設計理由:
 * - リアルタイム更新でエージェント実行の透明性を確保
 * - 段階的表示でユーザーエンゲージメントを向上
 * - 進行状況インジケーターで実行状態を明確化
 * - 展開/折りたたみで情報密度を調整可能
 * 
 * 学習ポイント:
 * - WebSocket/リアルタイム通信の実装パターン
 * - 段階的UIレンダリングの実装
 * - 状態管理とライフサイクル管理
 * - パフォーマンス最適化（仮想化スクロール対応準備）
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TraceStep } from '@/types/domain';
import TraceStepItem from './TraceStepItem';
import { useTraceUpdates } from '@/hooks/useTraceUpdates';
import { 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  Wifi,
  AlertTriangle
} from 'lucide-react';

/**
 * トレース実行状態の定義
 * 
 * 設計理由:
 * - running: 実行中（リアルタイム更新中）
 * - completed: 完了（全ステップ表示済み）
 * - failed: 失敗（エラー状態）
 * - idle: 待機中（実行前状態）
 */
type TraceStatus = 'idle' | 'running' | 'completed' | 'failed';

/**
 * ReasoningTracePanelコンポーネントのProps
 * 
 * 設計理由:
 * - traceId: 実行トレースの一意識別子
 * - steps: 表示するトレースステップ配列（オプション、リアルタイム時は内部管理）
 * - realTimeUpdates: リアルタイム更新の有効/無効
 * - orchestratorMode: オーケストレーションモード（SOLOMON統括 or 並列実行）
 * - onStepClick: ステップクリック時のコールバック（詳細表示用）
 * - onExecutionComplete: 実行完了時のコールバック
 * - autoStart: traceIdが設定された時に自動でトレースを開始するか
 */
interface ReasoningTracePanelProps {
  traceId: string;
  steps?: TraceStep[];
  realTimeUpdates?: boolean;
  orchestratorMode?: 'solomon_orchestrated' | 'parallel';
  onStepClick?: (step: TraceStep) => void;
  onExecutionComplete?: (steps: TraceStep[]) => void;
  autoStart?: boolean;
  className?: string;
}

/**
 * ReasoningTracePanel - 推論トレース可視化の主要コンポーネント
 * 
 * 機能:
 * - トレースステップのリアルタイム表示
 * - 実行状態の可視化（進行状況、完了状態、エラー状態）
 * - 段階的ステップレンダリング
 * - 全体の展開/折りたたみ制御
 * - パフォーマンス最適化（大量ステップ対応）
 * 
 * 要件対応:
 * - 4.1: リアルタイムトレース更新
 * - 4.2: 段階的トレースステップレンダリング
 * - 4.6: トレース完了状態と進行状況インジケーター
 */
export default function ReasoningTracePanel({
  traceId,
  steps: externalSteps,
  realTimeUpdates = false,
  orchestratorMode = 'solomon_orchestrated',
  onStepClick,
  onExecutionComplete,
  autoStart = true,
  className = ''
}: ReasoningTracePanelProps) {
  // リアルタイム更新フックの使用
  const {
    connectionStatus,
    traceSteps: realtimeSteps,
    agentStatuses,
    clearTrace,
    error: connectionError,
    isExecutionComplete: realtimeComplete
  } = useTraceUpdates(traceId, realTimeUpdates); // 実際のトレース更新を使用

  // 状態管理
  const [traceStatus, setTraceStatus] = useState<TraceStatus>('idle');
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isManuallyStarted, setIsManuallyStarted] = useState(false);
  
  // リアルタイム更新用の参照
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const latestStepRef = useRef<HTMLDivElement>(null);

  // 使用するステップデータの決定
  const steps = realTimeUpdates ? realtimeSteps : (externalSteps || []);
  const isComplete = realTimeUpdates ? realtimeComplete : false;

  /**
   * 自動トレース開始
   */
  useEffect(() => {
    if (realTimeUpdates && autoStart && traceId && !isManuallyStarted) {
      // トレースは自動的に開始される（useTraceUpdatesフック内で）
      setIsManuallyStarted(true);
    }
  }, [realTimeUpdates, autoStart, traceId, isManuallyStarted]);

  /**
   * トレース状態の自動判定
   * 
   * 設計理由:
   * - ステップ数とリアルタイム更新状態から実行状態を推定
   * - UIの状態表示を自動化してユーザビリティを向上
   */
  useEffect(() => {
    if (connectionError) {
      setTraceStatus('failed');
    } else if (steps.length === 0) {
      setTraceStatus('idle');
    } else if (realTimeUpdates && !isComplete) {
      setTraceStatus('running');
    } else if (isComplete || (!realTimeUpdates && steps.length > 0)) {
      // 最後のステップが完了系のアクションかどうかで判定
      const lastStep = steps[steps.length - 1];
      if (lastStep?.action.includes('完了') || lastStep?.action.includes('complete')) {
        setTraceStatus('completed');
      } else {
        setTraceStatus('running');
      }
    }
  }, [steps.length, realTimeUpdates, isComplete, connectionError]);

  /**
   * 実行完了時のコールバック呼び出し
   */
  useEffect(() => {
    if (isComplete && steps.length > 0 && onExecutionComplete) {
      onExecutionComplete(steps);
    }
  }, [isComplete, steps, onExecutionComplete]);

  /**
   * 新しいステップが追加された時の自動スクロール
   */
  useEffect(() => {
    if (realTimeUpdates && steps.length > 0) {
      // 新しいステップが追加されたら自動スクロール
      setTimeout(() => {
        latestStepRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
    }
  }, [steps.length, realTimeUpdates]);

  /**
   * 個別ステップの展開状態管理
   */
  const handleStepToggle = (stepId: string, isExpanded: boolean) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(stepId);
      } else {
        newSet.delete(stepId);
      }
      return newSet;
    });
  };

  /**
   * 全ステップの一括展開/折りたたみ
   */
  const handleToggleAll = () => {
    if (isAllExpanded) {
      setExpandedSteps(new Set());
      setIsAllExpanded(false);
    } else {
      setExpandedSteps(new Set(steps.map(step => step.id)));
      setIsAllExpanded(true);
    }
  };

  /**
   * 手動でトレースを開始
   */
  const handleStartTrace = () => {
    if (realTimeUpdates && traceId) {
      // トレースは自動的に開始される
      setIsManuallyStarted(true);
    }
  };

  /**
   * 手動でトレースを停止
   */
  const handleStopTrace = () => {
    if (realTimeUpdates) {
      // トレースは自動的に停止される
    }
  };

  /**
   * トレースをクリア
   */
  const handleClearTrace = () => {
    clearTrace();
    setIsManuallyStarted(false);
    setExpandedSteps(new Set());
    setIsAllExpanded(false);
  };

  /**
   * 実行状態に応じたスタイルとアイコンの取得
   */
  const getStatusDisplay = () => {
    switch (traceStatus) {
      case 'running':
        return {
          icon: <Play className="h-5 w-5 text-blue-600 animate-pulse" />,
          text: '実行中',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: '完了',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          text: 'エラー',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          text: '待機中',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  /**
   * 進行状況の計算
   */
  const getProgress = () => {
    if (realTimeUpdates && agentStatuses.length > 0) {
      // エージェント状態から進行状況を計算
      const completedAgents = agentStatuses.filter(status => status.status === 'completed').length;
      return Math.round((completedAgents / agentStatuses.length) * 100);
    }
    
    // 静的表示の場合は100%
    return steps.length > 0 ? 100 : 0;
  };

  /**
   * オーケストレーションモードの表示
   */
  const getModeDisplay = () => {
    return orchestratorMode === 'solomon_orchestrated' 
      ? 'SOLOMON統括モード' 
      : '並列実行モード';
  };

  const statusDisplay = getStatusDisplay();
  const progress = getProgress();

  /**
   * 接続状態の表示
   */
  const getConnectionStatusDisplay = () => {
    if (!realTimeUpdates) return null;

    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center text-green-600">
            <Wifi className="h-4 w-4 mr-1" />
            <span className="text-xs">接続中</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center text-yellow-600">
            <Wifi className="h-4 w-4 mr-1 animate-pulse" />
            <span className="text-xs">接続中...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-xs">接続エラー</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600">
            <Wifi className="h-4 w-4 mr-1" />
            <span className="text-xs">未接続</span>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* ヘッダー部分 */}
      <div className={`px-6 py-4 border-b border-gray-200 ${statusDisplay.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {statusDisplay.icon}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                推論トレース
              </h3>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-gray-600">
                  {getModeDisplay()} • {steps.length} ステップ
                </p>
                {getConnectionStatusDisplay()}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 実行状態表示 */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusDisplay.bgColor} ${statusDisplay.textColor} ${statusDisplay.borderColor}`}>
              {statusDisplay.text}
            </div>

            {/* コントロールボタン */}
            <div className="flex items-center space-x-2">
              {/* リアルタイム更新のコントロール */}
              {realTimeUpdates && (
                <>
                  {!isManuallyStarted && traceStatus === 'idle' && (
                    <button
                      onClick={handleStartTrace}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      開始
                    </button>
                  )}
                  
                  {traceStatus === 'running' && (
                    <button
                      onClick={handleStopTrace}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      停止
                    </button>
                  )}
                  
                  <button
                    onClick={handleClearTrace}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    クリア
                  </button>
                </>
              )}

              {/* 全展開/折りたたみボタン */}
              {steps.length > 0 && (
                <button
                  onClick={handleToggleAll}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={isAllExpanded ? '全て折りたたむ' : '全て展開する'}
                >
                  {isAllExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      全て折りたたむ
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      全て展開
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 進行状況バー（実行中のみ表示） */}
        {traceStatus === 'running' && realTimeUpdates && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>進行状況</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {connectionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm text-red-800">{connectionError}</span>
            </div>
          </div>
        )}

        {/* トレースID */}
        <div className="mt-3 text-xs text-gray-500">
          <span className="font-medium">トレースID:</span>
          <span className="ml-2 font-mono">{traceId}</span>
        </div>
      </div>

      {/* ステップ一覧 */}
      <div 
        ref={stepsContainerRef}
        className="p-6"
      >
        {steps.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              トレース待機中
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              エージェント実行が開始されるとトレースが表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                ref={index === steps.length - 1 ? latestStepRef : undefined}
                className={`transition-all duration-300 ${
                  realTimeUpdates && index === steps.length - 1 
                    ? 'animate-fade-in' 
                    : ''
                }`}
                onClick={() => onStepClick?.(step)}
              >
                <TraceStepItem
                  step={step}
                  expanded={expandedSteps.has(step.id)}
                  onToggle={handleStepToggle}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フッター（完了時の要約情報） */}
      {traceStatus === 'completed' && steps.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">総ステップ数</dt>
              <dd className="mt-1 text-gray-900">{steps.length}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">総実行時間</dt>
              <dd className="mt-1 text-gray-900">
                {(steps.reduce((sum, step) => sum + step.duration, 0) / 1000).toFixed(1)}s
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">エラー回数</dt>
              <dd className="mt-1 text-gray-900">
                {steps.reduce((sum, step) => sum + step.errorCount, 0)}
              </dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * アニメーション用のCSS（Tailwindで定義されていない場合）
 * 
 * 使用方法:
 * globals.cssに以下を追加:
 * 
 * @keyframes fade-in {
 *   from { opacity: 0; transform: translateY(10px); }
 *   to { opacity: 1; transform: translateY(0); }
 * }
 * 
 * .animate-fade-in {
 *   animation: fade-in 0.3s ease-out;
 * }
 */