/**
 * Python実行テスト用スクリプト
 * 
 * Lambda環境でのPython子プロセス実行をテストします。
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testPythonExecution() {
  console.log('🧪 Testing Python execution in Lambda environment...');
  
  try {
    // テストリクエストデータを読み込み
    const testRequestPath = path.join(__dirname, 'test_request.json');
    const testRequest = JSON.parse(fs.readFileSync(testRequestPath, 'utf8'));
    
    console.log('📝 Test Request:', JSON.stringify(testRequest, null, 2));
    
    // Python実行環境の設定
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(__dirname, 'magi_executor.py');
    
    console.log(`🐍 Python Path: ${pythonPath}`);
    console.log(`📄 Script Path: ${scriptPath}`);
    
    // 子プロセスを起動
    const pythonProcess = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname,
      env: {
        ...process.env,
        AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
      }
    });

    let stdout = '';
    let stderr = '';

    // 標準出力を収集
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // 標準エラーを収集
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // プロセス終了を待機
    const result = await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(error);
      });

      // リクエストデータをJSONとして送信
      const requestJson = JSON.stringify(testRequest);
      pythonProcess.stdin.write(requestJson);
      pythonProcess.stdin.end();

      // タイムアウト設定（30秒）
      setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill();
          reject(new Error('Python process timeout'));
        }
      }, 30000);
    });

    console.log('✅ Python execution successful!');
    console.log('📤 stdout:', result.stdout);
    
    if (result.stderr) {
      console.log('⚠️  stderr:', result.stderr);
    }

    // 結果をJSONとして解析
    try {
      const response = JSON.parse(result.stdout);
      console.log('🎯 Parsed Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('🏆 MAGI Decision System Test: SUCCESS');
        console.log(`📊 Final Decision: ${response.judgeResponse?.finalDecision || 'UNKNOWN'}`);
        console.log(`🗳️  Voting Result: ${JSON.stringify(response.judgeResponse?.votingResult || {})}`);
      } else {
        console.log('❌ MAGI Decision System Test: FAILED');
        console.log(`🚨 Error: ${response.error}`);
      }
    } catch (parseError) {
      console.log('⚠️  Failed to parse JSON response:', parseError.message);
      console.log('📄 Raw output:', result.stdout);
    }

  } catch (error) {
    console.error('❌ Python execution test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// テスト実行
if (require.main === module) {
  testPythonExecution()
    .then(() => {
      console.log('🎉 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPythonExecution };