import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { bedrockAgentStreaming } from './functions/bedrock-agent-streaming/resource';

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
});

// Lambda関数URLを有効化（ストリーミング用）
// Note: デプロイ後にAWS CLIで以下のコマンドを実行してストリーミングを有効化:
// aws lambda update-function-configuration \
//   --function-name <function-name> \
//   --invoke-mode RESPONSE_STREAM

export default backend;