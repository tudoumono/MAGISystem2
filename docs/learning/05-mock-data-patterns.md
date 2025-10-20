# モックデータ活用学習ガイド

## 📚 学習目標

このドキュメントでは、MAGI Decision Systemの実装を通じて、フロントエンドファースト開発におけるモックデータの効果的な活用方法を学習します。

## 🎯 モックデータ活用とは？

モックデータ活用は、バックエンドAPIが完成する前にフロントエンド開発を進めるための手法です。リアルなデータ構造と動作をシミュレートすることで、UI/UXの完成度を高め、開発効率を向上させます。

### 主要な利点
- **並行開発**: フロントエンドとバックエンドの並行開発が可能
- **早期フィードバック**: UIの動作を早期に確認・改善
- **テストデータ**: 様々なシナリオでのテストが容易
- **学習効果**: 実際のデータ構造を理解しながら開発

## 📁 関連ソースコード

### 主要ファイル
- **`src/lib/mock/data.ts`** - メインのモックデータライブラリ
- **`src/types/domain.ts`** - モックデータの型定義
- **`src/types/api.ts`** - API応答の型定義
- **`amplify/functions/agent-gateway/handler.ts`** - モック応答の実装例

## 🏗️ 実装パターン解説

### 1. モックデータライブラリの設計

**ファイル**: `src/lib/mock/data.ts` (行 1-50)

```typescript
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
```

**学習ポイント**:
- **Utility Functions**: 再利用可能なヘルパー関数の設計
- **Type Safety**: TypeScriptによる型安全なモックデータ生成
- **Randomization**: リアルな動作をシミュレートするランダム要素

### 2. エージェント応答パターンの実装

**ファイル**: `src/lib/mock/data.ts` (行 60-120)

```typescript
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
```

**学習ポイント**:
- **Character Consistency**: 各エージェントの個性を反映した応答パターン
- **Realistic Variation**: 複数の応答パターンによるリアルな多様性
- **Business Logic**: ドメインルール（SOLOMONは通常エージェントではない）の実装

### 3. シナリオベースのデータ生成

**ファイル**: `src/lib/mock/data.ts` (行 350-420)

```typescript
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
```

**学習ポイント**:
- **Scenario-Based Testing**: 様々な状況をシミュレート
- **Async Simulation**: Promise/setTimeoutによる非同期処理のシミュレート
- **Error Handling**: エラーケースの適切な実装

### 4. Lambda関数でのモック実装

**ファイル**: `amplify/functions/agent-gateway/handler.ts` (行 50-120)

```typescript
/**
 * モック応答の生成（Phase 1-2用）
 * 
 * 学習ポイント:
 * - フロントエンドファースト開発のためのモック実装
 * - 実際のエージェント統合前の動作確認用
 * - Phase 3以降で実際のBedrock統合に置き換え予定
 */
async function generateMockResponse(requestBody: any) {
  // 実行時間をシミュレート
  await new Promise(resolve => setTimeout(resolve, 1500));

  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    conversationId: `conv_${Date.now()}`,
    messageId: `msg_${Date.now()}`,
    agentResponses: [
      {
        agentId: 'caspar',
        decision: 'REJECTED',
        content: '慎重な検討が必要です。過去の事例を分析すると、このような急進的な変更は予期しない問題を引き起こす可能性があります。',
        reasoning: 'リスク分析の結果、成功確率が低く、失敗時の影響が大きいと判断',
        confidence: 0.85,
        executionTime: 1200,
        timestamp: new Date().toISOString(),
      },
      {
        agentId: 'balthasar',
        decision: 'APPROVED',
        content: '革新的で素晴らしいアイデアです！新しい可能性を切り開く挑戦として、積極的に取り組むべきです。',
        reasoning: '創造性と革新性の観点から、大きな価値創造の可能性を評価',
        confidence: 0.92,
        executionTime: 980,
        timestamp: new Date().toISOString(),
      },
      {
        agentId: 'melchior',
        decision: 'APPROVED',
        content: 'データを総合的に分析した結果、適切な準備と段階的実装により成功可能と判断します。',
        reasoning: '科学的分析により、リスクを管理しながら実行可能と結論',
        confidence: 0.78,
        executionTime: 1450,
        timestamp: new Date().toISOString(),
      },
    ],
    judgeResponse: {
      finalDecision: 'APPROVED',
      votingResult: { approved: 2, rejected: 1, abstained: 0 },
      scores: [
        { agentId: 'caspar', score: 75, reasoning: '慎重で現実的な分析' },
        { agentId: 'balthasar', score: 88, reasoning: '創造的で前向きな提案' },
        { agentId: 'melchior', score: 82, reasoning: 'バランスの取れた科学的判断' },
      ],
      summary: '3賢者の判断を総合すると、適切な準備により実行可能',
      finalRecommendation: '段階的実装によるリスク管理を推奨',
      reasoning: '多数決により可決。ただし、CASPARの懸念を考慮した慎重な実行が必要',
      confidence: 0.85,
      executionTime: 800,
      timestamp: new Date().toISOString(),
    },
    traceId,
    executionTime: 1450,
    timestamp: new Date().toISOString(),
  };
}
```

**学習ポイント**:
- **Backend Integration**: バックエンドでのモック実装
- **Realistic Timing**: 実際のAPI応答時間をシミュレート
- **Consistent Data**: フロントエンドのモックデータとの一貫性

## 🎨 モックデータの設計原則

### 1. リアリスティックなデータ

```typescript
// ❌ 単純すぎるモックデータ
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
};

// ✅ リアルなモックデータ
const mockUser = {
  id: generateId(),
  name: randomChoice(['田中太郎', '佐藤花子', '鈴木一郎']),
  email: `user${Date.now()}@example.com`,
  preferences: {
    theme: randomChoice(['light', 'dark']),
    language: 'ja',
    notifications: Math.random() > 0.5,
  },
  createdAt: new Date(Date.now() - randomBetween(0, 365 * 24 * 60 * 60 * 1000)),
};
```

### 2. エッジケースの考慮

```typescript
// 様々なデータパターンを生成
export function generateMockConversations(): ConversationSummary[] {
  const topics = [
    'AIシステムの導入について',
    '新しいマーケティング戦略の検討',
    'リモートワーク制度の拡充',
    // ... 多様なトピック
  ];

  return topics.map((topic, index) => {
    const hasDecision = Math.random() > 0.3; // 30%は判断なし
    return {
      id: generateId(),
      title: topic,
      messageCount: Math.floor(randomBetween(2, 12)),
      lastMessageAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000) - randomBetween(0, 12 * 60 * 60 * 1000)),
      lastDecision: hasDecision ? {
        finalDecision: randomChoice(['APPROVED', 'REJECTED'] as const),
        confidence: randomBetween(0.7, 0.95),
      } : undefined, // エッジケース: 判断がない会話
      createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000) - randomBetween(12 * 60 * 60 * 1000, 24 * 60 * 60 * 1000)),
      updatedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000) - randomBetween(0, 12 * 60 * 60 * 1000)),
    };
  });
}
```

### 3. パフォーマンスの考慮

```typescript
// 遅延読み込みのシミュレート
export function generateMockConversationsWithPagination(
  page: number = 1,
  limit: number = 10
): Promise<{ conversations: ConversationSummary[], hasMore: boolean }> {
  return new Promise((resolve) => {
    // ネットワーク遅延をシミュレート
    setTimeout(() => {
      const allConversations = generateMockConversations();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const conversations = allConversations.slice(startIndex, endIndex);
      
      resolve({
        conversations,
        hasMore: endIndex < allConversations.length,
      });
    }, randomBetween(300, 800)); // リアルなAPI応答時間
  });
}
```

## 🔧 開発ワークフローでの活用

### 1. 段階的な実装

```typescript
// Phase 1: 完全モック
export const mockMAGIExecution = {
  unanimousApproval: generateUnanimousApproval,
  unanimousRejection: generateUnanimousRejection,
  splitDecision: generateSplitDecision,
  error: generateErrorScenario,
  random: generateRandomScenario,
};

// Phase 2: 部分的な実データ統合
export const hybridMAGIExecution = {
  // 認証は実データ
  auth: realAuthService,
  // 会話履歴は実データ
  conversations: realConversationService,
  // エージェント実行はまだモック
  agents: mockMAGIExecution,
};

// Phase 3: 完全な実データ統合
export const realMAGIExecution = {
  auth: realAuthService,
  conversations: realConversationService,
  agents: realAgentService,
};
```

### 2. テストデータの管理

```typescript
// テスト用の固定データ
export const testScenarios = {
  // E2Eテスト用の予測可能なデータ
  deterministicApproval: () => Promise.resolve({
    agentResponses: [
      { agentId: 'caspar', decision: 'APPROVED', confidence: 0.8 },
      { agentId: 'balthasar', decision: 'APPROVED', confidence: 0.9 },
      { agentId: 'melchior', decision: 'APPROVED', confidence: 0.85 },
    ],
    judgeResponse: {
      finalDecision: 'APPROVED',
      confidence: 0.85,
    },
  }),
  
  // ストレステスト用の大量データ
  largeDataset: () => generateMockConversations(1000),
  
  // エラーケース用のデータ
  errorCases: {
    networkTimeout: () => new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), 5000)
    ),
    invalidResponse: () => Promise.resolve({ invalid: 'data' }),
  },
};
```

## 🔍 実践的な使用例

### 1. React Componentでの活用

```typescript
import { mockMAGIExecution } from '@/lib/mock/data';

function AgentExecutionDemo() {
  const [result, setResult] = useState<AskAgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAgent = async (scenario: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      switch (scenario) {
        case 'unanimous-approval':
          response = await mockMAGIExecution.unanimousApproval('テスト質問');
          break;
        case 'split-decision':
          response = await mockMAGIExecution.splitDecision('テスト質問');
          break;
        case 'error':
          response = await mockMAGIExecution.error('テスト質問');
          break;
        default:
          response = await mockMAGIExecution.random('テスト質問');
      }
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => executeAgent('unanimous-approval')}>
          全員一致可決
        </button>
        <button onClick={() => executeAgent('split-decision')}>
          意見分裂
        </button>
        <button onClick={() => executeAgent('error')}>
          エラーケース
        </button>
      </div>
      
      {loading && <div>実行中...</div>}
      {error && <div className="text-red-600">エラー: {error}</div>}
      {result && <AgentResultDisplay result={result} />}
    </div>
  );
}
```

### 2. Storybook統合

```typescript
// AgentCard.stories.ts
import type { Meta, StoryObj } from '@storybook/react';
import { AgentCard } from './AgentCard';
import { generateAgentResponse } from '@/lib/mock/data';

const meta: Meta<typeof AgentCard> = {
  title: 'Components/AgentCard',
  component: AgentCard,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CasparApproved: Story = {
  args: {
    response: generateAgentResponse('caspar', 'APPROVED'),
  },
};

export const BalthasarRejected: Story = {
  args: {
    response: generateAgentResponse('balthasar', 'REJECTED'),
  },
};

export const AllScenarios: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {(['caspar', 'balthasar', 'melchior'] as const).map(agent => 
        (['APPROVED', 'REJECTED'] as const).map(decision => (
          <AgentCard 
            key={`${agent}-${decision}`}
            response={generateAgentResponse(agent, decision)}
          />
        ))
      )}
    </div>
  ),
};
```

## 📈 学習の進め方

### Phase 1: 基本概念の理解
1. `src/lib/mock/data.ts`でモックデータの構造を理解
2. 型安全なモックデータ生成の仕組みを学習
3. シナリオベースのテストデータ設計を習得

### Phase 2: 実践的な活用
1. React Componentでのモックデータ活用
2. 非同期処理のシミュレーション
3. エラーハンドリングの実装

### Phase 3: 高度なパターン
1. 段階的な実データ統合
2. テスト自動化との連携
3. パフォーマンステストでの活用

## 🎯 学習成果の確認

以下の質問に答えられるようになったら、基本的な理解ができています：

1. **設計原則**: リアルなモックデータの特徴は？
2. **シナリオ設計**: どのような状況をテストすべきか？
3. **型安全性**: TypeScriptでのモックデータ生成の利点は？
4. **段階的統合**: モックから実データへの移行方法は？
5. **テスト活用**: 自動テストでのモックデータ活用法は？

## 🔗 関連学習リソース

- **TypeScript DDD**: `docs/learning/01-typescript-domain-driven-design.md`
- **Next.js App Router**: `docs/learning/02-nextjs-app-router.md`
- **AWS Amplify Gen2**: `docs/learning/03-aws-amplify-gen2.md`
- **Tailwind CSS Design System**: `docs/learning/04-tailwind-design-system.md`

## 📝 実習課題

1. **新しいシナリオの追加**
   - タイムアウトシナリオの実装
   - 部分的エラーシナリオの作成

2. **リアルなデータパターンの実装**
   - 日本語の自然な会話データ
   - 時系列データの生成

3. **テスト統合の実装**
   - Jest用のモックデータ
   - Cypress用のフィクスチャデータ

---

**次のステップ**: 実際のUI実装に進み、これらの学習内容を統合したコンポーネント開発を行いましょう。