// Amplify接続テスト用スクリプト
const { testAmplifyConnection } = require('./src/lib/amplify/client');

async function debugAmplify() {
  console.log('🔍 Amplify接続テストを開始...');
  
  try {
    const result = await testAmplifyConnection();
    console.log('📊 接続テスト結果:', result);
    
    if (result.success) {
      console.log('✅ Amplify接続成功');
    } else {
      console.log('❌ Amplify接続失敗:', result.error);
      console.log('💡 推奨対応:', result.details?.suggestion);
    }
  } catch (error) {
    console.error('🚨 テスト実行エラー:', error);
  }
}

debugAmplify();