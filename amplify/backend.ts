import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { bedrockAgentGateway, addStreamingSupport } from './functions/bedrock-agent-gateway/resource';

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
 * - Lambda Response Streamingの設定（みのるん氏のアプローチ）
 */
const backend = defineBackend({
  auth,
  data,
  bedrockAgentGateway,
});

/**
 * Lambda Response Streamingサポートの追加
 *
 * みのるん氏のアプローチを採用：
 * CDKで直接Lambda関数URLを作成し、RESPONSE_STREAMモードを有効化します。
 * これにより、AgentCore Runtimeからのストリーミングレスポンスを
 * リアルタイムでフロントエンドに転送できます。
 *
 * 参考: https://qiita.com/moritalous/items/ea695f8a328585e1313b
 */
const streamingFunctionUrl = addStreamingSupport(backend);

// ストリーミングURL出力（デプロイ後に確認できるように）
console.log('MAGI Streaming Function URL will be created');

export default backend;