'use client';

/**
 * ConversationExample Component - 会話管理の使用例
 * 
 * このコンポーネントはuseConversationsフックの使用方法を示すサンプル実装です。
 * 実際のアプリケーションでの使用パターンと最適化手法を学習できます。
 * 
 * 目的:
 * - useConversationsフックの実践的な使用例
 * - 楽観的更新の体験
 * - エラーハンドリングの実装例
 * - UIとデータ管理の統合パターン
 * 
 * 設計理由:
 * - 学習用のサンプルコンポーネント
 * - ベストプラクティスの実演
 * - 実際のアプリケーションでの使用パターン
 * - デバッグとテストの支援
 * 
 * 学習ポイント:
 * - React Hooksとの統合
 * - 状態管理とUI更新
 * - エラーハンドリング
 * - ユーザー体験の最適化
 * 
 * 使用例:
 * ```typescript
 * // 開発環境でのテスト用
 * import { ConversationExample } from '@/components/examples/ConversationExample';
 * 
 * export default function TestPage() {
 *   return <ConversationExample />;
 * }
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/lib/amplify/index.ts
 */

'use client';

import React, { useState } from 'react';
import { useConversations } from '@/lib/amplify';
import type { Conversation } from '@/lib/amplify';

/**
 * 会話アイテムコンポーネント
 * 
 * 学習ポイント:
 * - 個別会話の表示パターン
 * - 操作ボタンの配置
 * - 状態に応じたUI変更
 */
interface ConversationItemProps {
  conversation: Conversation;
  onUpdate: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ConversationItem({ conversation, onUpdate, onDelete }: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (editTitle.trim() === conversation.title) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(conversation.id, editTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update conversation:', error);
      // エラー時は元のタイトルに戻す
      setEditTitle(conversation.title);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この会話を削除しますか？')) return;

    setIsLoading(true);
    try {
      await onDelete(conversation.id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-2 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') {
                    setEditTitle(conversation.title);
                    setIsEditing(false);
                  }
                }}
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditTitle(conversation.title);
                  setIsEditing(false);
                }}
                disabled={isLoading}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-gray-900">{conversation.title}</h3>
              <p className="text-sm text-gray-500">
                作成日: {new Date(conversation.createdAt).toLocaleString('ja-JP')}
              </p>
              {conversation.agentPresetId && (
                <p className="text-sm text-blue-600">
                  プリセット: {conversation.agentPresetId}
                </p>
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 disabled:opacity-50"
            >
              削除
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mt-2 text-sm text-gray-500">
          処理中...
        </div>
      )}
    </div>
  );
}

/**
 * メイン会話例コンポーネント
 * 
 * 学習ポイント:
 * - useConversationsフックの完全な使用例
 * - 検索機能の実装
 * - エラーハンドリング
 * - ローディング状態の管理
 */
export function ConversationExample() {
  const {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    searchConversations,
    refreshConversations
  } = useConversations();

  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 検索結果の計算
  const filteredConversations = searchQuery 
    ? searchConversations(searchQuery)
    : conversations;

  /**
   * 新規会話作成
   * 
   * 学習ポイント:
   * - 楽観的更新の体験
   * - エラーハンドリング
   * - UI状態の管理
   */
  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      await createConversation({
        title: newTitle.trim(),
        agentPresetId: 'default'
      });
      setNewTitle('');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('会話の作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * 会話更新
   * 
   * 学習ポイント:
   * - 楽観的更新の動作確認
   * - エラー時のロールバック
   */
  const handleUpdate = async (id: string, title: string) => {
    await updateConversation({ id, title });
  };

  /**
   * 会話削除
   * 
   * 学習ポイント:
   * - 楽観的削除の体験
   * - 確認ダイアログの実装
   */
  const handleDelete = async (id: string) => {
    await deleteConversation(id);
  };

  /**
   * エラー表示
   */
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <button
            onClick={refreshConversations}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          会話管理の使用例
        </h1>
        <p className="text-gray-600">
          useConversationsフックの動作を確認できます。楽観的更新により、操作が即座にUIに反映されます。
        </p>
      </div>

      {/* 新規作成フォーム */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          新しい会話を作成
        </h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="会話のタイトルを入力..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim() || isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? '作成中...' : '作成'}
          </button>
        </div>
      </div>

      {/* 検索フォーム */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="会話を検索..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={refreshConversations}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            更新
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800">総会話数</h3>
          <p className="text-2xl font-bold text-blue-900">{conversations.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800">表示中</h3>
          <p className="text-2xl font-bold text-green-900">{filteredConversations.length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-800">状態</h3>
          <p className="text-lg font-semibold text-purple-900">
            {loading ? 'ローディング中' : 'ロード完了'}
          </p>
        </div>
      </div>

      {/* 会話一覧 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          会話一覧 {searchQuery && `(検索: "${searchQuery}")`}
        </h2>

        {loading && conversations.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">会話を読み込み中...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? '検索結果が見つかりません' : '会話がありません'}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* デバッグ情報 */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          デバッグ情報
        </h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>ローディング状態: {loading ? 'true' : 'false'}</p>
          <p>エラー状態: {error ? (error instanceof Error ? error.message : String(error)) : 'なし'}</p>
          <p>総会話数: {conversations.length}</p>
          <p>フィルタ後: {filteredConversations.length}</p>
          <p>検索クエリ: {searchQuery || '(なし)'}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 使用方法とベストプラクティス
 * 
 * 1. 開発環境での使用:
 * ```typescript
 * // pages/test-conversations.tsx
 * import { ConversationExample } from '@/components/examples/ConversationExample';
 * 
 * export default function TestPage() {
 *   return (
 *     <div>
 *       <h1>会話管理テスト</h1>
 *       <ConversationExample />
 *     </div>
 *   );
 * }
 * ```
 * 
 * 2. 楽観的更新の確認:
 * - 新規作成ボタンを押すと即座にUIが更新される
 * - ネットワークエラーが発生した場合は自動的にロールバックされる
 * - 編集・削除操作も同様に楽観的更新が適用される
 * 
 * 3. エラーハンドリングの確認:
 * - ネットワークを切断して操作を試す
 * - 無効なデータで操作を試す
 * - エラー時の適切なフィードバックを確認
 * 
 * 4. パフォーマンスの確認:
 * - 大量のデータでの動作確認
 * - 検索機能のレスポンス確認
 * - リアルタイム更新の動作確認
 */