/**
 * CloudWatch Integration for MAGI Decision UI
 * 
 * このファイルはAmazon CloudWatchとの統合機能を提供します。
 * メトリクス送信、ログ管理、アラーム設定などの機能を含みます。
 * 
 * 主要機能:
 * - カスタムメトリクスの送信
 * - 構造化ログの出力
 * - エージェント実行状況の監視
 * - パフォーマンス指標の追跡
 * 
 * 学習ポイント:
 * - CloudWatchメトリクスの効果的な活用方法
 * - 構造化ログによる運用監視
 * - AWS SDKを使用したメトリクス送信
 */

import { CloudWatchClient, PutMetricDataCommand, MetricDatum, StandardUnit } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';

/**
 * CloudWatch Client Configuration
 *
 * AWS CloudWatchクライアントの設定。
 * リージョンと認証情報は環境変数から自動取得されます。
 * Amplify Hosting互換: NEXT_PUBLIC_AWS_REGION, APP_AWS_REGION を優先的に使用
 */
const cloudWatchClient = new CloudWatchClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.APP_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-northeast-1',
});

const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.APP_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-northeast-1',
});

/**
 * MAGI System Metrics Configuration
 * 
 * MAGIシステム固有のメトリクス定義。
 * CloudWatchで監視するべき重要な指標を定義しています。
 */
export interface MAGIMetrics {
  // エージェント実行メトリクス
  agentExecutionDuration: number;
  agentExecutionSuccess: boolean;
  agentExecutionError?: string;
  
  // SOLOMON Judge メトリクス
  solomonEvaluationDuration: number;
  solomonConsensusAchieved: boolean;
  solomonConfidenceScore: number;
  
  // システム全体メトリクス
  conversationCount: number;
  messageProcessingTime: number;
  traceCorrelationSuccess: boolean;
  
  // パフォーマンスメトリクス
  responseTime: number;
  errorRate: number;
  throughput: number;
}

/**
 * Structured Log Entry Interface
 * 
 * 構造化ログのエントリ形式を定義。
 * CloudWatch Logsで効率的に検索・分析できる形式です。
 */
export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  service: string;
  traceId?: string | undefined;
  sessionId?: string | undefined;
  userId?: string | undefined;
  component: string;
  message: string;
  metadata?: Record<string, any> | undefined;
  error?: {
    name: string;
    message: string;
    stack?: string | undefined;
  } | undefined;
}

/**
 * CloudWatch Metrics Publisher
 * 
 * CloudWatchにカスタムメトリクスを送信するクラス。
 * MAGIシステムの各種指標を効率的に送信します。
 */
export class MAGIMetricsPublisher {
  private readonly namespace = 'MAGI/DecisionUI';
  private readonly batchSize = 20; // CloudWatchの制限に合わせて調整
  private metricsBuffer: MetricDatum[] = [];

  /**
   * Agent Execution Metrics
   * 
   * エージェント実行に関するメトリクスを送信します。
   * 実行時間、成功率、エラー率などを追跡できます。
   */
  async publishAgentMetrics(agentId: string, metrics: {
    executionDuration: number;
    success: boolean;
    errorType?: string;
    tokenUsage?: number;
  }): Promise<void> {
    const timestamp = new Date();
    const dimensions = [
      { Name: 'AgentId', Value: agentId },
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' },
    ];

    // 実行時間メトリクス
    this.addMetric({
      MetricName: 'AgentExecutionDuration',
      Value: metrics.executionDuration,
      Unit: StandardUnit.Milliseconds,
      Timestamp: timestamp,
      Dimensions: dimensions,
    });

    // 成功/失敗メトリクス
    this.addMetric({
      MetricName: 'AgentExecutionSuccess',
      Value: metrics.success ? 1 : 0,
      Unit: StandardUnit.Count,
      Timestamp: timestamp,
      Dimensions: dimensions,
    });

    // エラータイプ別メトリクス（エラーがある場合）
    if (!metrics.success && metrics.errorType) {
      this.addMetric({
        MetricName: 'AgentExecutionError',
        Value: 1,
        Unit: StandardUnit.Count,
        Timestamp: timestamp,
        Dimensions: [
          ...dimensions,
          { Name: 'ErrorType', Value: metrics.errorType },
        ],
      });
    }

    // トークン使用量メトリクス（利用可能な場合）
    if (metrics.tokenUsage) {
      this.addMetric({
        MetricName: 'AgentTokenUsage',
        Value: metrics.tokenUsage,
        Unit: StandardUnit.Count,
        Timestamp: timestamp,
        Dimensions: dimensions,
      });
    }

    await this.flushMetrics();
  }

  /**
   * SOLOMON Judge Metrics
   * 
   * SOLOMON Judgeの評価に関するメトリクスを送信します。
   * 評価時間、合意達成率、信頼度スコアなどを追跡します。
   */
  async publishSolomonMetrics(metrics: {
    evaluationDuration: number;
    consensusAchieved: boolean;
    confidenceScore: number;
    votingResult: { approved: number; rejected: number; abstained: number };
  }): Promise<void> {
    const timestamp = new Date();
    const dimensions = [
      { Name: 'Component', Value: 'SOLOMON' },
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' },
    ];

    // 評価時間
    this.addMetric({
      MetricName: 'SolomonEvaluationDuration',
      Value: metrics.evaluationDuration,
      Unit: StandardUnit.Milliseconds,
      Timestamp: timestamp,
      Dimensions: dimensions,
    });

    // 合意達成率
    this.addMetric({
      MetricName: 'SolomonConsensusRate',
      Value: metrics.consensusAchieved ? 1 : 0,
      Unit: StandardUnit.Count,
      Timestamp: timestamp,
      Dimensions: dimensions,
    });

    // 信頼度スコア
    this.addMetric({
      MetricName: 'SolomonConfidenceScore',
      Value: metrics.confidenceScore,
      Unit: StandardUnit.None,
      Timestamp: timestamp,
      Dimensions: dimensions,
    });

    // 投票結果の詳細
    this.addMetric({
      MetricName: 'SolomonVotingApproved',
      Value: metrics.votingResult.approved,
      Unit: StandardUnit.Count,
      Timestamp: timestamp,
      Dimensions: dimensions,
    });

    this.addMetric({
      MetricName: 'SolomonVotingRejected',
      Value: metrics.votingResult.rejected,
      Unit: StandardUnit.Count,
      Timestamp: timestamp,
      Dimensions: dimensions,
    });

    await this.flushMetrics();
  }

  /**
   * System Performance Metrics
   * 
   * システム全体のパフォーマンスメトリクスを送信します。
   * レスポンス時間、スループット、エラー率などを監視します。
   */
  async publishSystemMetrics(metrics: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    activeUsers: number;
  }): Promise<void> {
    const timestamp = new Date();
    const dimensions = [
      { Name: 'System', Value: 'MAGI' },
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' },
    ];

    const systemMetrics: MetricDatum[] = [
      {
        MetricName: 'SystemResponseTime',
        Value: metrics.responseTime,
        Unit: StandardUnit.Milliseconds,
        Timestamp: timestamp,
        Dimensions: dimensions,
      },
      {
        MetricName: 'SystemThroughput',
        Value: metrics.throughput,
        Unit: StandardUnit.Count_Second,
        Timestamp: timestamp,
        Dimensions: dimensions,
      },
      {
        MetricName: 'SystemErrorRate',
        Value: metrics.errorRate,
        Unit: StandardUnit.Percent,
        Timestamp: timestamp,
        Dimensions: dimensions,
      },
      {
        MetricName: 'ActiveUsers',
        Value: metrics.activeUsers,
        Unit: StandardUnit.Count,
        Timestamp: timestamp,
        Dimensions: dimensions,
      },
    ];

    this.metricsBuffer.push(...systemMetrics);
    await this.flushMetrics();
  }

  /**
   * Add metric to buffer
   * 
   * メトリクスをバッファに追加します。
   * バッチサイズに達すると自動的にフラッシュされます。
   */
  private addMetric(metric: MetricDatum): void {
    this.metricsBuffer.push(metric);
    
    if (this.metricsBuffer.length >= this.batchSize) {
      this.flushMetrics().catch(error => {
        console.error('Failed to flush metrics:', error);
      });
    }
  }

  /**
   * Flush metrics buffer to CloudWatch
   * 
   * バッファ内のメトリクスをCloudWatchに送信します。
   * エラーハンドリングとリトライ機能を含みます。
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToSend = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: metricsToSend,
      });

      await cloudWatchClient.send(command);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Sent ${metricsToSend.length} metrics to CloudWatch`);
      }
    } catch (error) {
      console.error('Failed to send metrics to CloudWatch:', error);
      // エラー時はメトリクスを再度バッファに戻す（簡単なリトライ機構）
      this.metricsBuffer.unshift(...metricsToSend);
    }
  }
}

/**
 * Structured Logger for CloudWatch Logs
 * 
 * CloudWatch Logsに構造化ログを送信するクラス。
 * 検索・分析しやすい形式でログを出力します。
 */
export class MAGIStructuredLogger {
  private readonly logGroupName = '/aws/magi-decision-ui';
  private readonly logStreamName: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logStreamName = `${process.env.NODE_ENV || 'development'}-${timestamp}`;
    this.ensureLogGroup();
  }

  /**
   * Log Agent Execution Event
   * 
   * エージェント実行イベントをログに記録します。
   * トレースIDと相関付けて、詳細な実行履歴を追跡できます。
   */
  async logAgentExecution(entry: {
    agentId: string;
    traceId: string;
    sessionId?: string;
    userId?: string;
    executionStart: Date;
    executionEnd: Date;
    success: boolean;
    error?: Error;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: entry.success ? 'INFO' : 'ERROR',
      service: 'magi-decision-ui',
      traceId: entry.traceId,
      sessionId: entry.sessionId ?? undefined,
      userId: entry.userId ?? undefined,
      component: `agent-${entry.agentId}`,
      message: `Agent execution ${entry.success ? 'completed' : 'failed'}`,
      metadata: {
        ...entry.metadata,
        executionDuration: entry.executionEnd.getTime() - entry.executionStart.getTime(),
        agentId: entry.agentId,
      },
      error: entry.error ? {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack ?? undefined,
      } : undefined,
    };

    await this.writeLog(logEntry);
  }

  /**
   * Log SOLOMON Evaluation Event
   * 
   * SOLOMON Judgeの評価イベントをログに記録します。
   * 判断プロセスの詳細を追跡できます。
   */
  async logSolomonEvaluation(entry: {
    traceId: string;
    sessionId?: string;
    userId?: string;
    agentResponses: any[];
    finalDecision: 'APPROVED' | 'REJECTED';
    confidenceScore: number;
    evaluationDuration: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'magi-decision-ui',
      traceId: entry.traceId,
      sessionId: entry.sessionId ?? undefined,
      userId: entry.userId ?? undefined,
      component: 'solomon-judge',
      message: `SOLOMON evaluation completed: ${entry.finalDecision}`,
      metadata: {
        ...entry.metadata,
        finalDecision: entry.finalDecision,
        confidenceScore: entry.confidenceScore,
        evaluationDuration: entry.evaluationDuration,
        agentResponseCount: entry.agentResponses.length,
      },
      error: undefined,
    };

    await this.writeLog(logEntry);
  }

  /**
   * Log System Error
   * 
   * システムエラーをログに記録します。
   * デバッグとトラブルシューティングに使用します。
   */
  async logError(error: Error, context: {
    traceId?: string;
    sessionId?: string;
    userId?: string;
    component: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'magi-decision-ui',
      traceId: context.traceId ?? undefined,
      sessionId: context.sessionId ?? undefined,
      userId: context.userId ?? undefined,
      component: context.component,
      message: error.message,
      metadata: context.metadata ?? undefined,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack ?? undefined,
      },
    };

    await this.writeLog(logEntry);
  }

  /**
   * Write log entry to CloudWatch Logs
   * 
   * ログエントリをCloudWatch Logsに書き込みます。
   * 構造化されたJSONフォーマットで出力されます。
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    try {
      const command = new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [{
          timestamp: Date.now(),
          message: JSON.stringify(entry),
        }],
      });

      await cloudWatchLogsClient.send(command);
    } catch (error) {
      // CloudWatch Logsへの書き込みに失敗した場合はコンソールにフォールバック
      console.error('Failed to write to CloudWatch Logs:', error);
      console.log('Log entry:', JSON.stringify(entry, null, 2));
    }
  }

  /**
   * Ensure log group exists
   * 
   * ロググループが存在することを確認し、必要に応じて作成します。
   */
  private async ensureLogGroup(): Promise<void> {
    try {
      await cloudWatchLogsClient.send(new CreateLogGroupCommand({
        logGroupName: this.logGroupName,
      }));
    } catch (error: any) {
      // ロググループが既に存在する場合はエラーを無視
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.warn('Failed to create log group:', error);
      }
    }

    try {
      await cloudWatchLogsClient.send(new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      }));
    } catch (error: any) {
      // ログストリームが既に存在する場合はエラーを無視
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.warn('Failed to create log stream:', error);
      }
    }
  }
}

/**
 * Singleton instances for global use
 * 
 * アプリケーション全体で使用するシングルトンインスタンス。
 * メモリ効率とパフォーマンスを最適化します。
 */
export const magiMetricsPublisher = new MAGIMetricsPublisher();
export const magiLogger = new MAGIStructuredLogger();

/**
 * Convenience functions for common operations
 * 
 * よく使用される操作のための便利関数。
 * コードの可読性と保守性を向上させます。
 */
export const logAgentExecution = magiLogger.logAgentExecution.bind(magiLogger);
export const logSolomonEvaluation = magiLogger.logSolomonEvaluation.bind(magiLogger);
export const logError = magiLogger.logError.bind(magiLogger);
export const publishAgentMetrics = magiMetricsPublisher.publishAgentMetrics.bind(magiMetricsPublisher);
export const publishSolomonMetrics = magiMetricsPublisher.publishSolomonMetrics.bind(magiMetricsPublisher);
export const publishSystemMetrics = magiMetricsPublisher.publishSystemMetrics.bind(magiMetricsPublisher);