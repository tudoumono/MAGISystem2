/**
 * Bedrock Agent Streaming Lambda Function Resource
 * 
 * Lambda Response Streamingを有効にしたLambda関数の定義
 */

import { defineFunction } from '@aws-amplify/backend';

export const bedrockAgentStreaming = defineFunction({
  name: 'bedrock-agent-streaming',
  entry: './handler.ts',
  timeoutSeconds: 600,
  memoryMB: 2048,
  environment: {
    BEDROCK_REGION: 'ap-northeast-1',
  },
});
