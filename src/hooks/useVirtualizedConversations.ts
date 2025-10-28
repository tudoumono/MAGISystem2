/**
 * useVirtualizedConversations Hook - 仮想スクロール対応会話管理
 * 
 * このフックは大量の会話データを効率的に表示するための仮想スクロール機能と
 * 無限スクロールによる段階的データ読み込みを統合します。
 * 
 * 目的:
 * - 大量の会話データの効率的な表示
 * - 無限スクロールによる段階的読み込み
 * - メモリ使用量の最適化
 * - スクロールパフォーマンスの向上
 * 
 * 設計理由:
 * - useConversations との統合
 * - 仮想スクロールによるDOM要素数の制限
 * - 無限スクロールによるデータ読み込み最適化
 * - リアルタイム更新との両立
 * 
 * 学習ポイント:
 * - 仮想スクロールとデータフェッチの統合
 * - パフォーマンス最適化テクニック
 * - React hooks の組み合わせパターン
 * - メモリ効率的なデータ管理
 * 
 * 要件対応:
 * - 5.4: 仮想化スクロールで性能を維持
 * - 2.5: 無限スクロールで段階的に読み込み
 * - 2.4: リアルタイム会話更新
 * 
 * 使用例:
 * ```typescript
 * const VirtualConversationList = () => {
 *   const {
 *     conversations,
 *     virtualItems,
 *     totalSize,
 *     scrollElementRef,
 *     loading,
 *     hasNextPage,
 *     fetchNextPage
 *   } = useVirtualizedConversations({
 *     pageSize: 20,
 *     estimatedItemHeight: 80
 *   });
 * 
 *   return (
 *     <div ref={scrollElementRef} style={{ height: '100vh', overflow: 'auto' }}>
 *       <div style={{ height: totalSize, position: 'relative' }}>
 *         {virtualItems.map(virtualItem => (
 *           <VirtualScrollItem key={virtualItem.index} virtualItem={virtualItem}>
 *             <ConversationItem conversation={conversations[virtualItem.index]} />
 *           </VirtualScrollItem>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/lib/realtime/virtual-scroll.ts
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useConversations } from './useConversations';
import { useVirtualScroll, useInfiniteScroll, type VirtualItem } from '@/lib/realtime/virtual-scroll';
import type { Conversation } from '@/lib/amplify/types';

/**
 * 仮想化会話リストの設定
 */
export interface VirtualizedConversationsConfig {
  pageSize?: number;
  estimatedItemHeight?: number;
  overscan?: number;
  enableInfiniteScroll?: boolean;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * 無限スクロール用のページネーション状態
 */
interface PaginationState {
  currentPage: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalCount?: number;
}

/**
 * フックの戻り値型定義
 */
interface UseVirtualizedConversationsReturn {
  // データ
  conversations: Conversation[];
  filteredConversations: Conversation[];
  
  // 仮想スクロール
  virtualItems: VirtualItem[];
  totalSize: number;
  scrollElementRef: React.RefObject<HTMLDivElement>;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  
  // 状態
  loading: boolean;
  error: Error | null;
  
  // 無限スクロール
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  
  // 検索・フィルタリング
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // 操作
  createConversation: (params: { title: string; agentPresetId?: string }) => Promise<Conversation>;
  updateConversation: (params: { id: string; title?: string; agentPresetId?: string }) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: Required<VirtualizedConversationsConfig> = {
  pageSize: 20,
  estimatedItemHeight: 80,
  overscan: 5,
  enableInfiniteScroll: true,
  searchQuery: '',
  sortBy: 'createdAt',
  sortDirection: 'DESC',
};

/**
 * useVirtualizedConversations Hook Implementation
 * 
 * 実装パターン:
 * 1. useConversations との統合
 * 2. 仮想スクロールの設定
 * 3. 無限スクロールの実装
 * 4. 検索・フィルタリング機能
 * 5. パフォーマンス最適化
 */
export function useVirtualizedConversations(
  config: VirtualizedConversationsConfig = {}
): UseVirtualizedConversationsReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 基本的な会話管理フック
  const {
    conversations: allConversations,
    loading: baseLoading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    refreshConversations: baseRefreshConversations,
    searchConversations
  } = useConversations();

  // 状態管理
  const [searchQuery, setSearchQuery] = useState(finalConfig.searchQuery);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    hasNextPage: true,
    isFetchingNextPage: false,
    totalCount: 0
  });
  
  // 表示用の会話データ（ページネーション適用）
  const [displayedConversations, setDisplayedConversations] = useState<Conversation[]>([]);
  
  // 仮想スクロール用の参照
  const scrollElementRef = useRef<HTMLDivElement>(null);

  /**
   * 検索・フィルタリング済みの会話一覧
   * 
   * 学習ポイント:
   * - useMemo による計算結果のキャッシュ
   * - 検索クエリによるフィルタリング
   * - ソート機能の実装
   */
  const filteredConversations = useMemo(() => {
    let filtered = searchQuery ? searchConversations(searchQuery) : allConversations;
    
    // ソート処理
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[finalConfig.sortBy];
      const bValue = b[finalConfig.sortBy];
      
      if (finalConfig.sortDirection === 'ASC') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [allConversations, searchQuery, searchConversations, finalConfig.sortBy, finalConfig.sortDirection]);

  /**
   * ページネーション処理
   * 
   * 学習ポイント:
   * - 段階的なデータ表示
   * - メモリ効率的なデータ管理
   * - 無限スクロールとの統合
   */
  const updateDisplayedConversations = useCallback(() => {
    const startIndex = 0;
    const endIndex = pagination.currentPage * finalConfig.pageSize;
    const newDisplayed = filteredConversations.slice(startIndex, endIndex);
    
    setDisplayedConversations(newDisplayed);
    
    // 次ページの存在確認
    const hasMore = endIndex < filteredConversations.length;
    setPagination(prev => ({
      ...prev,
      hasNextPage: hasMore,
      totalCount: filteredConversations.length
    }));
  }, [filteredConversations, pagination.currentPage, finalConfig.pageSize]);

  /**
   * 次ページの読み込み
   * 
   * 学習ポイント:
   * - 無限スクロールによる段階的読み込み
   * - ローディング状態の管理
   * - エラーハンドリング
   */
  const fetchNextPage = useCallback(async (): Promise<void> => {
    if (!pagination.hasNextPage || pagination.isFetchingNextPage) {
      return;
    }

    setPagination(prev => ({ ...prev, isFetchingNextPage: true }));

    try {
      // 次ページのデータを読み込み（実際にはクライアントサイドでのページング）
      await new Promise(resolve => setTimeout(resolve, 100)); // 擬似的な遅延
      
      setPagination(prev => ({
        ...prev,
        currentPage: prev.currentPage + 1,
        isFetchingNextPage: false
      }));
    } catch (error) {
      console.error('Failed to fetch next page:', error);
      setPagination(prev => ({ ...prev, isFetchingNextPage: false }));
    }
  }, [pagination.hasNextPage, pagination.isFetchingNextPage]);

  /**
   * 仮想スクロールの設定
   * 
   * 学習ポイント:
   * - 動的なアイテム高さの推定
   * - パフォーマンス最適化
   * - スクロール位置の管理
   */
  const virtualScrollResult = useVirtualScroll({
    count: displayedConversations.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: (index) => {
      // アイテムの内容に基づいて高さを推定
      const conversation = displayedConversations[index];
      if (!conversation) return finalConfig.estimatedItemHeight;
      
      // タイトルの長さに基づいて高さを調整
      const titleLength = conversation.title.length;
      if (titleLength > 50) {
        return finalConfig.estimatedItemHeight + 20;
      } else if (titleLength > 30) {
        return finalConfig.estimatedItemHeight + 10;
      }
      
      return finalConfig.estimatedItemHeight;
    },
    overscan: finalConfig.overscan,
    getItemKey: (index) => displayedConversations[index]?.id || index
  });

  /**
   * 無限スクロールの統合
   * 
   * 学習ポイント:
   * - 仮想スクロールとの連携
   * - 自動的な次ページ読み込み
   * - スクロール位置に基づく判定
   */
  useInfiniteScroll(virtualScrollResult, {
    hasNextPage: pagination.hasNextPage,
    isFetchingNextPage: pagination.isFetchingNextPage,
    fetchNextPage,
    threshold: 3 // 最後から3番目のアイテムが表示されたら読み込み開始
  });

  /**
   * スクロール操作のヘルパー関数
   */
  const scrollToIndex = useCallback((index: number) => {
    virtualScrollResult.scrollToIndex(index, { align: 'start', behavior: 'smooth' });
  }, [virtualScrollResult]);

  const scrollToTop = useCallback(() => {
    virtualScrollResult.scrollToOffset(0, { behavior: 'smooth' });
  }, [virtualScrollResult]);

  /**
   * 会話一覧の更新処理
   */
  const refreshConversations = useCallback(async (): Promise<void> => {
    // ページネーション状態をリセット
    setPagination({
      currentPage: 1,
      hasNextPage: true,
      isFetchingNextPage: false,
      totalCount: 0
    });
    
    // 基本データを更新
    await baseRefreshConversations();
  }, [baseRefreshConversations]);

  /**
   * 検索クエリ変更時の処理
   */
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    // 検索時はページネーションをリセット
    setPagination({
      currentPage: 1,
      hasNextPage: true,
      isFetchingNextPage: false,
      totalCount: 0
    });
  }, []);

  /**
   * 表示データの更新
   */
  useEffect(() => {
    updateDisplayedConversations();
  }, [updateDisplayedConversations]);

  /**
   * 検索クエリ変更時の処理
   */
  useEffect(() => {
    // 検索結果が変わったらスクロール位置をリセット
    scrollToTop();
  }, [searchQuery, scrollToTop]);

  /**
   * ローディング状態の計算
   */
  const loading = useMemo(() => {
    return baseLoading || (pagination.isFetchingNextPage && displayedConversations.length === 0);
  }, [baseLoading, pagination.isFetchingNextPage, displayedConversations.length]);

  return {
    // データ
    conversations: allConversations,
    filteredConversations,
    
    // 仮想スクロール
    virtualItems: virtualScrollResult.virtualItems,
    totalSize: virtualScrollResult.totalSize,
    scrollElementRef: scrollElementRef as React.RefObject<HTMLDivElement>,
    scrollToIndex,
    scrollToTop,
    
    // 状態
    loading,
    error,
    
    // 無限スクロール
    hasNextPage: pagination.hasNextPage,
    isFetchingNextPage: pagination.isFetchingNextPage,
    fetchNextPage,
    
    // 検索・フィルタリング
    searchQuery,
    setSearchQuery: handleSearchQueryChange,
    
    // 操作
    createConversation,
    updateConversation,
    deleteConversation,
    refreshConversations
  };
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な仮想化会話リスト:
 * ```typescript
 * const VirtualConversationList = () => {
 *   const {
 *     virtualItems,
 *     totalSize,
 *     scrollElementRef,
 *     filteredConversations,
 *     loading,
 *     hasNextPage,
 *     isFetchingNextPage
 *   } = useVirtualizedConversations({
 *     pageSize: 25,
 *     estimatedItemHeight: 100
 *   });
 * 
 *   if (loading && filteredConversations.length === 0) {
 *     return <LoadingSpinner />;
 *   }
 * 
 *   return (
 *     <div ref={scrollElementRef} className="h-full overflow-auto">
 *       <div style={{ height: totalSize, position: 'relative' }}>
 *         {virtualItems.map(virtualItem => (
 *           <VirtualScrollItem key={virtualItem.index} virtualItem={virtualItem}>
 *             <ConversationItem 
 *               conversation={filteredConversations[virtualItem.index]} 
 *             />
 *           </VirtualScrollItem>
 *         ))}
 *         {isFetchingNextPage && (
 *           <div className="p-4 text-center">
 *             <LoadingSpinner />
 *           </div>
 *         )}
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 * 
 * 2. 検索機能付きリスト:
 * ```typescript
 * const SearchableConversationList = () => {
 *   const {
 *     searchQuery,
 *     setSearchQuery,
 *     filteredConversations,
 *     virtualItems,
 *     scrollElementRef,
 *     totalSize
 *   } = useVirtualizedConversations();
 * 
 *   return (
 *     <div className="flex flex-col h-full">
 *       <div className="p-4">
 *         <SearchInput
 *           value={searchQuery}
 *           onChange={setSearchQuery}
 *           placeholder="会話を検索..."
 *         />
 *       </div>
 *       <div ref={scrollElementRef} className="flex-1 overflow-auto">
 *         <div style={{ height: totalSize, position: 'relative' }}>
 *           {virtualItems.map(virtualItem => (
 *             <VirtualScrollItem key={virtualItem.index} virtualItem={virtualItem}>
 *               <ConversationItem 
 *                 conversation={filteredConversations[virtualItem.index]}
 *                 searchQuery={searchQuery}
 *               />
 *             </VirtualScrollItem>
 *           ))}
 *         </div>
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 * 
 * 3. パフォーマンス監視:
 * ```typescript
 * const PerformanceOptimizedList = () => {
 *   const virtualizedResult = useVirtualizedConversations({
 *     pageSize: 50,
 *     estimatedItemHeight: 80,
 *     overscan: 10
 *   });
 * 
 *   // パフォーマンス監視
 *   useEffect(() => {
 *     const observer = new PerformanceObserver((list) => {
 *       list.getEntries().forEach((entry) => {
 *         if (entry.entryType === 'measure') {
 *           console.log(`${entry.name}: ${entry.duration}ms`);
 *         }
 *       });
 *     });
 *     
 *     observer.observe({ entryTypes: ['measure'] });
 *     
 *     return () => observer.disconnect();
 *   }, []);
 * 
 *   return (
 *     // ... レンダリング
 *   );
 * };
 * ```
 */