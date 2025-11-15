/**
 * Next.js Instrumentation File
 *
 * このファイルはNext.js 15の標準的な方法でOpenTelemetryを初期化します。
 * アプリケーション起動時に自動的に実行され、分散トレーシングを有効化します。
 *
 * 詳細: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * 学習ポイント:
 * - Next.js 15のinstrumentationフック
 * - サーバーサイド専用の初期化
 * - OpenTelemetryの自動計装
 */

export async function register() {
  // Node.jsランタイムでのみ実行（Edge Runtimeでは実行しない）
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // OpenTelemetryを初期化
    const { initializeObservability } = await import('./lib/observability');

    try {
      await initializeObservability();
      console.log('✅ Instrumentation: Observability initialized successfully');
    } catch (error) {
      console.error('❌ Instrumentation: Failed to initialize observability:', error);
      // エラーが発生してもアプリケーションの起動は継続
    }
  }
}

/**
 * onRequestError Hook (Optional)
 *
 * リクエストエラー時に呼び出されるフック。
 * トレースにエラー情報を追加できます。
 */
export async function onRequestError(
  error: Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  }
) {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { XRayUtils } = await import('./lib/observability');

    // 現在のトレースIDを取得
    const traceId = XRayUtils.getCurrentTraceId();

    console.error('🔴 Request Error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        path: request.path,
        method: request.method,
      },
      traceId,
    });

    // トレースにエラー情報を追加
    XRayUtils.addAnnotation('error', true);
    XRayUtils.addAnnotation('error.name', error.name);
    XRayUtils.addMetadata('error', {
      message: error.message,
      stack: error.stack,
      path: request.path,
      method: request.method,
    });
  }
}
