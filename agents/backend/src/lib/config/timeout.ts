/**
 * Timeout Configuration Utility
 *
 * 環境変数からタイムアウト値を読み込み、デフォルト値でフォールバック
 * A2A設計の多層タイムアウト戦略に対応
 */

/**
 * タイムアウト設定の型定義
 */
export interface TimeoutConfig {
  /** Pythonプロセス監視タイムアウト（ミリ秒） */
  processTimeoutMs: number;
  /** 個別賢者タイムアウト（秒） */
  sageTimeoutSeconds: number;
  /** SOLOMON Judgeタイムアウト（秒） */
  solomonTimeoutSeconds: number;
  /** Python全体処理タイムアウト（秒） */
  totalTimeoutSeconds: number;
  /** イベントキュー取得タイムアウト（秒） */
  eventQueueTimeoutSeconds: number;
}

/**
 * デフォルトタイムアウト値
 * A2A設計における安全マージンを考慮した設定
 */
const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  processTimeoutMs: 210000,        // 210秒（3.5分）
  sageTimeoutSeconds: 90,          // 90秒（1.5分）
  solomonTimeoutSeconds: 60,       // 60秒（1分）
  totalTimeoutSeconds: 180,        // 180秒（3分）
  eventQueueTimeoutSeconds: 120,   // 120秒（2分）
};

/**
 * 環境変数から数値を安全に取得
 * 無効な値の場合はデフォルト値を返す
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed <= 0) {
    console.warn(`⚠️ Invalid timeout value for ${key}: ${value}. Using default: ${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}

/**
 * タイムアウト設定をロード
 * 環境変数から読み込み、無効な場合はデフォルト値を使用
 */
export function loadTimeoutConfig(): TimeoutConfig {
  const config: TimeoutConfig = {
    processTimeoutMs: getEnvNumber(
      'AGENTCORE_PROCESS_TIMEOUT_MS',
      DEFAULT_TIMEOUT_CONFIG.processTimeoutMs
    ),
    sageTimeoutSeconds: getEnvNumber(
      'MAGI_SAGE_TIMEOUT_SECONDS',
      DEFAULT_TIMEOUT_CONFIG.sageTimeoutSeconds
    ),
    solomonTimeoutSeconds: getEnvNumber(
      'MAGI_SOLOMON_TIMEOUT_SECONDS',
      DEFAULT_TIMEOUT_CONFIG.solomonTimeoutSeconds
    ),
    totalTimeoutSeconds: getEnvNumber(
      'MAGI_TOTAL_TIMEOUT_SECONDS',
      DEFAULT_TIMEOUT_CONFIG.totalTimeoutSeconds
    ),
    eventQueueTimeoutSeconds: getEnvNumber(
      'MAGI_EVENT_QUEUE_TIMEOUT_SECONDS',
      DEFAULT_TIMEOUT_CONFIG.eventQueueTimeoutSeconds
    ),
  };

  // バリデーション: タイムアウトの階層関係をチェック
  validateTimeoutHierarchy(config);

  return config;
}

/**
 * タイムアウト階層のバリデーション
 * 各レイヤーが適切な順序になっているか確認
 */
function validateTimeoutHierarchy(config: TimeoutConfig): void {
  const warnings: string[] = [];

  // Layer 4 (賢者) < Layer 3 (全体処理)
  if (config.sageTimeoutSeconds >= config.totalTimeoutSeconds) {
    warnings.push(
      `⚠️ MAGI_SAGE_TIMEOUT_SECONDS (${config.sageTimeoutSeconds}s) should be less than MAGI_TOTAL_TIMEOUT_SECONDS (${config.totalTimeoutSeconds}s)`
    );
  }

  // Layer 5 (SOLOMON) < Layer 3 (全体処理)
  if (config.solomonTimeoutSeconds >= config.totalTimeoutSeconds) {
    warnings.push(
      `⚠️ MAGI_SOLOMON_TIMEOUT_SECONDS (${config.solomonTimeoutSeconds}s) should be less than MAGI_TOTAL_TIMEOUT_SECONDS (${config.totalTimeoutSeconds}s)`
    );
  }

  // Layer 3 (全体処理) < Layer 2 (プロセス監視)
  const totalTimeoutMs = config.totalTimeoutSeconds * 1000;
  if (totalTimeoutMs >= config.processTimeoutMs) {
    warnings.push(
      `⚠️ MAGI_TOTAL_TIMEOUT_SECONDS (${config.totalTimeoutSeconds}s) should be less than AGENTCORE_PROCESS_TIMEOUT_MS (${config.processTimeoutMs}ms)`
    );
  }

  // 警告を出力
  if (warnings.length > 0) {
    console.warn('⚠️ Timeout configuration warnings:');
    warnings.forEach(warning => console.warn(warning));
    console.warn('These settings may cause unexpected timeout behavior.');
  }
}

/**
 * タイムアウト設定をログ出力
 * デバッグ・監視用
 */
export function logTimeoutConfig(config: TimeoutConfig): void {
  console.log('🕐 Timeout Configuration:');
  console.log(`  Layer 2 (Process):      ${config.processTimeoutMs}ms (${(config.processTimeoutMs / 1000).toFixed(1)}s)`);
  console.log(`  Layer 3 (Total):        ${config.totalTimeoutSeconds}s`);
  console.log(`  Layer 4 (Sage):         ${config.sageTimeoutSeconds}s`);
  console.log(`  Layer 5 (SOLOMON):      ${config.solomonTimeoutSeconds}s`);
  console.log(`  Event Queue:            ${config.eventQueueTimeoutSeconds}s`);
}

/**
 * グローバルなタイムアウト設定インスタンス
 * アプリケーション起動時に一度だけロード
 */
let globalTimeoutConfig: TimeoutConfig | null = null;

/**
 * グローバルなタイムアウト設定を取得
 * 初回呼び出し時にロードし、以降はキャッシュを返す
 */
export function getTimeoutConfig(): TimeoutConfig {
  if (!globalTimeoutConfig) {
    globalTimeoutConfig = loadTimeoutConfig();

    // デバッグモードで設定をログ出力
    if (process.env.DEBUG_STREAMING === 'true' || process.env.NODE_ENV === 'development') {
      logTimeoutConfig(globalTimeoutConfig);
    }
  }

  return globalTimeoutConfig;
}

/**
 * Python環境変数としてエクスポート
 * Pythonプロセス起動時に渡す環境変数オブジェクトを生成
 */
export function exportPythonEnv(config: TimeoutConfig): Record<string, string> {
  return {
    MAGI_SAGE_TIMEOUT_SECONDS: config.sageTimeoutSeconds.toString(),
    MAGI_SOLOMON_TIMEOUT_SECONDS: config.solomonTimeoutSeconds.toString(),
    MAGI_TOTAL_TIMEOUT_SECONDS: config.totalTimeoutSeconds.toString(),
    MAGI_EVENT_QUEUE_TIMEOUT_SECONDS: config.eventQueueTimeoutSeconds.toString(),
  };
}
