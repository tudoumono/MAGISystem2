'use client';

import { useState } from 'react';

/**
 * Environment Check - 環境変数チェック
 *
 * 目的: 本番環境で環境変数が正しく設定されているか確認
 * アクセス制限: 環境変数 NEXT_PUBLIC_ENABLE_TEST_PAGES=true でのみアクセス可能
 *
 * 使用方法:
 * 1. .env.local に NEXT_PUBLIC_ENABLE_TEST_PAGES=true を追加
 * 2. /debug/environment にアクセス
 *
 * セキュリティ: 本番環境では必ず無効化すること
 */

export default function EnvironmentDebugPage() {
  const [testResults, setTestResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const agentCoreUrl = process.env.NEXT_PUBLIC_AGENTCORE_URL || 'http://localhost:8080';

  const runPingTest = async () => {
    setIsLoading(true);
    setTestResults('');
    const results: string[] = [];

    results.push('🔍 Testing connection to: ' + agentCoreUrl);
    console.log('🔍 Testing connection to:', agentCoreUrl);

    try {
      const pingUrl = `${agentCoreUrl}/ping`;
      results.push(`\n📡 Attempting to connect to: ${pingUrl}`);
      console.log('Attempting to connect to:', pingUrl);

      const startTime = Date.now();
      const response = await fetch(pingUrl, {
        method: 'GET',
        mode: 'cors',
      });
      const duration = Date.now() - startTime;

      results.push(`\n⏱️ Response time: ${duration}ms`);
      results.push(`\n📊 Response status: ${response.status}`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const headers = Object.fromEntries(response.headers.entries());
      results.push(`\n📋 Response headers:`);
      Object.entries(headers).forEach(([key, value]) => {
        results.push(`   ${key}: ${value}`);
      });

      if (response.ok) {
        const text = await response.text();
        results.push(`\n✅ 接続成功!`);
        results.push(`\n📄 Response body: ${text}`);
        alert(`✅ 接続成功!\n\nStatus: ${response.status}\nResponse: ${text}\nTime: ${duration}ms`);
      } else {
        results.push(`\n⚠️ 接続はできたがエラー (Status: ${response.status})`);
        alert(`⚠️ 接続はできたがエラー\n\nStatus: ${response.status}\nTime: ${duration}ms`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      results.push(`\n❌ 接続失敗`);
      results.push(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push(`\nError type: ${error instanceof Error ? error.constructor.name : typeof error}`);

      if (error instanceof TypeError) {
        results.push(`\n💡 ヒント: TypeError は通常、CORS設定の問題またはネットワークエラーです`);
      }

      alert(`❌ 接続失敗\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nURL: ${agentCoreUrl}`);
    }

    setTestResults(results.join('\n'));
    setIsLoading(false);
  };

  const runInvocationTest = async () => {
    setIsLoading(true);
    setTestResults('');
    const results: string[] = [];

    results.push('🔍 Testing /invocations endpoint...');
    console.log('🔍 Testing /invocations endpoint...');

    try {
      const invocationUrl = `${agentCoreUrl}/invocations`;
      results.push(`\n📡 POST to: ${invocationUrl}`);

      const testPayload = {
        question: 'テスト接続です',
        sessionId: 'debug-session-' + Date.now(),
        agentConfigs: {}
      };

      results.push(`\n📤 Payload: ${JSON.stringify(testPayload, null, 2)}`);

      const startTime = Date.now();
      const response = await fetch(invocationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });
      const duration = Date.now() - startTime;

      results.push(`\n⏱️ Response time: ${duration}ms`);
      results.push(`\n📊 Response status: ${response.status}`);
      results.push(`\n📋 Response headers:`);

      const headers = Object.fromEntries(response.headers.entries());
      Object.entries(headers).forEach(([key, value]) => {
        results.push(`   ${key}: ${value}`);
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        results.push(`\n✅ APIエンドポイント接続成功!`);
        results.push(`\n📄 Content-Type: ${contentType}`);

        if (contentType?.includes('text/event-stream')) {
          results.push(`\n🔄 SSE ストリーミング開始（最初の数イベントを表示）`);

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let eventCount = 0;

          if (reader) {
            try {
              while (eventCount < 5) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                results.push(`\n📨 Event ${eventCount + 1}: ${chunk.substring(0, 200)}${chunk.length > 200 ? '...' : ''}`);
                eventCount++;
              }
              reader.cancel();
              results.push(`\n✅ SSE ストリーミング確認完了`);
            } catch (streamError) {
              results.push(`\n⚠️ Stream reading error: ${streamError}`);
            }
          }
        } else {
          const text = await response.text();
          results.push(`\n📄 Response: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
        }

        alert(`✅ /invocations 接続成功!\n\nStatus: ${response.status}\nTime: ${duration}ms\nContent-Type: ${contentType}`);
      } else {
        results.push(`\n⚠️ APIエラー (Status: ${response.status})`);
        const text = await response.text();
        results.push(`\n📄 Error response: ${text}`);
        alert(`⚠️ APIエラー\n\nStatus: ${response.status}\nTime: ${duration}ms`);
      }
    } catch (error) {
      console.error('Invocation test failed:', error);
      results.push(`\n❌ 接続失敗`);
      results.push(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push(`\nError type: ${error instanceof Error ? error.constructor.name : typeof error}`);

      if (error instanceof TypeError) {
        results.push(`\n💡 ヒント: TypeError は通常、CORS設定の問題またはネットワークエラーです`);
      }

      alert(`❌ /invocations 接続失敗\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTestResults(results.join('\n'));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">環境変数デバッグ</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">重要な環境変数</h2>

          <div className="space-y-3">
            {/* 開発/デバッグ設定 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">開発・デバッグ設定</h3>
              <div className="border-b pb-2 mb-2">
                <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_ENABLE_TEST_PAGES:</span>
                <div className="mt-1">
                  <code className="text-lg font-bold">
                    {process.env.NEXT_PUBLIC_ENABLE_TEST_PAGES === 'true' ? (
                      <span className="text-amber-600">✓ 有効</span>
                    ) : (
                      <span className="text-gray-600">無効 (本番推奨)</span>
                    )}
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
            </div>

            {/* AgentCore Runtime設定 */}
            <div className="pt-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">AgentCore Runtime</h3>
              <div className="border-b pb-2 mb-2">
                <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_AGENTCORE_URL:</span>
                <div className="mt-1">
                  <code className="text-lg font-bold text-blue-600">
                    {process.env.NEXT_PUBLIC_AGENTCORE_URL || '❌ 未設定'}
                  </code>
                </div>
              </div>
              <div className="border-b pb-2">
                <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_SSE_TIMEOUT_MS:</span>
                <div className="mt-1">
                  <code className="text-sm">
                    {process.env.NEXT_PUBLIC_SSE_TIMEOUT_MS || 'デフォルト値使用 (240000ms = 4分)'}
                  </code>
                </div>
              </div>
            </div>

            {/* AWS/Cognito設定 */}
            <div className="pt-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">AWS・認証設定</h3>
              <div className="border-b pb-2 mb-2">
                <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_AWS_REGION:</span>
                <div className="mt-1">
                  <code className="text-sm">
                    {process.env.NEXT_PUBLIC_AWS_REGION || '❌ 未設定'}
                  </code>
                </div>
              </div>
              <div className="border-b pb-2 mb-2">
                <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_USER_POOL_ID:</span>
                <div className="mt-1">
                  <code className="text-sm">
                    {process.env.NEXT_PUBLIC_USER_POOL_ID || '❌ 未設定'}
                  </code>
                </div>
              </div>
              <div className="border-b pb-2">
                <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_USER_POOL_CLIENT_ID:</span>
                <div className="mt-1">
                  <code className="text-sm">
                    {process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '❌ 未設定'}
                  </code>
                </div>
              </div>
            </div>

            {/* GraphQL/AppSync設定 */}
            <div className="pt-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">GraphQL・AppSync</h3>
              <div className="border-b pb-2 mb-2">
                <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_GRAPHQL_ENDPOINT:</span>
                <div className="mt-1">
                  <code className="text-sm break-all">
                    {process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '❌ 未設定'}
                  </code>
                </div>
              </div>
              <div className="border-b pb-2">
                <span className="font-mono text-sm text-gray-600">NEXT_PUBLIC_API_KEY:</span>
                <div className="mt-1">
                  <code className="text-sm break-all">
                    {process.env.NEXT_PUBLIC_API_KEY || '❌ 未設定'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">接続テスト</h2>

          <div className="space-y-4">
            <div>
              <button
                onClick={runPingTest}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ テスト中...' : '1️⃣ AgentCore Runtime接続テスト（/ping）'}
              </button>
              <p className="text-sm text-gray-600 mt-2">基本的な接続性を確認します</p>
            </div>

            <div>
              <button
                onClick={runInvocationTest}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ テスト中...' : '2️⃣ API エンドポイントテスト（/invocations）'}
              </button>
              <p className="text-sm text-gray-600 mt-2">実際のAPIエンドポイントとSSEストリーミングを確認します</p>
            </div>
          </div>

          {testResults && (
            <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {testResults}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ セキュリティ警告</h3>
          <p className="text-sm text-yellow-700">
            このページは環境変数を表示します。本番環境では削除するか、認証で保護してください。
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 デバッグのヒント</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>ブラウザの開発者ツール（F12）で確認すべき項目：</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Console タブ:</strong> エラーメッセージやログを確認</li>
              <li><strong>Network タブ:</strong> リクエストの詳細（Status、Headers、Timing）を確認</li>
              <li><strong>Application タブ:</strong> LocalStorage や SessionStorage の状態を確認</li>
            </ul>
            <p className="mt-3"><strong>CloudWatch でログを確認:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>AgentCore Runtime の Docker コンテナログを確認</li>
              <li>ログが全く表示されない場合、リクエストが到達していない可能性</li>
              <li>ECS/Fargate のタスクが正常に起動しているか確認</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">トラブルシューティング</h2>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. NEXT_PUBLIC_AGENTCORE_URLが未設定の場合</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>AWS Amplify Consoleで環境変数を設定</li>
                <li>アプリケーションを再デプロイ（環境変数は再デプロイ後に反映されます）</li>
                <li>ブラウザのキャッシュをクリア（Ctrl+Shift+R / Cmd+Shift+R）</li>
                <li>このページをリロードして、環境変数が表示されるか確認</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. 接続テストが失敗する場合（TypeError: Failed to fetch）</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>URLの確認:</strong> AgentCore RuntimeのURLが正しいか（http/https、ポート番号）</li>
                <li><strong>Dockerコンテナの確認:</strong> ECS/Fargateでタスクが起動しているか確認</li>
                <li><strong>CORS設定:</strong> AgentCore Runtimeで適切なCORSヘッダーが設定されているか</li>
                <li><strong>ネットワーク:</strong> セキュリティグループでポートが開放されているか</li>
                <li><strong>ロードバランサー:</strong> ALB/NLBのターゲットグループが正常か</li>
                <li><strong>DNS:</strong> ドメイン名が正しく解決されるか（nslookupで確認）</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. /pingは成功するが/invocationsが失敗する場合</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Pythonプロセス:</strong> DockerコンテナにPython環境が正しく設定されているか</li>
                <li><strong>依存関係:</strong> requirements.txtのパッケージがインストールされているか</li>
                <li><strong>環境変数:</strong> AgentCore側の環境変数（AWS認証情報など）が設定されているか</li>
                <li><strong>タイムアウト:</strong> Pythonスクリプトの実行時間がタイムアウト設定を超えていないか</li>
                <li><strong>CloudWatchログ:</strong> AgentCoreのログでエラーメッセージを確認</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. CloudWatchにログが表示されない場合</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>IAMロール:</strong> ECSタスク実行ロールにCloudWatch Logs書き込み権限があるか</li>
                <li><strong>ログドライバー:</strong> ECSタスク定義でawslogsドライバーが設定されているか</li>
                <li><strong>ログストリーム:</strong> CloudWatch Logsでロググループが作成されているか</li>
                <li><strong>接続確認:</strong> このページの接続テストでリクエストが届いているか確認</li>
                <li><strong>Dockerコンテナ:</strong> コンテナが起動直後にクラッシュしていないか確認（ECSコンソール）</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. デプロイ後も古いビルドが動いている場合</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Amplify Consoleでデプロイが完了しているか確認</li>
                <li>CloudFrontキャッシュのクリアを試行（Amplify Console → Invalidations）</li>
                <li>ブラウザのハードリロード（Ctrl+Shift+R / Cmd+Shift+R）</li>
                <li>シークレットブラウジングモードで確認</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">📋 チェックリスト</h3>
              <div className="space-y-1 text-gray-700">
                <div>✅ Amplify: 環境変数設定済み、デプロイ完了</div>
                <div>✅ AgentCore Runtime: Dockerコンテナ起動中</div>
                <div>✅ ECS: タスクがRUNNING状態</div>
                <div>✅ セキュリティグループ: 必要なポート開放済み</div>
                <div>✅ IAMロール: 必要な権限付与済み</div>
                <div>✅ DNS: ドメイン名が解決可能</div>
                <div>✅ CORS: 適切なヘッダー設定済み</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
