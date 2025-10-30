import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * Amplify Gen2 Backend Configuration
 *
 * このファイルはMAGI Decision SystemのAmplify Gen2バックエンド設定です。
 *
 * 構成要素:
 * - auth: Cognito認証設定
 * - data: DynamoDB + GraphQL API設定
 *
 * バックエンドAPI:
 * - Next.js API Routes (/api/*) を使用
 * - Amplify Hostingが自動的にLambda関数として最適化
 *
 * 学習ポイント:
 * - Amplify Gen2でのリソース統合
 * - 基本的なバックエンド設定
 * - 認証とデータの統合
 * - Next.js API RoutesとAmplifyの統合
 */
const backend = defineBackend({
  auth,
  data,
});

export default backend;