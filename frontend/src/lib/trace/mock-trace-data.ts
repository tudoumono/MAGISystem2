/**
 * Mock Trace Data Generator - トレースデータのモック生成
 * 
 * このファイルはトレース可視化コンポーネントのテスト用モックデータを生成します。
 * 様々なシナリオ（成功、エラー、長時間実行）をサポートし、
 * リアルタイム更新のシミュレーションも提供します。
 * 
 * 設計理由:
 * - フロントエンドファースト開発でのトレース機能テスト
 * - 様々な実行パターンの動作確認
 * - リアルタイム更新のシミュレーション
 * - エラーケースの網羅的テスト
 * 
 * 学習ポイント:
 * - Promise/async-awaitによる非同期処理
 * - Generator関数によるストリーミングデータ生成
 * - TypeScriptの型安全性を活用したモックデータ生成
 */

import { TraceStep } from '@/types/domain';

/**
 * ランダムなIDを生成
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * 指定範囲のランダムな数値を生成
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 配列からランダムな要素を選択
 */
function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

/**
 * トレースステップのテンプレート定義
 * 
 * 設計理由:
 * - 各エージェントの特性に応じたアクション定義
 * - 実際の実行フローに近いステップ構成
 * - ツール使用パターンの多様性確保
 */
const TRACE_STEP_TEMPLATES = {
  solomon: {
    actions: [
      'SOLOMON Judge初期化完了',
      'ユーザー質問の分析と3賢者への委託準備',
      '3賢者の判断を統合・評価中',
      'SOLOMON Judge最終判断完了',
      '投票結果の集計と最終決定',
      'エラー回復処理の実行',
      'タイムアウト処理の実行'
    ],
    tools: [
      'orchestrator',
      'context_analyzer',
      'question_analyzer',
      'delegation_planner',
      'integration_engine',
      'scoring_system',
      'final_decision_engine',
      'voting_aggregator'
    ]
  },
  caspar: {
    actions: [
      'CASPAR による分析開始',
      'リスク評価エンジンの実行',
      '過去事例データベースの検索',
      '保守的観点からの判断実行',
      'CASPAR による判断完了: APPROVED',
      'CASPAR による判断完了: REJECTED',
      'エラー検出とリトライ処理',
      '安全性チェックの実行'
    ],
    tools: [
      'reasoning_engine',
      'knowledge_base',
      'risk_analyzer',
      'historical_data',
      'safety_checker',
      'decision_engine',
      'confidence_calculator'
    ]
  },
  balthasar: {
    actions: [
      'BALTHASAR による分析開始',
      '創造性評価エンジンの実行',
      '倫理的観点からの検証',
      '革新的視点での判断実行',
      'BALTHASAR による判断完了: APPROVED',
      'BALTHASAR による判断完了: REJECTED',
      '感情分析エンジンの実行',
      '人間中心価値の評価'
    ],
    tools: [
      'reasoning_engine',
      'creativity_analyzer',
      'ethics_checker',
      'innovation_evaluator',
      'emotion_analyzer',
      'human_value_assessor',
      'decision_engine'
    ]
  },
  melchior: {
    actions: [
      'MELCHIOR による分析開始',
      'データ分析エンジンの実行',
      '論理的整合性の検証',
      'バランス型判断の実行',
      'MELCHIOR による判断完了: APPROVED',
      'MELCHIOR による判断完了: REJECTED',
      '統計的分析の実行',
      '科学的根拠の検証'
    ],
    tools: [
      'reasoning_engine',
      'data_analyzer',
      'logic_checker',
      'statistical_engine',
      'scientific_validator',
      'balance_evaluator',
      'decision_engine'
    ]
  }
};

/**
 * 引用リンクのサンプル
 */
const SAMPLE_CITATIONS = [
  'https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html',
  'https://example.com/knowledge-base/risk-analysis',
  'https://example.com/case-studies/similar-decisions',
  'https://example.com/research/decision-making-frameworks',
  'https://example.com/guidelines/ethical-ai-principles',
  'https://example.com/data/historical-outcomes',
  'https://example.com/models/confidence-scoring'
];

/**
 * 単一のトレースステップを生成
 */
function generateTraceStep(
  traceId: string,
  stepNumber: number,
  agentId: string,
  baseTimestamp: Date,
  options: {
    includeError?: boolean;
    includeCitations?: boolean;
    customAction?: string;
    customTools?: string[];
  } = {}
): TraceStep {
  const agentKey = agentId.toLowerCase() as keyof typeof TRACE_STEP_TEMPLATES;
  const template = TRACE_STEP_TEMPLATES[agentKey] || TRACE_STEP_TEMPLATES.solomon;
  
  const action = options.customAction || randomChoice(template.actions);
  const toolsUsed = options.customTools || [
    randomChoice(template.tools),
    ...(Math.random() > 0.5 ? [randomChoice(template.tools)] : [])
  ];
  
  const citations = options.includeCitations 
    ? Array.from({ length: Math.floor(randomBetween(0, 3)) }, () => randomChoice(SAMPLE_CITATIONS))
    : [];
  
  const errorCount = options.includeError ? Math.floor(randomBetween(1, 3)) : 0;
  
  return {
    id: generateId(),
    traceId,
    stepNumber,
    agentId,
    action,
    toolsUsed,
    citations,
    duration: Math.floor(randomBetween(200, 2000)),
    errorCount,
    timestamp: new Date(baseTimestamp.getTime() + (stepNumber * 500))
  };
}

/**
 * 標準的なMAGI実行フローのトレースステップを生成
 */
export function generateStandardMAGITrace(traceId: string): TraceStep[] {
  const baseTime = new Date();
  const steps: TraceStep[] = [];
  let stepNumber = 1;

  // SOLOMON初期化
  steps.push(generateTraceStep(
    traceId, stepNumber++, 'solomon', baseTime,
    { customAction: 'SOLOMON Judge初期化完了', customTools: ['orchestrator'] }
  ));

  // 質問分析
  steps.push(generateTraceStep(
    traceId, stepNumber++, 'solomon', baseTime,
    { 
      customAction: 'ユーザー質問の分析と3賢者への委託準備',
      customTools: ['question_analyzer', 'delegation_planner'],
      includeCitations: true
    }
  ));

  // 3賢者の並列実行
  const agents = ['caspar', 'balthasar', 'melchior'];
  const decisions = ['APPROVED', 'REJECTED'];
  
  agents.forEach(agent => {
    // 分析開始
    steps.push(generateTraceStep(
      traceId, stepNumber++, agent, baseTime,
      { 
        customAction: `${agent.toUpperCase()} による分析開始`,
        includeCitations: true
      }
    ));
    
    // 判断完了
    const decision = randomChoice(decisions);
    steps.push(generateTraceStep(
      traceId, stepNumber++, agent, baseTime,
      { 
        customAction: `${agent.toUpperCase()} による判断完了: ${decision}`,
        includeError: Math.random() > 0.8 // 20%の確率でエラー
      }
    ));
  });

  // SOLOMON統合評価
  steps.push(generateTraceStep(
    traceId, stepNumber++, 'solomon', baseTime,
    { 
      customAction: '3賢者の判断を統合・評価中',
      customTools: ['integration_engine', 'scoring_system']
    }
  ));

  // 最終判断
  steps.push(generateTraceStep(
    traceId, stepNumber++, 'solomon', baseTime,
    { 
      customAction: 'SOLOMON Judge最終判断完了',
      customTools: ['final_decision_engine']
    }
  ));

  return steps;
}

/**
 * エラーが多発するトレースを生成
 */
export function generateErrorProneTrace(traceId: string): TraceStep[] {
  const baseTime = new Date();
  const steps: TraceStep[] = [];
  let stepNumber = 1;

  // 初期化エラー
  steps.push(generateTraceStep(
    traceId, stepNumber++, 'solomon', baseTime,
    { 
      customAction: 'SOLOMON Judge初期化でエラー発生',
      includeError: true
    }
  ));

  // リトライ成功
  steps.push(generateTraceStep(
    traceId, stepNumber++, 'solomon', baseTime,
    { customAction: 'SOLOMON Judge初期化完了（リトライ後）' }
  ));

  // エージェント実行でタイムアウト
  steps.push(generateTraceStep(
    traceId, stepNumber++, 'caspar', baseTime,
    { 
      customAction: 'CASPAR 実行タイムアウト',
      includeError: true
    }
  ));

  // エラー回復
  steps.push(generateTraceStep(
    traceId, stepNumber++, 'solomon', baseTime,
    { customAction: 'エラー回復処理の実行' }
  ));

  return steps;
}

/**
 * 長時間実行のトレースを生成
 */
export function generateLongRunningTrace(traceId: string): TraceStep[] {
  const baseTime = new Date();
  const steps: TraceStep[] = [];
  let stepNumber = 1;

  // 多数のステップを生成
  for (let i = 0; i < 20; i++) {
    const agent = randomChoice(['solomon', 'caspar', 'balthasar', 'melchior']);
    steps.push(generateTraceStep(
      traceId, stepNumber++, agent, baseTime,
      { 
        includeCitations: Math.random() > 0.7,
        includeError: Math.random() > 0.9
      }
    ));
  }

  return steps;
}

/**
 * リアルタイム更新をシミュレートするGenerator
 * 
 * 使用例:
 * ```typescript
 * const traceGenerator = simulateRealTimeTrace(traceId);
 * for await (const step of traceGenerator) {
 *   // ステップを段階的に表示
 *   setSteps(prev => [...prev, step]);
 * }
 * ```
 */
export async function* simulateRealTimeTrace(
  traceId: string,
  scenario: 'standard' | 'error-prone' | 'long-running' = 'standard'
): AsyncGenerator<TraceStep, void, unknown> {
  let allSteps: TraceStep[];
  
  switch (scenario) {
    case 'error-prone':
      allSteps = generateErrorProneTrace(traceId);
      break;
    case 'long-running':
      allSteps = generateLongRunningTrace(traceId);
      break;
    default:
      allSteps = generateStandardMAGITrace(traceId);
  }

  // 段階的にステップを返す
  for (const step of allSteps) {
    // リアルな遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, randomBetween(300, 1000)));
    yield step;
  }
}

/**
 * 即座に完了したトレースを生成（非リアルタイム表示用）
 */
export function generateCompletedTrace(
  traceId: string,
  scenario: 'standard' | 'error-prone' | 'long-running' = 'standard'
): Promise<TraceStep[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      let steps: TraceStep[];
      
      switch (scenario) {
        case 'error-prone':
          steps = generateErrorProneTrace(traceId);
          break;
        case 'long-running':
          steps = generateLongRunningTrace(traceId);
          break;
        default:
          steps = generateStandardMAGITrace(traceId);
      }
      
      resolve(steps);
    }, randomBetween(100, 500));
  });
}

/**
 * トレースIDを生成
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * メインのモック関数エクスポート
 */
export const mockTraceData = {
  generateStandardTrace: generateStandardMAGITrace,
  generateErrorTrace: generateErrorProneTrace,
  generateLongTrace: generateLongRunningTrace,
  simulateRealTime: simulateRealTimeTrace,
  generateCompleted: generateCompletedTrace,
  generateTraceId,
};