/**
 * Observability Health Check API
 * 
 * このAPIエンドポイントは観測可能性コンポーネントの健全性をチェックします。
 * セットアップの確認やトラブルシューティングに使用できます。
 * 
 * エンドポイント: GET /api/health/observability
 * 
 * 学習ポイント:
 * - Next.js App Router APIの実装方法
 * - 観測可能性コンポーネントの健全性監視
 * - エラーハンドリングとレスポンス形式
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkObservabilityHealth, observabilityConfig } from '@/lib/observability';

/**
 * GET /api/health/observability
 * 
 * 観測可能性コンポーネントの健全性チェックを実行します。
 */
export async function GET(request: NextRequest) {
  try {
    // 健全性チェックの実行
    const healthCheck = await checkObservabilityHealth();
    
    // レスポンスの構築
    const response = {
      status: healthCheck.overall,
      timestamp: new Date().toISOString(),
      service: {
        name: observabilityConfig.serviceName,
        version: observabilityConfig.serviceVersion,
        environment: observabilityConfig.environment,
      },
      configuration: {
        enabled: observabilityConfig.enabled,
        otelEnabled: observabilityConfig.otelEnabled,
        cloudwatchEnabled: observabilityConfig.cloudwatchEnabled,
        xrayEnabled: observabilityConfig.xrayEnabled,
        awsRegion: observabilityConfig.awsRegion,
      },
      components: healthCheck.components,
      recommendations: generateRecommendations(healthCheck),
    };

    // HTTPステータスコードの決定
    let statusCode = 200;
    if (healthCheck.overall === 'degraded') {
      statusCode = 206; // Partial Content
    } else if (healthCheck.overall === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    }

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'health_check_failure',
      },
      service: {
        name: observabilityConfig.serviceName,
        version: observabilityConfig.serviceVersion,
        environment: observabilityConfig.environment,
      },
    }, { status: 500 });
  }
}

/**
 * Generate recommendations based on health check results
 * 
 * 健全性チェックの結果に基づいて改善提案を生成します。
 */
function generateRecommendations(healthCheck: {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, { status: 'up' | 'down'; lastCheck: string; error?: string }>;
}): string[] {
  const recommendations: string[] = [];
  
  // 全体的な状態に基づく推奨事項
  if (healthCheck.overall === 'unhealthy') {
    recommendations.push('All observability components are down. Check AWS credentials and network connectivity.');
  } else if (healthCheck.overall === 'degraded') {
    recommendations.push('Some observability components are experiencing issues. Check individual component errors.');
  }
  
  // コンポーネント別の推奨事項
  Object.entries(healthCheck.components).forEach(([component, status]) => {
    if (status.status === 'down') {
      switch (component) {
        case 'otel':
          recommendations.push('OpenTelemetry is not working. Check OTEL_ENABLED environment variable and dependencies.');
          break;
        case 'cloudwatch':
          recommendations.push('CloudWatch integration failed. Verify AWS credentials and CloudWatch permissions.');
          break;
        case 'xray':
          recommendations.push('X-Ray tracing is not active. Check XRAY_ENABLED setting and X-Ray permissions.');
          break;
        default:
          recommendations.push(`${component} component is down. Check configuration and logs.`);
      }
    }
  });
  
  // 設定に基づく推奨事項
  if (!observabilityConfig.enabled) {
    recommendations.push('Observability is disabled. Set OBSERVABILITY_ENABLED=true to enable monitoring.');
  }
  
  if (observabilityConfig.environment === 'production' && observabilityConfig.debugMode) {
    recommendations.push('Debug mode is enabled in production. Consider disabling for better performance.');
  }
  
  if (observabilityConfig.traceSamplingRate > 0.5 && observabilityConfig.environment === 'production') {
    recommendations.push('High trace sampling rate in production may impact performance. Consider reducing to 0.1 or lower.');
  }
  
  return recommendations;
}