/**
 * ProtectedRoute Component - 認証ガードとルート保護
 * 
 * 目的: 認証が必要なページへのアクセス制御を提供
 * 設計理由: 認証状態に基づく条件付きレンダリングとリダイレクト
 * 
 * 主要機能:
 * - 認証状態の確認と未認証時のリダイレクト
 * - ローディング状態の適切な表示
 * - 認証完了後の自動リダイレクト
 * - エラー状態のハンドリング
 * 
 * 学習ポイント:
 * - React の条件付きレンダリング
 * - Next.js 15 でのクライアントサイドナビゲーション
 * - 認証フローのUXパターン
 * - ローディング状態の管理
 * 
 * 使用例:
 * ```typescript
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute fallback={<CustomSignIn />} redirectTo="/custom-login">
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 * 
 * 関連: src/components/auth/AuthProvider.tsx, src/app/(auth)/layout.tsx
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { SignInForm } from './SignInForm';

/**
 * ProtectedRouteコンポーネントのProps型定義
 */
export interface ProtectedRouteProps {
  /** 保護されたコンテンツ */
  children: React.ReactNode;
  /** 未認証時に表示するフォールバックコンポーネント */
  fallback?: React.ReactNode;
  /** 未認証時のリダイレクト先（fallbackより優先） */
  redirectTo?: string;
  /** ローディング時に表示するコンポーネント */
  loadingComponent?: React.ReactNode;
  /** 認証完了後のリダイレクト先 */
  redirectAfterAuth?: string;
  /** 追加のCSS クラス */
  className?: string;
}

/**
 * デフォルトローディングコンポーネント
 * 
 * 学習ポイント:
 * - スケルトンローディングの実装
 * - アクセシビリティ対応（aria-label）
 * - アニメーションによる視覚的フィードバック
 */
const DefaultLoadingComponent: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      {/* ローディングスピナー */}
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      
      {/* ローディングテキスト */}
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground">認証状態を確認中...</p>
        <p className="text-sm text-muted-foreground">しばらくお待ちください</p>
      </div>
      
      {/* スケルトンローディング */}
      <div className="space-y-3 max-w-md mx-auto">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  </div>
);

/**
 * デフォルト認証フォームコンポーネント
 * 
 * 学習ポイント:
 * - 認証フォームの統合
 * - 成功時のリダイレクト処理
 * - レスポンシブレイアウト
 */
const DefaultAuthComponent: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="w-full max-w-md">
      <SignInForm onSuccess={onSuccess} />
    </div>
  </div>
);

/**
 * ProtectedRouteコンポーネント
 * 
 * 設計理由:
 * - 認証状態に基づく条件付きレンダリング
 * - 柔軟なフォールバック機能
 * - ユーザーフレンドリーなローディング体験
 * 
 * 学習ポイント:
 * - useAuth フックとの連携
 * - Next.js useRouter の使用
 * - 条件付きレンダリングのパターン
 * - エラーハンドリングの実装
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo,
  loadingComponent,
  redirectAfterAuth = '/',
  className,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  /**
   * 認証成功時のハンドラー
   * 
   * 学習ポイント:
   * - プログラマティックナビゲーション
   * - リダイレクト先の動的決定
   * - エラーハンドリング
   */
  const handleAuthSuccess = React.useCallback(() => {
    try {
      // 認証完了後のリダイレクト
      router.push(redirectAfterAuth);
    } catch (error) {
      console.error('Navigation error:', error);
      // フォールバック: ページリロード
      window.location.href = redirectAfterAuth;
    }
  }, [router, redirectAfterAuth]);
  
  /**
   * 未認証時のリダイレクト処理
   * 
   * 学習ポイント:
   * - useEffect による副作用の管理
   * - 条件付きリダイレクト
   * - 無限ループの防止
   */
  React.useEffect(() => {
    if (!loading && !isAuthenticated && redirectTo) {
      try {
        router.push(redirectTo);
      } catch (error) {
        console.error('Redirect error:', error);
        // フォールバック: ページリロード
        window.location.href = redirectTo;
      }
    }
  }, [loading, isAuthenticated, redirectTo, router]);
  
  // ローディング状態の表示
  if (loading) {
    return (
      <div className={className}>
        {loadingComponent || <DefaultLoadingComponent />}
      </div>
    );
  }
  
  // 未認証時の処理
  if (!isAuthenticated) {
    // リダイレクト指定がある場合は何も表示しない（リダイレクト中）
    if (redirectTo) {
      return (
        <div className={className}>
          <DefaultLoadingComponent />
        </div>
      );
    }
    
    // フォールバックコンポーネントまたはデフォルト認証フォームを表示
    return (
      <div className={className}>
        {fallback || <DefaultAuthComponent onSuccess={handleAuthSuccess} />}
      </div>
    );
  }
  
  // 認証済み: 保護されたコンテンツを表示
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * 認証が必要なページ用のHOC（Higher-Order Component）
 * 
 * 学習ポイント:
 * - HOC パターンの実装
 * - TypeScript での高階関数の型定義
 * - コンポーネントの合成
 * 
 * 使用例:
 * ```typescript
 * const ProtectedDashboard = withAuth(Dashboard);
 * 
 * const ProtectedAdminPanel = withAuth(AdminPanel, {
 *   redirectTo: '/admin-login',
 *   redirectAfterAuth: '/admin'
 * });
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  const WrappedComponent: React.FC<P> = (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
  
  // デバッグ用の表示名設定
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * 認証状態チェック用のカスタムフック
 * 
 * 学習ポイント:
 * - カスタムフックによる状態管理の抽象化
 * - 認証状態の詳細な情報提供
 * - パフォーマンス最適化
 * 
 * 使用例:
 * ```typescript
 * const { isAuthenticated, isLoading, user, canAccess } = useAuthGuard();
 * 
 * if (isLoading) return <Loading />;
 * if (!canAccess) return <Unauthorized />;
 * return <ProtectedContent />;
 * ```
 */
export const useAuthGuard = () => {
  const { user, loading, isAuthenticated, error } = useAuth();

  return React.useMemo(() => ({
    isAuthenticated,
    isLoading: loading,
    user,
    error,
    canAccess: isAuthenticated && !loading,
    needsAuth: !isAuthenticated && !loading,
  }), [isAuthenticated, loading, user, error]);
};