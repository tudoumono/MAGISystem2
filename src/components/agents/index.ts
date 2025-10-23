/**
 * Agent Components Index
 * 
 * このファイルはエージェント関連コンポーネントの統一エクスポートを提供します。
 * Task 7.1 & 7.2で実装された全てのコンポーネントをここから利用できます。
 */

// Individual Agent Components
export { AgentResponsePanel } from './AgentResponsePanel';
export { AgentResponseComparison } from './AgentResponseComparison';

// SOLOMON Judge Components  
export { JudgeResponsePanel } from './JudgeResponsePanel';

// Complete MAGI System Interface
export { MAGISystemInterface } from './MAGISystemInterface';

// Re-export types for convenience
export type {
  AgentResponse,
  JudgeResponse,
  AgentType,
  DecisionType,
} from '@/types/domain';

export type {
  AskAgentResponse,
  AskAgentRequest,
} from '@/types/api';