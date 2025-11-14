/**
 * Backend Request Types - バックエンドリクエストの型定義
 *
 * 目的:
 * - フロントエンドとバックエンド間のデータ変換を型安全に実装
 * - バックエンド（Python）が期待する形式を明確に定義
 */

/**
 * バックエンドのランタイム設定（単一エージェント）
 */
export interface BackendRuntimeConfig {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

/**
 * バックエンドのカスタムプロンプト辞書
 *
 * 例: {
 *   caspar: 'あなたは保守的な賢者です...',
 *   balthasar: 'あなたは革新的な賢者です...',
 *   melchior: 'あなたはバランス型の賢者です...',
 *   solomon: 'あなたは統括AIです...'
 * }
 */
export interface BackendCustomPrompts {
  caspar?: string;
  balthasar?: string;
  melchior?: string;
  solomon?: string;
}

/**
 * バックエンドのモデル設定辞書
 *
 * 例: {
 *   caspar: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
 *   balthasar: 'amazon.nova-pro-v1:0',
 *   melchior: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
 *   solomon: 'anthropic.claude-opus-4-1-20250805-v1:0'
 * }
 */
export interface BackendModelConfigs {
  caspar?: string;
  balthasar?: string;
  melchior?: string;
  solomon?: string;
}

/**
 * バックエンドのランタイム設定辞書
 *
 * 例: {
 *   caspar: {temperature: 0.3, max_tokens: 2000, top_p: 0.9},
 *   balthasar: {temperature: 0.7, max_tokens: 2000, top_p: 0.95},
 *   melchior: {temperature: 0.5, max_tokens: 2000, top_p: 0.92},
 *   solomon: {temperature: 0.4, max_tokens: 3000, top_p: 0.9}
 * }
 */
export interface BackendRuntimeConfigs {
  caspar?: BackendRuntimeConfig;
  balthasar?: BackendRuntimeConfig;
  melchior?: BackendRuntimeConfig;
  solomon?: BackendRuntimeConfig;
}

/**
 * バックエンドへのリクエストペイロード
 */
export interface BackendRequestPayload {
  question: string;
  conversationId: string;
  custom_prompts?: BackendCustomPrompts;
  model_configs?: BackendModelConfigs;
  runtime_configs?: BackendRuntimeConfigs;
}
