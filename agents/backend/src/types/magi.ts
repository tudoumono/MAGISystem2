/**
 * MAGI System Type Definitions
 * 
 * AgentCore RuntimeとPythonエージェント間の型定義です。
 */

// リクエスト型
export interface MAGIRequest {
  question: string;
  sessionId?: string;
  context?: string;
}

// レスポンス型
export interface MAGIResponse {
  result: string;
  agents: AgentResponse[];
  judge: JudgeResponse;
  traceId: string;
  duration: number;
}

// エージェント応答型
export interface AgentResponse {
  agentId: 'caspar' | 'balthasar' | 'melchior';
  response: string;
  reasoning: string;
  confidence: number;
  executionTime: number;
}

// Judge応答型
export interface JudgeResponse {
  finalDecision: string;
  scores: {
    caspar: number;
    balthasar: number;
    melchior: number;
  };
  reasoning: string;
  recommendation: string;
  executionTime: number;
}

// ストリーミングイベント型
export interface StreamEvent {
  type: 'start' | 'agent_start' | 'agent_thinking' | 'agent_chunk' | 'agent_complete' |
        'error' | 'judge_start' | 'judge_thinking' | 'judge_chunk' |
        'judge_complete' | 'complete';
  data: any;
  agentId?: string;
  timestamp: string;
}

// エラー型
export interface MAGIError {
  error: string;
  code: string;
  details?: any;
}