/**
 * OpenTelemetry Configuration for MAGI Decision UI
 * 
 * このファイルはAmazon Bedrock AgentCoreとの統合に必要なOpenTelemetryトレーシング設定を提供します。
 * フロントエンドからバックエンドまでの完全なトレース可視化を実現します。
 * 
 * 主要機能:
 * - AWS X-Rayとの統合設定
 * - CloudWatchへのメトリクス送信
 * - トレースID相関管理
 * - セッション追跡
 * 
 * 学習ポイント:
 * - OpenTelemetryの基本概念（Span、Trace、Context）
 * - AWS分散トレーシングのベストプラクティス
 * - フロントエンド・バックエンド間のトレース相関
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

/**
 * OTEL Environment Configuration
 * 
 * 環境変数からOpenTelemetry設定を読み込みます。
 * 本番環境とローカル開発環境で異なる設定を適用できます。
 */
interface OTELConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  awsRegion: string;
  traceExporterEndpoint?: string;
  metricsExporterEndpoint?: string;
  enableConsoleExporter: boolean;
  samplingRate: number;
}

const getOTELConfig = (): OTELConfig => ({
  serviceName: process.env.OTEL_SERVICE_NAME || 'magi-decision-ui',
  serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  traceExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  metricsExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
  enableConsoleExporter: process.env.NODE_ENV === 'development',
  samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || '0.1'), // 10% sampling by default
});

/**
 * AWS X-Ray Trace Exporter Configuration
 * 
 * AWS X-RayとCloudWatchにトレースデータを送信するためのエクスポーター設定。
 * AgentCoreからのトレースIDと相関させるための重要な設定です。
 */
const createTraceExporter = (config: OTELConfig) => {
  // AWS X-Ray用のOTLPエクスポーター
  const otlpExporter = new OTLPTraceExporter({
    url: config.traceExporterEndpoint || `https://otlp.${config.awsRegion}.amazonaws.com/v1/traces`,
    headers: {
      'x-aws-region': config.awsRegion,
      // AgentCoreとの相関のためのヘッダー
      'x-amzn-trace-id': '', // 実行時に動的に設定
    },
  });

  return otlpExporter;
};

/**
 * CloudWatch Metrics Exporter Configuration
 * 
 * CloudWatchにカスタムメトリクスを送信するための設定。
 * エージェント実行時間、成功率、エラー率などを監視できます。
 */
const createMetricsExporter = (config: OTELConfig) => {
  return new OTLPMetricExporter({
    url: config.metricsExporterEndpoint || `https://otlp.${config.awsRegion}.amazonaws.com/v1/metrics`,
    headers: {
      'x-aws-region': config.awsRegion,
    },
  });
};

/**
 * OpenTelemetry SDK Initialization
 * 
 * Next.js アプリケーション用のOpenTelemetry SDKを初期化します。
 * この設定により、フロントエンドからの全てのリクエストがトレースされ、
 * AgentCoreでの実行と相関付けられます。
 */
export const initializeOTEL = (): NodeSDK | null => {
  // サーバーサイドでのみ初期化
  if (typeof window !== 'undefined') {
    return null;
  }

  const config = getOTELConfig();

  const sdk = new NodeSDK({
    // リソース識別情報
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
      [SemanticResourceAttributes.CLOUD_PROVIDER]: 'aws',
      [SemanticResourceAttributes.CLOUD_REGION]: config.awsRegion,
      // MAGI システム固有の属性
      'magi.system.version': '1.0.0',
      'magi.agents.count': '3', // CASPAR, BALTHASAR, MELCHIOR
      'magi.judge.enabled': 'true', // SOLOMON Judge
    }),

    // AWS X-Ray用のトレースID生成器
    idGenerator: new AWSXRayIdGenerator(),

    // AWS X-Ray用のコンテキスト伝播
    textMapPropagator: new AWSXRayPropagator(),

    // 自動計装の設定
    instrumentations: [
      getNodeAutoInstrumentations({
        // Next.js固有の設定
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // ファイルシステム操作は除外
        },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          // AgentCore APIコールのみトレース
          requestHook: (span, request) => {
            span.setAttributes({
              'http.request.header.x-amzn-trace-id': request.headers['x-amzn-trace-id'] || '',
              'magi.request.type': request.url?.includes('/api/agents/') ? 'agent_execution' : 'ui_request',
            });
          },
        },
        '@opentelemetry/instrumentation-aws-sdk': {
          enabled: true,
          // Bedrock API呼び出しの詳細トレース
          sqsExtractLinkTags: true,
          suppressInternalInstrumentation: false,
        },
        // Winston instrumentation を無効化（winston-transportパッケージが不要）
        '@opentelemetry/instrumentation-winston': {
          enabled: false,
        },
      }),
    ],

    // トレースエクスポーターの設定
    spanProcessor: new BatchSpanProcessor(createTraceExporter(config), {
      maxExportBatchSize: 100,
      maxQueueSize: 1000,
      exportTimeoutMillis: 30000,
      scheduledDelayMillis: 5000,
    }),

    // メトリクスエクスポーターの設定
    metricReader: new PeriodicExportingMetricReader({
      exporter: createMetricsExporter(config),
      exportIntervalMillis: 10000, // 10秒間隔でメトリクス送信
    }),
  });

  return sdk;
};

/**
 * Trace Context Utilities
 * 
 * フロントエンドとバックエンド間でトレースコンテキストを管理するためのユーティリティ。
 * AgentCoreからのトレースIDを適切に伝播させるために使用します。
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
  sessionId?: string;
}

/**
 * Extract trace context from X-Amzn-Trace-Id header
 * 
 * AWS X-Rayのトレースヘッダーからトレースコンテキストを抽出します。
 * AgentCoreからの応答に含まれるトレースIDを解析して、
 * フロントエンドでの表示に使用します。
 */
export const extractTraceContext = (traceHeader: string): TraceContext | null => {
  try {
    // X-Amzn-Trace-Id: Root=1-5e1b4151-5ac6c58f40c1c06412fb1de2;Parent=53995c3f42cd8ad8;Sampled=1
    const parts = traceHeader.split(';');
    const rootPart = parts.find(part => part.startsWith('Root='));
    const parentPart = parts.find(part => part.startsWith('Parent='));
    const sampledPart = parts.find(part => part.startsWith('Sampled='));

    if (!rootPart) return null;

    const traceId = rootPart.replace('Root=', '');
    const spanId = parentPart?.replace('Parent=', '') || '';
    const traceFlags = sampledPart?.replace('Sampled=', '') || '0';

    return {
      traceId,
      spanId,
      traceFlags,
    };
  } catch (error) {
    console.warn('Failed to extract trace context:', error);
    return null;
  }
};

/**
 * Generate X-Amzn-Trace-Id header for outgoing requests
 * 
 * AgentCore APIへのリクエスト時に使用するトレースヘッダーを生成します。
 * これにより、フロントエンドからの操作とAgentCoreでの実行が相関付けられます。
 */
export const generateTraceHeader = (sessionId?: string): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomId = Math.random().toString(16).substring(2, 18).padStart(16, '0');
  const traceId = `1-${timestamp}-${randomId}`;
  
  let header = `Root=${traceId};Sampled=1`;
  
  if (sessionId) {
    // セッションIDをカスタム属性として追加
    header += `;session-id=${sessionId}`;
  }
  
  return header;
};

/**
 * MAGI System Specific Metrics
 * 
 * MAGIシステム固有のメトリクスを定義します。
 * これらのメトリクスはCloudWatchで監視され、システムの健全性を把握できます。
 */
export const MAGI_METRICS = {
  // エージェント実行メトリクス
  AGENT_EXECUTION_DURATION: 'magi.agent.execution.duration',
  AGENT_EXECUTION_SUCCESS: 'magi.agent.execution.success',
  AGENT_EXECUTION_ERROR: 'magi.agent.execution.error',
  
  // SOLOMON Judge メトリクス
  SOLOMON_EVALUATION_DURATION: 'magi.solomon.evaluation.duration',
  SOLOMON_CONSENSUS_RATE: 'magi.solomon.consensus.rate',
  SOLOMON_CONFIDENCE_SCORE: 'magi.solomon.confidence.score',
  
  // システム全体メトリクス
  CONVERSATION_CREATED: 'magi.conversation.created',
  MESSAGE_PROCESSED: 'magi.message.processed',
  TRACE_CORRELATION_SUCCESS: 'magi.trace.correlation.success',
} as const;

/**
 * Development Mode Console Logging
 * 
 * 開発環境でのデバッグ用コンソール出力設定。
 * 本番環境では無効化されます。
 */
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 OTEL Configuration:', {
    serviceName: getOTELConfig().serviceName,
    environment: getOTELConfig().environment,
    awsRegion: getOTELConfig().awsRegion,
    samplingRate: getOTELConfig().samplingRate,
  });
}