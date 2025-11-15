/**
 * Admin Test Dashboard - 管理者専用テストダッシュボード
 *
 * 目的: 開発・デバッグ用の統合テストダッシュボード
 * アクセス制限: 環境変数 NEXT_PUBLIC_ENABLE_TEST_PAGES=true でのみアクセス可能
 *
 * 主要機能:
 * - システム診断
 * - データモデルテスト
 * - 統合テスト
 * - API Health Check
 *
 * 使用方法:
 * 1. .env.local に NEXT_PUBLIC_ENABLE_TEST_PAGES=true を追加
 * 2. /admin/test にアクセス
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageTransition } from '@/components/layout/PageTransition';
import { AlertCircle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function AdminTestDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // アクセス制御チェック
  useEffect(() => {
    const checkAccess = () => {
      // 環境変数でテストページが有効化されているかチェック
      const enableTestPages = process.env.NEXT_PUBLIC_ENABLE_TEST_PAGES === 'true';

      if (!enableTestPages) {
        // テストページが無効の場合、ダッシュボードにリダイレクト
        router.push('/dashboard');
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-transparent" />
          <p className="text-sm text-muted-foreground">アクセス権限を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // リダイレクト中
  }

  return (
    <PageTransition variant="fade" duration={0.4}>
      <div className="min-h-screen bg-background">
        {/* ヘッダー */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ダッシュボードに戻る
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                  🔧 開発モード
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 警告メッセージ */}
          <Card className="mb-8 border-amber-500 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    管理者専用テストダッシュボード
                  </h3>
                  <p className="text-sm text-amber-800 mb-2">
                    このページは開発・デバッグ用です。本番環境では環境変数を設定して無効化してください。
                  </p>
                  <p className="text-xs text-amber-700 font-mono bg-amber-100 p-2 rounded">
                    NEXT_PUBLIC_ENABLE_TEST_PAGES=false (本番環境推奨)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* タイトル */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              テストダッシュボード
            </h1>
            <p className="text-lg text-muted-foreground">
              システム診断・統合テスト・API確認
            </p>
          </div>

          {/* テストカテゴリ */}
          <div className="space-y-8">
            {/* システム診断 */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                📊 システム診断
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TestCard
                  title="API Health Check"
                  description="AgentCore Runtime /ping エンドポイントの動作状態を確認"
                  icon="💚"
                  status="available"
                  onClick={() => {
                    const backendUrl = process.env.NEXT_PUBLIC_AGENTCORE_URL || 'http://localhost:8080';
                    window.open(`${backendUrl}/ping`, '_blank');
                  }}
                />

                <TestCard
                  title="環境変数確認"
                  description="現在の環境設定を表示"
                  icon="⚙️"
                  status="planned"
                  disabled
                />
              </div>
            </section>

            {/* データテスト */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                🗄️ データ・モデルテスト
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TestCard
                  title="Amplify接続テスト"
                  description="Amplify Data、Cognito、AppSyncとの接続状態"
                  icon="📡"
                  status="planned"
                  disabled
                />

                <TestCard
                  title="データモデル確認"
                  description="GraphQL スキーマとデータモデルの確認"
                  icon="📋"
                  status="planned"
                  disabled
                />
              </div>
            </section>

            {/* 統合テスト */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                🔗 統合テスト
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TestCard
                  title="MAGIストリームテスト"
                  description="エージェントストリーミング機能の確認"
                  icon="🌊"
                  status="planned"
                  disabled
                />

                <TestCard
                  title="会話フローテスト"
                  description="メッセージ送信から応答までの完全フロー"
                  icon="💬"
                  status="planned"
                  disabled
                />
              </div>
            </section>

            {/* UI/UXテスト */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                🎨 UI/UXテスト
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TestCard
                  title="コンポーネントギャラリー"
                  description="全UIコンポーネントのプレビュー"
                  icon="🎭"
                  status="planned"
                  disabled
                />

                <TestCard
                  title="アニメーションテスト"
                  description="ページ遷移・トランジションの確認"
                  icon="✨"
                  status="planned"
                  disabled
                />
              </div>
            </section>
          </div>

          {/* フッター情報 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">💡 テストページの追加方法</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    src/app/(admin)/test/your-test/page.tsx
                  </code>{' '}
                  を作成
                </li>
                <li>このダッシュボードにテストカードを追加</li>
                <li>環境変数が有効な場合のみアクセス可能</li>
              </ol>
            </CardContent>
          </Card>
        </main>
      </div>
    </PageTransition>
  );
}

/**
 * テストカードコンポーネント
 */
interface TestCardProps {
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'planned' | 'error';
  onClick?: () => void;
  disabled?: boolean;
}

function TestCard({ title, description, icon, status, onClick, disabled }: TestCardProps) {
  const statusConfig = {
    available: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="w-4 h-4" />,
      text: '利用可能',
    },
    planned: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <AlertCircle className="w-4 h-4" />,
      text: '実装予定',
    },
    error: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle className="w-4 h-4" />,
      text: 'エラー',
    },
  };

  const config = statusConfig[status];

  return (
    <Card
      className={`transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md cursor-pointer hover:scale-[1.02]'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl">{icon}</span>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
          >
            {config.icon}
            {config.text}
          </div>
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!disabled && (
          <Button variant="outline" size="sm" className="w-full">
            テストを実行 →
          </Button>
        )}
        {disabled && (
          <p className="text-xs text-muted-foreground text-center py-2">
            このテストは実装予定です
          </p>
        )}
      </CardContent>
    </Card>
  );
}
