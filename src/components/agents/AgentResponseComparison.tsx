/**
 * AgentResponseComparison - 3賢者応答比較コンポーネント
 * 
 * このコンポーネントは3賢者の応答をサイドバイサイドで比較表示します。
 * 意見の一致・分裂を視覚的に分かりやすく表現し、
 * ユーザーが各エージェントの判断を効率的に比較できます。
 * 
 * 主要機能:
 * - 3賢者の応答を並列表示
 * - 判断結果の一致・分裂の可視化
 * - レスポンシブデザイン（モバイル対応）
 * - 全体展開/折りたたみ制御
 * - 投票結果サマリー表示
 * 
 * 学習ポイント:
 * - CSS Grid Layoutの活用
 * - レスポンシブデザインパターン
 * - 状態管理とプロップドリリング
 */

'use client';

import React, { useState } from 'react';
import { AgentResponse, DecisionType, DECISION_STYLES } from '@/types/domain';
import { AgentResponsePanel } from './AgentResponsePanel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// =============================================================================
// Component Props Interface
// =============================================================================

interface AgentResponseComparisonProps {
  /** 3賢者の応答データ */
  responses?: AgentResponse[];
  /** ローディング状態 */
  loading?: boolean;
  /** エラー状態 */
  error?: string;
  /** 比較モードの有効/無効 */
  comparisonMode?: boolean;
  /** クラス名の追加 */
  className?: string;
}

// =============================================================================
// Voting Summary Component
// =============================================================================

/**
 * 投票結果サマリーコンポーネント
 * 
 * 設計理由:
 * - 3賢者の判断結果を一目で把握可能
 * - 意見の一致・分裂を視覚的に表現
 * - MAGIシステムの投票機能を強調
 */
const VotingSummary: React.FC<{ responses: AgentResponse[] }> = ({ responses }) => {
  // 投票結果の集計
  const approvedCount = responses.filter(r => r.decision === 'APPROVED').length;
  const rejectedCount = responses.filter(r => r.decision === 'REJECTED').length;
  
  // 結果の判定
  const isUnanimous = approvedCount === 3 || rejectedCount === 3;
  const majorityDecision: DecisionType = approvedCount > rejectedCount ? 'APPROVED' : 'REJECTED';
  const majorityStyle = DECISION_STYLES[majorityDecision];

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">投票結果:</span>
            <div className="flex gap-1">
              {responses.map((response, index) => (
                <div
                  key={response.agentId}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    response.decision === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={`${response.agentId.toUpperCase()}: ${DECISION_STYLES[response.decision].label}`}
                >
                  {DECISION_STYLES[response.decision].icon}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            可決 {approvedCount}票 / 否決 {rejectedCount}票
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isUnanimous && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              全員一致
            </span>
          )}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            majorityDecision === 'APPROVED' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {majorityStyle.label}
          </div>
        </div>
      </div>
    </Card>
  );
};

// =============================================================================
// Loading State Component
// =============================================================================

/**
 * 比較表示用ローディングコンポーネント
 */
const ComparisonLoadingState: React.FC = () => {
  const agentIds = ['caspar', 'balthasar', 'melchior'] as const;
  
  return (
    <div className="space-y-6">
      {/* 投票サマリーのスケルトン */}
      <Card className="p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded-full"></div>
              ))}
            </div>
            <div className="h-3 bg-gray-100 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
      </Card>

      {/* エージェントパネルのスケルトン */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {agentIds.map(agentId => (
          <AgentResponsePanel
            key={agentId}
            loading={true}
            compareMode={true}
          />
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * AgentResponseComparison メインコンポーネント
 */
export const AgentResponseComparison: React.FC<AgentResponseComparisonProps> = ({
  responses = [],
  loading = false,
  error,
  comparisonMode = true,
  className = '',
}) => {
  // 全体の展開状態管理
  const [allExpanded, setAllExpanded] = useState(false);

  // エラー状態の表示
  if (error) {
    return (
      <Card className={`p-6 border-red-200 bg-red-50 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 font-bold text-xl">!</span>
          </div>
          <h3 className="font-semibold text-red-800 mb-2">エージェント実行エラー</h3>
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
  if (loading || responses.length === 0) {
    return <ComparisonLoadingState />;
  }

  // 応答データの整理（3賢者分を確保）
  const agentOrder = ['caspar', 'balthasar', 'melchior'] as const;
  const orderedResponses = agentOrder.map(agentId => 
    responses.find(r => r.agentId === agentId)
  ).filter(Boolean) as AgentResponse[];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 投票結果サマリー */}
      {orderedResponses.length > 0 && (
        <VotingSummary responses={orderedResponses} />
      )}

      {/* 全体制御ボタン */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          3賢者の判断比較
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAllExpanded(!allExpanded)}
          className="text-gray-600 hover:text-gray-800"
        >
          {allExpanded ? '全て折りたたむ' : '全て展開'}
        </Button>
      </div>

      {/* エージェント応答の比較表示 */}
      <div className={`grid gap-6 ${
        comparisonMode 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {orderedResponses.map((response) => (
          <AgentResponsePanel
            key={response.agentId}
            response={response}
            expanded={allExpanded}
            onExpandedChange={setAllExpanded}
            compareMode={comparisonMode}
            className="h-full"
          />
        ))}
      </div>

      {/* 比較分析サマリー（3つ全て揃った場合） */}
      {orderedResponses.length === 3 && (
        <Card className="p-4 bg-gray-50 border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">分析サマリー</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-600">CASPAR (保守的)</span>
              <p className="text-gray-600 mt-1">
                リスク重視の慎重な判断
              </p>
            </div>
            <div>
              <span className="font-medium text-purple-600">BALTHASAR (革新的)</span>
              <p className="text-gray-600 mt-1">
                創造性と感情を重視した判断
              </p>
            </div>
            <div>
              <span className="font-medium text-green-600">MELCHIOR (バランス型)</span>
              <p className="text-gray-600 mt-1">
                論理的で科学的な判断
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// =============================================================================
// Export
// =============================================================================

export default AgentResponseComparison;