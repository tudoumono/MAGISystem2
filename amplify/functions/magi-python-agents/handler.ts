/**
 * MAGI Bedrock Streaming Handler
 * 
 * Amazon Bedrockを使用してMAGI Decision Systemを実装
 * Lambda Response Streamingでリアルタイム応答を提供
 */

import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { Context } from 'aws-lambda';

// Lambda Response Streaming用の型定義
declare const awslambda: {
  streamifyResponse: (
    handler: (event: any, responseStream: any, context: Context) => Promise<void>
  ) => any;
};

// Bedrock クライアント
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'ap-northeast-1',
});

// テスト用モデル（低価格）
const TEST_MODEL = 'anthropic.claude-3-haiku-20240307-v1:0';
// 本番用モデル
const PROD_MODEL = 'anthropic.claude-3-5-sonnet-20240620-v1:0';

// 環境変数でモデルを切り替え（デフォルトはテスト用）
const MODEL_ID = process.env.USE_PROD_MODEL === 'true' ? PROD_MODEL : TEST_MODEL;

interface AgentConfig {
  id: string;
  name: string;
  type: string;
  systemPrompt: string;
}

const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'melchior',
    name: 'MELCHIOR',
    type: 'バランス型',
    systemPrompt: `あなたはMELCHIOR - MAGI Decision Systemのバランス型・科学的な賢者です。

判断基準:
1. データと統計的根拠
2. 論理的整合性
3. 多角的視点の統合
4. 科学的手法の適用

以下のJSON形式で回答してください：
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}`,
  },
  {
    id: 'caspar',
    name: 'CASPAR',
    type: '保守型',
    systemPrompt: `あなたはCASPAR - MAGI Decision Systemの保守的・現実的な賢者です。

判断基準:
1. 安全性と既存システムへの影響
2. 実現可能性と必要リソース
3. 過去の実績と成功事例
4. リスクと回復可能性

以下のJSON形式で回答してください：
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}`,
  },
  {
    id: 'balthasar',
    name: 'BALTHASAR',
    type: '革新型',
    systemPrompt: `あなたはBALTHASAR - MAGI Decision Systemの革新的・感情的な賢者です。

判断基準:
1. 革新性と創造的価値
2. 人間的価値と倫理的側面
3. 感情的・直感的要素
4. 新しい可能性の創造

以下のJSON形式で回答してください：
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}`,
  },
];

/**
 * SSEイベントを送信
 */
function sendEvent(
  stream: any,
  type: string,
  agentId?: string,
  data?: any
): void {
  const event = {
    type,
    agentId,
    data: data || {},
  };
  stream.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * Bedrockでエージェントを実行
 */
async function consultAgent(
  agent: AgentConfig,
  question: string,
  stream: any
): Promise<any> {
  console.log(`Consulting ${agent.name}...`);

  // エージェント開始イベント
  sendEvent(stream, 'agent_start', agent.id, {
    name: agent.name,
    type: agent.type,
  });

  const startTime = Date.now();

  try {
    // Bedrock呼び出し（AWS公式ドキュメント準拠）
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        temperature: 0.7,
        system: agent.systemPrompt,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: question }],
          },
        ],
      }),
    });

    const response = await bedrockClient.send(command);
    let fullText = '';
    let thinkingText = '';

    // ストリーミングレスポンスを処理
    if (response.body) {
      // @ts-ignore - AWS SDK型定義の問題を回避
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const chunk = JSON.parse(
            new TextDecoder().decode(event.chunk.bytes)
          );

          if (chunk.type === 'content_block_delta') {
            const text = chunk.delta?.text || '';
            fullText += text;

            // 思考プロセスとして表示
            if (fullText.length < 100) {
              thinkingText += text;
              sendEvent(stream, 'agent_thinking', agent.id, {
                text: thinkingText,
              });
            } else {
              // 実際の応答として表示
              sendEvent(stream, 'agent_chunk', agent.id, {
                text,
              });
            }
          }
        }
      }
    }

    const executionTime = Date.now() - startTime;

    // 応答を解析
    const parsed = parseAgentResponse(fullText, agent.id);

    // エージェント完了イベント
    sendEvent(stream, 'agent_complete', agent.id, {
      decision: parsed.decision,
      confidence: parsed.confidence,
      executionTime,
    });

    return parsed;
  } catch (error) {
    console.error(`Error consulting ${agent.name}:`, error);

    // エラー時のフォールバック
    sendEvent(stream, 'agent_complete', agent.id, {
      decision: 'REJECTED',
      confidence: 0.0,
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      decision: 'REJECTED',
      confidence: 0.0,
      reasoning: 'エラーが発生しました',
    };
  }
}

/**
 * エージェント応答を解析
 */
function parseAgentResponse(text: string, agentId: string): any {
  try {
    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn(`Failed to parse JSON from ${agentId}:`, e);
  }

  // フォールバック解析
  const textLower = text.toLowerCase();
  const decision =
    textLower.includes('approved') || textLower.includes('可決')
      ? 'APPROVED'
      : 'REJECTED';

  return {
    decision,
    reasoning: text.substring(0, 150),
    confidence: 0.6,
    analysis: text,
  };
}

/**
 * SOLOMON Judgeを実行
 */
async function executeSolomonJudge(
  agentResponses: any[],
  question: string,
  stream: any
): Promise<void> {
  console.log('Executing SOLOMON Judge...');

  sendEvent(stream, 'judge_start', undefined, {
    name: 'SOLOMON JUDGE',
  });

  // 投票結果を集計
  const approved = agentResponses.filter((r) => r.decision === 'APPROVED').length;
  const rejected = agentResponses.length - approved;

  const judgePrompt = `あなたはSOLOMON Judge - MAGI Decision Systemの統括AIです。

3賢者の判断結果:
${agentResponses
  .map(
    (r, i) =>
      `${i + 1}. ${r.decision} (信頼度: ${r.confidence})\n   理由: ${r.reasoning}`
  )
  .join('\n')}

質問: ${question}

これらの判断を総合評価し、最終判断を下してください。
各賢者に0-100点のスコアを付け、最終的な推奨事項を提示してください。`;

  try {
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1500,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: judgePrompt }],
          },
        ],
      }),
    });

    const response = await bedrockClient.send(command);
    let fullText = '';

    if (response.body) {
      // @ts-ignore - AWS SDK型定義の問題を回避
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const chunk = JSON.parse(
            new TextDecoder().decode(event.chunk.bytes)
          );

          if (chunk.type === 'content_block_delta') {
            const text = chunk.delta?.text || '';
            fullText += text;

            sendEvent(stream, 'judge_chunk', undefined, {
              text,
            });
          }
        }
      }
    }

    // Judge完了イベント
    sendEvent(stream, 'judge_complete', undefined, {
      finalDecision: approved > rejected ? 'APPROVED' : 'REJECTED',
      votingResult: { approved, rejected, abstained: 0 },
      scores: agentResponses.map((r, i) => {
        const agentConfig = AGENT_CONFIGS[i];
        return {
          agentId: agentConfig?.id || `agent-${i}`,
          score: Math.round(r.confidence * 100),
          reasoning: r.reasoning,
        };
      }),
      finalRecommendation: fullText.substring(0, 200),
      reasoning: fullText,
      confidence:
        agentResponses.reduce((sum, r) => sum + r.confidence, 0) /
        agentResponses.length,
    });
  } catch (error) {
    console.error('Error in SOLOMON Judge:', error);

    sendEvent(stream, 'judge_complete', undefined, {
      finalDecision: approved > rejected ? 'APPROVED' : 'REJECTED',
      votingResult: { approved, rejected, abstained: 0 },
      scores: [],
      finalRecommendation: 'エラーが発生しました',
      reasoning: error instanceof Error ? error.message : 'Unknown error',
      confidence: 0.5,
    });
  }
}

/**
 * Lambda Response Streaming Handler
 */
export const handler = awslambda.streamifyResponse(
  async (event: any, responseStream: any, _context: Context) => {
    let httpStream: any;

    try {
      console.log('MAGI Bedrock Handler: Starting', {
        model: MODEL_ID,
        timestamp: new Date().toISOString(),
      });

      responseStream.setContentType('text/event-stream');
      httpStream = responseStream;

      // 初期フラッシュ
      const padding = ' '.repeat(256);
      httpStream.write(`: open ${padding}\n\n`);

      // リクエストボディの解析
      let body: any;
      if (typeof event.body === 'string') {
        try {
          body = JSON.parse(event.body);
        } catch (e) {
          body = { question: 'テスト質問' };
        }
      } else {
        body = event.body || event;
      }

      const question = body.question || body.message || 'テスト質問';

      console.log('Processing question:', question.substring(0, 100));

      // システム開始イベント
      sendEvent(httpStream, 'system_start', undefined, {
        message: `MAGI システム開始 (モデル: ${MODEL_ID}) - 並列実行`,
        totalAgents: AGENT_CONFIGS.length,
      });

      // 3賢者を並列実行
      console.log('Starting parallel agent execution...');
      const agentPromises = AGENT_CONFIGS.map((agent) =>
        consultAgent(agent, question, httpStream)
      );
      const agentResponses = await Promise.all(agentPromises);
      console.log('All agents completed');

      // SOLOMON Judge実行
      await executeSolomonJudge(agentResponses, question, httpStream);

      // 完了イベント
      sendEvent(httpStream, 'complete', undefined, {
        message: 'All agents completed successfully',
      });

      httpStream.end();
    } catch (error) {
      console.error('MAGI Bedrock Handler Error:', error);

      const stream = httpStream || responseStream;
      sendEvent(stream, 'error', undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      stream.end();
    }
  }
);
