/**
 * AgentResponsePanel - 個別エージェント応答表示コンポーネント
 * 
 * このコンポーネントは3賢者（CASPAR、BALTHASAR、MELCHIOR）の個別応答を表示します。
 * 従来のチャット機能（詳細回答）とMAGI機能（可決/否決判断）の両方をサポートします。
 * 
 * 主要機能:
 * - 可決/否決判断の視覚的強調表示（色分け、アイコン）
 * - 詳細な回答内容の表示
 * - 判断理由と根拠の詳細表示
 * - 確信度と実行時間の表示
 * - スケルトンローディング状態
 * 
 * 学習ポイント:
 * - React 19の新機能活用
 * - アクセシビリティ対応（ARIA属性、キーボードナビゲーション）
 * - 色覚特性対応（色以外の視覚的手がかり併用）
 */

'use client';

import React, { useState } from 'react';
import { AgentResponse, AgentType, AGENT_DESCRIPTIONS, DECISION_STYLES } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// =============================================================================
// Component Props Interface
// =============================================================================

interface AgentResponsePanelProps {
  /** エージェント応答データ */
  response?: AgentResponse;
  /** ローディング状態 */
  loading?: boolean;
  /** エラー状態 */
  error?: string;
  /** 展開状態の制御（外部から制御可能） */
  expanded?: boolean;
  /** 展開状態変更のコールバック */
  onExpandedChange?: (expanded: boolean) => void;
  /** 比較モード（サイドバイサイド表示用） */
  compareMode?: boolean;
  /** クラス名の追加 */
  className?: string;
}

// =============================================================================
// Skeleton Loading Component
// =============================================================================

/**
 * スケルトンローディングコンポーネント
 * 
 * 設計理由:
 * - エージェント実行中の視覚的フィードバック提供
 * - ユーザーの待機時間体験向上
 * - 実際のコンテンツ構造を反映したスケルトン
 */
const AgentResponseSkeleton: React.FC<{ agentId: AgentType }> = ({ agentId }) => {
  const agentName = agentId.toUpperCase();
  
  return (
    <Card className="p-6 animate-pulse">
      {/* ヘッダー部分のスケルトン */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-100 rounded w-32"></div>
          </div>
        </div>
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </div>

      {/* 判断結果部分のスケルトン */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
      </div>

      {/* 回答内容部分のスケルトン */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      </div>

      {/* メタデータ部分のスケルトン */}
      <div className="flex justify-between text-sm">
        <div className="h-3 bg-gray-100 rounded w-20"></div>
        <div className="h-3 bg-gray-100 rounded w-16"></div>
      </div>

      {/* 思考中アニメーション */}
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span>{agentName} が分析中...</span>
      </div>
    </Card>
  );
};

// =============================================================================
// Error Display Component
// =============================================================================

/**
 * エラー表示コンポーネント
 */
const AgentResponseError: React.FC<{ agentId: AgentType; error: string }> = ({ agentId, error }) => {
  const agentName = agentId.toUpperCase();
  
  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-600 font-bold text-sm">!</span>
        </div>
        <div>
          <h3 className="font-semibold text-red-800">{agentName}</h3>
          <p className="text-sm text-red-600">実行エラー</p>
        </div>
      </div>
      
      <div className="p-3 bg-red-100 rounded-lg mb-4">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
      
      <Button 
        variant="secondary" 
        size="sm"
        onClick={() => window.location.reload()}
        className="text-red-700 hover:text-red-800"
      >
        再試行
      </Button>
    </Card>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * AgentResponsePanel メインコンポーネント
 */
export const AgentResponsePanel: React.FC<AgentResponsePanelProps> = ({
  response,
  loading = false,
  error,
  expanded: controlledExpanded,
  onExpandedChange,
  compareMode = false,
  className = '',
}) => {
  // 内部状態管理（外部制御されていない場合）
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // 展開状態の決定（外部制御 > 内部状態）
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
  if (error && response) {
    return <AgentResponseError agentId={response.agentId} error={error} />;
  }

  // ローディング状態の表示
  if (loading || !response) {
    // ローディング中でもagentIdが分かる場合はそれを使用
    const agentId = response?.agentId || 'caspar'; // フォールバック
    return <AgentResponseSkeleton agentId={agentId} />;
  }

  // エージェント情報の取得
  const agentName = response.agentId.toUpperCase();
  const agentDescription = AGENT_DESCRIPTIONS[response.agentId];
  const decisionStyle = DECISION_STYLES[response.decision];

  // 確信度の表示形式
  const confidencePercentage = Math.round(response.confidence * 100);
  const confidenceColor = response.confidence >= 0.8 ? 'text-green-600' : 
                         response.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card 
      className={`p-6 transition-all duration-200 hover:shadow-md ${
        compareMode ? 'h-full' : ''
      } ${className}`}
      role="article"
      aria-labelledby={`agent-${response.agentId}-title`}
    >
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* エージェントアイコン */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            response.agentId === 'caspar' ? 'bg-blue-600' :
            response.agentId === 'balthasar' ? 'bg-purple-600' :
            'bg-green-600'
          }`}>
            {agentName[0]}
          </div>
          
          {/* エージェント名と説明 */}
          <div>
            <h3 
              id={`agent-${response.agentId}-title`}
              className="font-semibold text-gray-900"
            >
              {agentName}
            </h3>
            <p className="text-sm text-gray-600 max-w-xs truncate" title={agentDescription}>
              {agentDescription.split(' - ')[1]}
            </p>
          </div>
        </div>

        {/* 実行時間表示 */}
        <div className="text-xs text-gray-500">
          {response.executionTime}ms
        </div>
      </div>

      {/* 判断結果の強調表示（MAGI機能） */}
      <div 
        className={`mb-4 p-3 rounded-lg border ${decisionStyle.bgColor} ${decisionStyle.borderColor}`}
        role="status"
        aria-label={`判断結果: ${decisionStyle.label}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span 
            className={`text-lg font-bold ${decisionStyle.textColor}`}
            aria-hidden="true"
          >
            {decisionStyle.icon}
          </span>
          <span className={`font-semibold ${decisionStyle.textColor}`}>
            {decisionStyle.label}
          </span>
          <span className={`text-sm ${confidenceColor} ml-auto`}>
            確信度: {confidencePercentage}%
          </span>
        </div>
        
        {/* 判断理由（常に表示） */}
        <p className={`text-sm ${decisionStyle.textColor} leading-relaxed`}>
          {response.reasoning}
        </p>
      </div>

      {/* 詳細回答内容（従来機能） */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">詳細分析</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExpandedChange(!expanded)}
            aria-expanded={expanded}
            aria-controls={`agent-${response.agentId}-content`}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? '折りたたむ' : '詳細を見る'}
          </Button>
        </div>
        
        <div 
          id={`agent-${response.agentId}-content`}
          className={`text-sm text-gray-700 leading-relaxed ${
            expanded ? '' : 'line-clamp-3'
          }`}
        >
          {response.content}
        </div>
      </div>

      {/* メタデータ表示 */}
      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span>
          {response.timestamp.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
        <span className={confidenceColor}>
          信頼度: {confidencePercentage}%
        </span>
      </div>
    </Card>
  );
};

// =============================================================================
// Export
// =============================================================================

export default AgentResponsePanel;