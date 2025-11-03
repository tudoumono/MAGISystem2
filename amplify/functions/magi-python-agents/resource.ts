import { defineFunction } from '@aws-amplify/backend';

export const magiPythonAgents = defineFunction({
  name: 'magi-python-agents',
  entry: './handler.ts',
  timeoutSeconds: 600,
  memoryMB: 2048,
  environment: {
    BEDROCK_REGION: 'ap-northeast-1',
    STRANDS_MODEL: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  },
});
