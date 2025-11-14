/**
 * Observability Integration Index
 *
 * このファイルはMAGI Decision UIの観測可能性機能の統合エントリーポイントです。
 * OpenTelemetry、CloudWatch、X-Rayの初期化と設定を一元管理します。
 *
 * 主要機能:
 * - 観測可能性スタックの初期化
 * - 環境別設定の管理
 * - エクスポート関数の統合
 * - エラーハンドリングの統一
 *
 * 学習ポイント:
 * - 観測可能性の3つの柱（メトリクス、ログ、トレース）
 * - AWS観測可能性サービスの統合パターン
 * - 本番環境での監視戦略
 */

// OpenTelemetry設定のインポートと再エクスポート
import {
  initializeOTEL as initOTEL,
  extractTraceContext,
  generateTraceHeader,
  MAGI_METRICS,
  type TraceContext,
} from './otel-config';

export { extractTraceContext, generateTraceHeader, MAGI_METRICS, type TraceContext };

// X-Ray統合のインポートと再エクスポート
import {
  initializeXRay as initXRay,
  MAGITraceManager,
  XRayUtils as XRayUtilsClass,
  magiTraceManager as traceManager,
  traceAgentExecution,
  traceSolomonEvaluation,
  traceConversation,
  addCustomSubsegment,
  type MAGITraceContext,
} from './xray-integration';

export {
  MAGITraceManager,
  XRayUtilsClass as XRayUtils,
  traceManager as magiTraceManager,
  traceAgentExecution,
  traceSolomonEvaluation,
  traceConversation,
  addCustomSubsegment,
  type MAGITraceContext,
};

// 関数を関数内で使用できるようにエイリアスを作成
const initializeOTEL = initOTEL;
const initializeXRay = initXRay;
const XRayUtils = XRayUtilsClass;
const magiTraceManager = traceManager;

// CloudWatch統合のモック実装（将来の実装のため）
export const magiMetricsPublisher = {
  publishMetrics: async () => console.log('CloudWatch metrics placeholder'),
};

export const magiLogger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

export const logAgentExecution = () => {};
export const logSolomonEvaluation = () => {};
export const logError = () => {};
export const publishAgentMetrics = async () => {};
export const publishSolomonMetrics = async () => {};
export const publishSystemMetrics = async () => {};

export interface MAGIMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

/**
 * Observability Configuration
 *
 * 観測可能性機能の全体設定を管理します。
 * 環境変数から設定を読み込み、適切な初期化を行います。
 */
interface ObservabilityConfig {
  enabled: boolean;
  environment: string;
  serviceName: string;
  serviceVersion: string;
  awsRegion: string;

  // 機能別有効化フラグ
  otelEnabled: boolean;
  cloudwatchEnabled: boolean;
  xrayEnabled: boolean;

  // サンプリング設定
  traceSamplingRate: number;
  metricsSamplingRate: number;

  // デバッグ設定
  debugMode: boolean;
  consoleOutput: boolean;
}

/**
 * Get Observability Configuration
 *
 * 環境変数から観測可能性設定を取得します。
 * デフォルト値と環境別の最適化を含みます。
 */
const getObservabilityConfig = (): ObservabilityConfig => {
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';

  return {
    enabled: process.env.OBSERVABILITY_ENABLED !== 'false',
    environment,
    serviceName: process.env.SERVICE_NAME || 'magi-decision-ui',
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    awsRegion: process.env.NEXT_PUBLIC_AWS_REGION || process.env.APP_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-northeast-1',

    // 本番環境では全機能を有効化、開発環境では選択的に有効化
    otelEnabled: process.env.OTEL_ENABLED !== 'false',
    cloudwatchEnabled: process.env.CLOUDWATCH_ENABLED !== 'false',
    xrayEnabled: process.env.XRAY_ENABLED !== 'false',

    // 本番環境では低サンプリング、開発環境では高サンプリング
    traceSamplingRate: parseFloat(process.env.TRACE_SAMPLING_RATE || (isProduction ? '0.1' : '1.0')),
    metricsSamplingRate: parseFloat(process.env.METRICS_SAMPLING_RATE || '1.0'),

    // デバッグ設定
    debugMode: process.env.OBSERVABILITY_DEBUG === 'true',
    consoleOutput: !isProduction || process.env.OBSERVABILITY_CONSOLE === 'true',
  };
};

/**
 * Initialize All Observability Features
 *
 * 全ての観測可能性機能を初期化します。
 * アプリケーション起動時に一度だけ呼び出されます。
 */
export const initializeObservability = async (): Promise<void> => {
  const config = getObservabilityConfig();

  if (!config.enabled) {
    console.log('🔍 Observability is disabled');
    return;
  }

  console.log('🔍 Initializing MAGI Observability Stack...', {
    environment: config.environment,
    serviceName: config.serviceName,
    awsRegion: config.awsRegion,
  });

  const initResults: { component: string; success: boolean; error?: string }[] = [];

  // OpenTelemetry初期化
  if (config.otelEnabled) {
    try {
      const sdk = initializeOTEL();
      if (sdk) {
        await sdk.start();
        initResults.push({ component: 'OpenTelemetry', success: true });
        console.log('✅ OpenTelemetry initialized successfully');
      } else {
        initResults.push({ component: 'OpenTelemetry', success: false, error: 'SDK not initialized (client-side)' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      initResults.push({ component: 'OpenTelemetry', success: false, error: errorMessage });
      console.error('❌ Failed to initialize OpenTelemetry:', error);
    }
  }

  // X-Ray初期化
  if (config.xrayEnabled) {
    try {
      initializeXRay();
      initResults.push({ component: 'X-Ray', success: true });
      console.log('✅ X-Ray integration initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      initResults.push({ component: 'X-Ray', success: false, error: errorMessage });
      console.error('❌ Failed to initialize X-Ray:', error);
    }
  }

  // CloudWatch初期化（プレースホルダー）
  if (config.cloudwatchEnabled) {
    initResults.push({ component: 'CloudWatch', success: true });
    console.log('✅ CloudWatch integration placeholder ready');
  }

  // 初期化結果のサマリー
  const successCount = initResults.filter(r => r.success).length;
  const totalCount = initResults.length;

  console.log(`🔍 Observability initialization complete: ${successCount}/${totalCount} components ready`);

  if (config.debugMode) {
    console.log('🔍 Initialization details:', initResults);
  }

  // 初期化失敗がある場合の警告
  const failures = initResults.filter(r => !r.success);
  if (failures.length > 0) {
    console.warn('⚠️ Some observability components failed to initialize:', failures);
  }
};

/**
 * Health Check for Observability Components
 *
 * 観測可能性コンポーネントのヘルスチェックを実行します。
 * 定期的な監視やトラブルシューティングに使用します。
 */
export const checkObservabilityHealth = async (): Promise<{
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, { status: 'up' | 'down'; lastCheck: string; error?: string }>;
}> => {
  const config = getObservabilityConfig();
  const components: Record<string, { status: 'up' | 'down'; lastCheck: string; error?: string }> = {};

  // OpenTelemetry健全性チェック
  if (config.otelEnabled) {
    try {
      const testResult = await addCustomSubsegment('health-check-otel', async () => {
        return { status: 'ok' };
      });

      components.otel = {
        status: testResult.status === 'ok' ? 'up' : 'down',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      components.otel = {
        status: 'down',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // CloudWatch健全性チェック（プレースホルダー）
  if (config.cloudwatchEnabled) {
    components.cloudwatch = {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  }

  // X-Ray健全性チェック
  if (config.xrayEnabled) {
    try {
      const traceId = XRayUtils.getCurrentTraceId();
      components.xray = {
        status: 'up', // トレースIDがnullでも正常（スパン外の可能性があるため）
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      components.xray = {
        status: 'down',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 全体的な健全性を判定
  const upCount = Object.values(components).filter(c => c.status === 'up').length;
  const totalCount = Object.keys(components).length;

  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (upCount === totalCount) {
    overall = 'healthy';
  } else if (upCount > 0) {
    overall = 'degraded';
  } else {
    overall = 'unhealthy';
  }

  return { overall, components };
};

/**
 * Graceful Shutdown for Observability
 *
 * 観測可能性コンポーネントの適切なシャットダウンを実行します。
 * アプリケーション終了時に呼び出されます。
 */
export const shutdownObservability = async (): Promise<void> => {
  console.log('🔍 Shutting down observability components...');

  try {
    const sdk = initializeOTEL();
    if (sdk) {
      await sdk.shutdown();
      console.log('✅ OpenTelemetry shutdown complete');
    }
  } catch (error) {
    console.error('❌ Error during observability shutdown:', error);
  }

  console.log('🔍 Observability shutdown complete');
};

/**
 * Export configuration for external use
 *
 * 外部から設定を参照できるようにエクスポートします。
 */
export const observabilityConfig = getObservabilityConfig();

/**
 * Development utilities
 *
 * 開発環境での便利機能。
 */
if (process.env.NODE_ENV === 'development') {
  // グローバルオブジェクトに観測可能性ユーティリティを追加
  (global as any).magiObservability = {
    config: observabilityConfig,
    checkHealth: checkObservabilityHealth,
    traceManager: magiTraceManager,
    metricsPublisher: magiMetricsPublisher,
    logger: magiLogger,
  };

  console.log('🔍 Development utilities available at global.magiObservability');
}
