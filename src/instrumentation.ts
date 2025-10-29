/**
 * Next.js Instrumentation for MAGI Decision UI
 * 
 * このファイルはNext.js 15のinstrumentation機能を使用して、
 * アプリケーション起動時にOpenTelemetryとAWS観測可能性スタックを初期化します。
 * 
 * 重要: このファイルはプロジェクトルートに配置する必要があります。
 * Next.jsが自動的に検出し、サーバー起動時に実行されます。
 * 
 * 学習ポイント:
 * - Next.js instrumentationの仕組み
 * - サーバーサイドでの観測可能性初期化
 * - AWS観測可能性サービスの統合パターン
 */

/**
 * Register function - Next.js instrumentation entry point
 * 
 * Next.jsアプリケーションの起動時に自動的に呼び出されます。
 * OpenTelemetry、X-Ray、CloudWatchの初期化を行います。
 */
export async function register() {
  // サーバーサイドでのみ実行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing MAGI Decision UI instrumentation...');
    
    try {
      // 観測可能性スタックの初期化
      const { initializeObservability } = await import('./lib/observability');
      await initializeObservability();
      
      console.log('✅ MAGI instrumentation initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MAGI instrumentation:', error);
      
      // 初期化失敗時もアプリケーションは継続実行
      // 観測可能性機能なしでも基本機能は動作する
    }
  }
}

/**
 * Environment validation
 * 
 * 必要な環境変数が設定されているかチェックします。
 * 開発時のトラブルシューティングに役立ちます。
 */
function validateEnvironment(): void {
  const requiredEnvVars = [
    'AWS_REGION',
  ];
  
  const optionalEnvVars = [
    'OTEL_SERVICE_NAME',
    'OTEL_SERVICE_VERSION',
    'XRAY_ENABLED',
    'CLOUDWATCH_ENABLED',
    'OBSERVABILITY_DEBUG',
  ];
  
  // 必須環境変数のチェック
  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingRequired.length > 0) {
    console.warn('⚠️ Missing required environment variables:', missingRequired);
    console.warn('   Observability features may not work correctly');
  }
  
  // 開発環境での設定確認
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Environment configuration:');
    console.log('   Required variables:', requiredEnvVars.map(v => `${v}=${process.env[v] || 'NOT_SET'}`));
    console.log('   Optional variables:', optionalEnvVars.map(v => `${v}=${process.env[v] || 'NOT_SET'}`));
  }
}

// 環境変数の検証を実行
validateEnvironment();