/**
 * AWS X-Ray Integration for MAGI Decision UI
 * 
 * このファイルはAWS X-Rayとの統合機能を提供します。
 * 分散トレーシング、セグメント管理、サブセグメント作成などの機能を含みます。
 * 
 * 主要機能:
 * - X-Rayセグメントの作成と管理
 * - AgentCoreとのトレース相関
 * - カスタムサブセグメントの追加
 * - エラートレーシング
 * 
 * 学習ポイント:
 * - AWS X-Rayの分散トレーシング概念
 * - セグメントとサブセグメントの使い分け
 * - トレースIDの伝播メカニズム
 */

import AWSXRay from 'aws-xray-sdk-core';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

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
  captureAWS: boolean;
  captureHTTPS: boolean;
  capturePromises: boolean;
}

const getXRayConfig = (): XRayConfig => ({
  serviceName: process.env.XRAY_SERVICE_NAME || 'magi-decision-ui',
  enabled: process.env.XRAY_ENABLED !== 'false',
  samplingRate: parseFloat(process.env.XRAY_SAMPLING_RATE || '0.1'),
  captureAWS: process.env.XRAY_CAPTURE_AWS !== 'false',
  captureHTTPS: process.env.XRAY_CAPTURE_HTTPS !== 'false',
  capturePromises: process.env.XRAY_CAPTURE_PROMISES !== 'false',
});

/**
 * Initialize X-Ray SDK
 * 
 * X-Ray SDKを初期化します。
 * AWS SDKの自動計装も含まれます。
 */
export const initializeXRay = (): void => {
  const config = getXRayConfig();

  if (!config.enabled) {
    console.log('🔍 X-Ray tracing is disabled');
    return;
  }

  // X-Ray設定
  AWSXRay.config([
    AWSXRay.plugins.ECSPlugin,
    AWSXRay.plugins.EC2Plugin,
  ]);

  // AWS SDKの自動計装
  if (config.captureAWS) {
    const AWS = require('aws-sdk');
    AWSXRay.captureAWS(AWS);
  }

  // HTTPSリクエストの自動計装
  if (config.captureHTTPS) {
    AWSXRay.captureHTTPsGlobal(require('https'));
    AWSXRay.captureHTTPsGlobal(require('http'));
  }

  // Promiseの自動計装
  if (config.capturePromises) {
    AWSXRay.capturePromise();
  }

  // サンプリングルールの設定
  AWSXRay.middleware.setSamplingRules({
    version: 2,
    default: {
      fixed_target: 1,
      rate: config.samplingRate,
    },
    rules: [
      {
        description: 'MAGI Agent Execution',
        service_name: config.serviceName,
        http_method: 'POST',
        url_path: '/api/agents/*',
        fixed_target: 2,
        rate: 0.5, // エージェント実行は50%サンプリング
      },
      {
        description: 'SOLOMON Evaluation',
        service_name: config.serviceName,
        http_method: 'POST',
        url_path: '/api/solomon/*',
        fixed_target: 2,
        rate: 0.8, // SOLOMON評価は80%サンプリング
      },
    ],
  });

  console.log('🔍 X-Ray tracing initialized:', {
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

  constructor() {
    this.serviceName = getXRayConfig().serviceName;
  }

  /**
   * Create Agent Execution Trace
   * 
   * エージェント実行用のトレースセグメントを作成します。
   * 3賢者の並列実行を適切にトレースします。
   */
  async traceAgentExecution<T>(
    context: MAGITraceContext,
    agentId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const segmentName = `${this.serviceName}-agent-${agentId}`;
    
    return AWSXRay.captureAsyncFunc(segmentName, async (subsegment) => {
      if (!subsegment) {
        return operation();
      }

      // セグメントにMAGI固有の情報を追加
      subsegment.addAnnotation('agentId', agentId);
      subsegment.addAnnotation('conversationId', context.conversationId);
      subsegment.addAnnotation('messageId', context.messageId);
      subsegment.addAnnotation('executionMode', context.executionMode);
      
      if (context.sessionId) {
        subsegment.addAnnotation('sessionId', context.sessionId);
      }
      
      if (context.userId) {
        subsegment.addAnnotation('userId', context.userId);
      }

      // メタデータの追加
      subsegment.addMetadata('magi', {
        agentType: this.getAgentType(agentId),
        agentDescription: this.getAgentDescription(agentId),
        totalAgents: context.agentIds.length,
        solomonEnabled: context.solomonEnabled,
      });

      try {
        const startTime = Date.now();
        const result = await operation();
        const endTime = Date.now();

        // 成功メトリクスの追加
        subsegment.addMetadata('execution', {
          success: true,
          duration: endTime - startTime,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        // エラー情報の追加
        subsegment.addError(error as Error);
        subsegment.addMetadata('execution', {
          success: false,
          error: {
            name: (error as Error).name,
            message: (error as Error).message,
          },
          timestamp: new Date().toISOString(),
        });

        throw error;
      }
    });
  }

  /**
   * Create SOLOMON Evaluation Trace
   * 
   * SOLOMON Judge評価用のトレースセグメントを作成します。
   * 3賢者の回答統合プロセスを詳細にトレースします。
   */
  async traceSolomonEvaluation<T>(
    context: MAGITraceContext,
    agentResponses: any[],
    operation: () => Promise<T>
  ): Promise<T> {
    const segmentName = `${this.serviceName}-solomon-judge`;
    
    return AWSXRay.captureAsyncFunc(segmentName, async (subsegment) => {
      if (!subsegment) {
        return operation();
      }

      // SOLOMON固有の情報を追加
      subsegment.addAnnotation('component', 'solomon-judge');
      subsegment.addAnnotation('conversationId', context.conversationId);
      subsegment.addAnnotation('messageId', context.messageId);
      subsegment.addAnnotation('agentResponseCount', agentResponses.length);

      // 3賢者の回答サマリーを追加
      const responseSummary = agentResponses.map(response => ({
        agentId: response.agentId,
        decision: response.decision,
        confidence: response.confidence,
      }));

      subsegment.addMetadata('solomon', {
        agentResponses: responseSummary,
        evaluationMode: 'consensus_with_scoring',
        votingSystem: 'majority_with_confidence',
      });

      try {
        const startTime = Date.now();
        const result = await operation();
        const endTime = Date.now();

        // SOLOMON評価結果の追加
        subsegment.addMetadata('evaluation', {
          success: true,
          duration: endTime - startTime,
          result: result,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        subsegment.addError(error as Error);
        subsegment.addMetadata('evaluation', {
          success: false,
          error: {
            name: (error as Error).name,
            message: (error as Error).message,
          },
          timestamp: new Date().toISOString(),
        });

        throw error;
      }
    });
  }

  /**
   * Create Conversation Trace
   * 
   * 会話全体のトレースセグメントを作成します。
   * ユーザーの質問から最終回答までの全プロセスを追跡します。
   */
  async traceConversation<T>(
    context: MAGITraceContext,
    userMessage: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const segmentName = `${this.serviceName}-conversation`;
    
    return AWSXRay.captureAsyncFunc(segmentName, async (subsegment) => {
      if (!subsegment) {
        return operation();
      }

      // 会話レベルの情報を追加
      subsegment.addAnnotation('conversationId', context.conversationId);
      subsegment.addAnnotation('messageId', context.messageId);
      subsegment.addAnnotation('totalAgents', context.agentIds.length);
      
      if (context.userId) {
        subsegment.addAnnotation('userId', context.userId);
      }

      // 会話メタデータの追加
      subsegment.addMetadata('conversation', {
        userMessage: userMessage.substring(0, 200), // 最初の200文字のみ
        agentIds: context.agentIds,
        executionMode: context.executionMode,
        solomonEnabled: context.solomonEnabled,
        messageLength: userMessage.length,
      });

      try {
        const startTime = Date.now();
        const result = await operation();
        const endTime = Date.now();

        subsegment.addMetadata('result', {
          success: true,
          totalDuration: endTime - startTime,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        subsegment.addError(error as Error);
        throw error;
      }
    });
  }

  /**
   * Add Custom Subsegment
   * 
   * カスタムサブセグメントを追加します。
   * 特定の処理ステップを詳細にトレースする際に使用します。
   */
  async addCustomSubsegment<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return AWSXRay.captureAsyncFunc(name, async (subsegment) => {
      if (!subsegment) {
        return operation();
      }

      if (metadata) {
        subsegment.addMetadata('custom', metadata);
      }

      try {
        const result = await operation();
        subsegment.addMetadata('result', { success: true });
        return result;
      } catch (error) {
        subsegment.addError(error as Error);
        throw error;
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
    const segment = AWSXRay.getSegment();
    if (!segment) return null;
    
    return segment.trace_id;
  }

  /**
   * Get Current Segment ID
   * 
   * 現在のセグメントIDを取得します。
   */
  static getCurrentSegmentId(): string | null {
    const segment = AWSXRay.getSegment();
    if (!segment) return null;
    
    return segment.id;
  }

  /**
   * Create Trace Header
   * 
   * X-Amzn-Trace-Idヘッダーを作成します。
   * AgentCore APIへのリクエスト時に使用します。
   */
  static createTraceHeader(sessionId?: string): string {
    const segment = AWSXRay.getSegment();
    if (!segment) {
      // セグメントが存在しない場合は新しいトレースIDを生成
      const timestamp = Math.floor(Date.now() / 1000).toString(16);
      const randomId = Math.random().toString(16).substring(2, 18).padStart(16, '0');
      const traceId = `1-${timestamp}-${randomId}`;
      
      let header = `Root=${traceId};Sampled=1`;
      if (sessionId) {
        header += `;session-id=${sessionId}`;
      }
      
      return header;
    }

    // 既存のセグメントからトレースヘッダーを生成
    let header = `Root=${segment.trace_id};Parent=${segment.id};Sampled=1`;
    if (sessionId) {
      header += `;session-id=${sessionId}`;
    }
    
    return header;
  }

  /**
   * Add Custom Annotation
   * 
   * 現在のセグメントにカスタムアノテーションを追加します。
   */
  static addAnnotation(key: string, value: string | number | boolean): void {
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addAnnotation(key, value);
    }
  }

  /**
   * Add Custom Metadata
   * 
   * 現在のセグメントにカスタムメタデータを追加します。
   */
  static addMetadata(namespace: string, data: Record<string, any>): void {
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addMetadata(namespace, data);
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