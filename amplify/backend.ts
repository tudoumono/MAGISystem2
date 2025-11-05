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
 * - magiStrandsAgents: Strands Agents統合Lambda関数
 *
 * アーキテクチャ:
 * - AgentCore Runtime: agents/magi_agent.py（本番環境）
 * - Strands Agents: 全エージェント統合実装
 * - エラーハンドリング: リトライ機構と段階的機能縮退
 *
 * 学習ポイント:
 * - Amplify Gen2でのリソース統合
 * - Strands Agents SDK使用
 * - Lambda Response Streamingの実装
 * - エラーハンドリングとリトライ機構
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

// Note: このLambda関数は参考記事のアーキテクチャでは使用されません
// 参考記事: https://qiita.com/moritalous/items/ea695f8a328585e1313b
// 実装方針: AgentCore Runtime内でNext.jsバックエンドを作成し、
//          そこから既存のPython magi_agent.pyを呼び出す

export default backend;