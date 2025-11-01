/**
 * MessageBubble - メッセージ表示コンポーネント
 * 
 * このコンポーネントはユーザーとアシスタントのメッセージを適切に表示します。
 * エージェント応答、SOLOMON Judge評価、トレース情報を含む複雑なメッセージ構造に対応します。
 * 
 * 目的:
 * - ユーザーとアシスタントメッセージの区別表示
 * - エージェント応答の詳細表示
 * - SOLOMON Judge評価の可視化
 * - トレース情報へのアクセス
 * - アクセシビリティ対応
 * 
 * 設計理由:
 * - チャットUIの標準的なバブル形式
 * - エージェント応答の段階的表示
 * - 視覚的な区別による情報整理
 * - 展開可能な詳細情報
 * 
 * 使用例:
 * ```typescript
 * <MessageBubble
 *   message={message}
 *   onTraceView={handleTraceView}
 * />
 * ```
 * 
 * 関連: src/components/agents/AgentResponsePanel.tsx, src/components/agents/JudgeResponsePanel.tsx
 */

'use client';

import React, { useState, useCallback } from 'react';
import { User, Bot, Clock, Eye, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AgentResponsePanel } from '@/components/agents/AgentResponsePanel';
import { JudgeResponsePanel } from '@/components/agents/JudgeResponsePanel';
import type { Message, AgentResponse, JudgeResponse } from '@/lib/amplify/types';

/**
 * コンポーネントのプロパティ型定義
 * 
 * 設計理由:
 * - message: 表示するメッセージデータ
 * - onTraceView: トレース表示時のコールバック
 * - className: 追加のCSSクラス
 */
interface MessageBubbleProps {
  message: Message;
  onTraceView?: ((traceId: string) => void) | undefined;
  className?: string;
}

/**
 * ユーザーメッセージのプロパティ型定義
 */
interface UserMessageProps {
  content: string;
  timestamp: string | Date;
  className?: string;
}

/**
 * アシスタントメッセージのプロパティ型定義
 */
interface AssistantMessageProps {
  content: string;
  timestamp: string | Date;
  agentResponses?: AgentResponse[] | undefined;
  judgeResponse?: JudgeResponse | undefined;
  traceId?: string | undefined;
  onTraceView?: ((traceId: string) => void) | undefined;
  className?: string;
}

/**
 * メッセージメタデータのプロパティ型定義
 */
interface MessageMetadataProps {
  timestamp: string;
  traceId?: string | undefined;
  onTraceView?: ((traceId: string) => void) | undefined;
}

/**
 * エージェントカラムコンポーネント
 */
interface AgentColumnProps {
  agent: AgentResponse;
  color: 'blue' | 'purple' | 'green';
  isExpanded: boolean;
  onToggle: () => void;
  traceId?: string | undefined;
}

const AgentColumn: React.FC<AgentColumnProps> = ({
  agent,
  color,
  isExpanded,
  onToggle,
  traceId
}) => {
  const colorClasses = {
    blue: {
      border: 'border-l-4 border-blue-500',
      bg: 'bg-gray-50',
      icon: '🔵',
      name: 'CASPAR',
      type: '保守型'
    },
    purple: {
      border: 'border-l-4 border-purple-600',
      bg: 'bg-gray-50',
      icon: '🟣',
      name: 'BALTHASAR',
      type: '革新型'
    },
    green: {
      border: 'border-l-4 border-green-500',
      bg: 'bg-gray-50',
      icon: '🟢',
      name: 'MELCHIOR',
      type: 'バランス型'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`flex flex-col ${colors.border} rounded-lg bg-white overflow-hidden h-[500px]`}>
      {/* ヘッダー（固定） */}
      <div className={`p-4 border-b border-gray-200 ${colors.bg} flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{colors.icon}</span>
            <div>
              <div className="font-semibold text-sm text-gray-900">{colors.name}</div>
              <div className="text-xs text-gray-600">{colors.type}</div>
            </div>
          </div>
          <div className="font-semibold text-blue-600 text-sm">
            {Math.round((agent.confidence || 0.8) * 100)}点
          </div>
        </div>
      </div>

      {/* スクロール可能なコンテンツ */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* 思考プロセスセクション */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 font-medium w-full text-left"
          >
            <span className={`transition-transform inline-block ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>▼</span>
            思考プロセスを表示
          </button>
          
          {isExpanded && (
            <div className="mt-3 bg-gray-50 border-l-3 border-gray-300 p-3 rounded text-[11px] text-gray-700 leading-relaxed max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <div className="mb-2.5 pb-2.5 border-b border-gray-200 last:mb-0 last:pb-0 last:border-b-0">
                <div className="font-semibold text-gray-900 mb-1">1. 質問の解析</div>
                <div className="text-[10px] text-gray-600">質問内容を分析し、回答の方向性を決定</div>
              </div>
              <div className="mb-2.5 pb-2.5 border-b border-gray-200 last:mb-0 last:pb-0 last:border-b-0">
                <div className="font-semibold text-gray-900 mb-1">2. 情報収集</div>
                <div className="text-[10px] text-gray-600">{agent.reasoning || '関連情報を収集中...'}</div>
              </div>
              <div className="mb-2.5 pb-2.5 border-b border-gray-200 last:mb-0 last:pb-0 last:border-b-0">
                <div className="font-semibold text-gray-900 mb-1">3. 分析と評価</div>
                <div className="text-[10px] text-gray-600">収集した情報を{colors.type}の視点で分析</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">4. 結論の導出</div>
                <div className="text-[10px] text-gray-600">判断: {agent.decision}</div>
              </div>
            </div>
          )}
        </div>

        {/* 回答セクション */}
        <div>
          <div className="flex gap-4 mb-3 border-b border-gray-200 pb-2.5">
            <div className="text-xs text-gray-900 border-b-2 border-gray-900 pb-1 font-medium">⊙ 回答</div>
            <div className="text-xs text-gray-600 pb-1">🖼 Images</div>
          </div>
          {agent.content ? (
            <>
              <div className="text-[11px] text-gray-600 mb-3">✓ 1ステップが完了しました ›</div>
              <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                {agent.content}
                {!agent.decision && (
                  <span className="inline-block w-2 h-4 ml-1 bg-gray-900 animate-pulse" />
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>回答を準備中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * SOLOMON Judgeカードコンポーネント
 */
interface SolomonJudgeCardProps {
  judgeResponse: JudgeResponse;
  agentResponses: AgentResponse[];
  isExpanded: boolean;
  onToggle: () => void;
  traceId?: string | undefined;
}

const SolomonJudgeCard: React.FC<SolomonJudgeCardProps> = ({
  judgeResponse,
  agentResponses,
  isExpanded,
  onToggle,
  traceId
}) => {
  return (
    <div className="border-l-4 border-amber-500 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
      {/* ヘッダー（固定） */}
      <div className="p-4 border-b border-amber-300 bg-yellow-50 flex items-center gap-2.5">
        <span className="text-xl">🟡</span>
        <div>
          <div className="font-semibold text-sm text-gray-900">SOLOMON JUDGE</div>
          <div className="text-xs text-gray-600">総合判定</div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {/* 思考プロセスセクション */}
        <div className="mb-4 pb-4 border-b border-amber-300">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 font-medium w-full text-left"
          >
            <span className={`transition-transform inline-block ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>▼</span>
            統合分析プロセスを表示
          </button>
          
          {isExpanded && (
            <div className="mt-3 bg-white border-l-3 border-amber-400 p-3 rounded text-[11px] text-gray-700 leading-relaxed">
              <div className="mb-2.5 pb-2.5 border-b border-gray-200 last:mb-0 last:pb-0 last:border-b-0">
                <div className="font-semibold text-gray-900 mb-1">1. 各賢者の分析評価</div>
                <div className="text-[10px] text-gray-600">3賢者の回答を個別に評価し、重要度を判定</div>
              </div>
              <div className="mb-2.5 pb-2.5 border-b border-gray-200 last:mb-0 last:pb-0 last:border-b-0">
                <div className="font-semibold text-gray-900 mb-1">2. 情報の相互検証</div>
                <div className="text-[10px] text-gray-600">複数の視点で重複する情報を確認し、信頼性を評価</div>
              </div>
              <div className="mb-2.5 pb-2.5 border-b border-gray-200 last:mb-0 last:pb-0 last:border-b-0">
                <div className="font-semibold text-gray-900 mb-1">3. 統合的価値判定</div>
                <div className="text-[10px] text-gray-600">{judgeResponse.reasoning || '3つの視点を統合し、総合的な価値を算出'}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">4. 最終判断と推奨</div>
                <div className="text-[10px] text-gray-600">最終判断: {judgeResponse.finalDecision}</div>
              </div>
            </div>
          )}
        </div>

        {/* 分析結果 */}
        <div className="space-y-4">
          {/* 各賢者のスコア */}
          {judgeResponse.scores && judgeResponse.scores.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-900 mb-2">各賢者の評価</div>
              <div className="space-y-2">
                {judgeResponse.scores.map((score) => (
                  <div key={score.agentId} className="bg-white p-2.5 rounded-md border border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-700">
                        {score.agentId.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-bold text-blue-600">
                        {score.score}点
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{score.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 最終推奨 */}
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <div className="text-xs font-semibold text-gray-900 mb-2">最終推奨</div>
            <div className="text-[11px] text-gray-800 leading-relaxed whitespace-pre-wrap">
              {judgeResponse.finalRecommendation || judgeResponse.summary}
            </div>
            <div className="mt-2 text-[11px]">
              <div className="text-gray-600">
                判断: <span className={`font-semibold ${
                  judgeResponse.finalDecision === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {judgeResponse.finalDecision}
                </span>
              </div>
              <div className="text-gray-600 mt-1">
                確信度: <span className="font-semibold text-blue-600">
                  {Math.round((judgeResponse.confidence || 0.8) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 時刻フォーマット関数
 * 
 * 学習ポイント:
 * - 日本語ロケールでの時刻表示
 * - 相対時間と絶対時間の使い分け
 */
const formatTimestamp = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'たった今';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  } else if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}時間前`;
  } else {
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

/**
 * メッセージメタデータコンポーネント
 * 
 * 設計理由:
 * - タイムスタンプの表示
 * - トレースIDへのアクセス
 * - 統一されたメタデータ表示
 */
const MessageMetadata: React.FC<MessageMetadataProps> = ({
  timestamp,
  traceId,
  onTraceView
}) => (
  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
    <div className="flex items-center space-x-1">
      <Clock className="w-3 h-3" />
      <span>{formatTimestamp(timestamp)}</span>
    </div>
    {traceId && onTraceView && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTraceView(traceId)}
        className="p-0 h-auto text-xs text-blue-500 hover:text-blue-700"
        aria-label="実行トレースを表示"
      >
        <Eye className="w-3 h-3 mr-1" />
        トレース
      </Button>
    )}
  </div>
);

/**
 * ユーザーメッセージコンポーネント
 * 
 * 設計理由:
 * - 右寄せ表示でユーザーメッセージを識別
 * - 青色系の背景で視覚的区別
 * - シンプルな構造で読みやすさを重視
 */
const UserMessage: React.FC<UserMessageProps> = ({
  content,
  timestamp,
  className = ''
}) => (
  <div className={`flex justify-end ${className}`}>
    <div className="max-w-3xl">
      <Card className="bg-blue-500 text-white p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-1">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
        <MessageMetadata timestamp={typeof timestamp === 'string' ? timestamp : timestamp.toISOString()} />
      </Card>
    </div>
  </div>
);

/**
 * アシスタントメッセージコンポーネント
 * 
 * 設計理由:
 * - 3カラムレイアウトで3賢者を横並び表示
 * - 各エージェントの思考プロセスを展開表示
 * - SOLOMON Judgeを下部に配置
 * - スクロール可能な各カラム
 */
const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  timestamp,
  agentResponses,
  judgeResponse,
  traceId,
  onTraceView,
  className = ''
}) => {
  // 各エージェントの思考プロセス展開状態
  const [expandedThinking, setExpandedThinking] = useState<{[key: string]: boolean}>({
    caspar: false,
    balthasar: false,
    melchior: false,
    solomon: false
  });

  /**
   * 思考プロセスの展開切り替え
   */
  const toggleThinking = useCallback((agentId: string) => {
    setExpandedThinking(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  }, []);

  // エージェント応答を整理
  const casparResponse = agentResponses?.find(r => r.agentId === 'caspar');
  const balthasarResponse = agentResponses?.find(r => r.agentId === 'balthasar');
  const melchiorResponse = agentResponses?.find(r => r.agentId === 'melchior');

  // ストリーミング中かどうかを判定
  const isStreaming = agentResponses && agentResponses.some(r => !r.decision);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* 3カラムレイアウト: 3賢者 */}
      {agentResponses && agentResponses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {/* MELCHIOR カラム */}
          {melchiorResponse && (
            <AgentColumn
              agent={melchiorResponse}
              color="green"
              isExpanded={expandedThinking.melchior || false}
              onToggle={() => toggleThinking('melchior')}
              traceId={traceId}
            />
          )}

          {/* CASPAR カラム */}
          {casparResponse && (
            <AgentColumn
              agent={casparResponse}
              color="blue"
              isExpanded={expandedThinking.caspar || false}
              onToggle={() => toggleThinking('caspar')}
              traceId={traceId}
            />
          )}

          {/* BALTHASAR カラム */}
          {balthasarResponse && (
            <AgentColumn
              agent={balthasarResponse}
              color="purple"
              isExpanded={expandedThinking.balthasar || false}
              onToggle={() => toggleThinking('balthasar')}
              traceId={traceId}
            />
          )}
        </div>
      )}

      {/* SOLOMON Judge評価 */}
      {judgeResponse && (
        <SolomonJudgeCard
          judgeResponse={judgeResponse}
          agentResponses={agentResponses || []}
          isExpanded={expandedThinking.solomon || false}
          onToggle={() => toggleThinking('solomon')}
          traceId={traceId}
        />
      )}

      {/* メタデータ */}
      <div className="text-right">
        <MessageMetadata
          timestamp={typeof timestamp === 'string' ? timestamp : timestamp.toISOString()}
          traceId={traceId}
          onTraceView={onTraceView}
        />
      </div>
    </div>
  );
};

/**
 * MessageBubble メインコンポーネント
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onTraceView,
  className = ''
}) => {
  /**
   * メッセージタイプに応じたコンポーネントの選択
   * 
   * 学習ポイント:
   * - role プロパティによる条件分岐
   * - 型安全なプロパティの受け渡し
   * - 統一されたインターフェース
   */
  if (message.role === 'user') {
    return (
      <UserMessage
        content={message.content}
        timestamp={message.createdAt}
        className={className}
      />
    );
  }

  return (
    <AssistantMessage
      content={message.content}
      timestamp={message.createdAt}
      agentResponses={message.agentResponses || undefined}
      judgeResponse={message.judgeResponse || undefined}
      traceId={message.traceId || undefined}
      onTraceView={onTraceView}
      className={className}
    />
  );
};

export default MessageBubble;

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な使用:
 * ```typescript
 * const MessageList = ({ messages }: { messages: Message[] }) => {
 *   const handleTraceView = (traceId: string) => {
 *     // トレース表示ロジック
 *     console.log('Viewing trace:', traceId);
 *   };
 * 
 *   return (
 *     <div className="space-y-4">
 *       {messages.map(message => (
 *         <MessageBubble
 *           key={message.id}
 *           message={message}
 *           onTraceView={handleTraceView}
 *         />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 * 
 * 2. カスタムスタイリング:
 * ```typescript
 * <MessageBubble
 *   message={message}
 *   className="mb-6"
 *   onTraceView={handleTraceView}
 * />
 * ```
 * 
 * 3. トレース表示の統合:
 * ```typescript
 * const handleTraceView = (traceId: string) => {
 *   setSelectedTraceId(traceId);
 *   setShowTraceModal(true);
 * };
 * 
 * return (
 *   <>
 *     <MessageBubble
 *       message={message}
 *       onTraceView={handleTraceView}
 *     />
 *     {showTraceModal && (
 *       <TraceModal
 *         traceId={selectedTraceId}
 *         onClose={() => setShowTraceModal(false)}
 *       />
 *     )}
 *   </>
 * );
 * ```
 * 
 * 4. アクセシビリティ対応:
 * - ARIA属性による適切な情報提供
 * - キーボードナビゲーション対応
 * - スクリーンリーダー対応
 * - 展開可能セクションの状態表示
 */