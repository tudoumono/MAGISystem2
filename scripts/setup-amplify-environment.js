#!/usr/bin/env node

/**
 * Amplify Environment Setup Script
 * 
 * このスクリプトは開発者がPhase 1-2からPhase 3への移行を
 * 簡単に行えるように支援します。
 * 
 * 機能:
 * - 環境状態の診断
 * - Amplify デプロイの実行
 * - 環境変数の自動設定
 * - データシーディングの実行
 * - トラブルシューティング支援
 * 
 * 使用方法:
 * npm run setup:amplify
 * node scripts/setup-amplify-environment.js
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

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  colorLog('green', `✅ ${message}`);
}

function warning(message) {
  colorLog('yellow', `⚠️ ${message}`);
}

function error(message) {
  colorLog('red', `❌ ${message}`);
}

function info(message) {
  colorLog('blue', `ℹ️ ${message}`);
}

function header(message) {
  colorLog('cyan', `\n🚀 ${message}`);
  console.log('='.repeat(50));
}

// 環境状態の確認
function checkEnvironmentStatus() {
  header('Environment Status Check');
  
  const status = {
    hasAmplifyOutputs: false,
    hasNodeModules: false,
    hasAmplifyBackend: false,
    hasEnvTemplate: false,
    currentMode: 'MOCK',
  };

  // amplify_outputs.json の確認
  const amplifyOutputsPath = path.join(process.cwd(), 'amplify_outputs.json');
  if (fs.existsSync(amplifyOutputsPath)) {
    status.hasAmplifyOutputs = true;
    success('amplify_outputs.json found');
    
    try {
      const outputs = JSON.parse(fs.readFileSync(amplifyOutputsPath, 'utf8'));
      info(`Region: ${outputs.data?.aws_region || 'unknown'}`);
      info(`User Pool: ${outputs.auth?.user_pool_id || 'unknown'}`);
    } catch (err) {
      warning('amplify_outputs.json exists but could not be parsed');
    }
  } else {
    warning('amplify_outputs.json not found - AWS resources not deployed');
  }

  // node_modules の確認
  if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    status.hasNodeModules = true;
    success('node_modules found');
  } else {
    error('node_modules not found - run npm install first');
  }

  // amplify backend の確認
  if (fs.existsSync(path.join(process.cwd(), 'amplify'))) {
    status.hasAmplifyBackend = true;
    success('Amplify backend configuration found');
  } else {
    error('Amplify backend configuration not found');
  }

  // .env.local.template の確認
  if (fs.existsSync(path.join(process.cwd(), '.env.local.template'))) {
    status.hasEnvTemplate = true;
    success('.env.local.template found');
  } else {
    warning('.env.local.template not found');
  }

  // 現在のモードの判定
  if (status.hasAmplifyOutputs) {
    status.currentMode = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
  }

  info(`Current mode: ${status.currentMode}`);
  
  return status;
}

// 依存関係のチェック
function checkDependencies() {
  header('Dependencies Check');
  
  try {
    // Node.js バージョンの確認
    const nodeVersion = process.version;
    info(`Node.js version: ${nodeVersion}`);
    
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      error('Node.js 18 or higher is required');
      return false;
    }
    success('Node.js version is compatible');

    // npm の確認
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      info(`npm version: ${npmVersion}`);
      success('npm is available');
    } catch (err) {
      error('npm is not available');
      return false;
    }

    // Amplify CLI の確認
    try {
      execSync('npx ampx --version', { encoding: 'utf8', stdio: 'pipe' });
      success('Amplify CLI is available');
    } catch (err) {
      warning('Amplify CLI not found - will be installed automatically');
    }

    return true;
  } catch (err) {
    error(`Dependency check failed: ${err.message}`);
    return false;
  }
}

// AWS リソースのデプロイ
async function deployAWSResources() {
  header('AWS Resources Deployment');
  
  try {
    info('Starting Amplify deployment...');
    info('This may take 5-10 minutes. Please wait...');
    
    // Amplify sandbox の実行
    execSync('npx ampx sandbox --once', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    success('AWS resources deployed successfully');
    return true;
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your AWS credentials: aws configure list');
    console.log('2. Verify AWS CLI is installed and configured');
    console.log('3. Check your internet connection');
    console.log('4. Try running: npx ampx push --debug');
    return false;
  }
}

// 環境変数の設定
function setupEnvironmentVariables() {
  header('Environment Variables Setup');
  
  const amplifyOutputsPath = path.join(process.cwd(), 'amplify_outputs.json');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(amplifyOutputsPath)) {
    error('amplify_outputs.json not found - deploy AWS resources first');
    return false;
  }

  try {
    const outputs = JSON.parse(fs.readFileSync(amplifyOutputsPath, 'utf8'));
    
    const envVars = [
      `# Generated by setup-amplify-environment.js on ${new Date().toISOString()}`,
      `NEXT_PUBLIC_AWS_REGION=${outputs.data?.aws_region || ''}`,
      `NEXT_PUBLIC_USER_POOL_ID=${outputs.auth?.user_pool_id || ''}`,
      `NEXT_PUBLIC_USER_POOL_CLIENT_ID=${outputs.auth?.user_pool_client_id || ''}`,
      `NEXT_PUBLIC_IDENTITY_POOL_ID=${outputs.auth?.identity_pool_id || ''}`,
      `NEXT_PUBLIC_GRAPHQL_ENDPOINT=${outputs.data?.url || ''}`,
      `NEXT_PUBLIC_API_KEY=${outputs.data?.api_key || ''}`,
      '',
      '# Set to DEVELOPMENT to use real AWS resources',
      '# Set to MOCK to use mock data (Phase 1-2)',
      'AMPLIFY_MODE=DEVELOPMENT',
      '',
    ].join('\n');

    // 既存の .env.local をバックアップ
    if (fs.existsSync(envLocalPath)) {
      const backupPath = `${envLocalPath}.backup.${Date.now()}`;
      fs.copyFileSync(envLocalPath, backupPath);
      info(`Existing .env.local backed up to ${path.basename(backupPath)}`);
    }

    fs.writeFileSync(envLocalPath, envVars);
    success('.env.local created with AWS resource configuration');
    
    info('Environment variables set:');
    console.log(`  NEXT_PUBLIC_AWS_REGION=${outputs.data?.aws_region}`);
    console.log(`  NEXT_PUBLIC_USER_POOL_ID=${outputs.auth?.user_pool_id}`);
    console.log(`  AMPLIFY_MODE=DEVELOPMENT`);
    
    return true;
  } catch (err) {
    error(`Environment setup failed: ${err.message}`);
    return false;
  }
}

// メイン実行関数
async function main() {
  console.log(`
🎯 MAGI Decision System - Amplify Environment Setup
==================================================

This script will help you transition from Phase 1-2 (mock data) 
to Phase 3 (real AWS resources).

What this script does:
1. Check your environment and dependencies
2. Deploy AWS resources using Amplify
3. Configure environment variables
4. Provide next steps for development

Let's get started!
`);

  // 1. 環境状態の確認
  const status = checkEnvironmentStatus();
  
  if (!status.hasNodeModules) {
    error('Please run "npm install" first');
    process.exit(1);
  }

  if (!status.hasAmplifyBackend) {
    error('Amplify backend configuration not found');
    error('Make sure you are in the correct project directory');
    process.exit(1);
  }

  // 2. 依存関係のチェック
  if (!checkDependencies()) {
    error('Dependency check failed');
    process.exit(1);
  }

  // 3. AWS リソースのデプロイ（必要な場合）
  if (!status.hasAmplifyOutputs) {
    console.log('\n📋 AWS resources need to be deployed.');
    console.log('This will create:');
    console.log('  - Amazon Cognito User Pool (Authentication)');
    console.log('  - Amazon DynamoDB Tables (Data Storage)');
    console.log('  - AWS AppSync GraphQL API (Real-time Data)');
    console.log('  - IAM Roles and Policies (Security)');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question('\nProceed with AWS deployment? (y/N): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      info('Deployment cancelled by user');
      process.exit(0);
    }

    if (!(await deployAWSResources())) {
      error('AWS deployment failed');
      process.exit(1);
    }
  } else {
    success('AWS resources already deployed');
  }

  // 4. 環境変数の設定
  if (!setupEnvironmentVariables()) {
    error('Environment variable setup failed');
    process.exit(1);
  }

  // 5. 完了メッセージと次のステップ
  header('Setup Complete! 🎉');
  
  success('Your development environment is ready!');
  
  console.log(`
📋 What's been set up:
  ✅ AWS resources deployed
  ✅ Environment variables configured
  ✅ Development mode enabled

🚀 Next Steps:
  1. Restart your development server:
     npm run dev

  2. Open your browser and navigate to the app

  3. Sign up for a new account or sign in

  4. Explore the MAGI Decision System with real data!

💡 Useful Commands:
  npm run amplify:status    # Check AWS resource status
  npm run amplify:logs      # View AWS logs
  npm run check:amplify     # Validate setup

🔧 Troubleshooting:
  - If you see errors, check the AWS Console
  - Make sure your AWS credentials are configured
  - Check CloudWatch logs for detailed error information

Happy coding! 🚀
`);
}

// エラーハンドリング
process.on('uncaughtException', (err) => {
  error(`Uncaught exception: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// スクリプト実行
if (require.main === module) {
  main().catch(err => {
    error(`Setup failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkEnvironmentStatus,
  checkDependencies,
  deployAWSResources,
  setupEnvironmentVariables,
};