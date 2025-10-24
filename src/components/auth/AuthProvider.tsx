/**
 * AuthProvider Component - 認証状態管理とコンテキスト提供
 * 
 * 目的: アプリケーション全体で認証状態を管理し、認証機能を提供
 * 設計理由: React Context による状態の一元管理とSSR対応
 * 
 * 主要機能:
 * - AWS Amplify Auth との統合
 * - SSR対応のトークン処理
 * - 認証状態の自動更新
 * - エラーハンドリングと回復機能
 * 
 * 学習ポイント:
 * - React Context API の使用方法
 * - Next.js 15 でのSSR認証パターン
 * - AWS Amplify v6 の認証API
 * - TypeScript での型安全な状態管理
 * 
 * 使用例:
 * ```typescript
 * // プロバイダーでアプリをラップ
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // コンポーネント内で使用
 * const { user, signIn, signOut, loading } = useAuth();
 * ```
 * 
 * 関連: src/lib/amplify/config.ts, src/components/auth/SignInForm.tsx
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getCurrentUser, signIn as amplifySignIn, signOut as amplifySignOut, AuthUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { Amplify } from 'aws-amplify';
import { getAmplifyConfig } from '@/lib/amplify/config';

/**
 * 認証エラーの型定義
 * 
 * 学習ポイント:
 * - エラーコードによる分類
 * - ユーザーフレンドリーなメッセージ
 * - 回復可能性の判定
 */
export interface AuthError {
  code: string;
  message: string;
  name: string;
  recoverySuggestion?: string;
}

/**
 * サインイン認証情報の型定義
 * 
 * 学習ポイント:
 * - 必須フィールドの明確化
 * - オプショナルフィールドの活用
 * - セキュリティを考慮した型設計
 */
export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * サインアップ認証情報の型定義
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

/**
 * パスワードリセット認証情報の型定義
 */
export interface ResetPasswordCredentials {
  email: string;
}

/**
 * 認証コンテキストの型定義
 * 
 * 学習ポイント:
 * - 認証状態の包括的な管理
 * - 非同期操作の適切な型定義
 * - エラーハンドリングの統合
 */
export interface AuthContextType {
  // 認証状態
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  
  // 認証操作
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<void>;
  
  // ユーティリティ
  clearError: () => void;
  refreshUser: () => Promise<void>;
  
  // 状態チェック
  isAuthenticated: boolean;
}

/**
 * 認証コンテキストの作成
 * 
 * 学習ポイント:
 * - createContext の使用方法
 * - デフォルト値の設定
 * - 型安全性の確保
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);



/**
 * AuthProviderコンポーネント
 * 
 * 設計理由:
 * - 認証状態の一元管理
 * - 環境に応じた認証サービスの切り替え
 * - エラーハンドリングの統一
 * 
 * 学習ポイント:
 * - useEffect による初期化処理
 * - useCallback によるパフォーマンス最適化
 * - Hub による認証イベントの監視
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  
  /**
   * エラーハンドリング関数
   * 
   * 学習ポイント:
   * - エラーオブジェクトの正規化
   * - ユーザーフレンドリーなメッセージ変換
   * - 回復提案の提供
   */
  const handleError = useCallback((err: any): AuthError => {
    console.error('Auth error:', err);
    
    // Amplify エラーの処理
    if (err.name === 'NotAuthorizedException') {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'メールアドレスまたはパスワードが正しくありません',
        name: err.name,
        recoverySuggestion: 'メールアドレスとパスワードを確認してください'
      };
    }
    
    if (err.name === 'UserNotConfirmedException') {
      return {
        code: 'USER_NOT_CONFIRMED',
        message: 'アカウントの確認が完了していません',
        name: err.name,
        recoverySuggestion: 'メールに送信された確認コードを入力してください'
      };
    }
    

    
    // 一般的なエラー
    return {
      code: 'UNKNOWN_ERROR',
      message: err.message || '認証エラーが発生しました',
      name: err.name || 'AuthError',
      recoverySuggestion: 'しばらく時間をおいて再試行してください'
    };
  }, []);
  
  /**
   * ユーザー情報の取得
   * 
   * 学習ポイント:
   * - 環境に応じた認証サービスの使い分け
   * - エラーハンドリングの統一
   * - 状態更新の適切なタイミング
   */
  const fetchUser = useCallback(async () => {
    console.log('fetchUser called - using real Amplify');
    try {
      setLoading(true);
      setError(null);
      
      console.log('Using real Amplify to get current user');
      const currentUser = await getCurrentUser();
      
      console.log('fetchUser result:', currentUser ? 'User found' : 'No user');
      setUser(currentUser);
      
      // ユーザーが見つかった場合、ミドルウェア用のCookieを設定
      if (currentUser && typeof window !== 'undefined') {
        document.cookie = `amplify-auth=true; path=/; max-age=86400; SameSite=Strict`;
        console.log('Set authentication cookie for middleware (from fetchUser)');
      }
    } catch (err) {
      console.log('fetchUser error:', err);
      console.log('No authenticated user found');
      setUser(null);
      
      // 認証エラーの場合、Cookieを削除
      if (typeof window !== 'undefined') {
        document.cookie = 'amplify-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } finally {
      console.log('fetchUser finally - setting loading to false');
      setLoading(false);
    }
  }, []);
  
  /**
   * サインイン処理
   * 
   * 学習ポイント:
   * - 非同期処理のエラーハンドリング
   * - ローディング状態の管理
   * - 成功時の状態更新
   */
  const signIn = useCallback(async (credentials: SignInCredentials) => {
    try {
      console.log('AuthProvider signIn started - using real Amplify');
      setLoading(true);
      setError(null);
      
      console.log('Using real Amplify auth service');
      await amplifySignIn({
        username: credentials.email,
        password: credentials.password,
      });
      
      // 認証成功後、ミドルウェア用のCookieを設定
      if (typeof window !== 'undefined') {
        // 簡単な認証フラグをCookieに設定
        document.cookie = `amplify-auth=true; path=/; max-age=86400; SameSite=Strict`;
        console.log('Set authentication cookie for middleware');
      }
      
      // Amplify Hub が自動的にユーザー状態を更新
      console.log('Amplify signIn successful');
    } catch (err) {
      console.error('AuthProvider signIn error:', err);
      const authError = handleError(err);
      setError(authError);
      throw authError;
    } finally {
      console.log('AuthProvider signIn finally block - setting loading to false');
      setLoading(false);
    }
  }, [handleError]);
  
  /**
   * サインアップ処理
   */
  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // 実際のAmplify signUp実装
      const { signUp: amplifySignUp } = await import('aws-amplify/auth');
      await amplifySignUp({
        username: credentials.email,
        password: credentials.password,
        options: {
          userAttributes: {
            email: credentials.email,
            name: credentials.name || credentials.email,
          },
        },
      });
    } catch (err) {
      const authError = handleError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  
  /**
   * サインアウト処理
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await amplifySignOut();
      
      // ミドルウェア用のCookieも削除
      if (typeof window !== 'undefined') {
        document.cookie = 'amplify-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        console.log('Removed authentication cookie');
      }
      
      // Amplify Hub が自動的にユーザー状態を更新
    } catch (err) {
      const authError = handleError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  
  /**
   * パスワードリセット処理
   */
  const resetPassword = useCallback(async (credentials: ResetPasswordCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // 実際のAmplify resetPassword実装
      // await amplifyResetPassword({ username: credentials.email });
      throw new Error('Password reset not implemented in this phase');
    } catch (err) {
      const authError = handleError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  
  /**
   * エラークリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * ユーザー情報の更新
   */
  const refreshUser = useCallback(async () => {
    console.log('refreshUser called');
    await fetchUser();
  }, [fetchUser]);
  
  /**
   * 初期化処理
   * 
   * 学習ポイント:
   * - Amplify設定の初期化
   * - 認証イベントの監視設定
   * - 初回ユーザー取得
   */
  useEffect(() => {
    console.log('AuthProvider initialization - real Amplify mode only');
    
    // Amplify設定の初期化
    const config = getAmplifyConfig();
    Amplify.configure(config);
    
    // 初回ユーザー取得
    fetchUser();
    
    // Amplify Hub による認証イベント監視
    const hubListener = Hub.listen('auth', ({ payload }) => {
      console.log('Auth Hub event:', payload.event);
      switch (payload.event) {
        case 'signedIn':
          console.log('User signed in via Hub');
          fetchUser();
          break;
        case 'signedOut':
          console.log('User signed out via Hub');
          setUser(null);
          setLoading(false);
          break;
        case 'tokenRefresh':
          console.log('Token refreshed via Hub');
          break;
        case 'tokenRefresh_failure':
          console.log('Token refresh failed via Hub');
          setUser(null);
          setLoading(false);
          break;
      }
    });
    
    return () => {
      console.log('Cleaning up Auth Hub listener');
      hubListener();
    };
  }, [fetchUser]);
  
  /**
   * コンテキスト値の構築
   * 
   * 学習ポイント:
   * - useMemo によるパフォーマンス最適化
   * - 計算プロパティの活用
   * - 型安全性の確保
   */
  const contextValue: AuthContextType = React.useMemo(() => ({
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
    refreshUser,
    isAuthenticated: !!user,
  }), [
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
    refreshUser,
  ]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth カスタムフック
 * 
 * 学習ポイント:
 * - カスタムフックによる状態管理の抽象化
 * - エラーハンドリングの統一
 * - 型安全性の確保
 * 
 * 使用例:
 * ```typescript
 * const { user, signIn, loading } = useAuth();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (!user) return <SignInForm />;
 * return <Dashboard />;
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};