/**
 * Amplify Generated Types - MAGI Decision UI
 * 
 * このファイルはAmplify Data schemaから生成される型定義を含みます。
 * 通常は `npx ampx generate` で自動生成されますが、学習目的で手動定義しています。
 * 
 * 学習ポイント:
 * - GraphQLスキーマからTypeScript型への変換
 * - Amplify Data/AI Kitの型システム
 * - リレーショナルデータの型安全性
 * 
 * 使用例:
 * ```typescript
 * import { User, Conversation, Message } from './types';
 * 
 * const user: User = {
 *   id: 'user-123',
 *   email: 'user@example.com',
 *   name: 'Test User'
 * };
 * ```
 */

/**
 * 基本型定義
 * 
 * 設計理由:
 * - ID: Amplifyで自動生成される一意識別子
 * - DateTime: ISO 8601形式の日時文字列
 * - JSON: 任意のJSONデータ
 */
export type ID = string;
export type DateTime = string;
export type JSON = any;

/**
 * エージェント関連の型定義
 * 
 * 学習ポイント:
 * - AgentType: 4つのエージェント（3賢者 + SOLOMON）
 * - DecisionType: MAGI投票システムの判断結果
 */
export type AgentType = 'caspar' | 'balthasar' | 'melchior' | 'solomon';
export type DecisionType = 'APPROVED' | 'REJECTED';
export type MessageRole = 'user' | 'assistant';

/**
 * エージェント応答の型定義
 * 
 * 設計理由:
 * - decision: MAGI投票システムの可決/否決判断
 * - content: 詳細な回答内容（従来機能）
 * - reasoning: 判断に至った論理的根拠
 * - confidence: 判断の確信度 (0.0-1.0)
 * - executionTime: パフォーマンス監視用
 */
export interface AgentResponse {
  agentId: AgentType;
  decision: DecisionType;
  content: string;
  reasoning: string;
  confidence: number;
  executionTime: number;
}

/**
 * エージェントスコアの型定義
 * 
 * 設計理由:
 * - score: SOLOMON Judgeによる0-100点評価
 * - reasoning: スコアの根拠説明
 */
export interface AgentScore {
  agentId: AgentType;
  score: number;
  reasoning: string;
}

/**
 * SOLOMON Judge応答の型定義
 * 
 * 設計理由:
 * - finalDecision: 最終的な可決/否決判断
 * - votingResult: MAGI投票システムの集計結果
 * - scores: 各賢者への評価スコア
 * - summary: 判断の要約
 * - finalRecommendation: 最終推奨（従来機能）
 * - reasoning: 最終判断の根拠
 * - confidence: 最終判断の確信度
 */
export interface JudgeResponse {
  // MAGI投票システム
  finalDecision: DecisionType;
  votingResult: {
    approved: number;
    rejected: number;
    abstained: number;
  };
  
  // 従来のスコアリングシステム
  scores: AgentScore[];
  summary: string;
  finalRecommendation: string;
  reasoning: string;
  confidence: number;
}

/**
 * エージェント設定の型定義
 * 
 * 設計理由:
 * - modelId: 使用するLLMモデル
 * - systemPrompt: エージェントの人格・役割定義
 * - temperature: 創造性パラメータ
 * - maxTokens: 最大出力トークン数
 */
export interface AgentConfig {
  agentId: AgentType;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Amplify Data Models
 * 
 * 学習ポイント:
 * - これらの型はAmplify Data schemaと完全に一致
 * - リレーション（hasMany, belongsTo）は実際のクエリ時に解決される
 * - 認可ルール（authorization）は型レベルでは表現されない
 */

/**
 * ユーザーモデル
 * 
 * 設計理由:
 * - id: 自動生成される一意識別子
 * - email: 認証用メールアドレス（必須）
 * - name: 表示名（オプション）
 * - preferences: ユーザー設定（JSON形式）
 * - conversations: 関連する会話一覧（リレーション）
 */
export interface User {
  id: ID;
  email: string;
  name?: string | null;
  preferences?: JSON | null;
  conversations?: Conversation[] | null;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

/**
 * 会話モデル
 * 
 * 設計理由:
 * - userId: 所有者の識別子
 * - title: 会話の識別用タイトル
 * - agentPresetId: 使用したプリセット設定
 * - user: 所有者情報（リレーション）
 * - messages: 会話内のメッセージ一覧（リレーション）
 */
export interface Conversation {
  id: ID;
  userId: ID;
  title: string;
  agentPresetId?: string | null | undefined;
  createdAt: DateTime;
  updatedAt: DateTime;
  user?: User | null;
  messages?: Message[] | null;
}

/**
 * メッセージモデル
 * 
 * 設計理由:
 * - conversationId: 所属する会話の識別子
 * - role: メッセージの種類（ユーザー/アシスタント）
 * - content: メッセージ本文
 * - agentResponses: 3賢者の応答（JSON形式）
 * - judgeResponse: SOLOMON Judgeの評価（JSON形式）
 * - traceId: 実行トレースとの関連付け
 * - conversation: 所属する会話（リレーション）
 * - traceSteps: 関連するトレースステップ（リレーション）
 */
export interface Message {
  id: ID;
  conversationId: ID;
  role: MessageRole;
  content: string;
  agentResponses?: AgentResponse[] | null;
  judgeResponse?: JudgeResponse | null;
  traceId?: string | null;
  createdAt: DateTime;
  conversation?: Conversation | null;
  traceSteps?: TraceStep[] | null;
}

/**
 * トレースステップモデル
 * 
 * 設計理由:
 * - messageId: 関連するメッセージの識別子
 * - traceId: 実行トレース全体の識別子
 * - stepNumber: ステップの順序
 * - agentId: 実行したエージェント
 * - action: 実行アクションの要約
 * - toolsUsed: 使用ツール一覧
 * - citations: 引用リンク一覧
 * - duration: 実行時間（パフォーマンス監視用）
 * - errorCount: エラー・リトライ回数（信頼性監視用）
 * - message: 関連するメッセージ（リレーション）
 */
export interface TraceStep {
  id: ID;
  messageId: ID;
  traceId: string;
  stepNumber: number;
  agentId: string;
  action: string;
  toolsUsed: string[];
  citations: string[];
  duration: number;
  errorCount: number;
  timestamp: DateTime;
  message?: Message | null;
}

/**
 * エージェントプリセットモデル
 * 
 * 設計理由:
 * - name: プリセット名
 * - description: プリセットの説明
 * - configs: エージェント設定（JSON形式）
 * - isDefault: デフォルトプリセットの識別
 * - isPublic: 他ユーザーとの共有可否
 * - createdBy: 作成者（公開プリセット用）
 */
export interface AgentPreset {
  id: ID;
  name: string;
  description?: string | null;
  configs: AgentConfig[];
  isDefault: boolean;
  isPublic: boolean;
  createdBy?: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}

/**
 * API操作の型定義
 * 
 * 学習ポイント:
 * - これらの型はGraphQL操作（Query, Mutation, Subscription）で使用
 * - 型安全性により実行時エラーを防止
 */

/**
 * 質問リクエストの型定義
 */
export interface AskRequest {
  message: string;
  conversationId?: string;
  agentConfig?: AgentConfig[];
}

/**
 * 質問応答の型定義
 */
export interface AskResponse {
  conversationId: string;
  messageId: string;
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse;
  traceId: string;
}

/**
 * GraphQL操作の結果型
 * 
 * 学習ポイント:
 * - data: 成功時のデータ
 * - errors: GraphQLエラー一覧
 * - extensions: 追加メタデータ
 */
export interface GraphQLResult<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
  }>;
  extensions?: Record<string, any>;
}

/**
 * リスト操作の結果型
 * 
 * 学習ポイント:
 * - items: データ一覧
 * - nextToken: ページネーション用トークン
 */
export interface ListResult<T> {
  items: T[];
  nextToken?: string;
}

/**
 * サブスクリプション操作の型定義
 * 
 * 学習ポイント:
 * - onCreate: 新規作成時の通知
 * - onUpdate: 更新時の通知
 * - onDelete: 削除時の通知
 */
export interface SubscriptionEvent<T> {
  [key: string]: T;
}

/**
 * エラー型定義
 * 
 * 設計理由:
 * - GraphQLError: GraphQL操作のエラー
 * - NetworkError: ネットワーク関連のエラー
 * - AuthError: 認証関連のエラー
 */
export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: Record<string, any>;
}

export interface NetworkError extends Error {
  statusCode?: number;
  response?: any;
}

export interface AuthError extends Error {
  code: string;
  name: string;
}

/**
 * Amplify Data Schema Type
 * 
 * 学習ポイント:
 * - 実際のAmplify Data schemaから生成される型
 * - Phase 1-2では手動定義、Phase 3で自動生成に移行
 */
export interface Schema {
  User: {
    type: User;
    create: (input: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ data?: User; errors?: any[] }>;
    list: (options?: any) => Promise<{ data?: User[]; errors?: any[] }>;
    get: (id: string) => Promise<{ data?: User; errors?: any[] }>;
    update: (input: Partial<User> & { id: string }) => Promise<{ data?: User; errors?: any[] }>;
    delete: (input: { id: string }) => Promise<{ data?: User; errors?: any[] }>;
  };
  Conversation: {
    type: Conversation;
    create: (input: Omit<Conversation, 'id'>) => Promise<{ data?: Conversation; errors?: any[] }>;
    list: (options?: any) => Promise<{ data?: Conversation[]; errors?: any[] }>;
    get: (id: string) => Promise<{ data?: Conversation; errors?: any[] }>;
    update: (input: Partial<Conversation> & { id: string }) => Promise<{ data?: Conversation; errors?: any[] }>;
    delete: (input: { id: string }) => Promise<{ data?: Conversation; errors?: any[] }>;
  };
  Message: {
    type: Message;
    create: (input: Omit<Message, 'id'>) => Promise<{ data?: Message; errors?: any[] }>;
    list: (options?: any) => Promise<{ data?: Message[]; errors?: any[] }>;
    get: (id: string) => Promise<{ data?: Message; errors?: any[] }>;
    update: (input: Partial<Message> & { id: string }) => Promise<{ data?: Message; errors?: any[] }>;
    delete: (input: { id: string }) => Promise<{ data?: Message; errors?: any[] }>;
  };
  TraceStep: {
    type: TraceStep;
    create: (input: Omit<TraceStep, 'id'>) => Promise<{ data?: TraceStep; errors?: any[] }>;
    list: (options?: any) => Promise<{ data?: TraceStep[]; errors?: any[] }>;
    get: (id: string) => Promise<{ data?: TraceStep; errors?: any[] }>;
    update: (input: Partial<TraceStep> & { id: string }) => Promise<{ data?: TraceStep; errors?: any[] }>;
    delete: (input: { id: string }) => Promise<{ data?: TraceStep; errors?: any[] }>;
  };
  AgentPreset: {
    type: AgentPreset;
    create: (input: Omit<AgentPreset, 'id'>) => Promise<{ data?: AgentPreset; errors?: any[] }>;
    list: (options?: any) => Promise<{ data?: AgentPreset[]; errors?: any[] }>;
    get: (id: string) => Promise<{ data?: AgentPreset; errors?: any[] }>;
    update: (input: Partial<AgentPreset> & { id: string }) => Promise<{ data?: AgentPreset; errors?: any[] }>;
    delete: (input: { id: string }) => Promise<{ data?: AgentPreset; errors?: any[] }>;
  };
}