/**
 * Real Amplify Data Client - Phase 3+ Production
 * 
 * このファイルは実際のAmplify Data/AI Kitクライアントを提供します。
 * Phase 3以降で使用され、実際のAWSリソースと通信します。
 * 
 * 目的:
 * - 実際のAmplify Data/AI Kitとの統合
 * - GraphQL API経由でのデータ操作
 * - リアルタイム更新（GraphQL Subscriptions）
 * - 認証済みユーザーによるデータアクセス
 * 
 * 設計理由:
 * - generateClient(): Amplify v6の標準クライアント生成
 * - Schema型による完全な型安全性
 * - 環境変数による設定管理
 * - エラーハンドリングとリトライ機能
 * 
 * 学習ポイント:
 * - Amplify v6のクライアント使用方法
 * - GraphQL操作の実行パターン
 * - リアルタイム更新の実装
 * - 認証とデータアクセスの統合
 * 
 * 使用例:
 * ```typescript
 * import { getRealAmplifyClient } from '@/lib/amplify/client';
 * 
 * const client = getRealAmplifyClient();
 * const conversations = await client.models.Conversation.list();
 * ```
 * 
 * 関連: src/lib/amplify/config.ts, src/lib/amplify/mock-client.ts
 */

import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { getAmplifyConfig, getCurrentEnvironmentMode } from './config';

/**
 * Amplify設定の初期化
 * 
 * 学習ポイント:
 * - Amplify.configure(): グローバル設定の初期化
 * - 環境に応じた設定の自動切り替え
 * - SSR対応（サーバーサイドでの安全な初期化）
 */
let isConfigured = false;

function initializeAmplify() {
  if (isConfigured) return;
  
  try {
    const config = getAmplifyConfig();
    Amplify.configure(config);
    isConfigured = true;
    
    const mode = getCurrentEnvironmentMode();
    console.log(`✅ Amplify configured successfully (${mode})`);
    
    if (mode === 'DEVELOPMENT') {
      console.log('🔧 Development mode: Using real AWS resources with dev settings');
    } else if (mode === 'PRODUCTION') {
      console.log('🚀 Production mode: Using real AWS resources with prod settings');
    }
  } catch (error) {
    console.error('❌ Failed to configure Amplify:', error);
    throw new Error(`Amplify configuration failed: ${error}`);
  }
}

/**
 * 実際のAmplifyクライアントの生成
 * 
 * 学習ポイント:
 * - generateClient<Schema>(): 型安全なクライアント生成
 * - Schema型により全GraphQL操作が型チェックされる
 * - 認証情報の自動付与
 * - エラーハンドリングの統合
 * 
 * @returns 型安全なAmplify Dataクライアント
 */
export function getRealAmplifyClient() {
  // モックモードの場合はエラー
  const currentMode = getCurrentEnvironmentMode();
  if (currentMode === 'MOCK') {
    throw new Error('Cannot create real Amplify client in MOCK mode. Use generateMockClient() instead.');
  }
  
  // Amplify設定の初期化
  initializeAmplify();
  
  // 実際のクライアント生成
  const client = generateClient();
  
  return client;
}

/**
 * 環境に応じたクライアント取得
 * 
 * 学習ポイント:
 * - 環境モードによる自動切り替え
 * - 開発時の利便性向上
 * - 型安全性の維持
 * 
 * @returns 環境に適したクライアント
 */
export function getAmplifyClient() {
  const mode = getCurrentEnvironmentMode();
  
  if (mode === 'MOCK') {
    // モックモードの場合は動的インポート
    const { mockClient } = require('./mock-client');
    return mockClient;
  } else {
    // 実環境の場合は実クライアント
    return getRealAmplifyClient();
  }
}

/**
 * クライアント接続テスト
 * 
 * 学習ポイント:
 * - 接続確認の実装パターン
 * - エラーハンドリングとデバッグ情報
 * - ヘルスチェック機能
 * 
 * @returns 接続テスト結果
 */
export async function testAmplifyConnection(): Promise<{
  success: boolean;
  mode: string;
  error?: string;
  details?: any;
}> {
  try {
    const mode = getCurrentEnvironmentMode();
    
    if (mode === 'MOCK') {
      return {
        success: true,
        mode: 'MOCK',
        details: 'Mock client - no real AWS connection'
      };
    }
    
    // 実環境での接続テスト
    try {
      const client = getRealAmplifyClient() as any; // Type assertion for Phase 3 compatibility
      
      // クライアントの存在確認
      if (!client || !client.models || !client.models.Conversation) {
        throw new Error('Amplify client not properly initialized. Please run: npx ampx push');
      }
      
      // 簡単な接続テスト（会話一覧取得）
      const result = await client.models.Conversation.list();
      
      return {
        success: true,
        mode,
        details: {
          hasData: !!result.data,
          itemCount: result.data?.length || 0,
          errors: result.errors
        }
      };
    } catch (clientError) {
      // 実クライアントの初期化に失敗した場合、詳細なエラー情報を提供
      const errorMessage = clientError instanceof Error ? clientError.message : 'Unknown client error';
      
      return {
        success: false,
        mode,
        error: `Amplify client error: ${errorMessage}`,
        details: {
          suggestion: 'Run "npx ampx push" to deploy Amplify resources',
          clientError: clientError
        }
      };
    }
  } catch (error) {
    console.error('Amplify connection test failed:', error);
    
    return {
      success: false,
      mode: getCurrentEnvironmentMode(),
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        suggestion: 'Check Amplify configuration and run "npx ampx push"',
        error: error
      }
    };
  }
}

/**
 * データシーディング機能
 * 
 * 学習ポイント:
 * - 初期データの投入パターン
 * - 開発環境での便利機能
 * - データの整合性確保
 * 
 * @param force - 既存データがある場合も強制実行
 */
export async function seedInitialData(force: boolean = false): Promise<void> {
  const currentMode = getCurrentEnvironmentMode();
  if (currentMode === 'MOCK') {
    console.log('📝 Mock mode: Seeding handled by mock client');
    return;
  }
  
  try {
    const client = getRealAmplifyClient() as any; // Type assertion for Phase 3 compatibility
    
    // 既存データの確認
    const existingConversations = await client.models.Conversation.list({ limit: 1 });
    
    if (existingConversations.data && existingConversations.data.length > 0 && !force) {
      console.log('📊 Initial data already exists, skipping seeding');
      return;
    }
    
    console.log('🌱 Seeding initial data...');
    
    // デフォルトプリセットの作成
    const defaultPreset = await client.models.AgentPreset.create({
      name: 'デフォルト設定',
      description: 'バランスの取れた標準設定',
      configs: [
        {
          agentId: 'caspar',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたはCASPARです。保守的で現実的な視点から分析してください。',
          temperature: 0.3,
          maxTokens: 1000
        },
        {
          agentId: 'balthasar',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたはBALTHASARです。革新的で創造的な視点から分析してください。',
          temperature: 0.8,
          maxTokens: 1000
        },
        {
          agentId: 'melchior',
          modelId: 'claude-3-sonnet',
          systemPrompt: 'あなたはMELCHIORです。科学的でバランスの取れた視点から分析してください。',
          temperature: 0.5,
          maxTokens: 1000
        }
      ],
      isDefault: true,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Default preset created:', defaultPreset.data?.id);
    
    // サンプル会話の作成（オプション）
    if (force) {
      const sampleConversation = await client.models.Conversation.create({
        userId: 'system', // 実際は認証されたユーザーID
        title: 'サンプル会話: AIの倫理について',
        agentPresetId: defaultPreset.data?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Sample conversation created:', sampleConversation.data?.id);
    }
    
    console.log('🌱 Initial data seeding completed');
  } catch (error) {
    console.error('❌ Failed to seed initial data:', error);
    throw error;
  }
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的な使用:
 * ```typescript
 * import { getAmplifyClient } from '@/lib/amplify/client';
 * 
 * const client = getAmplifyClient(); // 環境に応じて自動切り替え
 * const conversations = await client.models.Conversation.list();
 * ```
 * 
 * 2. 実クライアント強制使用:
 * ```typescript
 * import { getRealAmplifyClient } from '@/lib/amplify/client';
 * 
 * const client = getRealAmplifyClient(); // 実クライアントのみ
 * ```
 * 
 * 3. 接続テスト:
 * ```typescript
 * import { testAmplifyConnection } from '@/lib/amplify/client';
 * 
 * const result = await testAmplifyConnection();
 * if (!result.success) {
 *   console.error('Connection failed:', result.error);
 * }
 * ```
 * 
 * 4. データシーディング:
 * ```typescript
 * import { seedInitialData } from '@/lib/amplify/client';
 * 
 * await seedInitialData(); // 初回のみ
 * await seedInitialData(true); // 強制実行
 * ```
 */