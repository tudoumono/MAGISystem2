/**
 * User Settings Type Definitions
 * 
 * ユーザー設定の型定義とデフォルト値
 */

export const SEARCH_PROVIDERS = ['tavily', 'serper'] as const;
export type SearchProvider = typeof SEARCH_PROVIDERS[number];

export interface UserSettings {
  id?: string;
  userId: string;
  tavilyApiKey?: string | null;
  serperApiKey?: string | null;
  enableWebSearch: boolean;
  searchProvider: SearchProvider;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_USER_SETTINGS: Partial<UserSettings> = {
  enableWebSearch: false,
  searchProvider: 'tavily',
};
