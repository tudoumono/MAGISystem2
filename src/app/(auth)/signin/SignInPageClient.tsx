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
   * 認証状態の監視（条件付き自動リダイレクト）
   */
  React.useEffect(() => {
    console.log('SignInPageClient - loading:', loading, 'isAuthenticated:', isAuthenticated);
    console.log('SignInPageClient - redirectTo:', redirectTo);
    
    // ローディング中は何もしない
    if (loading) {
      console.log('Still loading, skipping redirect logic');
      return;
    }
    
    // 認証済みの場合、少し遅延してからリダイレクト
    if (isAuthenticated) {
      const targetUrl = redirectTo === '/' ? '/dashboard' : redirectTo;
      console.log('User authenticated, will redirect to:', targetUrl);
      
      // 3秒後に自動リダイレクト（手動ボタンも利用可能）
      const redirectTimer = setTimeout(() => {
        console.log('Auto-redirecting to:', targetUrl);
        try {
          router.push(targetUrl);
        } catch (error) {
          console.warn('Router push failed, using window.location:', error);
          window.location.href = targetUrl;
        }
      }, 3000);
      
      // クリーンアップ
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, loading, redirectTo, router]);
  
  /**
   * サインイン成功時のハンドラー（自動リダイレクト無効化）
   */
  const handleSignInSuccess = React.useCallback(() => {
    console.log('SignInPageClient: handleSignInSuccess called - auto-redirect disabled');
    // 自動リダイレクトは無効化 - 手動ボタンでのみ移動可能
  }, []);
  
  // 認証済みかつローディング完了の場合は成功画面を表示
  if (isAuthenticated && !loading) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">認証成功</h2>
        <p className="text-sm text-muted-foreground">サインインが完了しました</p>
        <div className="text-xs text-muted-foreground mt-4 space-y-1">
          <p>認証状態: ✅ 認証済み</p>
          <p>リダイレクト先: {redirectTo}</p>
          <p>ローディング: {loading ? '⏳ 確認中' : '✅ 完了'}</p>
          <p className="text-blue-600">ℹ️ 手動でダッシュボードに移動してください</p>
          <p className="text-gray-500">開発環境: 認証トークンはLocalStorageに保存されています</p>
        </div>
        {/* 手動リダイレクトボタン */}
        <button
          onClick={() => {
            const targetUrl = redirectTo === '/' ? '/dashboard' : redirectTo;
            console.log('Manual redirect to:', targetUrl);
            console.log('Current auth state - isAuthenticated:', isAuthenticated, 'loading:', loading);
            
            if (isAuthenticated && !loading) {
              console.log('User is authenticated, proceeding with redirect');
              try {
                router.push(targetUrl);
              } catch (error) {
                console.warn('Router push failed, using window.location:', error);
                window.location.href = targetUrl;
              }
            } else if (loading) {
              console.log('Still loading authentication state, please wait');
              alert('認証状態を確認中です。しばらくお待ちください。');
            } else {
              console.warn('User not authenticated');
              alert('認証されていません。サインインしてください。');
            }
          }}
          className="mt-4 px-6 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
        >
          ダッシュボードに移動
        </button>
      </div>
    );
  }
  
  // ローディング中の場合
  if (loading) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-transparent" />
        <p className="text-sm text-muted-foreground">認証状態を確認中...</p>
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