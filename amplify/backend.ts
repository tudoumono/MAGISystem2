import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
// import { bedrockAgentGateway } from './functions/bedrock-agent-gateway/resource';

/**
 * Amplify Gen2 Backend Configuration
 *
 * このファイルはMAGI Decision SystemのAmplify Gen2バックエンド設定です。
 *
 * 構成要素:
 * - auth: Cognito認証設定
 * - data: DynamoDB + GraphQL API設定
 * - bedrockAgentGateway: Bedrock Agent Runtime統合Lambda関数（一時的に無効化）
 *
 * 学習ポイント:
 * - Amplify Gen2でのリソース統合
 * - 基本的なバックエンド設定
 * - 認証とデータの統合
 * - Lambda関数の統合
 */
const backend = defineBackend({
  auth,
  data,
  // bedrockAgentGateway, // 一時的に無効化
});

export default backend;