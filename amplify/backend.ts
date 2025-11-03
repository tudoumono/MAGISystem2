import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { bedrockAgentStreaming } from './functions/bedrock-agent-streaming/resource';
import { magiPythonAgents } from './functions/magi-python-agents/resource';

/**
 * Amplify Gen2 Backend Configuration
 *
 * このファイルはMAGI Decision SystemのAmplify Gen2バックエンド設定です。
 *
 * 構成要素:
 * - auth: Cognito認証設定
 * - data: DynamoDB + GraphQL API設定
 * - bedrockAgentStreaming: Bedrock Agent Streaming Lambda関数
 *
 * バックエンドAPI:
 * - Next.js API Routes (/api/*) を使用
 * - Amplify Hostingが自動的にLambda関数として最適化
 * - Lambda Response Streamingによるリアルタイム配信
 *
 * 学習ポイント:
 * - Amplify Gen2でのリソース統合
 * - 基本的なバックエンド設定
 * - 認証とデータの統合
 * - Next.js API RoutesとAmplifyの統合
 * - Lambda Response Streamingの実装
 */
const backend = defineBackend({
  auth,
  data,
  bedrockAgentStreaming,
  magiPythonAgents,
});

// Lambda関数URLとResponse Streamingを有効化
// Note: Amplify Gen2では手動設定が必要。デプロイ後に以下のコマンドを実行:
//
// 1. Function URLを作成:
// aws lambda create-function-url-config \
//   --function-name amplify-d34f7t08qc7jiy-ma-bedrockagentstreaminglam-PJ8OPi3YSqwc \
//   --auth-type NONE \
//   --cors '{"AllowCredentials":false,"AllowHeaders":["*"],"AllowMethods":["POST"],"AllowOrigins":["*"],"MaxAge":86400}' \
//   --region ap-northeast-1
//
// 2. Response Streamingを有効化:
// aws lambda update-function-configuration \
//   --function-name amplify-d34f7t08qc7jiy-ma-bedrockagentstreaminglam-PJ8OPi3YSqwc \
//   --invoke-mode RESPONSE_STREAM \
//   --region ap-northeast-1

export default backend;