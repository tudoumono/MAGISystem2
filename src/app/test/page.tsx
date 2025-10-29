'use client';

/**
 * Test Page - MAGI Decision UI テストページ（クライアントコンポーネント）
 * 
 * このページはMAGI Decision UIの基本機能をテストするためのページです。
 * 実装したuseConversationsフックとConversationExampleコンポーネントの
 * 動作を確認できます。
 * 
 * 重要: Amplify Dataクライアントはクライアントサイドでのみ動作するため、
 * 'use client' ディレクティブを使用してクライアントコンポーネント化しています。
 * 
 * アクセス方法: http://localhost:3000/test
 * 
 * 確認できる機能:
 * - 会話一覧の表示
 * - 新規会話の作成（楽観的更新）
 * - 会話の編集・削除
 * - 検索機能
 * - エラーハンドリング
 * - ローディング状態
 * - デバッグ情報
 */

'use client';

import { ConversationExample } from '@/components/examples/ConversationExample';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                MAGI Decision UI
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Phase 1-2 テスト環境 - モックデータで動作中
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✓ ローカル動作中
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Phase 1-2
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* ナビゲーションリンク */}
        <div className="px-4 mb-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <a href="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <span>←</span>
                <span>ダッシュボードに戻る</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href="/test/integration/magi-stream" 
                className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded hover:bg-green-200 transition-colors"
              >
                🌊 MAGIストリームテスト
              </a>
            </div>
          </div>
        </div>
        
        {/* 説明セクション */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              🧪 テスト環境について
            </h2>
            <div className="text-blue-800 space-y-2">
              <p>
                このページでは、実装したMAGI Decision UIの基本機能をテストできます。
                現在はPhase 1-2のモックデータ環境で動作しています。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="font-medium mb-2">✅ 動作確認項目:</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 会話一覧の表示</li>
                    <li>• 新規会話作成（楽観的更新）</li>
                    <li>• 会話の編集・削除</li>
                    <li>• 検索・フィルタリング</li>
                    <li>• エラーハンドリング</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">💾 データ保存:</h3>
                  <ul className="text-sm space-y-1">
                    <li>• ローカルストレージに永続化</li>
                    <li>• ページリロード後も保持</li>
                    <li>• 開発者ツールで確認可能</li>
                    <li>• 初期サンプルデータ付き</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* 他のテストページへのリンク */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🔗 その他のテストページ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/test/data" 
                className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💾</span>
                  <h3 className="font-medium text-gray-900">データ統合</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Amplify Data、GraphQL APIの動作確認
                </p>
              </a>
              
              <a 
                href="/test/agents" 
                className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🤖</span>
                  <h3 className="font-medium text-gray-900">エージェント統合</h3>
                </div>
                <p className="text-sm text-gray-600">
                  MAGI 3賢者エージェントの動作確認
                </p>
              </a>
              
              <a 
                href="/test/integration" 
                className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔗</span>
                  <h3 className="font-medium text-gray-900">統合テスト</h3>
                </div>
                <p className="text-sm text-gray-600">
                  ストリーミング、トレース、本番環境テスト
                </p>
              </a>
            </div>
          </div>

          {/* 機能テストセクション */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 機能テストガイド
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">
                  1. 楽観的更新テスト
                </h3>
                <p className="text-sm text-green-800">
                  新規作成ボタンを押すと即座にUIが更新されることを確認してください。
                  ネットワークエラーが発生した場合は自動的にロールバックされます。
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">
                  2. データ永続化テスト
                </h3>
                <p className="text-sm text-yellow-800">
                  会話を作成後、ページをリロードしてもデータが保持されることを確認してください。
                  ブラウザの開発者ツールでローカルストレージも確認できます。
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">
                  3. 検索機能テスト
                </h3>
                <p className="text-sm text-purple-800">
                  検索ボックスに文字を入力すると、リアルタイムで会話がフィルタリングされることを確認してください。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ConversationExampleコンポーネント */}
        <ConversationExample />

        {/* フッター情報 */}
        <div className="mt-12 px-4 sm:px-0">
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📚 開発情報
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-2">実装済み機能:</h4>
                <ul className="space-y-1">
                  <li>• TypeScript型定義（完全な型安全性）</li>
                  <li>• useConversations/useMessagesフック</li>
                  <li>• 楽観的更新パターン</li>
                  <li>• モッククライアント（Phase 1-2）</li>
                  <li>• エラーハンドリング</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">次のPhase:</h4>
                <ul className="space-y-1">
                  <li>• Phase 3: 実際のAmplify Data統合</li>
                  <li>• Phase 4: Strands Agents統合</li>
                  <li>• Phase 5: Bedrock AgentCore統合</li>
                  <li>• Phase 6: OpenTelemetryトレーシング</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 ヒント: ブラウザの開発者ツール → Application → Local Storage で
                「magi-conversations」と「magi-messages」のデータを確認できます。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// メタデータはクライアントコンポーネントではエクスポートできないため削除
// title: 'MAGI Decision UI - テスト環境'
// description: 'MAGI Decision UIの基本機能をテストするためのページです。Phase 1-2のモックデータ環境で動作します。'