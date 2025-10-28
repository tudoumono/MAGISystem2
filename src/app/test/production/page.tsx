/**
 * Production Test Page - 本番環境でのMAGI Decision Systemテスト
 * 
 * このページは本番環境でのシステム全体の動作確認を行います。
 * - 認証システムの動作確認
 * - AgentCore Runtimeとの連携確認
 * - リアルタイムストリーミングの確認
 * - データベース連携の確認
 */

'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

export default function ProductionTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // テスト結果を追加する関数
  const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [
      ...prev,
      { test, status, message, timestamp: new Date() }
    ]);
  };

  // 認証状態の確認
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        addTestResult('認証確認', 'success', `ユーザー: ${user.username}`);
      } catch (error) {
        addTestResult('認証確認', 'error', '認証されていません');
      }
    };
    checkAuth();
  }, []);

  // 全テストを実行
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: データベース接続テスト
    try {
      const conversations = await client.models.Conversation.list();
      addTestResult('データベース接続', 'success', `会話数: ${conversations.data.length}`);
    } catch (error) {
      addTestResult('データベース接続', 'error', `エラー: ${error}`);
    }

    // Test 2: AgentPreset取得テスト
    try {
      const presets = await client.models.AgentPreset.list();
      addTestResult('AgentPreset取得', 'success', `プリセット数: ${presets.data.length}`);
    } catch (error) {
      addTestResult('AgentPreset取得', 'error', `エラー: ${error}`);
    }

    // Test 3: 新しい会話作成テスト
    try {
      const newConversation = await client.models.Conversation.create({
        userId: currentUser?.userId || 'test-user',
        title: `本番テスト - ${new Date().toISOString()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      addTestResult('会話作成', 'success', `会話ID: ${newConversation.data?.id}`);

      // Test 4: メッセージ作成テスト
      if (newConversation.data?.id) {
        const newMessage = await client.models.Message.create({
          conversationId: newConversation.data.id,
          content: 'これは本番環境のテストメッセージです。',
          role: 'user',
          createdAt: new Date().toISOString()
        });
        addTestResult('メッセージ作成', 'success', `メッセージID: ${newMessage.data?.id}`);
      }
    } catch (error) {
      addTestResult('会話作成', 'error', `エラー: ${error}`);
    }

    // Test 5: AgentCore Runtime接続テスト（模擬）
    try {
      // 実際のAgentCore Runtimeへの接続をシミュレート
      const response = await fetch('/api/test/agentcore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (response.ok) {
        addTestResult('AgentCore Runtime', 'success', 'AgentCore接続成功');
      } else {
        addTestResult('AgentCore Runtime', 'error', `HTTP ${response.status}`);
      }
    } catch (error) {
      addTestResult('AgentCore Runtime', 'error', `接続エラー: ${error}`);
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🚀 MAGI Decision System - 本番環境テスト
          </h1>

          {/* 環境情報 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">環境情報</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">デプロイURL:</span>
                <br />
                <a 
                  href="https://main.d2ixqvqvqvqvqv.amplifyapp.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://main.d2ixqvqvqvqvqv.amplifyapp.com
                </a>
              </div>
              <div>
                <span className="font-medium">GraphQL API:</span>
                <br />
                <span className="text-gray-600 text-xs">
                  https://7jdl52cbbndixa4kjvp7b2siwu.appsync-api.ap-northeast-1.amazonaws.com/graphql
                </span>
              </div>
              <div>
                <span className="font-medium">認証状態:</span>
                <br />
                <span className={currentUser ? 'text-green-600' : 'text-red-600'}>
                  {currentUser ? `認証済み (${currentUser.username})` : '未認証'}
                </span>
              </div>
              <div>
                <span className="font-medium">リージョン:</span>
                <br />
                <span className="text-gray-600">ap-northeast-1 (東京)</span>
              </div>
            </div>
          </div>

          {/* テスト実行ボタン */}
          <div className="mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-medium ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRunning ? '🔄 テスト実行中...' : '▶️ 全テスト実行'}
            </button>
          </div>

          {/* テスト結果 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">テスト結果</h2>
            
            {testResults.length === 0 ? (
              <p className="text-gray-500">テストを実行してください</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {result.status === 'success' ? '✅' : 
                           result.status === 'error' ? '❌' : '⏳'}
                        </span>
                        <span className="font-medium">{result.test}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{result.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 次のステップ */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              🎯 次のテストステップ
            </h3>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• <a href="/test/magi-stream" className="underline">MAGI Stream テスト</a> - リアルタイムストリーミング</li>
              <li>• <a href="/test/agents" className="underline">エージェントテスト</a> - 3賢者の動作確認</li>
              <li>• <a href="/test/trace" className="underline">トレーステスト</a> - 実行トレースの確認</li>
              <li>• <a href="/dashboard" className="underline">メインダッシュボード</a> - 実際のMAGI Decision System</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}