/**
 * useMessages Hook - メッセージデータ管理カスタムフック
 * 
 * 目的: 特定の会話内のメッセージ管理とエージェント応答の処理
 * 設計理由: メッセージとエージェント応答の複雑な状態管理を抽象化
 * 
 * 主要機能:
 * - 会話内メッセージの取得・表示
 * - ユーザーメッセージの送信
 * - エージェント応答の受信・表示
 * - リアルタイムメッセージ更新
 * - トレース情報の関連付け
 * - 楽観的更新によるUX向上
 * 
 * 学習ポイント:
 * - 複雑な状態管理パターン
 * - リアルタイム通信の実装
 * - エージェント応答の段階的表示
 * - エラーハンドリングと再試行
 * - パフォーマンス最適化
 * 
 * 使用例:
 * ```typescript
 * const {
 *   messages,
 *   loading,
 *   sendMessage,
 *   agentResponding
 * } = useMessages('conversation-id');
 * 
 * // メッセージ送信
 * const handleSendMessage = async (content: string) => {
 *   await sendMessage(content);
 * };
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/types/amplify.ts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { 
  type Message, 
  type CreateMessageInput, 
  type UpdateMessageInput,
  type AgentResponse,
  type JudgeResponse,
  type TraceStep,
  MessageRole,
  type ModelMessageConnection
} from '../types/amplify';

/**
 * Amplify Data クライアントの初期化
 */
const client = generateClient();

/**
 * エージェント実行状態の型定義
 * 
 * 設計理由:
 * - エージェント実行の各段階を明確に管理
 * - UI表示の状態制御
 * - エラー状態の詳細な分類
 */
type AgentExecutionStatus = 
  | 'idle'           // 待機中
  | 'analyzing'      // 質問分析中
  | 'executing'      // 3賢者実行中
  | 'judging'        // SOLOMON評価中
  | 'completed'      // 完了
  | 'error';         // エラー

/**
 * エージェント応答の進行状況
 * 
 * 学習ポイント:
 * - 段階的な応答表示のための状態管理
 * - 各エージェントの実行状況追跡
 * - リアルタイム更新の詳細制御
 */
interface AgentProgress {
  caspar: 'pending' | 'running' | 'completed' | 'error';
  balthasar: 'pending' | 'running' | 'completed' | 'error';
  melchior: 'pending' | 'running' | 'completed' | 'error';
  solomon: 'pending' | 'running' | 'completed' | 'error';
}

/**
 * フック戻り値の型定義
 */
interface UseMessagesReturn {
  // データ状態
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  
  // エージェント実行状態
  agentResponding: boolean;
  agentStatus: AgentExecutionStatus;
  agentProgress: AgentProgress;
  currentTraceId: string | null;
  
  // メッセージ操作
  sendMessage: (content: string, agentPresetId?: string) => Promise<Message | null>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  
  // リアルタイム制御
  subscribeToUpdates: boolean;
  setSubscribeToUpdates: (subscribe: boolean) => void;
  
  // トレース情報
  traceSteps: TraceStep[];
  getTraceStepsForMessage: (messageId: string) => TraceStep[];
}

/**
 * フックの設定オプション
 */
interface UseMessagesOptions {
  limit?: number; // 1回の取得件数（デフォルト: 50）
  enableRealtime?: boolean; // リアルタイム更新（デフォルト: true）
  enableOptimisticUpdates?: boolean; // 楽観的更新（デフォルト: true）
  autoScrollToBottom?: boolean; // 新メッセージ時の自動スクロール（デフォルト: true）
}

/**
 * useMessages カスタムフック
 * 
 * @param conversationId - 対象の会話ID
 * @param options - フックの設定オプション
 * @returns メッセージ管理のためのAPI
 */
export function useMessages(
  conversationId: string | null,
  options: UseMessagesOptions = {}
): UseMessagesReturn {
  const {
    limit = 50,
    enableRealtime = true,
    enableOptimisticUpdates = true,
    autoScrollToBottom = true
  } = options;

  // 基本状態管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(enableRealtime);

  // エージェント実行状態管理
  const [agentResponding, setAgentResponding] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentExecutionStatus>('idle');
  const [agentProgress, setAgentProgress] = useState<AgentProgress>({
    caspar: 'pending',
    balthasar: 'pending',
    melchior: 'pending',
    solomon: 'pending'
  });
  const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);

  // トレース情報管理
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);

  // リアルタイム更新の購読管理
  const subscriptionRef = useRef<any>(null);
  const traceSubscriptionRef = useRef<any>(null);

  /**
   * メッセージ一覧の取得
   * 
   * 学習ポイント:
   * - 会話IDによるフィルタリング
   * - 時系列順でのソート
   * - ページネーション対応
   */
  const fetchMessages = useCallback(async (
    token?: string | null
  ): Promise<ModelMessageConnection | null> => {
    if (!conversationId) return null;

    try {
      setError(null);
      
      // 実際のAmplify実装では以下のようなクエリを使用
      // const response = await client.models.Message.list({
      //   filter: { conversationId: { eq: conversationId } },
      //   limit,
      //   nextToken: token || undefined,
      //   sortDirection: 'ASC' // 古いメッセージから順番に
      // });

      const response = await mockListMessages(conversationId, {
        limit,
        ...(token && { nextToken: token })
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'メッセージの取得に失敗しました';
      setError(errorMessage);
      console.error('Failed to fetch messages:', err);
      return null;
    }
  }, [conversationId, limit]);

  /**
   * 初期メッセージの読み込み
   */
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const loadInitialMessages = async () => {
      setLoading(true);
      const result = await fetchMessages();
      
      if (result) {
        setMessages(result.items.filter(Boolean) as Message[]);
        setNextToken(result.nextToken || null);
        setHasNextPage(!!result.nextToken);
      }
      
      setLoading(false);
    };

    loadInitialMessages();
  }, [conversationId, fetchMessages]);

  /**
   * リアルタイム更新の設定
   * 
   * 学習ポイント:
   * - メッセージ更新の購読
   * - トレースステップ更新の購読
   * - 複数サブスクリプションの管理
   */
  useEffect(() => {
    if (!subscribeToUpdates || !conversationId) return;

    // メッセージ更新の購読
    // 実際のAmplify実装では以下のようなサブスクリプションを使用
    // subscriptionRef.current = client.models.Message.observeQuery({
    //   filter: { conversationId: { eq: conversationId } }
    // }).subscribe({
    //   next: ({ items }) => {
    //     setMessages(items.sort((a, b) => 
    //       new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    //     ));
    //   },
    //   error: (err) => console.error('Message subscription error:', err)
    // });

    subscriptionRef.current = mockSubscribeToMessages(conversationId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    // トレースステップ更新の購読
    traceSubscriptionRef.current = mockSubscribeToTraceSteps((updatedSteps) => {
      setTraceSteps(updatedSteps);
    });

    // クリーンアップ関数
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (traceSubscriptionRef.current) {
        traceSubscriptionRef.current.unsubscribe();
        traceSubscriptionRef.current = null;
      }
    };
  }, [subscribeToUpdates, conversationId]);

  /**
   * メッセージ送信とエージェント実行
   * 
   * 学習ポイント:
   * - 楽観的更新の実装
   * - エージェント実行の段階的状態管理
   * - エラーハンドリングとロールバック
   * - トレース情報の関連付け
   */
  const sendMessage = useCallback(async (
    content: string,
    agentPresetId?: string
  ): Promise<Message | null> => {
    if (!conversationId || !content.trim()) return null;

    try {
      setError(null);
      setAgentResponding(true);
      setAgentStatus('analyzing');
      
      // エージェント進行状況をリセット
      setAgentProgress({
        caspar: 'pending',
        balthasar: 'pending',
        melchior: 'pending',
        solomon: 'pending'
      });

      // ユーザーメッセージの作成
      const userMessageInput: CreateMessageInput = {
        conversationId,
        role: MessageRole.USER,
        content: content.trim(),
      };

      // 楽観的更新: ユーザーメッセージを即座に表示
      let optimisticUserMessage: Message | null = null;
      if (enableOptimisticUpdates) {
        optimisticUserMessage = {
          id: `temp-user-${Date.now()}`,
          ...userMessageInput,
          createdAt: new Date().toISOString(),
          owner: await getCurrentUserId(),
        };
        
        setMessages(prev => [...prev, optimisticUserMessage!]);
      }

      // ユーザーメッセージの保存
      // const savedUserMessage = await client.models.Message.create(userMessageInput);
      const savedUserMessage = await mockCreateMessage(userMessageInput);

      if (!savedUserMessage) {
        throw new Error('メッセージの保存に失敗しました');
      }

      // 楽観的更新の置き換え
      if (enableOptimisticUpdates && optimisticUserMessage) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticUserMessage!.id ? savedUserMessage : msg
          )
        );
      } else {
        setMessages(prev => [...prev, savedUserMessage]);
      }

      // エージェント実行の開始
      setAgentStatus('executing');
      const traceId = generateTraceId();
      setCurrentTraceId(traceId);

      // アシスタントメッセージの楽観的作成
      let optimisticAssistantMessage: Message | null = null;
      if (enableOptimisticUpdates) {
        optimisticAssistantMessage = {
          id: `temp-assistant-${Date.now()}`,
          conversationId,
          role: MessageRole.ASSISTANT,
          content: 'エージェントが分析中です...',
          traceId,
          createdAt: new Date().toISOString(),
          owner: await getCurrentUserId(),
        };
        
        setMessages(prev => [...prev, optimisticAssistantMessage!]);
      }

      // エージェント実行（モック実装）
      const agentResult = await executeMAGIAgents(content, {
        traceId,
        agentPresetId: agentPresetId || undefined,
        onProgress: (progress) => {
          setAgentProgress(progress);
          
          // 各エージェントの完了時にステータス更新
          const completedAgents = Object.values(progress).filter(status => status === 'completed').length;
          if (completedAgents === 3) {
            setAgentStatus('judging'); // 3賢者完了、SOLOMON評価開始
          }
        },
        onTraceStep: (step) => {
          setTraceSteps(prev => [...prev, step]);
        }
      });

      setAgentStatus('completed');
      setAgentResponding(false);

      // アシスタントメッセージの更新
      const assistantMessageInput: CreateMessageInput = {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: agentResult.summary,
        agentResponses: agentResult.agentResponses,
        judgeResponse: agentResult.judgeResponse,
        traceId,
      };

      // const savedAssistantMessage = await client.models.Message.create(assistantMessageInput);
      const savedAssistantMessage = await mockCreateMessage(assistantMessageInput);

      if (savedAssistantMessage) {
        // 楽観的更新の置き換え
        if (enableOptimisticUpdates && optimisticAssistantMessage) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === optimisticAssistantMessage!.id ? savedAssistantMessage : msg
            )
          );
        } else {
          setMessages(prev => [...prev, savedAssistantMessage]);
        }
        
        return savedAssistantMessage;
      }

      return null;
    } catch (err) {
      // エラー時のロールバック
      if (enableOptimisticUpdates) {
        setMessages(prev => 
          prev.filter(msg => !msg.id.startsWith('temp-'))
        );
      }
      
      setAgentResponding(false);
      setAgentStatus('error');
      
      const errorMessage = err instanceof Error ? err.message : 'メッセージの送信に失敗しました';
      setError(errorMessage);
      console.error('Failed to send message:', err);
      return null;
    }
  }, [conversationId, enableOptimisticUpdates]);

  /**
   * 追加メッセージの読み込み（ページネーション）
   */
  const loadMoreMessages = useCallback(async (): Promise<void> => {
    if (!hasNextPage || loading || !conversationId) return;

    setLoading(true);
    const result = await fetchMessages(nextToken);
    
    if (result) {
      const newMessages = result.items.filter(Boolean) as Message[];
      
      // 重複を防いで既存データに追加（古いメッセージを先頭に追加）
      setMessages(prev => {
        const existingIds = new Set(prev.map(msg => msg.id));
        const uniqueNewMessages = newMessages.filter(
          msg => !existingIds.has(msg.id)
        );
        return [...uniqueNewMessages, ...prev];
      });
      
      setNextToken(result.nextToken || null);
      setHasNextPage(!!result.nextToken);
    }
    
    setLoading(false);
  }, [hasNextPage, loading, conversationId, nextToken, fetchMessages]);

  /**
   * メッセージの再読み込み
   */
  const refreshMessages = useCallback(async (): Promise<void> => {
    if (!conversationId) return;

    setError(null);
    setNextToken(null);
    setHasNextPage(false);
    
    setLoading(true);
    const result = await fetchMessages();
    
    if (result) {
      setMessages(result.items.filter(Boolean) as Message[]);
      setNextToken(result.nextToken || null);
      setHasNextPage(!!result.nextToken);
    }
    
    setLoading(false);
  }, [conversationId, fetchMessages]);

  /**
   * 特定メッセージのトレースステップ取得
   */
  const getTraceStepsForMessage = useCallback((messageId: string): TraceStep[] => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message?.traceId) return [];
    
    return traceSteps.filter(step => step.traceId === message.traceId);
  }, [messages, traceSteps]);

  return {
    // データ状態
    messages,
    loading,
    error,
    hasNextPage,
    
    // エージェント実行状態
    agentResponding,
    agentStatus,
    agentProgress,
    currentTraceId,
    
    // メッセージ操作
    sendMessage,
    loadMoreMessages,
    refreshMessages,
    
    // リアルタイム制御
    subscribeToUpdates,
    setSubscribeToUpdates,
    
    // トレース情報
    traceSteps,
    getTraceStepsForMessage,
  };
}

/**
 * モック実装関数群
 * 
 * 注意: 本番環境では実際のAmplify Data APIとエージェント実行APIに置き換える
 */

// 現在のユーザーIDを取得
async function getCurrentUserId(): Promise<string> {
  return 'mock-user-id';
}

// トレースIDの生成
function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// メッセージ一覧取得のモック実装
async function mockListMessages(
  conversationId: string,
  params: { limit: number; nextToken?: string | null }
): Promise<ModelMessageConnection> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      conversationId,
      role: MessageRole.USER,
      content: 'AIの倫理的な使用について教えてください',
      createdAt: '2024-01-01T10:00:00Z',
      owner: 'mock-user-id',
    },
    {
      id: 'msg-2',
      conversationId,
      role: MessageRole.ASSISTANT,
      content: '3賢者による分析結果をお示しします。',
      agentResponses: [
        {
          agentId: 'caspar',
          decision: 'APPROVED',
          content: '慎重な検討が必要ですが、適切なガイドラインがあれば推進すべきです。',
          reasoning: 'リスク管理の観点から段階的な導入を推奨',
          confidence: 0.85,
          executionTime: 1200
        }
      ],
      judgeResponse: {
        finalDecision: 'APPROVED',
        votingResult: { approved: 2, rejected: 1, abstained: 0 },
        scores: [
          { agentId: 'caspar', score: 85, reasoning: '現実的で慎重な分析' }
        ],
        summary: 'AIの倫理的使用は重要な課題です',
        finalRecommendation: '段階的な導入を推奨',
        reasoning: '多数決により可決',
        confidence: 0.82
      },
      traceId: 'trace-example-123',
      createdAt: '2024-01-01T10:01:00Z',
      owner: 'mock-user-id',
    }
  ];

  return {
    items: mockMessages,
    nextToken: null,
  };
}

// メッセージ作成のモック実装
async function mockCreateMessage(input: CreateMessageInput): Promise<Message> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    id: `msg-${Date.now()}`,
    ...input,
    createdAt: new Date().toISOString(),
    owner: await getCurrentUserId(),
  };
}

// MAGIエージェント実行のモック実装
async function executeMAGIAgents(
  question: string,
  options: {
    traceId: string;
    agentPresetId?: string | undefined;
    onProgress: (progress: AgentProgress) => void;
    onTraceStep: (step: TraceStep) => void;
  }
): Promise<{
  summary: string;
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse;
}> {
  const { traceId, onProgress, onTraceStep } = options;

  // 段階的な実行をシミュレート
  const agents: Array<keyof AgentProgress> = ['caspar', 'balthasar', 'melchior'];
  const agentResponses: AgentResponse[] = [];

  // 各エージェントの実行
  for (let i = 0; i < agents.length; i++) {
    const agentId = agents[i];
    
    // エージェント開始
    const updateProgress = (status: 'running' | 'completed') => {
      if (agentId === 'caspar') {
        onProgress((prev: AgentProgress) => ({ ...prev, caspar: status }));
      } else if (agentId === 'balthasar') {
        onProgress((prev: AgentProgress) => ({ ...prev, balthasar: status }));
      } else if (agentId === 'melchior') {
        onProgress((prev: AgentProgress) => ({ ...prev, melchior: status }));
      }
    };
    
    updateProgress('running');
    
    // トレースステップの記録
    onTraceStep({
      id: `step-${Date.now()}-${i}`,
      messageId: 'temp-message-id',
      traceId,
      stepNumber: i + 1,
      agentId: agentId as string,
      action: `${agentId}による質問分析`,
      toolsUsed: ['knowledge_base', 'reasoning_engine'],
      citations: ['https://example.com/ai-ethics'],
      duration: 1000 + Math.random() * 500,
      errorCount: 0,
      timestamp: new Date().toISOString(),
      owner: 'mock-user-id',
    });

    // 実行時間をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // エージェント応答の生成
    const response: AgentResponse = {
      agentId: agentId as 'caspar' | 'balthasar' | 'melchior',
      decision: Math.random() > 0.5 ? 'APPROVED' : 'REJECTED',
      content: `${agentId}による分析結果: ${question}について詳細に検討しました。`,
      reasoning: `${agentId}の視点から総合的に判断`,
      confidence: 0.7 + Math.random() * 0.3,
      executionTime: 1000 + Math.random() * 500
    };

    agentResponses.push(response);
    
    // エージェント完了
    updateProgress('completed');
  }

  // SOLOMON Judge の実行
  onProgress((prev: AgentProgress) => ({ ...prev, solomon: 'running' }));
  
  await new Promise(resolve => setTimeout(resolve, 800));

  const judgeResponse: JudgeResponse = {
    finalDecision: 'APPROVED',
    votingResult: {
      approved: agentResponses.filter(r => r.decision === 'APPROVED').length,
      rejected: agentResponses.filter(r => r.decision === 'REJECTED').length,
      abstained: 0
    },
    scores: agentResponses.map(r => ({
      agentId: r.agentId,
      score: Math.floor(70 + Math.random() * 30),
      reasoning: `${r.agentId}の分析は適切でした`
    })),
    summary: '3賢者の分析を統合した結果をお示しします。',
    finalRecommendation: '総合的に推奨されます',
    reasoning: 'MAGI投票システムによる総合判断',
    confidence: 0.85
  };

  onProgress((prev: AgentProgress) => ({ ...prev, solomon: 'completed' }));

  return {
    summary: judgeResponse.summary,
    agentResponses,
    judgeResponse
  };
}

// リアルタイム更新のモック実装
function mockSubscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  return { unsubscribe: () => {} };
}

function mockSubscribeToTraceSteps(callback: (steps: TraceStep[]) => void) {
  return { unsubscribe: () => {} };
}