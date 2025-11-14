/**
 * Domain Types for MAGI Decision System
 * 
 * このファイルはMAGIシステムのコアドメインモデルを定義します。
 * エヴァンゲリオンのMAGIシステムにインスパイアされた設計で、
 * 3賢者による多視点分析とSOLOMON Judgeによる統合評価を実現します。
 */

// =============================================================================
// Agent Types - エージェント関連の型定義
// =============================================================================

/**
 * エージェントの種類を定義
 * 
 * 設計理由:
 * - 'solomon': 統括者として3賢者の判断を集約・評価
 * - 'caspar': 保守的・現実的な視点（リスク重視）
 * - 'balthasar': 革新的・感情的な視点（創造性重視）
 * - 'melchior': バランス型・科学的な視点（論理性重視）
 */
export type AgentType = 'solomon' | 'caspar' | 'balthasar' | 'melchior';

/**
 * 意思決定の結果を表す型
 * 
 * 設計理由:
 * - MAGIシステムの核心である可決/否決の二択判断
 * - 'APPROVED': 可決（実行推奨）
 * - 'REJECTED': 否決（実行非推奨）
 */
export type DecisionType = 'APPROVED' | 'REJECTED';

/**
 * エージェントの実行状態
 * 
 * 設計理由:
 * - リアルタイムUIでの状態表示に使用
 * - ユーザーに現在の処理状況を明確に伝える
 */
export type AgentStatus = 'idle' | 'thinking' | 'completed' | 'error';

/**
 * 各エージェントの特性と説明
 * 
 * 設計理由:
 * - UI表示用の説明文を一元管理
 * - 各エージェントの役割をユーザーに明確に伝える
 */
export const AGENT_DESCRIPTIONS = {
  solomon: 'SOLOMON Judge - 統括者として3賢者の投票を集計し、最終的な可決/否決を決定',
  caspar: 'CASPAR - 保守的・現実的な視点で可決/否決を判断（リスク重視）',
  balthasar: 'BALTHASAR - 革新的・感情的な視点で可決/否決を判断（創造性重視）',
  melchior: 'MELCHIOR - バランス型・科学的な視点で可決/否決を判断（論理性重視）'
} as const;

/**
 * 判断結果の表示スタイル設定
 * 
 * 設計理由:
 * - 可決/否決を視覚的に区別するためのスタイル定義
 * - アクセシビリティを考慮し、色だけでなくアイコンも併用
 */
export const DECISION_STYLES = {
  APPROVED: {
    color: 'green',
    icon: '✓',
    label: '可決',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800'
  },
  REJECTED: {
    color: 'red', 
    icon: '✗',
    label: '否決',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800'
  }
} as const;

// =============================================================================
// Agent Response Types - エージェント応答関連の型定義
// =============================================================================

/**
 * 個別エージェントの応答
 * 
 * 設計理由:
 * - decision: MAGI機能の核心である可決/否決判断
 * - content: 従来のチャット機能としての詳細回答
 * - reasoning: 判断に至った論理的根拠（透明性確保）
 * - confidence: 判断の確信度（不確実性の可視化）
 * - executionTime: パフォーマンス監視用
 */
export interface AgentResponse {
  agentId: AgentType;
  decision: DecisionType;          // 可決/否決の判断（MAGI機能）
  content: string;                 // 詳細な回答内容（従来機能）
  reasoning: string;               // 判断に至った論理的根拠
  confidence: number;              // 判断の確信度 (0.0-1.0)
  executionTime: number;           // 実行時間（ミリ秒）
}

/**
 * SOLOMON Judgeによる統合評価
 * 
 * 設計理由:
 * - finalDecision: SOLOMONの最終判断（MAGI投票システム）
 * - votingResult: 3賢者の投票結果の集計
 * - scores: 従来のスコアリングシステム（0-100点評価）
 * - 新旧システムの機能を両方サポートし、段階的移行を可能にする
 */
export interface JudgeResponse {
  // MAGI投票システム（新機能）
  finalDecision: DecisionType;     // SOLOMONの最終判断
  votingResult: {
    approved: number;              // 可決票数
    rejected: number;              // 否決票数
    abstained: number;             // 棄権票数（エラー等）
  };
  
  // 従来のスコアリングシステム
  scores: AgentScore[];            // 各賢者への0-100点評価
  summary: string;                 // 判断の要約
  finalRecommendation: string;     // 最終推奨（従来機能）
  reasoning: string;               // 最終判断の根拠
  confidence: number;              // 最終判断の確信度
}

/**
 * エージェントスコア（従来機能）
 * 
 * 設計理由:
 * - 既存のスコアリング機能との互換性維持
 * - 段階的な機能移行をサポート
 */
export interface AgentScore {
  agentId: AgentType;
  score: number;                   // 0-100点のスコア
  reasoning: string;               // スコアの根拠
}

// =============================================================================
// Conversation Types - 会話管理関連の型定義
// =============================================================================

/**
 * 会話スレッド
 * 
 * 設計理由:
 * - id: 一意識別子（UUID）
 * - userId: オーナーベースアクセス制御用
 * - title: ユーザーが識別しやすい会話タイトル
 * - agentPresetId: 使用したエージェント設定の記録
 * - メタデータによる会話の分類・検索を可能にする
 */
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  agentPresetId?: string | null;   // 使用したプリセット設定
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

/**
 * メッセージ
 * 
 * 設計理由:
 * - role: ユーザーとアシスタントの区別
 * - content: メッセージ本文
 * - agentResponses: 3賢者の個別応答（MAGI機能）
 * - judgeResponse: SOLOMONの統合評価
 * - traceId: 実行トレースとの関連付け
 */
export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  agentResponses?: AgentResponse[] | null; // 3賢者の応答
  judgeResponse?: JudgeResponse | null;    // SOLOMON評価
  traceId?: string | null;                // 実行トレースID
  createdAt: Date;
}

// =============================================================================
// Trace Types - 実行トレース関連の型定義
// =============================================================================

/**
 * 実行トレースステップ
 * 
 * 設計理由:
 * - traceId: 実行全体の一意識別子
 * - stepNumber: ステップの順序
 * - agentId: 実行したエージェント
 * - action: 実行アクションの要約
 * - toolsUsed: 使用したツール一覧（観測性向上）
 * - citations: 参照したリソース（透明性確保）
 * - duration: パフォーマンス監視用
 * - errorCount: 信頼性監視用
 */
export interface TraceStep {
  id: string;
  traceId: string;                 // 実行トレース識別子
  stepNumber: number;              // ステップ番号
  agentId: string;                 // 実行エージェント
  action: string;                  // 実行アクション要約
  toolsUsed: string[];             // 使用ツール一覧
  citations: string[];             // 引用URL
  duration: number;                // 実行時間(ms)
  errorCount: number;              // エラー・リトライ回数
  timestamp: Date;
}

// =============================================================================
// Configuration Types - 設定関連の型定義
// =============================================================================

/**
 * エージェント設定
 * 
 * 設計理由:
 * - agentId: 設定対象のエージェント
 * - modelId: 使用するLLMモデル
 * - systemPrompt: エージェントの人格・役割定義
 * - temperature: 創造性パラメータ
 * - maxTokens: 応答長制限
 * - 柔軟なエージェントカスタマイズを可能にする
 */
export interface AgentConfig {
  agentId: AgentType;
  modelId: string;                 // 使用LLMモデル
  systemPrompt: string;            // システムプロンプト
  temperature: number;             // 0.0-1.0
  maxTokens: number;               // 最大トークン数
}

/**
 * エージェントプリセット
 * 
 * 設計理由:
 * - 事前定義された設定の組み合わせ
 * - ユーザーが簡単に異なるシナリオを試せる
 * - isDefault: デフォルト設定の識別
 * - isPublic: 他ユーザーとの共有可否
 */
export interface AgentPreset {
  id: string;
  name: string;
  description: string;
  configs: AgentConfig[];          // 4エージェント分の設定
  isDefault: boolean;              // デフォルトプリセット
  isPublic: boolean;               // 公開プリセット
  createdBy?: string;              // 作成者
  createdAt: Date;
}

// =============================================================================
// API Types - API通信関連の型定義
// =============================================================================

/**
 * エージェント実行リクエスト
 * 
 * 設計理由:
 * - message: ユーザーの質問
 * - conversationId: 会話コンテキスト（オプション）
 * - agentConfig: カスタム設定（オプション）
 * - シンプルなAPIインターフェースで使いやすさを重視
 */
export interface AskRequest {
  message: string;
  conversationId?: string;
  agentConfig?: AgentConfig[];
}

/**
 * エージェント実行レスポンス
 * 
 * 設計理由:
 * - conversationId: 会話の継続性確保
 * - messageId: メッセージの一意識別
 * - agentResponses: 3賢者の個別応答
 * - judgeResponse: SOLOMONの統合評価
 * - traceId: 実行トレースとの関連付け
 * - 完全な実行結果を一度に返すことで、UIの複雑性を軽減
 */
export interface AskResponse {
  conversationId: string;
  messageId: string;
  agentResponses: AgentResponse[];
  judgeResponse: JudgeResponse;
  traceId: string;
}

// =============================================================================
// Utility Types - ユーティリティ型定義
// =============================================================================

/**
 * ローディング状態管理用の型
 * 
 * 設計理由:
 * - UIコンポーネントでの状態管理を統一
 * - エラーハンドリングの一貫性確保
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

/**
 * ページネーション用の型
 * 
 * 設計理由:
 * - 会話履歴などの大量データ表示用
 * - パフォーマンス最適化のための段階的読み込み
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * 検索フィルター用の型
 * 
 * 設計理由:
 * - 会話履歴の検索・フィルタリング機能用
 * - ユーザビリティ向上のための柔軟な検索
 */
export interface SearchFilter {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  agentTypes?: AgentType[];
  decisions?: DecisionType[];
}