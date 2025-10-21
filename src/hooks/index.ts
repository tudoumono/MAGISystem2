/**
 * Custom Hooks Index - カスタムフック統合エクスポート
 * 
 * 目的: 全てのカスタムフックを一元的にエクスポート
 * 設計理由: インポート文の簡潔化と依存関係の明確化
 * 
 * 学習ポイント:
 * - モジュールの再エクスポートパターン
 * - 依存関係の整理
 * - TypeScript の型エクスポート
 * 
 * 使用例:
 * ```typescript
 * import { useConversations, useMessages } from '@/hooks';
 * 
 * // または個別インポート
 * import { useConversations } from '@/hooks/useConversations';
 * ```
 * 
 * 関連: src/hooks/useConversations.ts, src/hooks/useMessages.ts
 */

// データ管理フック
export { useConversations } from './useConversations';
export { useMessages } from './useMessages';

// 型定義の再エクスポート（必要に応じて）
export type {
  // useConversations関連の型
  // UseConversationsReturn,
  // UseConversationsOptions,
  
  // useMessages関連の型
  // UseMessagesReturn,
  // UseMessagesOptions,
} from './useConversations';

/**
 * 将来追加予定のフック
 * 
 * 学習ポイント:
 * - 段階的な機能追加の計画
 * - フックの責務分離
 * - 再利用可能な設計
 */

// 認証関連フック（Phase 2で追加予定）
// export { useAuth } from './useAuth';
// export { useAuthGuard } from './useAuthGuard';

// エージェント関連フック（Phase 3で追加予定）
// export { useAgentPresets } from './useAgentPresets';
// export { useAgentExecution } from './useAgentExecution';

// トレース関連フック（Phase 4で追加予定）
// export { useTraceSteps } from './useTraceSteps';
// export { useRealtimeTrace } from './useRealtimeTrace';

// UI状態管理フック（Phase 5で追加予定）
// export { useTheme } from './useTheme';
// export { useNotifications } from './useNotifications';
// export { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * フック使用のベストプラクティス
 * 
 * 学習ポイント:
 * - フックの適切な使用方法
 * - パフォーマンス考慮事項
 * - エラーハンドリングパターン
 * 
 * 推奨パターン:
 * 1. 必要な機能のみをインポート
 * 2. オプション設定による最適化
 * 3. エラー状態の適切な処理
 * 4. リアルタイム更新の制御
 * 
 * 例:
 * ```typescript
 * const {
 *   conversations,
 *   loading,
 *   error,
 *   createConversation
 * } = useConversations({
 *   limit: 20,
 *   enableRealtime: true,
 *   enableOptimisticUpdates: true
 * });
 * 
 * // エラーハンドリング
 * if (error) {
 *   return <ErrorMessage message={error} />;
 * }
 * 
 * // ローディング状態
 * if (loading) {
 *   return <LoadingSpinner />;
 * }
 * ```
 */