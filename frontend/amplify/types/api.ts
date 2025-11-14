/**
 * API Contract Types for MAGI Decision System
 * 
 * このファイルはフロントエンドとバックエンド間のAPI契約を定義します。
 * Bedrock Multi-Agent Collaboration（2025年GA版）との統合に対応。
 * 
 * 学習ポイント:
 * - TypeScript型安全性の確保
 * - API契約の明確な定義
 * - フロントエンド・バックエンド間の型共有
 */

/**
 * エージェントへの質問リクエスト
 * 
 * フロントエンドからBedrock Gatewayへ送信されるリクエスト形式
 */
export interface AskAgentRequest {
  /** ユーザーからの質問・依頼内容 */
  message: string;
  
  /** 会話ID（既存の会話の場合） */
  conversationId?: string;
  
  /** 追加のコンテキスト情報 */
  context?: string;
  
  /** 使用するエージェントプリセットID */
  agentPresetId?: string;
  
  /** トレースID（デバッグ用） */
  traceId?: string;
  
  /** リクエストメタデータ */
  metadata?: {
    /** ユーザーID */
    userId?: string;
    /** セッションID */
    sessionId?: string;
    /** クライアント情報 */
    clientInfo?: {
      userAgent?: string;
      timestamp?: string;
    };
  };
}

/**
 * エージェントからの応答
 * 
 * Bedrock Gatewayからフロントエンドへ返される応答形式
 */
export interface AskAgentResponse {
  /** 会話ID */
  conversationId: string;
  
  /** メッセージID */
  messageId: string;
  
  /** 3賢者からの個別応答 */
  agentResponses: AgentResponse[];
  
  /** SOLOMON Judgeからの統合評価 */
  judgeResponse: JudgeResponse;
  
  /** トレースID */
  traceId: string;
  
  /** 総実行時間（ミリ秒） */
  executionTime: number;
  
  /** レスポンス生成時刻 */
  timestamp: Date;
  
  /** エラー情報（エラー時のみ） */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 個別エージェントの応答
 * 
 * CASPAR、BALTHASAR、MELCHIORの各賢者からの応答
 */
export interface AgentResponse {
  /** エージェントID */
  agentId: AgentType;
  
  /** 判断結果（可決/否決） */
  decision: DecisionType;
  
  /** 詳細な分析内容 */
  content: string;
  
  /** 判断根拠 */
  reasoning: string;
  
  /** 確信度（0.0-1.0） */
  confidence: number;
  
  /** 実行時間（ミリ秒） */
  executionTime: number;
  
  /** 応答生成時刻 */
  timestamp: Date;
  
  /** 使用したツール一覧 */
  toolsUsed?: string[];
  
  /** 引用・参考情報 */
  citations?: string[];
  
  /** エラー情報（エラー時のみ） */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * SOLOMON Judgeの統合評価
 * 
 * 3賢者の判断を統合・評価した最終結果
 */
export interface JudgeResponse {
  /** 最終判断（可決/否決） */
  finalDecision: DecisionType;
  
  /** 投票結果の集計 */
  votingResult: VotingResult;
  
  /** 各賢者のスコアリング（0-100点） */
  scores: AgentScore[];
  
  /** 統合要約 */
  summary: string;
  
  /** 最終推奨事項 */
  finalRecommendation: string;
  
  /** 最終判断の根拠 */
  reasoning: string;
  
  /** 統合判断の確信度（0.0-1.0） */
  confidence: number;
  
  /** 実行時間（ミリ秒） */
  executionTime: number;
  
  /** 評価生成時刻 */
  timestamp: Date;
}

/**
 * エージェント種別
 */
export type AgentType = 'solomon' | 'caspar' | 'balthasar' | 'melchior';

/**
 * 判断結果種別
 */
export type DecisionType = 'APPROVED' | 'REJECTED' | 'ABSTAINED';

/**
 * 投票結果の集計
 */
export interface VotingResult {
  /** 可決票数 */
  approved: number;
  
  /** 否決票数 */
  rejected: number;
  
  /** 棄権票数 */
  abstained: number;
  
  /** 総投票数 */
  get totalVotes(): number;
}

/**
 * エージェントスコア
 */
export interface AgentScore {
  /** エージェントID */
  agentId: AgentType;
  
  /** スコア（0-100点） */
  score: number;
  
  /** スコアリング根拠 */
  reasoning: string;
}

/**
 * エラーレスポンス
 * 
 * API呼び出しでエラーが発生した場合のレスポンス形式
 */
export interface ErrorResponse {
  /** エラーコード */
  error: string;
  
  /** エラーメッセージ */
  message: string;
  
  /** エラー発生時刻 */
  timestamp: string;
  
  /** トレースID（デバッグ用） */
  traceId?: string;
  
  /** 詳細情報 */
  details?: {
    /** エラーが発生したエージェント */
    failedAgent?: AgentType;
    /** 内部エラーコード */
    internalCode?: string;
    /** スタックトレース（開発環境のみ） */
    stackTrace?: string;
  };
}

/**
 * ヘルスチェックレスポンス
 * 
 * システムの稼働状況確認用
 */
export interface HealthCheckResponse {
  /** システム状態 */
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** チェック実行時刻 */
  timestamp: string;
  
  /** 各コンポーネントの状態 */
  components: {
    /** Bedrock接続状態 */
    bedrock: 'up' | 'down' | 'degraded';
    /** データベース接続状態 */
    database: 'up' | 'down' | 'degraded';
    /** 各エージェントの状態 */
    agents: {
      solomon: 'up' | 'down' | 'degraded';
      caspar: 'up' | 'down' | 'degraded';
      balthasar: 'up' | 'down' | 'degraded';
      melchior: 'up' | 'down' | 'degraded';
    };
  };
  
  /** システムメトリクス */
  metrics?: {
    /** 平均応答時間（ミリ秒） */
    averageResponseTime: number;
    /** 成功率（0.0-1.0） */
    successRate: number;
    /** アクティブセッション数 */
    activeSessions: number;
  };
}