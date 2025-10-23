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

import React, { useState, useEffect, useCallback } from 'react';
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
    activeAgents: string[]; // 並列実行中のエージェント
    agentThoughts: { [agentId: string]: string }; // 各エージェントの現在の思考
    solomonThought?: string; // SOLOMONの思考
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
 * - リアルタイム動的更新
 */
const ExecutionProgress: React.FC<{
  progress: NonNullable<MAGISystemInterfaceProps['executionProgress']>;
  question: string;
}> = ({ progress, question }) => {
  const { phase, completedAgents, activeAgents, agentThoughts, solomonThought } = progress;
  
  // リアルタイムタイマー
  const [elapsedTime, setElapsedTime] = useState(0);
  const [systemPulse, setSystemPulse] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    const pulseTimer = setInterval(() => {
      setSystemPulse(prev => !prev);
    }, 1500);
    
    return () => {
      clearInterval(timer);
      clearInterval(pulseTimer);
    };
  }, []);
  
  // 進行率計算
  const calculateProgress = () => {
    const phaseWeights = {
      'initializing': 10,
      'agents_thinking': 70,
      'judge_evaluating': 15,
      'completed': 5
    };
    
    let progress = 0;
    if (phase === 'initializing') progress = 10;
    else if (phase === 'agents_thinking') {
      progress = 10 + (completedAgents.length / 3) * 70;
    } else if (phase === 'judge_evaluating') progress = 85;
    else if (phase === 'completed') progress = 100;
    
    return Math.min(progress, 100);
  };
  
  const phases = [
    { id: 'initializing', label: 'SOLOMON初期化', description: '統括システム起動中...' },
    { id: 'agents_thinking', label: '3賢者分析', description: '並列思考プロセス実行中...' },
    { id: 'judge_evaluating', label: 'SOLOMON評価', description: '統合判断処理中...' },
    { id: 'completed', label: '完了', description: 'MAGI判断完了' },
  ];
  
  const currentPhaseIndex = phases.findIndex(p => p.id === phase);
  const agents = ['caspar', 'balthasar', 'melchior'];
  
  const progressPercentage = calculateProgress();
  
  return (
    <Card className={`p-6 bg-gradient-to-br from-blue-900 to-purple-900 text-white transition-all duration-500 ${
      systemPulse ? 'shadow-2xl shadow-blue-500/20' : 'shadow-xl'
    }`}>
      {/* システムヘッダー */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            systemPulse ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
          }`}></div>
          <h2 className="text-2xl font-bold">MAGI SYSTEM ACTIVE</h2>
          <div className={`w-3 h-3 rounded-full ${
            systemPulse ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
          }`}></div>
        </div>
        
        {/* 動的プログレスバー */}
        <div className="w-32 h-2 bg-gray-700 mx-auto rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* 実行時間とプログレス */}
        <div className="flex justify-center gap-4 text-xs text-blue-200 mb-3">
          <span>実行時間: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
          <span>進行率: {Math.round(progressPercentage)}%</span>
        </div>
        
        <p className="text-blue-200 text-sm max-w-2xl mx-auto">
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

      {/* エージェント並列実行状況 */}
      {phase === 'agents_thinking' && (
        <div className="space-y-6">
          {/* エージェント状態表示 */}
          <div className="grid grid-cols-3 gap-4">
            {agents.map((agentId, index) => {
              const isCompleted = completedAgents.includes(agentId);
              const isActive = activeAgents.includes(agentId);
              const agentName = agentId.toUpperCase();
              const thought = agentThoughts[agentId];
              
              // 各エージェントの個別タイマー（デモ用）
              const agentProgress = isCompleted ? 100 : 
                                  isActive ? Math.min((elapsedTime * 8) % 100, 95) : 0;
              
              return (
                <div 
                  key={agentId}
                  className={`p-4 rounded-lg border transition-all duration-500 ${
                    isCompleted ? 'bg-green-900 border-green-500 shadow-lg shadow-green-500/20' :
                    isActive ? 'bg-orange-900 border-orange-500 animate-pulse shadow-lg shadow-orange-500/20' :
                    'bg-blue-800 border-blue-600'
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-bold relative ${
                      isCompleted ? 'bg-green-500' :
                      isActive ? 'bg-orange-500' :
                      'bg-blue-600'
                    }`}>
                      {isCompleted ? '✓' : agentName[0]}
                      
                      {/* 進行中の場合のプログレスリング */}
                      {isActive && !isCompleted && (
                        <svg className="absolute inset-0 w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="2"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeDasharray={`${agentProgress * 1.13} 113`}
                            className="transition-all duration-500"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="text-sm font-medium">{agentName}</div>
                    <div className="text-xs text-blue-200 mt-1">
                      {isCompleted ? '判断完了' : 
                       isActive ? `思考中... ${Math.round(agentProgress)}%` : 
                       '待機中'}
                    </div>
                  </div>
                  
                  {/* 思考プロセス表示 */}
                  {thought && (
                    <div className="mt-3 p-2 bg-black/20 rounded text-xs text-blue-100 min-h-[2.5rem] flex items-center">
                      <div className="flex items-start gap-2">
                        {(isActive && !isCompleted) && (
                          <div className="flex gap-1 mt-1 flex-shrink-0">
                            <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        )}
                        <span className="leading-relaxed">{thought}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* 並列実行状況サマリー */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4 bg-black/20 rounded-full px-4 py-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>完了: {completedAgents.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>実行中: {activeAgents.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>待機中: {3 - completedAgents.length - activeAgents.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOLOMON評価中の表示 */}
      {phase === 'judge_evaluating' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              {/* 回転するリング */}
              <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
              
              {/* 中央のSOLOMONアイコン */}
              <div className="absolute inset-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold animate-pulse">S</span>
              </div>
              
              {/* パルス効果 */}
              <div className={`absolute inset-0 bg-orange-500/20 rounded-full ${
                systemPulse ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
              } transition-all duration-1000`}></div>
            </div>
            
            <h3 className="text-lg font-bold text-orange-200 mb-2">
              SOLOMON Judge 統合評価中
            </h3>
            
            {/* 評価プロセス表示 */}
            <div className="flex justify-center gap-2 text-xs text-orange-300 mb-4">
              <span className={elapsedTime % 4 === 0 ? 'opacity-100' : 'opacity-50'}>データ統合</span>
              <span>•</span>
              <span className={elapsedTime % 4 === 1 ? 'opacity-100' : 'opacity-50'}>矛盾検証</span>
              <span>•</span>
              <span className={elapsedTime % 4 === 2 ? 'opacity-100' : 'opacity-50'}>スコア算出</span>
              <span>•</span>
              <span className={elapsedTime % 4 === 3 ? 'opacity-100' : 'opacity-50'}>最終判断</span>
            </div>
          </div>
          
          {/* SOLOMON思考プロセス表示 */}
          {solomonThought && (
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gradient-to-r from-orange-900/50 to-red-900/50 rounded-lg border border-orange-500/30">
                <div className="flex items-start gap-3">
                  <div className="flex gap-1 mt-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <div className="text-sm text-orange-100 leading-relaxed">
                    {solomonThought}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 3賢者の判断サマリー */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {agents.map(agentId => {
              const agentName = agentId.toUpperCase();
              const isCompleted = completedAgents.includes(agentId);
              
              return (
                <div 
                  key={agentId}
                  className={`p-2 rounded text-center text-xs ${
                    isCompleted ? 'bg-green-900/50 border border-green-500/30 text-green-200' :
                    'bg-gray-800/50 border border-gray-600/30 text-gray-400'
                  }`}
                >
                  <div className="font-medium">{agentName}</div>
                  <div className="mt-1">
                    {isCompleted ? '判断済み' : '待機中'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* システム初期化中の表示 */}
      {phase === 'initializing' && (
        <div className="text-center">
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mb-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i <= (elapsedTime * 2) % 16 ? 'bg-blue-400' : 'bg-blue-800'
                }`}
              />
            ))}
          </div>
          <p className="text-blue-200 text-sm">
            システム初期化中... コアモジュール読み込み
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