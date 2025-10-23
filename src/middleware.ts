/**
 * Next.js Middleware - 認証とルーティング制御
 * 
 * 目的: リクエストレベルでの認証チェックとルーティング制御
 * 設計理由: サーバーサイドでの効率的な認証ガードとリダイレクト
 * 
 * 主要機能:
 * - 保護されたルートへのアクセス制御
 * - 認証状態に基づくリダイレクト
 * - 静的ファイルとAPIルートの除外
 * - セッション有効性の事前チェック
 * 
 * 学習ポイント:
 * - Next.js 15 Middleware の実装パターン
 * - Cookie ベースの認証チェック
 * - パフォーマンスを考慮したルーティング
 * - セキュリティを考慮したアクセス制御
 * 
 * 使用例:
 * ```typescript
 * // 自動的に全リクエストで実行される
 * // 設定は config.matcher で制御
 * ```
 * 
 * 関連: src/lib/auth/server-actions.ts, src/app/(auth)/layout.tsx
 */

import { NextRequest, NextResponse } from 'next/server';
import { isMockMode } from '@/lib/amplify/config';

/**
 * 保護されたルートのパターン
 * 
 * 学習ポイント:
 * - 正規表現によるパスマッチング
 * - 階層的なルート保護
 * - 柔軟なパターン定義
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/chat',
  '/agents',
  '/settings',
  '/profile',
];

/**
 * 認証ページのパターン
 * 
 * 学習ポイント:
 * - 認証済みユーザーのリダイレクト対象
 * - ログインループの防止
 */
const AUTH_ROUTES = [
  '/signin',
  '/signup',
  '/forgot-password',
];

/**
 * 除外するパスのパターン
 * 
 * 学習ポイント:
 * - 静的ファイルの除外
 * - APIルートの除外
 * - パフォーマンス最適化
 */
const EXCLUDED_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * パスが保護されたルートかどうかをチェック
 * 
 * 学習ポイント:
 * - 配列の some メソッドによる効率的なチェック
 * - startsWith による前方一致
 * - パフォーマンスを考慮した実装
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * パスが認証ページかどうかをチェック
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * パスが除外対象かどうかをチェック
 */
function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some(path => pathname.startsWith(path));
}

/**
 * モック認証の状態をチェック
 * 
 * 学習ポイント:
 * - Cookie からの認証情報取得
 * - モックモード固有の処理
 * - エラーハンドリング
 */
function checkMockAuth(request: NextRequest): boolean {
  try {
    const mockUserCookie = request.cookies.get('mock-auth-user');
    const mockSessionCookie = request.cookies.get('mock-session-token');
    
    return !!(mockUserCookie && mockSessionCookie);
  } catch (error) {
    console.error('Failed to check mock auth:', error);
    return false;
  }
}

/**
 * 実環境での認証状態をチェック
 * 
 * 学習ポイント:
 * - Amplify関連のCookieチェック
 * - 複数のトークンの検証
 * - フォールバック処理
 */
function checkRealAuth(request: NextRequest): boolean {
  try {
    // Amplify関連のCookieをチェック
    const cognitoCookies: string[] = [];
    for (const [name] of request.cookies) {
      if (name.includes('CognitoIdentityServiceProvider')) {
        cognitoCookies.push(name);
      }
    }
    
    // 基本的な存在チェック（実際の検証はサーバーアクションで行う）
    return cognitoCookies.length > 0;
  } catch (error) {
    console.error('Failed to check real auth:', error);
    return false;
  }
}

/**
 * 認証状態をチェック
 * 
 * 学習ポイント:
 * - 環境に応じた認証チェックの切り替え
 * - パフォーマンスを考慮した軽量チェック
 * - エラー時のフォールバック
 */
function isAuthenticated(request: NextRequest): boolean {
  try {
    if (isMockMode()) {
      return checkMockAuth(request);
    } else {
      return checkRealAuth(request);
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

/**
 * リダイレクトレスポンスを作成
 * 
 * 学習ポイント:
 * - NextResponse.redirect の使用方法
 * - 絶対URLの構築
 * - リダイレクト先の動的決定
 */
function createRedirectResponse(request: NextRequest, destination: string): NextResponse {
  const url = new URL(destination, request.url);
  
  // 元のURLをクエリパラメータとして保存（認証後のリダイレクト用）
  if (destination === '/signin' && !isAuthRoute(request.nextUrl.pathname)) {
    url.searchParams.set('redirect', request.nextUrl.pathname);
  }
  
  return NextResponse.redirect(url);
}

/**
 * メインのミドルウェア関数
 * 
 * 設計理由:
 * - リクエストレベルでの効率的な認証チェック
 * - 不要なサーバー処理の削減
 * - ユーザー体験の向上
 * 
 * 学習ポイント:
 * - Next.js Middleware の基本構造
 * - 条件分岐による処理の最適化
 * - レスポンスの適切な返却
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 除外パスの場合は何もしない
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }
  
  // ルートパスの場合は適切にリダイレクト
  if (pathname === '/') {
    const authenticated = isAuthenticated(request);
    
    if (authenticated) {
      return createRedirectResponse(request, '/dashboard');
    } else {
      return createRedirectResponse(request, '/signin');
    }
  }
  
  const authenticated = isAuthenticated(request);
  
  // 保護されたルートへのアクセス
  if (isProtectedRoute(pathname)) {
    if (!authenticated) {
      console.log(`Redirecting unauthenticated user from ${pathname} to /signin`);
      return createRedirectResponse(request, '/signin');
    }
    
    // 認証済みの場合はそのまま通す
    return NextResponse.next();
  }
  
  // 認証ページへのアクセス
  if (isAuthRoute(pathname)) {
    if (authenticated) {
      console.log(`Redirecting authenticated user from ${pathname} to /dashboard`);
      return createRedirectResponse(request, '/dashboard');
    }
    
    // 未認証の場合はそのまま通す
    return NextResponse.next();
  }
  
  // その他のパスはそのまま通す
  return NextResponse.next();
}

/**
 * ミドルウェアの設定
 * 
 * 学習ポイント:
 * - matcher による対象パスの制御
 * - パフォーマンス最適化のための除外設定
 * - 正規表現による柔軟なマッチング
 */
export const config = {
  matcher: [
    /*
     * 以下のパスを除く全てのパスでミドルウェアを実行:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public フォルダ内のファイル
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)',
  ],
};