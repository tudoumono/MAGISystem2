/**
 * MAGISystemInterface - 完全なMAGIシステムインターフェース
 * 
 * このコンポーネントは3賢者とSOLOMON Judgeを統合したMAGIシステム全体を表示します。
 * エヴァンゲリオンのMAGIシステムにインスパイアされたデザインで、
 * 多エージェント意思決定プロセス全体を可視化します。
 * 
 * 主要機能:
 * - 3賢者の並列実行と応答表示
 * - SOLOMON Judgeによる統合評価
 * - リアルタイム実行状況の表示
 * - エヴァンゲリオン風UIデザイン
 * - Multi-Agent Collaborationパターン対応
 * - 段階的ローディングアニメーション
 * 
 * 学習ポイント:
 * - 複雑なUIコンポーネントの構成
 * - 状態管理とデータフロー
 * - アニメーションとUXデザイン
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AgentResponse, JudgeResponse } from '@/types/domain';
import { AskAgentResponse } from '@/types/api';
import { AgentResponseComparison } from './AgentResponseComparison';
import { JudgeResponsePanel } from './JudgeResponsePanel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// =============================================================================
// Component Props Interface
// =============================================================================

interface MAGISystemInterfaceProps {
  /** 質問内容 */
  question?: string;
  /** 完全な実行結果 */
  response?: AskAgentResponse | undefined;
  /** ローディング状態 */
  loading?: boolean;
  /** エラー状態 */
  error?: string;
  /** 実行進行状況 */
  executionProgress?: {
    phase: 'initializing' | 'agents_thinking' | 'judge_evaluating' | 'completed';
    completedAgents: string[];
    currentAgent?: string;
  } | undefined;
  /** 再実行コールバック */
  onRetry?: (() => void) | undefined;
  /** 新しい質問コールバック */
  onNewQuestion?: (() => void) | undefined;
  /** クラス名の追加 */
  className?: string;
}

// =============================================================================
// Execution Progress Component
// =============================================================================

/**
 * 実行進行状況表示コンポーネント
 * 
 * 設計理由:
 * - ユーザーに現在の処理状況を明確に伝える
 * - エヴァンゲリオン風のプログレス表示
 * - 各エージェントの実行状況を個別に表示
 */
const ExecutionProgress: React.FC<{
  progress: NonNullable<MAGISystemInterfaceProps['executionProgress']>;
  question: string;
}> = ({ progress, question }) => {
  const { phase, completedAgents, currentAgent } = progress;
  
  const phases = [
    { id: 'initializing', label: 'SOLOMON初期化', description: '統括システム起動中...' },
    { id: 'agents_thinking', label: '3賢者分析', description: '並列思考プロセス実行中...' },
    { id: 'judge_evaluating', label: 'SOLOMON評価', description: '統合判断処理中...' },
    { id: 'completed', label: '完了', description: 'MAGI判断完了' },
  ];
  
  const currentPhaseIndex = phases.findIndex(p => p.id === phase);
  const agents = ['caspar', 'balthasar', 'melchior'];
  
  return (
    <Card className="p-6 bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      {/* システムヘッダー */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">MAGI SYSTEM ACTIVE</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
        <p className="text-blue-200 text-sm mt-3 max-w-2xl mx-auto">
          {question}
        </p>
      </div>

      {/* フェーズ進行表示 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          {phases.map((phaseInfo, index) => (
            <div 
              key={phaseInfo.id}
              className={`flex-1 text-center ${
                index <= currentPhaseIndex ? 'text-white' : 'text-blue-300'
              }`}
            >
              <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center font-bold ${
                index < currentPhaseIndex ? 'bg-green-500' :
                index === currentPhaseIndex ? 'bg-orange-500 animate-pulse' :
                'bg-blue-700'
              }`}>
                {index < currentPhaseIndex ? '✓' : index + 1}
              </div>
              <div className="text-xs font-medium">{phaseInfo.label}</div>
            </div>
          ))}
        </div>
        
        {/* 現在のフェーズ説明 */}
        <div className="text-center">
          <p className="text-blue-200 text-sm">
            {phases[currentPhaseIndex]?.description}
          </p>
        </div>
      </div>

      {/* エージェント個別進行状況 */}
      {phase === 'agents_thinking' && (
        <div className="grid grid-cols-3 gap-4">
          {agents.map(agentId => {
            const isCompleted = completedAgents.includes(agentId);
            const isCurrent = currentAgent === agentId;
            const agentName = agentId.toUpperCase();
            
            return (
              <div 
                key={agentId}
                className={`p-3 rounded-lg border ${
                  isCompleted ? 'bg-green-900 border-green-500' :
                  isCurrent ? 'bg-orange-900 border-orange-500 animate-pulse' :
                  'bg-blue-800 border-blue-600'
                }`}
              >
                <div className="text-center">
                  <div className={`w-6 h-6 mx-auto mb-2 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-green-500' :
                    isCurrent ? 'bg-orange-500' :
                    'bg-blue-600'
                  }`}>
                    {isCompleted ? '✓' : agentName[0]}
                  </div>
                  <div className="text-xs font-medium">{agentName}</div>
                  <div className="text-xs text-blue-200 mt-1">
                    {isCompleted ? '完了' : isCurrent ? '分析中...' : '待機中'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SOLOMON評価中の表示 */}
      {phase === 'judge_evaluating' && (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold animate-pulse">S</span>
          </div>
          <p className="text-orange-200 text-sm">
            SOLOMON Judgeが3賢者の判断を統合評価中...
          </p>
        </div>
      )}
    </Card>
  );
};

// =============================================================================
// System Status Component
// =============================================================================

/**
 * システム状態表示コンポーネント
 */
const SystemStatus: React.FC<{
  response: AskAgentResponse;
  onRetry?: (() => void) | undefined;
  onNewQuestion?: (() => void) | undefined;
}> = ({ response, onRetry, onNewQuestion }) => {
  const totalExecutionTime = response.executionTime;
  const agentCount = response.agentResponses.length;
  const approvedCount = response.agentResponses.filter(r => r.decision === 'APPROVED').length;
  
  return (
    <Card className="p-4 bg-gray-50 border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>実行完了</span>
          </div>
          <div>実行時間: {totalExecutionTime}ms</div>
          <div>エージェント: {agentCount}/3</div>
          <div>可決率: {Math.round((approvedCount / agentCount) * 100)}%</div>
        </div>
        
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              再実行
            </Button>
          )}
          {onNewQuestion && (
            <Button variant="primary" size="sm" onClick={onNewQuestion}>
              新しい質問
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * MAGISystemInterface メインコンポーネント
 */
export const MAGISystemInterface: React.FC<MAGISystemInterfaceProps> = ({
  question = '',
  response,
  loading = false,
  error,
  executionProgress,
  onRetry,
  onNewQuestion,
  className = '',
}) => {
  // 内部状態管理
  const [showDetails, setShowDetails] = useState(true);

  // エラー状態の表示
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-8 border-red-200 bg-red-50 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 font-bold text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">
            MAGIシステムエラー
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <Button variant="secondary" onClick={onRetry}>
                再試行
              </Button>
            )}
            {onNewQuestion && (
              <Button variant="primary" onClick={onNewQuestion}>
                新しい質問
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ローディング状態（実行進行中）の表示
  if (loading || executionProgress) {
    return (
      <div className={`space-y-6 ${className}`}>
        {executionProgress && (
          <ExecutionProgress progress={executionProgress} question={question} />
        )}
        
        {/* エージェント応答のローディング表示 */}
        <AgentResponseComparison loading={true} />
        
        {/* SOLOMON Judgeのローディング表示 */}
        <JudgeResponsePanel loading={true} />
      </div>
    );
  }

  // 完了状態の表示
  if (response) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* システム状態表示 */}
        <SystemStatus 
          response={response} 
          onRetry={onRetry} 
          onNewQuestion={onNewQuestion} 
        />

        {/* 詳細表示切り替え */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            MAGI判断結果
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-600 hover:text-gray-800"
          >
            {showDetails ? '簡易表示' : '詳細表示'}
          </Button>
        </div>

        {showDetails ? (
          <>
            {/* 3賢者の応答比較 */}
            <AgentResponseComparison
              responses={response.agentResponses}
              comparisonMode={true}
            />

            {/* SOLOMON Judge統合評価 */}
            <JudgeResponsePanel
              judgeResponse={response.judgeResponse}
              agentResponses={response.agentResponses}
            />
          </>
        ) : (
          /* 簡易表示モード */
          <Card className="p-6">
            <div className="text-center">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold ${
                response.judgeResponse.finalDecision === 'APPROVED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <span className="text-2xl">
                  {response.judgeResponse.finalDecision === 'APPROVED' ? '✓' : '✗'}
                </span>
                <span>
                  {response.judgeResponse.finalDecision === 'APPROVED' ? '可決' : '否決'}
                </span>
              </div>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                {response.judgeResponse.summary}
              </p>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // 初期状態
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-white font-bold text-2xl">MAGI</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        MAGIシステム待機中
      </h2>
      <p className="text-gray-600">
        質問を入力してMAGI判断を開始してください
      </p>
    </div>
  );
};

// =============================================================================
// Export
// =============================================================================

export default MAGISystemInterface;