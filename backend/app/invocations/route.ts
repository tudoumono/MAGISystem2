/**
 * MAGI AgentCore Runtime - /invocations endpoint
 *
 * このエンドポイントはPython magi_agent.pyを呼び出し、
 * Strands Agentsベースのマルチエージェント推論を実行します。
 *
 * アーキテクチャ:
 * Frontend → /invocations (Next.js) → spawn('python', ['magi_agent.py'])
 *                                      ↓
 *                              Strands Agents実行
 *                                      ↓
 *                              ストリーミングレスポンス
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const maxDuration = 300; // 5分（MAGI推論時間を考慮）

interface InvocationRequest {
  question: string;
  sessionId?: string;
  messages?: any[];
  model?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: InvocationRequest = await req.json();
    const { question, sessionId } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // TODO: Python magi_agent.py を spawn() で実行
    // 現在はモック応答を返す
    const mockResponse = {
      agents: [
        {
          id: 'caspar',
          name: 'CASPAR',
          response: 'CASPAR の応答（保守的視点）',
          reasoning: '詳細な推論プロセス...'
        },
        {
          id: 'balthasar',
          name: 'BALTHASAR',
          response: 'BALTHASAR の応答（革新的視点）',
          reasoning: '詳細な推論プロセス...'
        },
        {
          id: 'melchior',
          name: 'MELCHIOR',
          response: 'MELCHIOR の応答（バランス型視点）',
          reasoning: '詳細な推論プロセス...'
        }
      ],
      judge: {
        decision: 'APPROVED',
        summary: 'SOLOMON による統合判断',
        reasoning: '3賢者の意見を統合した結果...'
      },
      question,
      sessionId: sessionId || `session-${Date.now()}`
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Invocation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
