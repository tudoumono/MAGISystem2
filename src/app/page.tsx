/**
 * Home Page - ホームページ（リダイレクト処理）
 * 
 * 目的: ルートパスへのアクセス時の適切なリダイレクト処理
 * 設計理由: 認証状態に応じた自動リダイレクトによるUX向上
 * 
 * 主要機能:
 * - 認証状態の確認
 * - 認証済みユーザーのダッシュボードリダイレクト
 * - 未認証ユーザーのサインインページリダイレクト
 * - ローディング状態の表示
 * 
 * 学習ポイント:
 * - Next.js 15 でのクライアントサイドリダイレクト
 * - 認証状態に基づく条件分岐
 * - ユーザーフレンドリーなローディング表示
 * - middleware との連携
 * 
 * 注意: middleware でも同様の処理を行っているため、
 * このページは主にフォールバック用途
 * 
 * 関連: src/middleware.ts, src/components/auth/AuthProvider.tsx
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * ローディングコンポーネント
 * 
 * 学習ポイント:
 * - スケルトンローディングの実装
 * - アニメーションによる視覚的フィードバック
 * - アクセシビリティ対応
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        {/* ロゴ */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-magi-caspar-500 via-magi-balthasar-500 to-magi-melchior-500 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-xl font-bold text-white">M</span>
        </div>
        
        {/* ローディングスピナー */}
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        
        {/* ローディングテキスト */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">MAGI Decision System</h1>
          <p className="text-sm text-muted-foreground">システムを初期化中...</p>
        </div>
        
        {/* プログレスバー風のアニメーション */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * HomePageコンポーネント
 * 
 * 設計理由:
 * - 認証状態に基づく自動リダイレクト
 * - middleware のフォールバック機能
 * - ユーザーフレンドリーなローディング体験
 * 
 * 学習ポイント:
 * - useAuth フックとの連携
 * - useRouter による プログラマティックナビゲーション
 * - useEffect による副作用の管理
 * - 条件付きレンダリング
 */
export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  /**
   * 認証状態に基づくリダイレクト処理
   * 
   * 学習ポイント:
   * - useEffect による認証状態の監視
   * - 条件付きリダイレクト
   * - エラーハンドリング
   */
  useEffect(() => {
    // ローディング中は何もしない
    if (loading) {
      return;
    }
    
    // 認証状態に応じてリダイレクト
    if (isAuthenticated) {
      console.log('User authenticated, redirecting to dashboard');
      router.replace('/dashboard');
    } else {
      console.log('User not authenticated, redirecting to signin');
      router.replace('/signin');
    }
  }, [isAuthenticated, loading, router]);
  
  // ローディング画面を表示
  return <LoadingScreen />;
}