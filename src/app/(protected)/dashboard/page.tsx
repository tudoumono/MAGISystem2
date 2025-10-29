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
// import { signOutAction } from '@/lib/auth/server-actions';
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
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);
  
  /**
   * サインアウト処理
   * 
   * 学習ポイント:
   * - クライアントサイドでのサインアウト
   * - エラーハンドリング
   * - ローディング状態の管理
   */
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // クライアントサイドでのサインアウト
      await signOut();
      
      // サインインページにリダイレクト
      router.push('/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      // 最終手段: ページリロード
      window.location.href = '/signin';
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
            
            {/* ユーザー情報とアクション */}
            <div className="flex items-center gap-4">
              {/* デバッグモード切り替え */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showDebugPanel ? '🔧 デバッグOFF' : '🔧 デバッグON'}
              </Button>
              
              {user && (
                <div className="text-sm text-muted-foreground">
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
        
        {/* デバッグパネル */}
        {showDebugPanel && (
          <div className="mb-8">
            <Card className="border-blue-500 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <span className="text-xl">🔧</span>
                  デバッグ & テストツール
                </CardTitle>
                <CardDescription className="text-blue-700">
                  開発者向けのテストページとデバッグツールへのクイックアクセス
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* UI基本機能 */}
                  <button
                    onClick={() => router.push('/test')}
                    className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎨</span>
                      <span className="font-medium text-sm text-blue-900">UI基本機能</span>
                    </div>
                    <p className="text-xs text-blue-700">会話UI、メッセージ表示</p>
                  </button>
                  
                  {/* データ統合 */}
                  <button
                    onClick={() => router.push('/test/data')}
                    className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">💾</span>
                      <span className="font-medium text-sm text-blue-900">データ統合</span>
                    </div>
                    <p className="text-xs text-blue-700">Amplify Data, GraphQL</p>
                  </button>
                  
                  {/* エージェント統合 */}
                  <button
                    onClick={() => router.push('/test/agents')}
                    className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🤖</span>
                      <span className="font-medium text-sm text-blue-900">エージェント</span>
                    </div>
                    <p className="text-xs text-blue-700">MAGI 3賢者テスト</p>
                  </button>
                  
                  {/* 統合テスト */}
                  <button
                    onClick={() => router.push('/test/integration')}
                    className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🔗</span>
                      <span className="font-medium text-sm text-blue-900">統合テスト</span>
                    </div>
                    <p className="text-xs text-blue-700">ストリーミング、トレース</p>
                  </button>
                  
                  {/* MAGIストリーム */}
                  <button
                    onClick={() => router.push('/test/integration/magi-stream')}
                    className="p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🌊</span>
                      <span className="font-medium text-sm text-green-900">MAGIストリーム</span>
                    </div>
                    <p className="text-xs text-green-700">リアルタイム実行テスト</p>
                  </button>
                  
                  {/* MAGIトレース */}
                  <button
                    onClick={() => router.push('/test/integration/magi-trace')}
                    className="p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🔍</span>
                      <span className="font-medium text-sm text-purple-900">MAGIトレース</span>
                    </div>
                    <p className="text-xs text-purple-700">推論過程の可視化</p>
                  </button>
                  
                  {/* 本番環境テスト */}
                  <button
                    onClick={() => router.push('/test/integration/magi-production')}
                    className="p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🚀</span>
                      <span className="font-medium text-sm text-orange-900">本番環境</span>
                    </div>
                    <p className="text-xs text-orange-700">Production統合テスト</p>
                  </button>
                  
                  {/* HTMLテストページ */}
                  <button
                    onClick={() => window.open('/tests/fixtures/test-stream.html', '_blank')}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📄</span>
                      <span className="font-medium text-sm text-gray-900">HTMLテスト</span>
                    </div>
                    <p className="text-xs text-gray-700">スタンドアロンテスト</p>
                  </button>
                </div>
                
                {/* クイックアクション */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">クイックアクション:</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('http://localhost:3000/api/health', '_blank')}
                        className="text-xs"
                      >
                        API Health Check
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Environment:', process.env.NODE_ENV);
                          console.log('User:', user);
                          alert('コンソールを確認してください');
                        }}
                        className="text-xs"
                      >
                        環境情報を表示
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* テスト環境セクション（簡易版） */}
        {!showDebugPanel && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                🧪 テスト環境
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugPanel(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                すべてのテストツールを表示 →
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* UI基本機能テスト */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">🎨</span>
                    UI基本機能
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    会話UI、メッセージ表示の基本機能テスト
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/test')}
                    className="w-full"
                  >
                    テストページへ
                  </Button>
                </CardContent>
              </Card>
              
              {/* データ統合テスト */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">💾</span>
                    データ統合
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Amplify Data、GraphQL APIの動作確認
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/test/data')}
                    className="w-full"
                  >
                    テストページへ
                  </Button>
                </CardContent>
              </Card>
              
              {/* エージェント統合テスト */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    エージェント統合
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    MAGI 3賢者エージェントの動作確認
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/test/agents')}
                    className="w-full"
                  >
                    テストページへ
                  </Button>
                </CardContent>
              </Card>
              
              {/* 統合テスト */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">🔗</span>
                    統合テスト
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    ストリーミング、トレース、本番環境テスト
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/test/integration')}
                    className="w-full"
                  >
                    テストページへ
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}