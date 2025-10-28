/**
 * Bedrock Agent Gateway - ストリーミング対応版
 * 
 * みのるん氏の指摘を受けた修正版：
 * CDKを使ってLambda関数URLのストリーミングを直接設定
 */

import { defineFunction } from '@aws-amplify/backend';
import * as aws_lambda from 'aws-cdk-lib/aws-lambda';

export const bedrockAgentGateway = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 600,
  memoryMB: 2048,
  environment: {
    BEDROCK_REGION: 'us-east-1',
    SOLOMON_MODEL_ID: 'anthropic.claude-3-opus-20240229-v1:0',
    CASPAR_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    BALTHASAR_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    MELCHIOR_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    LOG_LEVEL: 'INFO',
  },
});

// CDKによるストリーミング対応（みのるん氏の回避策）
export function addStreamingSupport(backend: any) {
  const streamingFunctionUrl = new aws_lambda.CfnUrl(
    backend.stack, 
    'MAGIStreamingFunctionUrl', 
    {
      targetFunctionArn: backend.bedrockAgentGateway.resources.lambda.functionArn,
      authType: 'AWS_IAM', // セキュリティ考慮
      invokeMode: 'RESPONSE_STREAM', // ストリーミング有効化
      cors: {
        allowOrigins: ['*'], // 本番では制限必要
        allowMethods: ['POST'],
        allowHeaders: [
          'content-type',
          'authorization', 
          'accept',
          'x-access-token'
        ],
      }
    }
  );

  return streamingFunctionUrl;
}