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
 * - data: DynamoDB + GraphQL API設定（UserSettings含む）
 *
 * アーキテクチャ:
 * - Frontend (Amplify): Next.js UI
 * - AgentCore Runtime (Docker): backend/app/invocations, backend/app/ping
 * - Python Agent: backend/magi_agent.py (Strands Agents)
 * - フロー: Frontend → AgentCore Runtime → Python Agent → Bedrock
 *
 * 参考記事: https://qiita.com/moritalous/items/ea695f8a328585e1313b
 * 実装方針: Next.js API RoutesからPython magi_agent.pyを直接呼び出す
 *
 * 学習ポイント:
 * - Amplify Gen2でのシンプルなリソース構成
 * - Next.js統合バックエンド（Lambda不要）
 * - AgentCore Runtimeによる柔軟なエージェント管理
 */
const backend = defineBackend({
  auth,
  data,
});

export default backend;