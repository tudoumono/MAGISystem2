/**
 * AWS Amplify Gen2 Backend Configuration
 * 
 * このファイルはAmplify Gen2の新しい設定方式を使用して、
 * MAGI Decision SystemのAWSバックエンドリソースを定義します。
 * 
 * 学習ポイント:
 * - Amplify Gen2では、backend.tsファイルでリソースを定義
 * - TypeScriptベースの設定により、型安全性を確保
 * - 認証、データ、関数を統合的に管理
 */

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { agentGateway } from './functions/agent-gateway/resource';

/**
 * Amplify バックエンドの定義
 * 
 * 設計理由:
 * - auth: Amazon Cognito による認証システム
 * - data: DynamoDB + AppSync による データ管理とリアルタイム通信
 * - agentGateway: Amazon Bedrock との統合用カスタム関数
 * 
 * 各リソースは独立したファイルで定義し、保守性を向上
 */
const backend = defineBackend({
  auth,
  data,
  agentGateway,
});

/**
 * データリソースへの追加権限設定
 * 
 * 学習ポイント:
 * - agentGateway関数がデータリソースにアクセスできるよう権限付与
 * - Amplify Gen2では、リソース間の権限管理が簡潔に記述可能
 */
backend.data.addDynamoDbDataSource('AgentGatewayDataSource', backend.agentGateway);

/**
 * 環境変数の設定
 * 
 * 学習ポイント:
 * - Lambda関数で使用する環境変数を設定
 * - データソースのテーブル名やAPIエンドポイントを動的に取得
 */
backend.agentGateway.addEnvironment('DATA_API_ENDPOINT', backend.data.graphqlUrl);
backend.agentGateway.addEnvironment('DATA_API_KEY', backend.data.apiKey);

export default backend;