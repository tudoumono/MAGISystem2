/**
 * API Types for MAGI Decision System
 * 
 * このファイルはフロントエンドとバックエンド間のAPI通信で使用される型を定義します。
 * AWS Amplify、Amazon Bedrock、Strands Agentsとの統合を考慮した設計です。
 */

import { AgentConfig, AgentResponse, JudgeResponse, TraceStep } from './domain';

// =============================================================================
// Request/Response Types - リクエスト・レスポンス型定義
// =============================================================================

/**
 * エージェント実行リクエスト
 * 
 * 設計理由:
 * - message: ユーザーの質問（必須）
 * - conversationId: 既存会話への追加（オプション）
 * - agentConfig: カスタム設定（オプション、未指定時はデフォルト使用）
 * - metadata: 追加のコンテキスト情報
 */
export interface AskAgentRequest {
  message: string;
  conversationId?: string;
  agentConfig?: AgentConfig[];
  metadata?: {
    userAgent?: string;
    sessionId?: string;
    experimentId?: string;        // A/Bテスト用
  };
}

/**
 * エージェント実行レスポンス
 * 
 * 設計理由:
 * - 完全な実行結果を一度に返すことで、UIの複雑性を軽減
 * - traceId: OpenTelemetryトレースとの連携
 * - executionTime: パフォーマンス監視用
 */
export interface AskAgentResponse {
  conversationId: string;
  messageId: string;
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse;
  traceId: string;
  executionTime: number;           // 全体実行時間
  timestamp: Date;
}

/**
 * 会話履歴取得リクエスト
 * 
 * 設計理由:
 * - ページネーション対応
 * - 検索・フィルタリング機能
 * - パフォーマンス最適化のための段階的読み込み
 */
export interface GetConversationsRequest {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    dateRange?: {
      start: string;               // ISO 8601形式
      end: string;
    };
    hasDecisions?: boolean;        // MAGI判断を含む会話のみ
  };
}

/**
 * 会話履歴取得レスポンス
 */
export interface GetConversationsResponse {
  conversations: ConversationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * 会話サマリー（一覧表示用）
 * 
 * 設計理由:
 * - 一覧表示では詳細なメッセージ内容は不要
 * - パフォーマンス最適化のための軽量データ
 */
export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: Date;
  lastDecision?: {
    finalDecision: 'APPROVED' | 'REJECTED';
    confidence: number;
  } | undefined;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * トレース取得リクエスト
 */
export interface GetTraceRequest {
  traceId: string;
  includeSteps?: boolean;          // ステップ詳細を含むか
}

/**
 * トレース取得レスポンス
 */
export interface GetTraceResponse {
  traceId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  steps: TraceStep[];
  summary: {
    totalSteps: number;
    errorCount: number;
    toolsUsed: string[];
    agentsInvolved: string[];
  };
}

// =============================================================================
// Error Types - エラー関連の型定義
// =============================================================================

/**
 * API エラーレスポンス
 * 
 * 設計理由:
 * - 統一されたエラーハンドリング
 * - ユーザーフレンドリーなエラーメッセージ
 * - デバッグ情報の提供
 */
export interface APIError {
  code: string;                    // エラーコード（例: 'AGENT_TIMEOUT'）
  message: string;                 // ユーザー向けメッセージ
  details?: string;                // 詳細情報（開発者向け）
  traceId?: string;                // エラー発生時のトレースID
  timestamp: Date;
  retryable: boolean;              // リトライ可能かどうか
}

/**
 * エラーコード定義
 * 
 * 設計理由:
 * - エラーの分類と適切な処理方法の決定
 * - ユーザーへの適切なフィードバック提供
 */
export const API_ERROR_CODES = {
  // 認証関連
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // エージェント実行関連
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  AGENT_ERROR: 'AGENT_ERROR',
  INVALID_CONFIG: 'INVALID_CONFIG',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  
  // データ関連
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  TRACE_NOT_FOUND: 'TRACE_NOT_FOUND',
  
  // システム関連
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type APIErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// =============================================================================
// WebSocket Types - リアルタイム通信関連の型定義
// =============================================================================

/**
 * WebSocketメッセージの基底型
 */
export interface WebSocketMessage {
  type: string;
  timestamp: Date;
  traceId?: string;
}

/**
 * トレースステップ更新メッセージ
 * 
 * 設計理由:
 * - リアルタイムでの実行状況表示
 * - ユーザーエンゲージメントの向上
 */
export interface TraceStepUpdateMessage extends WebSocketMessage {
  type: 'trace_step_update';
  step: TraceStep;
}

/**
 * エージェント状態更新メッセージ
 */
export interface AgentStatusUpdateMessage extends WebSocketMessage {
  type: 'agent_status_update';
  agentId: string;
  status: 'thinking' | 'completed' | 'error';
  progress?: number;               // 0-100の進捗率
}

/**
 * 実行完了メッセージ
 */
export interface ExecutionCompleteMessage extends WebSocketMessage {
  type: 'execution_complete';
  result: AskAgentResponse;
}

/**
 * エラーメッセージ
 */
export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  error: APIError;
}

export type WebSocketMessageType = 
  | TraceStepUpdateMessage
  | AgentStatusUpdateMessage
  | ExecutionCompleteMessage
  | ErrorMessage;

// =============================================================================
// Configuration Types - 設定関連のAPI型定義
// =============================================================================

/**
 * プリセット作成リクエスト
 */
export interface CreatePresetRequest {
  name: string;
  description: string;
  configs: AgentConfig[];
  isPublic?: boolean;
}

/**
 * プリセット更新リクエスト
 */
export interface UpdatePresetRequest {
  id: string;
  name?: string;
  description?: string;
  configs?: AgentConfig[];
  isPublic?: boolean;
}

/**
 * プリセット一覧取得レスポンス
 */
export interface GetPresetsResponse {
  presets: PresetSummary[];
}

/**
 * プリセットサマリー（一覧表示用）
 */
export interface PresetSummary {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isPublic: boolean;
  createdBy?: string;
  usageCount?: number;             // 使用回数（人気度指標）
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Analytics Types - 分析・監視関連の型定義
// =============================================================================

/**
 * 使用統計リクエスト
 */
export interface GetUsageStatsRequest {
  period: 'day' | 'week' | 'month';
  startDate?: string;              // ISO 8601形式
  endDate?: string;
}

/**
 * 使用統計レスポンス
 */
export interface GetUsageStatsResponse {
  period: {
    start: Date;
    end: Date;
  };
  stats: {
    totalConversations: number;
    totalMessages: number;
    totalExecutions: number;
    averageResponseTime: number;
    decisionBreakdown: {
      approved: number;
      rejected: number;
    };
    agentUsage: {
      [agentId: string]: {
        executions: number;
        averageConfidence: number;
        averageResponseTime: number;
      };
    };
    errorRate: number;
  };
}

// =============================================================================
// Type Guards - 型ガード関数
// =============================================================================

/**
 * APIエラーの型ガード
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error &&
    'retryable' in error
  );
}

/**
 * WebSocketメッセージの型ガード
 */
export function isWebSocketMessage(data: unknown): data is WebSocketMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'timestamp' in data
  );
}

/**
 * トレースステップ更新メッセージの型ガード
 */
export function isTraceStepUpdateMessage(
  message: WebSocketMessage
): message is TraceStepUpdateMessage {
  return message.type === 'trace_step_update' && 'step' in message;
}

/**
 * エージェント状態更新メッセージの型ガード
 */
export function isAgentStatusUpdateMessage(
  message: WebSocketMessage
): message is AgentStatusUpdateMessage {
  return message.type === 'agent_status_update' && 'agentId' in message && 'status' in message;
}

/**
 * 実行完了メッセージの型ガード
 */
export function isExecutionCompleteMessage(
  message: WebSocketMessage
): message is ExecutionCompleteMessage {
  return message.type === 'execution_complete' && 'result' in message;
}

/**
 * エラーメッセージの型ガード
 */
export function isErrorMessage(
  message: WebSocketMessage
): message is ErrorMessage {
  return message.type === 'error' && 'error' in message;
}