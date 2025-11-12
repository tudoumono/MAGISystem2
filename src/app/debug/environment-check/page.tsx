'use client';

/**
 * 環境変数デバッグページ
 *
 * 本番環境で環境変数が正しく設定されているか確認するためのページ
 * セキュリティ上の理由から、本番環境では無効化することを推奨
 */

export default function EnvironmentDebugPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">環境変数デバッグ</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">重要な環境変数</h2>

          <div className="space-y-3">
            <div className="border-b pb-2">
              <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_AGENTCORE_URL:</span>
              <div className="mt-1">
                <code className="text-lg font-bold text-blue-600">
                  {process.env.NEXT_PUBLIC_AGENTCORE_URL || '❌ 未設定'}
                </code>
              </div>
            </div>

            <div className="border-b pb-2">
              <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_AWS_REGION:</span>
              <div className="mt-1">
                <code className="text-lg">
                  {process.env.NEXT_PUBLIC_AWS_REGION || '❌ 未設定'}
                </code>
              </div>
            </div>

            <div className="border-b pb-2">
              <span className="font-mono text-sm text-gray-600">NODE_ENV:</span>
              <div className="mt-1">
                <code className="text-lg">
                  {process.env.NODE_ENV || '❌ 未設定'}
                </code>
              </div>
            </div>

            <div className="border-b pb-2">
              <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_SSE_TIMEOUT_MS:</span>
              <div className="mt-1">
                <code className="text-lg">
                  {process.env.NEXT_PUBLIC_SSE_TIMEOUT_MS || 'デフォルト値使用'}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">接続テスト</h2>
          <button
            onClick={async () => {
              const agentCoreUrl = process.env.NEXT_PUBLIC_AGENTCORE_URL || 'http://localhost:8080';
              console.log('🔍 Testing connection to:', agentCoreUrl);

              try {
                // Pingエンドポイントをテスト
                const pingUrl = `${agentCoreUrl}/ping`;
                console.log('Attempting to connect to:', pingUrl);

                const response = await fetch(pingUrl, {
                  method: 'GET',
                  mode: 'cors',
                });

                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers.entries()));

                if (response.ok) {
                  const text = await response.text();
                  alert(`✅ 接続成功!\n\nStatus: ${response.status}\nResponse: ${text}`);
                } else {
                  alert(`⚠️ 接続はできたがエラー\n\nStatus: ${response.status}`);
                }
              } catch (error) {
                console.error('Connection test failed:', error);
                alert(`❌ 接続失敗\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nURL: ${agentCoreUrl}`);
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            AgentCore Runtime接続テスト（/pingエンドポイント）
          </button>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ セキュリティ警告</h3>
          <p className="text-sm text-yellow-700">
            このページは環境変数を表示します。本番環境では削除するか、認証で保護してください。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">トラブルシューティング</h2>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. NEXT_PUBLIC_AGENTCORE_URLが未設定の場合</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>AWS Amplify Consoleで環境変数を設定</li>
                <li>アプリケーションを再デプロイ</li>
                <li>ブラウザのキャッシュをクリア（Ctrl+Shift+R / Cmd+Shift+R）</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. 接続テストが失敗する場合</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>AgentCore RuntimeのURLが正しいか確認</li>
                <li>AgentCore Runtimeが起動しているか確認</li>
                <li>CORSヘッダーが正しく設定されているか確認</li>
                <li>ネットワークセキュリティグループ/ファイアウォールを確認</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. デプロイ後も古いビルドが動いている場合</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Amplify Consoleでデプロイが完了しているか確認</li>
                <li>CloudFrontキャッシュのクリアを試行</li>
                <li>ブラウザのハードリロード（Ctrl+Shift+R / Cmd+Shift+R）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
