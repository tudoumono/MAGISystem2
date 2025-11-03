/**
 * MAGI Python Agents Lambda Function Resource
 * 
 * Strands Agentsを使用したPython実装のLambda関数
 * Amplify Gen2はPythonランタイムを完全サポート
 */

import { defineFunction } from '@aws-amplify/backend';

export const magiPythonAgents = defineFunction({
  entry: './handler.py',
  timeoutSeconds: 600, // 10分
  memoryMB: 2048,
  environment: {
    // Bedrock設定
    BEDROCK_REGION: 'ap-northeast-1',
    // Strands Agents設定
    STRANDS_MODEL: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  },
});