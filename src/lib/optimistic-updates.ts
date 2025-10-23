/**
 * Optimistic Updates Utility - 楽観的更新パターン
 * 
 * このファイルは楽観的更新（Optimistic Updates）の実装パターンを提供します。
 * ユーザーアクションに対して即座にUIを更新し、後でサーバーと同期することで
 * 優れたユーザー体験を実現します。
 * 
 * 目的:
 * - 即座のUIフィードバック提供
 * - ネットワーク遅延の体感軽減
 * - エラー時の適切なロールバック
 * - 一貫性のある楽観的更新パターン
 * 
 * 設計理由:
 * - 楽観的更新は現代のWebアプリケーションにおける重要なUXパターン
 * - 特にチャットアプリケーションでは即座のフィードバックが必須
 * - エラーハンドリングとロールバック機能が成功の鍵
 * - 型安全性を保ちながら汎用的なパターンを提供
 * 
 * 学習ポイント:
 * - 楽観的更新の基本概念と実装方法
 * - エラー時のロールバック戦略
 * - 状態管理との統合パターン
 * - TypeScriptによる型安全な実装
 * 
 * 使用例:
 * ```typescript
 * const optimisticUpdate = useOptimisticUpdate();
 * 
 * const handleCreate = async (data: CreateData) => {
 *   const rollback = optimisticUpdate.apply(
 *     items => [...items, optimisticItem],
 *     setItems
 *   );
 * 
 *   try {
 *     const result = await api.create(data);
 *     optimisticUpdate.confirm(result, setItems);
 *   } catch (error) {
 *     rollback();
 *     throw error;
 *   }
 * };
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/hooks/useMessages.ts
 */

/**
 * 楽観的更新の操作タイプ
 * 
 * 学習ポイント:
 * - CREATE: 新規アイテムの追加
 * - UPDATE: 既存アイテムの更新
 * - DELETE: アイテムの削除
 * - REORDER: アイテムの並び替え
 */
export type OptimisticOperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER';

/**
 * 楽観的更新の設定
 * 
 * 設計理由:
 * - operation: 操作タイプの明確化
 * - optimisticData: 楽観的に適用するデータ
 * - rollbackData: ロールバック用のバックアップデータ
 * - timeout: タイムアウト時間（オプション）
 */
export interface OptimisticUpdateConfig<T> {
  operation: OptimisticOperationType;
  optimisticData: T;
  rollbackData?: T[];
  timeout?: number;
}

/**
 * 楽観的更新の結果
 * 
 * 設計理由:
 * - rollback: ロールバック関数
 * - confirm: 確定関数
 * - isOptimistic: 楽観的状態の確認
 */
export interface OptimisticUpdateResult<T> {
  rollback: () => void;
  confirm: (actualData: T) => void;
  isOptimistic: boolean;
}

/**
 * 楽観的更新マネージャークラス
 * 
 * 学習ポイント:
 * - 楽観的更新の状態管理
 * - 複数の同時更新の処理
 * - タイムアウトとエラーハンドリング
 * - メモリリークの防止
 */
export class OptimisticUpdateManager<T> {
  private pendingUpdates = new Map<string, OptimisticUpdateConfig<T>>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * 楽観的更新の適用
   * 
   * @param id 更新の一意識別子
   * @param config 楽観的更新の設定
   * @param setState 状態更新関数
   * @returns 楽観的更新の結果
   */
  apply<S>(
    id: string,
    config: OptimisticUpdateConfig<T>,
    setState: React.Dispatch<React.SetStateAction<S>>,
    updateFunction: (prev: S, data: T) => S
  ): OptimisticUpdateResult<T> {
    // 既存の更新をクリーンアップ
    this.cleanup(id);

    // 楽観的更新を記録
    this.pendingUpdates.set(id, config);

    // 楽観的にUIを更新
    setState(prev => updateFunction(prev, config.optimisticData));

    // タイムアウト設定（オプション）
    if (config.timeout) {
      const timeoutId = setTimeout(() => {
        this.rollback(id, setState, updateFunction);
      }, config.timeout);
      this.timeouts.set(id, timeoutId);
    }

    return {
      rollback: () => this.rollback(id, setState, updateFunction),
      confirm: (actualData: T) => this.confirm(id, actualData, setState, updateFunction),
      isOptimistic: true
    };
  }

  /**
   * 楽観的更新のロールバック
   * 
   * 学習ポイント:
   * - 元の状態への復元
   * - エラー時の適切な処理
   * - UI状態の一貫性保持
   */
  private rollback<S>(
    id: string,
    setState: React.Dispatch<React.SetStateAction<S>>,
    updateFunction: (prev: S, data: T) => S
  ): void {
    const config = this.pendingUpdates.get(id);
    if (!config) return;

    // ロールバックデータが存在する場合は復元
    if (config.rollbackData) {
      // 複数アイテムの場合は全体を置換
      setState(config.rollbackData as S);
    } else {
      // 単一アイテムの場合は逆操作を実行
      this.performReverseOperation(config, setState, updateFunction);
    }

    this.cleanup(id);
  }

  /**
   * 楽観的更新の確定
   * 
   * 学習ポイント:
   * - サーバーデータでの置換
   * - 楽観的データと実際データの差分処理
   * - 状態の最終確定
   */
  private confirm<S>(
    id: string,
    actualData: T,
    setState: React.Dispatch<React.SetStateAction<S>>,
    updateFunction: (prev: S, data: T) => S
  ): void {
    const config = this.pendingUpdates.get(id);
    if (!config) return;

    // 実際のデータでUIを更新
    setState(prev => updateFunction(prev, actualData));

    this.cleanup(id);
  }

  /**
   * 逆操作の実行
   * 
   * 設計理由:
   * - CREATE → DELETE
   * - UPDATE → 元の値に復元
   * - DELETE → CREATE
   * - REORDER → 元の順序に復元
   */
  private performReverseOperation<S>(
    config: OptimisticUpdateConfig<T>,
    setState: React.Dispatch<React.SetStateAction<S>>,
    updateFunction: (prev: S, data: T) => S
  ): void {
    switch (config.operation) {
      case 'CREATE':
        // 作成の逆操作は削除
        setState(prev => {
          if (Array.isArray(prev)) {
            return (prev as any[]).filter(item => 
              !this.isEqual(item, config.optimisticData)
            ) as S;
          }
          return prev;
        });
        break;

      case 'DELETE':
        // 削除の逆操作は復元
        if (config.rollbackData) {
          setState(config.rollbackData as S);
        }
        break;

      case 'UPDATE':
        // 更新の逆操作は元の値に復元
        if (config.rollbackData) {
          setState(config.rollbackData as S);
        }
        break;

      case 'REORDER':
        // 並び替えの逆操作は元の順序に復元
        if (config.rollbackData) {
          setState(config.rollbackData as S);
        }
        break;
    }
  }

  /**
   * データの等価性チェック
   * 
   * 学習ポイント:
   * - オブジェクトの深い比較
   * - IDベースの比較
   * - パフォーマンスを考慮した実装
   */
  private isEqual(a: any, b: any): boolean {
    // IDが存在する場合はIDで比較
    if (a?.id && b?.id) {
      return a.id === b.id;
    }

    // 基本的な等価性チェック
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * リソースのクリーンアップ
   * 
   * 学習ポイント:
   * - メモリリークの防止
   * - タイムアウトのクリア
   * - 状態の適切な管理
   */
  private cleanup(id: string): void {
    // タイムアウトをクリア
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }

    // 保留中の更新を削除
    this.pendingUpdates.delete(id);
  }

  /**
   * 全ての保留中更新のクリーンアップ
   * 
   * 使用例: コンポーネントのアンマウント時
   */
  public cleanupAll(): void {
    // 全てのタイムアウトをクリア
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();

    // 全ての保留中更新を削除
    this.pendingUpdates.clear();
  }
}

/**
 * 楽観的更新フック
 * 
 * 学習ポイント:
 * - React Hooksパターンでの楽観的更新
 * - コンポーネントライフサイクルとの統合
 * - 型安全性の確保
 * - 使いやすいAPI設計
 */

import { useMemo, useEffect, useCallback } from 'react';

export function useOptimisticUpdate<T>() {
  const manager = useMemo(() => new OptimisticUpdateManager<T>(), []);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => manager.cleanupAll();
  }, [manager]);

  /**
   * 楽観的更新の適用
   * 
   * @param updateFunction 状態更新関数
   * @param setState React状態更新関数
   * @param config 楽観的更新の設定
   * @returns ロールバック関数
   */
  const apply = useCallback(<S>(
    updateFunction: (prev: S) => S,
    setState: React.Dispatch<React.SetStateAction<S>>,
    config?: { timeout?: number }
  ) => {
    const id = crypto.randomUUID();
    let rollbackData: S | undefined;

    // 現在の状態をバックアップ
    setState(prev => {
      rollbackData = prev;
      return updateFunction(prev);
    });

    // タイムアウト設定
    let timeoutId: NodeJS.Timeout | undefined;
    if (config?.timeout) {
      timeoutId = setTimeout(() => {
        if (rollbackData !== undefined) {
          setState(rollbackData);
        }
      }, config.timeout);
    }

    // ロールバック関数を返す
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (rollbackData !== undefined) {
        setState(rollbackData);
      }
    };
  }, []);

  return { apply };
}

/**
 * 楽観的更新のヘルパー関数群
 * 
 * 学習ポイント:
 * - 一般的な操作パターンの抽象化
 * - 再利用可能なユーティリティ
 * - 型安全性の確保
 */
export const optimisticHelpers = {
  /**
   * 配列への要素追加（楽観的）
   */
  addToArray: <T>(array: T[], item: T, position: 'start' | 'end' = 'end'): T[] => {
    return position === 'start' ? [item, ...array] : [...array, item];
  },

  /**
   * 配列からの要素削除（楽観的）
   */
  removeFromArray: <T>(array: T[], predicate: (item: T) => boolean): T[] => {
    return array.filter(item => !predicate(item));
  },

  /**
   * 配列内要素の更新（楽観的）
   */
  updateInArray: <T>(
    array: T[], 
    predicate: (item: T) => boolean, 
    updater: (item: T) => T
  ): T[] => {
    return array.map(item => predicate(item) ? updater(item) : item);
  },

  /**
   * オブジェクトの部分更新（楽観的）
   */
  updateObject: <T extends Record<string, any>>(
    obj: T, 
    updates: Partial<T>
  ): T => {
    return { ...obj, ...updates };
  }
};

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な楽観的更新:
 * ```typescript
 * const { apply } = useOptimisticUpdate();
 * 
 * const handleCreate = async (newItem: Item) => {
 *   const rollback = apply(
 *     prev => [...prev, newItem],
 *     setItems,
 *     { timeout: 5000 }
 *   );
 * 
 *   try {
 *     const result = await api.create(newItem);
 *     // 成功時は楽観的更新をそのまま維持
 *   } catch (error) {
 *     rollback();
 *     throw error;
 *   }
 * };
 * ```
 * 
 * 2. 複雑な状態更新:
 * ```typescript
 * const handleUpdate = async (id: string, updates: Partial<Item>) => {
 *   const rollback = apply(
 *     prev => optimisticHelpers.updateInArray(
 *       prev,
 *       item => item.id === id,
 *       item => optimisticHelpers.updateObject(item, updates)
 *     ),
 *     setItems
 *   );
 * 
 *   try {
 *     await api.update(id, updates);
 *   } catch (error) {
 *     rollback();
 *     throw error;
 *   }
 * };
 * ```
 * 
 * 3. チャットメッセージの楽観的送信:
 * ```typescript
 * const sendMessage = async (content: string) => {
 *   const optimisticMessage = {
 *     id: crypto.randomUUID(),
 *     content,
 *     timestamp: new Date(),
 *     status: 'sending'
 *   };
 * 
 *   const rollback = apply(
 *     prev => [...prev, optimisticMessage],
 *     setMessages
 *   );
 * 
 *   try {
 *     const result = await api.sendMessage(content);
 *     // サーバーからの実際のデータで更新
 *     setMessages(prev => 
 *       prev.map(msg => 
 *         msg.id === optimisticMessage.id ? result : msg
 *       )
 *     );
 *   } catch (error) {
 *     rollback();
 *     showErrorMessage('メッセージの送信に失敗しました');
 *   }
 * };
 * ```
 */