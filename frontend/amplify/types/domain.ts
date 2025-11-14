/**
 * Domain Model Types for MAGI Decision System
 * 
 * このファイルはMAGI Decision Systemのドメインモデルを定義します。
 * ビジネスロジックとデータ構造の型安全性を確保します。
 * 
 * 学習ポイント:
 * - ドメイン駆動設計（DDD）の型定義
 * - ビジネスルールの型レベルでの表現
 * - データ整合性の確保
 */

/**
 * MAGI意思決定リクエスト
 * 
 * 3賢者による意思決定プロセスへの入力
 */
export interface MAGIDecisionRequest {
  /** 意思決定対象の質問・提案 */
  question: string;
  
  /** 追加のコンテキスト情報 */
  context?: string;
  
  /** 緊急度レベル */
  urgency?: UrgencyLevel;
  
  /** 意思決定カテゴリ */
  category?: DecisionCategory;
  
  /** トレースID（追跡用） */
  traceId?: string;
  
  /** リクエスト生成時刻 */
  timestamp?: Date;
  
  /** リクエスト元情報 */
  source?: {
    userId?: string;
    sessionId?: string;
    clientType?: 'web' | 'api' | 'cli';
  };
}

/**
 * MAGI意思決定レスポンス
 * 
 * 3賢者による意思決定プロセスの結果
 */
export interface MAGIDecisionResponse {
  /** リクエストID */
  requestId: string;
  
  /** トレースID */
  traceId: string;
  
  /** 3賢者からの個別応答 */
  agentResponses: AgentResponse[];
  
  /** SOLOMON Judgeからの統合評価 */
  judgeResponse: JudgeResponse;
  
  /** 総実行時間（ミリ秒） */
  totalExecutionTime: number;
  
  /** 実行ステップの詳細 */
  traceSteps: TraceStep[];
  
  /** レスポンス生成時刻 */
  timestamp: Date;
  
  /** システムバージョン */
  version: string;
}

/**
 * エージェント種別（Enum風の定義）
 */
export const AgentType = {
  SOLOMON: 'solomon',
  CASPAR: 'caspar',
  BALTHASAR: 'balthasar',
  MELCHIOR: 'melchior'
} as const;

export type AgentType = typeof AgentType[keyof typeof AgentType];

/**
 * 判断結果種別（Enum風の定義）
 */
export const DecisionType = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ABSTAINED: 'ABSTAINED'
} as const;

export type DecisionType = typeof DecisionType[keyof typeof DecisionType];

/**
 * 緊急度レベル
 */
export const UrgencyLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type UrgencyLevel = typeof UrgencyLevel[keyof typeof UrgencyLevel];

/**
 * 意思決定カテゴリ
 */
export const DecisionCategory = {
  TECHNICAL: 'technical',
  BUSINESS: 'business',
  SECURITY: 'security',
  OPERATIONAL: 'operational',
  STRATEGIC: 'strategic'
} as const;

export type DecisionCategory = typeof DecisionCategory[keyof typeof DecisionCategory];

/**
 * 個別エージェントの応答
 */
export interface AgentResponse {
  /** エージェントID */
  agentId: AgentType;
  
  /** 判断結果 */
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
  
  /** メタデータ */
  metadata?: {
    /** 使用モデル */
    modelId?: string;
    /** トークン使用量 */
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
    /** 処理ステップ数 */
    processingSteps?: number;
  };
}

/**
 * SOLOMON Judgeの統合評価
 */
export interface JudgeResponse {
  /** 最終判断 */
  finalDecision: DecisionType;
  
  /** 投票結果の集計 */
  votingResult: VotingResult;
  
  /** 各賢者のスコアリング */
  scores: AgentScore[];
  
  /** 統合要約 */
  summary: string;
  
  /** 最終推奨事項 */
  finalRecommendation: string;
  
  /** 最終判断の根拠 */
  reasoning: string;
  
  /** 統合判断の確信度 */
  confidence: number;
  
  /** 実行時間（ミリ秒） */
  executionTime: number;
  
  /** 評価生成時刻 */
  timestamp: Date;
  
  /** 判断の複雑性指標 */
  complexityMetrics?: {
    /** 意見の分散度（0.0-1.0） */
    opinionDivergence: number;
    /** 確信度の分散 */
    confidenceVariance: number;
    /** 合意レベル */
    consensusLevel: 'unanimous' | 'majority' | 'split' | 'no_consensus';
  };
}

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
  
  /** 総投票数の計算プロパティ */
  readonly totalVotes: number;
}

/**
 * VotingResultの実装クラス
 */
export class VotingResultImpl implements VotingResult {
  constructor(
    public approved: number,
    public rejected: number,
    public abstained: number
  ) {}
  
  get totalVotes(): number {
    return this.approved + this.rejected + this.abstained;
  }
  
  /** 合意レベルの判定 */
  get consensusLevel(): 'unanimous' | 'majority' | 'split' | 'no_consensus' {
    if (this.totalVotes === 0) return 'no_consensus';
    
    const maxVotes = Math.max(this.approved, this.rejected, this.abstained);
    
    if (maxVotes === this.totalVotes) return 'unanimous';
    if (maxVotes > this.totalVotes / 2) return 'majority';
    return 'split';
  }
  
  /** 可決率の計算 */
  get approvalRate(): number {
    return this.totalVotes > 0 ? this.approved / this.totalVotes : 0;
  }
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
  
  /** スコア内訳 */
  breakdown?: {
    /** 論理性スコア */
    logic: number;
    /** 実現可能性スコア */
    feasibility: number;
    /** 創造性スコア */
    creativity: number;
    /** リスク評価スコア */
    riskAssessment: number;
  };
}

/**
 * トレースステップ
 * 
 * 実行過程の詳細な記録
 */
export interface TraceStep {
  /** ステップID */
  id: string;
  
  /** トレースID */
  traceId: string;
  
  /** ステップ番号 */
  stepNumber: number;
  
  /** 実行エージェント */
  agentId: string;
  
  /** 実行アクション */
  action: string;
  
  /** 使用ツール一覧 */
  toolsUsed: string[];
  
  /** 引用・参考情報 */
  citations: string[];
  
  /** 実行時間（ミリ秒） */
  duration: number;
  
  /** エラー・リトライ回数 */
  errorCount: number;
  
  /** ステップ実行時刻 */
  timestamp: Date;
  
  /** 追加メタデータ */
  metadata?: Record<string, any>;
}

/**
 * エージェントプリセット
 * 
 * エージェントの動作設定テンプレート
 */
export interface AgentPreset {
  /** プリセットID */
  id: string;
  
  /** プリセット名 */
  name: string;
  
  /** 説明 */
  description?: string;
  
  /** 設定内容 */
  configs: AgentConfigs;
  
  /** デフォルトプリセットかどうか */
  isDefault: boolean;
  
  /** 公開プリセットかどうか */
  isPublic: boolean;
  
  /** 作成者 */
  createdBy?: string;
  
  /** 作成日時 */
  createdAt: Date;
  
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * エージェント設定
 */
export interface AgentConfigs {
  /** SOLOMON Judge設定 */
  solomon: {
    /** 使用モデル */
    modelId: string;
    /** 温度パラメータ */
    temperature: number;
    /** 最大トークン数 */
    maxTokens: number;
    /** システムプロンプト */
    systemPrompt?: string;
  };
  
  /** CASPAR設定 */
  caspar: {
    modelId: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
    /** リスク許容度 */
    riskTolerance: number;
    /** 保守性係数 */
    conservatismFactor: number;
  };
  
  /** BALTHASAR設定 */
  balthasar: {
    modelId: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
    /** 創造性重視度 */
    creativityWeight: number;
    /** 革新性閾値 */
    innovationThreshold: number;
  };
  
  /** MELCHIOR設定 */
  melchior: {
    modelId: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
    /** バランス係数 */
    balanceFactor: number;
    /** 論理性重視度 */
    logicWeight: number;
  };
}

/**
 * システム統計情報
 */
export interface SystemStats {
  /** 総実行回数 */
  totalExecutions: number;
  
  /** 平均実行時間（ミリ秒） */
  averageExecutionTime: number;
  
  /** 成功率 */
  successRate: number;
  
  /** 各エージェントの統計 */
  agentStats: {
    [K in AgentType]: {
      executionCount: number;
      averageExecutionTime: number;
      averageConfidence: number;
      decisionDistribution: {
        approved: number;
        rejected: number;
        abstained: number;
      };
    };
  };
  
  /** 判断結果の分布 */
  decisionDistribution: {
    approved: number;
    rejected: number;
    abstained: number;
  };
  
  /** 統計期間 */
  period: {
    startDate: Date;
    endDate: Date;
  };
}