import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { magiStrandsAgents } from './functions/magi-strands-agents/resource';

/**
 * Amplify Gen2 Backend Configuration
 *
 * このファイルはMAGI Decision SystemのAmplify Gen2バックエンド設定です。
 *
 * 構成要素:
 * - auth: Cognito認証設定
 * - data: DynamoDB + GraphQL API設定（UserSettings含む）
 * - bedrockAgentStreaming: Bedrock Agent Streaming Lambda関数
 * - magiPythonAgents: Strands Agents統合Lambda関数（Web検索対応）
 *
 * Web検索統合:
 * - Strands AgentsのネイティブTavilyツール使用
 * - ユーザーごとのAPIキー管理
 * - エラー時の自動フォールバック
 *
 * 学習ポイント:
 * - Amplify Gen2でのリソース統合
 * - Strands Agents + Tavily統合
 * - ユーザー設定管理
 * - Lambda Response Streamingの実装
 */
const backend = defineBackend({
  auth,
  data,
  magiStrandsAgents,
});

// Bedrockへのアクセス権限を付与
backend.magiStrandsAgents.resources.lambda.addToRolePolicy(
  new (await import('aws-cdk-lib/aws-iam')).PolicyStatement({
    actions: [
      'bedrock:InvokeModel',
      'bedrock:InvokeModelWithResponseStream',
    ],
    resources: [
      'arn:aws:bedrock:ap-northeast-1::foundation-model/*',
      'arn:aws:bedrock:us-east-1::foundation-model/*',
    ],
  })
);

// Lambda関数URLとResponse Streamingを有効化
// Note: Amplify Gen2では手動設定が必要。デプロイ後に以下のコマンドを実行:
//
// 1. Function URLを作成:
// aws lambda create-function-url-config \
//   --function-name <function-name> \
//   --auth-type NONE \
//   --cors '{"AllowCredentials":false,"AllowHeaders":["*"],"AllowMethods":["POST"],"AllowOrigins":["*"],"MaxAge":86400}' \
//   --region ap-northeast-1
//
// 2. Response Streamingを有効化:
// aws lambda update-function-configuration \
//   --function-name <function-name> \
//   --invoke-mode RESPONSE_STREAM \
//   --region ap-northeast-1

export default backend;