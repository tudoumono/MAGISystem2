/**
 * AgentCore Runtime用チャット処理エンドポイント
 * 
 * このファイルはAmplify Hostingのストリーミング制限を回避するため、
 * AgentCore RuntimeにデプロイされるバックエンドAPIとして機能します。
 * 
 * 主要機能:
 * - Bedrock経由でのAIストリーミングレスポンス
 * - CORS対応
 * - エラーハンドリング
 * 
 * 参考: https://qiita.com/moritalous/items/ea695f8a328585e1313b
 */

import { streamText } from 'ai';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // AWS認証設定（IAMロールベース）
    const credentials = fromNodeProviderChain({
      clientConfig: { region: process.env.AWS_REGION || 'ap-northeast-1' }
    });

    // Bedrock Anthropic Claudeモデル設定
    const model = bedrock('anthropic.claude-3-5-sonnet-20241022-v2:0', {
      credentials
    });

    const result = await streamText({
      model,
      messages,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in invocations API:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amzn-Trace-Id, X-Amzn-Bedrock-AgentCore-Runtime-Session-Id',
    },
  });
}
