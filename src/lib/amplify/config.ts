/**
 * Amplify Configuration Manager - 環境切り替えとクライアント設定
 * 
 * 目的: 開発/本番環境の自動切り替えとAmplify設定の一元管理
 * 設計理由: 環境変数による動的設定切り替えと型安全性の確保
 * 
 * 主要機能:
 * - 環境変数による開発/本番環境の自動判定
 * - amplify_outputs.json からの実際の設定読み込み
 * - モック設定との切り替え
 * - 設定検証とエラーハンドリング
 * 
 * 学習ポイント:
 * - Amplify Gen2 の設定パターン
 * - 環境変数による設定管理
 * - TypeScript による型安全な設定
 * - 開発効率を向上させる設定切り替え
 * 
 * 使用例:
 * ```typescript
 * import { getAmplifyConfig, isProductionMode } from '@/lib/amplify/config';
 * 
 * // 環境に応じた設定を取得
 * const config = getAmplifyConfig();
 * 
 * // 本番環境かどうかの判定
 * if (isProductionMode()) {
 *   console.log('Production mode - using real AWS resources');
 * }
 * ```
 * 
 * 関連: amplify_outputs.json, .env.local
 */

import { ResourcesConfig } from 'aws-amplify';

/**
 * 環境モードの定義
 * 
 * 学習ポイント:
 * - MOCK: モックデータを使用（Phase 1-2）
 * - DEVELOPMENT: 実AWS + 開発設定（Phase 3）
 * - PRODUCTION: 実AWS + 本番設定（Phase 4-6）
 */
export type EnvironmentMode = 'MOCK' | 'DEVELOPMENT' | 'PRODUCTION';

/**
 * Amplify設定の型定義
 * 
 * 設計理由:
 * - ResourcesConfig: Amplify v6 の標準設定型
 * - 型安全性による設定ミスの防止
 * - IDE補完による開発効率向上
 */
export interface AmplifyConfigOptions {
  mode: EnvironmentMode;
  enableMocking?: boolean;
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

/**
 * 実際のAmplify出力設定の読み込み
 * 
 * 学習ポイント:
 * - amplify_outputs.json: Amplify Gen2 で生成される設定ファイル
 * - 実際のAWSリソース情報を含む
 * - デプロイ後に自動生成される
 */
let amplifyOutputs: any = null;

try {
  // 実際のAmplify出力設定を読み込み
  amplifyOutputs = require('../../../amplify_outputs.json');
} catch (error) {
  console.warn('amplify_outputs.json not found - using environment variables or mock config');
}

/**
 * 現在の環境モードを判定
 * 
 * 学習ポイント:
 * - NODE_ENV: Next.js の標準環境変数
 * - AMPLIFY_MODE: カスタム環境変数による強制指定
 * - 自動判定ロジック: amplify_outputs.json の存在確認
 * 
 * 判定ロジック:
 * 1. AMPLIFY_MODE が設定されている場合はそれを使用
 * 2. amplify_outputs.json が存在する場合は DEVELOPMENT
 * 3. 本番環境（NODE_ENV=production）の場合は PRODUCTION
 * 4. それ以外は MOCK
 */
// ログの重複を防ぐためのフラグ
let hasLoggedMockMode = false;

export function getCurrentEnvironmentMode(): EnvironmentMode {
  // デバッグ情報を追加
  console.log('getCurrentEnvironmentMode called');
  console.log('NEXT_PUBLIC_AMPLIFY_MODE:', process.env.NEXT_PUBLIC_AMPLIFY_MODE);
  console.log('AMPLIFY_MODE:', process.env.AMPLIFY_MODE);
  console.log('amplifyOutputs exists:', !!amplifyOutputs);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // 🔄 Phase 3準備完了 - Amplifyリソースデプロイ待ち
  // Phase 3: 実際のAmplify Dataとの統合開始（リソースデプロイ後に有効化）
  const FORCE_MOCK_UNTIL_PHASE2_COMPLETE = false; // 認証システム実装まで一時的にMOCK
  if (FORCE_MOCK_UNTIL_PHASE2_COMPLETE) {
    if (!hasLoggedMockMode) {
      console.log('🔄 認証システム実装待ち - 一時的にMOCKモード');
      console.log('💡 認証機能実装後、この設定を無効化してください');
      console.log('🚀 現在: データ層のみPhase 3対応、認証は次のフェーズで実装');
      hasLoggedMockMode = true;
    }
    return 'MOCK';
  }

  // 環境変数による強制指定（クライアントサイド対応）
  const forcedMode = (process.env.NEXT_PUBLIC_AMPLIFY_MODE || process.env.AMPLIFY_MODE) as EnvironmentMode;
  if (forcedMode && ['MOCK', 'DEVELOPMENT', 'PRODUCTION'].includes(forcedMode)) {
    console.log('Using forced mode from env var:', forcedMode);
    return forcedMode;
  }

  // 本番環境の判定
  if (process.env.NODE_ENV === 'production') {
    return amplifyOutputs ? 'PRODUCTION' : 'MOCK';
  }

  // 開発環境の判定
  if (amplifyOutputs) {
    return 'DEVELOPMENT';
  }

  // デフォルトはモック
  return 'MOCK';
}

/**
 * 本番モードかどうかの判定
 * 
 * 学習ポイント:
 * - 本番環境での動作確認
 * - 機能の有効/無効切り替え
 * - パフォーマンス最適化の判定
 */
export function isProductionMode(): boolean {
  return getCurrentEnvironmentMode() === 'PRODUCTION';
}

/**
 * 開発モードかどうかの判定
 * 
 * 学習ポイント:
 * - 開発時の追加機能有効化
 * - デバッグ情報の表示制御
 * - 開発ツールの有効化
 */
export function isDevelopmentMode(): boolean {
  return getCurrentEnvironmentMode() === 'DEVELOPMENT';
}

/**
 * モックモードかどうかの判定
 * 
 * 学習ポイント:
 * - Phase 1-2 での開発
 * - モックデータの使用判定
 * - AWS接続なしでの動作
 */
export function isMockMode(): boolean {
  return getCurrentEnvironmentMode() === 'MOCK';
}

/**
 * モック用のAmplify設定
 * 
 * 設計理由:
 * - Phase 1-2 でのフロントエンド開発用
 * - AWS接続なしでの動作確認
 * - 学習用の設定例
 */
const mockAmplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'mock-user-pool-id',
      userPoolClientId: 'mock-client-id',
      identityPoolId: 'mock-identity-pool-id',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://mock-api.example.com/graphql',
      region: 'us-east-1',
      defaultAuthMode: 'userPool',
    },
  },
};

/**
 * 実際のAmplify設定を生成
 * 
 * 学習ポイント:
 * - amplify_outputs.json からの設定変換
 * - Amplify v6 の ResourcesConfig 形式
 * - 型安全な設定変換
 */
function createRealAmplifyConfig(): ResourcesConfig | null {
  if (!amplifyOutputs) {
    return null;
  }

  try {
    const config: ResourcesConfig = {
      Auth: {
        Cognito: {
          userPoolId: amplifyOutputs.auth.user_pool_id,
          userPoolClientId: amplifyOutputs.auth.user_pool_client_id,
          identityPoolId: amplifyOutputs.auth.identity_pool_id,
          loginWith: {
            email: true,
          },
          signUpVerificationMethod: 'code',
          userAttributes: {
            email: {
              required: true,
            },
          },
          allowGuestAccess: amplifyOutputs.auth.unauthenticated_identities_enabled || false,
          passwordFormat: amplifyOutputs.auth.password_policy || {
            minLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialCharacters: true,
          },
        },
      },
      API: {
        GraphQL: {
          endpoint: amplifyOutputs.data.url,
          region: amplifyOutputs.data.aws_region,
          defaultAuthMode: amplifyOutputs.data.default_authorization_type === 'AMAZON_COGNITO_USER_POOLS'
            ? 'userPool'
            : 'apiKey',
          apiKey: amplifyOutputs.data.api_key,
        },
      },
    };

    return config;
  } catch (error) {
    console.error('Failed to create Amplify config from outputs:', error);
    return null;
  }
}

/**
 * 環境に応じたAmplify設定を取得
 * 
 * 学習ポイント:
 * - 環境モードによる自動切り替え
 * - フォールバック設定の提供
 * - エラーハンドリングと安全性
 * 
 * @param options - 設定オプション
 * @returns Amplify設定オブジェクト
 */
export function getAmplifyConfig(options: AmplifyConfigOptions = { mode: getCurrentEnvironmentMode() }): ResourcesConfig {
  const mode = options.mode || getCurrentEnvironmentMode();

  // ログ出力（開発時のみ）
  if (options.enableLogging !== false && process.env.NODE_ENV === 'development') {
    console.log(`🔧 Amplify Config Mode: ${mode}`);
  }

  switch (mode) {
    case 'MOCK':
      if (options.enableLogging !== false) {
        console.log('📱 Using mock Amplify configuration (Phase 1-2)');
      }
      return mockAmplifyConfig;

    case 'DEVELOPMENT':
    case 'PRODUCTION':
      const realConfig = createRealAmplifyConfig();
      if (realConfig) {
        if (options.enableLogging !== false) {
          console.log(`🚀 Using real Amplify configuration (${mode})`);
          console.log(`📍 Region: ${realConfig.API?.GraphQL?.region}`);
          console.log(`🔐 Auth: ${realConfig.Auth?.Cognito?.userPoolId}`);
        }
        return realConfig;
      } else {
        console.warn(`⚠️ Failed to load real config, falling back to mock (requested: ${mode})`);
        return mockAmplifyConfig;
      }

    default:
      console.warn(`⚠️ Unknown mode: ${mode}, using mock config`);
      return mockAmplifyConfig;
  }
}

/**
 * Amplify設定の検証
 * 
 * 学習ポイント:
 * - 設定値の妥当性確認
 * - 必須項目のチェック
 * - エラーの早期発見
 * 
 * @param config - 検証するAmplify設定
 * @returns 検証結果
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  mode: EnvironmentMode;
}

export function validateAmplifyConfig(config?: ResourcesConfig): ConfigValidationResult {
  const currentConfig = config || getAmplifyConfig();
  const mode = getCurrentEnvironmentMode();
  const errors: string[] = [];
  const warnings: string[] = [];

  // 認証設定の検証
  if (!currentConfig.Auth?.Cognito?.userPoolId) {
    errors.push('Missing User Pool ID');
  } else if (currentConfig.Auth.Cognito.userPoolId.startsWith('mock-')) {
    if (mode !== 'MOCK') {
      warnings.push('Using mock User Pool ID in non-mock mode');
    }
  }

  if (!currentConfig.Auth?.Cognito?.userPoolClientId) {
    errors.push('Missing User Pool Client ID');
  } else if (currentConfig.Auth.Cognito.userPoolClientId.startsWith('mock-')) {
    if (mode !== 'MOCK') {
      warnings.push('Using mock User Pool Client ID in non-mock mode');
    }
  }

  // API設定の検証
  if (!currentConfig.API?.GraphQL?.endpoint) {
    errors.push('Missing GraphQL endpoint');
  } else if (currentConfig.API.GraphQL.endpoint.includes('mock-api.example.com')) {
    if (mode !== 'MOCK') {
      warnings.push('Using mock GraphQL endpoint in non-mock mode');
    }
  }

  if (!currentConfig.API?.GraphQL?.region) {
    errors.push('Missing AWS region');
  }

  // モード固有の検証
  if (mode === 'PRODUCTION') {
    if (!currentConfig.API?.GraphQL?.apiKey && currentConfig.API?.GraphQL?.defaultAuthMode === 'apiKey') {
      warnings.push('API Key authentication in production mode');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    mode,
  };
}

/**
 * 設定情報の表示（デバッグ用）
 * 
 * 学習ポイント:
 * - 設定の可視化
 * - デバッグ情報の提供
 * - セキュリティ情報の保護
 */
export function displayConfigInfo(): void {
  const mode = getCurrentEnvironmentMode();
  const config = getAmplifyConfig();
  const validation = validateAmplifyConfig(config);

  console.group('🔧 Amplify Configuration Info');
  console.log(`Mode: ${mode}`);
  console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`);

  if (validation.errors.length > 0) {
    console.group('❌ Errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
    console.groupEnd();
  }

  if (validation.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
    console.groupEnd();
  }

  console.group('📋 Configuration:');
  console.log(`Region: ${config.API?.GraphQL?.region}`);
  console.log(`Auth Mode: ${config.API?.GraphQL?.defaultAuthMode}`);
  console.log(`User Pool: ${config.Auth?.Cognito?.userPoolId?.substring(0, 20)}...`);
  console.log(`Endpoint: ${config.API?.GraphQL?.endpoint?.substring(0, 50)}...`);
  console.groupEnd();

  console.groupEnd();
}

/**
 * 環境変数の設定ガイド
 * 
 * 学習ポイント:
 * - 環境変数の設定方法
 * - 開発者向けのガイダンス
 * - トラブルシューティング
 */
export function getEnvironmentSetupGuide(): string {
  const mode = getCurrentEnvironmentMode();

  if (mode === 'MOCK') {
    return `
🔧 Environment Setup Guide

Current Mode: MOCK (Phase 1-2 Development)

To switch to real AWS resources:
1. Run: npx ampx push
2. Copy values from amplify_outputs.json to .env.local:
   NEXT_PUBLIC_AWS_REGION=${amplifyOutputs?.data?.aws_region || 'your-region'}
   NEXT_PUBLIC_USER_POOL_ID=${amplifyOutputs?.auth?.user_pool_id || 'your-user-pool-id'}
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=${amplifyOutputs?.auth?.user_pool_client_id || 'your-client-id'}
   NEXT_PUBLIC_GRAPHQL_ENDPOINT=${amplifyOutputs?.data?.url || 'your-graphql-endpoint'}
   NEXT_PUBLIC_API_KEY=${amplifyOutputs?.data?.api_key || 'your-api-key'}

3. Restart your development server

Or set AMPLIFY_MODE=DEVELOPMENT to force development mode.
    `;
  }

  return `
✅ Environment Setup Complete

Current Mode: ${mode}
Region: ${amplifyOutputs?.data?.aws_region}
Status: Connected to AWS resources

To switch modes:
- AMPLIFY_MODE=MOCK (Phase 1-2: Mock data)
- AMPLIFY_MODE=DEVELOPMENT (Phase 3: Real AWS + Dev settings)  
- AMPLIFY_MODE=PRODUCTION (Phase 4-6: Real AWS + Prod settings)
  `;
}

// 開発環境での自動設定チェック
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // サーバーサイドでのみ実行
  const validation = validateAmplifyConfig();

  if (!validation.isValid || validation.warnings.length > 0) {
    console.log(getEnvironmentSetupGuide());

    if (validation.errors.length > 0) {
      console.warn('⚠️ Amplify configuration errors detected. Some features may not work correctly.');
    }
  }
}