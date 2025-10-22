#!/usr/bin/env node

/**
 * Amplify Setup Checker - Amplify設定状況の確認スクリプト
 * 
 * 目的: 現在のAmplify設定状況を確認し、次のステップを案内
 * 設計理由: 開発者が現在の状況を把握し、適切な次のアクションを取れるようにする
 * 
 * 実行方法:
 * ```bash
 * node scripts/check-amplify-setup.js
 * npm run check:amplify
 * ```
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// カラー出力用のユーティリティ
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function logSection(title) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(`📋 ${title}`, 'cyan'));
  console.log(colorize('='.repeat(60), 'cyan'));
}

function logStep(step, status, description) {
  const statusIcon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  const statusColor = status === 'success' ? 'green' : status === 'warning' ? 'yellow' : 'red';
  
  console.log(`${statusIcon} ${colorize(step, 'bright')}`);
  if (description) {
    console.log(`   ${colorize(description, statusColor)}`);
  }
}

// ファイルパスの定義
const paths = {
  amplifyOutputs: path.join(process.cwd(), 'amplify_outputs.json'),
  amplifyBackend: path.join(process.cwd(), 'amplify', 'backend.ts'),
  amplifyData: path.join(process.cwd(), 'amplify', 'data', 'resource.ts'),
  envLocal: path.join(process.cwd(), '.env.local'),
  envTemplate: path.join(process.cwd(), '.env.local.template'),
  packageJson: path.join(process.cwd(), 'package.json'),
  generatedTypes: path.join(process.cwd(), 'src', 'types', 'amplify-generated.ts'),
};

/**
 * 現在のフェーズを判定
 */
function determineCurrentPhase() {
  const hasAmplifyOutputs = fs.existsSync(paths.amplifyOutputs);
  const hasGeneratedTypes = fs.existsSync(paths.generatedTypes);
  const hasEnvFile = fs.existsSync(paths.envLocal);
  
  if (!hasAmplifyOutputs) {
    return {
      phase: 'Phase 1-2',
      description: 'モックデータ開発フェーズ',
      color: 'blue'
    };
  } else if (hasAmplifyOutputs && !hasGeneratedTypes) {
    return {
      phase: 'Phase 2-3 移行期',
      description: 'Amplifyデプロイ済み、型生成待ち',
      color: 'yellow'
    };
  } else if (hasAmplifyOutputs && hasGeneratedTypes) {
    return {
      phase: 'Phase 3+',
      description: '実データ統合フェーズ',
      color: 'green'
    };
  } else {
    return {
      phase: '不明',
      description: '設定状況を確認してください',
      color: 'red'
    };
  }
}

/**
 * Amplify設定の確認
 */
function checkAmplifySetup() {
  logSection('Amplify設定状況');
  
  // backend.ts の確認
  if (fs.existsSync(paths.amplifyBackend)) {
    logStep('Amplify Backend設定', 'success', 'amplify/backend.ts が存在します');
  } else {
    logStep('Amplify Backend設定', 'error', 'amplify/backend.ts が見つかりません');
  }
  
  // data/resource.ts の確認
  if (fs.existsSync(paths.amplifyData)) {
    logStep('Amplify Data設定', 'success', 'amplify/data/resource.ts が存在します');
    
    // スキーマの内容確認
    try {
      const dataContent = fs.readFileSync(paths.amplifyData, 'utf-8');
      const hasModels = ['User', 'Conversation', 'Message', 'TraceStep', 'AgentPreset']
        .every(model => dataContent.includes(model));
      
      if (hasModels) {
        logStep('データモデル定義', 'success', '全ての必要なモデルが定義されています');
      } else {
        logStep('データモデル定義', 'warning', '一部のモデルが不足している可能性があります');
      }
    } catch (error) {
      logStep('データモデル定義', 'error', 'スキーマファイルの読み込みに失敗しました');
    }
  } else {
    logStep('Amplify Data設定', 'error', 'amplify/data/resource.ts が見つかりません');
  }
  
  // amplify_outputs.json の確認
  if (fs.existsSync(paths.amplifyOutputs)) {
    logStep('Amplifyリソース', 'success', 'AWSリソースがデプロイされています');
    
    try {
      const outputs = JSON.parse(fs.readFileSync(paths.amplifyOutputs, 'utf-8'));
      if (outputs.auth && outputs.data) {
        logStep('リソース設定', 'success', '認証とデータAPIが設定されています');
      } else {
        logStep('リソース設定', 'warning', '一部のリソースが不足しています');
      }
    } catch (error) {
      logStep('リソース設定', 'error', 'amplify_outputs.json の解析に失敗しました');
    }
  } else {
    logStep('Amplifyリソース', 'warning', 'AWSリソースがデプロイされていません');
    log('   💡 次のコマンドでデプロイできます: npx ampx push', 'yellow');
  }
}

/**
 * 環境変数の確認
 */
function checkEnvironmentVariables() {
  logSection('環境変数設定');
  
  // .env.local の確認
  if (fs.existsSync(paths.envLocal)) {
    logStep('環境変数ファイル', 'success', '.env.local が存在します');
    
    try {
      const envContent = fs.readFileSync(paths.envLocal, 'utf-8');
      const requiredVars = [
        'NEXT_PUBLIC_USER_POOL_ID',
        'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
        'NEXT_PUBLIC_GRAPHQL_ENDPOINT'
      ];
      
      const missingVars = requiredVars.filter(varName => 
        !envContent.includes(varName) || envContent.includes(`${varName}=mock-`)
      );
      
      if (missingVars.length === 0) {
        logStep('必須環境変数', 'success', '全ての必須変数が設定されています');
      } else if (missingVars.length === requiredVars.length) {
        logStep('必須環境変数', 'warning', 'モック値が設定されています（Phase 1-2用）');
      } else {
        logStep('必須環境変数', 'warning', `不足: ${missingVars.join(', ')}`);
      }
    } catch (error) {
      logStep('環境変数内容', 'error', '.env.local の読み込みに失敗しました');
    }
  } else {
    logStep('環境変数ファイル', 'warning', '.env.local が見つかりません');
    
    if (fs.existsSync(paths.envTemplate)) {
      log('   💡 テンプレートをコピーできます: cp .env.local.template .env.local', 'yellow');
    }
  }
}

/**
 * 型生成の確認
 */
function checkTypeGeneration() {
  logSection('TypeScript型生成');
  
  // 手動型定義の確認
  const manualTypesPath = path.join(process.cwd(), 'src', 'types', 'amplify.ts');
  if (fs.existsSync(manualTypesPath)) {
    logStep('手動型定義', 'success', 'src/types/amplify.ts が存在します（Phase 1-2用）');
  } else {
    logStep('手動型定義', 'error', 'src/types/amplify.ts が見つかりません');
  }
  
  // 生成された型の確認
  if (fs.existsSync(paths.generatedTypes)) {
    logStep('生成された型', 'success', 'Amplify codegenで生成された型が存在します');
  } else {
    logStep('生成された型', 'warning', 'Amplify codegenで生成された型がありません');
    
    if (fs.existsSync(paths.amplifyOutputs)) {
      log('   💡 次のコマンドで生成できます: npx ampx generate graphql-client-code --format modelgen --model-target typescript', 'yellow');
    } else {
      log('   💡 まず Amplify リソースをデプロイしてください: npx ampx push', 'yellow');
    }
  }
}

/**
 * カスタムフックの確認
 */
function checkCustomHooks() {
  logSection('カスタムフック実装');
  
  const hooksPath = path.join(process.cwd(), 'src', 'hooks');
  const expectedHooks = [
    'useConversations.ts',
    'useMessages.ts',
    'index.ts'
  ];
  
  expectedHooks.forEach(hookFile => {
    const hookPath = path.join(hooksPath, hookFile);
    if (fs.existsSync(hookPath)) {
      logStep(`${hookFile}`, 'success', 'カスタムフックが実装されています');
    } else {
      logStep(`${hookFile}`, 'error', 'カスタムフックが見つかりません');
    }
  });
}

/**
 * 依存関係の確認
 */
function checkDependencies() {
  logSection('依存関係');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(paths.packageJson, 'utf-8'));
    const requiredDeps = [
      '@aws-amplify/backend',
      '@aws-amplify/backend-cli',
      'aws-amplify'
    ];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length === 0) {
      logStep('Amplify依存関係', 'success', '必要なパッケージがインストールされています');
    } else {
      logStep('Amplify依存関係', 'error', `不足: ${missingDeps.join(', ')}`);
    }
    
    // スクリプトの確認
    const hasAmplifyScripts = packageJson.scripts && 
      (packageJson.scripts['amplify:push'] || packageJson.scripts['ampx:push']);
    
    if (hasAmplifyScripts) {
      logStep('NPMスクリプト', 'success', 'Amplify用スクリプトが設定されています');
    } else {
      logStep('NPMスクリプト', 'warning', 'Amplify用スクリプトが不足しています');
    }
  } catch (error) {
    logStep('package.json', 'error', 'package.json の読み込みに失敗しました');
  }
}

/**
 * 次のステップの案内
 */
function showNextSteps(currentPhase) {
  logSection('次のステップ');
  
  switch (currentPhase.phase) {
    case 'Phase 1-2':
      log('📝 現在のフェーズ: モックデータ開発', 'blue');
      log('   ✨ UIコンポーネントとユーザー体験に集中できます', 'blue');
      log('');
      log('🚀 Phase 3への移行手順:', 'bright');
      log('   1. npx ampx push                    # AWSリソースをデプロイ', 'yellow');
      log('   2. npx ampx generate graphql-client-code --format modelgen --model-target typescript', 'yellow');
      log('   3. 環境変数を実際の値に更新', 'yellow');
      log('   4. フック内のコメントアウトを解除', 'yellow');
      break;
      
    case 'Phase 2-3 移行期':
      log('📝 現在のフェーズ: Amplifyデプロイ済み、型生成待ち', 'yellow');
      log('');
      log('🚀 完了すべきタスク:', 'bright');
      log('   1. npx ampx generate graphql-client-code --format modelgen --model-target typescript', 'yellow');
      log('   2. 生成された型ファイルの確認', 'yellow');
      log('   3. カスタムフック内の実装切り替え', 'yellow');
      break;
      
    case 'Phase 3+':
      log('📝 現在のフェーズ: 実データ統合フェーズ', 'green');
      log('   ✨ 実際のAmplify APIを使用できます', 'green');
      log('');
      log('🚀 次の開発ステップ:', 'bright');
      log('   1. 認証UIコンポーネントの実装', 'green');
      log('   2. エージェント統合の準備', 'green');
      log('   3. リアルタイム機能のテスト', 'green');
      break;
      
    default:
      log('❓ 設定状況が不明です', 'red');
      log('   上記のエラーを解決してから再実行してください', 'red');
  }
}

/**
 * 開発者向けのヒント
 */
function showDeveloperTips() {
  logSection('開発者向けヒント');
  
  log('🔧 便利なコマンド:', 'bright');
  log('   npm run dev                          # 開発サーバー起動', 'cyan');
  log('   npx ampx status                      # Amplify状況確認', 'cyan');
  log('   npx ampx logs                        # Amplifyログ確認', 'cyan');
  log('   npm run type-check                   # TypeScript型チェック', 'cyan');
  log('');
  
  log('📚 学習リソース:', 'bright');
  log('   src/hooks/README.md                  # カスタムフック実装ガイド', 'cyan');
  log('   docs/learning/                       # 学習ドキュメント', 'cyan');
  log('   amplify/data/resource.ts             # データスキーマ定義', 'cyan');
  log('');
  
  log('🐛 トラブルシューティング:', 'bright');
  log('   - 型エラーが発生する場合: npm run type-check', 'cyan');
  log('   - Amplifyエラーが発生する場合: npx ampx status', 'cyan');
  log('   - 環境変数の問題: .env.local の内容を確認', 'cyan');
}

/**
 * メイン実行関数
 */
function main() {
  console.clear();
  
  log('🎯 MAGI Decision System - Amplify設定チェッカー', 'magenta');
  log('Task 2.2: TypeScript型とAPIクライアントの生成状況確認', 'magenta');
  
  // 現在のフェーズを判定
  const currentPhase = determineCurrentPhase();
  
  log(`\n📊 現在のフェーズ: ${colorize(currentPhase.phase, currentPhase.color)}`);
  log(`   ${currentPhase.description}`);
  
  // 各種チェックを実行
  checkAmplifySetup();
  checkEnvironmentVariables();
  checkTypeGeneration();
  checkCustomHooks();
  checkDependencies();
  
  // 次のステップを案内
  showNextSteps(currentPhase);
  showDeveloperTips();
  
  log('\n' + colorize('🎉 チェック完了！', 'green'));
  log('質問がある場合は、src/hooks/README.md を参照してください。', 'green');
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = {
  determineCurrentPhase,
  checkAmplifySetup,
  checkEnvironmentVariables,
  checkTypeGeneration,
  checkCustomHooks,
  checkDependencies,
};