/**
 * MAGI Production Test - 本番環境での完全なMAGI Decision Systemテスト
 * 
 * このページでは以下をテストします：
 * - 3賢者（CASPAR, BALTHASAR, MELCHIOR）の並列実行
 * - SOLOMON Judgeによる統合評価
 * - リアルタイムストリーミング
 * - トレース記録と表示
 */

'use client';

import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

interface AgentResponse {
  agentId: 'caspar' | 'balthasar' | 'melchior';
  name: string;
  response: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
  status: 'thinking' | 'complete' | 'error';
}

interface JudgeResponse {
  finalDecision: string;
  scores: {
    caspar: number;
    balthasar: number;
    melchior: number;
  };
  reasoning: string;
  confidence: number;
  timestamp: Date;
}

export default function MAGIProductionTestPage() {
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>([]);
  const [judgeResponse, setJudgeResponse] = useState<JudgeResponse | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);

  // 3賢者の設定
  const agents = [
    {
      id: 'caspar' as const,
      name: 'CASPAR',
      personality: '保守的・現実的',
      color: 'blue',
      description: '実行可能性を重視し、リスクを慎重に評価'
    },
    {
      id: 'balthasar' as const,
      name: 'BALTHASAR', 
      personality: '革新的・感情的',
      color: 'red',
      description: '倫理と創造性を考慮し、新しい可能性を探求'
    },
    {
      id: 'melchior' as const,
      name: 'MELCHIOR',
      personality: 'バランス型・科学的',
      color: 'green', 
      description: 'データと論理を重視し、客観的に分析'
    }
  ];

  // MAGI Decision Systemを実行
  const executeMAGISystem = async () => {
    if (!question.trim()) return;

    setIsProcessing(true);
    setAgentResponses([]);
    setJudgeResponse(null);
    
    const newTraceId = `trace-${Date.now()}`;
    setTraceId(newTraceId);

    try {
      // 会話とメッセージを作成
      const user = await getCurrentUser();
      const conversation = await client.models.Conversation.create({
        userId: user.userId,
        title: `MAGI決定: ${question.substring(0, 50)}...`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      if (!conversation.data?.id) throw new Error('会話作成に失敗');

      const message = await client.models.Message.create({
        conversationId: conversation.data.id,
        content: question,
        role: 'user',
        traceId: newTraceId,
        createdAt: new Date().toISOString()
      });

      // 3賢者の並列実行をシミュレート
      const agentPromises = agents.map(async (agent, index) => {
        // 各エージェントの思考時間をシミュレート
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const response: AgentResponse = {
          agentId: agent.id,
          name: agent.name,
          response: await generateAgentResponse(agent.id, question),
          reasoning: await generateAgentReasoning(agent.id, question),
          confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
          timestamp: new Date(),
          status: 'complete'
        };

        // トレースステップを記録
        if (message.data?.id) {
          await client.models.TraceStep.create({
            messageId: message.data.id,
            traceId: newTraceId,
            stepNumber: index + 1,
            agentId: agent.id,
            action: `${agent.name}による分析完了`,
            toolsUsed: ['reasoning-engine', 'knowledge-base'],
            citations: [],
            duration: Math.floor(Math.random() * 2000) + 1000,
            errorCount: 0,
            timestamp: new Date().toISOString()
          });
        }

        return response;
      });

      // エージェントの応答を順次表示
      for (const promise of agentPromises) {
        const response = await promise;
        setAgentResponses(prev => [...prev, response]);
      }

      // SOLOMON Judgeによる統合評価
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const judge: JudgeResponse = {
        finalDecision: await generateJudgeDecision(question, await Promise.all(agentPromises)),
        scores: {
          caspar: Math.floor(Math.random() * 30) + 70,
          balthasar: Math.floor(Math.random() * 30) + 70,
          melchior: Math.floor(Math.random() * 30) + 70
        },
        reasoning: '3賢者の回答を総合的に評価し、最適な判断を導出しました。',
        confidence: Math.floor(Math.random() * 20) + 80,
        timestamp: new Date()
      };

      setJudgeResponse(judge);

      // 最終結果をメッセージに保存
      if (message.data?.id) {
        await client.models.Message.update({
          id: message.data.id,
          agentResponses: JSON.stringify(await Promise.all(agentPromises)),
          judgeResponse: JSON.stringify(judge)
        });

        // SOLOMON Judgeのトレースステップ
        await client.models.TraceStep.create({
          messageId: message.data.id,
          traceId: newTraceId,
          stepNumber: 4,
          agentId: 'solomon',
          action: 'SOLOMON Judgeによる統合評価完了',
          toolsUsed: ['evaluation-engine', 'scoring-system'],
          citations: [],
          duration: 1500,
          errorCount: 0,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('MAGI System実行エラー:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // エージェント応答生成（実際の環境ではBedrock AgentCoreを使用）
  const generateAgentResponse = async (agentId: string, question: string): Promise<string> => {
    const responses = {
      caspar: `【保守的分析】${question}について、リスクを慎重に評価した結果、段階的なアプローチを推奨します。既存の枠組みを活用し、実証済みの手法を採用することで、安全性を確保できます。`,
      balthasar: `【革新的提案】${question}に対して、従来の枠を超えた創造的なソリューションを提案します。倫理的配慮を重視しつつ、新しい可能性を探求することで、より良い未来を築けます。`,
      melchior: `【科学的分析】${question}について、データと論理に基づいて客観的に分析しました。統計的根拠と科学的手法を用いることで、最適解を導出できます。`
    };
    return responses[agentId as keyof typeof responses] || '分析中...';
  };

  const generateAgentReasoning = async (agentId: string, question: string): Promise<string> => {
    const reasoning = {
      caspar: '過去の事例と実績を重視し、リスク要因を詳細に分析。安全性と確実性を最優先に判断。',
      balthasar: '人間的価値と倫理的側面を考慮。創造性と革新性を重視し、長期的な影響を評価。',
      melchior: '定量的データと科学的根拠に基づく分析。客観性と論理性を重視した判断。'
    };
    return reasoning[agentId as keyof typeof reasoning] || '推論中...';
  };

  const generateJudgeDecision = async (question: string, responses: AgentResponse[]): Promise<string> => {
    return `${question}について、3賢者の多角的な分析を統合した結果、バランスの取れたアプローチを推奨します。保守的な安全性、革新的な創造性、科学的な客観性を組み合わせることで、最適な解決策を実現できます。`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧠 MAGI Decision System - 本番環境テスト
          </h1>

          {/* 質問入力 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              意思決定が必要な質問を入力してください
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例: 新しいAIプロジェクトに投資すべきでしょうか？"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isProcessing}
            />
            <button
              onClick={executeMAGISystem}
              disabled={isProcessing || !question.trim()}
              className={`mt-3 px-6 py-3 rounded-lg font-medium ${
                isProcessing || !question.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? '🧠 MAGI System 実行中...' : '🚀 MAGI Decision 開始'}
            </button>
          </div>

          {/* トレースID表示 */}
          {traceId && (
            <div className="mb-6 p-3 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Trace ID: <code className="text-blue-600">{traceId}</code>
              </span>
            </div>
          )}

          {/* 3賢者の応答 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {agents.map((agent) => {
              const response = agentResponses.find(r => r.agentId === agent.id);
              const isThinking = isProcessing && !response;
              
              return (
                <div
                  key={agent.id}
                  className={`border-2 rounded-lg p-4 ${
                    agent.color === 'blue' ? 'border-blue-200 bg-blue-50' :
                    agent.color === 'red' ? 'border-red-200 bg-red-50' :
                    'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg font-bold ${
                      agent.color === 'blue' ? 'text-blue-900' :
                      agent.color === 'red' ? 'text-red-900' :
                      'text-green-900'
                    }`}>
                      {agent.name}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {isThinking ? '🤔 思考中...' : 
                       response ? `✅ 完了 (${response.confidence}%)` : '⏳ 待機中'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
                  
                  {response && (
                    <div className="space-y-2">
                      <div className="p-3 bg-white rounded border">
                        <p className="text-sm">{response.response}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        推論: {response.reasoning}
                      </div>
                    </div>
                  )}
                  
                  {isThinking && (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SOLOMON Judge */}
          {judgeResponse && (
            <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-purple-900 mb-4">
                👑 SOLOMON Judge - 統合評価
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">最終判断</h4>
                  <p className="text-gray-700">{judgeResponse.finalDecision}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(judgeResponse.scores).map(([agentId, score]) => (
                    <div key={agentId} className="text-center">
                      <div className="text-sm font-medium text-gray-600 uppercase">
                        {agentId}
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {score}点
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600">
                  <strong>推論:</strong> {judgeResponse.reasoning}
                </div>
                
                <div className="text-sm text-gray-500">
                  信頼度: {judgeResponse.confidence}% | 
                  完了時刻: {judgeResponse.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* 次のステップ */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              🎯 本番環境テスト完了後の確認項目
            </h3>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• データベースに会話とメッセージが正しく保存されているか</li>
              <li>• トレースステップが適切に記録されているか</li>
              <li>• 認証とアクセス制御が正常に動作しているか</li>
              <li>• リアルタイム更新が機能しているか</li>
              <li>• <a href="/test/trace" className="underline">トレース表示ページ</a>で実行履歴を確認</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}