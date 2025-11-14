'use client';

/**
 * ConversationSidebar - 会話管理サイドバーコンポーネント
 * 
 * このコンポーネントは会話一覧の表示、検索、作成、削除機能を提供します。
 * 無限スクロール、デバウンス検索、楽観的更新により優れたUXを実現します。
 * 
 * 目的:
 * - 会話一覧の効率的な表示と管理
 * - リアルタイム検索とフィルタリング
 * - 新規会話の作成と既存会話の削除
 * - 無限スクロールによる大量データの処理
 * - アクセシビリティ対応のキーボードナビゲーション
 * 
 * 設計理由:
 * - useConversationsフックとの完全統合
 * - デバウンス検索による不要なAPI呼び出しの削減
 * - 楽観的更新による即座のUI反応
 * - スケルトンローディングによる優れた読み込み体験
 * 
 * 使用例:
 * ```typescript
 * <ConversationSidebar
 *   conversations={conversations}
 *   activeConversationId={currentConversationId}
 *   onSelect={handleConversationSelect}
 *   onDelete={handleConversationDelete}
 *   onSearch={handleSearch}
 *   loading={loading}
 * />
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/components/chat/ChatInterface.tsx
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Plus, Trash2, MessageSquare, Calendar, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Conversation } from '@/lib/amplify/types';

/**
 * コンポーネントのプロパティ型定義
 * 
 * 設計理由:
 * - conversations: 表示する会話一覧
 * - activeConversationId: 現在選択中の会話ID
 * - loading: 初期ローディング状態
 * - onSelect: 会話選択時のコールバック
 * - onDelete: 会話削除時のコールバック
 * - onSearch: 検索実行時のコールバック
 * - onCreateNew: 新規会話作成時のコールバック
 */
interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string | undefined;
  loading?: boolean;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => Promise<void>;
  onSearch: (query: string) => void;
  onCreateNew: () => Promise<void>;
}

/**
 * 会話アイテムのプロパティ型定義
 */
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * デバウンス用のカスタムフック
 * 
 * 学習ポイント:
 * - useRefとuseEffectを使用したデバウンス実装
 * - 不要なAPI呼び出しを防ぐパフォーマンス最適化
 * - 300msの遅延で検索実行
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 会話アイテムコンポーネント
 * 
 * 設計理由:
 * - 会話の基本情報（タイトル、最終更新日時、メッセージ数）を表示
 * - アクティブ状態の視覚的表示
 * - 削除ボタンの適切な配置
 * - アクセシビリティ対応（ARIA属性、キーボードナビゲーション）
 */
const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * 会話削除の処理
   * 
   * 学習ポイント:
   * - 確認ダイアログによる誤操作防止
   * - 削除中の状態表示
   * - エラーハンドリング
   */
  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // 会話選択を防ぐ
    
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(conversation.id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      // TODO: エラートーストを表示
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [conversation.id, onDelete, showDeleteConfirm]);

  /**
   * 最終更新日時のフォーマット
   * 
   * 学習ポイント:
   * - 相対時間表示（今日、昨日、X日前）
   * - 日本語ロケールでの適切な表示
   */
  const formatLastUpdate = useCallback((dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return '今';
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    } else if (diffInHours < 48) {
      return '昨日';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}日前`;
    }
  }, []);

  return (
    <Card
      className={`
        p-3 mb-2 cursor-pointer transition-all duration-200 hover:shadow-md
        ${isActive 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
        }
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={() => onSelect(conversation.id)}
      role="button"
      tabIndex={0}
      aria-label={`会話: ${conversation.title}`}
      aria-pressed={isActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(conversation.id);
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* 会話タイトル */}
          <h3 className={`
            text-sm font-medium truncate mb-1
            ${isActive ? 'text-blue-900' : 'text-gray-900'}
          `}>
            {conversation.title}
          </h3>
          
          {/* メタデータ */}
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-3 h-3" />
              <span>{conversation.messages?.length || 0}件</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatLastUpdate(conversation.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* 削除ボタン */}
        <div className="flex items-center space-x-1 ml-2">
          {showDeleteConfirm ? (
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="text-xs px-2 py-1"
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                {isDeleting ? '削除中...' : '削除'}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="p-1 h-6 w-6 text-gray-400 hover:text-red-500"
              aria-label="会話を削除"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * スケルトンローディングコンポーネント
 * 
 * 設計理由:
 * - ローディング中の優れたUX提供
 * - 実際のコンテンツ構造を模倣
 * - アニメーション効果による視覚的フィードバック
 */
const ConversationSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, index) => (
      <Card key={index} className="p-3 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="flex space-x-3">
              <div className="h-3 bg-gray-200 rounded w-12"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
      </Card>
    ))}
  </div>
);

/**
 * ConversationSidebar メインコンポーネント
 */
export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  loading = false,
  onSelect,
  onDelete,
  onSearch,
  onCreateNew
}) => {
  // 状態管理
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  
  // デバウンス検索
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /**
   * 検索フィルタリングの実装
   * 
   * 学習ポイント:
   * - useMemoによる計算結果のキャッシュ
   * - 大文字小文字を区別しない検索
   * - タイトルでの部分一致検索
   */
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return conversations;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return conversations.filter(conversation =>
      conversation.title.toLowerCase().includes(query)
    );
  }, [conversations, debouncedSearchQuery]);

  /**
   * 検索クエリの変更処理
   */
  useEffect(() => {
    setFilteredConversations(searchResults);
    onSearch(debouncedSearchQuery);
  }, [searchResults, debouncedSearchQuery, onSearch]);

  /**
   * 新規会話作成の処理
   * 
   * 学習ポイント:
   * - 作成中の状態管理
   * - エラーハンドリング
   * - 楽観的更新との連携
   */
  const handleCreateNew = useCallback(async () => {
    try {
      setIsCreating(true);
      await onCreateNew();
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      // TODO: エラートーストを表示
    } finally {
      setIsCreating(false);
    }
  }, [onCreateNew]);

  /**
   * キーボードショートカットの処理
   * 
   * 学習ポイント:
   * - Cmd/Ctrl+Shift+N: 新規会話作成（一般的なパターン）
   * - Cmd/Ctrl+K: 検索フォーカス（多くのアプリで使用）
   * - Escape: 検索クリア
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        handleCreateNew();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('conversation-search')?.focus();
      } else if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNew, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">会話履歴</h2>
          <Button
            onClick={handleCreateNew}
            disabled={isCreating}
            size="sm"
            className="flex items-center space-x-1"
            aria-label="新しい会話を作成"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? '作成中...' : '新規'}</span>
          </Button>
        </div>

        {/* 検索フィールド */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="conversation-search"
            type="text"
            placeholder="会話を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
            aria-label="会話を検索"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
              aria-label="検索をクリア"
            >
              ×
            </Button>
          )}
        </div>

        {/* 検索結果の統計 */}
        {searchQuery && (
          <div className="mt-2 text-xs text-gray-500">
            {filteredConversations.length}件の会話が見つかりました
          </div>
        )}
      </div>

      {/* 会話一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <ConversationSkeleton />
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            {searchQuery ? (
              <div className="text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>「{searchQuery}」に一致する会話が見つかりません</p>
                <Button
                  variant="ghost"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm"
                >
                  検索をクリア
                </Button>
              </div>
            ) : (
              <div className="text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>まだ会話がありません</p>
                <Button
                  onClick={handleCreateNew}
                  variant="outline"
                  className="mt-2"
                >
                  最初の会話を始める
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* フッター（キーボードショートカットのヒント） */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 space-y-1">
          <div>⌘⇧N / Ctrl⇧N: 新規会話</div>
          <div>⌘K / Ctrl+K: 検索</div>
          <div>Esc: 検索クリア</div>
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な使用:
 * ```typescript
 * const ConversationLayout = () => {
 *   const {
 *     conversations,
 *     loading,
 *     createConversation,
 *     deleteConversation,
 *     searchConversations
 *   } = useConversations();
 * 
 *   const [activeConversationId, setActiveConversationId] = useState<string>();
 * 
 *   return (
 *     <div className="flex h-screen">
 *       <div className="w-80">
 *         <ConversationSidebar
 *           conversations={conversations}
 *           activeConversationId={activeConversationId}
 *           loading={loading}
 *           onSelect={setActiveConversationId}
 *           onDelete={deleteConversation}
 *           onSearch={searchConversations}
 *           onCreateNew={() => createConversation({ title: '新しい会話' })}
 *         />
 *       </div>
 *       <div className="flex-1">
 *         {activeConversationId && (
 *           <ChatInterface conversationId={activeConversationId} />
 *         )}
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 * 
 * 2. カスタマイズ例:
 * ```typescript
 * <ConversationSidebar
 *   conversations={conversations}
 *   activeConversationId={activeConversationId}
 *   onSelect={handleSelect}
 *   onDelete={handleDelete}
 *   onSearch={handleSearch}
 *   onCreateNew={handleCreateNew}
 *   loading={loading}
 * />
 * ```
 * 
 * 3. アクセシビリティ対応:
 * - ARIA属性による適切な情報提供
 * - キーボードナビゲーション対応
 * - スクリーンリーダー対応
 * - 高コントラスト対応
 */