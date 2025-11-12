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
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT
} from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';

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
  traceExporterEndpoint?: string | undefined;
  metricsExporterEndpoint?: string | undefined;
  enableConsoleExporter: boolean;
  samplingRate: number;
}

const getOTELConfig = (): OTELConfig => ({
  serviceName: process.env.OTEL_SERVICE_NAME || 'magi-decision-ui',
  serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  awsRegion: process.env.NEXT_PUBLIC_AWS_REGION || process.env.APP_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-northeast-1',
  traceExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  metricsExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
  enableConsoleExporter: process.env.NODE_ENV === 'development',
  samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || '0.1'), // 10% sampling by default
});

/**
 * Trace Exporter Configuration
 *
 * 開発環境ではコンソールに出力し、本番環境ではX-Rayに送信します。
 * （現在はコンソールエクスポーターのみ実装）
 */
const createTraceExporter = (config: OTELConfig) => {
  // 開発環境ではコンソールエクスポーターを使用
  return new ConsoleSpanExporter();
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

  // リソース設定
  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: config.serviceVersion,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.environment,
  });

  // トレースエクスポーター設定（現在はコンソールのみ）
  const traceExporter = createTraceExporter(config);

  // NodeSDK初期化
  const sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [
      getNodeAutoInstrumentations({
        // HTTP/HTTPSリクエストの自動計装
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
        // その他の自動計装を有効化
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // ファイルシステムは無効化（パフォーマンスのため）
        },
      }),
    ],
    textMapPropagator: new AWSXRayPropagator(),
    idGenerator: new AWSXRayIdGenerator(),
  });

  console.log('🔍 OpenTelemetry SDK initialized:', {
    serviceName: config.serviceName,
    environment: config.environment,
    samplingRate: config.samplingRate,
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