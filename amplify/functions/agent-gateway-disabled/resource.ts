/**
 * Agent Gateway Function Resource
 * 
 * このファイルはAmazon Bedrock AgentCoreとStrands Agentsとの統合を行う
 * カスタムLambda関数のリソース定義です。
 * 
 * 学習ポイント:
 * - Amplify Gen2でのカスタム関数定義
 * - Amazon Bedrockとの統合設定
 * - 環境変数とIAM権限の管理
 */

import { defineFunction } from '@aws-amplify/backend';

/**
 * エージェントゲートウェイ関数の定義
 * 
 * 設計理由:
 * - runtime: Node.js 20.x（最新の安定版）
 * - timeout: 5分（エージェント実行の時間を考慮）
 * - memoryMB: 1024MB（複数エージェントの並列実行に対応）
 * - environment: 必要な環境変数を設定
 */
export const agentGateway = defineFunction({
  /**
   * ランタイム設定
   * 
   * 学習ポイント:
   * - entry: ハンドラーファイルのパス
   * - timeout: 300秒 - エージェント実行時間を考慮した設定
   * - memoryMB: 1024MB - 複数エージェントの並列実行に必要なメモリ
   * 
   * 注意: Amplify Gen2では、runtimeとnameプロパティは自動設定される
   */
  entry: './handler.ts',
  timeoutSeconds: 300, // 5分
  memoryMB: 1024,
  
  /**
   * 環境変数の設定
   * 
   * 学習ポイント:
   * - 環境変数は実行時に動的に設定される
   * - backend.tsで追加の環境変数を設定可能
   */
  environment: {
    // Amazon Bedrock設定
    BEDROCK_REGION: 'us-east-1',
    BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    
    // Strands Agents設定（将来の統合用）
    STRANDS_AGENTS_ENDPOINT: 'https://api.strands-agents.example.com',
    
    // OpenTelemetry設定
    OTEL_SERVICE_NAME: 'magi-agent-gateway',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'https://api.honeycomb.io',
    
    // ログレベル設定
    LOG_LEVEL: 'INFO',
  },
});

/**
 * IAM権限の設定
 * 
 * 学習ポイント:
 * - Amazon Bedrockへのアクセス権限
 * - CloudWatch Logsへの書き込み権限
 * - X-Rayトレーシング権限
 * - DynamoDBアクセス権限（データ保存用）
 * 
 * セキュリティ考慮:
 * - 最小権限の原則に従い、必要な権限のみを付与
 * - リソースレベルでの権限制御を実装
 */

// 注意: 実際のIAM権限設定は、Amplify Gen2の今後のアップデートで
// より詳細な設定が可能になる予定です。
// 現在は、Lambda実行ロールに必要な権限を手動で追加する必要があります。

/**
 * 必要なIAM権限（参考）:
 * 
 * {
 *   "Version": "2012-10-17",
 *   "Statement": [
 *     {
 *       "Effect": "Allow",
 *       "Action": [
 *         "bedrock:InvokeModel",
 *         "bedrock:InvokeModelWithResponseStream"
 *       ],
 *       "Resource": "arn:aws:bedrock:*:*:foundation-model/*"
 *     },
 *     {
 *       "Effect": "Allow",
 *       "Action": [
 *         "logs:CreateLogGroup",
 *         "logs:CreateLogStream",
 *         "logs:PutLogEvents"
 *       ],
 *       "Resource": "arn:aws:logs:*:*:*"
 *     },
 *     {
 *       "Effect": "Allow",
 *       "Action": [
 *         "xray:PutTraceSegments",
 *         "xray:PutTelemetryRecords"
 *       ],
 *       "Resource": "*"
 *     }
 *   ]
 * }
 */