/**
 * MAGIWithTrace Component - MAGI意思決定システムとトレース可視化の統合
 * 
 * このコンポーネントはMAGI意思決定システムとリアルタイムトレース可視化を
 * 統合したインターフェースを提供します。ユーザーは質問を投稿し、
 * 3賢者の判断過程をリアルタイムで確認できます。
 * 
 * 設計理由:
 * - MAGI応答とトレース表示の統合
 * - リアルタイム実行の可視化
 * - ユーザーエクスペリエンスの向上
 * - 段階的な情報開示による理解促進
 * 
 * 学習ポイント:
 * - 複数コンポーネントの統合パターン
 * - 状態管理の複雑性への対処
 * - リアルタイム更新の実装
 * - ユーザーインタラクションの設計
 */

'use client';

import React, { useState, useCallback } from 'react';
import { MAGISystemInterface } from './MAGISystemInterface';
import { ReasoningTracePanel } from '@/components/trace';
import { AskAgentResponse } from '@/types/api';
import { TraceStep } from '@/types/domain';
import { generateTraceId } from '@/lib/trace/mock-trace-data';
import { Button } from '@/components/ui/Button';
import { 
  Eye, 
  EyeOff,
  RotateCcw,
  Info
} from 'lucide-react';

/**
 * 表示モードの定義
 */
type DisplayMode = 'both' | 'magi-only' | 'trace-only';

/**
 * MAGIWithTraceコンポーネントのProps
 */
interface MAGIWithTraceProps {
  className?: string;
  defaultMode?: DisplayMode;
  showModeToggle?: boolean;
}

/**
 * MAGIWithTrace - MAGI意思決定システムとトレース可視化の統合コンポーネント
 * 
 * 機能:
 * - MAGI意思決定システムの実行
 * - リアルタイムトレース可視化
 * - 表示モードの切り替え
 * - 実行状態の管理
 * - エラーハンドリング
 * 
 * 要件対応:
 * - 3.1, 3.2: 3賢者とSOLOMON Judgeによる多視点分析
 * - 4.1, 4.2: リアルタイムトレース更新と段階的表示
 * - 4.6: トレース完了状態と進行状況表示
 */
export default function MAGIWithTrace({
  className = '',
  defaultMode = 'both',
  showModeToggle = true
}: MAGIWithTraceProps) {
  // 状態管理
  const [displayMode, setDisplayMode] = useState<DisplayMode>(defaultMode);
  const [currentTraceId, setCurrentTraceId] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [magiResponse, setMagiResponse] = useState<AskAgentResponse | undefined>(undefined);
  const [executionError, setExecutionError] = useState<string | null>(null);

  /**
   * MAGI実行の開始
   */
  const handleMAGIExecution = useCallback(async (question: string) => {
    setIsExecuting(true);
    setExecutionError(null);
    setMagiResponse(undefined);
    
    // 新しいトレースIDを生成
    const traceId = generateTraceId();
    setCurrentTraceId(traceId);

    try {
      // MAGIシステムの実行をシミュレート
      // Phase 3以降では実際のエージェント実行に置き換え
      const { mockMAGIExecution } = await import('@/lib/mock/data');
      const response = await mockMAGIExecution.random(question);
      
      // トレースIDを設定
      response.traceId = traceId;
      
      setMagiResponse(response);
    } catch (error) {
      console.error('MAGI execution failed:', error);
      setExecutionError(error instanceof Error ? error.message : 'MAGI実行中にエラーが発生しました');
    } finally {
      setIsExecuting(false);
    }
  }, []);

  /**
   * トレース実行完了時の処理
   */
  const handleTraceComplete = useCallback((steps: TraceStep[]) => {
    console.log('Trace completed with', steps.length, 'steps');
    // 必要に応じて追加の処理を実装
  }, []);

  /**
   * 実行のリセット
   */
  const handleReset = useCallback(() => {
    setCurrentTraceId('');
    setMagiResponse(undefined);
    setExecutionError(null);
    setIsExecuting(false);
  }, []);

  /**
   * 表示モードの切り替え
   */
  const handleModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
  };

  /**
   * 表示モードに応じたレイアウトクラスの取得
   */
  const getLayoutClasses = () => {
    switch (displayMode) {
      case 'both':
        return 'grid grid-cols-1 lg:grid-cols-2 gap-6';
      case 'magi-only':
      case 'trace-only':
        return 'max-w-4xl mx-auto';
      default:
        return 'grid grid-cols-1 lg:grid-cols-2 gap-6';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダーとコントロール */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              MAGI意思決定システム with リアルタイムトレース
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              3賢者による多視点分析と推論過程の可視化
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* リセットボタン */}
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isExecuting}
              className="text-sm"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              リセット
            </Button>

            {/* 表示モード切り替え */}
            {showModeToggle && (
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleModeChange('both')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    displayMode === 'both'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  両方
                </button>
                <button
                  onClick={() => handleModeChange('magi-only')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    displayMode === 'magi-only'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  MAGI
                </button>
                <button
                  onClick={() => handleModeChange('trace-only')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    displayMode === 'trace-only'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  トレース
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 実行状態の表示 */}
        {isExecuting && (
          <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-800">MAGI実行中...</span>
          </div>
        )}

        {/* エラー表示 */}
        {executionError && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
            <Info className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{executionError}</span>
          </div>
        )}
      </div>

      {/* メインコンテンツエリア */}
      <div className={getLayoutClasses()}>
        {/* MAGI意思決定システム */}
        {(displayMode === 'both' || displayMode === 'magi-only') && (
          <div className="space-y-6">
            {/* 質問入力フォーム */}
            {!magiResponse && !isExecuting && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  MAGI意思決定システムに質問する
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const question = formData.get('question') as string;
                  if (question.trim()) {
                    handleMAGIExecution(question.trim());
                  }
                }}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                        質問内容
                      </label>
                      <textarea
                        id="question"
                        name="question"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 新しいAIシステムを導入すべきでしょうか？"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        MAGI実行
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* MAGI応答表示 */}
            <MAGISystemInterface
              response={magiResponse}
              loading={isExecuting}
              className="h-fit"
            />
          </div>
        )}

        {/* リアルタイムトレース */}
        {(displayMode === 'both' || displayMode === 'trace-only') && currentTraceId && (
          <div className="space-y-6">
            <ReasoningTracePanel
              traceId={currentTraceId}
              realTimeUpdates={true}
              orchestratorMode="solomon_orchestrated"
              autoStart={true}
              onExecutionComplete={handleTraceComplete}
              className="h-fit"
            />
          </div>
        )}

        {/* トレース待機状態 */}
        {(displayMode === 'both' || displayMode === 'trace-only') && !currentTraceId && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <EyeOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              トレース待機中
            </h3>
            <p className="text-gray-600">
              MAGIシステムを実行するとリアルタイムトレースが表示されます
            </p>
          </div>
        )}
      </div>

      {/* 使用方法の説明 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          使用方法
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <strong>MAGI実行:</strong> 
            質問を入力してMAGIシステムを実行すると、3賢者の判断とSOLOMONの評価が表示されます。
          </div>
          <div>
            <strong>リアルタイムトレース:</strong> 
            実行中の推論過程がリアルタイムで可視化され、各ステップの詳細を確認できます。
          </div>
          <div>
            <strong>表示モード:</strong> 
            「両方」「MAGI」「トレース」の表示モードを切り替えて、必要な情報に集中できます。
          </div>
          <div>
            <strong>ステップ詳細:</strong> 
            各トレースステップをクリックすると、使用ツールや引用リンクなどの詳細情報が表示されます。
          </div>
        </div>
      </div>
    </div>
  );
}