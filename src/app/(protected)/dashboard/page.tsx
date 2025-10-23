/**
 * Dashboard Page - ダッシュボードページ
 * 
 * 目的: 認証後のメインダッシュボードを提供
 * 設計理由: 保護されたルートの実装例とユーザー情報表示
 * 
 * 主要機能:
 * - 認証済みユーザーの情報表示
 * - サインアウト機能
 * - MAGIシステムの概要表示
 * - 各機能へのナビゲーション
 * 
 * 学習ポイント:
 * - 保護されたページの実装パターン
 * - useAuth フックの活用
 * - サーバーアクションとの連携
 * - ユーザーフレンドリーなダッシュボードデザイン
 * 
 * 関連: src/components/auth/ProtectedRoute.tsx, src/lib/auth/server-actions.ts
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOutAction } from '@/lib/auth/server-actions';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

/**
 * DashboardPageコンポーネント
 * 
 * 設計理由:
 * - 認証済みユーザー向けのメインインターフェース
 * - MAGIシステムの機能紹介
 * - 直感的なナビゲーション
 * 
 * 学習ポイント:
 * - 'use client' ディレクティブの使用
 * - 認証状態の活用
 * - サーバーアクションの呼び出し
 * - レスポンシブデザインの実装
 */
export default function DashboardPage() {
  const { user, signOut, isMockMode } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  
  /**
   * サインアウト処理
   * 
   * 学習ポイント:
   * - サーバーアクションとクライアントサイドの連携
   * - エラーハンドリング
   * - ローディング状態の管理
   */
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // サーバーサイドでのサインアウト
      const result = await signOutAction();
      
      if (result.success) {
        // クライアントサイドでのサインアウト
        await signOut();
        
        // サインインページにリダイレクト
        router.push('/signin');
      } else {
        console.error('Server sign out failed:', result.error);
        // クライアントサイドのサインアウトは実行
        await signOut();
        router.push('/signin');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // エラーが発生してもサインアウトを実行
      try {
        await signOut();
        router.push('/signin');
      } catch (fallbackError) {
        console.error('Fallback sign out failed:', fallbackError);
        // 最終手段: ページリロード
        window.location.href = '/signin';
      }
    } finally {
      setIsSigningOut(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* ロゴとタイトル */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-magi-caspar-500 via-magi-balthasar-500 to-magi-melchior-500 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">M</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                MAGI Decision System
              </h1>
            </div>
            
            {/* ユーザー情報とサインアウト */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm text-muted-foreground">
                  {isMockMode && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-2">DEMO</span>}
                  {user.username}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                loading={isSigningOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'サインアウト中...' : 'サインアウト'}
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ウェルカムセクション */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            ダッシュボード
          </h2>
          <p className="text-lg text-muted-foreground">
            MAGIシステムへようこそ。3賢者による多視点分析で最適な意思決定をサポートします。
          </p>
        </div>
        
        {/* 機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* チャット機能 */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-4 h-4 bg-magi-solomon-500 rounded" />
                チャット
              </CardTitle>
              <CardDescription>
                3賢者に質問して多視点の回答を得る
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                CASPAR、BALTHASAR、MELCHIORの3賢者とSOLOMON Judgeによる包括的な分析
              </p>
              <Button variant="outline" size="sm" disabled>
                近日公開
              </Button>
            </CardContent>
          </Card>
          
          {/* エージェント設定 */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-4 h-4 bg-magi-caspar-500 rounded" />
                エージェント設定
              </CardTitle>
              <CardDescription>
                3賢者の性格と動作をカスタマイズ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                各エージェントのプロンプト、モデル、パラメータを調整
              </p>
              <Button variant="outline" size="sm" disabled>
                近日公開
              </Button>
            </CardContent>
          </Card>
          
          {/* 推論トレース */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-4 h-4 bg-magi-melchior-500 rounded" />
                推論トレース
              </CardTitle>
              <CardDescription>
                エージェントの思考過程を可視化
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                リアルタイムでエージェントの推論ステップを追跡
              </p>
              <Button variant="outline" size="sm" disabled>
                近日公開
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* システム情報 */}
        <Card>
          <CardHeader>
            <CardTitle>システム情報</CardTitle>
            <CardDescription>
              現在の環境とステータス
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">環境</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">モード:</span>
                    <span className={`font-medium ${isMockMode ? 'text-yellow-600' : 'text-green-600'}`}>
                      {isMockMode ? 'デモモード' : '本番モード'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ユーザーID:</span>
                    <span className="font-mono text-xs">{user?.userId}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">実装状況</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">認証システム:</span>
                    <span className="text-green-600 font-medium">✓ 完了</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">チャット機能:</span>
                    <span className="text-yellow-600 font-medium">⏳ 開発中</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">エージェント連携:</span>
                    <span className="text-yellow-600 font-medium">⏳ 開発中</span>
                  </div>
                </div>
              </div>
            </div>
            
            {isMockMode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>デモモード:</strong> 現在はモックデータを使用しています。
                  実際のAWS接続は今後のPhaseで実装予定です。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}