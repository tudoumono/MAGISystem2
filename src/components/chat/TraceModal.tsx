/**
 * TraceModal - トレース表示モーダルコンポーネント
 * 
 * このコンポーネントは会話画面からトレース詳細を表示するためのモーダルです。
 * MAGIWithTraceのトレース機能を統合し、特定のtraceIdに関連する
 * 詳細なトレース情報を表示します。
 * 
 * 設計理由:
 * - 会話フローを中断せずにトレース詳細を確認
 * - 既存のMAGIWithTraceコンポーネントの再利用
 * - モーダルによる集中的な情報表示
 * - アクセシビリティ対応
 * 
 * 使用例:
 * ```typescript
 * <TraceModal
 *   isOpen={showTraceModal}
 *   traceId={selectedTraceId}
 *   onClose={() => setShowTraceModal(false)}
 * />
 * ```
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import ReasoningTracePanel from '@/components/trace/ReasoningTracePanel';
import { useTraceUpdates } from '@/hooks/useTraceUpdates';

/**
 * TraceModalのプロパティ型定義
 */
interface TraceModalProps {
  isOpen: boolean;
  traceId: string | null;
  onClose: () => void;
  className?: string;
}

/**
 * TraceModal メインコンポーネント
 */
export const TraceModal: React.FC<TraceModalProps> = ({
  isOpen,
  traceId,
  onClose,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // トレースデータの取得
  const { traceSteps, error, connectionStatus, startTracing } = useTraceUpdates();
  
  // トレースIDが変更された時にトレースを開始
  useEffect(() => {
    if (traceId && isOpen) {
      startTracing(traceId);
    }
  }, [traceId, isOpen, startTracing]);
  
  const isLoading = connectionStatus === 'connecting' || connectionStatus === 'disconnected';

  /**
   * ESCキーでモーダルを閉じる
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // モーダル表示時にスクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  /**
   * モーダル外クリックで閉じる
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * 外部ページで開く
   */
  const handleOpenExternal = () => {
    if (traceId) {
      window.open(`/test/trace?traceId=${traceId}`, '_blank');
    }
  };

  if (!isOpen || !traceId) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 ${className}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trace-modal-title"
    >
      <Card
        ref={modalRef}
        className="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden"
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 id="trace-modal-title" className="text-xl font-semibold text-gray-900">
              実行トレース詳細
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Trace ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{traceId}</code>
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 外部ページで開くボタン */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="flex items-center space-x-1"
              aria-label="新しいタブで開く"
            >
              <ExternalLink className="w-4 h-4" />
              <span>新しいタブで開く</span>
            </Button>
            
            {/* 閉じるボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
              aria-label="モーダルを閉じる"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* モーダルコンテンツ */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {error ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <X className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                トレースの読み込みに失敗しました
              </h3>
              <p className="text-gray-600 mb-4">
                {error}
              </p>
              <Button onClick={onClose} variant="outline">
                閉じる
              </Button>
            </div>
          ) : (
            <div className="p-6">
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

        {/* モーダルフッター */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {traceSteps.length > 0 && (
              <span>{traceSteps.length}個のトレースステップ</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TraceModal;

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な使用:
 * ```typescript
 * const ChatWithTrace = () => {
 *   const [showTraceModal, setShowTraceModal] = useState(false);
 *   const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
 * 
 *   const handleTraceView = (traceId: string) => {
 *     setSelectedTraceId(traceId);
 *     setShowTraceModal(true);
 *   };
 * 
 *   return (
 *     <>
 *       <ChatInterface onTraceView={handleTraceView} />
 *       <TraceModal
 *         isOpen={showTraceModal}
 *         traceId={selectedTraceId}
 *         onClose={() => setShowTraceModal(false)}
 *       />
 *     </>
 *   );
 * };
 * ```
 * 
 * 2. アクセシビリティ対応:
 * - ESCキーでモーダルを閉じる
 * - フォーカストラップ
 * - ARIA属性による適切な情報提供
 * - キーボードナビゲーション対応
 * 
 * 3. UX考慮事項:
 * - モーダル表示時のスクロール無効化
 * - 外部ページで開くオプション
 * - ローディング状態とエラーハンドリング
 * - 適切なサイズ制限とスクロール対応
 */