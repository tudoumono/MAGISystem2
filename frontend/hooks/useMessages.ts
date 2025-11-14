'use client';

/**
 * useMessages Hook - メッセージデータ管理
 * 
 * このフックは特定の会話内のメッセージ（Message）データのCRUD操作とリアルタイム更新を提供します。
 * エージェント応答とSOLOMON Judge評価を含む複雑なメッセージ構造を効率的に管理します。
 * 
 * 目的:
 * - 会話内メッセージの取得・管理
 * - 新規メッセージの作成（ユーザー投稿、エージェント応答）
 * - エージェント応答とJudge評価の更新
 * - リアルタイムメッセージ更新の処理
 * - 楽観的更新によるチャット体験の向上
 * 
 * 設計理由:
 * - チャットUIに最適化された状態管理
 * - エージェント実行中の段階的更新サポート
 * - トレースIDとの連携によるデバッグ支援
 * - メッセージ履歴の効率的な表示
 * 
 * 使用例:
 * ```typescript
 * const ChatInterface = ({ conversationId }: { conversationId: string }) => {
 *   const {
 *     messages,
 *     loading,
 *     sendMessage,
 *     updateAgentResponse,
 *     isAgentExecuting
 *   } = useMessages(conversationId);
 * 
 *   const handleSend = async (content: string) => {
 *     await sendMessage(content);
 *   };
 * 
 *   return (
 *     <div>
 *       {messages.map(message => (
 *         <MessageBubble key={message.id} message={message} />
 *       ))}
 *       {isAgentExecuting && <TypingIndicator />}
 *     </div>
 *   );
 * };
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/lib/amplify/types.ts
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// Phase 3で以下に切り替え: import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/lib/amplify/types';
import type { 
  Message, 
  AgentResponse, 
  JudgeResponse, 
  AskRequest,
  AskResponse 
} from '@/lib/amplify/types';

/**
 * Amplify Data クライアントの初期化
 * 
 * 学習ポイント:
 * - Phase 1-2: モッククライアントを使用
 * - Phase 3: 実際のAmplify clientに切り替え
 * - 環境変数による自動切り替え
 */
import { getAmplifyClient } from '@/lib/amplify/client';
const client = getAmplifyClient();

/**
 * メッセージのJSON文字列フィールドをパースする
 * 
 * データベースにはJSON文字列として保存されているagentResponsesとjudgeResponseを
 * JavaScriptオブジェクトに変換します。
 * 
 * @param message - パース対象のメッセージ
 * @returns パースされたメッセージ
 */
function parseMessageData(message: any): any {
  if (!message) return message;
  
  try {
    return {
      ...message,
      agentResponses: message.agentResponses
        ? (typeof message.agentResponses === 'string' 
            ? JSON.parse(message.agentResponses) 
            : message.agentResponses)
        : null,
      judgeResponse: message.judgeResponse
        ? (typeof message.judgeResponse === 'string'
            ? JSON.parse(message.judgeResponse)
            : message.judgeResponse)
        : null,
    };
  } catch (error) {
    console.error('Failed to parse message data:', error, message);
    
    // パースエラーを記録
    const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
    
    // 安全なデフォルト値を返す
    return {
      ...message,
      agentResponses: null,
      judgeResponse: null,
      _parseError: true,
      _parseErrorMessage: errorMessage,
      _parseErrorTimestamp: new Date().toISOString()
    };
  }
}

/**
 * メッセージ送信パラメータの型定義
 */
interface SendMessageParams {
  content: string;
  agentConfigs?: {
    caspar?: any;
    balthasar?: any;
    melchior?: any;
    solomon?: any;
  };
}

/**
 * エージェント応答更新パラメータの型定義
 */
interface UpdateAgentResponseParams {
  messageId: string;
  agentResponses: AgentResponse[];
  judgeResponse?: JudgeResponse;
  traceId?: string;
}

/**
 * フックの戻り値型定義
 * 
 * 設計理由:
 * - messages: 会話内の全メッセージ（時系列順）
 * - loading: 初期ローディング状態
 * - isAgentExecuting: エージェント実行中の状態
 * - error: エラー状態
 * - sendMessage: ユーザーメッセージ送信とエージェント実行
 * - updateAgentResponse: エージェント応答の段階的更新
 * - refreshMessages: メッセージ一覧の手動更新
 */
interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  isAgentExecuting: boolean;
  error: Error | null;
  sendMessage: (params: SendMessageParams) => Promise<Message>;
  updateAgentResponse: (params: UpdateAgentResponseParams) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

/**
 * useMessages Hook Implementation
 * 
 * 実装パターン:
 * 1. 会話IDベースの状態管理
 * 2. メッセージ履歴の取得と表示
 * 3. リアルタイム更新（新規メッセージ、エージェント応答）
 * 4. エージェント実行状態の管理
 * 5. 楽観的更新によるチャット体験向上
 * 6. エラーハンドリングとリトライ機能
 */
export function useMessages(conversationId: string): UseMessagesReturn {
  // 状態管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAgentExecuting, setIsAgentExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * メッセージ一覧の取得
   * 
   * 学習ポイント:
   * - conversationIdでフィルタリング
   * - createdAt昇順でソート（古いメッセージから表示）
   * - 関連するトレースステップも同時に取得
   */
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await client.models.Message.list({
        filter: {
          conversationId: { eq: conversationId }
        },
        sortDirection: 'ASC', // 古いメッセージから順に表示
        authMode: 'apiKey' // テスト用にAPIキー認証を使用
        // Phase 3で追加: 関連データも同時に取得
        // selectionSet: [
        //   'id', 'conversationId', 'role', 'content', 
        //   'agentResponses', 'judgeResponse', 'traceId', 'createdAt', 'traceSteps.*'
        // ]
      });

      if (result.data) {
        const parsedMessages = result.data.map(parseMessageData);
        setMessages(parsedMessages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  /**
   * メッセージ送信とエージェント実行
   * 
   * 処理フロー:
   * 1. ユーザーメッセージを楽観的に追加
   * 2. サーバーにユーザーメッセージを保存
   * 3. エージェント実行を開始
   * 4. エージェント応答を段階的に更新
   * 5. 最終結果をメッセージに保存
   * 
   * 学習ポイント:
   * - 楽観的更新によるチャット体験の向上
   * - エージェント実行状態の適切な管理
   * - エラー時のロールバック処理
   */
  const sendMessage = useCallback(async (params: SendMessageParams): Promise<Message> => {
    // ユーザーメッセージの楽観的更新
    const optimisticUserMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content: params.content,
      createdAt: new Date().toISOString()
    };

    // 即座にUIを更新
    setMessages(prev => [...prev, optimisticUserMessage]);
    setIsAgentExecuting(true);

    try {
      // 1. ユーザーメッセージをサーバーに保存
      const userMessageResult = await client.models.Message.create({
        conversationId,
        role: 'user',
        content: params.content,
        createdAt: new Date().toISOString()
      }, {
        authMode: 'apiKey' // テスト用にAPIキー認証を使用
      });

      if (!userMessageResult.data) {
        throw new Error('Failed to save user message');
      }

      // 楽観的更新を実際のデータで置換
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticUserMessage.id ? userMessageResult.data! : msg
        )
      );

      // 2. エージェント実行用のアシスタントメッセージを作成
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'assistant',
        content: 'エージェントが回答を準備中...',
        createdAt: new Date().toISOString()
      };

      // アシスタントメッセージを楽観的に追加
      setMessages(prev => [...prev, assistantMessage]);

      // 3. エージェント実行を開始（実際の実装では外部APIを呼び出し）
      // TODO: Phase 3で実装 - 現在はモックデータを使用
      const mockAgentResponse = await simulateAgentExecution(params.content, params.agentConfigs);

      // 4. エージェント応答でアシスタントメッセージを更新
      console.log('Creating assistant message with data:', {
        conversationId,
        role: 'assistant',
        content: mockAgentResponse.judgeResponse.summary,
        agentResponses: mockAgentResponse.agentResponses,
        judgeResponse: mockAgentResponse.judgeResponse,
        traceId: mockAgentResponse.traceId
      });

      const finalAssistantMessage = await client.models.Message.create({
        conversationId: conversationId!,
        role: 'assistant',
        content: mockAgentResponse.judgeResponse.summary,
        agentResponses: JSON.stringify(mockAgentResponse.agentResponses),  // ← JSON文字列化
        judgeResponse: JSON.stringify(mockAgentResponse.judgeResponse),    // ← JSON文字列化
        traceId: mockAgentResponse.traceId,
        createdAt: new Date().toISOString()
      }, {
        authMode: 'apiKey'
      });

      console.log('Assistant message creation result:', finalAssistantMessage);

      if (finalAssistantMessage.data) {
        // パース処理を追加
        const parsedMessage = parseMessageData(finalAssistantMessage.data);
        
        // 楽観的更新を実際のデータで置換
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id ? parsedMessage : msg
          )
        );
        
        return parsedMessage;
      } else {
        console.error('Failed to save assistant message. Full response:', finalAssistantMessage);
        console.error('Response errors:', finalAssistantMessage.errors);
        throw new Error(`Failed to save assistant message: ${JSON.stringify(finalAssistantMessage.errors || 'No error details')}`);
      }

    } catch (err) {
      // エラー時: 楽観的更新をロールバック
      setMessages(prev => 
        prev.filter(msg => msg.id !== optimisticUserMessage.id)
      );
      
      console.error('Failed to send message:', err);
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      throw error;
    } finally {
      setIsAgentExecuting(false);
    }
  }, [conversationId]);

  /**
   * エージェント応答の段階的更新
   * 
   * 使用例:
   * - エージェント実行中の段階的結果表示
   * - トレースステップの追加
   * - 最終評価の更新
   * 
   * 学習ポイント:
   * - リアルタイム更新によるユーザー体験向上
   * - 部分的なデータ更新の効率的な処理
   */
  const updateAgentResponse = useCallback(async (params: UpdateAgentResponseParams): Promise<void> => {
    try {
      // サーバーでメッセージを更新
      const result = await client.models.Message.update({
        id: params.messageId,
        agentResponses: params.agentResponses || null,
        judgeResponse: params.judgeResponse || null,
        traceId: params.traceId || null
      }, {
        authMode: 'apiKey' // テスト用にAPIキー認証を使用
      });

      if (result.data) {
        // ローカル状態を更新
        setMessages(prev => 
          prev.map(msg => 
            msg.id === params.messageId ? result.data! : msg
          )
        );
      }
    } catch (err) {
      console.error('Failed to update agent response:', err);
      const error = err instanceof Error ? err : new Error('Failed to update agent response');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * メッセージ一覧の手動更新
   */
  const refreshMessages = useCallback(async (): Promise<void> => {
    await fetchMessages();
  }, [fetchMessages]);

  /**
   * 初期データ取得
   */
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  /**
   * リアルタイム更新の設定
   * 
   * 学習ポイント:
   * - SubscriptionManager による一元管理
   * - エージェント実行中の段階的更新をサポート
   * - エラーハンドリングと自動再接続
   * - オフライン対応との統合
   */
  useEffect(() => {
    if (!conversationId) return;

    const { getCurrentEnvironmentMode } = require('@/lib/amplify/config');
    const currentMode = getCurrentEnvironmentMode();
    
    if (currentMode === 'MOCK') {
      // モックモード: 従来の実装
      const createSub = client.models.Message.onCreate({
        filter: {
          conversationId: { eq: conversationId }
        }
      }).subscribe({
        next: (data: any) => {
          if (data) {
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === data.id);
              if (exists) return prev;
              return [...prev, data];
            });
          }
        },
        error: (err: any) => console.error('Message create subscription error:', err)
      });

      const updateSub = client.models.Message.onUpdate({
        filter: {
          conversationId: { eq: conversationId }
        }
      }).subscribe({
        next: (data: any) => {
          if (data) {
            setMessages(prev => 
              prev.map(msg => msg.id === data.id ? data : msg)
            );
          }
        },
        error: (err: any) => console.error('Message update subscription error:', err)
      });

      return () => {
        createSub.unsubscribe();
        updateSub.unsubscribe();
      };
    } else {
      // 実環境: SubscriptionManagerを使用
      const { subscriptionManager } = require('@/lib/realtime/subscription-manager');
      
      const subscriptionId = subscriptionManager.subscribeToMessages(conversationId, {
        onCreate: (message: Message) => {
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === message.id);
            if (exists) return prev;
            return [...prev, message];
          });
        },
        onUpdate: (message: Message) => {
          setMessages(prev => 
            prev.map(msg => msg.id === message.id ? message : msg)
          );
        },
        onDelete: (message: Message) => {
          setMessages(prev => 
            prev.filter(msg => msg.id !== message.id)
          );
        },
        onError: (error: Error) => {
          console.error('Message subscription error:', error);
          setError(error);
        }
      });

      return () => {
        subscriptionManager.unsubscribe(subscriptionId);
      };
    }
  }, [conversationId]);

  /**
   * フックの戻り値
   */
  return useMemo(() => ({
    messages,
    loading,
    isAgentExecuting,
    error,
    sendMessage,
    updateAgentResponse,
    refreshMessages
  }), [
    messages,
    loading,
    isAgentExecuting,
    error,
    sendMessage,
    updateAgentResponse,
    refreshMessages
  ]);
}

/**
 * エージェント実行のモックシミュレーション
 * 
 * Phase 1-2用のモック実装
 * Phase 3で実際のStrands Agents + Bedrock AgentCore統合に置き換え
 * 
 * 学習ポイント:
 * - 実際のエージェント実行をシミュレート
 * - リアルな応答時間と結果を生成
 * - 様々なシナリオ（成功、エラー、意見分裂）をサポート
 */
async function simulateAgentExecution(question: string, agentConfigs?: any): Promise<AskResponse> {
  // リアルな応答時間をシミュレート
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // エージェント設定をログ出力（デバッグ用）
  if (agentConfigs) {
    console.log('Agent configs for execution:', agentConfigs);
  }

  return {
    conversationId: 'current-conversation',
    messageId: crypto.randomUUID(),
    agentResponses: [
      {
        agentId: 'caspar',
        decision: 'REJECTED',
        content: '慎重な検討が必要です。過去の事例を分析すると、このような急進的な変更は予期しない問題を引き起こす可能性があります。',
        reasoning: 'リスク分析の結果、成功確率が低く、失敗時の影響が大きいと判断',
        confidence: 0.85,
        executionTime: 1200
      },
      {
        agentId: 'balthasar',
        decision: 'APPROVED',
        content: '革新的で素晴らしいアイデアです！新しい可能性を切り開く挑戦として、積極的に取り組むべきです。',
        reasoning: '創造性と革新性の観点から、大きな価値創造の可能性を評価',
        confidence: 0.92,
        executionTime: 980
      },
      {
        agentId: 'melchior',
        decision: 'APPROVED',
        content: 'データを総合的に分析した結果、適切な準備と段階的実装により成功可能と判断します。',
        reasoning: '科学的分析により、リスクを管理しながら実行可能と結論',
        confidence: 0.78,
        executionTime: 1450
      }
    ],
    judgeResponse: {
      finalDecision: 'APPROVED',
      votingResult: { approved: 2, rejected: 1, abstained: 0 },
      scores: [
        { agentId: 'caspar', score: 75, reasoning: '慎重で現実的な分析' },
        { agentId: 'balthasar', score: 88, reasoning: '創造的で前向きな提案' },
        { agentId: 'melchior', score: 82, reasoning: 'バランスの取れた科学的判断' }
      ],
      summary: '3賢者の判断を総合すると、適切な準備により実行可能',
      finalRecommendation: '段階的実装によるリスク管理を推奨',
      reasoning: '多数決により可決。ただし、CASPARの懸念を考慮した慎重な実行が必要',
      confidence: 0.85
    },
    traceId: `trace-${crypto.randomUUID()}`
  };
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的なチャットインターフェース:
 * ```typescript
 * const { messages, sendMessage, isAgentExecuting } = useMessages(conversationId);
 * 
 * const handleSend = async (content: string) => {
 *   try {
 *     await sendMessage({ content });
 *   } catch (error) {
 *     showErrorMessage(error.message);
 *   }
 * };
 * ```
 * 
 * 2. エージェント実行状態の表示:
 * ```typescript
 * {isAgentExecuting && (
 *   <div className="flex items-center space-x-2">
 *     <Spinner />
 *     <span>3賢者が回答を準備中...</span>
 *   </div>
 * )}
 * ```
 * 
 * 3. メッセージ履歴の表示:
 * ```typescript
 * {messages.map(message => (
 *   <div key={message.id} className={`message ${message.role}`}>
 *     <div className="content">{message.content}</div>
 *     {message.agentResponses && (
 *       <AgentResponsePanel responses={message.agentResponses} />
 *     )}
 *     {message.judgeResponse && (
 *       <JudgeResponsePanel response={message.judgeResponse} />
 *     )}
 *   </div>
 * ))}
 * ```
 */