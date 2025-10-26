/**
 * Bedrock MAGI Integration Component
 * 
 * このコンポーネントは既存のMAGISystemInterfaceとBedrock Multi-Agent Collaboration
 * を統合し、シームレスなユーザー体験を提供します。
 * 
 * 主要機能:
 * - 既存UIとBedrock統合の橋渡し
 * - 実行モードの切り替え（Mock/Bedrock）
 * - エラーハンドリングとフォールバック
 * - 設定管理とプリセット適用
 * 
 * 学習ポイント:
 * - レガシーコードとの統合パターン
 * - 段階的移行戦略
 * - ユーザー体験の継続性確保
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MAGISystemInterface } from './MAGISystemInterface';
import { BedrockAgentConfig } from './BedrockAgentConfig';
import { useBedrockAgents } from '@/hooks/useBedrockAgents';
import { 
  AgentConfig, 
  AgentPreset, 
  AgentResponse, 
  JudgeResponse 
} from '@/types/domain';
import { AskAgentResponse } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockMAGIExecution } from '@/lib/mock/data';

/**
 * 実行モードの定義
 */
type ExecutionMode = 'mock' | 'bedrock' | 'hybrid';

/**
 * コンポーネントのProps型定義
 */
interface BedrockMAGIIntegrationProps {
  /** 初期質問 */
  initialQuestion?: string;
  /** 初期実行モード */
  initialMode?: ExecutionMode;
  /** 設定表示の制御 */
  showConfiguration?: boolean;
  /** デバッグモード */
  debugMode?: boolean;
  /** クラス名 */
  className?: string;
}

/**
 * Bedrock MAGI Integration Component
 * 
 * 設計理由:
 * - 既存のMAGISystemInterfaceを活用
 * - Bedrockとモックの切り替え機能
 * - 段階的移行のサポート
 * 
 * 学習ポイント:
 * - 統合コンポーネントの設計
 * - 状態管理の複雑性対応
 * - ユーザビリティの維持
 */
export function BedrockMAGIIntegration({
  initialQuestion = '',
  initialMode = 'mock',
  showConfiguration = false,
  debugMode = false,
  className = '',
}: BedrockMAGIIntegrationProps) {
  // 状態管理
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(initialMode);
  const [question, setQuestion] = useState(initialQuestion);
  const [currentPreset, setCurrentPreset] = useState<AgentPreset | null>(null);
  const [showConfig, setShowConfig] = useState(showConfiguration);
  const [executionHistory, setExecutionHistory] = useState<AskAgentResponse[]>([]);

  // Bedrock Agents Hook
  const {
    executeMAGI,
    isExecuting,
    isCompleted,
    hasError,
    response,
    agentResponses,
    judgeResponse,
    error,
    progress,
    clearError,
    resetState,
    progressPercentage,
  } = useBedrockAgents({
    autoRetry: true,
    maxRetries: 2,
    useCache: true,
    timeout: 60000,
    onStart: () => {
      console.log('Bedrock MAGI Integration: Execution started');
    },
    onProgress: (step) => {
      console.log('Bedrock MAGI Integration: Progress update:', step);
    },
    onComplete: (result) => {
      console.log('Bedrock MAGI Integration: Execution completed:', result);
      setExecutionHistory(prev => [result, ...prev.slice(0, 9)]); // 最新10件を保持
    },
    onError: (err) => {
      console.error('Bedrock MAGI Integration: Execution failed:', err);
    },
  });

  /**
   * 実行モードに応じたMAGI実行
   */
  const handleExecuteMAGI = useCallback(async (inputQuestion: string) => {
    if (!inputQuestion.trim()) {
      alert('質問を入力してください');
      return;
    }

    setQuestion(inputQuestion);
    clearError();

    try {
      let result: AskAgentResponse | null = null;

      switch (executionMode) {
        case 'mock':
          // モックデータでの実行
          result = await executeMockMAGI(inputQuestion);
          break;

        case 'bedrock':
          // Bedrock Multi-Agent Collaborationでの実行
          result = await executeMAGI(
            inputQuestion,
            undefined, // conversationId
            currentPreset?.configs // カスタム設定
          );
          break;

        case 'hybrid':
          // ハイブリッド実行（Bedrockを試行、失敗時はモック）
          try {
            result = await executeMAGI(inputQuestion, undefined, currentPreset?.configs);
          } catch (bedrockError) {
            console.warn('Bedrock execution failed, falling back to mock:', bedrockError);
            result = await executeMockMAGI(inputQuestion);
          }
          break;

        default:
          throw new Error(`Unknown execution mode: ${executionMode}`);
      }

      if (result) {
        setExecutionHistory(prev => [result, ...prev.slice(0, 9)]);
      }

    } catch (err) {
      console.error('MAGI execution failed:', err);
    }
  }, [executionMode, currentPreset, executeMAGI, clearError]);

  /**
   * モックデータでのMAGI実行
   */
  const executeMockMAGI = useCallback(async (inputQuestion: string): Promise<AskAgentResponse> => {
    // 質問内容に基づくシナリオ選択
    const message = inputQuestion.toLowerCase();
    let scenario: keyof typeof mockMAGIExecution = 'random';

    if (message.includes('承認') || message.includes('賛成')) {
      scenario = 'unanimousApproval';
    } else if (message.includes('反対') || message.includes('否決')) {
      scenario = 'unanimousRejection';
    } else if (message.includes('分裂') || message.includes('意見')) {
      scenario = 'splitDecision';
    }

    return mockMAGIExecution[scenario](inputQuestion);
  }, []);

  /**
   * 実行進行状況の変換
   */
  const convertProgressToMAGIFormat = useCallback(() => {
    if (!isExecuting || !progress) return undefined;

    // 進行状況をMAGISystemInterface形式に変換
    const phase = progress.currentStep.includes('SOLOMON初期化') ? 'initializing' :
                  progress.currentStep.includes('3賢者') ? 'agents_thinking' :
                  progress.currentStep.includes('SOLOMON評価') ? 'judge_evaluating' :
                  'completed';

    return {
      phase,
      completedAgents: agentResponses.map(r => r.agentId),
      activeAgents: phase === 'agents_thinking' ? ['caspar', 'balthasar', 'melchior'] : [],
      agentThoughtHistory: {
        caspar: phase === 'agents_thinking' ? [
          '質問を分析中...',
          'リスク要因を評価中...',
          '過去事例との比較を実行中...',
        ] : [],
        balthasar: phase === 'agents_thinking' ? [
          '創造的側面を検討中...',
          '革新的価値を評価中...',
          '感情的影響を分析中...',
        ] : [],
        melchior: phase === 'agents_thinking' ? [
          'データを収集中...',
          '論理的整合性を検証中...',
          'バランス評価を実行中...',
        ] : [],
      },
      solomonThoughtHistory: phase === 'judge_evaluating' ? [
        '3賢者の判断を統合中...',
        'スコアリング実行中...',
        '最終判断を決定中...',
      ] : [],
    };
  }, [isExecuting, progress, agentResponses]);

  /**
   * プリセットの適用
   */
  const handlePresetChange = useCallback((preset: AgentPreset) => {
    setCurrentPreset(preset);
    console.log('Bedrock MAGI Integration: Preset applied:', preset.name);
  }, []);

  /**
   * 実行モードの変更
   */
  const handleModeChange = useCallback((mode: ExecutionMode) => {
    setExecutionMode(mode);
    resetState();
    console.log('Bedrock MAGI Integration: Execution mode changed to:', mode);
  }, [resetState]);

  /**
   * 新しい質問の開始
   */
  const handleNewQuestion = useCallback(() => {
    setQuestion('');
    resetState();
  }, [resetState]);

  /**
   * 再実行
   */
  const handleRetry = useCallback(() => {
    if (question) {
      handleExecuteMAGI(question);
    }
  }, [question, handleExecuteMAGI]);

  /**
   * 実行モード表示用のラベル
   */
  const getModeLabel = (mode: ExecutionMode): string => {
    switch (mode) {
      case 'mock': return 'モックデータ';
      case 'bedrock': return 'Bedrock Multi-Agent';
      case 'hybrid': return 'ハイブリッド';
      default: return mode;
    }
  };

  /**
   * 実行モード表示用の色
   */
  const getModeColor = (mode: ExecutionMode): string => {
    switch (mode) {
      case 'mock': return 'bg-gray-100 text-gray-800';
      case 'bedrock': return 'bg-blue-100 text-blue-800';
      case 'hybrid': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 制御パネル */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            MAGI Decision System
          </h2>
          
          <div className="flex items-center gap-4">
            {/* 実行モード表示 */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getModeColor(executionMode)}`}>
              {getModeLabel(executionMode)}
            </div>
            
            {/* 設定表示切り替え */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? '設定を隠す' : '設定を表示'}
            </Button>
          </div>
        </div>

        {/* 実行モード選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            実行モード
          </label>
          <div className="flex gap-2">
            {(['mock', 'bedrock', 'hybrid'] as ExecutionMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={isExecuting}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${executionMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {getModeLabel(mode)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {executionMode === 'mock' && 'モックデータを使用した高速テスト実行'}
            {executionMode === 'bedrock' && 'Amazon Bedrock Multi-Agent Collaborationを使用'}
            {executionMode === 'hybrid' && 'Bedrockを試行、失敗時はモックにフォールバック'}
          </p>
        </div>

        {/* 質問入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            質問
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isExecuting}
              placeholder="MAGIシステムに判断を求める質問を入力してください..."
              className={`
                flex-1 px-3 py-2 border border-gray-300 rounded-md
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${isExecuting ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isExecuting) {
                  handleExecuteMAGI(question);
                }
              }}
            />
            <Button
              onClick={() => handleExecuteMAGI(question)}
              disabled={isExecuting || !question.trim()}
              className="px-6"
            >
              {isExecuting ? '実行中...' : '実行'}
            </Button>
          </div>
        </div>

        {/* 現在のプリセット表示 */}
        {currentPreset && (
          <div className="text-sm text-gray-600">
            使用中のプリセット: <span className="font-medium">{currentPreset.name}</span>
          </div>
        )}

        {/* デバッグ情報 */}
        {debugMode && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <div>実行状態: {isExecuting ? '実行中' : isCompleted ? '完了' : hasError ? 'エラー' : '待機中'}</div>
            <div>進行率: {progressPercentage}%</div>
            <div>履歴件数: {executionHistory.length}</div>
            {error && <div className="text-red-600">エラー: {error.message}</div>}
          </div>
        )}
      </Card>

      {/* エージェント設定 */}
      {showConfig && (
        <BedrockAgentConfig
          currentConfigs={currentPreset?.configs}
          currentPreset={currentPreset}
          onPresetChange={handlePresetChange}
          disabled={isExecuting}
        />
      )}

      {/* MAGI システムインターフェース */}
      <MAGISystemInterface
        question={question}
        response={response}
        loading={isExecuting}
        error={error?.message}
        executionProgress={convertProgressToMAGIFormat()}
        onRetry={handleRetry}
        onNewQuestion={handleNewQuestion}
      />

      {/* 実行履歴 */}
      {executionHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            実行履歴
          </h3>
          <div className="space-y-3">
            {executionHistory.slice(0, 5).map((historyItem, index) => (
              <div
                key={historyItem.traceId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {historyItem.judgeResponse.finalDecision === 'APPROVED' ? '✓ 可決' : '✗ 否決'}
                  </div>
                  <div className="text-xs text-gray-600">
                    実行時間: {historyItem.executionTime}ms | 
                    トレースID: {historyItem.traceId.substring(0, 8)}...
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {index === 0 ? '最新' : `${index + 1}件前`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default BedrockMAGIIntegration;