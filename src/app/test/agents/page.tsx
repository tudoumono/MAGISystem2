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

  // Claude風拡張思考パターン
  const thoughtPatterns = {
    caspar: [
      "質問を受信しました。保守的・現実的な視点から分析を開始します。",
      "まず、過去の類似事例を検索しています...\n- 成功事例: 12件\n- 失敗事例: 8件\n- 不明確な結果: 3件",
      "リスク要因を特定中:\n• 技術的リスク: 中程度\n• 財務的リスク: 高\n• 運用リスク: 低\n• 規制リスク: 中程度",
      "実現可能性を評価しています...\n現在のリソースと制約を考慮すると、段階的アプローチが必要と判断。",
      "保守的観点から総合判断を実行中...\nリスクと利益のバランスを慎重に検討し、最終的な可決/否決を決定します。"
    ],
    balthasar: [
      "創造的・感情的な視点から分析を開始します。人間の心に響く価値を探求しましょう。",
      "この提案の革新性を評価中...\n• 新規性: 高\n• 創造性: 中程度\n• 社会的インパクト: 高\n• 感情的共感度: 中程度",
      "人間中心の価値観で検討しています:\n- ユーザー体験の向上\n- 社会的意義の創出\n- 倫理的配慮の確認",
      "直感的判断を統合中...\n論理だけでなく、感情や直感も重要な判断要素として考慮しています。",
      "革新的視点から最終判断を形成中...\n創造性と人間性のバランスを取りながら、可決/否決を決定します。"
    ],
    melchior: [
      "バランス型・科学的な視点から客観的分析を開始します。",
      "データ収集を実行中...\n• 定量的データ: 収集完了\n• 定性的データ: 分析中\n• 統計的有意性: 検証中",
      "論理的整合性を検証しています:\n1. 前提条件の妥当性\n2. 推論プロセスの正確性\n3. 結論の論理的一貫性",
      "科学的手法による評価を実行中...\n仮説検証、データ分析、統計的推論を組み合わせて客観的判断を形成。",
      "バランス型判断を完成中...\n保守性と革新性、論理と直感、リスクと機会のバランスを総合的に評価し、最終判断を決定します。"
    ],
    solomon: [
      "SOLOMON Judge起動。3賢者の判断を統合評価します。",
      "各エージェントの判断を収集・分析中:\n• CASPAR: 保守的視点での評価\n• BALTHASAR: 革新的視点での評価\n• MELCHIOR: バランス型視点での評価",
      "矛盾点と一致点を分析しています...\n- 共通認識: 特定済み\n- 意見の相違: 詳細分析中\n- 判断根拠の妥当性: 検証中",
      "統合評価アルゴリズムを実行中...\n各エージェントの確信度、論理的整合性、専門性を重み付けして総合スコアを算出。",
      "MAGI最終判断を生成中...\n3賢者の多様な視点を統合し、最も適切な可決/否決判断を決定します。人類の未来のために。"
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
          caspar: thoughtPatterns.caspar[0] || "思考開始...",
          balthasar: thoughtPatterns.balthasar[0] || "思考開始...",
          melchior: thoughtPatterns.melchior[0] || "思考開始...",
        },
      });

      // 並列思考プロセスシミュレーション
      const agents = ['caspar', 'balthasar', 'melchior'];
      const agentTimers: { [key: string]: NodeJS.Timeout[] } = {};
      
      // 各エージェントの思考更新タイマーを開始
      agents.forEach(agentId => {
        agentTimers[agentId] = [];
        const patterns = thoughtPatterns[agentId as keyof typeof thoughtPatterns] || [];
        
        patterns.forEach((thought, index) => {
          const timer = setTimeout(() => {
            setExecutionProgress(prev => prev ? {
              ...prev,
              agentThoughts: {
                ...prev.agentThoughts,
                [agentId]: thought
              }
            } : null);
          }, (index + 1) * 1200 + Math.random() * 600); // より長い間隔で深い思考を表現
          
          if (agentTimers[agentId]) {
            agentTimers[agentId].push(timer);
          }
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
          solomonThought: thoughtPatterns.solomon[0] || "SOLOMON思考開始..."
        } : null);

        // SOLOMON思考プロセス（より深い思考時間）
        thoughtPatterns.solomon.forEach((thought, index) => {
          setTimeout(() => {
            setExecutionProgress(prev => prev ? {
              ...prev,
              solomonThought: thought
            } : null);
          }, index * 1000); // より長い思考時間
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
                onClick={() => setExecutionProgress({
                  phase: 'agents_thinking',
                  completedAgents: [],
                  activeAgents: ['caspar', 'balthasar', 'melchior'],
                  agentThoughts: {
                    caspar: "質問を受信しました。保守的・現実的な視点から分析を開始します。",
                    balthasar: "創造的・感情的な視点から分析を開始します。人間の心に響く価値を探求しましょう。",
                    melchior: "バランス型・科学的な視点から客観的分析を開始します。",
                  },
                })}
                disabled={loading}
              >
                Claude風思考デモ
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
              <h3 className="font-medium mb-2">🧠 Claude風拡張思考システム</h3>
              <ul className="space-y-1">
                <li>• 🔄 3賢者完全並列実行</li>
                <li>• 💭 &lt;antml:thinking&gt;風思考表示</li>
                <li>• 🧠 段階的深層思考プロセス</li>
                <li>• 🤖 SOLOMON統合思考可視化</li>
                <li>• ⚡ 非同期完了タイミング</li>
                <li>• 📊 並列実行状況サマリー</li>
                <li>• 🎮 Claude風思考デモ制御</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}