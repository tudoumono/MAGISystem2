/**
 * Bedrock Agent Streaming Lambda Function Resource
 * 
 * Lambda Response Streamingを有効にしたLambda関数の定義
 */

import { defineFunction } from '@aws-amplify/backend';

export const bedrockAgentStreaming = defineFunction({
  name: 'bedrock-agent-streaming',
  entry: './handler.ts',
  timeoutSeconds: 600, // 10分（長時間実行対応）
  memoryMB: 2048,
  environment: {
    // Bedrock設定
    BEDROCK_REGION: 'ap-northeast-1',
    // エージェント設定（Phase 3で設定）
    // AGENT_ID: 'your-agent-id',
    // AGENT_ALIAS_ID: 'your-agent-alias-id',
  },
  // Lambda Response Streaming設定
  // Note: Amplify Gen2では現在invokeMode設定が直接サポートされていないため、
  // デプロイ後にAWS CLIまたはコンソールで手動設定が必要
  // aws lambda update-function-configuration \
  //   --function-name <function-name> \
  //   --invoke-mode RESPONSE_STREAM
});
