/**
 * Type Definitions Index for MAGI Decision System
 * 
 * このファイルは型定義の統一エクスポートポイントです。
 * プロジェクト全体で一貫した型の使用を確保します。
 * 
 * 学習ポイント:
 * - TypeScript型定義の整理と管理
 * - 名前空間の衝突回避
 * - 型の再エクスポート戦略
 */

// API契約の型定義
export type {
  // リクエスト・レスポンス型
  AskAgentRequest,
  AskAgentResponse,
  ErrorResponse,
  HealthCheckResponse,
} from './api';

// ドメインモデルの型定義
export type {
  // MAGI意思決定関連
  MAGIDecisionRequest,
  MAGIDecisionResponse,
  
  // エージェント関連
  AgentResponse,
  JudgeResponse,
  AgentScore,
  
  // 投票・判断関連
  VotingResult,
  DecisionType,
  AgentType,
  UrgencyLevel,
  DecisionCategory,
  
  // トレース・監視関連
  TraceStep,
  
  // 設定・プリセット関連
  AgentPreset,
  AgentConfigs,
  
  // 統計・メトリクス関連
  SystemStats,
} from './domain';

// ドメインモデルの実装クラス
export { VotingResultImpl } from './domain';

/**
 * 型ガード関数
 * 
 * ランタイムでの型安全性を確保するためのユーティリティ関数
 */

/**
 * AgentTypeの型ガード
 */
export function isAgentType(value: any): value is import('./domain').AgentType {
  const { AgentType } = require('./domain');
  return typeof value === 'string' && 
         Object.values(AgentType).includes(value);
}

/**
 * DecisionTypeの型ガード
 */
export function isDecisionType(value: any): value is import('./domain').DecisionType {
  const { DecisionType } = require('./domain');
  return typeof value === 'string' && 
         Object.values(DecisionType).includes(value);
}

/**
 * UrgencyLevelの型ガード
 */
export function isUrgencyLevel(value: any): value is import('./domain').UrgencyLevel {
  const { UrgencyLevel } = require('./domain');
  return typeof value === 'string' && 
         Object.values(UrgencyLevel).includes(value);
}

/**
 * DecisionCategoryの型ガード
 */
export function isDecisionCategory(value: any): value is import('./domain').DecisionCategory {
  const { DecisionCategory } = require('./domain');
  return typeof value === 'string' && 
         Object.values(DecisionCategory).includes(value);
}

/**
 * AskAgentRequestの型ガード
 */
export function isAskAgentRequest(value: any): value is import('./api').AskAgentRequest {
  return typeof value === 'object' && 
         value !== null && 
         typeof value.message === 'string';
}

/**
 * MAGIDecisionRequestの型ガード
 */
export function isMAGIDecisionRequest(value: any): value is import('./domain').MAGIDecisionRequest {
  return typeof value === 'object' && 
         value !== null && 
         typeof value.question === 'string';
}

/**
 * 型変換ユーティリティ
 */

/**
 * API型からドメイン型への変換
 */
export namespace TypeConverters {
  /**
   * APIAgentResponseからAgentResponseへの変換
   */
  export function apiToAgentResponse(
    apiResponse: import('./api').AgentResponse
  ): import('./domain').AgentResponse {
    return {
      ...apiResponse,
      // 必要に応じて型変換ロジックを追加
    };
  }
  
  /**
   * AgentResponseからAPIAgentResponseへの変換
   */
  export function agentResponseToApi(
    domainResponse: import('./domain').AgentResponse
  ): import('./api').AgentResponse {
    return {
      ...domainResponse,
      // 必要に応じて型変換ロジックを追加
    };
  }
  
  /**
   * VotingResultの実装クラス作成
   */
  export function createVotingResult(
    approved: number,
    rejected: number,
    abstained: number = 0
  ): import('./domain').VotingResultImpl {
    const { VotingResultImpl } = require('./domain');
    return new VotingResultImpl(approved, rejected, abstained);
  }
}

/**
 * デフォルト値定義
 */
export namespace Defaults {
  /** デフォルトのエージェント設定 */
  export const DEFAULT_AGENT_CONFIGS: import('./domain').AgentConfigs = {
    solomon: {
      modelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
      temperature: 0.4,
      maxTokens: 2000,
    },
    caspar: {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      temperature: 0.3,
      maxTokens: 1500,
      riskTolerance: 0.7,
      conservatismFactor: 0.8,
    },
    balthasar: {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      temperature: 0.7,
      maxTokens: 1500,
      creativityWeight: 0.8,
      innovationThreshold: 0.6,
    },
    melchior: {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      temperature: 0.5,
      maxTokens: 1500,
      balanceFactor: 0.5,
      logicWeight: 0.7,
    },
  };
  
  /** デフォルトのリクエストタイムアウト（ミリ秒） */
  export const DEFAULT_TIMEOUT = 120000; // 2分
  
  /** デフォルトの緊急度レベル */
  export const DEFAULT_URGENCY_LEVEL = 'MEDIUM' as import('./domain').UrgencyLevel;
  
  /** デフォルトの意思決定カテゴリ */
  export const DEFAULT_DECISION_CATEGORY = 'TECHNICAL' as import('./domain').DecisionCategory;
}

/**
 * バリデーション関数
 */
export namespace Validators {
  /**
   * 確信度の範囲チェック
   */
  export function validateConfidence(confidence: number): boolean {
    return confidence >= 0.0 && confidence <= 1.0;
  }
  
  /**
   * スコアの範囲チェック
   */
  export function validateScore(score: number): boolean {
    return score >= 0 && score <= 100;
  }
  
  /**
   * 実行時間の妥当性チェック
   */
  export function validateExecutionTime(executionTime: number): boolean {
    return executionTime >= 0 && executionTime <= Defaults.DEFAULT_TIMEOUT;
  }
  
  /**
   * エージェント応答の完全性チェック
   */
  export function validateAgentResponse(response: import('./domain').AgentResponse): boolean {
    return (
      isAgentType(response.agentId) &&
      isDecisionType(response.decision) &&
      typeof response.content === 'string' &&
      response.content.length > 0 &&
      typeof response.reasoning === 'string' &&
      response.reasoning.length > 0 &&
      validateConfidence(response.confidence) &&
      validateExecutionTime(response.executionTime)
    );
  }
}