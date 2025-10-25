'use client';

/**
 * AmplifyProvider - クライアント側Amplify初期化コンポーネント
 * 
 * このコンポーネントはクライアント側でAmplifyの初期化を行います。
 * Server Componentのlayout.tsxから呼び出され、全ページでAmplifyが利用可能になります。
 * 
 * 目的:
 * - クライアント側でのAmplify.configure()実行
 * - amplify_outputs.jsonの直接読み込み
 * - 初期化状態の管理とエラーハンドリング
 * - 開発時のデバッグ情報表示
 * 
 * 設計理由:
 * - useEffectによる初期化タイミングの制御
 * - 重複初期化の防止
 * - エラー時のフォールバック処理
 * - 型安全性の確保
 * 
 * 使用例:
 * ```typescript
 * // layout.tsx内で使用
 * <AmplifyProvider>
 *   {children}
 * </AmplifyProvider>
 * ```
 * 
 * 関連: src/lib/amplify/config.ts, amplify_outputs.json
 */

import { useEffect, useState, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';

// amplify_outputs.jsonを直接インポート
import amplifyOutputs from '../../../amplify_outputs.json';

interface AmplifyProviderProps {
  children: ReactNode;
}

interface InitializationState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  modelCount: number;
}

/**
 * AmplifyProvider Component
 * 
 * 実装パターン:
 * 1. コンポーネントマウント時にAmplify初期化
 * 2. 初期化状態の管理
 * 3. エラーハンドリングとリトライ
 * 4. 開発時のデバッグ情報表示
 */
export function AmplifyProvider({ children }: AmplifyProviderProps) {
  const [initState, setInitState] = useState<InitializationState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    modelCount: 0
  });

  useEffect(() => {
    async function initializeAmplify() {
      try {
        setInitState(prev => ({ ...prev, isLoading: true, error: null }));

        // 既に設定済みかチェック
        const existingConfig = Amplify.getConfig();
        if (existingConfig && Object.keys(existingConfig).length > 0) {
          console.log('✅ Amplify already configured, skipping initialization');
          setInitState({
            isInitialized: true,
            isLoading: false,
            error: null,
            modelCount: Object.keys(amplifyOutputs.data?.model_introspection?.models || {}).length
          });
          return;
        }

        // amplify_outputs.jsonの検証
        if (!amplifyOutputs) {
          throw new Error('amplify_outputs.json not found');
        }

        if (!amplifyOutputs.data?.url) {
          throw new Error('GraphQL endpoint not found in amplify_outputs.json');
        }

        if (!amplifyOutputs.data?.model_introspection) {
          throw new Error('model_introspection not found in amplify_outputs.json');
        }

        // Amplifyの設定
        console.log('🔧 Configuring Amplify on client side...');
        console.log('📍 Region:', amplifyOutputs.data.aws_region);
        console.log('🔐 Auth Pool:', amplifyOutputs.auth.user_pool_id);
        console.log('📊 Models available:', Object.keys(amplifyOutputs.data.model_introspection.models).length);

        Amplify.configure(amplifyOutputs);

        // 設定の確認
        const newConfig = Amplify.getConfig();
        if (!newConfig || Object.keys(newConfig).length === 0) {
          throw new Error('Amplify configuration failed - config is empty');
        }

        console.log('✅ Amplify configured successfully on client side');

        setInitState({
          isInitialized: true,
          isLoading: false,
          error: null,
          modelCount: Object.keys(amplifyOutputs.data.model_introspection.models).length
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        console.error('❌ Failed to initialize Amplify on client side:', errorMessage);
        
        setInitState({
          isInitialized: false,
          isLoading: false,
          error: errorMessage,
          modelCount: 0
        });
      }
    }

    initializeAmplify();
  }, []);

  // 開発環境でのデバッグ情報表示
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && initState.isInitialized) {
      console.group('🔧 Amplify Client Initialization Status');
      console.log('Status:', initState.isInitialized ? '✅ Initialized' : '❌ Not Initialized');
      console.log('Models:', `${initState.modelCount} available`);
      console.log('Config:', Amplify.getConfig());
      console.groupEnd();
    }
  }, [initState.isInitialized, initState.modelCount]);

  // エラー状態の表示（開発環境のみ）
  if (initState.error && process.env.NODE_ENV === 'development') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            ❌ Amplify初期化エラー
          </h2>
          <p className="text-red-700 mb-4">
            {initState.error}
          </p>
          <div className="text-sm text-red-600">
            <p className="font-medium mb-1">解決方法:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>amplify_outputs.jsonが存在するか確認</li>
              <li>npx ampx push でリソースをデプロイ</li>
              <li>開発サーバーを再起動</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  // ローディング状態の表示（開発環境のみ）
  if (initState.isLoading && process.env.NODE_ENV === 'development') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            🔧 Amplify初期化中...
          </h2>
          <p className="text-blue-700">
            AWS リソースに接続しています
          </p>
        </div>
      </div>
    );
  }

  // 初期化完了後は通常通り子コンポーネントをレンダリング
  return <>{children}</>;
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. layout.tsxでの基本使用:
 * ```typescript
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AmplifyProvider>
 *           {children}
 *         </AmplifyProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * 2. エラーハンドリング:
 * - 開発環境では詳細なエラー情報を表示
 * - 本番環境では静かに失敗（子コンポーネントは正常レンダリング）
 * 
 * 3. パフォーマンス考慮:
 * - 重複初期化の防止
 * - 設定状態のキャッシュ
 * - 必要最小限のレンダリング
 * 
 * 4. デバッグ支援:
 * - 詳細なコンソールログ
 * - 初期化状態の可視化
 * - エラー時の解決方法提示
 */