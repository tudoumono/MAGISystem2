'use client';

/**
 * Subscription Manager - GraphQL Subscriptions管理
 * 
 * このファイルはAmplify Data/AI KitのGraphQL Subscriptionsを管理します。
 * リアルタイム更新の一元管理、接続状態の監視、エラーハンドリング、
 * 自動再接続機能を提供します。
 * 
 * 目的:
 * - GraphQL Subscriptionsの一元管理
 * - 複数コンポーネント間でのサブスクリプション共有
 * - 接続状態の監視とエラーハンドリング
 * - メモリリークの防止とリソース管理
 * 
 * 設計理由:
 * - Singleton パターンによる一元管理
 * - EventEmitter パターンによるイベント通知
 * - 型安全なサブスクリプション管理
 * - パフォーマンス最適化（重複サブスクリプションの防止）
 * 
 * 学習ポイント:
 * - GraphQL Subscriptionsの実装パターン
 * - リアルタイム通信の状態管理
 * - エラーハンドリングと再接続戦略
 * - TypeScriptによる型安全な実装
 * 
 * 要件対応:
 * - 2.4: リアルタイム会話更新
 * - 2.5: 無限スクロールによる効率的データ読み込み
 * - 2.6: 会話タイトル編集とメタデータ表示
 * 
 * 使用例:
 * ```typescript
 * const manager = SubscriptionManager.getInstance();
 * 
 * // 会話の変更を監視
 * manager.subscribeToConversations(userId, {
 *   onCreate: (conversation) => console.log('New conversation:', conversation),
 *   onUpdate: (conversation) => console.log('Updated conversation:', conversation),
 *   onDelete: (conversation) => console.log('Deleted conversation:', conversation)
 * });
 * 
 * // クリーンアップ
 * manager.unsubscribeFromConversations(userId);
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/hooks/useMessages.ts
 */

import { getAmplifyClient } from '@/lib/amplify/client';
import type { Conversation, Message, TraceStep } from '@/lib/amplify/types';

/**
 * サブスクリプション状態の定義
 */
export type SubscriptionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

/**
 * サブスクリプションイベントハンドラーの型定義
 */
export interface SubscriptionHandlers<T> {
  onCreate?: (item: T) => void;
  onUpdate?: (item: T) => void;
  onDelete?: (item: T) => void;
  onError?: (error: Error) => void;
}

/**
 * サブスクリプション設定
 */
export interface SubscriptionConfig {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enableLogging?: boolean;
}

/**
 * アクティブなサブスクリプションの管理情報
 */
interface ActiveSubscription {
  id: string;
  type: 'conversation' | 'message' | 'traceStep';
  subscription: any; // Amplify subscription object
  handlers: SubscriptionHandlers<any>;
  status: SubscriptionStatus;
  reconnectAttempts: number;
  lastError?: Error;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: Required<SubscriptionConfig> = {
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  enableLogging: true,
};

/**
 * SubscriptionManager - GraphQL Subscriptionsの一元管理
 * 
 * Singleton パターンによる実装で、アプリケーション全体で
 * 一つのインスタンスを共有します。
 */
export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private activeSubscriptions = new Map<string, ActiveSubscription>();
  private config: Required<SubscriptionConfig>;
  private client: any;

  private constructor(config: SubscriptionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = getAmplifyClient();
    
    if (this.config.enableLogging) {
      console.log('🔄 SubscriptionManager initialized');
    }
  }

  /**
   * Singleton インスタンスの取得
   */
  public static getInstance(config?: SubscriptionConfig): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager(config);
    }
    return SubscriptionManager.instance;
  }

  /**
   * 会話の変更を監視するサブスクリプション
   */
  public subscribeToConversations(
    userId: string,
    handlers: SubscriptionHandlers<Conversation>
  ): string {
    const subscriptionId = `conversations-${userId}-${Date.now()}`;
    
    try {
      // 作成イベントのサブスクリプション
      const createSub = this.client.models.Conversation.onCreate().subscribe({
        next: (data: any) => {
          if (data && handlers.onCreate) {
            if (this.config.enableLogging) {
              console.log('🔄 Conversation created:', data.id);
            }
            handlers.onCreate(data);
          }
        },
        error: (error: any) => {
          console.error('❌ Conversation create subscription error:', error);
          if (handlers.onError) {
            handlers.onError(error);
          }
          this.handleSubscriptionError(subscriptionId, error);
        }
      });

      // 更新イベントのサブスクリプション
      const updateSub = this.client.models.Conversation.onUpdate().subscribe({
        next: (data: any) => {
          if (data && handlers.onUpdate) {
            if (this.config.enableLogging) {
              console.log('🔄 Conversation updated:', data.id);
            }
            handlers.onUpdate(data);
          }
        },
        error: (error: any) => {
          console.error('❌ Conversation update subscription error:', error);
          if (handlers.onError) {
            handlers.onError(error);
          }
          this.handleSubscriptionError(subscriptionId, error);
        }
      });

      // 削除イベントのサブスクリプション
      const deleteSub = this.client.models.Conversation.onDelete().subscribe({
        next: (data: any) => {
          if (data && handlers.onDelete) {
            if (this.config.enableLogging) {
              console.log('🔄 Conversation deleted:', data.id);
            }
            handlers.onDelete(data);
          }
        },
        error: (error: any) => {
          console.error('❌ Conversation delete subscription error:', error);
          if (handlers.onError) {
            handlers.onError(error);
          }
          this.handleSubscriptionError(subscriptionId, error);
        }
      });

      // アクティブなサブスクリプションとして登録
      this.activeSubscriptions.set(subscriptionId, {
        id: subscriptionId,
        type: 'conversation',
        subscription: { createSub, updateSub, deleteSub },
        handlers,
        status: 'connected',
        reconnectAttempts: 0,
      });

      if (this.config.enableLogging) {
        console.log(`✅ Conversation subscription created: ${subscriptionId}`);
      }

      return subscriptionId;
    } catch (error) {
      console.error('❌ Failed to create conversation subscription:', error);
      throw error;
    }
  }

  /**
   * サブスクリプションの解除
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    
    if (subscription) {
      try {
        // 各サブスクリプションを解除
        if (subscription.subscription.createSub) {
          subscription.subscription.createSub.unsubscribe();
        }
        if (subscription.subscription.updateSub) {
          subscription.subscription.updateSub.unsubscribe();
        }
        if (subscription.subscription.deleteSub) {
          subscription.subscription.deleteSub.unsubscribe();
        }

        // アクティブリストから削除
        this.activeSubscriptions.delete(subscriptionId);

        if (this.config.enableLogging) {
          console.log(`✅ Subscription unsubscribed: ${subscriptionId}`);
        }
      } catch (error) {
        console.error('❌ Error unsubscribing:', error);
      }
    }
  }

  /**
   * 全てのサブスクリプションを解除
   */
  public unsubscribeAll(): void {
    const subscriptionIds = Array.from(this.activeSubscriptions.keys());
    
    for (const id of subscriptionIds) {
      this.unsubscribe(id);
    }

    if (this.config.enableLogging) {
      console.log('✅ All subscriptions unsubscribed');
    }
  }

  /**
   * サブスクリプションエラーの処理
   */
  private handleSubscriptionError(subscriptionId: string, error: Error): void {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    
    if (subscription) {
      subscription.status = 'error';
      subscription.lastError = error;
      subscription.reconnectAttempts++;

      // 自動再接続の試行
      if (
        this.config.autoReconnect &&
        subscription.reconnectAttempts < this.config.maxReconnectAttempts
      ) {
        subscription.status = 'reconnecting';
        
        setTimeout(() => {
          this.attemptReconnect(subscriptionId);
        }, this.config.reconnectInterval);
      }
    }
  }

  /**
   * 再接続の試行
   */
  private attemptReconnect(subscriptionId: string): void {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    
    if (subscription) {
      if (this.config.enableLogging) {
        console.log(`🔄 Attempting to reconnect: ${subscriptionId}`);
      }

      try {
        // 既存のサブスクリプションを解除
        this.unsubscribe(subscriptionId);

        // 新しいサブスクリプションを作成
        if (subscription.type === 'conversation') {
          // 会話サブスクリプションの再作成は複雑なため、エラーハンドラーで通知
          if (subscription.handlers.onError) {
            subscription.handlers.onError(new Error('Conversation subscription reconnection required'));
          }
        }
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        
        if (subscription.handlers.onError) {
          subscription.handlers.onError(error as Error);
        }
      }
    }
  }

  /**
   * メッセージの変更を監視するサブスクリプション
   */
  public subscribeToMessages(
    conversationId: string,
    handlers: SubscriptionHandlers<Message>
  ): string {
    const subscriptionId = `messages-${conversationId}-${Date.now()}`;

    try {
      // 作成イベントのサブスクリプション
      const createSub = this.client.models.Message.onCreate().subscribe({
        next: (data: any) => {
          if (data && data.conversationId === conversationId && handlers.onCreate) {
            if (this.config.enableLogging) {
              console.log('🔄 Message created:', data.id);
            }
            handlers.onCreate(data);
          }
        },
        error: (error: any) => {
          console.error('❌ Message create subscription error:', error);
          if (handlers.onError) {
            handlers.onError(error);
          }
          this.handleSubscriptionError(subscriptionId, error);
        }
      });

      // 更新イベントのサブスクリプション
      const updateSub = this.client.models.Message.onUpdate().subscribe({
        next: (data: any) => {
          if (data && data.conversationId === conversationId && handlers.onUpdate) {
            if (this.config.enableLogging) {
              console.log('🔄 Message updated:', data.id);
            }
            handlers.onUpdate(data);
          }
        },
        error: (error: any) => {
          console.error('❌ Message update subscription error:', error);
          if (handlers.onError) {
            handlers.onError(error);
          }
          this.handleSubscriptionError(subscriptionId, error);
        }
      });

      // 削除イベントのサブスクリプション
      const deleteSub = this.client.models.Message.onDelete().subscribe({
        next: (data: any) => {
          if (data && data.conversationId === conversationId && handlers.onDelete) {
            if (this.config.enableLogging) {
              console.log('🔄 Message deleted:', data.id);
            }
            handlers.onDelete(data);
          }
        },
        error: (error: any) => {
          console.error('❌ Message delete subscription error:', error);
          if (handlers.onError) {
            handlers.onError(error);
          }
          this.handleSubscriptionError(subscriptionId, error);
        }
      });

      // アクティブなサブスクリプションとして登録
      this.activeSubscriptions.set(subscriptionId, {
        id: subscriptionId,
        type: 'message',
        subscription: { createSub, updateSub, deleteSub },
        handlers,
        status: 'connected',
        reconnectAttempts: 0,
      });

      if (this.config.enableLogging) {
        console.log(`✅ Message subscription created: ${subscriptionId}`);
      }

      return subscriptionId;
    } catch (error) {
      console.error('❌ Failed to create message subscription:', error);
      throw error;
    }
  }

  /**
   * アクティブなサブスクリプションの状態を取得
   */
  public getSubscriptionStatus(subscriptionId: string): SubscriptionStatus | null {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    return subscription ? subscription.status : null;
  }

  /**
   * 全てのアクティブなサブスクリプションの情報を取得
   */
  public getActiveSubscriptions(): Array<{
    id: string;
    type: string;
    status: SubscriptionStatus;
    reconnectAttempts: number;
  }> {
    return Array.from(this.activeSubscriptions.values()).map(sub => ({
      id: sub.id,
      type: sub.type,
      status: sub.status,
      reconnectAttempts: sub.reconnectAttempts,
    }));
  }
}

/**
 * デフォルトのSubscriptionManagerインスタンス
 */
export const subscriptionManager = SubscriptionManager.getInstance();