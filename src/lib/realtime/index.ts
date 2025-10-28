/**
 * Real-time Functionality Index - リアルタイム機能の統合エクスポート
 * 
 * このファイルはリアルタイム機能に関連する全てのモジュールを統合し、
 * 一元的なAPIを提供します。GraphQL Subscriptions、オフライン対応、
 * 仮想スクロール、エラー復旧機能を含みます。
 * 
 * 目的:
 * - リアルタイム機能の一元管理
 * - 統合されたAPIの提供
 * - 依存関係の明確化
 * - 使いやすいインターフェースの提供
 * 
 * 設計理由:
 * - モジュール間の連携を促進
 * - インポートの簡素化
 * - 型安全性の確保
 * - 機能の発見しやすさ向上
 * 
 * 学習ポイント:
 * - モジュール設計のベストプラクティス
 * - TypeScript の re-export パターン
 * - 統合APIの設計方法
 * - 依存関係管理
 * 
 * 要件対応:
 * - 2.4: GraphQL Subscriptionsによるリアルタイム会話更新
 * - 2.5: 楽観的更新と実データ同期の統合
 * - 2.6: エラーハンドリングとオフライン対応の強化
 * - 5.4: パフォーマンス最適化（仮想スクロール等）
 * 
 * 使用例:
 * ```typescript
 * import {
 *   subscriptionManager,
 *   offlineManager,
 *   errorRecoveryManager,
 *   useVirtualScroll,
 *   useInfiniteScroll
 * } from '@/lib/realtime';
 * 
 * // 統合されたリアルタイム機能の使用
 * const MyComponent = () => {
 *   // サブスクリプション管理
 *   useEffect(() => {
 *     const subscriptionId = subscriptionManager.subscribeToConversations(userId, handlers);
 *     return () => subscriptionManager.unsubscribe(subscriptionId);
 *   }, []);
 * 
 *   // オフライン対応
 *   const handleCreate = async (data) => {
 *     if (offlineManager.isOnline()) {
 *       await createDirectly(data);
 *     } else {
 *       await offlineManager.queueOperation({ type: 'CREATE', data });
 *     }
 *   };
 * 
 *   // エラーハンドリング
 *   const handleError = async (error) => {
 *     const recovery = await errorRecoveryManager.handleError(error);
 *     if (!recovery.recovered) {
 *       showErrorMessage(recovery.userMessage);
 *     }
 *   };
 * 
 *   return <div>...</div>;
 * };
 * ```
 * 
 * 関連: 全てのリアルタイム機能モジュール
 */

// ===== Core Managers =====
export {
  SubscriptionManager,
  subscriptionManager,
  type SubscriptionStatus,
  type SubscriptionHandlers,
  type SubscriptionConfig
} from './subscription-manager';

export {
  OfflineManager,
  offlineManager,
  type NetworkStatus,
  type QueuedOperation,
  type OfflineConfig,
  type NetworkChangeCallback,
  type OperationResult
} from './offline-support';

export {
  ErrorRecoveryManager,
  errorRecoveryManager,
  ErrorType,
  ErrorSeverity,
  RecoveryStrategy,
  type ErrorInfo,
  type RecoveryOptions,
  type RecoveryResult
} from './error-recovery';

// ===== Virtual Scroll =====
export {
  useVirtualScroll,
  useInfiniteScroll,
  VirtualScrollContainer,
  VirtualScrollItem,
  type VirtualItem,
  type VirtualScrollConfig,
  type VirtualScrollResult,
  type ScrollToOptions,
  type InfiniteScrollConfig
} from './virtual-scroll';

// ===== Utility Functions =====

/**
 * リアルタイム機能の初期化
 * 
 * 学習ポイント:
 * - 全てのマネージャーの初期化
 * - 設定の統合管理
 * - エラーハンドリングの統合
 * - パフォーマンス監視の開始
 * 
 * @param config 統合設定
 */
export interface RealtimeConfig {
  subscription?: {
    autoReconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    enableLogging?: boolean;
  };
  offline?: {
    enableQueueing?: boolean;
    maxQueueSize?: number;
    maxRetries?: number;
    retryInterval?: number;
  };
  errorRecovery?: {
    enableAutoRecovery?: boolean;
    maxRecoveryAttempts?: number;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
  };
}

// 型のインポート
import { SubscriptionManager } from './subscription-manager';
import { OfflineManager } from './offline-support';
import { ErrorRecoveryManager } from './error-recovery';

export async function initializeRealtimeFeatures(config: RealtimeConfig = {}): Promise<{
  subscriptionManager: SubscriptionManager;
  offlineManager: OfflineManager;
  errorRecoveryManager: ErrorRecoveryManager;
  cleanup: () => void;
}> {
  console.log('🚀 Initializing real-time features...');

  // Subscription Manager の初期化
  const subManager = SubscriptionManager.getInstance(config.subscription);
  
  // Offline Manager の初期化
  const offManager = OfflineManager.getInstance(config.offline);
  
  // Error Recovery Manager の初期化
  const errManager = ErrorRecoveryManager.getInstance();

  // ネットワーク状態変更時の処理
  const networkChangeHandler = (isOnline: boolean) => {
    if (isOnline) {
      console.log('📶 Network restored - syncing queued operations');
      offManager.syncQueuedOperations();
    } else {
      console.log('📵 Network lost - switching to offline mode');
    }
  };

  const unsubscribeNetworkChange = offManager.onNetworkChange(networkChangeHandler);

  // クリーンアップ関数
  const cleanup = () => {
    console.log('🧹 Cleaning up real-time features...');
    unsubscribeNetworkChange();
    subManager.unsubscribeAll();
    offManager.destroy();
    errManager.destroy();
  };

  console.log('✅ Real-time features initialized successfully');

  return {
    subscriptionManager: subManager,
    offlineManager: offManager,
    errorRecoveryManager: errManager,
    cleanup
  };
}

/**
 * リアルタイム機能の統合状態取得
 * 
 * 学習ポイント:
 * - 全体的な状態の監視
 * - パフォーマンス指標の収集
 * - デバッグ情報の提供
 * - 運用監視データの生成
 */
export function getRealtimeStatus(): {
  subscription: {
    activeSubscriptions: number;
    connectionStatus: string;
    errors: number;
  };
  offline: {
    isOnline: boolean;
    queueLength: number;
    syncInProgress: boolean;
  };
  errorRecovery: {
    totalErrors: number;
    recentErrors: number;
    recoveryRate: number;
  };
} {
  const subManager = SubscriptionManager.getInstance();
  const offManager = OfflineManager.getInstance();
  const errManager = ErrorRecoveryManager.getInstance();

  const activeSubscriptions = subManager.getActiveSubscriptions();
  const queueStatus = offManager.getQueueStatus();
  const errorStats = errManager.getErrorStatistics();

  return {
    subscription: {
      activeSubscriptions: activeSubscriptions.length,
      connectionStatus: activeSubscriptions.length > 0 ? 'connected' : 'disconnected',
      errors: activeSubscriptions.filter((sub: any) => sub.status === 'error').length
    },
    offline: {
      isOnline: offManager.isOnline(),
      queueLength: queueStatus.length,
      syncInProgress: queueStatus.syncInProgress
    },
    errorRecovery: {
      totalErrors: errorStats.totalErrors,
      recentErrors: errorStats.recentErrors.length,
      recoveryRate: errorStats.totalErrors > 0 
        ? (errorStats.totalErrors - errorStats.recentErrors.length) / errorStats.totalErrors 
        : 1
    }
  };
}

/**
 * リアルタイム機能のヘルスチェック
 * 
 * 学習ポイント:
 * - システム全体の健全性確認
 * - 問題の早期発見
 * - 自動復旧の判定
 * - 監視システムとの連携
 */
export async function performRealtimeHealthCheck(): Promise<{
  healthy: boolean;
  issues: string[];
  recommendations: string[];
  metrics: Record<string, number>;
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const metrics: Record<string, number> = {};

  try {
    const status = getRealtimeStatus();
    
    // サブスクリプションの健全性チェック
    if (status.subscription.errors > 0) {
      issues.push(`${status.subscription.errors} subscription errors detected`);
      recommendations.push('Check network connectivity and subscription configuration');
    }
    
    metrics.subscriptionErrors = status.subscription.errors;
    metrics.activeSubscriptions = status.subscription.activeSubscriptions;

    // オフライン機能の健全性チェック
    if (status.offline.queueLength > 50) {
      issues.push(`Large offline queue detected (${status.offline.queueLength} items)`);
      recommendations.push('Check network connectivity and sync performance');
    }
    
    metrics.queueLength = status.offline.queueLength;
    metrics.isOnline = status.offline.isOnline ? 1 : 0;

    // エラー復旧の健全性チェック
    if (status.errorRecovery.recoveryRate < 0.8) {
      issues.push(`Low error recovery rate (${Math.round(status.errorRecovery.recoveryRate * 100)}%)`);
      recommendations.push('Review error patterns and recovery strategies');
    }
    
    metrics.errorRecoveryRate = status.errorRecovery.recoveryRate;
    metrics.totalErrors = status.errorRecovery.totalErrors;

    const healthy = issues.length === 0;

    return {
      healthy,
      issues,
      recommendations,
      metrics
    };

  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      healthy: false,
      issues: ['Health check execution failed'],
      recommendations: ['Check system configuration and restart services'],
      metrics: { healthCheckError: 1 }
    };
  }
}

/**
 * デバッグ用のリアルタイム機能情報出力
 * 
 * 学習ポイント:
 * - デバッグ情報の構造化
 * - 開発者向け情報の提供
 * - トラブルシューティング支援
 * - パフォーマンス分析データ
 */
export function debugRealtimeFeatures(): void {
  console.group('🔍 Real-time Features Debug Info');
  
  try {
    const status = getRealtimeStatus();
    
    console.group('📡 Subscription Manager');
    console.log('Active subscriptions:', status.subscription.activeSubscriptions);
    console.log('Connection status:', status.subscription.connectionStatus);
    console.log('Errors:', status.subscription.errors);
    console.groupEnd();
    
    console.group('📱 Offline Manager');
    console.log('Online status:', status.offline.isOnline);
    console.log('Queue length:', status.offline.queueLength);
    console.log('Sync in progress:', status.offline.syncInProgress);
    console.groupEnd();
    
    console.group('🔧 Error Recovery Manager');
    console.log('Total errors:', status.errorRecovery.totalErrors);
    console.log('Recent errors:', status.errorRecovery.recentErrors);
    console.log('Recovery rate:', `${Math.round(status.errorRecovery.recoveryRate * 100)}%`);
    console.groupEnd();
    
    // 詳細情報
    const subManager = SubscriptionManager.getInstance();
    const offManager = OfflineManager.getInstance();
    const errManager = ErrorRecoveryManager.getInstance();
    
    console.group('📊 Detailed Information');
    console.log('Subscription details:', subManager.getActiveSubscriptions());
    console.log('Queue details:', offManager.getQueueStatus());
    console.log('Error statistics:', errManager.getErrorStatistics());
    console.groupEnd();
    
  } catch (error) {
    console.error('Failed to generate debug info:', error);
  }
  
  console.groupEnd();
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. アプリケーション初期化時の設定:
 * ```typescript
 * // App.tsx または layout.tsx
 * import { initializeRealtimeFeatures } from '@/lib/realtime';
 * 
 * export default function App() {
 *   useEffect(() => {
 *     const initRealtime = async () => {
 *       const { cleanup } = await initializeRealtimeFeatures({
 *         subscription: {
 *           autoReconnect: true,
 *           reconnectInterval: 3000,
 *           enableLogging: process.env.NODE_ENV === 'development'
 *         },
 *         offline: {
 *           enableQueueing: true,
 *           maxQueueSize: 100
 *         },
 *         errorRecovery: {
 *           enableAutoRecovery: true,
 *           maxRecoveryAttempts: 3
 *         }
 *       });
 * 
 *       return cleanup;
 *     };
 * 
 *     const cleanupPromise = initRealtime();
 * 
 *     return () => {
 *       cleanupPromise.then(cleanup => cleanup());
 *     };
 *   }, []);
 * 
 *   return <div>...</div>;
 * }
 * ```
 * 
 * 2. 統合されたリアルタイム機能の使用:
 * ```typescript
 * import {
 *   subscriptionManager,
 *   offlineManager,
 *   errorRecoveryManager
 * } from '@/lib/realtime';
 * 
 * const useRealtimeConversations = (userId: string) => {
 *   const [conversations, setConversations] = useState([]);
 *   const [error, setError] = useState(null);
 * 
 *   useEffect(() => {
 *     const subscriptionId = subscriptionManager.subscribeToConversations(userId, {
 *       onCreate: (conversation) => {
 *         setConversations(prev => [conversation, ...prev]);
 *       },
 *       onError: async (error) => {
 *         const recovery = await errorRecoveryManager.handleError(error, {
 *           context: 'conversation-subscription',
 *           retryable: true
 *         });
 * 
 *         if (!recovery.recovered) {
 *           setError(recovery.userMessage);
 *         }
 *       }
 *     });
 * 
 *     return () => subscriptionManager.unsubscribe(subscriptionId);
 *   }, [userId]);
 * 
 *   const createConversation = async (data) => {
 *     try {
 *       if (offlineManager.isOnline()) {
 *         return await createConversationDirectly(data);
 *       } else {
 *         await offlineManager.queueOperation({
 *           type: 'CREATE_CONVERSATION',
 *           data,
 *           retry: true,
 *           priority: 'normal'
 *         });
 *         return { queued: true };
 *       }
 *     } catch (error) {
 *       const recovery = await errorRecoveryManager.handleError(error);
 *       if (!recovery.recovered) {
 *         throw new Error(recovery.userMessage);
 *       }
 *     }
 *   };
 * 
 *   return { conversations, error, createConversation };
 * };
 * ```
 * 
 * 3. 監視とデバッグ:
 * ```typescript
 * import { getRealtimeStatus, performRealtimeHealthCheck, debugRealtimeFeatures } from '@/lib/realtime';
 * 
 * const RealtimeMonitor = () => {
 *   const [status, setStatus] = useState(getRealtimeStatus());
 *   const [healthCheck, setHealthCheck] = useState(null);
 * 
 *   useEffect(() => {
 *     const interval = setInterval(() => {
 *       setStatus(getRealtimeStatus());
 *     }, 5000);
 * 
 *     return () => clearInterval(interval);
 *   }, []);
 * 
 *   const runHealthCheck = async () => {
 *     const result = await performRealtimeHealthCheck();
 *     setHealthCheck(result);
 *   };
 * 
 *   return (
 *     <div>
 *       <h3>Real-time Status</h3>
 *       <p>Subscriptions: {status.subscription.activeSubscriptions}</p>
 *       <p>Online: {status.offline.isOnline ? 'Yes' : 'No'}</p>
 *       <p>Queue: {status.offline.queueLength} items</p>
 *       
 *       <button onClick={runHealthCheck}>Run Health Check</button>
 *       <button onClick={debugRealtimeFeatures}>Debug Info</button>
 *       
 *       {healthCheck && (
 *         <div>
 *           <p>Health: {healthCheck.healthy ? '✅' : '❌'}</p>
 *           {healthCheck.issues.map(issue => (
 *             <p key={issue} style={{ color: 'red' }}>{issue}</p>
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */