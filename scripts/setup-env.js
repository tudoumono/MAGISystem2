#!/usr/bin/env node

/**
 * 環境変数自動設定スクリプト
 * 
 * amplify_outputs.json から環境変数を抽出し、.env.local に設定
 */

const fs = require('fs');
const path = require('path');

const AMPLIFY_OUTPUTS_PATH = path.join(__dirname, '..', 'amplify_outputs.json');
const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

function setupEnvironmentVariables() {
  try {
    console.log('🚀 MAGI Decision System - 環境変数自動設定');
    console.log('================================================\n');

    // amplify_outputs.json の読み込み
    if (!fs.existsSync(AMPLIFY_OUTPUTS_PATH)) {
      console.error('❌ amplify_outputs.json が見つかりません。');
      console.error('   まず `npx ampx push` を実行してください。');
      process.exit(1);
    }

    console.log('📁 amplify_outputs.json を読み込み中...');
    const amplifyOutputs = JSON.parse(fs.readFileSync(AMPLIFY_OUTPUTS_PATH, 'utf8'));
    
    // 環境変数の抽出
    const envVars = {
      NEXT_PUBLIC_AWS_REGION: amplifyOutputs.auth?.aws_region || 'ap-northeast-1',
      NEXT_PUBLIC_USER_POOL_ID: amplifyOutputs.auth?.user_pool_id,
      NEXT_PUBLIC_USER_POOL_CLIENT_ID: amplifyOutputs.auth?.user_pool_client_id,
      NEXT_PUBLIC_IDENTITY_POOL_ID: amplifyOutputs.auth?.identity_pool_id,
      NEXT_PUBLIC_GRAPHQL_ENDPOINT: amplifyOutputs.data?.url,
      NEXT_PUBLIC_API_KEY: amplifyOutputs.data?.api_key,
    };

    // 必須項目のチェック
    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('❌ 以下の環境変数が取得できませんでした:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\n💡 考えられる原因:');
      console.error('   1. Amplify デプロイが完了していない');
      console.error('   2. amplify_outputs.json の形式が異なる');
      console.error('   3. 必要なリソースが作成されていない');
      console.error('\n🔧 解決方法:');
      console.error('   1. `npx ampx status` でデプロイ状況を確認');
      console.error('   2. `npx ampx push` で再デプロイ');
      console.error('   3. AWS Console で手動確認');
      process.exit(1);
    }

    // 既存の .env.local をバックアップ
    if (fs.existsSync(ENV_LOCAL_PATH)) {
      const backupPath = `${ENV_LOCAL_PATH}.backup.${Date.now()}`;
      fs.copyFileSync(ENV_LOCAL_PATH, backupPath);
      console.log(`📋 既存の .env.local を ${path.basename(backupPath)} にバックアップしました`);
    }

    // .env.local ファイルの生成
    const envContent = `# AWS Amplify 設定 (自動生成)
# 生成日時: ${new Date().toISOString()}
# 生成元: amplify_outputs.json

# AWS基本設定
NEXT_PUBLIC_AWS_REGION=${envVars.NEXT_PUBLIC_AWS_REGION}

# Amazon Cognito 認証設定
NEXT_PUBLIC_USER_POOL_ID=${envVars.NEXT_PUBLIC_USER_POOL_ID}
NEXT_PUBLIC_USER_POOL_CLIENT_ID=${envVars.NEXT_PUBLIC_USER_POOL_CLIENT_ID}
NEXT_PUBLIC_IDENTITY_POOL_ID=${envVars.NEXT_PUBLIC_IDENTITY_POOL_ID}

# AWS AppSync GraphQL API設定
NEXT_PUBLIC_GRAPHQL_ENDPOINT=${envVars.NEXT_PUBLIC_GRAPHQL_ENDPOINT}
NEXT_PUBLIC_API_KEY=${envVars.NEXT_PUBLIC_API_KEY}

# アプリケーション設定
NEXT_PUBLIC_APP_NAME=MAGI Decision System
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=development

# デバッグ設定
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_MOCK_AGENTS=false

# フィーチャーフラグ
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_OPTIMISTIC_UPDATES=true
NEXT_PUBLIC_ENABLE_TRACE_VISUALIZATION=true

# パフォーマンス設定
NEXT_PUBLIC_MESSAGE_LIMIT=50
NEXT_PUBLIC_CONVERSATION_LIMIT=20
NEXT_PUBLIC_TRACE_STEP_LIMIT=100
`;

    fs.writeFileSync(ENV_LOCAL_PATH, envContent);

    console.log('✅ 環境変数の設定が完了しました！');
    console.log(`📁 設定ファイル: ${ENV_LOCAL_PATH}`);
    console.log('\n📋 設定された環境変数:');
    Object.entries(envVars).forEach(([key, value]) => {
      const maskedValue = key.includes('KEY') || key.includes('SECRET') 
        ? value.substring(0, 8) + '...' 
        : value;
      console.log(`   ${key}=${maskedValue}`);
    });

    console.log('\n🔍 設定内容の詳細:');
    console.log(`   📍 リージョン: ${envVars.NEXT_PUBLIC_AWS_REGION}`);
    console.log(`   🔐 User Pool: ${envVars.NEXT_PUBLIC_USER_POOL_ID}`);
    console.log(`   🌐 GraphQL API: ${envVars.NEXT_PUBLIC_GRAPHQL_ENDPOINT}`);

    console.log('\n🚀 次のステップ:');
    console.log('   1. npm run dev でアプリケーションを起動');
    console.log('   2. http://localhost:3000 でアクセス確認');
    console.log('   3. 認証機能のテスト');
    console.log('   4. データ操作のテスト');

    console.log('\n💡 トラブルシューティング:');
    console.log('   - 認証エラー: AWS認証情報を確認');
    console.log('   - 接続エラー: GraphQLエンドポイントを確認');
    console.log('   - 権限エラー: IAMロールとポリシーを確認');

  } catch (error) {
    console.error('❌ 環境変数の設定中にエラーが発生しました:', error.message);
    console.error('\n🔧 デバッグ情報:');
    console.error(`   ファイルパス: ${AMPLIFY_OUTPUTS_PATH}`);
    console.error(`   エラー詳細: ${error.stack}`);
    console.error('\n💡 解決方法:');
    console.error('   1. amplify_outputs.json の存在と形式を確認');
    console.error('   2. ファイルの読み取り権限を確認');
    console.error('   3. JSON形式の妥当性を確認');
    process.exit(1);
  }
}

// 設定検証関数
function validateConfiguration() {
  if (!fs.existsSync(ENV_LOCAL_PATH)) {
    console.error('❌ .env.local ファイルが見つかりません');
    return false;
  }

  const envContent = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_USER_POOL_ID',
    'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
    'NEXT_PUBLIC_GRAPHQL_ENDPOINT'
  ];

  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(`${varName}=`) || 
    envContent.includes(`${varName}=undefined`) ||
    envContent.includes(`${varName}=null`)
  );

  if (missingVars.length > 0) {
    console.error('❌ 必須環境変数が不足しています:', missingVars.join(', '));
    return false;
  }

  console.log('✅ 環境変数の検証が完了しました');
  return true;
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'validate':
    validateConfiguration();
    break;
  case 'help':
    console.log(`
MAGI Decision System - 環境変数設定スクリプト

使用方法:
  node scripts/setup-env.js          # 環境変数を自動設定
  node scripts/setup-env.js validate # 設定を検証
  node scripts/setup-env.js help     # このヘルプを表示

前提条件:
  - AWS CLI がインストールされている
  - AWS認証情報が設定されている
  - npx ampx push が完了している
  - amplify_outputs.json が存在する
`);
    break;
  default:
    setupEnvironmentVariables();
    break;
}

module.exports = { setupEnvironmentVariables, validateConfiguration };