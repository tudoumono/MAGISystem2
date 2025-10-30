import { defineFunction } from '@aws-amplify/backend';

export const bedrockAgentGateway = defineFunction({
  name: 'bedrock-agent-gateway',
  entry: './handler.ts',
  timeoutSeconds: 600,
  memoryMB: 2048,
  environment: {
    BEDROCK_REGION: 'ap-northeast-1',
    MAGI_AGENT_ID: 'magi_agent-4ORNam2cHb',
    MAGI_AGENT_ALIAS_ID: 'TSTALIASID',
    LOG_LEVEL: 'INFO',
  },
});
