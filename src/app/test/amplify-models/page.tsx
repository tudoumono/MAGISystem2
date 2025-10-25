'use client';

/**
 * Amplify Models Test Page - Model Introspection Verification
 * 
 * このページはAmplifyクライアントのmodel_introspectionが正しく読み込まれているかテストします。
 * 
 * 目的:
 * - generateClient()でモデルが正しく生成されるか確認
 * - model_introspectionの修正が機能しているか検証
 * - 各モデル（Conversation, Message, User, TraceStep, AgentPreset）の存在確認
 * 
 * 使用例:
 * http://localhost:3001/test/amplify-models にアクセスして結果を確認
 */

import { useEffect, useState } from 'react';
import { getAmplifyClient } from '@/lib/amplify/client';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function AmplifyModelsTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runTests() {
      const testResults: TestResult[] = [];

      // Test 1: Client Generation
      try {
        const client = getAmplifyClient();
        if (client) {
          testResults.push({
            success: true,
            message: 'Amplify client generated successfully',
            details: { hasClient: true }
          });
        } else {
          testResults.push({
            success: false,
            message: 'Amplify client is null (server-side execution)',
            details: { hasClient: false }
          });
        }

        // Test 2: Models Availability
        if (client?.models) {
          const modelNames = Object.keys(client.models);
          testResults.push({
            success: true,
            message: 'Models property exists',
            details: { modelNames, modelCount: modelNames.length }
          });

          // Test 3: Required Models Check
          const requiredModels = ['Conversation', 'Message', 'User', 'TraceStep', 'AgentPreset'];
          const availableModels = requiredModels.filter(model => client.models[model]);
          const missingModels = requiredModels.filter(model => !client.models[model]);

          testResults.push({
            success: missingModels.length === 0,
            message: `Required models check: ${availableModels.length}/${requiredModels.length} available`,
            details: { availableModels, missingModels }
          });

          // Test 4: Model Methods Check
          if (client.models.Conversation) {
            const conversationMethods = Object.keys(client.models.Conversation);
            testResults.push({
              success: conversationMethods.includes('list') && conversationMethods.includes('create'),
              message: 'Conversation model methods check',
              details: { methods: conversationMethods }
            });
          }

          // Test 5: Simple API Call Test
          try {
            const conversations = await client.models.Conversation.list({ limit: 1 });
            testResults.push({
              success: true,
              message: 'API call test successful',
              details: { 
                hasData: !!conversations.data,
                itemCount: conversations.data?.length || 0,
                hasErrors: !!conversations.errors,
                errors: conversations.errors
              }
            });
          } catch (apiError) {
            testResults.push({
              success: false,
              message: 'API call test failed',
              details: { error: apiError instanceof Error ? apiError.message : 'Unknown error' }
            });
          }
        } else {
          testResults.push({
            success: false,
            message: 'Models property is undefined',
            details: { hasModels: false }
          });
        }
      } catch (error) {
        testResults.push({
          success: false,
          message: 'Client generation failed',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }

      setResults(testResults);
      setLoading(false);
    }

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Amplify Models Test
          </h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Amplify Models Test Results
        </h1>
        
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                result.success ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-center mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    result.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result.success ? '✅ PASS' : '❌ FAIL'}
                </span>
                <h3 className="ml-3 text-lg font-medium text-gray-900">
                  Test {index + 1}
                </h3>
              </div>
              
              <p className="text-gray-700 mb-3">{result.message}</p>
              
              {result.details && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-blue-900 mb-2">
            Test Summary
          </h2>
          <p className="text-blue-700">
            {results.filter(r => r.success).length} / {results.length} tests passed
          </p>
          {results.every(r => r.success) && (
            <p className="text-green-700 font-medium mt-2">
              🎉 All tests passed! Model introspection is working correctly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}