/**
 * Bedrock Multi-Agent Collaboration Gateway Function Resource
 * 
 * このファイルはAmazon Bedrock Multi-Agent Collaboration（2025年GA版）との統合を行う
 * カスタムLambda関数のリソース定義です。
 * 
 * 主要機能:
 * - SOLOMON Supervisor Agent（統括者）の実装
 * - 3賢者Sub-Agents（CASPAR、BALTHASAR、MELCHIOR）の実装と連携
 * - Inline AgentsとPayload Referencingの活用
 * - エージェントオーケストレーションと応答集約
 * 
 * 学習ポイント:
 * - Amplify Gen2でのBedrock統合
 * - Multi-Agent Collaborationパターンの実装
 * - 2025年GA機能の活用方法
 */

import { defineFunction } from '@aws-amplify/backend';

/**
 * Bedrock Multi-Agent Collaboration Gateway関数の定義
 * 
 * 設計理由:
 * - runtime: Node.js 20.x（Bedrock Multi-Agent Collaboration対応）
 * - timeout: 10分（複数エージェントの協調実行時間を考慮）
 * - memoryMB: 2048MB（Supervisor + 3 Sub-Agentsの並列実行に対応）
 * - environment: Bedrock Multi-Agent Collaboration用の環境変数
 */
export const bedrockAgentGateway = defineFunction({
  /**
   * ランタイム設定
   * 
   * 学習ポイント:
   * - entry: ハンドラーファイルのパス
   * - timeout: 600秒 - Multi-Agent Collaborationの実行時間を考慮
   * - memoryMB: 2048MB - Supervisor + Sub-Agentsの並列実行に必要なメモリ
   */
  entry: './handler.ts',
  timeoutSeconds: 600, // 10分
  memoryMB: 2048,
  
  /**
   * 環境変数の設定
   * 
   * 学習ポイント:
   * - Bedrock Multi-Agent Collaboration 2025年GA版の設定
   * - Supervisor AgentとSub-Agentsの設定
   * - Inline AgentsとPayload Referencingの設定
   */
  environment: {
    // Amazon Bedrock AgentCore Runtime設定
    BEDROCK_REGION: 'ap-northeast-1',
    MAGI_AGENT_ID: 'magi_agent-4ORNam2cHb',
    MAGI_AGENT_ALIAS_ID: 'TSTALIASID',
    
    // SOLOMON Supervisor Agent設定
    SOLOMON_SUPERVISOR_AGENT_ID: 'solomon-supervisor-v1',
    SOLOMON_MODEL_ID: 'anthropic.claude-3-opus-20240229-v1:0',
    SOLOMON_TEMPERATURE: '0.4',
    SOLOMON_MAX_TOKENS: '2000',
    
    // Sub-Agents設定（3賢者）
    CASPAR_AGENT_ID: 'caspar-conservative-v1',
    CASPAR_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    CASPAR_TEMPERATURE: '0.3',
    CASPAR_MAX_TOKENS: '1500',
    
    BALTHASAR_AGENT_ID: 'balthasar-innovative-v1',
    BALTHASAR_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    BALTHASAR_TEMPERATURE: '0.7',
    BALTHASAR_MAX_TOKENS: '1500',
    
    MELCHIOR_AGENT_ID: 'melchior-balanced-v1',
    MELCHIOR_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    MELCHIOR_TEMPERATURE: '0.5',
    MELCHIOR_MAX_TOKENS: '1500',
    
    // Multi-Agent Collaboration機能設定（2025年GA版）
    INLINE_AGENTS_ENABLED: 'true',
    PAYLOAD_REFERENCING_ENABLED: 'true',
    AGENT_ORCHESTRATION_MODE: 'supervisor_delegated',
    
    // OpenTelemetry設定
    OTEL_SERVICE_NAME: 'magi-bedrock-gateway',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'https://api.honeycomb.io',
    
    // ログレベル設定
    LOG_LEVEL: 'INFO',
    
    // パフォーマンス設定
    AGENT_EXECUTION_TIMEOUT: '120000', // 2分
    PARALLEL_EXECUTION_ENABLED: 'true',
    RESPONSE_STREAMING_ENABLED: 'true',
  },
});

/**
 * 必要なIAM権限（2025年GA版対応）:
 * 
 * Amazon Bedrock Multi-Agent Collaboration用の権限:
 * - bedrock:InvokeAgent
 * - bedrock:InvokeAgentWithResponseStream
 * - bedrock:CreateAgentCollaboration
 * - bedrock:GetAgentCollaboration
 * - bedrock:ListAgentCollaborations
 * - bedrock:InvokeMultiAgentCollaboration
 * 
 * Inline Agents用の権限:
 * - bedrock:CreateInlineAgent
 * - bedrock:InvokeInlineAgent
 * - bedrock:DeleteInlineAgent
 * 
 * Payload Referencing用の権限:
 * - bedrock:CreatePayloadReference
 * - bedrock:GetPayloadReference
 * - bedrock:DeletePayloadReference
 * 
 * 基本的なLambda権限:
 * - logs:CreateLogGroup
 * - logs:CreateLogStream
 * - logs:PutLogEvents
 * - xray:PutTraceSegments
 * - xray:PutTelemetryRecords
 * 
 * 注意: 実際の権限設定は、Human側でIAMユーザーに
 * AmazonBedrockFullAccess権限を追加する必要があります。
 */