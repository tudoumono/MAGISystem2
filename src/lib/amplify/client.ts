/**
 * Amplify Client Configuration - クライアント設定とユーティリティ
 * 
 * 目的: Amplify Data クライアントの初期化と共通設定
 * 設計理由: クライアント設定を一元管理し、型安全性を確保
 * 
 * 主要機能:
 * - Amplify Data クライアントの初期化
 * - 認証設定の管理
 * - エラーハンドリングの統一
 * - 型安全なAPI呼び出し
 * 
 * 学習ポイント:
 * - Amplify v6 の新しいクライアント設定方式
 * - TypeScript との統合パターン
 * - 認証状態の管理
 * - エラーハンドリングの標準化
 * 
 * 使用例:
 * ```typescript
 * import { amplifyClient, withErrorHandling } from '@/lib/amplify/client';
 * 
 * // 型安全なAPI呼び出し
 * const conversations = await withErrorHandling(
 *   () => amplifyClient.models.Conversation.list()
 * );
 * ```
 * 
 * 関連: amplify/backend.ts, src/types/amplify.ts
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import type { Schema } from '../../types/amplify';
import { getAmplifyConfig, getCurrentEnvironmentMode, isMockMode } from './config';

/**
 * Amplify 設定の初期化
 * 
 * 学習ポイント:
 * - 環境に応じた自動設定切り替え
 * - amplify_outputs.json からの実設定読み込み
 * - モック設定との動的切り替え
 * - SSR対応の考慮事項
 * 
 * 設計理由:
 * - Phase 1-2: モック設定でフロントエンド開発
 * - Phase 3: 実AWS設定で部分統合
 * - Phase 4-6: 本番設定で完全統合
 */

// 環境に応じたAmplify設定を取得
const amplifyConfig = getAmplifyConfig({
  mode: getCurrentEnvironmentMode(),
  enableLogging: process.env.NODE_ENV === 'development',
});

// Amplify の初期化（クライアントサイドでのみ実行）
if (typeof window !== 'undefined') {
  try {
    Amplify.configure(amplifyConfig);
    
    // 開発環境での設定確認
    if (process.env.NODE_ENV === 'development') {
      const mode = getCurrentEnvironmentMode();
      console.log(`🚀 Amplify initialized in ${mode} mode`);
      
      if (isMockMode()) {
        console.log('📱 Using mock data - no AWS connection required');
      } else {
        console.log('☁️ Connected to AWS resources');
      }
    }
  } catch (error) {
    console.error('Amplify configuration failed:', error);
    console.warn('Falling back to mock configuration');
  }
}

/**
 * 型安全なAmplify Data クライアント
 * 
 * 学習ポイント:
 * - generateClient<Schema>(): 型安全なクライアント生成
 * - Schema型による自動補完とエラー検出
 * - GraphQL操作の型安全性確保
 */
export const amplifyClient = generateClient<Schema>();

/**
 * 認証状態の管理
 * 
 * 設計理由:
 * - 認証状態の一元管理
 * - エラーハンドリングの統一
 * - 型安全な認証情報取得
 */
export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  attributes: Record<string, any>;
}

/**
 * 現在のユーザー情報を取得
 * 
 * 学習ポイント:
 * - getCurrentUser(): Amplify v6 の認証API
 * - エラーハンドリングと型変換
 * - 認証状態の確認方法
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const user = await getCurrentUser();
    
    return {
      userId: user.userId,
      email: user.signInDetails?.loginId || '',
      name: user.signInDetails?.loginId || '',
      attributes: user.signInDetails || {},
    };
  } catch (error) {
    // 未認証の場合は null を返す
    if (error instanceof Error && error.name === 'UserUnAuthenticatedError') {
      return null;
    }
    
    console.error('Failed to get current user:', error);
    throw error;
  }
}

/**
 * 認証状態の確認
 * 
 * 学習ポイント:
 * - 認証状態の簡単な確認方法
 * - エラーハンドリングの簡略化
 * - boolean戻り値による使いやすさ
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/**
 * サインアウト処理
 * 
 * 学習ポイント:
 * - signOut(): Amplify v6 のサインアウトAPI
 * - グローバルサインアウトの設定
 * - エラーハンドリング
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut({ global: true });
  } catch (error) {
    console.error('Failed to sign out:', error);
    throw error;
  }
}

/**
 * API エラーの型定義
 * 
 * 設計理由:
 * - エラー情報の構造化
 * - エラーハンドリングの統一
 * - デバッグ情報の提供
 */
export interface APIError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

/**
 * エラーハンドリング付きAPI呼び出し
 * 
 * 学習ポイント:
 * - 高階関数によるエラーハンドリングの抽象化
 * - 統一されたエラー形式
 * - 再利用可能なエラー処理パターン
 * 
 * @param apiCall - 実行するAPI呼び出し関数
 * @returns API呼び出しの結果またはnull（エラー時）
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    const apiError = normalizeError(error);
    console.error('API Error:', apiError);
    
    // 認証エラーの場合は特別な処理
    if (apiError.code === 'UserUnAuthenticatedError') {
      // 認証画面にリダイレクトするなどの処理
      window.location.href = '/auth/signin';
      return null;
    }
    
    // その他のエラーは呼び出し元で処理
    throw apiError;
  }
}

/**
 * エラーの正規化
 * 
 * 学習ポイント:
 * - 様々なエラー形式の統一
 * - エラー情報の抽出と構造化
 * - デバッグ情報の保持
 */
function normalizeError(error: unknown): APIError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code || 'UnknownError',
      statusCode: (error as any).statusCode,
      details: error,
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'StringError',
    };
  }
  
  return {
    message: 'An unknown error occurred',
    code: 'UnknownError',
    details: error,
  };
}

/**
 * GraphQL操作のヘルパー関数群
 * 
 * 学習ポイント:
 * - 共通的なGraphQL操作の抽象化
 * - 型安全性の確保
 * - エラーハンドリングの統一
 * - 環境に応じた実装切り替え
 */

/**
 * ページネーション付きリスト取得
 * 
 * @param modelName - モデル名
 * @param options - クエリオプション
 * @returns ページネーション結果
 */
export async function listWithPagination<T>(
  modelName: keyof Schema,
  options: {
    filter?: any;
    limit?: number;
    nextToken?: string;
    sortDirection?: 'ASC' | 'DESC';
  } = {}
): Promise<{ items: T[]; nextToken?: string } | null> {
  return withErrorHandling(async () => {
    if (isMockMode()) {
      // モック実装（Phase 1-2）
      console.log(`📱 Mock: Listing ${modelName} with options:`, options);
      return {
        items: [] as T[],
      };
    } else {
      // 実際のAmplify実装（Phase 3以降）
      try {
        const result = await (amplifyClient.models as any)[modelName].list(options);
        return {
          items: result.data || [],
          nextToken: result.nextToken,
        };
      } catch (error) {
        console.error(`Failed to list ${modelName}:`, error);
        throw error;
      }
    }
  });
}

/**
 * 単一アイテムの取得
 * 
 * @param modelName - モデル名
 * @param id - アイテムID
 * @returns 取得結果
 */
export async function getById<T>(
  modelName: keyof Schema,
  id: string
): Promise<T | null> {
  return withErrorHandling(async () => {
    if (isMockMode()) {
      // モック実装（Phase 1-2）
      console.log(`📱 Mock: Getting ${modelName} with id: ${id}`);
      return null;
    } else {
      // 実際のAmplify実装（Phase 3以降）
      try {
        const result = await (amplifyClient.models as any)[modelName].get({ id });
        return result.data;
      } catch (error) {
        console.error(`Failed to get ${modelName} with id ${id}:`, error);
        throw error;
      }
    }
  });
}

/**
 * アイテムの作成
 * 
 * @param modelName - モデル名
 * @param input - 作成データ
 * @returns 作成結果
 */
export async function createItem<T, U>(
  modelName: keyof Schema,
  input: U
): Promise<T | null> {
  return withErrorHandling(async () => {
    if (isMockMode()) {
      // モック実装（Phase 1-2）
      console.log(`📱 Mock: Creating ${modelName} with data:`, input);
      return {
        id: `mock-${Date.now()}`,
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as T;
    } else {
      // 実際のAmplify実装（Phase 3以降）
      try {
        const result = await (amplifyClient.models as any)[modelName].create(input);
        return result.data;
      } catch (error) {
        console.error(`Failed to create ${modelName}:`, error);
        throw error;
      }
    }
  });
}

/**
 * アイテムの更新
 * 
 * @param modelName - モデル名
 * @param input - 更新データ（IDを含む）
 * @returns 更新結果
 */
export async function updateItem<T, U extends { id: string }>(
  modelName: keyof Schema,
  input: U
): Promise<T | null> {
  return withErrorHandling(async () => {
    if (isMockMode()) {
      // モック実装（Phase 1-2）
      console.log(`📱 Mock: Updating ${modelName} with data:`, input);
      return {
        ...input,
        updatedAt: new Date().toISOString(),
      } as T;
    } else {
      // 実際のAmplify実装（Phase 3以降）
      try {
        const result = await (amplifyClient.models as any)[modelName].update(input);
        return result.data;
      } catch (error) {
        console.error(`Failed to update ${modelName}:`, error);
        throw error;
      }
    }
  });
}

/**
 * アイテムの削除
 * 
 * @param modelName - モデル名
 * @param id - 削除対象ID
 * @returns 削除結果
 */
export async function deleteItem(
  modelName: keyof Schema,
  id: string
): Promise<boolean> {
  const result = await withErrorHandling(async () => {
    if (isMockMode()) {
      // モック実装（Phase 1-2）
      console.log(`📱 Mock: Deleting ${modelName} with id: ${id}`);
      return true;
    } else {
      // 実際のAmplify実装（Phase 3以降）
      try {
        const result = await (amplifyClient.models as any)[modelName].delete({ id });
        return result.data;
      } catch (error) {
        console.error(`Failed to delete ${modelName} with id ${id}:`, error);
        throw error;
      }
    }
  });
  
  return result !== null;
}

/**
 * リアルタイム更新の購読
 * 
 * 学習ポイント:
 * - GraphQL Subscriptionsの使用方法
 * - リアルタイム更新の管理
 * - 購読の開始と停止
 * - 環境に応じた実装切り替え
 * 
 * @param modelName - モデル名
 * @param callback - 更新時のコールバック
 * @returns 購読オブジェクト
 */
export function subscribeToUpdates<T>(
  modelName: keyof Schema,
  callback: (items: T[]) => void
): { unsubscribe: () => void } {
  if (isMockMode()) {
    // モック実装（Phase 1-2）
    console.log(`📱 Mock: Subscribing to ${modelName} updates`);
    
    // モックデータの定期更新をシミュレート
    const interval = setInterval(() => {
      // 実際の実装では、モックデータストアから更新を通知
      callback([]);
    }, 5000);
    
    return {
      unsubscribe: () => {
        clearInterval(interval);
        console.log(`📱 Mock: Unsubscribed from ${modelName} updates`);
      },
    };
  } else {
    // 実際のAmplify実装（Phase 3以降）
    try {
      const subscription = (amplifyClient.models as any)[modelName].observeQuery().subscribe({
        next: ({ items }: { items: T[] }) => callback(items),
        error: (error: any) => console.error(`Subscription error for ${modelName}:`, error)
      });
      
      return {
        unsubscribe: () => subscription.unsubscribe()
      };
    } catch (error) {
      console.error(`Failed to subscribe to ${modelName}:`, error);
      return {
        unsubscribe: () => {},
      };
    }
  }
}

/**
 * 設定の検証（レガシー関数 - 後方互換性のため保持）
 * 
 * 学習ポイント:
 * - 新しい設定システムへの移行
 * - 後方互換性の維持
 * - 段階的なリファクタリング
 * 
 * @deprecated Use validateAmplifyConfig from './config' instead
 */
export function validateAmplifyConfig(): boolean {
  const { validateAmplifyConfig: newValidateConfig } = require('./config');
  const result = newValidateConfig();
  return result.isValid;
}

// 開発環境での設定チェック（新しいシステムを使用）
if (process.env.NODE_ENV === 'development') {
  // 新しい設定システムで自動チェックが実行される
}