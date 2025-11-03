/**
 * MAGI Python Agents Bridge - TypeScript Handler
 * 
 * TypeScriptからPython Strands Agentsを呼び出すブリッジ実装
 * Lambda Response Streamingでリアルタイム応答を提供
 */

import { Context } from 'aws-lambda';
import { spawn } from 'child_process';
import * as path from 'path';

// Lambda Response Streaming用の型定義
declare const awslambda: {
  streamifyResponse: (handler: (event: any, responseStream: any, context: Context) => Promise<void>) => any;
};

/**
 * Python Strands Agentsを呼び出してストリーミング応答を生成
 */
async function callPythonStrandsAgents(question: string, httpStream: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Python実行環境の設定
      const pythonPath = '/opt/python/bin/python3'; // Lambda Layer内のPython
      const scriptPath = path.join(__dirname, 'magi_strands_bridge.py');
      
      console.log('Starting Python Strands Agents...');
      
      // Pythonプロセスを起動
      const pythonProcess = spawn(pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: '/opt/python:/opt/python/lib/python3.11/site-packages'
        }
      });
      
      // 質問をPythonプロセスに送信
      pythonProcess.stdin.write(JSON.stringify({ question }));
      pythonProcess.stdin.end();
      
      // Python出力をストリーミング
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python output:', output);
        
        // SSE形式で出力
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            httpStream.write(line + '\n\n');
          }
        }
      });
      
      // エラーハンドリング
      pythonProcess.stderr.on('data', (data) => {
        console.error('Python error:', data.toString());
      });
      
      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python process failed with code ${code}`));
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(error);
      });
      
    } catch (error) {
      console.error('Error calling Python Strands Agents:', error);
      reject(error);
    }
  });
}

/**
 * フォールバック: モックデータでストリーミング
 */
async function fallbackStreaming(question: string, httpStream: any): Promise<void> {
  console.log('Using fallback mock streaming');
  
  const agents = [
    { id: 'melchior', name: 'MELCHIOR', type: 'バランス型' },
    { id: 'caspar', name: 'CASPAR', type: '保守型' },
    { id: 'balthasar', name: 'BALTHASAR', type: '革新型' }
  ];

  // 開始イベント
  httpStream.write(`data: ${JSON.stringify({
    type: 'agent_start',
    data: { message: 'MAGI システム開始（フォールバックモード）', totalAgents: agents.length }
  })}\n\n`);

  // 各エージェントを順次実行
  for (const agent of agents) {
    console.log(`Processing agent: ${agent.name}`);
    
    // エージェント開始
    httpStream.write(`data: ${JSON.stringify({
      type: 'agent_start',
      agentId: agent.id,
      data: { name: agent.name, type: agent.type }
    })}\n\n`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // エージェント応答
    const response = getAgentResponse(agent.id, question);
    
    // 応答を一度に送信
    httpStream.write(`data: ${JSON.stringify({
      type: 'agent_chunk',
      agentId: agent.id,
      data: { text: response.content }
    })}\n\n`);

    // エージェント完了
    httpStream.write(`data: ${JSON.stringify({
      type: 'agent_complete',
      agentId: agent.id,
      data: {
        decision: response.decision,
        confidence: response.confidence,
        executionTime: response.executionTime
      }
    })}\n\n`);
  }

  // SOLOMON Judge処理
  httpStream.write(`data: ${JSON.stringify({
    type: 'judge_start',
    data: { name: 'SOLOMON JUDGE' }
  })}\n\n`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  const judgeSummary = '3賢者の判断を総合すると、適切な準備により実行可能です。';
  httpStream.write(`data: ${JSON.stringify({
    type: 'judge_chunk',
    data: { text: judgeSummary }
  })}\n\n`);

  // SOLOMON Judge完了
  httpStream.write(`data: ${JSON.stringify({
    type: 'judge_complete',
    data: {
      finalDecision: 'APPROVED',
      votingResult: { approved: 2, rejected: 1, abstained: 0 },
      scores: [
        { agentId: 'caspar', score: 75, reasoning: '慎重で現実的な分析' },
        { agentId: 'balthasar', score: 88, reasoning: '創造的で前向きな提案' },
        { agentId: 'melchior', score: 82, reasoning: 'バランスの取れた科学的判断' }
      ],
      finalRecommendation: '段階的実装によるリスク管理を推奨',
      reasoning: 'フォールバックモードによる判断',
      confidence: 0.75
    }
  })}\n\n`);

  // 完了イベント
  httpStream.write(`data: ${JSON.stringify({
    type: 'complete',
    data: { message: 'All agents completed successfully (fallback mode)' }
  })}\n\n`);
}

/**
 * エージェント応答の取得（モック）
 */
function getAgentResponse(agentId: string, _question: string) {
  const responses: Record<string, any> = {
    melchior: {
      content: 'データを総合的に分析した結果、適切な準備と段階的実装により成功可能と判断します。',
      decision: 'APPROVED',
      confidence: 0.82,
      executionTime: 1450
    },
    caspar: {
      content: '慎重な検討が必要です。過去の事例を分析すると、このような急進的な変更は予期しない問題を引き起こす可能性があります。',
      decision: 'REJECTED',
      confidence: 0.85,
      executionTime: 1200
    },
    balthasar: {
      content: '革新的で素晴らしいアイデアです！新しい可能性を切り開く挑戦として、積極的に取り組むべきです。',
      decision: 'APPROVED',
      confidence: 0.92,
      executionTime: 980
    }
  };

  return responses[agentId] || responses.melchior;
}

/**
 * Lambda Response Streaming Handler
 */
export const handler = awslambda.streamifyResponse(
  async (event: any, responseStream: any, _context: Context) => {
    let httpStream: any;

    try {
      console.log('MAGI Python Agents Bridge: Raw event', JSON.stringify(event));

      responseStream.setContentType('text/event-stream');
      httpStream = responseStream;

      console.log('DEBUG: About to send initial flush');
      const padding = ' '.repeat(256);
      httpStream.write(`: open ${padding}\n\n`);
      console.log('DEBUG: Initial flush sent');

      // リクエストボディの解析
      let body: any;
      if (typeof event.body === 'string') {
        try {
          const cleanBody = event.body.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
          body = JSON.parse(cleanBody);
        } catch (e) {
          console.error('Failed to parse body:', e, 'Raw body:', event.body);
          body = {
            question: event.question || 'テスト質問',
            conversationId: event.conversationId || 'test'
          };
        }
      } else {
        body = event.body || event;
      }

      const question = body.question || body.message || 'テスト質問';

      console.log('MAGI Python Agents Bridge: Request received', {
        question: question.substring(0, 100),
        conversationId: body.conversationId,
        timestamp: new Date().toISOString()
      });

      try {
        // Python Strands Agentsを呼び出し
        console.log('DEBUG: About to call Python Strands Agents');
        await callPythonStrandsAgents(question, httpStream);
        console.log('DEBUG: Python Strands Agents completed');
      } catch (error) {
        console.error('Python Strands Agents failed, using fallback:', error);
        // フォールバック: モックデータでストリーミング
        await fallbackStreaming(question, httpStream);
      }

      console.log('DEBUG: Stream ended successfully');
      httpStream.end();

    } catch (error) {
      console.error('MAGI Python Agents Bridge Error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');

      const stream = httpStream || responseStream;
      const errorData = `data: ${JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })}\n\n`;

      stream.write(errorData);
      stream.end();
    }
  }
);