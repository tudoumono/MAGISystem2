/**
 * Sign In Page - サインインページ
 * 
 * 目的: ユーザー認証のためのサインインインターフェースを提供
 * 設計理由: SSR対応の認証ページとリダイレクト処理
 * 
 * 主要機能:
 * - SignInFormコンポーネントの表示
 * - 認証成功後のリダイレクト処理
 * - クエリパラメータによるリダイレクト先制御
 * - SEO最適化とメタデータ設定
 * 
 * 学習ポイント:
 * - Next.js 15 App Router のページコンポーネント
 * - サーバーコンポーネントとクライアントコンポーネントの連携
 * - 認証フローのUXパターン
 * - メタデータAPIの使用
 * 
 * 使用例:
 * ```
 * /signin - 通常のサインイン
 * /signin?redirect=/dashboard - 認証後に/dashboardにリダイレクト
 * ```
 * 
 * 関連: src/components/auth/SignInForm.tsx, src/middleware.ts
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { SignInPageClient } from '@/app/(auth)/signin/SignInPageClient';

/**
 * ページのメタデータ設定
 * 
 * 学習ポイント:
 * - Next.js 15 Metadata API の使用
 * - SEO最適化のための設定
 * - 認証ページ固有のメタデータ
 */
export const metadata: Metadata = {
  title: 'サインイン',
  description: 'MAGIシステムにサインインしてください',
  robots: {
    index: false, // 認証ページは検索エンジンにインデックスしない
    follow: false,
  },
};

/**
 * サインインページのProps型定義
 * 
 * 学習ポイント:
 * - Next.js App Router のページProps
 * - searchParams による動的パラメータ取得
 * - 型安全なパラメータ処理
 */
interface SignInPageProps {
  searchParams: Promise<{
    redirect?: string;
    error?: string;
    message?: string;
  }>;
}

/**
 * ローディングコンポーネント
 * 
 * 学習ポイント:
 * - Suspense フォールバックの実装
 * - スケルトンローディングのパターン
 * - アクセシビリティ対応
 */
function SignInPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* カードのスケルトン */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
          {/* ヘッダーのスケルトン */}
          <div className="space-y-2 text-center">
            <div className="h-8 bg-muted rounded animate-pulse mx-auto w-32" />
            <div className="h-4 bg-muted rounded animate-pulse mx-auto w-48" />
          </div>
          
          {/* フォームのスケルトン */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-24" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-20" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * サインインページコンポーネント（サーバーコンポーネント）
 * 
 * 設計理由:
 * - サーバーサイドでのパラメータ処理
 * - クライアントコンポーネントへの適切な props 渡し
 * - Suspense による段階的ローディング
 * 
 * 学習ポイント:
 * - Server Component の実装パターン
 * - searchParams の処理方法
 * - クライアントコンポーネントとの連携
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  // searchParams を await する
  const params = await searchParams;
  
  // リダイレクト先の検証とサニタイズ
  const redirectTo = params.redirect && 
    params.redirect.startsWith('/') && 
    !params.redirect.startsWith('//') 
      ? params.redirect 
      : '/dashboard';
  
  // エラーメッセージの処理
  const errorMessage = params.error;
  const infoMessage = params.message;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<SignInPageLoading />}>
          <SignInPageClient
            redirectTo={redirectTo}
            errorMessage={errorMessage}
            infoMessage={infoMessage}
          />
        </Suspense>
      </div>
    </div>
  );
}