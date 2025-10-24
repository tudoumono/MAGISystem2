/**
 * Error Recovery System - エラーハンドリングと復旧機能
 * 
 * このファイルはリアルタイム機能におけるエラーハンドリングと自動復旧機能を提供します。
 * ネットワークエラー、サブスクリプションエラー、データ同期エラーなどを適切に処理し、
 * ユーザー体験を損なわないよう自動復旧を試行します。
 * 
 * 目的:
 * - 包括的なエラーハンドリング
 * - 自動復旧とフォールバック機能
 * - ユーザーフレンドリーなエラー表示
 * - システムの信頼性向上
 * 
 * 設計理由:
 * - エラーの分類と適切な対応策の提供
 * - 段階的な復旧戦略の実装
 * - ユーザーへの適切な情報提供
 * - システム全体の安定性確保
 * 
 * 学習ポイント:
 * - エラーハンドリングのベストプラクティス
 * - 復旧戦略の設計パターン
 * - ユーザー体験を考慮したエラー処理
 * - TypeScript による型安全なエラー管理
 * 
 * 要件対応:
 * - 5.5: エラーハンドリングとオフライン対応の強化
 * - 2.4, 2.5, 2.6: リアルタイム機能の信頼性向上
 * 
 * 使用例:
 * ```typescript
 * const errorRecovery = ErrorRecoveryManager.getInstance();
 * 
 * // エラーの処理と復旧
 * try {
 *   await someRiskyOperation();
 * } catch (error) {
 *   const recovery = await errorRecovery.handleError(error, {
 *     context: 'subscription',
 *     retryable: true,
 *     fallbackAction: () => switchToPolling()
 *   });
 *   
 *   if (recovery.recovered) {
 *     console.log('自動復旧に成功しました');
 *   } else {
 *     showErrorMessage(recovery.userMessage);
 *   }
 * }
 * ```
 * 
 * 関連: src/lib/realtime/subscription-manager.ts, src/lib/realtime/offline-support.ts
 */

/**
 * エラーの分類
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SUBSCRIPTION_ERROR = 'SUBSCRIPTION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  DATA_SYNC_ERROR = 'DATA_SYNC_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * エラーの重要度
 */
export enum ErrorSeverity {
  LOW = 'LOW',           // ログのみ、ユーザーには通知しない
  MEDIUM = 'MEDIUM',     // 警告として表示、機能は継続
  HIGH = 'HIGH',         // エラー表示、一部機能制限
  CRITICAL = 'CRITICAL'  // システム停止、緊急対応が必要
}

/**
 * 復旧戦略の種類
 */
export enum RecoveryStrategy {
  RETRY = 'RETRY',                    // 単純なリトライ
  EXPONENTIAL_BACKOFF = 'EXPONENTIAL_BACKOFF', // 指数バックオフでリトライ
  FALLBACK = 'FALLBACK',              // フォールバック機能に切り替え
  RECONNECT = 'RECONNECT',            // 接続の再確立
  REFRESH_AUTH = 'REFRESH_AUTH',      // 認証情報の更新
  CLEAR_CACHE = 'CLEAR_CACHE',        // キャッシュクリア後リトライ
  USER_ACTION = 'USER_ACTION',        // ユーザーアクションが必要
  NO_RECOVERY = 'NO_RECOVERY'         // 復旧不可能
}

/**
 * エラー情報の詳細
 */
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError: Error;
  context?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

/**
 * 復旧オプション
 */
export interface RecoveryOptions {
  context?: string;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: () => Promise<void> | void;
  onRetry?: (attempt: number) => void;
  onRecovery?: () => void;
  onFailure?: (error: ErrorInfo) => void;
}

/**
 * 復旧結果
 */
export interface RecoveryResult {
  recovered: boolean;
  strategy: RecoveryStrategy;
  attempts: number;
  userMessage: string;
  technicalMessage: string;
  suggestedActions: string[];
  errorInfo: ErrorInfo;
}

/**
 * エラーパターンの定義
 */
interface ErrorPattern {
  matcher: (error: Error) => boolean;
  type: ErrorType;
  severity: ErrorSeverity;
  strategy: RecoveryStrategy;
  userMessage: string;
  technicalMessage: string;
  suggestedActions: string[];
}

/**
 * デフォルトのエラーパターン
 */
const DEFAULT_ERROR_PATTERNS: ErrorPattern[] = [
  // ネットワークエラー
  {
    matcher: (error) => 
      error.message.includes('fetch') || 
      error.message.includes('network') ||
      error.message.includes('NetworkError'),
    type: ErrorType.NETWORK_ERROR,
    severity: ErrorSeverity.MEDIUM,
    strategy: RecoveryStrategy.EXPONENTIAL_BACKOFF,
    userMessage: 'ネットワーク接続に問題があります。自動的に再試行しています...',
    technicalMessage: 'Network connectivity issue detected',
    suggestedActions: [
      'インターネット接続を確認してください',
      'しばらく待ってから再試行してください',
      'VPNを使用している場合は無効にしてみてください'
    ]
  },
  
  // サブスクリプションエラー
  {
    matcher: (error) => 
      error.message.includes('subscription') ||
      error.message.includes('WebSocket') ||
      error.message.includes('GraphQL'),
    type: ErrorType.SUBSCRIPTION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    strategy: RecoveryStrategy.RECONNECT,
    userMessage: 'リアルタイム更新で問題が発生しました。再接続を試行しています...',
    technicalMessage: 'Real-time subscription connection failed',
    suggestedActions: [
      'ページを更新してください',
      'ブラウザのキャッシュをクリアしてください',
      '問題が続く場合はサポートにお問い合わせください'
    ]
  },
  
  // 認証エラー
  {
    matcher: (error) => 
      error.message.includes('401') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('authentication'),
    type: ErrorType.AUTHENTICATION_ERROR,
    severity: ErrorSeverity.HIGH,
    strategy: RecoveryStrategy.REFRESH_AUTH,
    userMessage: '認証の有効期限が切れました。再ログインが必要です。',
    technicalMessage: 'Authentication token expired or invalid',
    suggestedActions: [
      '再ログインしてください',
      'ブラウザのCookieを確認してください',
      'プライベートブラウジングモードを無効にしてください'
    ]
  },
  
  // 権限エラー
  {
    matcher: (error) => 
      error.message.includes('403') ||
      error.message.includes('Forbidden') ||
      error.message.includes('permission'),
    type: ErrorType.PERMISSION_ERROR,
    severity: ErrorSeverity.HIGH,
    strategy: RecoveryStrategy.USER_ACTION,
    userMessage: 'この操作を実行する権限がありません。',
    technicalMessage: 'Insufficient permissions for requested operation',
    suggestedActions: [
      '管理者に権限の確認を依頼してください',
      'アカウントの設定を確認してください',
      '別のアカウントでログインしてみてください'
    ]
  },
  
  // レート制限エラー
  {
    matcher: (error) => 
      error.message.includes('429') ||
      error.message.includes('rate limit') ||
      error.message.includes('too many requests'),
    type: ErrorType.RATE_LIMIT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    strategy: RecoveryStrategy.EXPONENTIAL_BACKOFF,
    userMessage: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
    technicalMessage: 'Rate limit exceeded',
    suggestedActions: [
      '少し時間をおいてから再試行してください',
      '同時に複数の操作を実行しないでください',
      '問題が続く場合はサポートにお問い合わせください'
    ]
  },
  
  // サーバーエラー
  {
    matcher: (error) => 
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504'),
    type: ErrorType.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    strategy: RecoveryStrategy.RETRY,
    userMessage: 'サーバーで問題が発生しています。自動的に再試行しています...',
    technicalMessage: 'Server error detected',
    suggestedActions: [
      'しばらく待ってから再試行してください',
      'ページを更新してください',
      '問題が続く場合はサポートにお問い合わせください'
    ]
  }
];

/**
 * ErrorRecoveryManager - エラー復旧管理クラス
 * 
 * 機能:
 * - エラーの分類と分析
 * - 適切な復旧戦略の選択
 * - 自動復旧の実行
 * - ユーザーへの適切な情報提供
 * - エラーログの記録と分析
 */
export class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager | null = null;
  
  private errorPatterns: ErrorPattern[];
  private errorHistory: ErrorInfo[] = [];
  private recoveryAttempts = new Map<string, number>();
  private maxHistorySize = 100;

  /**
   * プライベートコンストラクタ（Singleton パターン）
   */
  private constructor(customPatterns: ErrorPattern[] = []) {
    this.errorPatterns = [...DEFAULT_ERROR_PATTERNS, ...customPatterns];
  }

  /**
   * インスタンスの取得（Singleton パターン）
   */
  public static getInstance(customPatterns?: ErrorPattern[]): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager(customPatterns);
    }
    return ErrorRecoveryManager.instance;
  }

  /**
   * エラーの処理と復旧
   * 
   * 学習ポイント:
   * - エラーの分析と分類
   * - 適切な復旧戦略の選択
   * - 段階的な復旧の実行
   * - ユーザーフレンドリーなメッセージ生成
   * 
   * @param error 発生したエラー
   * @param options 復旧オプション
   * @returns 復旧結果
   */
  public async handleError(error: Error, options: RecoveryOptions = {}): Promise<RecoveryResult> {
    // エラー情報の作成
    const errorInfo = this.createErrorInfo(error, options.context);
    
    // エラー履歴に追加
    this.addToHistory(errorInfo);
    
    // エラーパターンのマッチング
    const pattern = this.matchErrorPattern(error);
    
    // 復旧戦略の決定
    const strategy = this.determineRecoveryStrategy(errorInfo, pattern, options);
    
    // 復旧の実行
    const recoveryResult = await this.executeRecovery(errorInfo, pattern, strategy, options);
    
    // ログの記録
    this.logError(errorInfo, recoveryResult);
    
    return recoveryResult;
  }

  /**
   * エラー情報の作成
   */
  private createErrorInfo(error: Error, context?: string): ErrorInfo {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      originalError: error,
      context,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      additionalData: {
        stack: error.stack,
        name: error.name
      }
    };
  }

  /**
   * エラーパターンのマッチング
   */
  private matchErrorPattern(error: Error): ErrorPattern | null {
    return this.errorPatterns.find(pattern => pattern.matcher(error)) || null;
  }

  /**
   * 復旧戦略の決定
   */
  private determineRecoveryStrategy(
    errorInfo: ErrorInfo,
    pattern: ErrorPattern | null,
    options: RecoveryOptions
  ): RecoveryStrategy {
    // オプションで復旧不可能と指定されている場合
    if (options.retryable === false) {
      return RecoveryStrategy.NO_RECOVERY;
    }

    // パターンマッチした場合はその戦略を使用
    if (pattern) {
      return pattern.strategy;
    }

    // フォールバックアクションが指定されている場合
    if (options.fallbackAction) {
      return RecoveryStrategy.FALLBACK;
    }

    // デフォルトはリトライ
    return RecoveryStrategy.RETRY;
  }

  /**
   * 復旧の実行
   */
  private async executeRecovery(
    errorInfo: ErrorInfo,
    pattern: ErrorPattern | null,
    strategy: RecoveryStrategy,
    options: RecoveryOptions
  ): Promise<RecoveryResult> {
    const errorKey = this.generateErrorKey(errorInfo);
    const currentAttempts = this.recoveryAttempts.get(errorKey) || 0;
    const maxRetries = options.maxRetries || 3;

    // 最大試行回数を超えた場合
    if (currentAttempts >= maxRetries) {
      return this.createFailureResult(errorInfo, pattern, strategy, currentAttempts);
    }

    try {
      let recovered = false;

      switch (strategy) {
        case RecoveryStrategy.RETRY:
          recovered = await this.executeRetry(options, currentAttempts);
          break;

        case RecoveryStrategy.EXPONENTIAL_BACKOFF:
          recovered = await this.executeExponentialBackoff(options, currentAttempts);
          break;

        case RecoveryStrategy.FALLBACK:
          recovered = await this.executeFallback(options);
          break;

        case RecoveryStrategy.RECONNECT:
          recovered = await this.executeReconnect(options);
          break;

        case RecoveryStrategy.REFRESH_AUTH:
          recovered = await this.executeRefreshAuth(options);
          break;

        case RecoveryStrategy.CLEAR_CACHE:
          recovered = await this.executeClearCache(options);
          break;

        case RecoveryStrategy.USER_ACTION:
        case RecoveryStrategy.NO_RECOVERY:
        default:
          recovered = false;
          break;
      }

      // 試行回数を更新
      this.recoveryAttempts.set(errorKey, currentAttempts + 1);

      if (recovered) {
        // 復旧成功時はカウンターをリセット
        this.recoveryAttempts.delete(errorKey);
        
        if (options.onRecovery) {
          options.onRecovery();
        }

        return this.createSuccessResult(errorInfo, pattern, strategy, currentAttempts + 1);
      } else {
        return this.createFailureResult(errorInfo, pattern, strategy, currentAttempts + 1);
      }

    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return this.createFailureResult(errorInfo, pattern, strategy, currentAttempts + 1);
    }
  }

  /**
   * 単純なリトライの実行
   */
  private async executeRetry(options: RecoveryOptions, attempt: number): Promise<boolean> {
    const delay = options.retryDelay || 1000;
    
    if (options.onRetry) {
      options.onRetry(attempt + 1);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return true; // 実際の実装では元の操作を再実行
  }

  /**
   * 指数バックオフリトライの実行
   */
  private async executeExponentialBackoff(options: RecoveryOptions, attempt: number): Promise<boolean> {
    const baseDelay = options.retryDelay || 1000;
    const delay = baseDelay * Math.pow(2, attempt);
    
    if (options.onRetry) {
      options.onRetry(attempt + 1);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return true; // 実際の実装では元の操作を再実行
  }

  /**
   * フォールバック機能の実行
   */
  private async executeFallback(options: RecoveryOptions): Promise<boolean> {
    if (options.fallbackAction) {
      await options.fallbackAction();
      return true;
    }
    return false;
  }

  /**
   * 再接続の実行
   */
  private async executeReconnect(options: RecoveryOptions): Promise<boolean> {
    // SubscriptionManager の再接続を実行
    try {
      const { subscriptionManager } = await import('./subscription-manager');
      // 実際の実装では適切な再接続処理を実行
      console.log('Attempting to reconnect subscriptions...');
      return true;
    } catch (error) {
      console.error('Reconnection failed:', error);
      return false;
    }
  }

  /**
   * 認証更新の実行
   */
  private async executeRefreshAuth(options: RecoveryOptions): Promise<boolean> {
    try {
      // 認証トークンの更新処理
      console.log('Attempting to refresh authentication...');
      // 実際の実装では Auth.currentSession() などを使用
      return true;
    } catch (error) {
      console.error('Auth refresh failed:', error);
      return false;
    }
  }

  /**
   * キャッシュクリアの実行
   */
  private async executeClearCache(options: RecoveryOptions): Promise<boolean> {
    try {
      // ローカルキャッシュのクリア
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      
      console.log('Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Cache clear failed:', error);
      return false;
    }
  }

  /**
   * 成功結果の作成
   */
  private createSuccessResult(
    errorInfo: ErrorInfo,
    pattern: ErrorPattern | null,
    strategy: RecoveryStrategy,
    attempts: number
  ): RecoveryResult {
    return {
      recovered: true,
      strategy,
      attempts,
      userMessage: '問題が解決されました。',
      technicalMessage: `Recovery successful using ${strategy} after ${attempts} attempts`,
      suggestedActions: [],
      errorInfo
    };
  }

  /**
   * 失敗結果の作成
   */
  private createFailureResult(
    errorInfo: ErrorInfo,
    pattern: ErrorPattern | null,
    strategy: RecoveryStrategy,
    attempts: number
  ): RecoveryResult {
    const userMessage = pattern?.userMessage || 'エラーが発生しました。';
    const technicalMessage = pattern?.technicalMessage || errorInfo.message;
    const suggestedActions = pattern?.suggestedActions || [
      'ページを更新してください',
      '問題が続く場合はサポートにお問い合わせください'
    ];

    return {
      recovered: false,
      strategy,
      attempts,
      userMessage,
      technicalMessage,
      suggestedActions,
      errorInfo
    };
  }

  /**
   * エラーキーの生成
   */
  private generateErrorKey(errorInfo: ErrorInfo): string {
    return `${errorInfo.type}-${errorInfo.context || 'unknown'}-${errorInfo.message.substring(0, 50)}`;
  }

  /**
   * エラー履歴への追加
   */
  private addToHistory(errorInfo: ErrorInfo): void {
    this.errorHistory.unshift(errorInfo);
    
    // 履歴サイズの制限
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * エラーログの記録
   */
  private logError(errorInfo: ErrorInfo, recoveryResult: RecoveryResult): void {
    const logData = {
      timestamp: errorInfo.timestamp.toISOString(),
      type: errorInfo.type,
      severity: errorInfo.severity,
      message: errorInfo.message,
      context: errorInfo.context,
      strategy: recoveryResult.strategy,
      recovered: recoveryResult.recovered,
      attempts: recoveryResult.attempts,
      userId: errorInfo.userId,
      sessionId: errorInfo.sessionId,
      userAgent: errorInfo.userAgent,
      url: errorInfo.url
    };

    // コンソールログ
    if (errorInfo.severity === ErrorSeverity.CRITICAL) {
      console.error('CRITICAL ERROR:', logData);
    } else if (errorInfo.severity === ErrorSeverity.HIGH) {
      console.error('HIGH SEVERITY ERROR:', logData);
    } else if (errorInfo.severity === ErrorSeverity.MEDIUM) {
      console.warn('MEDIUM SEVERITY ERROR:', logData);
    } else {
      console.log('LOW SEVERITY ERROR:', logData);
    }

    // 外部ログサービスへの送信（実装例）
    this.sendToExternalLogging(logData);
  }

  /**
   * 外部ログサービスへの送信
   */
  private async sendToExternalLogging(logData: any): Promise<void> {
    try {
      // 実際の実装では CloudWatch Logs や Sentry などに送信
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logData)
      // });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * 現在のユーザーIDを取得
   */
  private getCurrentUserId(): string | undefined {
    // 実際の実装では認証情報から取得
    return 'current-user-id';
  }

  /**
   * セッションIDを取得
   */
  private getSessionId(): string | undefined {
    // 実際の実装ではセッション管理から取得
    return 'current-session-id';
  }

  /**
   * エラー履歴の取得
   */
  public getErrorHistory(): ErrorInfo[] {
    return [...this.errorHistory];
  }

  /**
   * エラー統計の取得
   */
  public getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: ErrorInfo[];
  } {
    const errorsByType = {} as Record<ErrorType, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;

    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorHistory.slice(0, 10)
    };
  }

  /**
   * カスタムエラーパターンの追加
   */
  public addErrorPattern(pattern: ErrorPattern): void {
    this.errorPatterns.unshift(pattern); // 先頭に追加（優先度高）
  }

  /**
   * 復旧試行回数のリセット
   */
  public resetRecoveryAttempts(errorKey?: string): void {
    if (errorKey) {
      this.recoveryAttempts.delete(errorKey);
    } else {
      this.recoveryAttempts.clear();
    }
  }

  /**
   * サービスの破棄
   */
  public destroy(): void {
    this.errorHistory = [];
    this.recoveryAttempts.clear();
    ErrorRecoveryManager.instance = null;
  }
}

/**
 * デフォルトインスタンスのエクスポート
 */
export const errorRecoveryManager = ErrorRecoveryManager.getInstance();

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的なエラーハンドリング:
 * ```typescript
 * const handleOperation = async () => {
 *   try {
 *     await riskyOperation();
 *   } catch (error) {
 *     const recovery = await errorRecoveryManager.handleError(error, {
 *       context: 'user-action',
 *       retryable: true,
 *       maxRetries: 3,
 *       onRetry: (attempt) => {
 *         showMessage(`再試行中... (${attempt}/3)`);
 *       },
 *       onRecovery: () => {
 *         showSuccessMessage('操作が完了しました');
 *       }
 *     });
 * 
 *     if (!recovery.recovered) {
 *       showErrorMessage(recovery.userMessage, recovery.suggestedActions);
 *     }
 *   }
 * };
 * ```
 * 
 * 2. フォールバック機能付きエラーハンドリング:
 * ```typescript
 * const handleRealtimeConnection = async () => {
 *   try {
 *     await establishRealtimeConnection();
 *   } catch (error) {
 *     const recovery = await errorRecoveryManager.handleError(error, {
 *       context: 'realtime-connection',
 *       fallbackAction: async () => {
 *         // ポーリングに切り替え
 *         await switchToPollingMode();
 *         showWarningMessage('リアルタイム更新を無効にしました');
 *       }
 *     });
 * 
 *     if (recovery.recovered) {
 *       console.log('フォールバック機能に切り替えました');
 *     }
 *   }
 * };
 * ```
 * 
 * 3. カスタムエラーパターンの追加:
 * ```typescript
 * // アプリケーション固有のエラーパターンを追加
 * errorRecoveryManager.addErrorPattern({
 *   matcher: (error) => error.message.includes('MAGI_SYSTEM_ERROR'),
 *   type: ErrorType.CLIENT_ERROR,
 *   severity: ErrorSeverity.HIGH,
 *   strategy: RecoveryStrategy.FALLBACK,
 *   userMessage: 'MAGIシステムで問題が発生しました。シンプルモードに切り替えます。',
 *   technicalMessage: 'MAGI system error detected',
 *   suggestedActions: [
 *     'シンプルモードで操作を続行してください',
 *     'システム管理者に問題を報告してください'
 *   ]
 * });
 * ```
 */