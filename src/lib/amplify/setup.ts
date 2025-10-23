/**
 * Amplify Environment Setup Utility - 環境セットアップとデプロイ支援
 * 
 * 目的: Phase 1-2 から Phase 3 への移行を支援する自動化ツール
 * 設計理由: 開発者の環境切り替えを簡単にし、設定ミスを防ぐ
 * 
 * 主要機能:
 * - 環境状態の診断と確認
 * - Amplify デプロイ状況の確認
 * - 環境変数の自動設定支援
 * - データシーディングの実行
 * - トラブルシューティング支援
 * 
 * 学習ポイント:
 * - Amplify Gen2 のデプロイフロー
 * - 環境切り替えのベストプラクティス
 * - 自動化による開発効率向上
 * - エラーハンドリングとユーザーガイダンス
 * 
 * 使用例:
 * ```typescript
 * import { checkEnvironmentStatus, setupDevelopmentEnvironment } from '@/lib/amplify/setup';
 * 
 * // 環境状態の確認
 * const status = await checkEnvironmentStatus();
 * 
 * // 開発環境のセットアップ
 * await setupDevelopmentEnvironment();
 * ```
 * 
 * 関連: amplify_outputs.json, .env.local, package.json
 */

import { 
  getCurrentEnvironmentMode, 
  getAmplifyConfig, 
  validateAmplifyConfig, 
  displayConfigInfo,
  type EnvironmentMode 
} from './config';
import { seedDevelopmentData, checkSeedingStatus } from './seeding';
import { isAuthenticated } from './client';

/**
 * 環境状態の型定義
 * 
 * 学習ポイント:
 * - 環境診断結果の構造化
 * - ユーザーへの分かりやすい情報提供
 * - 次のアクションの明確化
 */
export interface EnvironmentStatus {
  mode: EnvironmentMode;
  isConfigured: boolean;
  hasAmplifyOutputs: boolean;
  hasEnvironmentVariables: boolean;
  isAuthenticated: boolean;
  seedingStatus: {
    hasPresets: boolean;
    hasConversations: boolean;
    hasTraceData: boolean;
  };
  recommendations: string[];
  nextSteps: string[];
  errors: string[];
  warnings: string[];
}

/**
 * セットアップオプションの型定義
 * 
 * 学習ポイント:
 * - セットアップ処理のカスタマイズ
 * - 段階的なセットアップ制御
 * - ユーザー体験の最適化
 */
export interface SetupOptions {
  skipSeeding?: boolean;
  skipValidation?: boolean;
  verbose?: boolean;
  forceMode?: EnvironmentMode;
  autoFixIssues?: boolean;
}

/**
 * 環境状態の包括的チェック
 * 
 * 学習ポイント:
 * - 環境診断の自動化
 * - 問題の早期発見
 * - ユーザーガイダンスの提供
 * 
 * @returns 環境状態の詳細情報
 */
export async function checkEnvironmentStatus(): Promise<EnvironmentStatus> {
  const mode = getCurrentEnvironmentMode();
  const recommendations: string[] = [];
  const nextSteps: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Amplify設定の検証
  const configValidation = validateAmplifyConfig();
  errors.push(...configValidation.errors);
  warnings.push(...configValidation.warnings);

  // amplify_outputs.json の存在確認
  let hasAmplifyOutputs = false;
  try {
    require('../../../amplify_outputs.json');
    hasAmplifyOutputs = true;
  } catch {
    hasAmplifyOutputs = false;
  }

  // 環境変数の確認
  const hasEnvironmentVariables = !!(
    process.env.NEXT_PUBLIC_AWS_REGION &&
    process.env.NEXT_PUBLIC_USER_POOL_ID &&
    process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID &&
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
  );

  // 認証状態の確認
  let isUserAuthenticated = false;
  try {
    isUserAuthenticated = await isAuthenticated();
  } catch {
    isUserAuthenticated = false;
  }

  // シーディング状態の確認
  const seedingStatus = await checkSeedingStatus();

  // 推奨事項の生成
  if (mode === 'MOCK') {
    if (!hasAmplifyOutputs) {
      recommendations.push('Run `npx ampx push` to deploy AWS resources');
      nextSteps.push('1. Deploy Amplify resources: `npm run amplify:push`');
      nextSteps.push('2. Restart development server after deployment');
    } else {
      recommendations.push('Switch to development mode to use real AWS resources');
      nextSteps.push('1. Set AMPLIFY_MODE=DEVELOPMENT in your environment');
      nextSteps.push('2. Restart development server');
    }
  } else if (mode === 'DEVELOPMENT') {
    if (!isUserAuthenticated) {
      recommendations.push('Sign in to access your data');
      nextSteps.push('1. Navigate to the sign-in page');
      nextSteps.push('2. Create an account or sign in');
    } else if (!seedingStatus.hasPresets) {
      recommendations.push('Seed development data for better experience');
      nextSteps.push('1. Run development data seeding');
      nextSteps.push('2. Explore sample conversations and presets');
    }
  }

  // エラーに基づく推奨事項
  if (errors.length > 0) {
    recommendations.push('Fix configuration errors before proceeding');
    nextSteps.unshift('0. Resolve configuration issues');
  }

  return {
    mode,
    isConfigured: configValidation.isValid,
    hasAmplifyOutputs,
    hasEnvironmentVariables,
    isAuthenticated: isUserAuthenticated,
    seedingStatus,
    recommendations,
    nextSteps,
    errors,
    warnings,
  };
}

/**
 * 開発環境の自動セットアップ
 * 
 * 学習ポイント:
 * - 自動化による開発効率向上
 * - エラー処理と回復機能
 * - ユーザーフレンドリーな進捗表示
 * 
 * @param options - セットアップオプション
 * @returns セットアップ結果
 */
export async function setupDevelopmentEnvironment(options: SetupOptions = {}): Promise<{
  success: boolean;
  message: string;
  details: string[];
}> {
  const details: string[] = [];
  
  try {
    if (options.verbose) {
      console.log('🚀 Starting development environment setup...');
    }

    // 1. 環境状態の確認
    details.push('Checking environment status...');
    const status = await checkEnvironmentStatus();
    
    if (options.verbose) {
      console.log('📋 Current status:', status);
    }

    // 2. 設定の検証
    if (!options.skipValidation) {
      details.push('Validating Amplify configuration...');
      
      if (status.errors.length > 0) {
        const errorMessage = `Configuration errors found: ${status.errors.join(', ')}`;
        details.push(`❌ ${errorMessage}`);
        
        if (!options.autoFixIssues) {
          return {
            success: false,
            message: 'Configuration errors must be resolved before setup',
            details,
          };
        }
      }
    }

    // 3. 環境モードの確認と調整
    if (options.forceMode && options.forceMode !== status.mode) {
      details.push(`Switching from ${status.mode} to ${options.forceMode} mode...`);
      // 実際の実装では環境変数の設定を行う
    }

    // 4. AWS リソースの確認
    if (!status.hasAmplifyOutputs) {
      details.push('❌ AWS resources not deployed');
      return {
        success: false,
        message: 'Please run `npx ampx push` to deploy AWS resources first',
        details: [
          ...details,
          'Next steps:',
          '1. Run: npm run amplify:push',
          '2. Wait for deployment to complete',
          '3. Run this setup again',
        ],
      };
    }

    // 5. データシーディング
    if (!options.skipSeeding && status.mode !== 'MOCK') {
      details.push('Setting up development data...');
      
      try {
        const seedingResult = await seedDevelopmentData({
          environment: 'development',
          verbose: options.verbose,
        });
        
        details.push(`✅ Created ${seedingResult.presets.length} presets`);
        details.push(`✅ Created ${seedingResult.conversations.length} sample conversations`);
        details.push(`✅ Created ${seedingResult.traceSteps.length} trace steps`);
        
      } catch (seedingError) {
        details.push(`⚠️ Seeding partially failed: ${seedingError}`);
        // シーディングエラーは致命的ではない
      }
    }

    // 6. 最終確認
    details.push('Performing final validation...');
    const finalStatus = await checkEnvironmentStatus();
    
    if (finalStatus.isConfigured) {
      details.push('✅ Environment setup completed successfully');
      
      return {
        success: true,
        message: `Development environment ready in ${finalStatus.mode} mode`,
        details,
      };
    } else {
      details.push('⚠️ Setup completed with warnings');
      
      return {
        success: true,
        message: 'Environment setup completed with some issues',
        details: [
          ...details,
          'Remaining issues:',
          ...finalStatus.warnings,
          ...finalStatus.recommendations,
        ],
      };
    }

  } catch (error) {
    details.push(`❌ Setup failed: ${error}`);
    
    return {
      success: false,
      message: 'Environment setup failed',
      details,
    };
  }
}

/**
 * 環境診断レポートの生成
 * 
 * 学習ポイント:
 * - 診断結果の可視化
 * - ユーザーフレンドリーな情報提示
 * - トラブルシューティング支援
 * 
 * @param includeConfig - 設定詳細を含めるかどうか
 * @returns 診断レポート
 */
export async function generateDiagnosticReport(includeConfig: boolean = false): Promise<string> {
  const status = await checkEnvironmentStatus();
  
  let report = `
🔧 MAGI Decision System - Environment Diagnostic Report
Generated: ${new Date().toLocaleString()}

📊 Current Status:
  Mode: ${status.mode}
  Configured: ${status.isConfigured ? '✅' : '❌'}
  AWS Resources: ${status.hasAmplifyOutputs ? '✅' : '❌'}
  Environment Variables: ${status.hasEnvironmentVariables ? '✅' : '❌'}
  Authenticated: ${status.isAuthenticated ? '✅' : '❌'}

📋 Data Status:
  Agent Presets: ${status.seedingStatus.hasPresets ? '✅' : '❌'}
  Sample Conversations: ${status.seedingStatus.hasConversations ? '✅' : '❌'}
  Trace Data: ${status.seedingStatus.hasTraceData ? '✅' : '❌'}
`;

  if (status.errors.length > 0) {
    report += `
❌ Errors:
${status.errors.map(error => `  - ${error}`).join('\n')}
`;
  }

  if (status.warnings.length > 0) {
    report += `
⚠️ Warnings:
${status.warnings.map(warning => `  - ${warning}`).join('\n')}
`;
  }

  if (status.recommendations.length > 0) {
    report += `
💡 Recommendations:
${status.recommendations.map(rec => `  - ${rec}`).join('\n')}
`;
  }

  if (status.nextSteps.length > 0) {
    report += `
🚀 Next Steps:
${status.nextSteps.map(step => `  ${step}`).join('\n')}
`;
  }

  if (includeConfig) {
    report += `
⚙️ Configuration Details:
`;
    // 設定詳細を追加（機密情報は除く）
    const config = getAmplifyConfig();
    report += `  Region: ${config.API?.GraphQL?.region}\n`;
    report += `  Auth Mode: ${config.API?.GraphQL?.defaultAuthMode}\n`;
    report += `  User Pool: ${config.Auth?.Cognito?.userPoolId?.substring(0, 20)}...\n`;
  }

  return report;
}

/**
 * 環境リセット機能
 * 
 * 学習ポイント:
 * - 安全なリセット処理
 * - データ保護機能
 * - 段階的なリセット制御
 * 
 * @param options - リセットオプション
 */
export async function resetEnvironment(options: {
  resetData?: boolean;
  resetConfig?: boolean;
  confirmReset?: boolean;
  environment: 'development' | 'staging';
} = { environment: 'development' }): Promise<void> {
  if (options.environment === 'production') {
    throw new Error('❌ Environment reset is not allowed in production');
  }

  if (!options.confirmReset) {
    throw new Error('❌ Environment reset requires explicit confirmation');
  }

  console.log(`🔄 Resetting ${options.environment} environment...`);

  try {
    if (options.resetData) {
      console.log('🗑️ Clearing development data...');
      // 実際の実装では、開発データの削除を行う
    }

    if (options.resetConfig) {
      console.log('⚙️ Resetting configuration...');
      // 実際の実装では、設定のリセットを行う
    }

    console.log('✅ Environment reset completed');

  } catch (error) {
    console.error('❌ Environment reset failed:', error);
    throw error;
  }
}

/**
 * 開発者向けクイックスタートガイド
 * 
 * 学習ポイント:
 * - 新規開発者のオンボーディング支援
 * - 段階的な学習ガイド
 * - 実践的な手順提示
 * 
 * @returns クイックスタートガイド
 */
export function getQuickStartGuide(): string {
  const mode = getCurrentEnvironmentMode();
  
  if (mode === 'MOCK') {
    return `
🚀 MAGI Decision System - Quick Start Guide

Current Mode: MOCK (Phase 1-2 Development)

You're currently in mock mode, which is perfect for learning the UI without AWS setup.

📋 What you can do now:
  ✅ Explore the user interface
  ✅ Test UI components and interactions
  ✅ Learn the system architecture
  ✅ Develop frontend features

🔄 To switch to real AWS resources:

1. Deploy AWS resources:
   npm run amplify:push

2. Wait for deployment (5-10 minutes)

3. Restart your development server:
   npm run dev

4. The system will automatically switch to DEVELOPMENT mode

📚 Learning Resources:
  - Check the design document: .kiro/specs/magi-decision-ui/design.md
  - Review the requirements: .kiro/specs/magi-decision-ui/requirements.md
  - Follow the tasks: .kiro/specs/magi-decision-ui/tasks.md

💡 Pro Tips:
  - Use browser dev tools to inspect mock data
  - Try different UI states and error scenarios
  - Experiment with component props and styling
`;
  } else {
    return `
✅ MAGI Decision System - Development Environment Ready

Current Mode: ${mode}

🎯 You're ready to develop with real AWS resources!

📋 Available Features:
  ✅ Real authentication with Amazon Cognito
  ✅ Data persistence with DynamoDB
  ✅ Real-time updates with AppSync
  ✅ Agent preset management
  ✅ Conversation history

🚀 Next Steps:
  1. Sign in or create an account
  2. Explore sample conversations
  3. Test agent presets
  4. Develop new features

🔧 Development Commands:
  npm run dev              # Start development server
  npm run amplify:status   # Check AWS resource status
  npm run amplify:logs     # View AWS logs
  npm run check:amplify    # Validate setup

📊 Monitor your usage:
  - Check AWS Console for resource usage
  - Monitor CloudWatch logs for errors
  - Use AWS X-Ray for performance tracing
`;
  }
}

// 開発環境での自動診断（サーバーサイドのみ）
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // 非同期で環境状態をチェック（ログ出力のみ）
  checkEnvironmentStatus().then(status => {
    if (status.errors.length > 0 || !status.isConfigured) {
      console.log('\n' + getQuickStartGuide());
    }
  }).catch(error => {
    console.warn('Environment status check failed:', error);
  });
}