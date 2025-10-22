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
// import { agentGateway } from './functions/agent-gateway/resource';

/**
 * Amplify バックエンドの定義
 * 
 * 設計理由:
 * - auth: Amazon Cognito による認証システム
 * - data: DynamoDB + AppSync による データ管理とリアルタイム通信
 * 
 * 各リソースは独立したファイルで定義し、保守性を向上
 * 
 * 注意: agentGateway関数は Phase 3以降で追加予定
 */
const backend = defineBackend({
  auth,
  data,
});

/**
 * 将来の拡張予定
 * 
 * Phase 3以降で以下の機能を追加:
 * - agentGateway関数の統合
 * - Amazon Bedrockとの連携
 * - Strands Agentsとの統合
 * 
 * 現在はauth + dataの基本構成でデプロイを行います
 */

export default backend;