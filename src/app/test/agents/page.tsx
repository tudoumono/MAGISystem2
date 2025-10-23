/**
 * Agent Response Panel Test Page
 * 
 * このページは7.1タスクで実装したエージェント応答パネルのテストページです。
 * 様々なシナリオ（全員一致、意見分裂、エラー、ローディング）を確認できます。
 * 
 * テストシナリオ:
 * - 全員一致可決
 * - 全員一致否決  
 * - 意見分裂（2:1）
 * - ローディング状態
 * - エラー状態
 * - 個別パネル表示
 * - 比較表示モード
 */

'use client';

import React, { useState } from 'react';
import { AgentResponsePanel } from '@/components/agents/AgentResponsePanel';
import { AgentResponseComparison } from '@/components/agents/AgentResponseComparison';
import { JudgeResponsePanel } from '@/components/agents/JudgeResponsePanel';
import { MAGISystemInterface } from '@/components/agents/MAGISystemInterface';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { mockMAGIExecution } from '@/lib/mock/data';
import { AskAgentResponse } from '@/types/api';

// =============================================================================
// Test Page Component
// =============================================================================

export default function AgentResponseTestPage() {
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [mockData, setMockData] = useState<AskAgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 動的実行進行状況の状態（並列実行対応）
  const [executionProgress, setExecutionProgress] = useState<{
    phase: 'initializing' | 'agents_thinking' | 'judge_evaluating' | 'completed';
    completedAgents: string[];
    activeAgents: string[]; // 並列実行中のエージェント
    agentThoughts: { [agentId: string]: string }; // 各エージェントの現在の思考
    solomonThought?: string; // SOLOMONの思考
  } | null>(null);

  // 思考メッセージのパターン
  const thoughtPatterns = {
    caspar: [
      "リスク分析を開始しています...",
      "過去の事例データを検索中...",
      "安全性指標を評価中...",
      "実現可能性を慎重に検討...",
      "保守的観点から総合判断中..."
    ],
    balthasar: [
      "創造的可能性を探索中...",
      "感情的価値を分析しています...",
      "革新性の評価を実行中...",
      "人間中心の視点で検討...",
      "直感的判断を統合中..."
    ],
    melchior: [
      "データ収集・分析を開始...",
      "論理的整合性を検証中...",
      "科学的根拠を評価しています...",
      "バランス型判断を実行中...",
      "客観的結論を導出中..."
    ],
    solomon: [
      "3賢者の判断を収集中...",
      "矛盾点の分析を実行...",
      "統合評価アルゴリズム実行中...",
      "最終スコアを算出しています...",
      "MAGI最終判断を生成中..."
    ]
  };

  // 並列実行シミュレーション関数
  const runParallelScenario = async (scenarioName: string, scenarioFn: () => Promise<AskAgentResponse>) => {
    setCurrentScenario(scenarioName);
    setLoading(true);
    setError('');
    setMockData(null);
    
    try {
      // Phase 1: 初期化
      setExecutionProgress({
        phase: 'initializing',
        completedAgents: [],
        activeAgents: [],
        agentThoughts: {},
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 2: 3賢者並列実行開始
      setExecutionProgress({
        phase: 'agents_thinking',
        completedAgents: [],
        activeAgents: ['caspar', 'balthasar', 'melchior'],
        agentThoughts: {
          caspar: thoughtPatterns.caspar[0],
          balthasar: thoughtPatterns.balthasar[0],
          melchior: thoughtPatterns.melchior[0],
        },
      });

      // 並列思考プロセスシミュレーション
      const agents = ['caspar', 'balthasar', 'melchior'];
      const agentTimers: { [key: string]: NodeJS.Timeout[] } = {};
      
      // 各エージェントの思考更新タイマーを開始
      agents.forEach(agentId => {
        agentTimers[agentId] = [];
        const patterns = thoughtPatterns[agentId as keyof typeof thoughtPatterns];
        
        patterns.forEach((thought, index) => {
          const timer = setTimeout(() => {
            setExecutionProgress(prev => prev ? {
              ...prev,
              agentThoughts: {
                ...prev.agentThoughts,
                [agentId]: thought
              }
            } : null);
          }, (index + 1) * 800 + Math.random() * 400); // ランダムな間隔で更新
          
          agentTimers[agentId].push(timer);
        });
      });

      // エージェント完了をランダムなタイミングでシミュレート
      const completionTimes = [
        { agent: 'balthasar', time: 2200 + Math.random() * 800 },
        { agent: 'melchior', time: 2800 + Math.random() * 600 },
        { agent: 'caspar', time: 3400 + Math.random() * 400 },
      ];

      for (const { agent, time } of completionTimes) {
        setTimeout(() => {
          setExecutionProgress(prev => {
            if (!prev) return null;
            const newCompleted = [...prev.completedAgents, agent];
            const newActive = prev.activeAgents.filter(a => a !== agent);
            
            return {
              ...prev,
              completedAgents: newCompleted,
              activeAgents: newActive,
              agentThoughts: {
                ...prev.agentThoughts,
                [agent]: `${agent.toUpperCase()}判断完了！`
              }
            };
          });
        }, time);
      }

      // 全エージェント完了後、SOLOMON評価開始
      setTimeout(() => {
        // 全タイマーをクリア
        Object.values(agentTimers).flat().forEach(timer => clearTimeout(timer));
        
        setExecutionProgress(prev => prev ? {
          ...prev,
          phase: 'judge_evaluating',
          activeAgents: [],
          solomonThought: thoughtPatterns.solomon[0]
        } : null);

        // SOLOMON思考プロセス
        thoughtPatterns.solomon.forEach((thought, index) => {
          setTimeout(() => {
            setExecutionProgress(prev => prev ? {
              ...prev,
              solomonThought: thought
            } : null);
          }, index * 600);
        });

      }, Math.max(...completionTimes.map(c => c.time)) + 500);
      
      // 実際のデータ取得（SOLOMON完了後）
      setTimeout(async () => {
        const result = await scenarioFn();
        setMockData(result);
        
        // Phase 4: 完了
        setExecutionProgress({
          phase: 'completed',
          completedAgents: ['caspar', 'balthasar', 'melchior'],
          activeAgents: [],
          agentThoughts: {
            caspar: "CASPAR判断完了",
            balthasar: "BALTHASAR判断完了", 
            melchior: "MELCHIOR判断完了"
          },
          solomonThought: "SOLOMON統合評価完了"
        });
        
        setLoading(false);
        
        // 少し待ってからプログレス状態をクリア
        setTimeout(() => setExecutionProgress(null), 3000);
      }, Math.max(...completionTimes.map(c => c.time)) + 3500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  // テストシナリオの定義
  const scenarios = [
    {
      name: '全員一致可決',
      description: '3賢者全員が可決判断するシナリオ',
      fn: () => mockMAGIExecution.unanimousApproval('新しいAIシステムを導入すべきでしょうか？'),
    },
    {
      name: '全員一致否決',
      description: '3賢者全員が否決判断するシナリオ',
      fn: () => mockMAGIExecution.unanimousRejection('リスクの高い投資を実行すべきでしょうか？'),
    },
    {
      name: '意見分裂',
      description: '賢者の意見が2:1で分かれるシナリオ',
      fn: () => mockMAGIExecution.splitDecision('新しいマーケティング戦略を採用すべきでしょうか？'),
    },
    {
      name: 'エラーシナリオ',
      description: 'エージェント実行エラーのシナリオ',
      fn: () => mockMAGIExecution.error('エラーテスト用の質問'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Agent Response Panel Test
          </h1>
          <p className="text-gray-600">
            エージェント応答パネルの各種シナリオテスト（Task 7.1実装確認）
          </p>
        </div>

        {/* シナリオ選択ボタン */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            テストシナリオ選択
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {scenarios.map((scenario) => (
              <Button
                key={scenario.name}
                variant={currentScenario === scenario.name ? "primary" : "secondary"}
                onClick={() => runParallelScenario(scenario.name, scenario.fn)}
                disabled={loading}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-medium">{scenario.name}</div>
                  <div className="text-sm opacity-75 mt-1">
                    {scenario.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          {/* 動的デモ制御 */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">🎮 動的デモ制御</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExecutionProgress({
                  phase: 'initializing',
                  completedAgents: [],
                  activeAgents: [],
                  agentThoughts: {},
                })}
                disabled={loading}
              >
                初期化デモ
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExecutionProgress({
                  phase: 'agents_thinking',
                  completedAgents: ['caspar'],
                  activeAgents: ['balthasar', 'melchior'],
                  agentThoughts: {
                    caspar: "CASPAR判断完了",
                    balthasar: "創造的可能性を探索中...",
                    melchior: "データ収集・分析を開始...",
                  },
                })}
                disabled={loading}
              >
                並列実行デモ
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExecutionProgress({
                  phase: 'judge_evaluating',
                  completedAgents: ['caspar', 'balthasar', 'melchior'],
                  activeAgents: [],
                  agentThoughts: {
                    caspar: "CASPAR判断完了",
                    balthasar: "BALTHASAR判断完了",
                    melchior: "MELCHIOR判断完了",
                  },
                  solomonThought: "3賢者の判断を収集中...",
                })}
                disabled={loading}
              >
                SOLOMON評価デモ
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExecutionProgress(null)}
                disabled={loading}
              >
                デモ停止
              </Button>
            </div>
          </div>
        </Card>

        {/* ローディング状態テスト */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ローディング状態テスト
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AgentResponsePanel loading={true} />
            <AgentResponsePanel loading={true} />
            <AgentResponsePanel loading={true} />
          </div>
        </Card>

        {/* 完全なMAGIシステムインターフェース */}
        {currentScenario && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              完全なMAGIシステム表示: {currentScenario}
            </h2>
            <MAGISystemInterface
              question={`テストシナリオ: ${currentScenario}`}
              response={mockData ?? undefined}
              loading={loading}
              error={error}
              executionProgress={executionProgress ?? undefined}
              onRetry={() => runParallelScenario(currentScenario, scenarios.find(s => s.name === currentScenario)?.fn || (() => Promise.resolve({} as AskAgentResponse)))}
              onNewQuestion={() => {
                setCurrentScenario('');
                setMockData(null);
                setError('');
                setExecutionProgress(null);
              }}
            />
          </div>
        )}

        {/* 個別コンポーネントテスト */}
        {mockData && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              個別コンポーネントテスト
            </h2>
            
            {/* エージェント応答比較 */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">3賢者応答比較</h3>
              <AgentResponseComparison
                responses={mockData.agentResponses}
                loading={loading}
                error={error}
                comparisonMode={true}
              />
            </div>

            {/* SOLOMON Judge単体 */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">SOLOMON Judge統合評価</h3>
              <JudgeResponsePanel
                judgeResponse={mockData.judgeResponse}
                agentResponses={mockData.agentResponses}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        )}

        {/* 個別パネルテスト */}
        {mockData && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              個別パネル表示テスト
            </h2>
            <div className="space-y-6">
              {mockData.agentResponses.map((response) => (
                <AgentResponsePanel
                  key={response.agentId}
                  response={response}
                  compareMode={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* 実装情報 */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            実装完了機能 (Task 7.1 & 7.2)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">✅ Task 7.1 完了</h3>
              <ul className="space-y-1">
                <li>• 3賢者AgentResponsePanel</li>
                <li>• 詳細回答内容表示</li>
                <li>• サイドバイサイド比較</li>
                <li>• 可決/否決視覚的強調</li>
                <li>• 判断理由詳細表示</li>
                <li>• スケルトンローディング</li>
                <li>• モックデータテスト</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">✅ Task 7.2 完了 + 動的機能</h3>
              <ul className="space-y-1">
                <li>• SOLOMON Judge統合評価</li>
                <li>• CSS-basedスコア可視化</li>
                <li>• MAGI投票結果集計表示</li>
                <li>• 最終判断表示</li>
                <li>• エヴァ風MAGIデザイン</li>
                <li>• Multi-Agent対応</li>
                <li>• 🔥 リアルタイム動的更新</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">🚀 並列実行 + 思考表示</h3>
              <ul className="space-y-1">
                <li>• 🔄 3賢者完全並列実行</li>
                <li>• 💭 リアルタイム思考プロセス表示</li>
                <li>• 🧠 各エージェント個別思考パターン</li>
                <li>• 🤖 SOLOMON統合思考可視化</li>
                <li>• ⚡ 非同期完了タイミング</li>
                <li>• 📊 並列実行状況サマリー</li>
                <li>• 🎮 動的デモ制御拡張</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}