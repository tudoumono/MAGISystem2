/**
 * Trace Test Page - トレースコンポーネントのテストページ
 * 
 * このページはトレース可視化コンポーネントの動作確認用です。
 * 様々なシナリオでのトレース表示をテストできます。
 * 
 * 機能:
 * - 標準的なMAGI実行フローの表示
 * - エラーが多発するシナリオの表示
 * - 長時間実行シナリオの表示
 * - リアルタイム更新のシミュレーション
 * 
 * 学習ポイント:
 * - トレースコンポーネントの使用方法
 * - リアルタイム更新の実装パターン
 * - 異なるシナリオでの動作確認
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ReasoningTracePanel } from '@/components/trace';
import { TraceStep } from '@/types/domain';
import { 
  mockTraceData,
  generateTraceId,
  simulateRealTimeTrace 
} from '@/lib/trace/mock-trace-data';
import { Button } from '@/components/ui/Button';

/**
 * テストシナリオの定義
 */
type TestScenario = 'standard' | 'error-prone' | 'long-running';

interface ScenarioConfig {
  id: TestScenario;
  name: string;
  description: string;
  color: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'standard',
    name: '標準実行',
    description: '通常のMAGI実行フロー（3賢者 + SOLOMON Judge）',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'error-prone',
    name: 'エラー多発',
    description: 'エラーとリトライが発生するシナリオ',
    color: 'bg-red-500 hover:bg-red-600'
  },
  {
    id: 'long-running',
    name: '長時間実行',
    description: '多数のステップを含む長時間実行',
    color: 'bg-purple-500 hover:bg-purple-600'
  }
];

/**
 * TraceTestPage - トレース機能のテストページ
 */
export default function TraceTestPage() {
  // 状態管理
  const [currentTraceId, setCurrentTraceId] = useState<string>('');
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [isRealTime, setIsRealTime] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>('standard');

  /**
   * 即座に完了したトレースを表示
   */
  const handleShowCompletedTrace = async (scenario: TestScenario) => {
    setIsLoading(true);
    setIsRealTime(false);
    
    const traceId = generateTraceId();
    setCurrentTraceId(traceId);
    setTraceSteps([]);

    try {
      const steps = await mockTraceData.generateCompleted(traceId, scenario);
      setTraceSteps(steps);
    } catch (error) {
      console.error('Failed to generate trace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * リアルタイム更新をシミュレート
   */
  const handleStartRealTimeTrace = async (scenario: TestScenario) => {
    setIsLoading(true);
    setIsRealTime(true);
    
    const traceId = generateTraceId();
    setCurrentTraceId(traceId);
    setTraceSteps([]);

    try {
      const traceGenerator = simulateRealTimeTrace(traceId, scenario);
      
      for await (const step of traceGenerator) {
        setTraceSteps(prev => [...prev, step]);
      }
      
      setIsRealTime(false);
    } catch (error) {
      console.error('Failed to simulate real-time trace:', error);
      setIsRealTime(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * トレースをクリア
   */
  const handleClearTrace = () => {
    setTraceSteps([]);
    setCurrentTraceId('');
    setIsRealTime(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            トレース可視化テスト
          </h1>
          <p className="mt-2 text-gray-600">
            推論トレースコンポーネントの動作確認とテスト
          </p>
        </div>

        {/* コントロールパネル */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            テストコントロール
          </h2>
          
          {/* シナリオ選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              テストシナリオ
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SCENARIOS.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedScenario === scenario.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => handleShowCompletedTrace(selectedScenario)}
              disabled={isLoading || isRealTime}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading && !isRealTime ? '生成中...' : '完了済みトレースを表示'}
            </Button>
            
            <Button
              onClick={() => {
                setIsRealTime(true);
                setCurrentTraceId(generateTraceId());
                setTraceSteps([]);
              }}
              disabled={isLoading || isRealTime}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isRealTime ? 'リアルタイム実行中...' : 'リアルタイム更新を開始'}
            </Button>
            
            <Button
              onClick={handleClearTrace}
              disabled={isLoading}
              variant="outline"
            >
              クリア
            </Button>
          </div>

          {/* 現在の状態表示 */}
          {currentTraceId && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-600">
                <strong>現在のトレースID:</strong> {currentTraceId}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <strong>ステップ数:</strong> {traceSteps.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <strong>更新モード:</strong> {isRealTime ? 'リアルタイム' : '静的表示'}
              </div>
            </div>
          )}
        </div>

        {/* トレース表示エリア */}
        {currentTraceId ? (
          <ReasoningTracePanel
            traceId={currentTraceId}
            steps={isRealTime ? [] : traceSteps}
            realTimeUpdates={isRealTime}
            orchestratorMode="solomon_orchestrated"
            autoStart={isRealTime}
            onExecutionComplete={(steps) => {
              console.log('Trace execution completed:', steps);
              setIsRealTime(false);
            }}
            className="mb-8"
          />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              トレースが選択されていません
            </h3>
            <p className="text-gray-600">
              上のボタンからテストシナリオを実行してください
            </p>
          </div>
        )}

        {/* 使用方法の説明 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            使用方法
          </h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <strong>完了済みトレースを表示:</strong> 
              全てのステップが即座に表示されます。実際のトレース結果を確認する際の表示方法です。
            </div>
            <div>
              <strong>リアルタイム更新を開始:</strong> 
              ステップが段階的に表示され、実際のエージェント実行中の体験をシミュレートします。
            </div>
            <div>
              <strong>各ステップをクリック:</strong> 
              詳細情報（使用ツール、引用リンク、実行時間など）を展開表示できます。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}