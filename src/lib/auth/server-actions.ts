/**
 * Server Actions for Authentication - SSR認証処理
 * 
 * 目的: Next.js 15 Server Actions による認証処理とセッション管理
 * 設計理由: サーバーサイドでの安全な認証処理とトークン管理
 * 
 * 主要機能:
 * - リクエストCookieからのトークン検証
 * - セッション永続化と自動更新
 * - サーバーサイド認証ガード
 * - セキュアなサインアウト処理
 * 
 * 学習ポイント:
 * - Next.js 15 Server Actions の使用方法
 * - Cookie による安全なセッション管理
 * - AWS Amplify v6 のサーバーサイド認証
 * - TypeScript での非同期処理
 * 
 * 使用例:
 * ```typescript
 * // サーバーコンポーネントで使用
 * const user = await getCurrentUserServer();
 * 
 * // クライアントコンポーネントで使用
 * const handleSignOut = async () => {
 *   await signOutAction();
 *   router.push('/signin');
 * };
 * ```
 * 
 * 関連: src/components/auth/AuthProvider.tsx, src/app/(auth)/layout.tsx
 */

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { getAmplifyConfig, getCurrentEnvironmentMode } from '@/lib/amplify/config';

import { getSecureCookieOptions } from './utils';

/**
 * サーバーサイド認証ユーザーの型定義
 * 
 * 学習ポイント:
 * - クライアントサイドとの型の統一
 * - セキュリティを考慮した情報の制限
 * - サーバーサイド固有の情報の追加
 */
export interface ServerAuthUser {
  userId: string;
  username: string;
  email?: string | undefined;
  name?: string | undefined;
  lastSignIn?: string | undefined;
  sessionExpiry?: string | undefined;
}

/**
 * 認証エラーの型定義
 */
export interface ServerAuthError {
  code: string;
  message: string;
  timestamp: string;
}

/**
 * セッション情報の型定義
 */
export interface SessionInfo {
  user: ServerAuthUser | null;
  isAuthenticated: boolean;
  error: ServerAuthError | null;
}

/**
 * Amplify設定の初期化
 * 
 * 学習ポイント:
 * - サーバーサイドでのAmplify設定
 * - 環境に応じた設定の切り替え
 * - 初期化の最適化
 */
let isAmplifyConfigured = false;

function ensureAmplifyConfigured() {
  if (!isAmplifyConfigured) {
    const config = getAmplifyConfig();
    Amplify.configure(config, { ssr: true });
    isAmplifyConfigured = true;
  }
}

/**
 * モック認証サービス（サーバーサイド版）
 * 
 * 設計理由:
 * - Phase 1-2 でのサーバーサイド開発を可能にする
 * - クライアントサイドとの整合性を保つ
 * - 学習用の分かりやすい実装
 */
class MockServerAuthService {
  private static instance: MockServerAuthService;
  
  static getInstance(): MockServerAuthService {
    if (!MockServerAuthService.instance) {
      MockServerAuthService.instance = new MockServerAuthService();
    }
    return MockServerAuthService.instance;
  }
  
  async getCurrentUser(): Promise<ServerAuthUser | null> {
    const cookieStore = await cookies();
    const mockUserCookie = cookieStore.get('mock-auth-user');
    
    if (mockUserCookie) {
      try {
        const userData = JSON.parse(mockUserCookie.value);
        return {
          userId: userData.userId || 'mock-user-id',
          username: userData.username || 'demo@example.com',
          email: userData.username || 'demo@example.com',
          name: userData.name || 'Demo User',
          lastSignIn: new Date().toISOString(),
          sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
        };
      } catch (error) {
        console.error('Failed to parse mock user cookie:', error);
        return null;
      }
    }
    
    return null;
  }
  
  async signOut(): Promise<void> {
    const cookieStore = await cookies();
    
    // モックユーザーCookieを削除
    cookieStore.delete('mock-auth-user');
    
    // セッション関連のCookieも削除
    cookieStore.delete('mock-session-token');
    cookieStore.delete('mock-refresh-token');
  }
  
  async setUserSession(user: any): Promise<void> {
    const cookieStore = await cookies();
    
    // セキュアなCookie設定
    const cookieOptions = getSecureCookieOptions();
    
    // ユーザー情報をCookieに保存
    cookieStore.set('mock-auth-user', JSON.stringify(user), cookieOptions);
    
    // セッショントークンをCookieに保存
    cookieStore.set('mock-session-token', 'mock-session-' + Date.now(), cookieOptions);
  }
}

/**
 * 現在のユーザー情報を取得（サーバーサイド）
 * 
 * 学習ポイント:
 * - Server Actions の基本的な実装
 * - Cookie からの情報取得
 * - エラーハンドリングの実装
 * - 環境に応じた処理の切り替え
 */
export async function getCurrentUserServer(): Promise<ServerAuthUser | null> {
  try {
    // 実環境での処理
    ensureAmplifyConfigured();
    
    try {
      const user = await getCurrentUser();
      
      if (user) {
        return {
          userId: user.userId,
          username: user.username,
          email: user.signInDetails?.loginId || undefined,
          name: user.signInDetails?.loginId || undefined, // 実際の実装では attributes から取得
          lastSignIn: new Date().toISOString(),
        };
      }
      
      return null;
    } catch (authError) {
      // 認証エラーは正常な状態（未サインイン）として扱う
      if (authError instanceof Error && authError.name === 'UserUnAuthenticatedException') {
        console.log('User not authenticated - this is normal for unauthenticated access');
        return null;
      }
      
      // その他のエラーはログに記録
      console.error('Authentication error:', authError);
      return null;
    }
  } catch (error) {
    console.error('Failed to get current user on server:', error);
    return null;
  }
}

/**
 * セッション情報を取得（サーバーサイド）
 * 
 * 学習ポイント:
 * - 包括的なセッション情報の提供
 * - エラー情報の適切な処理
 * - 型安全な戻り値
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  try {
    const user = await getCurrentUserServer();

    return {
      user,
      isAuthenticated: !!user,
      error: null,
    };
  } catch (error) {
    console.error('Failed to get session info:', error);

    return {
      user: null,
      isAuthenticated: false,
      error: {
        code: 'SESSION_ERROR',
        message: 'セッション情報の取得に失敗しました',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * 認証が必要なページの保護
 * 
 * 学習ポイント:
 * - Server Actions による認証ガード
 * - 条件付きリダイレクト
 * - セキュリティを考慮した実装
 */
export async function requireAuth(redirectTo: string = '/signin'): Promise<ServerAuthUser> {
  const user = await getCurrentUserServer();
  
  if (!user) {
    redirect(redirectTo);
  }
  
  return user;
}

/**
 * サインアウト処理（サーバーサイド）
 * 
 * 学習ポイント:
 * - セキュアなサインアウト処理
 * - Cookie の適切なクリア
 * - エラーハンドリング
 */
export async function signOutAction(): Promise<{ success: boolean; error?: string }> {
  try {
    ensureAmplifyConfigured();
    await signOut();
    
    // 追加のセッションクリーンアップ
    const cookieStore = await cookies();
    
    // Amplify関連のCookieをクリア
    const cookiesToClear = [
      'amplify-signin-with-hostedUI',
      'amplify-redirected-from-hosted-ui',
      'CognitoIdentityServiceProvider',
    ];
    
    cookiesToClear.forEach(cookieName => {
      try {
        cookieStore.delete(cookieName);
      } catch (error) {
        // Cookie削除エラーは無視（存在しない場合など）
        console.warn(`Failed to delete cookie ${cookieName}:`, error);
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Sign out failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'サインアウトに失敗しました',
    };
  }
}

/**
 * セッション更新処理
 * 
 * 学習ポイント:
 * - トークンの自動更新
 * - セッション延長の実装
 * - エラー時の適切な処理
 */
export async function refreshSession(): Promise<{ success: boolean; user?: ServerAuthUser; error?: string }> {
  try {
    ensureAmplifyConfigured();
    
    // 実環境では Amplify の自動トークン更新を利用
    const user = await getCurrentUser();
    
    if (user) {
      const serverUser: ServerAuthUser = {
        userId: user.userId,
        username: user.username,
        email: user.signInDetails?.loginId || undefined,
        name: user.signInDetails?.loginId || undefined,
        lastSignIn: new Date().toISOString(),
      };
      
      return { success: true, user: serverUser };
    }
    
    return { success: false, error: 'ユーザーが見つかりません' };
  } catch (error) {
    console.error('Session refresh failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'セッション更新に失敗しました',
    };
  }
}



/**
 * セッション有効性チェック
 * 
 * 学習ポイント:
 * - セッションの有効期限チェック
 * - セキュリティを考慮した検証
 * - パフォーマンスを考慮した実装
 */
export async function validateSession(): Promise<{ valid: boolean; user?: ServerAuthUser; error?: string }> {
  try {
    const sessionInfo = await getSessionInfo();
    
    if (sessionInfo.error) {
      return {
        valid: false,
        error: sessionInfo.error.message,
      };
    }
    
    if (!sessionInfo.isAuthenticated || !sessionInfo.user) {
      return {
        valid: false,
        error: '認証されていません',
      };
    }

    // Amplifyが自動的にトークンの有効期限を管理
    return {
      valid: true,
      user: sessionInfo.user,
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'セッション検証に失敗しました',
    };
  }
}