/**
 * AWS X-Ray Integration for MAGI Decision UI
 *
 * このファイルはOpenTelemetry APIを使用したAWS X-Ray統合機能を提供します。
 * 分散トレーシング、スパン管理、サブスパン作成などの機能を含みます。
 *
 * 主要機能:
 * - OpenTelemetryスパンの作成と管理
 * - AgentCoreとのトレース相関
 * - カスタムスパンの追加
 * - エラートレーシング
 *
 * 学習ポイント:
 * - OpenTelemetryによるAWS X-Rayの分散トレーシング概念
 * - スパンとサブスパンの使い分け
 * - トレースIDの伝播メカニズム
 */

import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';

/**
 * X-Ray Configuration
 *
 * AWS X-Rayの設定を管理します。
 * 環境に応じて適切な設定を適用します。
 */
interface XRayConfig {
  serviceName: string;
  enabled: boolean;
  samplingRate: number;
}

const getXRayConfig = (): XRayConfig => ({
  serviceName: process.env.XRAY_SERVICE_NAME || 'magi-decision-ui',
  enabled: process.env.XRAY_ENABLED !== 'false',
  samplingRate: parseFloat(process.env.XRAY_SAMPLING_RATE || '0.1'),
});

/**
 * Initialize X-Ray Integration
 *
 * OpenTelemetry経由でX-Ray統合を初期化します。
 */
export const initializeXRay = (): void => {
  const config = getXRayConfig();

  if (!config.enabled) {
    console.log('🔍 X-Ray tracing is disabled');
    return;
  }

  console.log('🔍 X-Ray tracing initialized via OpenTelemetry:', {
    serviceName: config.serviceName,
    samplingRate: config.samplingRate,
  });
};

/**
 * MAGI Trace Context
 *
 * MAGIシステム固有のトレースコンテキスト情報。
 * エージェント実行とSOLOMON評価の詳細を追跡します。
 */
export interface MAGITraceContext {
  conversationId: string;
  messageId: string;
  sessionId?: string;
  userId?: string;
  agentIds: string[];
  executionMode: 'parallel' | 'sequential';
  solomonEnabled: boolean;
}

/**
 * MAGI Trace Manager
 *
 * MAGIシステム専用のトレース管理クラス。
 * エージェント実行とSOLOMON評価の詳細なトレーシングを提供します。
 */
export class MAGITraceManager {
  private readonly serviceName: string;
  private readonly tracer = trace.getTracer('magi-decision-ui');

  constructor() {
    this.serviceName = getXRayConfig().serviceName;
  }

  /**
   * Create Agent Execution Trace
   *
   * エージェント実行用のトレーススパンを作成します。
   * 3賢者の並列実行を適切にトレースします。
   */
  async traceAgentExecution<T>(
    traceContext: MAGITraceContext,
    agentId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const spanName = `agent-execution-${agentId}`;

    return this.tracer.startActiveSpan(spanName, async (span: Span) => {
      try {
        // スパンにMAGI固有の属性を追加
        span.setAttribute('agent.id', agentId);
        span.setAttribute('conversation.id', traceContext.conversationId);
        span.setAttribute('message.id', traceContext.messageId);
        span.setAttribute('execution.mode', traceContext.executionMode);
        span.setAttribute('agent.type', this.getAgentType(agentId));
        span.setAttribute('agent.description', this.getAgentDescription(agentId));
        span.setAttribute('total.agents', traceContext.agentIds.length);
        span.setAttribute('solomon.enabled', traceContext.solomonEnabled);

        if (traceContext.sessionId) {
          span.setAttribute('session.id', traceContext.sessionId);
        }

        if (traceContext.userId) {
          span.setAttribute('user.id', traceContext.userId);
        }

        const startTime = Date.now();
        const result = await operation();
        const endTime = Date.now();

        // 成功メトリクスの追加
        span.setAttribute('execution.success', true);
        span.setAttribute('execution.duration', endTime - startTime);
        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        // エラー情報の追加
        span.recordException(error as Error);
        span.setAttribute('execution.success', false);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Create SOLOMON Evaluation Trace
   *
   * SOLOMON Judge評価用のトレーススパンを作成します。
   * 3賢者の回答統合プロセスを詳細にトレースします。
   */
  async traceSolomonEvaluation<T>(
    traceContext: MAGITraceContext,
    agentResponses: any[],
    operation: () => Promise<T>
  ): Promise<T> {
    const spanName = 'solomon-judge-evaluation';

    return this.tracer.startActiveSpan(spanName, async (span: Span) => {
      try {
        // SOLOMON固有の属性を追加
        span.setAttribute('component', 'solomon-judge');
        span.setAttribute('conversation.id', traceContext.conversationId);
        span.setAttribute('message.id', traceContext.messageId);
        span.setAttribute('agent.response.count', agentResponses.length);
        span.setAttribute('evaluation.mode', 'consensus_with_scoring');
        span.setAttribute('voting.system', 'majority_with_confidence');

        // 3賢者の回答サマリーを追加
        agentResponses.forEach((response, index) => {
          span.setAttribute(`response.${index}.agent_id`, response.agentId || 'unknown');
          span.setAttribute(`response.${index}.decision`, response.decision || 'unknown');
          span.setAttribute(`response.${index}.confidence`, response.confidence || 0);
        });

        const startTime = Date.now();
        const result = await operation();
        const endTime = Date.now();

        // SOLOMON評価結果の追加
        span.setAttribute('evaluation.success', true);
        span.setAttribute('evaluation.duration', endTime - startTime);
        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setAttribute('evaluation.success', false);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Create Conversation Trace
   *
   * 会話全体のトレーススパンを作成します。
   * ユーザーの質問から最終回答までの全プロセスを追跡します。
   */
  async traceConversation<T>(
    traceContext: MAGITraceContext,
    userMessage: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const spanName = 'conversation';

    return this.tracer.startActiveSpan(spanName, async (span: Span) => {
      try {
        // 会話レベルの属性を追加
        span.setAttribute('conversation.id', traceContext.conversationId);
        span.setAttribute('message.id', traceContext.messageId);
        span.setAttribute('total.agents', traceContext.agentIds.length);
        span.setAttribute('message.length', userMessage.length);
        span.setAttribute('execution.mode', traceContext.executionMode);
        span.setAttribute('solomon.enabled', traceContext.solomonEnabled);

        // ユーザーメッセージの最初の200文字のみを保存
        span.setAttribute('user.message', userMessage.substring(0, 200));

        if (traceContext.userId) {
          span.setAttribute('user.id', traceContext.userId);
        }

        const startTime = Date.now();
        const result = await operation();
        const endTime = Date.now();

        span.setAttribute('conversation.success', true);
        span.setAttribute('conversation.duration', endTime - startTime);
        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Add Custom Subsegment
   *
   * カスタムサブスパンを追加します。
   * 特定の処理ステップを詳細にトレースする際に使用します。
   */
  async addCustomSubsegment<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, async (span: Span) => {
      try {
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            span.setAttribute(`custom.${key}`, JSON.stringify(value));
          });
        }

        const result = await operation();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Get Agent Type
   *
   * エージェントIDから種別を取得します。
   */
  private getAgentType(agentId: string): string {
    const agentTypes: Record<string, string> = {
      'caspar': 'conservative',
      'balthasar': 'innovative',
      'melchior': 'balanced',
      'solomon': 'judge',
    };

    return agentTypes[agentId] || 'unknown';
  }

  /**
   * Get Agent Description
   *
   * エージェントIDから説明を取得します。
   */
  private getAgentDescription(agentId: string): string {
    const descriptions: Record<string, string> = {
      'caspar': 'Conservative and realistic perspective',
      'balthasar': 'Innovative and emotional perspective',
      'melchior': 'Balanced and scientific perspective',
      'solomon': 'Judge and integrator of all perspectives',
    };

    return descriptions[agentId] || 'Unknown agent';
  }
}

/**
 * X-Ray Utilities
 *
 * X-Ray操作のためのユーティリティ関数群。
 */
export class XRayUtils {
  /**
   * Get Current Trace ID
   *
   * 現在のトレースIDを取得します。
   * フロントエンドでの表示やログ相関に使用します。
   */
  static getCurrentTraceId(): string | null {
    const span = trace.getActiveSpan();
    if (!span) return null;

    const spanContext = span.spanContext();
    return spanContext.traceId;
  }

  /**
   * Get Current Span ID
   *
   * 現在のスパンIDを取得します。
   */
  static getCurrentSpanId(): string | null {
    const span = trace.getActiveSpan();
    if (!span) return null;

    const spanContext = span.spanContext();
    return spanContext.spanId;
  }

  /**
   * Create Trace Header
   *
   * X-Amzn-Trace-Idヘッダーを作成します。
   * AgentCore APIへのリクエスト時に使用します。
   */
  static createTraceHeader(sessionId?: string): string {
    const span = trace.getActiveSpan();

    if (!span) {
      // スパンが存在しない場合は新しいトレースIDを生成
      const timestamp = Math.floor(Date.now() / 1000).toString(16);
      const randomId = Math.random().toString(16).substring(2, 18).padStart(16, '0');
      const traceId = `1-${timestamp}-${randomId}`;

      let header = `Root=${traceId};Sampled=1`;
      if (sessionId) {
        header += `;session-id=${sessionId}`;
      }

      return header;
    }

    // 既存のスパンからトレースヘッダーを生成
    const spanContext = span.spanContext();
    const traceId = spanContext.traceId;
    const spanId = spanContext.spanId;

    // X-Ray形式のトレースIDに変換（1-timestamp-uniqueid）
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const xrayTraceId = `1-${timestamp}-${traceId.substring(0, 24)}`;

    let header = `Root=${xrayTraceId};Parent=${spanId};Sampled=1`;
    if (sessionId) {
      header += `;session-id=${sessionId}`;
    }

    return header;
  }

  /**
   * Add Custom Annotation
   *
   * 現在のスパンにカスタム属性を追加します。
   */
  static addAnnotation(key: string, value: string | number | boolean): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(key, value);
    }
  }

  /**
   * Add Custom Metadata
   *
   * 現在のスパンにカスタムメタデータを追加します。
   */
  static addMetadata(namespace: string, data: Record<string, any>): void {
    const span = trace.getActiveSpan();
    if (span) {
      Object.entries(data).forEach(([key, value]) => {
        span.setAttribute(`${namespace}.${key}`, JSON.stringify(value));
      });
    }
  }
}

/**
 * Singleton instance for global use
 *
 * アプリケーション全体で使用するシングルトンインスタンス。
 */
export const magiTraceManager = new MAGITraceManager();

/**
 * Convenience functions for common operations
 *
 * よく使用される操作のための便利関数。
 */
export const traceAgentExecution = magiTraceManager.traceAgentExecution.bind(magiTraceManager);
export const traceSolomonEvaluation = magiTraceManager.traceSolomonEvaluation.bind(magiTraceManager);
export const traceConversation = magiTraceManager.traceConversation.bind(magiTraceManager);
export const addCustomSubsegment = magiTraceManager.addCustomSubsegment.bind(magiTraceManager);
