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

  // シナリオ実行関数
  const runScenario = async (scenarioName: string, scenarioFn: () => Promise<AskAgentResponse>) => {
    setCurrentScenario(scenarioName);
    setLoading(true);
    setError('');
    setMockData(null);

    try {
      const result = await scenarioFn();
      setMockData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => (
              <Button
                key={scenario.name}
                variant={currentScenario === scenario.name ? "primary" : "secondary"}
                onClick={() => runScenario(scenario.name, scenario.fn)}
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
              executionProgress={loading ? {
                phase: 'agents_thinking',
                completedAgents: ['caspar'],
                currentAgent: 'balthasar'
              } : undefined}
              onRetry={() => runScenario(currentScenario, scenarios.find(s => s.name === currentScenario)?.fn || (() => Promise.resolve({} as AskAgentResponse)))}
              onNewQuestion={() => {
                setCurrentScenario('');
                setMockData(null);
                setError('');
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
              <h3 className="font-medium mb-2">✅ Task 7.2 完了</h3>
              <ul className="space-y-1">
                <li>• SOLOMON Judge統合評価</li>
                <li>• CSS-basedスコア可視化</li>
                <li>• MAGI投票結果集計表示</li>
                <li>• 最終判断表示</li>
                <li>• エヴァ風MAGIデザイン</li>
                <li>• Multi-Agent対応</li>
                <li>• 完全システム統合</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">🎨 デザイン特徴</h3>
              <ul className="space-y-1">
                <li>• エヴァンゲリオン風UI</li>
                <li>• アクセシビリティ対応</li>
                <li>• 色覚特性対応</li>
                <li>• レスポンシブデザイン</li>
                <li>• 実行進行状況表示</li>
                <li>• アニメーション効果</li>
                <li>• 統合システム表示</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}