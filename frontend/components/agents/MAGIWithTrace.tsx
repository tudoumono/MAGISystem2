'use client';

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

import React, { useState, useCallback, useEffect } from 'react';
import { MAGISystemInterface } from './MAGISystemInterface';
import { ReasoningTracePanel } from '@/components/trace';
import { AskAgentResponse } from '@/types/api';
import { TraceStep } from '@/types/domain';
import { useMessages } from '@/hooks/useMessages';
import { Button } from '@/components/ui/Button';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Info,
  History
} from 'lucide-react';

/**
 * トレースIDを生成
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 表示モードの定義
 */
type DisplayMode = 'both' | 'magi-only' | 'trace-only';

/**
 * MAGIWithTraceコンポーネントのProps
 */
interface MAGIWithTraceProps {
  conversationId?: string;
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
  conversationId,
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
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isHistoryRestored, setIsHistoryRestored] = useState(false);

  // 会話履歴の管理
  const { messages, sendMessage } = useMessages(conversationId || '');

  /**
   * conversationIdが変更された時の状態リセット
   */
  useEffect(() => {
    // 新しい会話が選択された時、または会話がクリアされた時に状態をリセット
    setMagiResponse(undefined);
    setExecutionError(null);
    setCurrentQuestion('');
    setCurrentTraceId('');
    setIsExecuting(false);
    setIsHistoryRestored(false);
    
    console.log('Conversation changed to:', conversationId);
  }, [conversationId]);

  /**
   * 会話履歴から最新のMAGI応答を復元
   */
  useEffect(() => {
    if (messages.length > 0 && !isHistoryRestored) {
      // 最新のアシスタントメッセージを取得
      const latestAssistantMessage = messages
        .filter(msg => msg.role === 'assistant')
        .pop();
      
      if (latestAssistantMessage && latestAssistantMessage.agentResponses && latestAssistantMessage.judgeResponse) {
        // MAGI応答を復元
        const restoredResponse: AskAgentResponse = {
          conversationId: conversationId || '',
          messageId: latestAssistantMessage.id,
          agentResponses: latestAssistantMessage.agentResponses,
          judgeResponse: latestAssistantMessage.judgeResponse,
          traceId: latestAssistantMessage.traceId || '',
          executionTime: 0,
          timestamp: new Date(latestAssistantMessage.createdAt)
        };
        
        setMagiResponse(restoredResponse);
        setCurrentTraceId(latestAssistantMessage.traceId || '');
        setIsHistoryRestored(true); // 履歴復元完了フラグ
        
        console.log('Restored MAGI response from conversation history (no new trace execution)');
      }
    }
  }, [messages, conversationId, isHistoryRestored]);

  /**
   * XPathセレクターでのMAGI実行トリガー
   * 
   * 指定されたXPathの要素がクリックされた時にMAGI実行を開始
   */
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // XPath: /html/body/div[2]/div/div[2]/div/div/div[2]/div[1]/div[2]/div/span
      const xpath = '/html/body/div[2]/div/div[2]/div/div/div[2]/div[1]/div[2]/div/span';
      
      let shouldTrigger = false;
      
      try {
        // XPathで要素を取得
        const xpathResult = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        
        const xpathElement = xpathResult.singleNodeValue as Element;
        
        // クリックされた要素がXPathの要素と一致するかチェック
        if (xpathElement && (target === xpathElement || xpathElement.contains(target))) {
          shouldTrigger = true;
        }
      } catch (error) {
        console.warn('XPath evaluation failed:', error);
      }
      
      // data-magi-trigger属性を持つ要素もチェック
      if (
        target.hasAttribute('data-magi-trigger') ||
        target.closest('[data-magi-trigger]')
      ) {
        shouldTrigger = true;
      }
      
      if (shouldTrigger && currentQuestion.trim() && !isExecuting) {
        event.preventDefault();
        event.stopPropagation();
        console.log('MAGI execution triggered by XPath click:', xpath);
        handleMAGIExecution(currentQuestion.trim());
      }
    };

    // グローバルクリックイベントリスナーを追加
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isExecuting, currentQuestion]);

  /**
   * MAGI実行の開始
   */
  const handleMAGIExecution = useCallback(async (question: string) => {
    if (!conversationId) {
      setExecutionError('会話が選択されていません');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setMagiResponse(undefined);
    
    // 新しいトレースIDを生成
    const traceId = generateTraceId();
    setCurrentTraceId(traceId);

    try {
      // 会話履歴にメッセージを保存（useMessagesフックを使用）
      await sendMessage({ content: question });

      // 実際のMAGIシステムの実行（AgentCore Runtime標準エンドポイント）
      // Backend APIのベースURLを環境変数から取得
      const backendUrl = process.env.NEXT_PUBLIC_AGENTCORE_URL || 'http://localhost:8080';

      const response = await fetch(`${backendUrl}/invocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          conversationId,
          traceId,
          enableRealTimeTrace: true
        }),
      });

      if (!response.ok) {
        throw new Error(`MAGI API error: ${response.status}`);
      }

      const magiResult = await response.json();
      
      // レスポンスからMAGI結果を設定
      setMagiResponse(magiResult);
      setIsHistoryRestored(false); // 新しい実行なのでフラグをリセット
      
      console.log('MAGI execution completed and saved to conversation:', conversationId);
    } catch (error) {
      console.error('MAGI execution failed:', error);
      setExecutionError(error instanceof Error ? error.message : 'MAGI実行中にエラーが発生しました');
    } finally {
      setIsExecuting(false);
    }
  }, [conversationId, sendMessage]);

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
            {/* 会話履歴表示 */}
            {messages.length > 0 && !isExecuting && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    会話履歴 ({messages.length}件のメッセージ)
                  </h3>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {messages.slice(-4).map((message) => (
                    <div key={message.id} className="text-sm">
                      <div className={`p-2 rounded ${
                        message.role === 'user' 
                          ? 'bg-blue-50 text-blue-900' 
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        <div className="font-medium text-xs mb-1">
                          {message.role === 'user' ? '質問' : 'MAGI判断'}
                        </div>
                        <div className="truncate">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 質問入力フォーム */}
            {!magiResponse && !isExecuting && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  MAGI意思決定システムに質問する
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (currentQuestion.trim()) {
                    handleMAGIExecution(currentQuestion.trim());
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
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 新しいAIシステムを導入すべきでしょうか？"
                        required
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      {/* XPathテスト用要素 */}
                      <div className="text-sm text-gray-500">
                        <span 
                          data-magi-trigger="true"
                          className="cursor-pointer text-blue-600 hover:text-blue-800 underline"
                          title="XPathトリガーテスト用要素"
                        >
                          XPathクリックテスト
                        </span>
                      </div>
                      
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
            {/* 履歴復元インジケーター */}
            {isHistoryRestored && (
              <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
                <History className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm text-amber-800">
                  履歴から復元されたトレース情報です（新しい実行ではありません）
                </span>
              </div>
            )}
            
            <ReasoningTracePanel
              traceId={currentTraceId}
              realTimeUpdates={!isHistoryRestored}
              orchestratorMode="solomon_orchestrated"
              autoStart={!isHistoryRestored}
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