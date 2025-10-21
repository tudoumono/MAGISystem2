/**
 * Amplify Generated Types - MAGI Decision System
 * 
 * このファイルはAmplify Data スキーマから生成される型定義を含みます。
 * 通常は `npx ampx generate` で自動生成されますが、
 * 学習目的で手動定義し、各型の意味と使用方法を詳細に解説します。
 * 
 * 学習ポイント:
 * - GraphQL スキーマから TypeScript 型への変換パターン
 * - Amplify の型システムとクライアント統合
 * - リレーショナルデータの型安全な表現
 */

/**
 * 基本的なAmplify型定義
 * 
 * 学習ポイント:
 * - ModelIdentifier: Amplify で使用される一意識別子の型
 * - LazyLoading: 関連データの遅延読み込み用型
 */
export type ModelIdentifier<T = any> = {
  id: string;
} & T;

export type LazyLoading = Promise<any>;

/**
 * ユーザーモデル型定義
 * 
 * 設計理由:
 * - id: 自動生成される一意識別子
 * - email: 認証用メールアドレス（必須）
 * - name: 表示名（オプション）
 * - preferences: ユーザー設定（JSON形式）
 * - conversations: 関連する会話一覧（遅延読み込み）
 * 
 * 使用例:
 * ```typescript
 * const user: User = {
 *   id: "user-123",
 *   email: "user@example.com",
 *   name: "山田太郎",
 *   preferences: { theme: "dark", language: "ja" }
 * };
 * ```
 */
export type User = {
  readonly id: string;
  readonly email: string;
  readonly name?: string | null;
  readonly preferences?: any | null; // JSON型 - ユーザー設定
  readonly conversations?: LazyLoading; // hasMany関係
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly owner?: string | null;
};

/**
 * 会話モデル型定義
 * 
 * 設計理由:
 * - userId: 会話の所有者ID（外部キー）
 * - title: 会話の識別用タイトル
 * - agentPresetId: 使用したエージェント設定プリセット
 * - user: 所有者ユーザーへの参照（belongsTo）
 * - messages: 会話内のメッセージ一覧（hasMany）
 * 
 * 使用例:
 * ```typescript
 * const conversation: Conversation = {
 *   id: "conv-123",
 *   userId: "user-123",
 *   title: "AIエージェントの活用について",
 *   agentPresetId: "preset-default",
 *   createdAt: "2024-01-01T00:00:00Z",
 *   updatedAt: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export type Conversation = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly agentPresetId?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly user?: LazyLoading; // belongsTo関係
  readonly messages?: LazyLoading; // hasMany関係
  readonly owner?: string | null;
};

/**
 * メッセージロール列挙型
 * 
 * 学習ポイント:
 * - GraphQL enum型のTypeScript表現
 * - チャットシステムでの標準的なロール分類
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

/**
 * Schema型定義（Amplify Data用）
 * 
 * 学習ポイント:
 * - Amplify Data クライアントで使用される型
 * - 実際のAmplify codegenで生成される型の代替
 */
export type Schema = {
  User: {
    type: User;
    create: CreateUserInput;
    update: UpdateUserInput;
  };
  Conversation: {
    type: Conversation;
    create: CreateConversationInput;
    update: UpdateConversationInput;
  };
  Message: {
    type: Message;
    create: CreateMessageInput;
    update: UpdateMessageInput;
  };
  TraceStep: {
    type: TraceStep;
    create: CreateTraceStepInput;
  };
  AgentPreset: {
    type: AgentPreset;
    create: CreateAgentPresetInput;
    update: UpdateAgentPresetInput;
  };
};

/**
 * エージェント応答型定義
 * 
 * 設計理由:
 * - agentId: エージェント識別子（caspar, balthasar, melchior）
 * - decision: MAGI投票システムでの判断（可決/否決）
 * - content: 詳細な回答内容
 * - reasoning: 判断に至った論理的根拠
 * - confidence: 判断の確信度（0.0-1.0）
 * - executionTime: 実行時間（パフォーマンス監視用）
 */
export type AgentResponse = {
  agentId: 'caspar' | 'balthasar' | 'melchior';
  decision: 'APPROVED' | 'REJECTED';
  content: string;
  reasoning: string;
  confidence: number;
  executionTime: number;
};

/**
 * エージェントスコア型定義
 * 
 * 設計理由:
 * - SOLOMON Judge による各賢者への評価
 * - score: 0-100点のスコアリング
 * - reasoning: スコアの根拠説明
 */
export type AgentScore = {
  agentId: 'caspar' | 'balthasar' | 'melchior';
  score: number;
  reasoning: string;
};

/**
 * Judge応答型定義
 * 
 * 設計理由:
 * - MAGI投票システムと従来スコアリングシステムの統合
 * - finalDecision: SOLOMONの最終判断
 * - votingResult: 投票結果の集計
 * - scores: 各賢者への評価（従来機能）
 * - summary: 判断の要約
 * - finalRecommendation: 最終推奨
 * - reasoning: 最終判断の根拠
 * - confidence: 最終判断の確信度
 */
export type JudgeResponse = {
  // MAGI投票システム
  finalDecision: 'APPROVED' | 'REJECTED';
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
};

/**
 * メッセージモデル型定義
 * 
 * 設計理由:
 * - role: メッセージの種類（ユーザー/アシスタント）
 * - content: メッセージ本文
 * - agentResponses: 3賢者の応答（JSON形式）
 * - judgeResponse: SOLOMON Judgeの評価（JSON形式）
 * - traceId: 実行トレースとの関連付け
 * - conversation: 所属する会話への参照
 * - traceSteps: 関連するトレースステップ一覧
 * 
 * 使用例:
 * ```typescript
 * const message: Message = {
 *   id: "msg-123",
 *   conversationId: "conv-123",
 *   role: MessageRole.USER,
 *   content: "AIの倫理的な使用について教えてください",
 *   createdAt: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export type Message = {
  readonly id: string;
  readonly conversationId: string;
  readonly role?: MessageRole | null;
  readonly content: string;
  readonly agentResponses?: AgentResponse[] | null; // JSON型
  readonly judgeResponse?: JudgeResponse | null; // JSON型
  readonly traceId?: string | null;
  readonly createdAt: string;
  readonly conversation?: LazyLoading; // belongsTo関係
  readonly traceSteps?: LazyLoading; // hasMany関係
  readonly owner?: string | null;
};

/**
 * トレースステップモデル型定義
 * 
 * 設計理由:
 * - traceId: 実行トレース全体の識別子
 * - stepNumber: ステップの順序
 * - agentId: 実行したエージェント
 * - action: 実行アクションの要約
 * - toolsUsed: 使用ツール一覧
 * - citations: 引用リンク一覧
 * - duration: 実行時間（パフォーマンス監視用）
 * - errorCount: エラー・リトライ回数（信頼性監視用）
 * - timestamp: 実行タイムスタンプ
 * - message: 関連するメッセージへの参照
 * 
 * 使用例:
 * ```typescript
 * const traceStep: TraceStep = {
 *   id: "step-123",
 *   messageId: "msg-123",
 *   traceId: "trace-abc123",
 *   stepNumber: 1,
 *   agentId: "caspar",
 *   action: "質問の分析と保守的視点での評価",
 *   toolsUsed: ["web_search", "knowledge_base"],
 *   citations: ["https://example.com/ai-ethics"],
 *   duration: 1200,
 *   errorCount: 0,
 *   timestamp: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export type TraceStep = {
  readonly id: string;
  readonly messageId: string;
  readonly traceId: string;
  readonly stepNumber: number;
  readonly agentId: string;
  readonly action: string;
  readonly toolsUsed?: string[] | null;
  readonly citations?: string[] | null;
  readonly duration: number;
  readonly errorCount?: number | null;
  readonly timestamp: string;
  readonly message?: LazyLoading; // belongsTo関係
  readonly owner?: string | null;
};

/**
 * エージェント設定型定義
 * 
 * 設計理由:
 * - agentId: エージェント識別子
 * - modelId: 使用するLLMモデル
 * - systemPrompt: システムプロンプト
 * - temperature: 創造性パラメータ
 * - maxTokens: 最大トークン数
 */
export type AgentConfig = {
  agentId: 'caspar' | 'balthasar' | 'melchior' | 'solomon';
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
};

/**
 * エージェントプリセットモデル型定義
 * 
 * 設計理由:
 * - name: プリセット名
 * - description: プリセットの説明
 * - configs: エージェント設定一覧（JSON形式）
 * - isDefault: デフォルトプリセットの識別
 * - isPublic: 他ユーザーとの共有可否
 * - createdBy: 作成者（公開プリセット用）
 * 
 * 使用例:
 * ```typescript
 * const preset: AgentPreset = {
 *   id: "preset-123",
 *   name: "学術研究用",
 *   description: "学術的な議論に特化した設定",
 *   configs: [
 *     {
 *       agentId: "caspar",
 *       modelId: "claude-3-sonnet",
 *       systemPrompt: "学術的で保守的な視点で分析してください",
 *       temperature: 0.3,
 *       maxTokens: 2000
 *     }
 *   ],
 *   isDefault: false,
 *   isPublic: true,
 *   createdBy: "user-123",
 *   createdAt: "2024-01-01T00:00:00Z",
 *   updatedAt: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export type AgentPreset = {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly configs: AgentConfig[]; // JSON型
  readonly isDefault?: boolean | null;
  readonly isPublic?: boolean | null;
  readonly createdBy?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly owner?: string | null;
};

/**
 * GraphQL操作の入力型定義
 * 
 * 学習ポイント:
 * - Create操作: 新規作成時の入力型
 * - Update操作: 更新時の入力型
 * - Filter操作: 検索・フィルタリング用の条件型
 */

export type CreateUserInput = {
  id?: string;
  email: string;
  name?: string;
  preferences?: any;
};

export type UpdateUserInput = {
  id: string;
  email?: string;
  name?: string;
  preferences?: any;
};

export type CreateConversationInput = {
  id?: string;
  userId: string;
  title: string;
  agentPresetId?: string;
};

export type UpdateConversationInput = {
  id: string;
  userId?: string;
  title?: string;
  agentPresetId?: string;
};

export type CreateMessageInput = {
  id?: string;
  conversationId: string;
  role?: MessageRole;
  content: string;
  agentResponses?: AgentResponse[];
  judgeResponse?: JudgeResponse;
  traceId?: string;
};

export type UpdateMessageInput = {
  id: string;
  conversationId?: string;
  role?: MessageRole;
  content?: string;
  agentResponses?: AgentResponse[];
  judgeResponse?: JudgeResponse;
  traceId?: string;
};

export type CreateTraceStepInput = {
  id?: string;
  messageId: string;
  traceId: string;
  stepNumber: number;
  agentId: string;
  action: string;
  toolsUsed?: string[];
  citations?: string[];
  duration: number;
  errorCount?: number;
  timestamp: string;
};

export type CreateAgentPresetInput = {
  id?: string;
  name: string;
  description?: string;
  configs: AgentConfig[];
  isDefault?: boolean;
  isPublic?: boolean;
  createdBy?: string;
};

export type UpdateAgentPresetInput = {
  id: string;
  name?: string;
  description?: string;
  configs?: AgentConfig[];
  isDefault?: boolean;
  isPublic?: boolean;
  createdBy?: string;
};

/**
 * フィルター型定義
 * 
 * 学習ポイント:
 * - GraphQL フィルター操作の型安全な表現
 * - 検索・ソート・ページネーション用の型定義
 */
export type ModelStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: string | null;
  size?: ModelSizeInput | null;
};

export type ModelSizeInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
};

export type ModelConversationFilterInput = {
  id?: ModelStringInput | null;
  userId?: ModelStringInput | null;
  title?: ModelStringInput | null;
  agentPresetId?: ModelStringInput | null;
  and?: Array<ModelConversationFilterInput | null> | null;
  or?: Array<ModelConversationFilterInput | null> | null;
  not?: ModelConversationFilterInput | null;
};

export type ModelMessageFilterInput = {
  id?: ModelStringInput | null;
  conversationId?: ModelStringInput | null;
  content?: ModelStringInput | null;
  traceId?: ModelStringInput | null;
  and?: Array<ModelMessageFilterInput | null> | null;
  or?: Array<ModelMessageFilterInput | null> | null;
  not?: ModelMessageFilterInput | null;
};

/**
 * ページネーション型定義
 * 
 * 学習ポイント:
 * - GraphQL Connection パターンの実装
 * - 効率的なデータ取得のためのページネーション
 */
export type ModelConversationConnection = {
  items: Array<Conversation | null>;
  nextToken?: string | null;
};

export type ModelMessageConnection = {
  items: Array<Message | null>;
  nextToken?: string | null;
};

export type ModelTraceStepConnection = {
  items: Array<TraceStep | null>;
  nextToken?: string | null;
};

export type ModelAgentPresetConnection = {
  items: Array<AgentPreset | null>;
  nextToken?: string | null;
};