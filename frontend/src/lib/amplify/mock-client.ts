/**
 * Mock Amplify Client - Phase 1-2 Development
 * 
 * このファイルはPhase 1-2での開発用モッククライアントを提供します。
 * 実際のAmplify Data/AI Kitクライアントと同じAPIを持ちながら、
 * ローカルストレージとモックデータで動作します。
 * 
 * 目的:
 * - Amplify設定なしでの開発支援
 * - フロントエンドファースト開発の実現
 * - 実際のAPIとの互換性確保
 * - 学習用のサンプルデータ提供
 * 
 * 設計理由:
 * - 実際のAmplify clientと同じインターフェース
 * - ローカルストレージによるデータ永続化
 * - リアルタイム更新のシミュレーション
 * - Phase 3での実クライアントへの簡単な移行
 * 
 * 学習ポイント:
 * - モッククライアントの実装パターン
 * - ローカルストレージの活用
 * - 非同期処理のシミュレーション
 * - 型安全性の確保
 * 
 * 使用例:
 * ```typescript
 * import { mockClient } from '@/lib/amplify/mock-client';
 * 
 * // Phase 1-2: モッククライアント使用
 * const client = mockClient;
 * 
 * // Phase 3: 実クライアントに切り替え
 * // const client = generateClient<Schema>();
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/hooks/useMessages.ts
 */

import type { 
  Schema, 
  Conversation, 
  Message, 
  User, 
  TraceStep, 
  AgentPreset 
} from './types';

/**
 * ローカルストレージキー
 */
const STORAGE_KEYS = {
  conversations: 'magi-conversations',
  messages: 'magi-messages',
  users: 'magi-users',
  traceSteps: 'magi-trace-steps',
  agentPresets: 'magi-agent-presets'
} as const;

/**
 * モックデータの初期化
 */
function initializeMockData() {
  // 初期会話データ
  if (!localStorage.getItem(STORAGE_KEYS.conversations)) {
    const initialConversations: Conversation[] = [
      {
        id: 'conv-1',
        userId: 'user-1',
        title: 'AIの倫理について',
        agentPresetId: 'default',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1日前
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'conv-2',
        userId: 'user-1',
        title: '気候変動対策の評価',
        agentPresetId: 'academic',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1時間前
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(initialConversations));
  }

  // 初期メッセージデータ
  if (!localStorage.getItem(STORAGE_KEYS.messages)) {
    const initialMessages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'user',
        content: 'AIの開発において最も重要な倫理的考慮事項は何ですか？',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        role: 'assistant',
        content: '3賢者による分析結果をお示しします。',
        agentResponses: [
          {
            agentId: 'caspar',
            decision: 'APPROVED',
            content: '透明性と説明可能性が最重要です。AIシステムの決定プロセスを理解できることで、責任の所在を明確にできます。',
            reasoning: '実用性と安全性の観点から、説明可能なAIが必要',
            confidence: 0.88,
            executionTime: 1200
          },
          {
            agentId: 'balthasar',
            decision: 'APPROVED',
            content: '人間の尊厳と多様性の尊重こそが核心です。AIは人間を支援し、創造性を高める存在であるべきです。',
            reasoning: '人間中心の価値観に基づく判断',
            confidence: 0.92,
            executionTime: 980
          },
          {
            agentId: 'melchior',
            decision: 'APPROVED',
            content: 'データの公平性とバイアス除去が科学的に最も重要です。統計的な偏見を排除することで、公正なAIを実現できます。',
            reasoning: 'データサイエンスの観点から公平性を重視',
            confidence: 0.85,
            executionTime: 1350
          }
        ],
        judgeResponse: {
          finalDecision: 'APPROVED',
          votingResult: { approved: 3, rejected: 0, abstained: 0 },
          scores: [
            { agentId: 'caspar', score: 88, reasoning: '実用的で現実的な視点' },
            { agentId: 'balthasar', score: 92, reasoning: '人間中心の価値観' },
            { agentId: 'melchior', score: 85, reasoning: '科学的で客観的な分析' }
          ],
          summary: '3賢者全員がAI倫理の重要性に同意。透明性、人間の尊厳、データの公平性が三本柱。',
          finalRecommendation: '多角的なアプローチでAI倫理を確立することを推奨',
          reasoning: '全員一致で可決。各視点が補完し合い、包括的な倫理フレームワークを形成',
          confidence: 0.88
        },
        traceId: 'trace-1',
        createdAt: new Date(Date.now() - 86300000).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(initialMessages));
  }
}

/**
 * 遅延シミュレーション
 */
function simulateDelay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * モック会話操作
 */
const mockConversationOperations = {
  async list(options?: any) {
    await simulateDelay();
    const conversations: Conversation[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.conversations) || '[]'
    );
    
    // ソート処理
    const sorted = conversations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return { data: sorted };
  },

  async create(input: Omit<Conversation, 'id'>) {
    await simulateDelay();
    const conversations: Conversation[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.conversations) || '[]'
    );
    
    const newConversation: Conversation = {
      ...input,
      id: `conv-${Date.now()}`,
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: input.updatedAt || new Date().toISOString()
    };
    
    conversations.unshift(newConversation);
    localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations));
    
    return { data: newConversation };
  },

  async update(input: Partial<Conversation> & { id: string }) {
    await simulateDelay();
    const conversations: Conversation[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.conversations) || '[]'
    );
    
    const index = conversations.findIndex(c => c.id === input.id);
    if (index === -1) {
      return { errors: [{ message: 'Conversation not found' }] };
    }
    
    conversations[index] = {
      ...conversations[index],
      ...input,
      updatedAt: new Date().toISOString()
    } as Conversation;
    
    localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations));
    
    return { data: conversations[index] };
  },

  async delete(input: { id: string }) {
    await simulateDelay();
    const conversations: Conversation[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.conversations) || '[]'
    );
    
    const filtered = conversations.filter(c => c.id !== input.id);
    localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(filtered));
    
    return { data: { id: input.id } };
  },

  // モックサブスクリプション
  onCreate() {
    return {
      subscribe: (callbacks: { next?: (data: any) => void; error?: (err: any) => void }) => ({
        unsubscribe: () => {}
      })
    };
  },

  onUpdate() {
    return {
      subscribe: (callbacks: { next?: (data: any) => void; error?: (err: any) => void }) => ({
        unsubscribe: () => {}
      })
    };
  },

  onDelete() {
    return {
      subscribe: (callbacks: { next?: (data: any) => void; error?: (err: any) => void }) => ({
        unsubscribe: () => {}
      })
    };
  }
};

/**
 * モックメッセージ操作
 */
const mockMessageOperations = {
  async list(options?: any) {
    await simulateDelay();
    const messages: Message[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.messages) || '[]'
    );
    
    let filtered = messages;
    
    // conversationIdでフィルタリング
    if (options?.filter?.conversationId?.eq) {
      filtered = messages.filter(m => m.conversationId === options.filter.conversationId.eq);
    }
    
    // ソート処理
    const sorted = filtered.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    return { data: sorted };
  },

  async create(input: Omit<Message, 'id'>) {
    await simulateDelay();
    const messages: Message[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.messages) || '[]'
    );
    
    const newMessage: Message = {
      ...input,
      id: `msg-${Date.now()}`,
      createdAt: input.createdAt || new Date().toISOString()
    };
    
    messages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    
    return { data: newMessage };
  },

  async update(input: Partial<Message> & { id: string }) {
    await simulateDelay();
    const messages: Message[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.messages) || '[]'
    );
    
    const index = messages.findIndex(m => m.id === input.id);
    if (index === -1) {
      return { errors: [{ message: 'Message not found' }] };
    }
    
    messages[index] = {
      ...messages[index],
      ...input
    } as Message;
    
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    
    return { data: messages[index] };
  },

  // モックサブスクリプション
  onCreate(options?: any) {
    return {
      subscribe: (callbacks: { next?: (data: any) => void; error?: (err: any) => void }) => ({
        unsubscribe: () => {}
      })
    };
  },

  onUpdate(options?: any) {
    return {
      subscribe: (callbacks: { next?: (data: any) => void; error?: (err: any) => void }) => ({
        unsubscribe: () => {}
      })
    };
  }
};

/**
 * モッククライアント
 * 
 * 学習ポイント:
 * - 実際のAmplify clientと同じインターフェース
 * - models.ModelName.operation() パターン
 * - 非同期処理とエラーハンドリング
 * - サブスクリプション機能のモック
 */
export const mockClient = {
  models: {
    Conversation: mockConversationOperations,
    Message: mockMessageOperations,
    User: {
      async list() { return { data: [] }; },
      async create(input: any) { return { data: input }; },
      async update(input: any) { return { data: input }; },
      async delete(input: any) { return { data: input }; }
    },
    TraceStep: {
      async list() { return { data: [] }; },
      async create(input: any) { return { data: input }; },
      async update(input: any) { return { data: input }; },
      async delete(input: any) { return { data: input }; }
    },
    AgentPreset: {
      async list() { return { data: [] }; },
      async create(input: any) { return { data: input }; },
      async update(input: any) { return { data: input }; },
      async delete(input: any) { return { data: input }; }
    }
  }
};

// モックデータの初期化
if (typeof window !== 'undefined') {
  initializeMockData();
}

/**
 * クライアント生成関数（モック版）
 * 
 * Phase 3で実際のgenerateClientに置き換え
 */
export function generateMockClient<T = Schema>() {
  return mockClient as any;
}

/**
 * 使用例とPhase移行パターン
 * 
 * Phase 1-2: モッククライアント使用
 * ```typescript
 * import { generateMockClient } from '@/lib/amplify/mock-client';
 * const client = generateMockClient<Schema>();
 * ```
 * 
 * Phase 3: 実クライアントに移行
 * ```typescript
 * import { generateClient } from 'aws-amplify/data';
 * const client = generateClient<Schema>();
 * ```
 * 
 * フックでの使用パターン:
 * ```typescript
 * // 環境変数で切り替え
 * const client = process.env.NODE_ENV === 'development' 
 *   ? generateMockClient<Schema>()
 *   : generateClient<Schema>();
 * ```
 */