/**
 * useConversations Hook - 会話データ管理
 * 
 * このフックは会話（Conversation）データのCRUD操作とリアルタイム更新を提供します。
 * Amplify Data/AI Kitを使用してGraphQL操作を実行し、楽観的更新でUX向上を図ります。
 * 
 * 目的:
 * - 会話一覧の取得・管理
 * - 新規会話の作成
 * - 会話の更新・削除
 * - リアルタイム更新の処理
 * - 楽観的更新によるUX向上
 * 
 * 設計理由:
 * - React Queryパターンを採用してキャッシュとサーバー状態を管理
 * - 楽観的更新により即座にUIを更新し、後でサーバーと同期
 * - エラーハンドリングとロールバック機能を内蔵
 * - TypeScript型安全性を完全に保証
 * 
 * 使用例:
 * ```typescript
 * const ConversationList = () => {
 *   const {
 *     conversations,
 *     loading,
 *     error,
 *     createConversation,
 *     updateConversation,
 *     deleteConversation,
 *     searchConversations
 *   } = useConversations();
 * 
 *   const handleCreate = async () => {
 *     await createConversation({
 *       title: '新しい会話',
 *       agentPresetId: 'default'
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       {conversations.map(conv => (
 *         <ConversationItem key={conv.id} conversation={conv} />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 * 
 * 関連: src/hooks/useMessages.ts, src/lib/amplify/types.ts
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// Phase 3で以下に切り替え: import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/lib/amplify/types';
import type { Conversation, User } from '@/lib/amplify/types';

/**
 * Amplify Data クライアントの初期化
 * 
 * 学習ポイント:
 * - Phase 1-2: モッククライアントを使用
 * - Phase 3: 実際のAmplify clientに切り替え
 * - Schema型により完全な型安全性を確保
 * - 環境変数による自動切り替え
 */
import { getAmplifyClient } from '@/lib/amplify/client';
const client = getAmplifyClient();

/**
 * 会話作成パラメータの型定義
 */
interface CreateConversationParams {
  title: string;
  agentPresetId?: string;
}

/**
 * 会話更新パラメータの型定義
 */
interface UpdateConversationParams {
  id: string;
  title?: string;
  agentPresetId?: string;
}

/**
 * フックの戻り値型定義
 * 
 * 設計理由:
 * - conversations: 現在の会話一覧
 * - loading: ローディング状態
 * - error: エラー状態
 * - CRUD操作関数群
 * - 検索・フィルタリング機能
 */
interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: Error | null;
  createConversation: (params: CreateConversationParams) => Promise<Conversation>;
  updateConversation: (params: UpdateConversationParams) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  searchConversations: (query: string) => Conversation[];
  refreshConversations: () => Promise<void>;
}

/**
 * useConversations Hook Implementation
 * 
 * 実装パターン:
 * 1. 状態管理（conversations, loading, error）
 * 2. 初期データ取得（useEffect）
 * 3. リアルタイム更新（GraphQL Subscription）
 * 4. CRUD操作（楽観的更新付き）
 * 5. 検索・フィルタリング機能
 * 6. エラーハンドリングとリトライ機能
 */
export function useConversations(): UseConversationsReturn {
  // 状態管理
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 会話一覧の取得
   * 
   * 学習ポイント:
   * - client.models.Conversation.list(): 自動生成されたGraphQL Query
   * - オーナーベースアクセス制御により、自動的に現在のユーザーの会話のみ取得
   * - createdAt降順でソート（最新の会話が上に表示）
   */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await client.models.Conversation.list({
        // 最新の会話から順に取得
        sortDirection: 'DESC'
        // Phase 3で追加: 関連するメッセージも同時に取得（N+1問題を回避）
        // selectionSet: ['id', 'title', 'agentPresetId', 'createdAt', 'updatedAt', 'messages.*']
      });

      if (result.data) {
        setConversations(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 新規会話の作成
   * 
   * 楽観的更新パターン:
   * 1. 即座にUIを更新（楽観的更新）
   * 2. サーバーに作成リクエストを送信
   * 3. 成功時: サーバーデータでUIを更新
   * 4. 失敗時: UIをロールバック
   * 
   * 学習ポイント:
   * - 楽観的更新によりUXが大幅に向上
   * - エラー時のロールバック処理が重要
   * - 一意IDの生成（crypto.randomUUID()）
   */
  const createConversation = useCallback(async (params: CreateConversationParams): Promise<Conversation> => {
    const { getCurrentEnvironmentMode } = require('@/lib/amplify/config');
    const currentMode = getCurrentEnvironmentMode();
    
    if (currentMode === 'MOCK') {
      // モックモード: 従来の楽観的更新
      const optimisticConversation: Conversation = {
        id: crypto.randomUUID(),
        userId: 'current-user',
        title: params.title,
        agentPresetId: params.agentPresetId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setConversations(prev => [optimisticConversation, ...prev]);

      try {
        const result = await client.models.Conversation.create({
          title: params.title,
          agentPresetId: params.agentPresetId || null,
          userId: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (result.data) {
          setConversations(prev => 
            prev.map(conv => 
              conv.id === optimisticConversation.id ? result.data! : conv
            )
          );
          return result.data;
        } else {
          throw new Error('Failed to create conversation');
        }
      } catch (err) {
        setConversations(prev => 
          prev.filter(conv => conv.id !== optimisticConversation.id)
        );
        
        console.error('Failed to create conversation:', err);
        const error = err instanceof Error ? err : new Error('Failed to create conversation');
        setError(error);
        throw error;
      }
    } else {
      // 実環境: オフライン対応統合
      const { offlineManager } = require('@/lib/realtime/offline-support');
      const { optimisticHelpers } = require('@/lib/optimistic-updates');
      
      const optimisticConversation: Conversation = {
        id: crypto.randomUUID(),
        userId: 'current-user',
        title: params.title,
        agentPresetId: params.agentPresetId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 楽観的更新
      setConversations(prev => optimisticHelpers.addToArray(prev, optimisticConversation, 'start'));

      try {
        if (offlineManager.isOnline()) {
          // オンライン: 直接実行
          const result = await client.models.Conversation.create({
            title: params.title,
            agentPresetId: params.agentPresetId || null,
            userId: 'current-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          if (result.data) {
            setConversations(prev => 
              prev.map(conv => 
                conv.id === optimisticConversation.id ? result.data! : conv
              )
            );
            return result.data;
          } else {
            throw new Error('Failed to create conversation');
          }
        } else {
          // オフライン: キューに追加
          await offlineManager.queueOperation({
            type: 'CREATE_CONVERSATION',
            data: {
              title: params.title,
              agentPresetId: params.agentPresetId || null,
              userId: 'current-user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            retry: true,
            priority: 'normal'
          });

          // オフライン時は楽観的データをそのまま返す
          return optimisticConversation;
        }
      } catch (err) {
        // エラー時: ロールバック
        setConversations(prev => 
          prev.filter(conv => conv.id !== optimisticConversation.id)
        );
        
        console.error('Failed to create conversation:', err);
        const error = err instanceof Error ? err : new Error('Failed to create conversation');
        setError(error);
        throw error;
      }
    }
  }, []);

  /**
   * 会話の更新
   * 
   * 楽観的更新パターン:
   * 1. 現在の状態をバックアップ
   * 2. 即座にUIを更新
   * 3. サーバーに更新リクエスト
   * 4. 失敗時はバックアップから復元
   */
  const updateConversation = useCallback(async (params: UpdateConversationParams): Promise<Conversation> => {
    // 現在の状態をバックアップ（ロールバック用）
    const previousConversations = [...conversations];
    
    // 楽観的更新: 即座にUIを更新
    setConversations(prev => 
      prev.map(conv => 
        conv.id === params.id 
          ? { 
              ...conv, 
              title: params.title ?? conv.title,
              agentPresetId: params.agentPresetId !== undefined ? params.agentPresetId : conv.agentPresetId,
              updatedAt: new Date().toISOString()
            }
          : conv
      )
    );

    try {
      // サーバーに更新リクエスト
      const result = await client.models.Conversation.update({
        id: params.id,
        title: params.title,
        agentPresetId: params.agentPresetId || null,
        updatedAt: new Date().toISOString()
      });

      if (result.data) {
        // 成功時: サーバーデータでUIを更新
        setConversations(prev => 
          prev.map(conv => 
            conv.id === params.id ? result.data! : conv
          )
        );
        return result.data;
      } else {
        throw new Error('Failed to update conversation');
      }
    } catch (err) {
      // 失敗時: 前の状態に復元
      setConversations(previousConversations);
      
      console.error('Failed to update conversation:', err);
      const error = err instanceof Error ? err : new Error('Failed to update conversation');
      setError(error);
      throw error;
    }
  }, [conversations]);

  /**
   * 会話の削除
   * 
   * 楽観的更新パターン:
   * 1. 削除対象をバックアップ
   * 2. 即座にUIから削除
   * 3. サーバーに削除リクエスト
   * 4. 失敗時は復元
   */
  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    // 削除対象をバックアップ（ロールバック用）
    const deletedConversation = conversations.find(conv => conv.id === id);
    const previousConversations = [...conversations];
    
    // 楽観的更新: 即座にUIから削除
    setConversations(prev => prev.filter(conv => conv.id !== id));

    try {
      // サーバーに削除リクエスト
      const result = await client.models.Conversation.delete({ id });

      if (!result.data) {
        throw new Error('Failed to delete conversation');
      }
    } catch (err) {
      // 失敗時: 前の状態に復元
      setConversations(previousConversations);
      
      console.error('Failed to delete conversation:', err);
      const error = err instanceof Error ? err : new Error('Failed to delete conversation');
      setError(error);
      throw error;
    }
  }, [conversations]);

  /**
   * 会話の検索
   * 
   * 学習ポイント:
   * - useMemoによる計算結果のメモ化
   * - タイトルでの部分一致検索
   * - 大文字小文字を区別しない検索
   * - 将来的にはメッセージ内容も検索対象に含める可能性
   */
  const searchConversations = useCallback((query: string): Conversation[] => {
    if (!query.trim()) {
      return conversations;
    }

    const lowerQuery = query.toLowerCase();
    return conversations.filter(conversation =>
      conversation.title.toLowerCase().includes(lowerQuery)
      // 将来的な拡張: メッセージ内容での検索
      // || conversation.messages?.some(message => 
      //   message.content.toLowerCase().includes(lowerQuery)
      // )
    );
  }, [conversations]);

  /**
   * 会話一覧の手動更新
   * 
   * 使用例: プルトゥリフレッシュ、エラー後の再試行
   */
  const refreshConversations = useCallback(async (): Promise<void> => {
    await fetchConversations();
  }, [fetchConversations]);

  /**
   * 初期データ取得
   * 
   * 学習ポイント:
   * - useEffectでコンポーネントマウント時にデータ取得
   * - 依存配列が空なので初回のみ実行
   */
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /**
   * リアルタイム更新の設定
   * 
   * 学習ポイント:
   * - SubscriptionManager による一元管理
   * - エラーハンドリングと自動再接続
   * - オフライン対応との統合
   * - パフォーマンス最適化
   */
  useEffect(() => {
    // Phase 3以降: 実際のSubscriptionManagerを使用
    // Phase 1-2: モックモードでは従来の実装を維持
    const { getCurrentEnvironmentMode } = require('@/lib/amplify/config');
    const currentMode = getCurrentEnvironmentMode();
    
    if (currentMode === 'MOCK') {
      // モックモード: 従来の実装
      const createSub = client.models.Conversation.onCreate().subscribe({
        next: (data: any) => {
          if (data) {
            setConversations(prev => {
              const exists = prev.some(conv => conv.id === data.id);
              if (exists) return prev;
              return [data, ...prev];
            });
          }
        },
        error: (err: any) => console.error('Conversation create subscription error:', err)
      });

      const updateSub = client.models.Conversation.onUpdate().subscribe({
        next: (data: any) => {
          if (data) {
            setConversations(prev => 
              prev.map(conv => conv.id === data.id ? data : conv)
            );
          }
        },
        error: (err: any) => console.error('Conversation update subscription error:', err)
      });

      const deleteSub = client.models.Conversation.onDelete().subscribe({
        next: (data: any) => {
          if (data) {
            setConversations(prev => 
              prev.filter(conv => conv.id !== data.id)
            );
          }
        },
        error: (err: any) => console.error('Conversation delete subscription error:', err)
      });

      return () => {
        createSub.unsubscribe();
        updateSub.unsubscribe();
        deleteSub.unsubscribe();
      };
    } else {
      // 実環境: SubscriptionManagerを使用
      const { subscriptionManager } = require('@/lib/realtime/subscription-manager');
      const { offlineManager } = require('@/lib/realtime/offline-support');
      
      const subscriptionId = subscriptionManager.subscribeToConversations('current-user', {
        onCreate: (conversation: Conversation) => {
          setConversations(prev => {
            const exists = prev.some(conv => conv.id === conversation.id);
            if (exists) return prev;
            return [conversation, ...prev];
          });
        },
        onUpdate: (conversation: Conversation) => {
          setConversations(prev => 
            prev.map(conv => conv.id === conversation.id ? conversation : conv)
          );
        },
        onDelete: (conversation: Conversation) => {
          setConversations(prev => 
            prev.filter(conv => conv.id !== conversation.id)
          );
        },
        onError: (error: Error) => {
          console.error('Conversation subscription error:', error);
          setError(error);
        }
      });

      return () => {
        subscriptionManager.unsubscribe(subscriptionId);
      };
    }
  }, []);

  /**
   * フックの戻り値
   * 
   * 学習ポイント:
   * - useMemoによる戻り値のメモ化（不要な再レンダリングを防止）
   * - 全ての必要な機能を含む包括的なAPI
   */
  return useMemo(() => ({
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    searchConversations,
    refreshConversations
  }), [
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    searchConversations,
    refreshConversations
  ]);
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な使用:
 * ```typescript
 * const { conversations, loading, createConversation } = useConversations();
 * ```
 * 
 * 2. エラーハンドリング:
 * ```typescript
 * const { error } = useConversations();
 * if (error) {
 *   return <ErrorMessage error={error} />;
 * }
 * ```
 * 
 * 3. 検索機能:
 * ```typescript
 * const [searchQuery, setSearchQuery] = useState('');
 * const { searchConversations } = useConversations();
 * const filteredConversations = searchConversations(searchQuery);
 * ```
 * 
 * 4. 楽観的更新の活用:
 * ```typescript
 * const handleCreate = async () => {
 *   try {
 *     await createConversation({ title: '新しい会話' });
 *     // UIは即座に更新される
 *   } catch (error) {
 *     // エラー時は自動的にロールバックされる
 *     showErrorMessage(error.message);
 *   }
 * };
 * ```
 */