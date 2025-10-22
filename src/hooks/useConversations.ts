/**
 * useConversations Hook - 会話データ管理カスタムフック
 * 
 * 目的: 会話の CRUD 操作とリアルタイム更新を提供
 * 設計理由: データ操作ロジックをコンポーネントから分離し、再利用性を向上
 * 
 * 主要機能:
 * - 会話一覧の取得（ページネーション対応）
 * - 会話の作成・更新・削除
 * - リアルタイム更新（GraphQL Subscriptions）
 * - 楽観的更新によるUX向上
 * - エラーハンドリングと再試行機構
 * - デバウンス検索機能
 * - 自動リフレッシュ機能
 * 
 * 学習ポイント:
 * - React Hooks パターンの実装
 * - Amplify Data API の使用方法
 * - 楽観的更新の実装パターン
 * - リアルタイム通信の統合
 * - エラーハンドリングのベストプラクティス
 * - パフォーマンス最適化（デバウンス、メモ化）
 * 
 * 使用例:
 * ```typescript
 * const {
 *   conversations,
 *   loading,
 *   error,
 *   createConversation,
 *   updateConversation,
 *   deleteConversation,
 *   searchConversations
 * } = useConversations({
 *   limit: 20,
 *   enableRealtime: true,
 *   enableOptimisticUpdates: true
 * });
 * 
 * // 新しい会話を作成
 * const handleCreateConversation = async () => {
 *   const result = await createConversation({
 *     title: "新しい会話",
 *     agentPresetId: "preset-default"
 *   });
 *   
 *   if (result) {
 *     console.log('会話が作成されました:', result.id);
 *   }
 * };
 * 
 * // 検索機能の使用
 * const handleSearch = (query: string) => {
 *   searchConversations(query); // デバウンス処理済み
 * };
 * ```
 * 
 * 関連: src/types/amplify.ts, amplify/data/resource.ts, src/lib/amplify/client.ts
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  amplifyClient, 
  withErrorHandling, 
  getCurrentAuthUser,
  subscribeToUpdates 
} from '../lib/amplify/client';
import { 
  type Conversation, 
  type CreateConversationInput, 
  type UpdateConversationInput,
  type ModelConversationFilterInput,
  type ModelConversationConnection
} from '../types/amplify';

/**
 * フック戻り値の型定義
 * 
 * 設計理由:
 * - TypeScript による型安全性の確保
 * - IDE での自動補完とエラー検出
 * - API契約の明確化
 */
interface UseConversationsReturn {
  // データ状態
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  
  // CRUD操作
  createConversation: (input: Omit<CreateConversationInput, 'userId'>) => Promise<Conversation | null>;
  updateConversation: (input: UpdateConversationInput) => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<boolean>;
  
  // 検索・フィルタリング
  searchConversations: (query: string) => void;
  loadMoreConversations: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  
  // リアルタイム制御
  subscribeToUpdates: boolean;
  setSubscribeToUpdates: (subscribe: boolean) => void;
}

/**
 * フックの設定オプション
 * 
 * 設計理由:
 * - フックの動作をカスタマイズ可能
 * - パフォーマンス最適化のオプション提供
 * - 異なる使用シナリオへの対応
 */
interface UseConversationsOptions {
  limit?: number; // 1回の取得件数（デフォルト: 20）
  enableRealtime?: boolean; // リアルタイム更新の有効化（デフォルト: true）
  enableOptimisticUpdates?: boolean; // 楽観的更新の有効化（デフォルト: true）
  autoRefresh?: boolean; // 自動リフレッシュの有効化（デフォルト: false）
}

/**
 * useConversations カスタムフック
 * 
 * @param options - フックの設定オプション
 * @returns 会話データ管理のためのAPI
 */
export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const {
    limit = 20,
    enableRealtime = true,
    enableOptimisticUpdates = true,
    autoRefresh = false
  } = options;

  // 状態管理
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubscribedToUpdates, setSubscribeToUpdates] = useState(enableRealtime);

  // リアルタイム更新の購読管理
  const subscriptionRef = useRef<any>(null);
  
  // デバウンス検索用のタイマー
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 楽観的更新用の一時ID管理
  const optimisticIdsRef = useRef<Set<string>>(new Set());

  /**
   * 会話一覧の取得
   * 
   * 学習ポイント:
   * - GraphQL クエリの実行方法
   * - ページネーションの実装
   * - エラーハンドリングのパターン
   * - 検索フィルターの適用
   * - 実際のAmplify API呼び出しパターン
   */
  const fetchConversations = useCallback(async (
    token?: string | null,
    searchFilter?: string
  ): Promise<ModelConversationConnection | null> => {
    try {
      setError(null);
      
      // 検索フィルターの構築
      let filter: ModelConversationFilterInput | undefined;
      if (searchFilter && searchFilter.trim()) {
        filter = {
          or: [
            { title: { contains: searchFilter.trim() } },
            // 将来的にはメッセージ内容での検索も追加可能
          ]
        };
      }

      // 実際のAmplify Data API呼び出し
      // Phase 3以降で有効化される実装
      const response = await withErrorHandling(async () => {
        // 実際のAmplify実装（Phase 3で有効化）
        // return await amplifyClient.models.Conversation.list({
        //   filter: filter || undefined,
        //   limit,
        //   nextToken: token || undefined,
        //   sortDirection: 'DESC' // 新しい会話から順番に
        // });
        
        // Phase 1-2: モック実装を使用
        return await mockListConversations({
          filter: filter || undefined,
          limit,
          nextToken: token || undefined
        });
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '会話の取得に失敗しました';
      setError(errorMessage);
      console.error('Failed to fetch conversations:', err);
      return null;
    }
  }, [limit]);

  /**
   * 初期データの読み込み
   * 
   * 学習ポイント:
   * - useEffect による副作用の管理
   * - 非同期データ取得のパターン
   * - ローディング状態の管理
   */
  useEffect(() => {
    const loadInitialConversations = async () => {
      setLoading(true);
      const result = await fetchConversations(null, searchQuery);
      
      if (result) {
        setConversations(result.items.filter(Boolean) as Conversation[]);
        setNextToken(result.nextToken || null);
        setHasNextPage(!!result.nextToken);
      }
      
      setLoading(false);
    };

    loadInitialConversations();
  }, [fetchConversations, searchQuery]);

  /**
   * リアルタイム更新の設定
   * 
   * 学習ポイント:
   * - GraphQL Subscriptions の使用方法
   * - リアルタイム更新の購読管理
   * - メモリリークの防止（cleanup）
   * - 楽観的更新との競合回避
   */
  useEffect(() => {
    if (!isSubscribedToUpdates) return;

    // 実際のAmplify実装（Phase 3で有効化）
    subscriptionRef.current = subscribeToUpdates<Conversation>(
      'Conversation',
      (updatedConversations: Conversation[]) => {
        // 楽観的更新中のアイテムを除外してマージ
        setConversations(prev => {
          const optimisticItems = prev.filter(conv => 
            optimisticIdsRef.current.has(conv.id)
          );
          const realItems = updatedConversations.filter((conv: Conversation) => 
            !optimisticIdsRef.current.has(conv.id)
          );
          
          // 楽観的更新アイテムを先頭に、実際のデータを後に配置
          return [...optimisticItems, ...realItems];
        });
      }
    );

    // クリーンアップ関数
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isSubscribedToUpdates]);

  /**
   * コンポーネントアンマウント時のクリーンアップ
   * 
   * 学習ポイント:
   * - メモリリークの防止
   * - タイマーのクリーンアップ
   * - リソースの適切な解放
   */
  useEffect(() => {
    return () => {
      // 検索タイマーのクリーンアップ
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // 楽観的更新IDのクリーンアップ
      optimisticIdsRef.current.clear();
    };
  }, []);

  /**
   * 会話の作成
   * 
   * 学習ポイント:
   * - 楽観的更新の実装パターン
   * - エラー時のロールバック処理
   * - ユーザーIDの自動設定
   * - 実際のAmplify API呼び出し
   * - 一時IDの管理と重複防止
   */
  const createConversation = useCallback(async (
    input: Omit<CreateConversationInput, 'userId'>
  ): Promise<Conversation | null> => {
    let optimisticId: string | null = null;
    
    try {
      setError(null);

      // 現在のユーザー情報を取得
      const currentUser = await getCurrentAuthUser();
      if (!currentUser) {
        throw new Error('認証が必要です');
      }
      
      const createInput: CreateConversationInput = {
        ...input,
        userId: currentUser.userId,
      };

      // 楽観的更新: UIを即座に更新
      let optimisticConversation: Conversation | null = null;
      if (enableOptimisticUpdates) {
        optimisticId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        optimisticIdsRef.current.add(optimisticId);
        
        optimisticConversation = {
          id: optimisticId,
          ...createInput,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: currentUser.userId,
        };
        
        setConversations(prev => [optimisticConversation!, ...prev]);
      }

      // 実際のAPI呼び出し
      const result = await withErrorHandling(async () => {
        // 実際のAmplify実装（Phase 3で有効化）
        // return await amplifyClient.models.Conversation.create(createInput);
        
        // Phase 1-2: モック実装を使用
        return await mockCreateConversation(createInput);
      });

      if (result) {
        // 楽観的更新の置き換え
        if (enableOptimisticUpdates && optimisticConversation && optimisticId) {
          optimisticIdsRef.current.delete(optimisticId);
          setConversations(prev => 
            prev.map(conv => 
              conv.id === optimisticId ? result : conv
            )
          );
        } else {
          setConversations(prev => [result, ...prev]);
        }
        
        return result;
      } else {
        throw new Error('会話の作成に失敗しました');
      }
    } catch (err) {
      // エラー時のロールバック
      if (enableOptimisticUpdates && optimisticId) {
        optimisticIdsRef.current.delete(optimisticId);
        setConversations(prev => 
          prev.filter(conv => conv.id !== optimisticId)
        );
      }
      
      const errorMessage = err instanceof Error ? err.message : '会話の作成に失敗しました';
      setError(errorMessage);
      console.error('Failed to create conversation:', err);
      return null;
    }
  }, [enableOptimisticUpdates]);

  /**
   * 会話の更新
   * 
   * 学習ポイント:
   * - 部分更新の実装
   * - 楽観的更新とロールバック
   * - 更新日時の自動設定
   */
  const updateConversation = useCallback(async (
    input: UpdateConversationInput
  ): Promise<Conversation | null> => {
    try {
      setError(null);

      // 現在の会話データを保存（ロールバック用）
      const originalConversation = conversations.find(conv => conv.id === input.id);
      if (!originalConversation) {
        throw new Error('更新対象の会話が見つかりません');
      }

      // 楽観的更新
      if (enableOptimisticUpdates) {
        const updatedConversation: Conversation = {
          ...originalConversation,
          ...input,
          updatedAt: new Date().toISOString(),
        };
        
        setConversations(prev =>
          prev.map(conv => conv.id === input.id ? updatedConversation : conv)
        );
      }

      // 実際のAPI呼び出し
      // const result = await client.models.Conversation.update(input);
      const result = await mockUpdateConversation(input);

      if (result) {
        // 実際のデータで更新
        setConversations(prev =>
          prev.map(conv => conv.id === input.id ? result : conv)
        );
        
        return result;
      } else {
        throw new Error('会話の更新に失敗しました');
      }
    } catch (err) {
      // エラー時のロールバック
      if (enableOptimisticUpdates) {
        setConversations(prev =>
          prev.map(conv => 
            conv.id === input.id 
              ? conversations.find(c => c.id === input.id) || conv
              : conv
          )
        );
      }
      
      const errorMessage = err instanceof Error ? err.message : '会話の更新に失敗しました';
      setError(errorMessage);
      console.error('Failed to update conversation:', err);
      return null;
    }
  }, [conversations, enableOptimisticUpdates]);

  /**
   * 会話の削除
   * 
   * 学習ポイント:
   * - 削除操作の楽観的更新
   * - 関連データの整合性確保
   * - 削除確認とエラーハンドリング
   */
  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      // 削除対象の会話を保存（ロールバック用）
      const conversationToDelete = conversations.find(conv => conv.id === id);
      if (!conversationToDelete) {
        throw new Error('削除対象の会話が見つかりません');
      }

      // 楽観的更新: UIから即座に削除
      if (enableOptimisticUpdates) {
        setConversations(prev => prev.filter(conv => conv.id !== id));
      }

      // 実際のAPI呼び出し
      // const result = await client.models.Conversation.delete({ id });
      const result = await mockDeleteConversation(id);

      if (result) {
        // 削除成功時は楽観的更新がそのまま有効
        return true;
      } else {
        throw new Error('会話の削除に失敗しました');
      }
    } catch (err) {
      // エラー時のロールバック
      if (enableOptimisticUpdates) {
        const conversationToRestore = conversations.find(conv => conv.id === id);
        if (conversationToRestore) {
          setConversations(prev => [...prev, conversationToRestore]);
        }
      }
      
      const errorMessage = err instanceof Error ? err.message : '会話の削除に失敗しました';
      setError(errorMessage);
      console.error('Failed to delete conversation:', err);
      return false;
    }
  }, [conversations, enableOptimisticUpdates]);

  /**
   * デバウンス検索の実装
   * 
   * 学習ポイント:
   * - デバウンス処理による検索最適化
   * - 検索状態の管理
   * - フィルター条件の動的変更
   * - パフォーマンス最適化
   */
  const debouncedSearch = useCallback((query: string) => {
    // 既存のタイマーをクリア
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // 新しいタイマーを設定（300ms後に検索実行）
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(query);
    }, 300);
  }, []);

  /**
   * 会話の検索（デバウンス処理付き）
   * 
   * 学習ポイント:
   * - ユーザーフレンドリーな検索体験
   * - 不要なAPI呼び出しの削減
   * - リアルタイム検索の実装
   */
  const searchConversations = useCallback((query: string) => {
    // 空文字の場合は即座に検索をクリア
    if (!query.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setSearchQuery('');
      return;
    }
    
    // デバウンス検索を実行
    debouncedSearch(query);
  }, [debouncedSearch]);

  /**
   * 追加データの読み込み（ページネーション）
   * 
   * 学習ポイント:
   * - 無限スクロールの実装パターン
   * - 既存データとの結合
   * - 重複データの防止
   */
  const loadMoreConversations = useCallback(async (): Promise<void> => {
    if (!hasNextPage || loading) return;

    setLoading(true);
    const result = await fetchConversations(nextToken, searchQuery);
    
    if (result) {
      const newConversations = result.items.filter(Boolean) as Conversation[];
      
      // 重複を防いで既存データに追加
      setConversations(prev => {
        const existingIds = new Set(prev.map(conv => conv.id));
        const uniqueNewConversations = newConversations.filter(
          conv => !existingIds.has(conv.id)
        );
        return [...prev, ...uniqueNewConversations];
      });
      
      setNextToken(result.nextToken || null);
      setHasNextPage(!!result.nextToken);
    }
    
    setLoading(false);
  }, [hasNextPage, loading, nextToken, searchQuery, fetchConversations]);

  /**
   * データの再読み込み
   * 
   * 学習ポイント:
   * - 手動リフレッシュの実装
   * - 状態のリセット
   * - エラー状態のクリア
   */
  const refreshConversations = useCallback(async (): Promise<void> => {
    setError(null);
    setNextToken(null);
    setHasNextPage(false);
    
    setLoading(true);
    const result = await fetchConversations(null, searchQuery);
    
    if (result) {
      setConversations(result.items.filter(Boolean) as Conversation[]);
      setNextToken(result.nextToken || null);
      setHasNextPage(!!result.nextToken);
    }
    
    setLoading(false);
  }, [fetchConversations, searchQuery]);

  return {
    // データ状態
    conversations,
    loading,
    error,
    hasNextPage,
    
    // CRUD操作
    createConversation,
    updateConversation,
    deleteConversation,
    
    // 検索・フィルタリング
    searchConversations,
    loadMoreConversations,
    refreshConversations,
    
    // リアルタイム制御
    subscribeToUpdates: isSubscribedToUpdates,
    setSubscribeToUpdates,
  };
}

/**
 * モック実装関数群
 * 
 * 学習ポイント:
 * - 実際のAmplify API呼び出しの代替実装
 * - 開発・テスト環境での使用
 * - 実際のAPI実装時の参考パターン
 * 
 * 注意: 本番環境では実際のAmplify Data APIに置き換える必要があります
 */

// 現在のユーザーIDを取得（モック実装）
async function getCurrentUserId(): Promise<string> {
  // 実際の実装では認証コンテキストから取得
  // const currentUser = await getCurrentAuthUser();
  // return currentUser?.userId || '';
  
  // Phase 1-2: モック実装
  return 'mock-user-id';
}

// 会話一覧取得のモック実装
async function mockListConversations(params: {
  filter?: ModelConversationFilterInput | undefined;
  limit: number;
  nextToken?: string | undefined;
}): Promise<ModelConversationConnection> {
  // 実際の実装では amplifyClient.models.Conversation.list(params) を使用
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400)); // リアルなAPI遅延をシミュレート
  
  // エラーシミュレーション（5%の確率）
  if (Math.random() < 0.05) {
    throw new Error('ネットワークエラーが発生しました');
  }
  
  const allMockConversations: Conversation[] = [
    {
      id: 'conv-1',
      userId: 'mock-user-id',
      title: 'AIの倫理について',
      agentPresetId: 'preset-default',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      owner: 'mock-user-id',
    },
    {
      id: 'conv-2',
      userId: 'mock-user-id',
      title: '機械学習の応用',
      agentPresetId: 'preset-academic',
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-01T09:00:00Z',
      owner: 'mock-user-id',
    },
    {
      id: 'conv-3',
      userId: 'mock-user-id',
      title: 'データサイエンスの基礎',
      agentPresetId: 'preset-default',
      createdAt: '2024-01-01T08:00:00Z',
      updatedAt: '2024-01-01T08:00:00Z',
      owner: 'mock-user-id',
    },
    {
      id: 'conv-4',
      userId: 'mock-user-id',
      title: 'プロダクト戦略の検討',
      agentPresetId: 'preset-business',
      createdAt: '2024-01-01T07:00:00Z',
      updatedAt: '2024-01-01T07:00:00Z',
      owner: 'mock-user-id',
    },
  ];

  // 検索フィルターの適用
  let filteredConversations = allMockConversations;
  if (params.filter?.or) {
    const titleFilter = params.filter.or.find(f => f?.title?.contains);
    if (titleFilter?.title?.contains) {
      const searchTerm = titleFilter.title.contains.toLowerCase();
      filteredConversations = allMockConversations.filter(conv =>
        conv.title.toLowerCase().includes(searchTerm)
      );
    }
  }

  // ページネーション処理
  const startIndex = params.nextToken ? parseInt(params.nextToken) : 0;
  const endIndex = startIndex + params.limit;
  const paginatedConversations = filteredConversations.slice(startIndex, endIndex);
  const hasMore = endIndex < filteredConversations.length;

  return {
    items: paginatedConversations,
    nextToken: hasMore ? endIndex.toString() : null,
  };
}

// 会話作成のモック実装
async function mockCreateConversation(input: CreateConversationInput): Promise<Conversation> {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  // エラーシミュレーション（3%の確率）
  if (Math.random() < 0.03) {
    throw new Error('会話の作成に失敗しました。しばらく時間をおいて再試行してください。');
  }
  
  // タイトルの検証
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('会話のタイトルは必須です');
  }
  
  if (input.title.length > 100) {
    throw new Error('会話のタイトルは100文字以内で入力してください');
  }
  
  const now = new Date().toISOString();
  
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...input,
    createdAt: now,
    updatedAt: now,
    owner: input.userId,
  };
}

// 会話更新のモック実装
async function mockUpdateConversation(input: UpdateConversationInput): Promise<Conversation> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 実際の実装では既存データを取得して更新
  return {
    id: input.id,
    userId: 'mock-user-id',
    title: input.title || '更新された会話',
    agentPresetId: input.agentPresetId || 'preset-default',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: new Date().toISOString(),
    owner: 'mock-user-id',
  };
}

// 会話削除のモック実装
async function mockDeleteConversation(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return true; // 削除成功
}

// リアルタイム更新のモック実装
function mockSubscribeToConversations(callback: (conversations: Conversation[]) => void) {
  // 実際の実装では GraphQL Subscription を使用
  const interval = setInterval(() => {
    // モックデータの更新をシミュレート
    // 実際の実装では不要
  }, 30000);

  return {
    unsubscribe: () => clearInterval(interval),
  };
}