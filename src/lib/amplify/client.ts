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

/**
 * Amplify 設定の初期化
 * 
 * 学習ポイント:
 * - Amplify.configure(): 設定の初期化
 * - 環境変数からの設定読み込み
 * - SSR対応の考慮事項
 * 
 * 注意: 実際の本番環境では amplify_outputs.json から設定を読み込む
 */
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'mock-user-pool-id',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'mock-client-id',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || 'mock-identity-pool-id',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'https://mock-api.example.com/graphql',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'userPool' as const,
      ...(process.env.NEXT_PUBLIC_API_KEY && { apiKey: process.env.NEXT_PUBLIC_API_KEY }),
    },
  },
};

// Amplify の初期化（クライアントサイドでのみ実行）
if (typeof window !== 'undefined') {
  try {
    Amplify.configure(amplifyConfig);
  } catch (error) {
    console.warn('Amplify configuration failed (using mock configuration):', error);
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
    // 実際のAmplify実装では以下のようなコードを使用
    // const result = await amplifyClient.models[modelName].list(options);
    // return {
    //   items: result.data,
    //   nextToken: result.nextToken
    // };
    
    // モック実装
    return {
      items: [] as T[],
    };
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
    // 実際のAmplify実装では以下のようなコードを使用
    // const result = await amplifyClient.models[modelName].get({ id });
    // return result.data;
    
    // モック実装
    return null;
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
    // 実際のAmplify実装では以下のようなコードを使用
    // const result = await amplifyClient.models[modelName].create(input);
    // return result.data;
    
    // モック実装
    return null;
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
    // 実際のAmplify実装では以下のようなコードを使用
    // const result = await amplifyClient.models[modelName].update(input);
    // return result.data;
    
    // モック実装
    return null;
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
    // 実際のAmplify実装では以下のようなコードを使用
    // const result = await amplifyClient.models[modelName].delete({ id });
    // return result.data;
    
    // モック実装
    return true;
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
 * 
 * @param modelName - モデル名
 * @param callback - 更新時のコールバック
 * @returns 購読オブジェクト
 */
export function subscribeToUpdates<T>(
  modelName: keyof Schema,
  callback: (items: T[]) => void
): { unsubscribe: () => void } {
  // 実際のAmplify実装では以下のようなコードを使用
  // const subscription = amplifyClient.models[modelName].observeQuery().subscribe({
  //   next: ({ items }) => callback(items),
  //   error: (error) => console.error('Subscription error:', error)
  // });
  // 
  // return {
  //   unsubscribe: () => subscription.unsubscribe()
  // };
  
  // モック実装
  return {
    unsubscribe: () => {},
  };
}

/**
 * 設定の検証
 * 
 * 学習ポイント:
 * - 設定値の妥当性確認
 * - 開発環境での設定チェック
 * - エラーの早期発見
 */
export function validateAmplifyConfig(): boolean {
  const requiredEnvVars = [
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
    'NEXT_PUBLIC_GRAPHQL_ENDPOINT',
  ];
  
  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName] || process.env[varName]?.startsWith('mock-')
  );
  
  if (missingVars.length > 0) {
    console.warn(
      'Missing or mock Amplify configuration:',
      missingVars.join(', ')
    );
    console.warn(
      'Please run `amplify push` to deploy resources and update environment variables.'
    );
    return false;
  }
  
  return true;
}

// 開発環境での設定チェック
if (process.env.NODE_ENV === 'development') {
  validateAmplifyConfig();
}