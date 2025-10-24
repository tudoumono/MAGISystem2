/**
 * Virtual Scroll - 仮想スクロール実装
 * 
 * このファイルは大量のデータを効率的に表示するための仮想スクロール機能を提供します。
 * 会話履歴やメッセージ一覧などの大量データを、メモリ効率とパフォーマンスを保ちながら
 * スムーズにスクロール表示できます。
 * 
 * 目的:
 * - 大量データの効率的な表示
 * - メモリ使用量の最適化
 * - スクロールパフォーマンスの向上
 * - 無限スクロールとの統合
 * 
 * 設計理由:
 * - DOM要素数の制限によるパフォーマンス向上
 * - 可視領域のみレンダリングしてメモリ効率化
 * - スクロール位置の正確な計算
 * - 動的な要素高さへの対応
 * 
 * 学習ポイント:
 * - 仮想スクロールの基本概念と実装
 * - Intersection Observer API の活用
 * - React hooks での状態管理
 * - パフォーマンス最適化テクニック
 * 
 * 要件対応:
 * - 5.4: 仮想化スクロールで性能を維持
 * - 2.5: 無限スクロールで段階的に読み込み
 * 
 * 使用例:
 * ```typescript
 * const VirtualConversationList = () => {
 *   const { virtualItems, totalSize, scrollElementRef } = useVirtualScroll({
 *     count: conversations.length,
 *     getScrollElement: () => scrollElementRef.current,
 *     estimateSize: () => 80,
 *     overscan: 5
 *   });
 * 
 *   return (
 *     <div ref={scrollElementRef} style={{ height: '400px', overflow: 'auto' }}>
 *       <div style={{ height: totalSize, position: 'relative' }}>
 *         {virtualItems.map(virtualItem => (
 *           <div
 *             key={virtualItem.index}
 *             style={{
 *               position: 'absolute',
 *               top: virtualItem.start,
 *               left: 0,
 *               right: 0,
 *               height: virtualItem.size
 *             }}
 *           >
 *             <ConversationItem conversation={conversations[virtualItem.index]} />
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/hooks/useMessages.ts
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * 仮想アイテムの情報
 */
export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  end: number;
}

/**
 * 仮想スクロールの設定
 */
export interface VirtualScrollConfig {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: (index: number) => number;
  overscan?: number;
  horizontal?: boolean;
  paddingStart?: number;
  paddingEnd?: number;
  scrollMargin?: number;
  getItemKey?: (index: number) => string | number;
  debug?: boolean;
}

/**
 * 仮想スクロールの戻り値
 */
export interface VirtualScrollResult {
  virtualItems: VirtualItem[];
  totalSize: number;
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
  scrollToOffset: (offset: number, options?: ScrollToOptions) => void;
  measure: () => void;
}

/**
 * スクロールオプション
 */
export interface ScrollToOptions {
  align?: 'start' | 'center' | 'end' | 'auto';
  behavior?: 'auto' | 'smooth';
}

/**
 * 測定されたサイズのキャッシュ
 */
interface SizeCache {
  [index: number]: number;
}

/**
 * useVirtualScroll - 仮想スクロールフック
 * 
 * 機能:
 * - 可視領域の計算
 * - 仮想アイテムの生成
 * - スクロール位置の管理
 * - 動的サイズ測定
 * - パフォーマンス最適化
 */
export function useVirtualScroll(config: VirtualScrollConfig): VirtualScrollResult {
  const {
    count,
    getScrollElement,
    estimateSize,
    overscan = 3,
    horizontal = false,
    paddingStart = 0,
    paddingEnd = 0,
    scrollMargin = 0,
    getItemKey,
    debug = false
  } = config;

  // 状態管理
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrollElementSize, setScrollElementSize] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // サイズキャッシュ
  const sizeCache = useRef<SizeCache>({});
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const measurementsRef = useRef<Map<number, number>>(new Map());

  /**
   * アイテムサイズの取得（キャッシュ付き）
   */
  const getItemSize = useCallback((index: number): number => {
    // 測定済みサイズがあれば使用
    if (measurementsRef.current.has(index)) {
      return measurementsRef.current.get(index)!;
    }
    
    // キャッシュされたサイズがあれば使用
    if (sizeCache.current[index] !== undefined) {
      return sizeCache.current[index];
    }
    
    // 推定サイズを使用
    const estimated = estimateSize(index);
    sizeCache.current[index] = estimated;
    return estimated;
  }, [estimateSize]);

  /**
   * 累積オフセットの計算
   */
  const getItemOffset = useCallback((index: number): number => {
    let offset = paddingStart;
    for (let i = 0; i < index; i++) {
      offset += getItemSize(i);
    }
    return offset;
  }, [getItemSize, paddingStart]);

  /**
   * 総サイズの計算
   */
  const totalSize = useMemo(() => {
    let size = paddingStart + paddingEnd;
    for (let i = 0; i < count; i++) {
      size += getItemSize(i);
    }
    return size;
  }, [count, getItemSize, paddingStart, paddingEnd]);

  /**
   * 可視範囲の計算
   */
  const getVisibleRange = useCallback(() => {
    if (scrollElementSize <= 0) {
      return { start: 0, end: 0 };
    }

    const scrollStart = scrollOffset;
    const scrollEnd = scrollOffset + scrollElementSize;

    // バイナリサーチで開始インデックスを見つける
    let start = 0;
    let end = count - 1;
    
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const offset = getItemOffset(mid);
      const size = getItemSize(mid);
      
      if (offset + size < scrollStart) {
        start = mid + 1;
      } else if (offset > scrollEnd) {
        end = mid - 1;
      } else {
        // 可視範囲内のアイテムを見つけた
        break;
      }
    }

    // 開始インデックスを確定
    let visibleStart = start;
    while (visibleStart > 0) {
      const offset = getItemOffset(visibleStart - 1);
      const size = getItemSize(visibleStart - 1);
      if (offset + size < scrollStart) break;
      visibleStart--;
    }

    // 終了インデックスを確定
    let visibleEnd = visibleStart;
    while (visibleEnd < count) {
      const offset = getItemOffset(visibleEnd);
      if (offset > scrollEnd) break;
      visibleEnd++;
    }

    // オーバースキャンを適用
    const rangeStart = Math.max(0, visibleStart - overscan);
    const rangeEnd = Math.min(count - 1, visibleEnd + overscan);

    return { start: rangeStart, end: rangeEnd };
  }, [scrollOffset, scrollElementSize, count, getItemOffset, getItemSize, overscan]);

  /**
   * 仮想アイテムの生成
   */
  const virtualItems = useMemo((): VirtualItem[] => {
    const { start, end } = getVisibleRange();
    const items: VirtualItem[] = [];

    for (let i = start; i <= end; i++) {
      const itemStart = getItemOffset(i);
      const itemSize = getItemSize(i);
      
      items.push({
        index: i,
        start: itemStart,
        size: itemSize,
        end: itemStart + itemSize
      });
    }

    if (debug) {
      console.log(`Virtual items: ${start}-${end} (${items.length} items)`);
    }

    return items;
  }, [getVisibleRange, getItemOffset, getItemSize, debug]);

  /**
   * スクロールイベントの処理
   */
  const handleScroll = useCallback(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    const offset = horizontal ? scrollElement.scrollLeft : scrollElement.scrollTop;
    const size = horizontal ? scrollElement.clientWidth : scrollElement.clientHeight;

    setScrollOffset(offset);
    setScrollElementSize(size);
    setIsScrolling(true);

    // スクロール終了の検出
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [getScrollElement, horizontal]);

  /**
   * リサイズイベントの処理
   */
  const handleResize = useCallback(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    const size = horizontal ? scrollElement.clientWidth : scrollElement.clientHeight;
    setScrollElementSize(size);
  }, [getScrollElement, horizontal]);

  /**
   * 指定インデックスへのスクロール
   */
  const scrollToIndex = useCallback((index: number, options: ScrollToOptions = {}) => {
    const scrollElement = getScrollElement();
    if (!scrollElement || index < 0 || index >= count) return;

    const { align = 'auto', behavior = 'auto' } = options;
    const itemOffset = getItemOffset(index);
    const itemSize = getItemSize(index);
    const scrollElementSize = horizontal ? scrollElement.clientWidth : scrollElement.clientHeight;

    let targetOffset = itemOffset;

    switch (align) {
      case 'start':
        targetOffset = itemOffset;
        break;
      case 'center':
        targetOffset = itemOffset - (scrollElementSize - itemSize) / 2;
        break;
      case 'end':
        targetOffset = itemOffset - scrollElementSize + itemSize;
        break;
      case 'auto':
        const currentOffset = horizontal ? scrollElement.scrollLeft : scrollElement.scrollTop;
        const itemEnd = itemOffset + itemSize;
        const scrollEnd = currentOffset + scrollElementSize;
        
        if (itemOffset < currentOffset) {
          targetOffset = itemOffset;
        } else if (itemEnd > scrollEnd) {
          targetOffset = itemEnd - scrollElementSize;
        } else {
          return; // 既に可視範囲内
        }
        break;
    }

    // スクロール実行
    const scrollOptions: ScrollToOptions = { behavior };
    if (horizontal) {
      scrollElement.scrollTo({ left: targetOffset, ...scrollOptions });
    } else {
      scrollElement.scrollTo({ top: targetOffset, ...scrollOptions });
    }
  }, [getScrollElement, count, getItemOffset, getItemSize, horizontal]);

  /**
   * 指定オフセットへのスクロール
   */
  const scrollToOffset = useCallback((offset: number, options: ScrollToOptions = {}) => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    const { behavior = 'auto' } = options;
    const scrollOptions: ScrollToOptions = { behavior };
    
    if (horizontal) {
      scrollElement.scrollTo({ left: offset, ...scrollOptions });
    } else {
      scrollElement.scrollTo({ top: offset, ...scrollOptions });
    }
  }, [getScrollElement, horizontal]);

  /**
   * サイズの再測定
   */
  const measure = useCallback(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    // 全てのアイテム要素を測定
    const items = scrollElement.querySelectorAll('[data-virtual-item]');
    items.forEach((element) => {
      const index = parseInt(element.getAttribute('data-virtual-item') || '0', 10);
      const size = horizontal ? element.clientWidth : element.clientHeight;
      
      if (size > 0) {
        measurementsRef.current.set(index, size);
        sizeCache.current[index] = size;
      }
    });

    // スクロール状態を更新
    handleScroll();
  }, [getScrollElement, horizontal, handleScroll]);

  /**
   * イベントリスナーの設定
   */
  useEffect(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    // 初期サイズの設定
    handleResize();
    handleScroll();

    // イベントリスナーの追加
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // ResizeObserver による要素サイズ監視
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(scrollElement);

    // クリーンアップ
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [getScrollElement, handleScroll, handleResize]);

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    measure
  };
}

/**
 * 仮想スクロール用のコンポーネントヘルパー
 */
export interface VirtualScrollContainerProps {
  height: number | string;
  width?: number | string;
  className?: string;
  children: React.ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * VirtualScrollContainer - 仮想スクロール用コンテナ
 */
export const VirtualScrollContainer: React.FC<VirtualScrollContainerProps> = ({
  height,
  width = '100%',
  className = '',
  children,
  onScroll
}) => {
  return (
    <div
      className={`virtual-scroll-container ${className}`}
      style={{
        height,
        width,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
};

/**
 * VirtualScrollItem - 仮想スクロール用アイテム
 */
export interface VirtualScrollItemProps {
  virtualItem: VirtualItem;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const VirtualScrollItem: React.FC<VirtualScrollItemProps> = ({
  virtualItem,
  children,
  className = '',
  style = {}
}) => {
  return (
    <div
      data-virtual-item={virtualItem.index}
      className={`virtual-scroll-item ${className}`}
      style={{
        position: 'absolute',
        top: virtualItem.start,
        left: 0,
        right: 0,
        height: virtualItem.size,
        ...style
      }}
    >
      {children}
    </div>
  );
};

/**
 * 無限スクロール用のフック
 */
export interface InfiniteScrollConfig {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number;
}

export function useInfiniteScroll(
  virtualScrollResult: VirtualScrollResult,
  config: InfiniteScrollConfig
) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage, threshold = 5 } = config;
  const { virtualItems } = virtualScrollResult;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || virtualItems.length === 0) {
      return;
    }

    // 最後のアイテムが可視範囲に近づいたら次のページを読み込み
    const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index;
    if (lastVisibleIndex !== undefined) {
      // 閾値以内に達したら読み込み開始
      const shouldFetch = lastVisibleIndex >= (virtualItems.length - threshold);
      if (shouldFetch) {
        fetchNextPage();
      }
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な仮想スクロール:
 * ```typescript
 * const VirtualConversationList = ({ conversations }: { conversations: Conversation[] }) => {
 *   const scrollElementRef = useRef<HTMLDivElement>(null);
 *   
 *   const { virtualItems, totalSize, scrollToIndex } = useVirtualScroll({
 *     count: conversations.length,
 *     getScrollElement: () => scrollElementRef.current,
 *     estimateSize: () => 80, // 推定高さ
 *     overscan: 5
 *   });
 * 
 *   return (
 *     <VirtualScrollContainer ref={scrollElementRef} height={400}>
 *       <div style={{ height: totalSize, position: 'relative' }}>
 *         {virtualItems.map(virtualItem => (
 *           <VirtualScrollItem key={virtualItem.index} virtualItem={virtualItem}>
 *             <ConversationItem conversation={conversations[virtualItem.index]} />
 *           </VirtualScrollItem>
 *         ))}
 *       </div>
 *     </VirtualScrollContainer>
 *   );
 * };
 * ```
 * 
 * 2. 無限スクロールとの組み合わせ:
 * ```typescript
 * const InfiniteConversationList = () => {
 *   const { conversations, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteConversations();
 *   const scrollElementRef = useRef<HTMLDivElement>(null);
 *   
 *   const virtualScrollResult = useVirtualScroll({
 *     count: conversations.length,
 *     getScrollElement: () => scrollElementRef.current,
 *     estimateSize: () => 80
 *   });
 * 
 *   useInfiniteScroll(virtualScrollResult, {
 *     hasNextPage,
 *     isFetchingNextPage,
 *     fetchNextPage,
 *     threshold: 10
 *   });
 * 
 *   return (
 *     <VirtualScrollContainer ref={scrollElementRef} height="100vh">
 *       <div style={{ height: virtualScrollResult.totalSize, position: 'relative' }}>
 *         {virtualScrollResult.virtualItems.map(virtualItem => (
 *           <VirtualScrollItem key={virtualItem.index} virtualItem={virtualItem}>
 *             <ConversationItem conversation={conversations[virtualItem.index]} />
 *           </VirtualScrollItem>
 *         ))}
 *         {isFetchingNextPage && (
 *           <div className="loading-indicator">読み込み中...</div>
 *         )}
 *       </div>
 *     </VirtualScrollContainer>
 *   );
 * };
 * ```
 * 
 * 3. 動的サイズ対応:
 * ```typescript
 * const DynamicVirtualList = () => {
 *   const { virtualItems, measure } = useVirtualScroll({
 *     count: items.length,
 *     getScrollElement: () => scrollElementRef.current,
 *     estimateSize: (index) => {
 *       // アイテムの内容に基づいて推定サイズを計算
 *       const item = items[index];
 *       return item.content.length > 100 ? 120 : 80;
 *     }
 *   });
 * 
 *   // アイテムのレンダリング後にサイズを再測定
 *   useEffect(() => {
 *     measure();
 *   }, [items, measure]);
 * 
 *   return (
 *     // ... レンダリング
 *   );
 * };
 * ```
 */