/**
 * Offline Support - オフライン対応とネットワーク状態管理
 * 
 * このファイルはオフライン環境での動作をサポートします。
 * ネットワーク状態の監視、オフライン時のデータキューイング、
 * オンライン復帰時の自動同期機能を提供します。
 * 
 * 目的:
 * - ネットワーク状態の監視と通知
 * - オフライン時のデータ操作キューイング
 * - オンライン復帰時の自動同期
 * - ローカルストレージによるデータ永続化
 * 
 * 設計理由:
 * - PWA対応によるオフライン体験の向上
 * - ネットワーク不安定環境での信頼性確保
 * - データ損失の防止
 * - ユーザー体験の継続性
 * 
 * 学習ポイント:
 * - Navigator Online API の使用方法
 * - Service Worker との連携パターン
 * - IndexedDB によるローカルデータ管理
 * - キューイングシステムの実装
 * 
 * 要件対応:
 * - 5.5: エラーハンドリングとオフライン対応
 * - 2.4, 2.5, 2.6: リアルタイム機能の信頼性向上
 * 
 * 使用例:
 * ```typescript
 * const offlineManager = OfflineManager.getInstance();
 * 
 * // ネットワーク状態の監視
 * offlineManager.onNetworkChange((isOnline) => {
 *   if (isOnline) {
 *     console.log('オンラインに復帰しました');
 *   } else {
 *     console.log('オフラインになりました');
 *   }
 * });
 * 
 * // オフライン時の操作キューイング
 * await offlineManager.queueOperation({
 *   type: 'CREATE_MESSAGE',
 *   data: messageData,
 *   retry: true
 * });
 * ```
 * 
 * 関連: src/lib/realtime/subscription-manager.ts, src/hooks/useConversations.ts
 */

/**
 * ネットワーク状態の定義
 */
export type NetworkStatus = 'online' | 'offline' | 'slow' | 'unknown';

/**
 * キューイングされる操作の型定義
 */
export interface QueuedOperation {
  id: string;
  type: 'CREATE_CONVERSATION' | 'UPDATE_CONVERSATION' | 'DELETE_CONVERSATION' | 
        'CREATE_MESSAGE' | 'UPDATE_MESSAGE' | 'DELETE_MESSAGE';
  data: any;
  timestamp: number;
  retry: boolean;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
}

/**
 * オフライン設定
 */
export interface OfflineConfig {
  enableQueueing: boolean;
  maxQueueSize: number;
  maxRetries: number;
  retryInterval: number;
  enableLocalStorage: boolean;
  storageKey: string;
  networkCheckInterval: number;
}

/**
 * ネットワーク状態変更のコールバック
 */
export type NetworkChangeCallback = (isOnline: boolean, status: NetworkStatus) => void;

/**
 * 操作結果の型定義
 */
export interface OperationResult {
  success: boolean;
  error?: Error;
  data?: any;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: OfflineConfig = {
  enableQueueing: true,
  maxQueueSize: 100,
  maxRetries: 3,
  retryInterval: 5000,
  enableLocalStorage: true,
  storageKey: 'magi-offline-queue',
  networkCheckInterval: 30000,
};

/**
 * OfflineManager - オフライン対応管理クラス
 * 
 * 機能:
 * - ネットワーク状態の監視
 * - オフライン時の操作キューイング
 * - オンライン復帰時の自動同期
 * - ローカルストレージによるデータ永続化
 * - 接続品質の監視
 */
export class OfflineManager {
  private static instance: OfflineManager | null = null;
  
  private config: OfflineConfig;
  private networkStatus: NetworkStatus = 'unknown';
  private operationQueue: QueuedOperation[] = [];
  private networkChangeCallbacks: NetworkChangeCallback[] = [];
  private syncInProgress = false;
  private networkCheckInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;

  /**
   * プライベートコンストラクタ（Singleton パターン）
   */
  private constructor(config: Partial<OfflineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeNetworkMonitoring();
    this.loadQueueFromStorage();
  }

  /**
   * インスタンスの取得（Singleton パターン）
   */
  public static getInstance(config?: Partial<OfflineConfig>): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager(config);
    }
    return OfflineManager.instance;
  }

  /**
   * ネットワーク監視の初期化
   * 
   * 学習ポイント:
   * - Navigator Online API の使用
   * - イベントリスナーの設定
   * - 接続品質の推定
   */
  private initializeNetworkMonitoring(): void {
    // 初期状態の設定
    this.updateNetworkStatus();

    // オンライン/オフラインイベントの監視
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // 定期的なネットワーク状態チェック
    if (this.config.networkCheckInterval > 0) {
      this.networkCheckInterval = setInterval(() => {
        this.checkNetworkQuality();
      }, this.config.networkCheckInterval);
    }
  }

  /**
   * ネットワーク状態の更新
   */
  private updateNetworkStatus(): void {
    const wasOnline = this.isOnline();
    
    if (navigator.onLine) {
      this.networkStatus = 'online';
    } else {
      this.networkStatus = 'offline';
    }

    // 状態変更時のコールバック実行
    if (wasOnline !== this.isOnline()) {
      this.notifyNetworkChange();
    }
  }

  /**
   * オンライン復帰時の処理
   */
  private handleOnline(): void {
    console.log('Network: Online');
    this.updateNetworkStatus();
    
    // キューイングされた操作の同期を開始
    if (this.operationQueue.length > 0) {
      this.syncQueuedOperations();
    }
  }

  /**
   * オフライン時の処理
   */
  private handleOffline(): void {
    console.log('Network: Offline');
    this.updateNetworkStatus();
  }

  /**
   * ネットワーク品質のチェック
   * 
   * 学習ポイント:
   * - Connection API の使用（利用可能な場合）
   * - 簡易的な接続テストの実装
   * - 接続品質の推定
   */
  private async checkNetworkQuality(): Promise<void> {
    if (!this.isOnline()) return;

    try {
      // Connection API が利用可能な場合
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.networkStatus = 'slow';
        } else {
          this.networkStatus = 'online';
        }
        return;
      }

      // 簡易的な接続テスト
      const startTime = Date.now();
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      const endTime = Date.now();
      
      if (response.ok) {
        const latency = endTime - startTime;
        this.networkStatus = latency > 2000 ? 'slow' : 'online';
      } else {
        this.networkStatus = 'offline';
      }
    } catch (error) {
      console.warn('Network quality check failed:', error);
      this.networkStatus = 'offline';
    }
  }

  /**
   * ネットワーク状態変更の通知
   */
  private notifyNetworkChange(): void {
    const isOnline = this.isOnline();
    this.networkChangeCallbacks.forEach(callback => {
      try {
        callback(isOnline, this.networkStatus);
      } catch (error) {
        console.error('Error in network change callback:', error);
      }
    });
  }

  /**
   * 現在のネットワーク状態を取得
   */
  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * オンライン状態かどうかを判定
   */
  public isOnline(): boolean {
    return this.networkStatus === 'online' || this.networkStatus === 'slow';
  }

  /**
   * ネットワーク状態変更のコールバックを登録
   */
  public onNetworkChange(callback: NetworkChangeCallback): () => void {
    this.networkChangeCallbacks.push(callback);
    
    // 登録解除関数を返す
    return () => {
      const index = this.networkChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.networkChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 操作をキューに追加
   * 
   * 学習ポイント:
   * - オフライン時の操作保存
   * - 優先度による並び替え
   * - ローカルストレージへの永続化
   * 
   * @param operation キューイングする操作
   */
  public async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    if (!this.config.enableQueueing) {
      throw new Error('Operation queueing is disabled');
    }

    const queuedOperation: QueuedOperation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: operation.maxRetries || this.config.maxRetries,
      ...operation
    };

    // キューサイズの制限チェック
    if (this.operationQueue.length >= this.config.maxQueueSize) {
      // 古い低優先度の操作を削除
      this.removeOldLowPriorityOperations();
    }

    // 優先度順に挿入
    this.insertOperationByPriority(queuedOperation);

    // ローカルストレージに保存
    this.saveQueueToStorage();

    console.log(`Operation queued: ${queuedOperation.type} (${queuedOperation.id})`);

    // オンラインの場合は即座に実行を試行
    if (this.isOnline() && !this.syncInProgress) {
      this.syncQueuedOperations();
    }

    return queuedOperation.id;
  }

  /**
   * 優先度順に操作を挿入
   */
  private insertOperationByPriority(operation: QueuedOperation): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const insertIndex = this.operationQueue.findIndex(
      op => priorityOrder[op.priority] > priorityOrder[operation.priority]
    );
    
    if (insertIndex === -1) {
      this.operationQueue.push(operation);
    } else {
      this.operationQueue.splice(insertIndex, 0, operation);
    }
  }

  /**
   * 古い低優先度の操作を削除
   */
  private removeOldLowPriorityOperations(): void {
    const lowPriorityOps = this.operationQueue
      .filter(op => op.priority === 'low')
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (lowPriorityOps.length > 0) {
      const toRemove = lowPriorityOps[0];
      const index = this.operationQueue.indexOf(toRemove);
      if (index > -1) {
        this.operationQueue.splice(index, 1);
        console.log(`Removed old low priority operation: ${toRemove.id}`);
      }
    }
  }

  /**
   * キューイングされた操作の同期
   * 
   * 学習ポイント:
   * - 順次実行による整合性確保
   * - エラー時のリトライ機能
   * - 部分的な同期成功の処理
   */
  public async syncQueuedOperations(): Promise<void> {
    if (!this.isOnline() || this.syncInProgress || this.operationQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Starting sync of ${this.operationQueue.length} queued operations`);

    const operationsToSync = [...this.operationQueue];
    const successfulOperations: string[] = [];
    const failedOperations: QueuedOperation[] = [];

    for (const operation of operationsToSync) {
      try {
        const result = await this.executeOperation(operation);
        
        if (result.success) {
          successfulOperations.push(operation.id);
          console.log(`Operation synced successfully: ${operation.id}`);
        } else {
          operation.retryCount++;
          if (operation.retry && operation.retryCount < operation.maxRetries) {
            failedOperations.push(operation);
            console.log(`Operation failed, will retry: ${operation.id} (${operation.retryCount}/${operation.maxRetries})`);
          } else {
            console.error(`Operation failed permanently: ${operation.id}`, result.error);
          }
        }
      } catch (error) {
        operation.retryCount++;
        if (operation.retry && operation.retryCount < operation.maxRetries) {
          failedOperations.push(operation);
          console.log(`Operation error, will retry: ${operation.id}`, error);
        } else {
          console.error(`Operation error, giving up: ${operation.id}`, error);
        }
      }
    }

    // 成功した操作をキューから削除
    this.operationQueue = this.operationQueue.filter(
      op => !successfulOperations.includes(op.id)
    );

    // 失敗した操作を更新
    failedOperations.forEach(failedOp => {
      const index = this.operationQueue.findIndex(op => op.id === failedOp.id);
      if (index > -1) {
        this.operationQueue[index] = failedOp;
      }
    });

    // ローカルストレージを更新
    this.saveQueueToStorage();

    this.syncInProgress = false;

    // 失敗した操作がある場合は再試行をスケジュール
    if (failedOperations.length > 0) {
      this.scheduleRetry();
    }

    console.log(`Sync completed. Success: ${successfulOperations.length}, Failed: ${failedOperations.length}`);
  }

  /**
   * 個別操作の実行
   * 
   * 学習ポイント:
   * - 操作タイプに応じた処理の分岐
   * - Amplify クライアントとの統合
   * - エラーハンドリングと結果の返却
   */
  private async executeOperation(operation: QueuedOperation): Promise<OperationResult> {
    try {
      const { getAmplifyClient } = await import('@/lib/amplify/client');
      const client = getAmplifyClient();

      switch (operation.type) {
        case 'CREATE_CONVERSATION':
          const createResult = await client.models.Conversation.create(operation.data);
          return {
            success: !!createResult.data,
            data: createResult.data,
            error: createResult.errors?.[0] ? new Error(createResult.errors[0].message) : undefined
          };

        case 'UPDATE_CONVERSATION':
          const updateResult = await client.models.Conversation.update(operation.data);
          return {
            success: !!updateResult.data,
            data: updateResult.data,
            error: updateResult.errors?.[0] ? new Error(updateResult.errors[0].message) : undefined
          };

        case 'DELETE_CONVERSATION':
          const deleteResult = await client.models.Conversation.delete({ id: operation.data.id });
          return {
            success: !!deleteResult.data,
            data: deleteResult.data,
            error: deleteResult.errors?.[0] ? new Error(deleteResult.errors[0].message) : undefined
          };

        case 'CREATE_MESSAGE':
          const createMsgResult = await client.models.Message.create(operation.data);
          return {
            success: !!createMsgResult.data,
            data: createMsgResult.data,
            error: createMsgResult.errors?.[0] ? new Error(createMsgResult.errors[0].message) : undefined
          };

        case 'UPDATE_MESSAGE':
          const updateMsgResult = await client.models.Message.update(operation.data);
          return {
            success: !!updateMsgResult.data,
            data: updateMsgResult.data,
            error: updateMsgResult.errors?.[0] ? new Error(updateMsgResult.errors[0].message) : undefined
          };

        case 'DELETE_MESSAGE':
          const deleteMsgResult = await client.models.Message.delete({ id: operation.data.id });
          return {
            success: !!deleteMsgResult.data,
            data: deleteMsgResult.data,
            error: deleteMsgResult.errors?.[0] ? new Error(deleteMsgResult.errors[0].message) : undefined
          };

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * リトライのスケジュール
   */
  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      if (this.isOnline() && this.operationQueue.length > 0) {
        this.syncQueuedOperations();
      }
    }, this.config.retryInterval);
  }

  /**
   * キューをローカルストレージに保存
   */
  private saveQueueToStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const serializedQueue = JSON.stringify(this.operationQueue);
      localStorage.setItem(this.config.storageKey, serializedQueue);
    } catch (error) {
      console.error('Failed to save queue to localStorage:', error);
    }
  }

  /**
   * ローカルストレージからキューを読み込み
   */
  private loadQueueFromStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const serializedQueue = localStorage.getItem(this.config.storageKey);
      if (serializedQueue) {
        this.operationQueue = JSON.parse(serializedQueue);
        console.log(`Loaded ${this.operationQueue.length} operations from localStorage`);
      }
    } catch (error) {
      console.error('Failed to load queue from localStorage:', error);
      this.operationQueue = [];
    }
  }

  /**
   * キューの状態を取得
   */
  public getQueueStatus(): {
    length: number;
    syncInProgress: boolean;
    operations: Array<{
      id: string;
      type: string;
      priority: string;
      retryCount: number;
      timestamp: number;
    }>;
  } {
    return {
      length: this.operationQueue.length,
      syncInProgress: this.syncInProgress,
      operations: this.operationQueue.map(op => ({
        id: op.id,
        type: op.type,
        priority: op.priority,
        retryCount: op.retryCount,
        timestamp: op.timestamp
      }))
    };
  }

  /**
   * キューをクリア
   */
  public clearQueue(): void {
    this.operationQueue = [];
    this.saveQueueToStorage();
    console.log('Operation queue cleared');
  }

  /**
   * 特定の操作をキューから削除
   */
  public removeOperation(operationId: string): boolean {
    const index = this.operationQueue.findIndex(op => op.id === operationId);
    if (index > -1) {
      this.operationQueue.splice(index, 1);
      this.saveQueueToStorage();
      console.log(`Operation removed from queue: ${operationId}`);
      return true;
    }
    return false;
  }

  /**
   * サービスの破棄
   */
  public destroy(): void {
    // イベントリスナーを削除
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));

    // タイマーをクリア
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    // コールバックをクリア
    this.networkChangeCallbacks = [];

    // キューを保存
    this.saveQueueToStorage();

    OfflineManager.instance = null;
    console.log('OfflineManager destroyed');
  }
}

/**
 * デフォルトインスタンスのエクスポート
 */
export const offlineManager = OfflineManager.getInstance();

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的なオフライン対応:
 * ```typescript
 * const offlineManager = OfflineManager.getInstance();
 * 
 * // ネットワーク状態の監視
 * const unsubscribe = offlineManager.onNetworkChange((isOnline, status) => {
 *   if (isOnline) {
 *     setNetworkStatus('オンライン');
 *     showSuccessMessage('接続が復旧しました');
 *   } else {
 *     setNetworkStatus('オフライン');
 *     showWarningMessage('オフラインモードで動作中');
 *   }
 * });
 * 
 * // クリーンアップ
 * useEffect(() => unsubscribe, []);
 * ```
 * 
 * 2. オフライン時の操作キューイング:
 * ```typescript
 * const handleCreateConversation = async (data) => {
 *   try {
 *     if (offlineManager.isOnline()) {
 *       // オンライン時は直接実行
 *       const result = await client.models.Conversation.create(data);
 *       return result;
 *     } else {
 *       // オフライン時はキューに追加
 *       const operationId = await offlineManager.queueOperation({
 *         type: 'CREATE_CONVERSATION',
 *         data,
 *         retry: true,
 *         priority: 'normal'
 *       });
 *       
 *       showInfoMessage('オフラインのため、接続復旧時に同期されます');
 *       return { queued: true, operationId };
 *     }
 *   } catch (error) {
 *     console.error('Failed to create conversation:', error);
 *     throw error;
 *   }
 * };
 * ```
 * 
 * 3. キューの状態監視:
 * ```typescript
 * const [queueStatus, setQueueStatus] = useState(offlineManager.getQueueStatus());
 * 
 * useEffect(() => {
 *   const interval = setInterval(() => {
 *     setQueueStatus(offlineManager.getQueueStatus());
 *   }, 1000);
 * 
 *   return () => clearInterval(interval);
 * }, []);
 * 
 * // UI表示
 * {queueStatus.length > 0 && (
 *   <div className="offline-queue-status">
 *     {queueStatus.syncInProgress ? '同期中...' : `${queueStatus.length}件の操作が待機中`}
 *   </div>
 * )}
 * ```
 */