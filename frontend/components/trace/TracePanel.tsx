'use client';

/**
 * TracePanel - 推論トレース常時表示パネル
 * 
 * TraceModalを常時表示パネルに変更したコンポーネント。
 * チャット画面の右側に固定表示され、リアルタイムで推論過程を表示します。
 * 
 * 目的:
 * - 推論トレースの常時表示
 * - リアルタイム更新
 * - 折りたたみ可能
 * - スクロール対応
 * 
 * 設計理由:
 * - MAGIシステムの核心機能である推論過程を常に可視化
 * - モーダルではなくパネルにすることで、チャットと同時に確認可能
 * - 折りたたみ機能で画面を広く使える
 */

import React, { useEffect } from 'react';
import { X, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import ReasoningTracePanel from '@/components/trace/ReasoningTracePanel';
import { useTraceUpdates } from '@/hooks/useTraceUpdates';

/**
 * TracePanelのプロパティ型定義
 */
interface TracePanelProps {
  traceId: string;
  onClose?: () => void;
  className?: string;
}

/**
 * TracePanel メインコンポーネント
 */
export const TracePanel: React.FC<TracePanelProps> = ({
  traceId,
  onClose,
  className = ''
}) => {
  // トレースデータの取得
  const { traceSteps, error, connectionStatus } = useTraceUpdates(traceId, true);
  
  const isLoading = connectionStatus === 'connecting' || connectionStatus === 'disconnected';

  /**
   * 外部ページで開く
   * TODO: トレース専用ページの実装が必要
   */
  const handleOpenExternal = () => {
    // window.open(`/debug/trace?traceId=${traceId}`, '_blank');
    console.warn('Trace page not implemented yet');
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* パネルヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            推論トレース
          </h3>
          <p className="text-xs text-gray-600 truncate">
            ID: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{traceId.slice(-8)}</code>
          </p>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {/* 外部ページで開くボタン */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="p-2"
            aria-label="新しいタブで開く"
            title="新しいタブで開く"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          
          {/* 閉じるボタン */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
              aria-label="パネルを閉じる"
              title="パネルを閉じる"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* パネルコンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              トレースの読み込みに失敗
            </h4>
            <p className="text-xs text-gray-600 mb-4">
              {error}
            </p>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                閉じる
              </Button>
            )}
          </div>
        ) : isLoading ? (
          <div className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-sm text-gray-600">
              トレースを読み込み中...
            </p>
          </div>
        ) : traceSteps.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              トレースステップがまだありません
            </p>
          </div>
        ) : (
          <div className="p-4">
            <ReasoningTracePanel
              traceId={traceId}
              steps={traceSteps}
              realTimeUpdates={true}
              autoStart={false}
              className="border-0 shadow-none"
            />
          </div>
        )}
      </div>

      {/* パネルフッター */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {traceSteps.length > 0 ? (
              `${traceSteps.length}個のステップ`
            ) : (
              '待機中...'
            )}
          </span>
          
          {connectionStatus === 'connected' && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>リアルタイム更新中</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TracePanel;
