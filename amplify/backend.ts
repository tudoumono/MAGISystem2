import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { bedrockAgentGateway } from './functions/bedrock-agent-gateway/resource';

/**
 * Amplify Gen2 Backend Configuration
 * 
 * このファイルはMAGI Decision SystemのAmplify Gen2バックエンド設定です。
 * 
 * 構成要素:
 * - auth: Cognito認証設定
 * - data: DynamoDB + GraphQL API設定
 * - bedrockAgentGateway: Bedrock Multi-Agent Collaboration統合
 * 
 * 学習ポイント:
 * - Amplify Gen2でのリソース統合
 * - カスタム関数の追加方法
 * - 環境変数とIAM権限の管理
 */
const backend = defineBackend({
  auth,
  data,
  bedrockAgentGateway,
});

/**
 * カスタムAPI エンドポイントの追加
 * 
 * 設計理由:
 * - Bedrock Multi-Agent Collaborationへの専用エンドポイント
 * - 既存のGraphQL APIとの分離
 * - REST APIによる柔軟な統合
 * 
 * 学習ポイント:
 * - API Gatewayとの統合
 * - Lambda関数のトリガー設定
 * - CORS設定とセキュリティ
 */
backend.bedrockAgentGateway.addEnvironment({
  // Amplify Data/AI Kitとの統合
  AMPLIFY_DATA_ENDPOINT: backend.data.url,
  AMPLIFY_DATA_REGION: backend.data.region,
  
  // 認証統合
  AMPLIFY_AUTH_USER_POOL_ID: backend.auth.resources.userPool.userPoolId,
  AMPLIFY_AUTH_USER_POOL_CLIENT_ID: backend.auth.resources.userPoolClient.userPoolClientId,
  
  // 環境識別
  AMPLIFY_ENVIRONMENT: process.env.NODE_ENV || 'development',
});

/**
 * API Gateway統合の設定
 * 
 * 注意: 実際のAPI Gateway統合は、Amplify Gen2の今後のアップデートで
 * より詳細な設定が可能になる予定です。
 * 現在は、Lambda関数URLまたは手動でのAPI Gateway設定が必要です。
 */

export default backend;