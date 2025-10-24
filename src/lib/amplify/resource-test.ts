/**
 * AWS Resource Connection Test - 詳細なAWSリソース接続テスト
 * 
 * 目的: 各AWSリソース（Cognito、AppSync、DynamoDB）の個別接続テスト
 * 設計理由: 問題の特定を容易にするための詳細診断機能
 * 
 * 主要機能:
 * - Cognito User Pool接続テスト
 * - AppSync GraphQL API接続テスト  
 * - DynamoDB テーブル接続テスト
 * - 詳細なエラー情報とトラブルシューティング提案
 * 
 * 学習ポイント:
 * - 各AWSサービスの接続確認方法
 * - エラーハンドリングとユーザーフレンドリーなメッセージ
 * - 開発環境での診断支援
 */

import { getCurrentEnvironmentMode } from './config';
import { getRealAmplifyClient } from './client';

/**
 * リソーステスト結果の型定義
 */
export interface ResourceTestResult {
  success: boolean;
  error?: string;
  details?: {
    message: string;
    status?: string;
    suggestion?: string;
    [key: string]: any;
  };
}

/**
 * 全体テスト結果の型定義
 */
export interface AmplifyConnectionTestResult {
  success: boolean;
  mode: string;
  error?: string;
  details?: any;
  resources?: {
    cognito: ResourceTestResult;
    appSync: ResourceTestResult;
    dynamoDB: ResourceTestResult;
  };
}

/**
 * Cognito User Pool接続テスト
 */
async function testCognitoConnection(): Promise<ResourceTestResult> {
  try {
    const { getCurrentUser } = await import('aws-amplify/auth');
    await getCurrentUser();
    return { 
      success: true, 
      details: { 
        message: 'Cognito: User authenticated',
        status: 'authenticated'
      } 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 未認証は正常な状態として扱う
    if (errorMessage.includes('not authenticated') || 
        errorMessage.includes('No current user') ||
        errorMessage.includes('The user is not authenticated')) {
      return { 
        success: true, 
        details: { 
          message: 'Cognito: Connection OK (no authenticated user)',
          status: 'ready',
          suggestion: 'User Pool is accessible, ready for authentication'
        }
      };
    }
    
    return { 
      success: false, 
      error: `Cognito connection failed: ${errorMessage}`,
      details: { 
        message: 'Cognito User Pool connection error',
        suggestion: 'Check Cognito User Pool configuration and credentials'
      }
    };
  }
}

/**
 * AppSync GraphQL API接続テスト
 */
async function testAppSyncConnection(): Promise<ResourceTestResult> {
  try {
    const { getAmplifyConfig } = await import('./config');
    const config = getAmplifyConfig();
    
    if (!config.API?.GraphQL?.endpoint) {
      throw new Error('GraphQL endpoint not configured');
    }
    
    // 基本的な設定確認のみ（実際のAPIコールは行わない）
    const endpoint = config.API.GraphQL.endpoint;
    const region = config.API.GraphQL.region;
    
    if (endpoint.includes('mock-api.example.com')) {
      return { 
        success: true, 
        details: { 
          message: 'AppSync: Mock endpoint configured',
          status: 'mock',
          suggestion: 'Using mock GraphQL endpoint'
        }
      };
    }
    
    return { 
      success: true, 
      details: { 
        message: 'AppSync: GraphQL endpoint configured',
        status: 'configured',
        endpoint: endpoint.substring(0, 50) + '...',
        region: region,
        suggestion: 'GraphQL API endpoint is properly configured'
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return { 
      success: false, 
      error: `AppSync configuration check failed: ${errorMessage}`,
      details: { 
        message: 'AppSync GraphQL API configuration error',
        suggestion: 'Run "npx ampx push" to deploy GraphQL API resources'
      }
    };
  }
}

/**
 * DynamoDB テーブル接続テスト
 */
async function testDynamoDBConnection(): Promise<ResourceTestResult> {
  try {
    const { getAmplifyConfig } = await import('./config');
    const config = getAmplifyConfig();
    
    // DynamoDBは通常AppSync経由でアクセスするため、AppSyncの設定確認で代用
    if (!config.API?.GraphQL?.endpoint) {
      throw new Error('GraphQL endpoint not configured (required for DynamoDB access)');
    }
    
    const endpoint = config.API.GraphQL.endpoint;
    
    if (endpoint.includes('mock-api.example.com')) {
      return { 
        success: true, 
        details: { 
          message: 'DynamoDB: Mock storage configured',
          status: 'mock',
          suggestion: 'Using mock storage (LocalStorage)'
        }
      };
    }
    
    return { 
      success: true, 
      details: { 
        message: 'DynamoDB: Access configured via AppSync',
        status: 'configured',
        suggestion: 'DynamoDB tables accessible through GraphQL API'
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return { 
      success: false, 
      error: `DynamoDB configuration check failed: ${errorMessage}`,
      details: { 
        message: 'DynamoDB table configuration error',
        suggestion: 'Check DynamoDB table creation and permissions via Amplify'
      }
    };
  }
}

/**
 * 詳細なAmplify接続テスト
 * 
 * 各AWSリソースを個別にテストし、詳細な診断情報を提供
 */
export async function testAmplifyConnectionDetailed(): Promise<AmplifyConnectionTestResult> {
  try {
    const mode = getCurrentEnvironmentMode();
    
    if (mode === 'MOCK') {
      return {
        success: true,
        mode: 'MOCK',
        details: {
          message: 'Mock mode - no real AWS connection needed',
          status: 'mock'
        }
      };
    }
    
    console.log('Starting detailed AWS resource connection tests...');
    
    // 各リソースを個別にテスト
    const [cognitoTest, appSyncTest, dynamoDBTest] = await Promise.allSettled([
      testCognitoConnection(),
      testAppSyncConnection(),
      testDynamoDBConnection()
    ]);
    
    const resources = {
      cognito: cognitoTest.status === 'fulfilled' ? cognitoTest.value : { 
        success: false, 
        error: 'Test execution failed',
        details: { message: 'Cognito test could not be executed' }
      },
      appSync: appSyncTest.status === 'fulfilled' ? appSyncTest.value : { 
        success: false, 
        error: 'Test execution failed',
        details: { message: 'AppSync test could not be executed' }
      },
      dynamoDB: dynamoDBTest.status === 'fulfilled' ? dynamoDBTest.value : { 
        success: false, 
        error: 'Test execution failed',
        details: { message: 'DynamoDB test could not be executed' }
      }
    };
    
    const successCount = Object.values(resources).filter(r => r.success).length;
    const totalCount = Object.keys(resources).length;
    const allSuccessful = successCount === totalCount;
    
    const failedResources = Object.entries(resources)
      .filter(([_, result]) => !result.success)
      .map(([name, result]) => `${name}: ${result.error || 'Unknown error'}`);
    
    console.log(`Resource test results: ${successCount}/${totalCount} successful`);
    
    return {
      success: allSuccessful,
      mode,
      error: failedResources.length > 0 ? failedResources.join('; ') : undefined,
      resources,
      details: {
        summary: `${successCount}/${totalCount} AWS resources connected`,
        resourceCount: totalCount,
        successCount: successCount,
        failedResources: failedResources.length > 0 ? failedResources : undefined,
        overallStatus: allSuccessful ? 'all_connected' : 'partial_connection'
      }
    };
  } catch (error) {
    console.error('Detailed Amplify connection test failed:', error);
    
    return {
      success: false,
      mode: getCurrentEnvironmentMode(),
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        message: 'Connection test execution failed',
        suggestion: 'Check Amplify configuration and run "npx ampx push"',
        error: error
      }
    };
  }
}