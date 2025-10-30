'use client';

/**
 * Models Check Page - Comprehensive Amplify diagnostics
 */

import { useEffect, useState } from 'react';
import { getAmplifyClient, testAmplifyConnection } from '@/lib/amplify/client';
import { getCurrentEnvironmentMode, validateAmplifyConfig, getAmplifyConfig } from '@/lib/amplify/config';

interface DiagnosticResult {
    status: string;
    models: string[];
    connectionTest?: any;
    configValidation?: any;
    environmentMode?: string;
    amplifyOutputsExists?: boolean;
    detailedError?: any;
}

export default function ModelsCheckPage() {
    const [result, setResult] = useState<DiagnosticResult>({
        status: 'Checking...',
        models: []
    });

    useEffect(() => {
        async function runDiagnostics() {
            try {
                // 1. 環境モードの確認
                const environmentMode = getCurrentEnvironmentMode();
                console.log('🔍 Environment Mode:', environmentMode);

                // 2. 設定の検証
                const config = getAmplifyConfig();
                const configValidation = validateAmplifyConfig(config);
                console.log('🔍 Config Validation:', configValidation);

                // 3. amplify_outputs.json の存在確認（開発環境のみ）
                // 本番環境ではサーバーサイドで自動注入されるため、クライアントからアクセスできない
                let amplifyOutputsAccessible = false;
                let isProductionDeployment = false;
                try {
                    const response = await fetch('/amplify_outputs.json');
                    amplifyOutputsAccessible = response.ok;
                    if (amplifyOutputsAccessible) {
                        const outputs = await response.json();
                        console.log('🔍 amplify_outputs.json accessible from client:', amplifyOutputsAccessible);
                        console.log('🔍 amplify_outputs content:', outputs);
                    }
                } catch (e) {
                    console.log('🔍 amplify_outputs.json not accessible from client (normal in production)');
                }
                
                // 本番環境かどうかを判定（設定が正しく読み込まれているかで判断）
                isProductionDeployment = !amplifyOutputsAccessible && !!config.Auth?.Cognito?.userPoolId;

                // 4. クライアントの初期化テスト
                let client = null;
                let clientError = null;
                try {
                    client = getAmplifyClient();
                    console.log('🔍 Client initialized:', !!client);
                    console.log('🔍 Client object:', client);
                } catch (error) {
                    clientError = error;
                    console.error('🔍 Client initialization failed:', error);
                }

                if (!client) {
                    setResult({
                        status: '❌ Client initialization failed',
                        models: [],
                        environmentMode,
                        configValidation,
                        amplifyOutputsExists,
                        detailedError: clientError
                    });
                    return;
                }

                // 5. モデルの確認
                let models: string[] = [];
                if (client.models) {
                    models = Object.keys(client.models);
                    console.log('🔍 Available models:', models);
                } else {
                    console.log('🔍 No models property on client');
                }

                // 6. 接続テスト
                let connectionTest = null;
                try {
                    connectionTest = await testAmplifyConnection();
                    console.log('🔍 Connection test result:', connectionTest);
                } catch (error) {
                    console.error('🔍 Connection test failed:', error);
                    connectionTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
                }

                // 7. 実際のAPI呼び出しテスト
                let apiTestResult = null;
                if (models.includes('Conversation')) {
                    try {
                        console.log('🔍 Testing Conversation.list API call...');
                        const result = await client.models.Conversation.list({ limit: 1 });
                        console.log('🔍 API call result:', result);
                        apiTestResult = {
                            success: true,
                            hasData: !!result.data,
                            itemCount: result.data?.length || 0,
                            errors: result.errors
                        };
                    } catch (apiError) {
                        console.error('🔍 API call failed:', apiError);
                        apiTestResult = {
                            success: false,
                            error: apiError instanceof Error ? apiError.message : 'Unknown API error',
                            fullError: apiError
                        };
                    }
                }

                // 結果をまとめる
                const finalStatus = models.length > 0 
                    ? `✅ ${models.length} models available` 
                    : '❌ No models available';

                setResult({
                    status: finalStatus,
                    models,
                    connectionTest: { ...connectionTest, apiTest: apiTestResult },
                    configValidation: {
                        ...configValidation,
                        isProductionDeployment
                    },
                    environmentMode,
                    amplifyOutputsExists: amplifyOutputsAccessible,
                    detailedError: clientError
                });

            } catch (error) {
                console.error('🔍 Diagnostic failed:', error);
                setResult({
                    status: `❌ Diagnostic Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    models: [],
                    detailedError: error
                });
            }
        }

        runDiagnostics();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Amplify Comprehensive Diagnostics</h1>

                <div className="space-y-6">
                    {/* Status Overview */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-2">Status Overview</h2>
                        <p className="text-lg mb-2">{result.status}</p>
                        <p className="text-sm text-gray-600">Environment: {result.environmentMode}</p>
                        
                        {/* amplify_outputs.jsonの状態表示を改善 */}
                        {result.configValidation?.isProductionDeployment ? (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                                <p className="text-sm text-green-800">
                                    <span className="font-semibold">✅ Production Deployment Detected</span>
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                    Configuration is automatically injected by Amplify Hosting.
                                    amplify_outputs.json is not publicly accessible (this is correct for security).
                                </p>
                            </div>
                        ) : result.amplifyOutputsExists ? (
                            <p className="text-sm text-gray-600">amplify_outputs.json: ✅ Accessible (Development)</p>
                        ) : (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-sm text-yellow-800">
                                    <span className="font-semibold">⚠️ amplify_outputs.json not accessible</span>
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    Run <code className="bg-yellow-100 px-1 rounded">npx ampx push</code> to generate configuration.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Available Models */}
                    {result.models.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-2">Available Models ({result.models.length})</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {result.models.map(model => (
                                    <div key={model} className="bg-green-50 text-green-700 px-3 py-1 rounded">
                                        {model}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Configuration Validation */}
                    {result.configValidation && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-2">Configuration Validation</h2>
                            
                            {/* 本番環境の場合は実際の動作状況を優先 */}
                            {result.configValidation.isProductionDeployment && result.connectionTest?.success ? (
                                <div className="space-y-3">
                                    <p className="mb-2">
                                        Status: <span className="text-green-600 font-semibold">✅ Working (Production)</span>
                                    </p>
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-sm text-blue-800">
                                            <strong>ℹ️ Production Environment Note:</strong>
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Configuration validation may show errors because amplify_outputs.json 
                                            is not publicly accessible. However, the actual connection test succeeded, 
                                            which means the configuration is correctly loaded server-side.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="mb-2">
                                    Status: {result.configValidation.isValid ? '✅ Valid' : '❌ Invalid'}
                                </p>
                            )}
                            
                            {result.configValidation.errors?.length > 0 && !result.configValidation.isProductionDeployment && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-red-600 mb-1">Errors:</h3>
                                    <ul className="list-disc list-inside text-red-600 text-sm">
                                        {result.configValidation.errors.map((error: string, index: number) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.configValidation.warnings?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-yellow-600 mb-1">Warnings:</h3>
                                    <ul className="list-disc list-inside text-yellow-600 text-sm">
                                        {result.configValidation.warnings.map((warning: string, index: number) => (
                                            <li key={index}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Connection Test */}
                    {result.connectionTest && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-2">Connection Test</h2>
                            <p className="mb-2">
                                Status: {result.connectionTest.success ? '✅ Success' : '❌ Failed'}
                            </p>
                            
                            {result.connectionTest.apiTest && (
                                <div className="mt-4 p-4 bg-gray-50 rounded">
                                    <h3 className="font-semibold mb-2">API Test (Conversation.list)</h3>
                                    <p>Success: {result.connectionTest.apiTest.success ? '✅' : '❌'}</p>
                                    {result.connectionTest.apiTest.success ? (
                                        <p>Items found: {result.connectionTest.apiTest.itemCount}</p>
                                    ) : (
                                        <p className="text-red-600">Error: {result.connectionTest.apiTest.error}</p>
                                    )}
                                </div>
                            )}

                            {result.connectionTest.error && (
                                <p className="text-red-600 text-sm mt-2">
                                    Error: {result.connectionTest.error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Detailed Error Information */}
                    {result.detailedError && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-2">Detailed Error Information</h2>
                            <pre className="bg-red-50 text-red-700 p-4 rounded text-sm overflow-auto">
                                {JSON.stringify(result.detailedError, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Troubleshooting Guide */}
                    <div className="bg-blue-50 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-2 text-blue-800">Understanding This Diagnostic</h2>
                        <div className="text-blue-700 space-y-3 text-sm">
                            <div>
                                <p className="font-semibold">✅ What matters most:</p>
                                <ul className="list-disc list-inside ml-2 mt-1">
                                    <li><strong>Connection Test</strong> - Can the app connect to AWS services?</li>
                                    <li><strong>API Test</strong> - Can the app query the database?</li>
                                    <li><strong>Models Available</strong> - Are data models recognized?</li>
                                </ul>
                            </div>
                            
                            <div className="pt-2 border-t border-blue-200">
                                <p className="font-semibold">ℹ️ About amplify_outputs.json:</p>
                                <ul className="list-disc list-inside ml-2 mt-1">
                                    <li><strong>Development:</strong> File is accessible at /amplify_outputs.json</li>
                                    <li><strong>Production (Amplify Hosting):</strong> File is NOT publicly accessible (this is correct for security)</li>
                                    <li>Configuration is automatically injected server-side in production</li>
                                </ul>
                            </div>
                            
                            <div className="pt-2 border-t border-blue-200">
                                <p className="font-semibold">🔧 Troubleshooting (Development only):</p>
                                <p className="mt-1"><strong>If amplify_outputs.json is missing locally:</strong></p>
                                <p className="ml-2">Run: <code className="bg-blue-100 px-1 rounded">npx ampx push</code></p>
                                
                                <p className="mt-2"><strong>If models are not available:</strong></p>
                                <p className="ml-2">1. Check <code className="bg-blue-100 px-1 rounded">amplify/data/resource.ts</code></p>
                                <p className="ml-2">2. Run: <code className="bg-blue-100 px-1 rounded">npx ampx push</code></p>
                                <p className="ml-2">3. Restart development server</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}