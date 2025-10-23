/**
 * JudgeResponsePanel - SOLOMON Judge統合評価表示コンポーネント
 * 
 * このコンポーネントはSOLOMON Judgeによる3賢者の統合評価を表示します。
 * MAGI投票システムと従来のスコアリングシステムの両方をサポートし、
 * エヴァンゲリオン風のUIデザインを適用します。
 * 
 * 主要機能:
 * - MAGI投票結果の集計表示（可決X票、否決Y票）
 * - SOLOMONの最終判断表示（可決/否決 + 根拠）
 * - スコア可視化（CSS-based charts）
 * - 信頼度指標付き最終推奨表示
 * - エヴァンゲリオン風MAGIシステムUIデザイン
 * - 2025年GA版Multi-Agent Collaborationパターン対応
 * 
 * 学習ポイント:
 * - CSS Grid/Flexboxによる複雑なレイアウト
 * - データ可視化のCSS実装
 * - エヴァンゲリオン風デザインシステム
 */

'use client';

import React, { useState } from 'react';
import { JudgeResponse, AgentResponse, AgentScore, DECISION_STYLES } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// =============================================================================
// Component Props Interface
// =============================================================================

interface JudgeResponsePanelProps {
  /** SOLOMON Judgeの評価データ */
  judgeResponse?: JudgeResponse;
  /** 3賢者の応答データ（投票結果表示用） */
  agentResponses?: AgentResponse[];
  /** ローディング状態 */
  loading?: boolean;
  /** エラー状態 */
  error?: string;
  /** 展開状態の制御 */
  expanded?: boolean;
  /** 展開状態変更のコールバック */
  onExpandedChange?: (expanded: boolean) => void;
  /** クラス名の追加 */
  className?: string;
}

// =============================================================================
// Score Visualization Component
// =============================================================================

/**
 * スコア可視化コンポーネント（CSS-based）
 * 
 * 設計理由:
 * - Rechartsの代替としてCSS-basedチャートを実装
 * - エヴァンゲリオン風のデザイン適用
 * - アクセシビリティ対応
 */
const ScoreVisualization: React.FC<{ scores: AgentScore[] }> = ({ scores }) => {
  const maxScore = Math.max(...scores.map(s => s.score));
  
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 mb-3">エージェント評価スコア</h4>
      
      {scores.map((score) => {
        const percentage = (score.score / 100) * 100;
        const agentName = score.agentId.toUpperCase();
        const agentColor = 
          score.agentId === 'caspar' ? 'bg-blue-500' :
          score.agentId === 'balthasar' ? 'bg-purple-500' :
          'bg-green-500';
        
        return (
          <div key={score.agentId} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {agentName}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {score.score}点
              </span>
            </div>
            
            {/* プログレスバー */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full ${agentColor} transition-all duration-1000 ease-out`}
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={score.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${agentName}のスコア: ${score.score}点`}
              />
            </div>
            
            {/* スコア理由 */}
            <p className="text-xs text-gray-600 leading-relaxed">
              {score.reasoning}
            </p>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// MAGI Voting Display Component
// =============================================================================

/**
 * MAGI投票結果表示コンポーネント
 * 
 * 設計理由:
 * - エヴァンゲリオンのMAGIシステムを模したデザイン
 * - 投票結果の視覚的な分かりやすさ
 * - アニメーション効果による没入感
 */
const MAGIVotingDisplay: React.FC<{ 
  judgeResponse: JudgeResponse; 
  agentResponses: AgentResponse[] 
}> = ({ judgeResponse, agentResponses }) => {
  const { votingResult, finalDecision } = judgeResponse;
  const finalStyle = DECISION_STYLES[finalDecision];
  
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6 mb-6">
      {/* MAGIシステムヘッダー */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          MAGI SYSTEM DECISION
        </h3>
        <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
      </div>

      {/* 投票結果表示 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {agentResponses.map((response) => {
          const agentStyle = DECISION_STYLES[response.decision];
          const agentName = response.agentId.toUpperCase();
          
          return (
            <div 
              key={response.agentId}
              className={`text-center p-4 rounded-lg border-2 ${
                response.decision === 'APPROVED' 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                response.agentId === 'caspar' ? 'bg-blue-600' :
                response.agentId === 'balthasar' ? 'bg-purple-600' :
                'bg-green-600'
              }`}>
                {agentStyle.icon}
              </div>
              <div className="font-medium text-gray-900">{agentName}</div>
              <div className={`text-sm font-semibold ${agentStyle.textColor}`}>
                {agentStyle.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* 投票集計 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-6 bg-white rounded-full px-6 py-3 shadow-sm border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">可決 {votingResult.approved}票</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">否決 {votingResult.rejected}票</span>
          </div>
          {votingResult.abstained > 0 && (
            <>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium">棄権 {votingResult.abstained}票</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 最終判断 */}
      <div className={`text-center p-4 rounded-lg ${finalStyle.bgColor} ${finalStyle.borderColor} border-2`}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className={`text-2xl font-bold ${finalStyle.textColor}`}>
            {finalStyle.icon}
          </span>
          <span className={`text-xl font-bold ${finalStyle.textColor}`}>
            SOLOMON DECISION: {finalStyle.label}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          確信度: {Math.round(judgeResponse.confidence * 100)}%
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Skeleton Loading Component
// =============================================================================

/**
 * SOLOMON Judge用スケルトンローディング
 */
const JudgeResponseSkeleton: React.FC = () => {
  return (
    <Card className="p-6 animate-pulse">
      {/* MAGIシステムヘッダーのスケルトン */}
      <div className="text-center mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
        <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
      </div>

      {/* 投票結果のスケルトン */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
            <div className="h-3 bg-gray-100 rounded w-12 mx-auto"></div>
          </div>
        ))}
      </div>

      {/* スコアチャートのスケルトン */}
      <div className="space-y-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3"></div>
            <div className="h-3 bg-gray-100 rounded w-full"></div>
          </div>
        ))}
      </div>

      {/* 最終判断のスケルトン */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-24 mx-auto"></div>
      </div>
    </Card>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * JudgeResponsePanel メインコンポーネント
 */
export const JudgeResponsePanel: React.FC<JudgeResponsePanelProps> = ({
  judgeResponse,
  agentResponses = [],
  loading = false,
  error,
  expanded: controlledExpanded,
  onExpandedChange,
  className = '',
}) => {
  // 内部状態管理
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // 展開状態の決定
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  // 展開状態の変更処理
  const handleExpandedChange = (newExpanded: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  // エラー状態の表示
  if (error) {
    return (
      <Card className={`p-6 border-red-200 bg-red-50 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 font-bold text-xl">!</span>
          </div>
          <h3 className="font-semibold text-red-800 mb-2">SOLOMON Judge エラー</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Button 
            variant="secondary"
            onClick={() => window.location.reload()}
            className="text-red-700 hover:text-red-800"
          >
            再試行
          </Button>
        </div>
      </Card>
    );
  }

  // ローディング状態の表示
  if (loading || !judgeResponse) {
    return <JudgeResponseSkeleton />;
  }

  return (
    <Card className={`p-6 ${className}`} role="article" aria-labelledby="solomon-judge-title">
      {/* SOLOMONヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
            S
          </div>
          <div>
            <h2 id="solomon-judge-title" className="text-lg font-bold text-gray-900">
              SOLOMON Judge
            </h2>
            <p className="text-sm text-gray-600">統括者による最終評価</p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {judgeResponse.executionTime}ms
        </div>
      </div>

      {/* MAGI投票結果表示 */}
      <MAGIVotingDisplay 
        judgeResponse={judgeResponse} 
        agentResponses={agentResponses} 
      />

      {/* スコア可視化 */}
      {judgeResponse.scores && judgeResponse.scores.length > 0 && (
        <div className="mb-6">
          <ScoreVisualization scores={judgeResponse.scores} />
        </div>
      )}

      {/* 統合評価と推奨 */}
      <div className="space-y-4">
        {/* 評価サマリー */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">統合評価</h4>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
            {judgeResponse.summary}
          </p>
        </div>

        {/* 最終推奨（展開可能） */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">最終推奨</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExpandedChange(!expanded)}
              aria-expanded={expanded}
              aria-controls="solomon-recommendation"
              className="text-gray-500 hover:text-gray-700"
            >
              {expanded ? '折りたたむ' : '詳細を見る'}
            </Button>
          </div>
          
          <div 
            id="solomon-recommendation"
            className={`text-sm text-gray-700 leading-relaxed ${
              expanded ? '' : 'line-clamp-2'
            }`}
          >
            <p className="mb-2">{judgeResponse.finalRecommendation}</p>
            {expanded && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-900 mb-1">判断根拠</h5>
                <p className="text-blue-800 text-sm">{judgeResponse.reasoning}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メタデータ */}
      <div className="flex justify-between items-center text-xs text-gray-500 pt-4 mt-4 border-t border-gray-100">
        <span>
          {judgeResponse.timestamp.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
        <span className="text-orange-600 font-medium">
          SOLOMON Judge v2025.1
        </span>
      </div>
    </Card>
  );
};

// =============================================================================
// Export
// =============================================================================

export default JudgeResponsePanel;