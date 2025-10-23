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
import { User, Bot, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
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
 * - 左寄せ表示でアシスタントメッセージを識別
 * - 白色背景で視覚的区別
 * - エージェント応答とJudge評価の展開可能表示
 * - 段階的な情報開示によるUX向上
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
  const [showAgentResponses, setShowAgentResponses] = useState(false);
  const [showJudgeResponse, setShowJudgeResponse] = useState(false);

  /**
   * エージェント応答の表示切り替え
   */
  const toggleAgentResponses = useCallback(() => {
    setShowAgentResponses(prev => !prev);
  }, []);

  /**
   * Judge応答の表示切り替え
   */
  const toggleJudgeResponse = useCallback(() => {
    setShowJudgeResponse(prev => !prev);
  }, []);

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="max-w-4xl w-full">
        <Card className="bg-white border border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {/* メインコンテンツ */}
              <div className="mb-3">
                <p className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                  {content}
                </p>
              </div>

              {/* エージェント応答セクション */}
              {agentResponses && agentResponses.length > 0 && (
                <div className="mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAgentResponses}
                    className="flex items-center space-x-2 mb-2"
                    aria-expanded={showAgentResponses}
                    aria-label="3賢者の詳細回答を表示"
                  >
                    <span>3賢者の詳細回答</span>
                    {showAgentResponses ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {showAgentResponses && (
                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      {agentResponses.map((response) => (
                        <AgentResponsePanel
                          key={response.agentId}
                          response={response}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SOLOMON Judge評価セクション */}
              {judgeResponse && (
                <div className="mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleJudgeResponse}
                    className="flex items-center space-x-2 mb-2"
                    aria-expanded={showJudgeResponse}
                    aria-label="SOLOMON Judge評価を表示"
                  >
                    <span>SOLOMON Judge評価</span>
                    {showJudgeResponse ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {showJudgeResponse && (
                    <div className="pl-4 border-l-2 border-blue-200">
                      <JudgeResponsePanel
                        judgeResponse={judgeResponse}
                        agentResponses={agentResponses || []}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* メタデータ */}
              <MessageMetadata
                timestamp={typeof timestamp === 'string' ? timestamp : timestamp.toISOString()}
                traceId={traceId}
                onTraceView={onTraceView}
              />
            </div>
          </div>
        </Card>
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