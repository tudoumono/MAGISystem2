import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
// import { bedrockAgentGateway } from './functions/bedrock-agent-gateway/resource';
// import * as aws_lambda from 'aws-cdk-lib/aws-lambda';

/**
 * Amplify Gen2 Backend Configuration
 *
 * このファイルはMAGI Decision SystemのAmplify Gen2バックエンド設定です。
 *
 * 構成要素:
 * - auth: Cognito認証設定
 * - data: DynamoDB + GraphQL API設定
 * - bedrockAgentGateway: Bedrock Agent Runtime統合Lambda関数（一時的にコメントアウト）
 *
 * 学習ポイント:
 * - Amplify Gen2でのリソース統合
 * - 基本的なバックエンド設定
 * - 認証とデータの統合
 */
const backend = defineBackend({
  auth,
  data,
  // bedrockAgentGateway,
});

/**
 * Lambda Response Streamingサポートの追加
 * 
 * 一時的にコメントアウト - bedrockAgentGatewayのビルドエラーを調査中
 */
// const streamingFunctionUrl = new aws_lambda.CfnUrl(
//   backend.bedrockAgentGateway.resources.lambda.stack,
//   'MAGIStreamingFunctionUrl',
//   {
//     targetFunctionArn: backend.bedrockAgentGateway.resources.lambda.functionArn,
//     authType: 'AWS_IAM',
//     invokeMode: 'RESPONSE_STREAM',
//     cors: {
//       allowOrigins: ['*'],
//       allowMethods: ['POST'],
//       allowHeaders: [
//         'content-type',
//         'authorization',
//         'accept',
//         'x-access-token',
//         'x-amz-date',
//         'x-amz-security-token',
//       ],
//       maxAge: 3600,
//     },
//   }
// );

// console.log('MAGI Streaming Function URL will be created');

export default backend;