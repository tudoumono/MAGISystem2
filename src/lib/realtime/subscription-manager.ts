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
 * SubscriptionManager - GraphQL Subscriptions管理クラス
 * 
 * 機能:
 * - GraphQL Subscriptionsの作成と管理
 * - 接続状態の監視
 * - 自動再接続
 * - エラーハンドリング
 * - リソースのクリーンアップ
 */
export class SubscriptionManager {
  private static instance: SubscriptionManager | null = null;
  
  private client: any;
  private config: Required<SubscriptionConfig>;
  private activeSubscriptions = new Map<string, ActiveSubscription>();
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * プライベートコンストラクタ（Singleton パターン）
   */
  private constructor(config: SubscriptionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = getAmplifyClient();
  }

  /**
   * インスタンスの取得（Singleton パターン）
   */
  public static getInstance(config?: SubscriptionConfig): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager(config);
    }
    return SubscriptionManager.instance;
  }

  /**
   * 会話のサブスクリプション開始
   * 
   * 学習ポイント:
   * - onCreate, onUpdate, onDeleteの3つのイベントを監視
   * - オーナーベースアクセス制御により、自動的に現在のユーザーの会話のみ通知
   * - エラーハンドリングと自動再接続
   * 
   * @param userId ユーザーID（フィルタリング用）
   * @param handlers イベントハンドラー
   * @returns サブスクリプションID
   */
  public subscribeToConversations(
    userId: string,
    handlers: SubscriptionHandlers<Conversation>
  ): string {
    const subscriptionId = `conversations-${userId}`;
    
    // 既存のサブスクリプションがある場合は停止
    this.unsubscribe(subscriptionId);

    try {
      // 新規作成の監視
      const createSub = this.client.models.Conversation.onCreate().subscribe({
        next: (data: any) => {
          if (data && handlers.onCreate) {
            this.log('Conversation created:', data.id);
            handlers.onCreate(data);
          }
        },
        error: (error: any) => {
          this.handleSubscriptionError(subscriptionId, error, handlers.onError);
        }
      });

      // 更新の監視
      const updateSub = this.client.models.Conversation.onUpdate().subscribe({
        next: (data: any) => {
          if (data && handlers.onUpdate) {
            this.log('Conversation updated:', data.id);
            handlers.onUpdate(data);
          }
        },
        error: (error: any) => {
          this.handleSubscriptionError(subscriptionId, error, handlers.onError);
        }
      });

      // 削除の監視
      const deleteSub = this.client.models.Conversation.onDelete().subscribe({
        next: (data: any) => {
          if (data && handlers.onDelete) {
            this.log('Conversation deleted:', data.id);
            handlers.onDelete(data);
          }
        },
        error: (error: any) => {
          this.handleSubscriptionError(subscriptionId, error, handlers.onError);
        }
      });

      // 複合サブスクリプションとして管理
      const compositeSubscription = {
        unsubscribe: () => {
          createSub.unsubscribe();
          updateSub.unsubscribe();
          deleteSub.unsubscribe();
        }
      };

      // アクティブなサブスクリプションとして登録
      this.activeSubscriptions.set(subscriptionId, {
        id: subscriptionId,
        type: 'conversation',
        subscription: compositeSubscription,
        handlers,
        status: 'connected',
        reconnectAttempts: 0
      });

      this.log(`Conversation subscriptions started for user: ${userId}`);
      return subscriptionId;

    } catch (error) {
      this.handleSubscriptionError(subscriptionId, error, handlers.onError);
      throw error;
    }
  }

  /**
   * メッセージのサブスクリプション開始
   * 
   * 学習ポイント:
   * - 特定の会話のメッセージのみを監視
   * - フィルタリングによる効率的な通信
   * - エージェント応答の段階的更新をサポート
   * 
   * @param conversationId 会話ID
   * @param handlers イベントハンドラー
   * @returns サブスクリプションID
   */
  public subscribeToMessages(
    conversationId: string,
    handlers: SubscriptionHandlers<Message>
  ): string {
    const subscriptionId = `messages-${conversationId}`;
    
    // 既存のサブスクリプションがある場合は停止
    this.unsubscribe(subscriptionId);

    try {
      // 新規メッセージの監視
      const createSub = this.client.models.Message.onCreate({
        filter: {
          conversationId: { eq: conversationId }
        }
      }).subscribe({
        next: (data: any) => {
          if (data && handlers.onCreate) {
            this.log('Message created:', data.id);
            handlers.onCreate(data);
          }
        },
        error: (error: any) => {
          this.handleSubscriptionError(subscriptionId, error, handlers.onError);
        }
      });

      // メッセージ更新の監視（エージェント応答の段階的更新用）
      const updateSub = this.client.models.Message.onUpdate({
        filter: {
          conversationId: { eq: conversationId }
        }
      }).subscribe({
        next: (data: any) => {
          if (data && handlers.onUpdate) {
            this.log('Message updated:', data.id);
            handlers.onUpdate(data);
          }
        },
        error: (error: any) => {
          this.handleSubscriptionError(subscriptionId, error, handlers.onError);
        }
      });

      // メッセージ削除の監視
      const deleteSub = this.client.models.Message.onDelete({
        filter: {
          conversationId: { eq: conversationId }
        }
      }).subscribe({
        next: (data: any) => {
          if (data && handlers.onDelete) {
            this.log('Message deleted:', data.id);
            handlers.onDelete(data);
          }
        },
        error: (error: any) => {
          this.handleSubscriptionError(subscriptionId, error, handlers.onError);
        }
      });

      // 複合サブスクリプションとして管理
      const compositeSubscription = {
        unsubscribe: () => {
          createSub.unsubscribe();
          updateSub.unsubscribe();
          deleteSub.unsubscribe();
        }
      };

      // アクティブなサブスクリプションとして登録
      this.activeSubscriptions.set(subscriptionId, {
        id: subscriptionId,
        type: 'message',
        subscription: compositeSubscription,
        handlers,
        status: 'connected',
        reconnectAttempts: 0
      });

      this.log(`Message subscriptions started for conversation: ${conversationId}`);
      return subscriptionId;

    } catch (error) {
      this.handleSubscriptionError(subscriptionId, error, handlers.onError);
      throw error;
    }
  }

  /**
   * トレースステップのサブスクリプション開始
   * 
   * 学習ポイント:
   * - 特定のメッセージのトレースステップのみを監視
   * - リアルタイムでの推論過程表示
   * - パフォーマンス監視データの収集
   * 
   * @param messageId メッセージID
   * @param handlers イベントハンドラー
   * @returns サブスクリプションID
   */
  public subscribeToTraceSteps(
    messageId: string,
    handlers: SubscriptionHandlers<TraceStep>
  ): string {
    const subscriptionId = `traceSteps-${messageId}`;
    
    // 既存のサブスクリプションがある場合は停止
    this.unsubscribe(subscriptionId);

    try {
      // 新規トレースステップの監視
      const createSub = this.client.models.TraceStep.onCreate({
        filter: {
          messageId: { eq: messageId }
        }
      }).subscribe({
        next: (data: any) => {
          if (data && handlers.onCreate) {
            this.log('TraceStep created:', data.id);
            handlers.onCreate(data);
          }
        },
        error: (error: any) => {
          this.handleSubscriptionError(subscriptionId, error, handlers.onError);
        }
      });

      // トレースステップ更新の監視
      const updateSub = this.client.models.TraceStep.onUpdate({
        filter: {
          messageId: { eq: messageId }
        }
      }).subscribe({
        next: (data: any) => {
          if (data && handlers.onUpdate) {
            this.log('TraceStep updated:', data.id);
            handlers.onUpdate(data);
          }
        },
        error: (error: any) => {
          this.handleSubscriptionError(subscriptionId, error, handlers.onError);
        }
      });

      // 複合サブスクリプションとして管理
      const compositeSubscription = {
        unsubscribe: () => {
          createSub.unsubscribe();
          updateSub.unsubscribe();
        }
      };

      // アクティブなサブスクリプションとして登録
      this.activeSubscriptions.set(subscriptionId, {
        id: subscriptionId,
        type: 'traceStep',
        subscription: compositeSubscription,
        handlers,
        status: 'connected',
        reconnectAttempts: 0
      });

      this.log(`TraceStep subscriptions started for message: ${messageId}`);
      return subscriptionId;

    } catch (error) {
      this.handleSubscriptionError(subscriptionId, error, handlers.onError);
      throw error;
    }
  }

  /**
   * 特定のサブスクリプションを停止
   * 
   * @param subscriptionId サブスクリプションID
   */
  public unsubscribe(subscriptionId: string): void {
    const activeSubscription = this.activeSubscriptions.get(subscriptionId);
    if (activeSubscription) {
      try {
        activeSubscription.subscription.unsubscribe();
        this.log(`Subscription stopped: ${subscriptionId}`);
      } catch (error) {
        console.error(`Error stopping subscription ${subscriptionId}:`, error);
      }

      // 再接続タイマーをクリア
      const timeout = this.reconnectTimeouts.get(subscriptionId);
      if (timeout) {
        clearTimeout(timeout);
        this.reconnectTimeouts.delete(subscriptionId);
      }

      this.activeSubscriptions.delete(subscriptionId);
    }
  }

  /**
   * 会話のサブスクリプションを停止
   * 
   * @param userId ユーザーID
   */
  public unsubscribeFromConversations(userId: string): void {
    this.unsubscribe(`conversations-${userId}`);
  }

  /**
   * メッセージのサブスクリプションを停止
   * 
   * @param conversationId 会話ID
   */
  public unsubscribeFromMessages(conversationId: string): void {
    this.unsubscribe(`messages-${conversationId}`);
  }

  /**
   * トレースステップのサブスクリプションを停止
   * 
   * @param messageId メッセージID
   */
  public unsubscribeFromTraceSteps(messageId: string): void {
    this.unsubscribe(`traceSteps-${messageId}`);
  }

  /**
   * 全てのサブスクリプションを停止
   */
  public unsubscribeAll(): void {
    const subscriptionIds = Array.from(this.activeSubscriptions.keys());
    subscriptionIds.forEach(id => this.unsubscribe(id));
    
    this.log('All subscriptions stopped');
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
    lastError?: Error;
  }> {
    return Array.from(this.activeSubscriptions.values()).map(sub => ({
      id: sub.id,
      type: sub.type,
      status: sub.status,
      reconnectAttempts: sub.reconnectAttempts,
      lastError: sub.lastError
    }));
  }

  /**
   * サブスクリプションエラーの処理
   * 
   * 学習ポイント:
   * - エラーの分類と適切な対応
   * - 自動再接続の実装
   * - エラー情報の記録と通知
   */
  private handleSubscriptionError(
    subscriptionId: string,
    error: any,
    onError?: (error: Error) => void
  ): void {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    if (!subscription) return;

    const errorObj = error instanceof Error ? error : new Error(String(error));
    subscription.lastError = errorObj;
    subscription.status = 'error';

    this.log(`Subscription error for ${subscriptionId}:`, errorObj.message);

    // エラーハンドラーを呼び出し
    if (onError) {
      try {
        onError(errorObj);
      } catch (handlerError) {
        console.error('Error in subscription error handler:', handlerError);
      }
    }

    // 自動再接続を試行
    if (this.config.autoReconnect && 
        subscription.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect(subscriptionId);
    }
  }

  /**
   * 再接続のスケジュール
   * 
   * 学習ポイント:
   * - 指数バックオフによる再接続間隔の調整
   * - 最大試行回数の制限
   * - 再接続状態の管理
   */
  private scheduleReconnect(subscriptionId: string): void {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    if (!subscription) return;

    // 既存の再接続タイマーをクリア
    const existingTimeout = this.reconnectTimeouts.get(subscriptionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    subscription.reconnectAttempts++;
    subscription.status = 'reconnecting';

    // 指数バックオフ
    const delay = this.config.reconnectInterval * Math.pow(2, subscription.reconnectAttempts - 1);
    
    this.log(`Scheduling reconnect for ${subscriptionId} in ${delay}ms (attempt ${subscription.reconnectAttempts})`);

    const timeout = setTimeout(() => {
      this.attemptReconnect(subscriptionId);
    }, delay);

    this.reconnectTimeouts.set(subscriptionId, timeout);
  }

  /**
   * 再接続の実行
   * 
   * 学習ポイント:
   * - サブスクリプションタイプに応じた再接続処理
   * - 元のハンドラーの保持
   * - 再接続成功時の状態リセット
   */
  private attemptReconnect(subscriptionId: string): void {
    const subscription = this.activeSubscriptions.get(subscriptionId);
    if (!subscription) return;

    this.log(`Attempting to reconnect: ${subscriptionId}`);

    try {
      // 古いサブスクリプションを停止
      subscription.subscription.unsubscribe();

      // サブスクリプションタイプに応じて再接続
      const [type, id] = subscriptionId.split('-');
      
      switch (type) {
        case 'conversations':
          this.subscribeToConversations(id, subscription.handlers);
          break;
        case 'messages':
          this.subscribeToMessages(id, subscription.handlers);
          break;
        case 'traceSteps':
          this.subscribeToTraceSteps(id, subscription.handlers);
          break;
        default:
          throw new Error(`Unknown subscription type: ${type}`);
      }

      this.log(`Successfully reconnected: ${subscriptionId}`);

    } catch (error) {
      this.log(`Failed to reconnect ${subscriptionId}:`, error);
      this.handleSubscriptionError(subscriptionId, error, subscription.handlers.onError);
    }
  }

  /**
   * ログ出力
   * 
   * @param message ログメッセージ
   * @param data 追加データ
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      if (data !== undefined) {
        console.log(`[SubscriptionManager] ${message}`, data);
      } else {
        console.log(`[SubscriptionManager] ${message}`);
      }
    }
  }

  /**
   * サービスの破棄
   * 
   * 学習ポイント:
   * - 全リソースのクリーンアップ
   * - メモリリークの防止
   * - Singletonインスタンスのリセット
   */
  public destroy(): void {
    this.unsubscribeAll();
    
    // 全ての再接続タイマーをクリア
    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectTimeouts.clear();
    
    SubscriptionManager.instance = null;
    this.log('SubscriptionManager destroyed');
  }
}

/**
 * デフォルトインスタンスのエクスポート
 */
export const subscriptionManager = SubscriptionManager.getInstance();

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な会話監視:
 * ```typescript
 * const manager = SubscriptionManager.getInstance();
 * 
 * const subscriptionId = manager.subscribeToConversations('user-123', {
 *   onCreate: (conversation) => {
 *     console.log('New conversation:', conversation.title);
 *     // UIを更新
 *   },
 *   onUpdate: (conversation) => {
 *     console.log('Updated conversation:', conversation.title);
 *     // UIを更新
 *   },
 *   onDelete: (conversation) => {
 *     console.log('Deleted conversation:', conversation.id);
 *     // UIから削除
 *   },
 *   onError: (error) => {
 *     console.error('Subscription error:', error);
 *     // エラー表示
 *   }
 * });
 * 
 * // クリーンアップ
 * useEffect(() => {
 *   return () => manager.unsubscribe(subscriptionId);
 * }, [subscriptionId]);
 * ```
 * 
 * 2. メッセージのリアルタイム更新:
 * ```typescript
 * manager.subscribeToMessages(conversationId, {
 *   onCreate: (message) => {
 *     // 新しいメッセージを追加
 *     setMessages(prev => [...prev, message]);
 *   },
 *   onUpdate: (message) => {
 *     // エージェント応答の段階的更新
 *     setMessages(prev => 
 *       prev.map(msg => msg.id === message.id ? message : msg)
 *     );
 *   }
 * });
 * ```
 * 
 * 3. エラーハンドリングと再接続:
 * ```typescript
 * const [connectionStatus, setConnectionStatus] = useState('connected');
 * 
 * manager.subscribeToConversations(userId, {
 *   // ... other handlers
 *   onError: (error) => {
 *     setConnectionStatus('error');
 *     showErrorMessage('リアルタイム更新でエラーが発生しました');
 *   }
 * });
 * 
 * // 接続状態の監視
 * const status = manager.getSubscriptionStatus(`conversations-${userId}`);
 * ```
 */