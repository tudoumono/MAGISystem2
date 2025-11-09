import { defineFunction } from '@aws-amplify/backend';

/**
 * MAGI Strands Agents - Python実装
 *
 * AWS Strands Agentsフレームワークを使用した
 * 3賢者（CASPAR、BALTHASAR、MELCHIOR）+ SOLOMON Judgeの実装
 *
 * Note: Python runtime support will be configured at deployment time
 */
export const magiStrandsAgents = defineFunction({
  entry: './handler.py',
  // Runtime will be auto-detected from file extension at deployment
  timeoutSeconds: 600,
  memoryMB: 3008,
  environment: {
    BEDROCK_REGION: 'ap-northeast-1',
    DEFAULT_MODEL: 'anthropic.claude-3-haiku-20240307-v1:0',
    LOG_LEVEL: 'INFO',
  },
});
