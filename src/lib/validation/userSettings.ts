/**
 * User Settings Validation
 * 
 * ユーザー設定のバリデーション関数
 */

import { SEARCH_PROVIDERS, SearchProvider } from '@/types/userSettings';

/**
 * 検索プロバイダーが有効かチェック
 */
export function isValidSearchProvider(value: unknown): value is SearchProvider {
  return typeof value === 'string' && SEARCH_PROVIDERS.includes(value as SearchProvider);
}

/**
 * 検索プロバイダーをバリデーション
 * 無効な値の場合はデフォルト値を返す
 */
export function validateSearchProvider(value: unknown): SearchProvider {
  if (isValidSearchProvider(value)) {
    return value;
  }
  
  if (value !== undefined && value !== null) {
    console.warn(`Invalid search provider: ${value}, using default 'tavily'`);
  }
  
  return 'tavily';
}

/**
 * 検索プロバイダーの表示名を取得
 */
export function getSearchProviderDisplayName(provider: SearchProvider): string {
  const displayNames: Record<SearchProvider, string> = {
    tavily: 'Tavily（推奨）',
    serper: 'Serper',
  };
  
  return displayNames[provider] || provider;
}

/**
 * 検索プロバイダーの説明を取得
 */
export function getSearchProviderDescription(provider: SearchProvider): string {
  const descriptions: Record<SearchProvider, string> = {
    tavily: '高品質な検索結果と高速なレスポンス',
    serper: 'Google検索APIを使用した検索',
  };
  
  return descriptions[provider] || '';
}
