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
import { getAmplifyConfig, isMockMode } from '@/lib/amplify/config';

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
  isMockMode: boolean;
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
 * モック認証機能（Phase 1-2用）
 * 
 * 設計理由:
 * - AWS接続なしでの開発を可能にする
 * - 実際の認証フローをシミュレート
 * - 学習用の分かりやすい実装
 */
class MockAuthService {
  private static instance: MockAuthService;
  private currentUser: AuthUser | null = null;
  
  static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService();
    }
    return MockAuthService.instance;
  }
  
  async signIn(credentials: SignInCredentials): Promise<AuthUser> {
    // モック認証ロジック
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒の遅延をシミュレート
    
    if (credentials.email === 'demo@demo.com' && credentials.password === 'P@ssw0rd') {
      this.currentUser = {
        userId: 'mock-user-id',
        username: credentials.email,
      } as AuthUser;
      
      // ローカルストレージに保存（セッション永続化のシミュレート）
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock-auth-user', JSON.stringify(this.currentUser));
        
        // middlewareで認証状態を確認できるようにCookieも設定
        document.cookie = `mock-auth-user=${encodeURIComponent(JSON.stringify(this.currentUser))}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = `mock-session-token=mock-session-${Date.now()}; path=/; max-age=86400; SameSite=Strict`;
      }
      
      return this.currentUser;
    } else {
      throw new Error('Invalid credentials');
    }
  }
  
  async signUp(credentials: SignUpCredentials): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    // モックサインアップ成功
    console.log('Mock sign up successful for:', credentials.email);
  }
  
  async signOut(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock-auth-user');
      
      // Cookieも削除
      document.cookie = 'mock-auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'mock-session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
  
  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    // ローカルストレージからセッション復元
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock-auth-user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      }
      
      // Cookieからも復元を試行
      const cookies = document.cookie.split(';');
      const mockUserCookie = cookies.find(cookie => cookie.trim().startsWith('mock-auth-user='));
      if (mockUserCookie) {
        try {
          const cookieValue = mockUserCookie.split('=')[1];
          if (cookieValue) {
            const userData = JSON.parse(decodeURIComponent(cookieValue));
            this.currentUser = userData;
            return this.currentUser;
          }
        } catch (error) {
          console.error('Failed to parse mock user cookie:', error);
        }
      }
    }
    
    return null;
  }
  
  async resetPassword(credentials: ResetPasswordCredentials): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock password reset sent to:', credentials.email);
  }
}

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
  const mockAuth = MockAuthService.getInstance();
  // isMockModeを初期化時に固定して、動的な変更を防ぐ
  const [isInMockMode] = useState(() => isMockMode());
  
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
    
    // モックエラーの処理
    if (err.message === 'Invalid credentials') {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'デモ用認証情報: demo@example.com / password123',
        name: 'MockAuthError',
        recoverySuggestion: 'デモ用のメールアドレスとパスワードを使用してください'
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
    console.log('fetchUser called - isInMockMode:', isInMockMode);
    try {
      setLoading(true);
      setError(null);
      
      let currentUser: AuthUser | null = null;
      
      if (isInMockMode) {
        console.log('Using mock auth to get current user');
        currentUser = await mockAuth.getCurrentUser();
      } else {
        console.log('Using real Amplify to get current user');
        currentUser = await getCurrentUser();
      }
      
      console.log('fetchUser result:', currentUser ? 'User found' : 'No user');
      setUser(currentUser);
    } catch (err) {
      console.log('fetchUser error:', err);
      console.log('No authenticated user found');
      setUser(null);
    } finally {
      console.log('fetchUser finally - setting loading to false');
      setLoading(false);
    }
  }, [isInMockMode]); // mockAuthを依存配列から削除
  
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
      console.log('AuthProvider signIn started');
      setLoading(true);
      setError(null);
      
      if (isInMockMode) {
        console.log('Using mock auth service');
        const user = await mockAuth.signIn(credentials);
        console.log('Mock auth successful, user:', user);
        setUser(user);
        console.log('User state updated');
      } else {
        await amplifySignIn({
          username: credentials.email,
          password: credentials.password,
        });
        // Amplify Hub が自動的にユーザー状態を更新
      }
    } catch (err) {
      console.error('AuthProvider signIn error:', err);
      const authError = handleError(err);
      setError(authError);
      throw authError;
    } finally {
      console.log('AuthProvider signIn finally block - setting loading to false');
      setLoading(false);
    }
  }, [isInMockMode, mockAuth, handleError]);
  
  /**
   * サインアップ処理
   */
  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isInMockMode) {
        await mockAuth.signUp(credentials);
      } else {
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
      }
    } catch (err) {
      const authError = handleError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [isInMockMode, mockAuth, handleError]);
  
  /**
   * サインアウト処理
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isInMockMode) {
        await mockAuth.signOut();
        setUser(null);
      } else {
        await amplifySignOut();
        // Amplify Hub が自動的にユーザー状態を更新
      }
    } catch (err) {
      const authError = handleError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [isInMockMode, mockAuth, handleError]);
  
  /**
   * パスワードリセット処理
   */
  const resetPassword = useCallback(async (credentials: ResetPasswordCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isInMockMode) {
        await mockAuth.resetPassword(credentials);
      } else {
        // 実際のAmplify resetPassword実装
        // await amplifyResetPassword({ username: credentials.email });
        throw new Error('Password reset not implemented in this phase');
      }
    } catch (err) {
      const authError = handleError(err);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [isInMockMode, mockAuth, handleError]);
  
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
    // Amplify設定の初期化
    const config = getAmplifyConfig();
    Amplify.configure(config);
    
    // 初回ユーザー取得
    fetchUser();
    
    // Amplify Hub による認証イベント監視（実環境のみ）
    if (!isInMockMode) {
      const hubListener = Hub.listen('auth', ({ payload }) => {
        switch (payload.event) {
          case 'signedIn':
            console.log('User signed in');
            fetchUser();
            break;
          case 'signedOut':
            console.log('User signed out');
            setUser(null);
            break;
          case 'tokenRefresh':
            console.log('Token refreshed');
            break;
          case 'tokenRefresh_failure':
            console.log('Token refresh failed');
            setUser(null);
            break;
        }
      });
      
      return () => {
        hubListener();
      };
    }
    
    // モックモードの場合は何もしない
    return undefined;
  }, [isInMockMode]); // fetchUserを依存配列から削除して初回のみ実行
  
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
    isMockMode: isInMockMode,
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
    isInMockMode,
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