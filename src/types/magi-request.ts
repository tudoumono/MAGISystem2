/**
 * MAGI Request Types - Lambda関数へのリクエスト型定義
 * 
 * 目的:
 * - フロントエンドからLambda関数へのリクエスト構造を定義
 * - エージェント設定の送信をサポート
 * - 型安全性を保証
 */

import type { BedrockModel } from './agent-preset';

/**
 * 個別エージェントの実行時設定
 */
export interface AgentRuntimeConfig {
  model: BedrockModel;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  enabled: boolean;
}

/**
 * MAGIシステムへのリクエスト
 */
export interface MAGIRequest {
  /** ユーザーの質問 */
  question: string;
  
  /** エージェント設定（オプション） */
  agentConfigs?: {
    caspar?: AgentRuntimeConfig;
    balthasar?: AgentRuntimeConfig;
    melchior?: AgentRuntimeConfig;
    solomon?: AgentRuntimeConfig;
  };
  
  /** トレースID（オプション） */
  traceId?: string;
  
  /** ユーザーID（オプション） */
  userId?: string;
}

/**
 * MAGIシステムからのレスポンス（SSE）
 */
export interface MAGIStreamEvent {
  type: 'system_start' | 'agent_start' | 'agent_thinking' | 'agent_chunk' | 'agent_complete' | 'judge_start' | 'judge_chunk' | 'judge_complete' | 'complete' | 'error';
  agentId?: string;
  data: any;
}

/**
 * エージェント実行結果
 */
export interface AgentResponse {
  decision: 'APPROVED' | 'REJECTED';
  reasoning: string;
  confidence: number;
  analysis?: string;
  executionTime?: number;
  error?: string;
}

/**
 * Judge実行結果
 */
export interface JudgeResponse {
  finalDecision: 'APPROVED' | 'REJECTED';
  votingResult: {
    approved: number;
    rejected: number;
    abstained: number;
  };
  scores: Array<{
    agentId: string;
    score: number;
    reasoning: string;
  }>;
  finalRecommendation: string;
  reasoning: string;
  confidence: number;
}
