/**
 * SignInPageClient Component - サインインページのクライアントコンポーネント
 * 
 * 目的: サインインフォームのクライアントサイド処理を担当
 * 設計理由: サーバーコンポーネントとクライアントコンポーネントの分離
 * 
 * 主要機能:
 * - SignInFormの表示と制御
 * - 認証成功後のナビゲーション
 * - エラーメッセージとインフォメッセージの表示
 * - リダイレクト処理
 * 
 * 学習ポイント:
 * - 'use client' ディレクティブの使用
 * - useRouter による プログラマティックナビゲーション
 * - 認証フローの実装パターン
 * - エラーハンドリングとユーザーフィードバック
 * 
 * 関連: src/app/(auth)/signin/page.tsx, src/components/auth/SignInForm.tsx
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/auth/SignInForm';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * SignInPageClientコンポーネントのProps型定義
 */
export interface SignInPageClientProps {
  /** 認証成功後のリダイレクト先 */
  redirectTo: string;
  /** エラーメッセージ */
  errorMessage?: string | undefined;
  /** インフォメッセージ */
  infoMessage?: string | undefined;
}

/**
 * SignInPageClientコンポーネント
 * 
 * 設計理由:
 * - クライアントサイドの状態管理とナビゲーション
 * - 認証状態の監視とリダイレクト
 * - ユーザーフレンドリーなメッセージ表示
 * 
 * 学習ポイント:
 * - useAuth フックとの連携
 * - useRouter による SPA ナビゲーション
 * - useEffect による副作用の管理
 * - 条件付きレンダリング
 */
export function SignInPageClient({ 
  redirectTo, 
  errorMessage, 
  infoMessage 
}: SignInPageClientProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  
  // デバッグ: redirectToの値を確認
  React.useEffect(() => {
    console.log('SignInPageClient initialized with redirectTo:', redirectTo);
  }, [redirectTo]);
  
  /**
   * 認証状態の監視（リダイレクトは一時的に無効化）
   */
  React.useEffect(() => {
    console.log('SignInPageClient - loading:', loading, 'isAuthenticated:', isAuthenticated);
    console.log('SignInPageClient - redirectTo:', redirectTo);
    
    // 一時的にリダイレクトを無効化してループを防ぐ
    // if (isAuthenticated && !loading) {
    //   const targetUrl = redirectTo === '/' ? '/dashboard' : redirectTo;
    //   console.log('User authenticated, redirecting to:', targetUrl);
    //   router.replace(targetUrl);
    // }
  }, [isAuthenticated, loading, redirectTo, router]);
  
  /**
   * サインイン成功時のハンドラー
   */
  const handleSignInSuccess = React.useCallback(() => {
    console.log('SignInPageClient: handleSignInSuccess called');
    
    const targetUrl = redirectTo === '/' ? '/dashboard' : redirectTo;
    console.log('SignInPageClient: Executing redirect to:', targetUrl);
    
    // 確実なリダイレクト実行
    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  }, [redirectTo]);
  
  // 認証済み時のリダイレクト処理（Hooks順序を保つため、条件分岐の外で定義）
  React.useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to dashboard');
      const targetUrl = redirectTo === '/' ? '/dashboard' : redirectTo;
      console.log('Executing redirect to:', targetUrl);
      window.location.href = targetUrl;
    }
  }, [isAuthenticated, redirectTo]);
  
  // 認証済みの場合はローディング画面を表示
  if (isAuthenticated) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">ダッシュボードにリダイレクト中...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* エラーメッセージの表示 */}
      {errorMessage && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">エラー</span>
          </div>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}
      
      {/* インフォメッセージの表示 */}
      {infoMessage && (
        <div className="p-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">お知らせ</span>
          </div>
          <p className="mt-1">{infoMessage}</p>
        </div>
      )}
      
      {/* サインインフォーム */}
      <SignInForm
        onSuccess={handleSignInSuccess}
        showSignUpLink={true}
        showForgotPasswordLink={true}
      />
      
      {/* 追加情報 */}
      <div className="text-center text-xs text-muted-foreground space-y-2">
        <p>
          このシステムはエヴァンゲリオンのMAGIシステムにインスパイアされた
          <br />
          多エージェント意思決定システムです
        </p>
        
        {redirectTo !== '/dashboard' && (
          <p>
            認証後、<span className="font-medium">{redirectTo}</span> にリダイレクトします
          </p>
        )}
      </div>
    </div>
  );
}