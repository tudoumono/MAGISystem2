'use client';

/**
 * Amplify Integration Index - MAGI Decision UI
 * 
 * このファイルはAmplify Data/AI Kit統合の全ての型定義と機能をエクスポートします。
 * 一元化されたインポートにより、開発効率と保守性を向上させます。
 * 
 * 目的:
 * - Amplify関連の全機能の一元管理
 * - 型定義とフックの統合エクスポート
 * - インポート文の簡素化
 * - 依存関係の明確化
 * 
 * 設計理由:
 * - バレルエクスポートパターンによる使いやすさ向上
 * - 型安全性の確保
 * - 将来的な拡張への対応
 * - 開発者体験の向上
 * 
 * 使用例:
 * ```typescript
 * import { 
 *   User, 
 *   Conversation, 
 *   Message,
 *   useConversations,
 *   useMessages 
 * } from '@/lib/amplify';
 * ```
 * 
 * 学習ポイント:
 * - バレルエクスポートパターンの実装
 * - TypeScriptモジュールシステムの活用
 * - 依存関係の整理と管理
 */

// 型定義のエクスポート
export type {
  // 基本型
  ID,
  DateTime,
  JSON,
  AgentType,
  DecisionType,
  MessageRole,

  // エージェント関連型
  AgentResponse,
  AgentScore,
  JudgeResponse,
  AgentConfig,

  // データモデル型
  User,
  Conversation,
  Message,
  TraceStep,
  AgentPreset,

  // API関連型
  AskRequest,
  AskResponse,
  GraphQLResult,
  ListResult,
  SubscriptionEvent,

  // エラー型
  GraphQLError,
  NetworkError,
  AuthError,

  // スキーマ型
  Schema
} from './types';

// フック関連のエクスポート
export { useConversations } from '@/hooks/useConversations';
export { useMessages } from '@/hooks/useMessages';

// 楽観的更新ユーティリティのエクスポート
export {
  OptimisticUpdateManager,
  useOptimisticUpdate,
  optimisticHelpers
} from '@/lib/optimistic-updates';

export type {
  OptimisticOperationType,
  OptimisticUpdateConfig,
  OptimisticUpdateResult
} from '@/lib/optimistic-updates';

/**
 * エージェント説明の定数
 * 
 * 学習ポイント:
 * - 定数の一元管理
 * - UI表示用データの提供
 * - 国際化対応の基盤
 */
export const AGENT_DESCRIPTIONS = {
  solomon: 'SOLOMON Judge - 統括者として3賢者の投票を集計し、最終的な可決/否決を決定',
  caspar: 'CASPAR - 保守的・現実的な視点で可決/否決を判断（リスク重視）',
  balthasar: 'BALTHASAR - 革新的・感情的な視点で可決/否決を判断（創造性重視）',
  melchior: 'MELCHIOR - バランス型・科学的な視点で可決/否決を判断（論理性重視）'
} as const;

/**
 * 判断結果の表示スタイル
 * 
 * 学習ポイント:
 * - UI表示用の設定データ
 * - Tailwind CSSクラスの管理
 * - 一貫したデザインシステム
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

/**
 * デフォルトエージェント設定
 * 
 * 学習ポイント:
 * - プリセット設定の提供
 * - 初期値の一元管理
 * - 設定の標準化
 */
import type { AgentConfig, AgentType, DecisionType, MessageRole, AgentResponse } from './types';

export const DEFAULT_AGENT_CONFIGS: AgentConfig[] = [
  {
    agentId: 'caspar',
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    systemPrompt: `あなたはCASPAR（カスパー）です。保守的で現実的な視点から物事を判断します。

特徴:
- リスク分析を重視
- 過去の事例や実績を参考にする
- 慎重で段階的なアプローチを好む
- 実現可能性と安全性を最優先

判断基準:
- 成功確率と失敗時のリスクを評価
- 既存の方法との比較検討
- 必要なリソースと時間の現実的な見積もり
- 予期しない問題への対処可能性

回答形式:
1. 可決/否決の判断とその理由
2. リスク分析の詳細
3. 推奨する対策や代替案`,
    temperature: 0.3,
    maxTokens: 1000
  },
  {
    agentId: 'balthasar',
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    systemPrompt: `あなたはBALTHASAR（バルタザール）です。革新的で感情的な視点から物事を判断します。

特徴:
- 創造性と革新性を重視
- 新しい可能性への挑戦を推奨
- 感情的・直感的な判断を含める
- 長期的なビジョンと価値創造を考慮

判断基準:
- 創造的価値と革新性の評価
- 社会的・文化的インパクトの考慮
- 人間の感情や体験への影響
- 未来への可能性と成長性

回答形式:
1. 可決/否決の判断とその理由
2. 創造的価値と革新性の分析
3. 感情的・直感的な観点からの評価
4. 長期的なビジョンと期待される効果`,
    temperature: 0.8,
    maxTokens: 1000
  },
  {
    agentId: 'melchior',
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    systemPrompt: `あなたはMELCHIOR（メルキオール）です。バランス型で科学的な視点から物事を判断します。

特徴:
- データと論理に基づく分析
- 多角的な視点からの検討
- 客観性と公平性を重視
- 科学的手法による評価

判断基準:
- 定量的データと定性的情報の統合分析
- 複数の視点からの比較検討
- 論理的整合性と科学的根拠
- 短期・中期・長期の影響評価

回答形式:
1. 可決/否決の判断とその理由
2. データに基づく客観的分析
3. 多角的視点からの検討結果
4. 科学的根拠と論理的結論`,
    temperature: 0.5,
    maxTokens: 1000
  },
  {
    agentId: 'solomon',
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    systemPrompt: `あなたはSOLOMON Judge（ソロモン審判官）です。3賢者の判断を統合し、最終的な評価を行います。

役割:
- 3賢者（CASPAR、BALTHASAR、MELCHIOR）の回答を分析
- 各回答の質と論理性を0-100点で評価
- 投票結果（可決/否決）を集計
- 最終的な推奨判断を提示

評価基準:
- 論理的整合性と根拠の明確性
- 分析の深さと包括性
- 実用性と実現可能性
- 創造性と革新性のバランス

出力形式:
1. 投票結果の集計（可決X票、否決Y票）
2. 各賢者への評価スコア（0-100点）と理由
3. 最終判断（可決/否決）とその根拠
4. 統合的な要約と推奨事項`,
    temperature: 0.4,
    maxTokens: 1500
  }
];

/**
 * ユーティリティ関数
 * 
 * 学習ポイント:
 * - 共通処理の関数化
 * - 型安全性の確保
 * - 再利用可能な実装
 */

/**
 * エージェントタイプの検証
 */
export function isValidAgentType(value: string): value is AgentType {
  return ['caspar', 'balthasar', 'melchior', 'solomon'].includes(value);
}

/**
 * 判断タイプの検証
 */
export function isValidDecisionType(value: string): value is DecisionType {
  return ['APPROVED', 'REJECTED'].includes(value);
}

/**
 * メッセージロールの検証
 */
export function isValidMessageRole(value: string): value is MessageRole {
  return ['user', 'assistant'].includes(value);
}

/**
 * エージェント設定の検証
 */
export function validateAgentConfig(config: any): config is AgentConfig {
  return (
    config &&
    typeof config === 'object' &&
    isValidAgentType(config.agentId) &&
    typeof config.modelId === 'string' &&
    typeof config.systemPrompt === 'string' &&
    typeof config.temperature === 'number' &&
    typeof config.maxTokens === 'number' &&
    config.temperature >= 0 &&
    config.temperature <= 1 &&
    config.maxTokens > 0
  );
}

/**
 * 投票結果の計算
 */
export function calculateVotingResult(responses: AgentResponse[]) {
  const approved = responses.filter(r => r.decision === 'APPROVED').length;
  const rejected = responses.filter(r => r.decision === 'REJECTED').length;
  const abstained = responses.length - approved - rejected;

  return {
    approved,
    rejected,
    abstained,
    total: responses.length,
    finalDecision: approved > rejected ? 'APPROVED' as const : 'REJECTED' as const
  };
}

/**
 * 信頼度の平均計算
 */
export function calculateAverageConfidence(responses: AgentResponse[]): number {
  if (responses.length === 0) return 0;
  
  const totalConfidence = responses.reduce((sum, response) => sum + response.confidence, 0);
  return totalConfidence / responses.length;
}

/**
 * 実行時間の統計計算
 */
export function calculateExecutionStats(responses: AgentResponse[]) {
  if (responses.length === 0) {
    return { min: 0, max: 0, average: 0, total: 0 };
  }

  const times = responses.map(r => r.executionTime);
  const total = times.reduce((sum, time) => sum + time, 0);
  
  return {
    min: Math.min(...times),
    max: Math.max(...times),
    average: total / times.length,
    total
  };
}

/**
 * 学習リソースとドキュメント参照
 * 
 * 関連ファイル:
 * - src/hooks/useConversations.ts: 会話データ管理フック
 * - src/hooks/useMessages.ts: メッセージデータ管理フック
 * - src/lib/optimistic-updates.ts: 楽観的更新パターン
 * - amplify/data/resource.ts: Amplify Dataスキーマ定義
 * 
 * 学習ポイント:
 * - Amplify Data/AI Kitの統合パターン
 * - GraphQL操作の型安全な実装
 * - リアルタイム更新の処理方法
 * - 楽観的更新によるUX向上
 * - エラーハンドリングとリトライ戦略
 * 
 * 次のステップ:
 * 1. 実際のコンポーネントでのフック使用
 * 2. エラーハンドリングの実装
 * 3. パフォーマンス最適化
 * 4. テストの作成
 */