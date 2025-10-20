/**
 * Mock Data Library for MAGI Decision System
 * 
 * このファイルはフロントエンドファースト開発のためのモックデータを提供します。
 * 様々なシナリオ（成功、エラー、エッジケース）を網羅し、
 * UIコンポーネントの動作確認と学習効果を最大化します。
 */

import {
  AgentResponse,
  AgentType,
  AskResponse,
  DecisionType,
  JudgeResponse,
  TraceStep,
  Conversation,
  Message,
  AgentPreset,
  AgentConfig,
} from '@/types/domain';
import { AskAgentResponse, ConversationSummary } from '@/types/api';

// =============================================================================
// Utility Functions - ユーティリティ関数
// =============================================================================

/**
 * ランダムなIDを生成
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * ランダムなトレースIDを生成
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
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

// =============================================================================
// Mock Agent Responses - エージェント応答のモックデータ
// =============================================================================

/**
 * CASPAR（保守的）の応答パターン
 */
const CASPAR_RESPONSES = {
  APPROVED: [
    {
      content: '慎重に検討した結果、適切な準備とリスク管理により実行可能と判断します。過去の類似事例を分析し、成功確率は高いと評価しました。',
      reasoning: '過去のデータ分析により、適切な準備段階を経れば成功確率が85%以上と算出されました。リスクは管理可能な範囲内です。',
    },
    {
      content: '保守的な観点から検証しましたが、この提案は実現可能性が高く、リスクも許容範囲内と判断します。段階的な実装を推奨します。',
      reasoning: 'リスク分析の結果、潜在的な問題は事前に対策可能であり、段階的アプローチにより安全に実行できると結論しました。',
    },
  ],
  REJECTED: [
    {
      content: '慎重な検討が必要です。過去の事例を分析すると、このような急進的な変更は予期しない問題を引き起こす可能性があります。',
      reasoning: 'リスク分析の結果、成功確率が低く、失敗時の影響が大きいと判断。より慎重なアプローチが必要です。',
    },
    {
      content: '現在の状況では実行を推奨できません。不確実性が高く、既存システムへの悪影響が懸念されます。',
      reasoning: '安定性を重視する観点から、現時点での実行はリスクが高すぎると評価。代替案の検討を推奨します。',
    },
  ],
};

/**
 * BALTHASAR（革新的）の応答パターン
 */
const BALTHASAR_RESPONSES = {
  APPROVED: [
    {
      content: '革新的で素晴らしいアイデアです！新しい可能性を切り開く挑戦として、積極的に取り組むべきです。創造性と情熱が成功の鍵となります。',
      reasoning: '創造性と革新性の観点から、大きな価値創造の可能性を評価。人間の感情と直感も重要な判断要素として考慮しました。',
    },
    {
      content: 'この提案には大きな可能性を感じます。従来の枠を超えた発想で、新たな価値を生み出すチャンスです。勇気を持って実行しましょう。',
      reasoning: '革新的アプローチの価値を重視し、感情的・直感的な判断も含めて総合的に評価した結果、実行価値が高いと判断しました。',
    },
  ],
  REJECTED: [
    {
      content: '創造性は重要ですが、この提案は倫理的な観点から問題があります。人間の感情や価値観を十分に考慮していません。',
      reasoning: '革新性は評価できますが、人間中心の価値観と倫理的配慮が不足しており、感情的な側面から否決と判断しました。',
    },
    {
      content: '斬新なアイデアですが、実現には人間的な要素が不足しています。もっと感情や直感を大切にしたアプローチが必要です。',
      reasoning: '技術的には興味深いものの、人間の感情や創造性を軽視した提案であり、革新的価値が限定的と評価しました。',
    },
  ],
};

/**
 * MELCHIOR（バランス型）の応答パターン
 */
const MELCHIOR_RESPONSES = {
  APPROVED: [
    {
      content: 'データを総合的に分析した結果、適切な準備と段階的実装により成功可能と判断します。科学的根拠に基づいた実行計画を推奨します。',
      reasoning: '科学的分析により、リスクを管理しながら実行可能と結論。データドリブンなアプローチで成功確率を最大化できます。',
    },
    {
      content: '論理的分析の結果、この提案は合理的で実現可能性が高いと評価します。バランスの取れたアプローチで進めることを推奨します。',
      reasoning: '定量的・定性的データを総合的に分析し、論理的思考プロセスを経て実行価値が高いと判断しました。',
    },
  ],
  REJECTED: [
    {
      content: 'データ分析の結果、現時点では実行条件が整っていません。より詳細な調査と準備が必要と判断します。',
      reasoning: '科学的分析により、成功に必要な条件が不足していることが判明。論理的思考に基づき否決と判断しました。',
    },
    {
      content: '客観的な評価では、リスクと利益のバランスが取れていません。より慎重な検討と代替案の検討が必要です。',
      reasoning: 'バランス型の観点から総合的に評価した結果、現段階での実行は適切ではないと論理的に結論しました。',
    },
  ],
};

/**
 * 個別エージェントの応答を生成
 */
function generateAgentResponse(
  agentId: AgentType,
  decision: DecisionType,
  executionTime?: number
): AgentResponse {
  if (agentId === 'solomon') {
    throw new Error('SOLOMON is not a regular agent');
  }

  const responses = {
    caspar: CASPAR_RESPONSES,
    balthasar: BALTHASAR_RESPONSES,
    melchior: MELCHIOR_RESPONSES,
  };

  const agentResponses = responses[agentId][decision];
  const selectedResponse = randomChoice(agentResponses);

  return {
    agentId,
    decision,
    content: selectedResponse.content,
    reasoning: selectedResponse.reasoning,
    confidence: randomBetween(0.7, 0.95),
    executionTime: executionTime || Math.floor(randomBetween(800, 2000)),
    timestamp: new Date(),
  };
}

// =============================================================================
// Mock Judge Responses - SOLOMON Judge応答のモックデータ
// =============================================================================

/**
 * SOLOMON Judgeの応答を生成
 */
function generateJudgeResponse(
  agentResponses: AgentResponse[],
  executionTime?: number
): JudgeResponse {
  const approvedCount = agentResponses.filter(r => r.decision === 'APPROVED').length;
  const rejectedCount = agentResponses.filter(r => r.decision === 'REJECTED').length;
  
  const finalDecision: DecisionType = approvedCount > rejectedCount ? 'APPROVED' : 'REJECTED';
  
  // スコア生成（各エージェントに対する評価）
  const scores = agentResponses.map(response => ({
    agentId: response.agentId,
    score: Math.floor(randomBetween(70, 95)),
    reasoning: `${response.agentId.toUpperCase()}の分析は論理的で根拠が明確。${
      response.decision === finalDecision ? '最終判断と一致している' : '異なる視点を提供している'
    }点を評価。`,
  }));

  const summaryTemplates = {
    APPROVED: [
      '3賢者の判断を総合すると、適切な準備により実行可能と評価されます。',
      '多角的な分析の結果、実行価値が高いと判断されました。',
      '慎重な検討を経て、実行に値する提案と結論されました。',
    ],
    REJECTED: [
      '総合的な判断により、現時点での実行は適切ではないと評価されます。',
      '多面的な分析の結果、リスクが利益を上回ると判断されました。',
      '慎重な検討の結果、代替案の検討が必要と結論されました。',
    ],
  };

  const recommendationTemplates = {
    APPROVED: [
      '段階的実装によるリスク管理を推奨します。',
      '適切な準備期間を設けて実行することを推奨します。',
      '継続的な監視体制を整えて実行することを推奨します。',
    ],
    REJECTED: [
      '追加調査と代替案の検討を推奨します。',
      'より詳細な分析と準備期間を設けることを推奨します。',
      '条件が整った時点での再検討を推奨します。',
    ],
  };

  const reasoningTemplates = {
    APPROVED: [
      `多数決により可決。${rejectedCount > 0 ? 'ただし、反対意見も考慮した慎重な実行が必要' : '全員一致での可決'}。`,
      `${approvedCount}票の可決により実行推奨。バランスの取れた判断結果。`,
      '総合的な評価により可決。各エージェントの専門性を活かした判断。',
    ],
    REJECTED: [
      `多数決により否決。${approvedCount > 0 ? 'ただし、賛成意見の価値も認識' : '全員一致での否決'}。`,
      `${rejectedCount}票の否決により実行非推奨。慎重な判断結果。`,
      '総合的な評価により否決。リスク管理を重視した判断。',
    ],
  };

  return {
    finalDecision,
    votingResult: {
      approved: approvedCount,
      rejected: rejectedCount,
      abstained: 0,
    },
    scores,
    summary: randomChoice(summaryTemplates[finalDecision]),
    finalRecommendation: randomChoice(recommendationTemplates[finalDecision]),
    reasoning: randomChoice(reasoningTemplates[finalDecision]),
    confidence: randomBetween(0.75, 0.92),
    executionTime: executionTime || Math.floor(randomBetween(500, 1200)),
    timestamp: new Date(),
  };
}

// =============================================================================
// Mock Trace Steps - トレースステップのモックデータ
// =============================================================================

/**
 * トレースステップを生成
 */
function generateTraceSteps(traceId: string, agentResponses: AgentResponse[]): TraceStep[] {
  const steps: TraceStep[] = [];
  let stepNumber = 1;

  // SOLOMON初期化ステップ
  steps.push({
    id: generateId(),
    traceId,
    stepNumber: stepNumber++,
    agentId: 'solomon',
    action: 'SOLOMON Judge初期化完了',
    toolsUsed: ['orchestrator', 'context_analyzer'],
    citations: [],
    duration: Math.floor(randomBetween(100, 300)),
    errorCount: 0,
    timestamp: new Date(Date.now() - 5000),
  });

  // 質問分析ステップ
  steps.push({
    id: generateId(),
    traceId,
    stepNumber: stepNumber++,
    agentId: 'solomon',
    action: 'ユーザー質問の分析と3賢者への委託準備',
    toolsUsed: ['question_analyzer', 'delegation_planner'],
    citations: [],
    duration: Math.floor(randomBetween(200, 500)),
    errorCount: 0,
    timestamp: new Date(Date.now() - 4500),
  });

  // 各エージェントの実行ステップ
  agentResponses.forEach((response, index) => {
    const startTime = Date.now() - 4000 + (index * 500);
    
    steps.push({
      id: generateId(),
      traceId,
      stepNumber: stepNumber++,
      agentId: response.agentId,
      action: `${response.agentId.toUpperCase()}による分析開始`,
      toolsUsed: ['reasoning_engine', 'knowledge_base'],
      citations: [
        'https://example.com/knowledge-base',
        'https://example.com/case-studies',
      ],
      duration: Math.floor(response.executionTime * 0.3),
      errorCount: 0,
      timestamp: new Date(startTime),
    });

    steps.push({
      id: generateId(),
      traceId,
      stepNumber: stepNumber++,
      agentId: response.agentId,
      action: `${response.agentId.toUpperCase()}による判断完了: ${response.decision}`,
      toolsUsed: ['decision_engine', 'confidence_calculator'],
      citations: [],
      duration: Math.floor(response.executionTime * 0.7),
      errorCount: 0,
      timestamp: new Date(startTime + response.executionTime * 0.3),
    });
  });

  // SOLOMON統合評価ステップ
  steps.push({
    id: generateId(),
    traceId,
    stepNumber: stepNumber++,
    agentId: 'solomon',
    action: '3賢者の判断を統合・評価中',
    toolsUsed: ['integration_engine', 'scoring_system'],
    citations: [],
    duration: Math.floor(randomBetween(300, 800)),
    errorCount: 0,
    timestamp: new Date(Date.now() - 1000),
  });

  steps.push({
    id: generateId(),
    traceId,
    stepNumber: stepNumber++,
    agentId: 'solomon',
    action: 'SOLOMON Judge最終判断完了',
    toolsUsed: ['final_decision_engine'],
    citations: [],
    duration: Math.floor(randomBetween(100, 300)),
    errorCount: 0,
    timestamp: new Date(Date.now() - 200),
  });

  return steps;
}

// =============================================================================
// Scenario Generators - シナリオ別データ生成
// =============================================================================

/**
 * 全員一致可決のシナリオ
 */
export function generateUnanimousApproval(question: string): Promise<AskAgentResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const agentResponses: AgentResponse[] = [
        generateAgentResponse('caspar', 'APPROVED'),
        generateAgentResponse('balthasar', 'APPROVED'),
        generateAgentResponse('melchior', 'APPROVED'),
      ];

      const judgeResponse = generateJudgeResponse(agentResponses);
      const traceId = generateTraceId();

      resolve({
        conversationId: generateId(),
        messageId: generateId(),
        agentResponses,
        judgeResponse,
        traceId,
        executionTime: Math.max(...agentResponses.map(r => r.executionTime)) + judgeResponse.executionTime,
        timestamp: new Date(),
      });
    }, randomBetween(1200, 2000));
  });
}

/**
 * 全員一致否決のシナリオ
 */
export function generateUnanimousRejection(question: string): Promise<AskAgentResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const agentResponses: AgentResponse[] = [
        generateAgentResponse('caspar', 'REJECTED'),
        generateAgentResponse('balthasar', 'REJECTED'),
        generateAgentResponse('melchior', 'REJECTED'),
      ];

      const judgeResponse = generateJudgeResponse(agentResponses);
      const traceId = generateTraceId();

      resolve({
        conversationId: generateId(),
        messageId: generateId(),
        agentResponses,
        judgeResponse,
        traceId,
        executionTime: Math.max(...agentResponses.map(r => r.executionTime)) + judgeResponse.executionTime,
        timestamp: new Date(),
      });
    }, randomBetween(1200, 2000));
  });
}

/**
 * 意見分裂のシナリオ
 */
export function generateSplitDecision(question: string): Promise<AskAgentResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // ランダムに2:1の分裂を生成
      const scenarios: [DecisionType, DecisionType, DecisionType][] = [
        ['APPROVED', 'APPROVED', 'REJECTED'],
        ['APPROVED', 'REJECTED', 'REJECTED'],
        ['REJECTED', 'APPROVED', 'APPROVED'],
      ];
      
      const selectedScenario = randomChoice(scenarios);
      
      const agentResponses: AgentResponse[] = [
        generateAgentResponse('caspar', selectedScenario[0]),
        generateAgentResponse('balthasar', selectedScenario[1]),
        generateAgentResponse('melchior', selectedScenario[2]),
      ];

      const judgeResponse = generateJudgeResponse(agentResponses);
      const traceId = generateTraceId();

      resolve({
        conversationId: generateId(),
        messageId: generateId(),
        agentResponses,
        judgeResponse,
        traceId,
        executionTime: Math.max(...agentResponses.map(r => r.executionTime)) + judgeResponse.executionTime,
        timestamp: new Date(),
      });
    }, randomBetween(1500, 2500));
  });
}

/**
 * エラーシナリオ
 */
export function generateErrorScenario(question: string): Promise<AskAgentResponse> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('エージェント実行中にタイムアウトが発生しました。しばらく待ってから再試行してください。'));
    }, randomBetween(3000, 5000));
  });
}

/**
 * ランダムシナリオ（実際の使用時）
 */
export function generateRandomScenario(question: string): Promise<AskAgentResponse> {
  const scenarios = [
    () => generateUnanimousApproval(question),
    () => generateUnanimousRejection(question),
    () => generateSplitDecision(question),
    () => generateSplitDecision(question), // 意見分裂を少し多めに
  ];

  return randomChoice(scenarios)();
}

// =============================================================================
// Mock Conversations - 会話履歴のモックデータ
// =============================================================================

/**
 * サンプル会話履歴を生成
 */
export function generateMockConversations(): ConversationSummary[] {
  const topics = [
    'AIシステムの導入について',
    '新しいマーケティング戦略の検討',
    'リモートワーク制度の拡充',
    'サステナビリティ投資の判断',
    '新製品開発プロジェクトの承認',
    'セキュリティ対策の強化',
    '組織改革の実施',
    '予算配分の見直し',
    'パートナーシップ契約の締結',
    '技術スタックの刷新',
  ];

  return topics.map((topic, index) => {
    const hasDecision = Math.random() > 0.3;
    return {
      id: generateId(),
      title: topic,
      messageCount: Math.floor(randomBetween(2, 12)),
      lastMessageAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000) - randomBetween(0, 12 * 60 * 60 * 1000)),
      lastDecision: hasDecision ? {
        finalDecision: randomChoice(['APPROVED', 'REJECTED'] as const),
        confidence: randomBetween(0.7, 0.95),
      } : undefined,
      createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000) - randomBetween(12 * 60 * 60 * 1000, 24 * 60 * 60 * 1000)),
      updatedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000) - randomBetween(0, 12 * 60 * 60 * 1000)),
    };
  });
}

// =============================================================================
// Mock Presets - プリセット設定のモックデータ
// =============================================================================

/**
 * デフォルトプリセットを生成
 */
export function generateDefaultPresets(): AgentPreset[] {
  return [
    {
      id: 'default',
      name: 'デフォルト設定',
      description: 'バランスの取れた標準的な設定',
      configs: [
        {
          agentId: 'caspar',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたは保守的で現実的な視点から判断を行うCASPARです。リスクを重視し、慎重な分析を行ってください。',
          temperature: 0.3,
          maxTokens: 1000,
        },
        {
          agentId: 'balthasar',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたは革新的で感情的な視点から判断を行うBALTHASARです。創造性と人間的価値を重視してください。',
          temperature: 0.7,
          maxTokens: 1000,
        },
        {
          agentId: 'melchior',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたはバランス型で科学的な視点から判断を行うMELCHIORです。論理的分析を重視してください。',
          temperature: 0.5,
          maxTokens: 1000,
        },
        {
          agentId: 'solomon',
          modelId: 'claude-3-opus',
          systemPrompt: 'あなたはSOLOMON Judgeです。3賢者の判断を統合し、最終的な評価を行ってください。',
          temperature: 0.4,
          maxTokens: 1500,
        },
      ],
      isDefault: true,
      isPublic: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'academic',
      name: '学術研究用',
      description: '学術的な分析に特化した設定',
      configs: [
        {
          agentId: 'caspar',
          modelId: 'claude-3-opus',
          systemPrompt: 'あなたは学術的な保守性を重視するCASPARです。既存研究との整合性と再現性を重視してください。',
          temperature: 0.2,
          maxTokens: 1500,
        },
        {
          agentId: 'balthasar',
          modelId: 'claude-3-opus',
          systemPrompt: 'あなたは学術的な革新性を重視するBALTHASARです。新規性と創造的な研究価値を評価してください。',
          temperature: 0.6,
          maxTokens: 1500,
        },
        {
          agentId: 'melchior',
          modelId: 'claude-3-opus',
          systemPrompt: 'あなたは学術的な客観性を重視するMELCHIORです。科学的手法と統計的根拠を重視してください。',
          temperature: 0.3,
          maxTokens: 1500,
        },
        {
          agentId: 'solomon',
          modelId: 'claude-3-opus',
          systemPrompt: 'あなたは学術的なSOLOMON Judgeです。研究の学術的価値と社会的意義を総合的に評価してください。',
          temperature: 0.3,
          maxTokens: 2000,
        },
      ],
      isDefault: false,
      isPublic: true,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'business',
      name: 'ビジネス分析用',
      description: 'ビジネス判断に特化した設定',
      configs: [
        {
          agentId: 'caspar',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたはビジネスリスクを重視するCASPARです。財務的影響と市場リスクを慎重に分析してください。',
          temperature: 0.3,
          maxTokens: 1200,
        },
        {
          agentId: 'balthasar',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたはビジネス機会を重視するBALTHASARです。市場機会と顧客価値の創造を評価してください。',
          temperature: 0.8,
          maxTokens: 1200,
        },
        {
          agentId: 'melchior',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたはビジネス分析を重視するMELCHIORです。データドリブンな意思決定と ROI を重視してください。',
          temperature: 0.4,
          maxTokens: 1200,
        },
        {
          agentId: 'solomon',
          modelId: 'claude-3-opus',
          systemPrompt: 'あなたはビジネス統括のSOLOMON Judgeです。企業価値と持続可能性を総合的に評価してください。',
          temperature: 0.4,
          maxTokens: 1800,
        },
      ],
      isDefault: false,
      isPublic: true,
      createdAt: new Date('2024-02-01'),
    },
  ];
}

// =============================================================================
// Export Main Functions - メイン関数のエクスポート
// =============================================================================

/**
 * メインのモック実行関数（開発時に使用）
 */
export const mockMAGIExecution = {
  // 様々なシナリオ
  unanimousApproval: generateUnanimousApproval,
  unanimousRejection: generateUnanimousRejection,
  splitDecision: generateSplitDecision,
  error: generateErrorScenario,
  random: generateRandomScenario,
  
  // データ生成
  conversations: generateMockConversations,
  presets: generateDefaultPresets,
  traceSteps: generateTraceSteps,
};