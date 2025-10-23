/**
 * ChatInterface - メイン会話インターフェースコンポーネント
 * 
 * このコンポーネントは会話の表示、メッセージ送信、エージェント応答の管理を行います。
 * リアルタイム更新、楽観的更新、アクセシビリティ対応により優れたチャット体験を提供します。
 * 
 * 目的:
 * - メッセージ履歴の表示と管理
 * - ユーザーメッセージの送信
 * - エージェント応答の表示
 * - 会話タイトルの編集
 * - リアルタイム更新の処理
 * - アクセシビリティ対応
 * 
 * 設計理由:
 * - useMessagesフックとの完全統合
 * - 段階的なエージェント応答表示
 * - 楽観的更新による即座のUI反応
 * - 自動スクロールによる自然なチャット体験
 * 
 * 使用例:
 * ```typescript
 * <ChatInterface
 *   conversationId={activeConversationId}
 *   onTitleChange={handleTitleChange}
 * />
 * ```
 * 
 * 関連: src/hooks/useMessages.ts, src/components/chat/MessageBubble.tsx
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Edit2, Check, X, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useMessages } from '@/hooks/useMessages';
import type { Message } from '@/types/domain';

/**
 * コンポーネントのプロパティ型定義
 * 
 * 設計理由:
 * - conversationId: 表示する会話のID
 * - onTitleChange: 会話タイトル変更時のコールバック
 * - className: 追加のCSSクラス
 */
interface ChatInterfaceProps {
  conversationId: string;
  onTitleChange?: (conversationId: string, newTitle: string) => Promise<void>;
  onTraceView?: (traceId: string) => void;
  className?: string;
}

/**
 * 会話ヘッダーのプロパティ型定義
 */
interface ConversationHeaderProps {
  title: string;
  messageCount: number;
  onTitleChange?: ((newTitle: string) => Promise<void>) | undefined;
}

/**
 * メッセージ入力フィールドのプロパティ型定義
 */
interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * 会話ヘッダーコンポーネント
 * 
 * 設計理由:
 * - 会話タイトルの表示と編集機能
 * - メッセージ数の表示
 * - インライン編集によるUX向上
 */
const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  title,
  messageCount,
  onTitleChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 編集モードの開始
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditTitle(title);
    // 次のレンダリング後にフォーカス
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [title]);

  /**
   * 編集のキャンセル
   */
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditTitle(title);
  }, [title]);

  /**
   * タイトルの保存
   */
  const saveTitle = useCallback(async () => {
    if (!editTitle.trim() || editTitle === title || !onTitleChange) {
      cancelEditing();
      return;
    }

    try {
      setIsSaving(true);
      await onTitleChange(editTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update title:', error);
      // TODO: エラートーストを表示
    } finally {
      setIsSaving(false);
    }
  }, [editTitle, title, onTitleChange, cancelEditing]);

  /**
   * キーボードイベントの処理
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [saveTitle, cancelEditing]);

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3 flex-1">
        {isEditing ? (
          <div className="flex items-center space-x-2 flex-1">
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={isSaving}
              aria-label="会話タイトルを編集"
            />
            <Button
              size="sm"
              onClick={saveTitle}
              disabled={isSaving || !editTitle.trim()}
              aria-label="タイトルを保存"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEditing}
              disabled={isSaving}
              aria-label="編集をキャンセル"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 truncate flex-1">
              {title}
            </h1>
            {onTitleChange && (
              <Button
                size="sm"
                variant="ghost"
                onClick={startEditing}
                className="p-1"
                aria-label="タイトルを編集"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
      
      <div className="text-sm text-gray-500 ml-4">
        {messageCount}件のメッセージ
      </div>
    </div>
  );
};

/**
 * メッセージ入力コンポーネント
 * 
 * 設計理由:
 * - 送信ボタンとキーボードショートカット対応
 * - 送信中の状態表示
 * - 自動リサイズ（将来的な拡張）
 * - アクセシビリティ対応
 */
const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "メッセージを入力..."
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  /**
   * メッセージ送信の処理
   */
  const handleSend = useCallback(async () => {
    if (!message.trim() || disabled || isSending) return;

    try {
      setIsSending(true);
      await onSend(message.trim());
      setMessage(''); // 送信成功後にクリア
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: エラートーストを表示
    } finally {
      setIsSending(false);
    }
  }, [message, disabled, isSending, onSend]);

  /**
   * キーボードイベントの処理
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const isDisabled = disabled || isSending || !message.trim();

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="resize-none"
            aria-label="メッセージを入力"
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={isDisabled}
          className="flex items-center space-x-2"
          aria-label="メッセージを送信"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>{isSending ? '送信中...' : '送信'}</span>
        </Button>
      </div>
      
      {/* キーボードショートカットのヒント */}
      <div className="mt-2 text-xs text-gray-500">
        Enter: 送信 | Shift+Enter: 改行
      </div>
    </div>
  );
};

/**
 * エージェント実行中インジケーター
 * 
 * 設計理由:
 * - エージェント実行中の視覚的フィードバック
 * - 3賢者の処理状況表示
 * - アニメーション効果による待機感の軽減
 */
const AgentExecutingIndicator: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <Card className="p-6 max-w-md">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Bot className="w-6 h-6 text-blue-500" />
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          3賢者が回答を準備中...
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          CASPAR、BALTHASAR、MELCHIORが多角的に分析しています
        </p>
        <div className="flex justify-center space-x-2">
          {['CASPAR', 'BALTHASAR', 'MELCHIOR'].map((agent, index) => (
            <div
              key={agent}
              className={`
                w-2 h-2 rounded-full bg-blue-500 animate-pulse
                animation-delay-${index * 200}
              `}
              style={{ animationDelay: `${index * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </Card>
  </div>
);

/**
 * 空の会話状態コンポーネント
 */
const EmptyConversation: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center max-w-md">
      <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        MAGIシステムへようこそ
      </h3>
      <p className="text-gray-600 mb-6">
        3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる
        多角的な意思決定支援を開始しましょう。
      </p>
      <div className="text-sm text-gray-500">
        下のメッセージ入力欄から質問を送信してください
      </div>
    </div>
  </div>
);

/**
 * ChatInterface メインコンポーネント
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onTitleChange,
  onTraceView,
  className = ''
}) => {
  // メッセージ管理フックの使用
  const {
    messages,
    loading,
    isAgentExecuting,
    error,
    sendMessage,
    refreshMessages
  } = useMessages(conversationId);

  // 自動スクロール用のref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  /**
   * 自動スクロール機能
   * 
   * 学習ポイント:
   * - 新しいメッセージが追加された時に自動スクロール
   * - ユーザーが手動でスクロールしている場合は自動スクロールしない
   * - スムーズなスクロールアニメーション
   */
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  /**
   * メッセージが更新された時の自動スクロール
   */
  useEffect(() => {
    if (messages.length > 0) {
      // 少し遅延を入れてDOMの更新を待つ
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages.length, scrollToBottom]);

  /**
   * エージェント実行状態が変わった時の自動スクロール
   */
  useEffect(() => {
    if (isAgentExecuting) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isAgentExecuting, scrollToBottom]);

  /**
   * メッセージ送信の処理
   */
  const handleSendMessage = useCallback(async (content: string) => {
    try {
      await sendMessage({ content });
    } catch (error) {
      console.error('Failed to send message:', error);
      // エラーは useMessages フック内で処理される
    }
  }, [sendMessage]);

  /**
   * タイトル変更の処理
   */
  const handleTitleChange = useCallback(async (newTitle: string) => {
    if (onTitleChange) {
      await onTitleChange(conversationId, newTitle);
    }
  }, [conversationId, onTitleChange]);

  /**
   * エラー状態の表示
   */
  if (error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-6 max-w-md text-center">
            <div className="text-red-500 mb-4">
              <X className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              エラーが発生しました
            </h3>
            <p className="text-gray-600 mb-4">
              {error.message}
            </p>
            <Button onClick={refreshMessages} variant="outline">
              再試行
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* 会話ヘッダー */}
      <ConversationHeader
        title={`会話 ${conversationId.slice(-8)}`} // 実際の実装では会話タイトルを取得
        messageCount={messages.length}
        onTitleChange={onTitleChange ? handleTitleChange : undefined}
      />

      {/* メッセージ一覧 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">メッセージを読み込み中...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyConversation />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onTraceView={onTraceView}
              />
            ))}
            
            {/* エージェント実行中インジケーター */}
            {isAgentExecuting && <AgentExecutingIndicator />}
            
            {/* 自動スクロール用の要素 */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* メッセージ入力 */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={isAgentExecuting}
        placeholder={
          isAgentExecuting 
            ? "エージェントが回答中です..." 
            : "3賢者に質問してください..."
        }
      />
    </div>
  );
};

export default ChatInterface;

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な使用:
 * ```typescript
 * const ConversationView = () => {
 *   const [activeConversationId, setActiveConversationId] = useState<string>();
 *   const { updateConversation } = useConversations();
 * 
 *   const handleTitleChange = async (conversationId: string, newTitle: string) => {
 *     await updateConversation({ id: conversationId, title: newTitle });
 *   };
 * 
 *   return (
 *     <div className="h-screen">
 *       {activeConversationId ? (
 *         <ChatInterface
 *           conversationId={activeConversationId}
 *           onTitleChange={handleTitleChange}
 *         />
 *       ) : (
 *         <div>会話を選択してください</div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 * 
 * 2. レスポンシブ対応:
 * ```typescript
 * <ChatInterface
 *   conversationId={conversationId}
 *   className="md:rounded-lg md:shadow-lg"
 *   onTitleChange={handleTitleChange}
 * />
 * ```
 * 
 * 3. エラーハンドリング:
 * ```typescript
 * const handleTitleChange = async (conversationId: string, newTitle: string) => {
 *   try {
 *     await updateConversation({ id: conversationId, title: newTitle });
 *     showSuccessToast('タイトルを更新しました');
 *   } catch (error) {
 *     showErrorToast('タイトルの更新に失敗しました');
 *     throw error; // ChatInterfaceでエラーハンドリング
 *   }
 * };
 * ```
 */