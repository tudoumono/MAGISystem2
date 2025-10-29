import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { bedrockAgentGateway } from './functions/bedrock-agent-gateway/resource';
import * as aws_lambda from 'aws-cdk-lib/aws-lambda';

/**
 * Amplify Gen2 Backend Configuration
 *
 * このファイルはMAGI Decision SystemのAmplify Gen2バックエンド設定です。
 *
 * 構成要素:
 * - auth: Cognito認証設定
 * - data: DynamoDB + GraphQL API設定
 * - bedrockAgentGateway: Bedrock Agent Runtime統合Lambda関数（ストリーミング対応）
 *
 * 学習ポイント:
 * - Amplify Gen2でのリソース統合
 * - 基本的なバックエンド設定
 * - 認証とデータの統合
 * - Lambda関数の統合
 * - Lambda Function URLによるストリーミング対応（みのるん氏の指摘への対応）
 */
const backend = defineBackend({
  auth,
  data,
  bedrockAgentGateway,
});

/**
 * Lambda Function URLでストリーミング対応を追加
 *
 * みのるん氏の指摘への対応:
 * AmplifyのdefineFunction()では RESPONSE_STREAM を設定できないため、
 * CDKを直接使用してストリーミングを有効化します。
 *
 * これにより、AgentCore Runtimeからのストリーミングレスポンスを
 * フロントエンドまで途切れずに配信できます。
 */
const streamingFunctionUrl = new aws_lambda.CfnUrl(
  backend.stack,
  'MAGIStreamingFunctionUrl',
  {
    targetFunctionArn: backend.bedrockAgentGateway.resources.lambda.functionArn,
    authType: 'AWS_IAM', // Cognitoと統合可能
    invokeMode: 'RESPONSE_STREAM', // ストリーミング有効化
    cors: {
      allowOrigins: ['*'], // TODO: 本番では制限必要
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

// Function URLをエクスポート（フロントエンドから参照可能にする）
backend.addOutput({
  custom: {
    streamingFunctionUrl: streamingFunctionUrl.attrFunctionUrl,
  }
});

export default backend;