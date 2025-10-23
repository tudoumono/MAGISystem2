/**
 * TraceStepItem Component - 個別トレースステップの表示
 * 
 * このコンポーネントは実行トレースの各ステップを表示します。
 * 展開可能な詳細表示、ツール使用状況、引用リンク、
 * 実行時間とエラー回数の可視化を提供します。
 * 
 * 設計理由:
 * - 展開/折りたたみ機能でUIの見やすさを確保
 * - ツール使用と引用の明確な表示で透明性を向上
 * - 実行時間とエラー回数で性能監視をサポート
 * - アクセシビリティを考慮したキーボード操作対応
 * 
 * 学習ポイント:
 * - React Stateによる展開状態管理
 * - 条件付きレンダリングによる詳細表示制御
 * - アクセシビリティ属性の適切な使用
 * - TypeScriptによる型安全性の確保
 */

'use client';

import React, { useState } from 'react';
import { TraceStep } from '@/types/domain';
import { AGENT_DESCRIPTIONS } from '@/types/domain';
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  Wrench 
} from 'lucide-react';

/**
 * TraceStepItemコンポーネントのProps
 * 
 * 設計理由:
 * - step: 表示するトレースステップデータ
 * - expanded: 初期展開状態（オプション）
 * - onToggle: 展開状態変更時のコールバック（親コンポーネントでの状態管理用）
 */
interface TraceStepItemProps {
  step: TraceStep;
  expanded?: boolean;
  onToggle?: (stepId: string, isExpanded: boolean) => void;
}

/**
 * TraceStepItem - 展開可能詳細付きトレースステップ表示
 * 
 * 機能:
 * - ステップ基本情報の表示（ステップ番号、エージェント、アクション）
 * - 展開/折りたたみによる詳細情報の表示制御
 * - ツール使用状況の可視化
 * - 引用リンクのクリック可能表示
 * - 実行時間とエラー回数の視覚的表示
 * - アクセシビリティ対応（キーボード操作、スクリーンリーダー）
 * 
 * 要件対応:
 * - 4.1: リアルタイムトレース表示
 * - 4.2: ステップ詳細の段階的表示
 * - 4.3: ツール使用と引用の表示
 * - 4.6: 実行時間とエラー回数の可視化
 */
export default function TraceStepItem({ 
  step, 
  expanded: initialExpanded = false, 
  onToggle 
}: TraceStepItemProps) {
  // 展開状態の管理
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  /**
   * 展開状態の切り替え処理
   * 
   * 設計理由:
   * - 内部状態とコールバックの両方をサポート
   * - 親コンポーネントでの一括状態管理を可能にする
   */
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(step.id, newExpanded);
  };

  /**
   * エージェント名の表示用フォーマット
   */
  const getAgentDisplayName = (agentId: string): string => {
    const agentKey = agentId.toLowerCase() as keyof typeof AGENT_DESCRIPTIONS;
    if (agentKey in AGENT_DESCRIPTIONS) {
      return agentKey.toUpperCase();
    }
    return agentId.toUpperCase();
  };

  /**
   * エージェント別の色分け
   * 
   * 設計理由:
   * - 視覚的にエージェントを区別
   * - MAGIシステムの各賢者を色で識別
   * - アクセシビリティを考慮した十分なコントラスト
   */
  const getAgentColor = (agentId: string): string => {
    switch (agentId.toLowerCase()) {
      case 'solomon':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'caspar':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'balthasar':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'melchior':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * 実行時間の表示フォーマット
   */
  const formatDuration = (duration: number): string => {
    if (duration < 1000) {
      return `${duration}ms`;
    }
    return `${(duration / 1000).toFixed(1)}s`;
  };

  /**
   * タイムスタンプの表示フォーマット
   */
  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* ヘッダー部分 - 常に表示される基本情報 */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`trace-step-details-${step.id}`}
        aria-label={`トレースステップ ${step.stepNumber}: ${step.action}. ${isExpanded ? '詳細を非表示' : '詳細を表示'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 展開/折りたたみアイコン */}
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>

            {/* ステップ番号 */}
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                {step.stepNumber}
              </span>
            </div>

            {/* エージェント名 */}
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAgentColor(step.agentId)}`}>
                {getAgentDisplayName(step.agentId)}
              </span>
            </div>

            {/* アクション説明 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {step.action}
              </p>
            </div>
          </div>

          {/* 右側の要約情報 */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {/* 実行時間 */}
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(step.duration)}</span>
            </div>

            {/* エラー回数（0より大きい場合のみ表示） */}
            {step.errorCount > 0 && (
              <div className="flex items-center space-x-1 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{step.errorCount}</span>
              </div>
            )}

            {/* タイムスタンプ */}
            <span className="text-xs">
              {formatTimestamp(step.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* 詳細部分 - 展開時のみ表示 */}
      {isExpanded && (
        <div 
          id={`trace-step-details-${step.id}`}
          className="px-4 pb-4 border-t border-gray-100"
        >
          <div className="mt-4 space-y-4">
            {/* 使用ツール一覧 */}
            {step.toolsUsed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Wrench className="h-4 w-4 mr-1" />
                  使用ツール
                </h4>
                <div className="flex flex-wrap gap-2">
                  {step.toolsUsed.map((tool, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 引用リンク */}
            {step.citations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  参照リソース
                </h4>
                <div className="space-y-1">
                  {step.citations.map((citation, index) => (
                    <div key={index}>
                      <a
                        href={citation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                        aria-label={`外部リンク: ${citation}`}
                      >
                        {citation}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 詳細メトリクス */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  実行時間
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDuration(step.duration)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  エラー/リトライ回数
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {step.errorCount === 0 ? (
                    <span className="text-green-600">なし</span>
                  ) : (
                    <span className="text-amber-600">{step.errorCount}回</span>
                  )}
                </dd>
              </div>
            </div>

            {/* トレースID（デバッグ用） */}
            <div className="pt-2 border-t border-gray-100">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                トレースID
              </dt>
              <dd className="mt-1 text-xs text-gray-600 font-mono break-all">
                {step.traceId}
              </dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}