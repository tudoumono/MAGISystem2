/**
 * Amplify Codegen Utilities - 型生成とクライアント管理ユーティリティ
 * 
 * 目的: Amplify codegenの実行と生成された型の管理
 * 設計理由: 型安全性の確保と開発体験の向上
 * 
 * 主要機能:
 * - Amplify codegenの実行
 * - 生成された型の検証
 * - 型定義の自動更新
 * - 開発環境での型チェック
 * 
 * 学習ポイント:
 * - Amplify Gen2の型生成システム
 * - GraphQLスキーマからTypeScript型への変換
 * - 型安全なAPI呼び出しの実現
 * - 開発ワークフローの最適化
 * 
 * 使用例:
 * ```typescript
 * import { validateGeneratedTypes, regenerateTypes } from '@/lib/amplify/codegen';
 * 
 * // 型の検証
 * const isValid = await validateGeneratedTypes();
 * 
 * // 型の再生成
 * if (!isValid) {
 *   await regenerateTypes();
 * }
 * ```
 * 
 * 関連: amplify/data/resource.ts, src/types/amplify.ts
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * 生成された型ファイルのパス
 * 
 * 学習ポイント:
 * - Amplify codegenが生成するファイルの場所
 * - 型定義ファイルの命名規則
 * - プロジェクト構造との統合
 */
const GENERATED_TYPES_PATH = join(process.cwd(), 'src', 'types', 'amplify-generated.ts');
const AMPLIFY_OUTPUTS_PATH = join(process.cwd(), 'amplify_outputs.json');
const SCHEMA_PATH = join(process.cwd(), 'amplify', 'data', 'resource.ts');

/**
 * 型生成の設定
 * 
 * 設計理由:
 * - 一貫した型生成設定
 * - カスタマイズ可能な生成オプション
 * - 開発環境に応じた設定切り替え
 */
interface CodegenConfig {
  format: 'modelgen' | 'graphql-codegen' | 'introspection';
  modelTarget: 'typescript' | 'javascript';
  outputPath: string;
  includeComments: boolean;
  generateIndexRules: boolean;
}

const DEFAULT_CODEGEN_CONFIG: CodegenConfig = {
  format: 'modelgen',
  modelTarget: 'typescript',
  outputPath: GENERATED_TYPES_PATH,
  includeComments: true,
  generateIndexRules: true,
};

/**
 * Amplify codegenの実行
 * 
 * 学習ポイント:
 * - npx ampx generateコマンドの使用方法
 * - 型生成プロセスの自動化
 * - エラーハンドリングと再試行機構
 * 
 * @param config - 型生成の設定
 * @returns 生成成功の可否
 */
export async function generateAmplifyTypes(
  config: Partial<CodegenConfig> = {}
): Promise<boolean> {
  const finalConfig = { ...DEFAULT_CODEGEN_CONFIG, ...config };
  
  try {
    console.log('🔄 Amplify型の生成を開始します...');
    
    // Amplifyリソースがデプロイされているかチェック
    if (!existsSync(AMPLIFY_OUTPUTS_PATH)) {
      console.warn('⚠️  amplify_outputs.json が見つかりません');
      console.warn('   まず `npx ampx push` を実行してAWSリソースをデプロイしてください');
      return false;
    }
    
    // GraphQL client codeの生成
    const command = [
      'npx ampx generate graphql-client-code',
      `--format ${finalConfig.format}`,
      `--model-target ${finalConfig.modelTarget}`,
      `--out ${finalConfig.outputPath}`,
      finalConfig.includeComments ? '--model-add-timestamp-fields' : '',
      finalConfig.generateIndexRules ? '--model-generate-index-rules' : '',
    ].filter(Boolean).join(' ');
    
    console.log(`📝 実行コマンド: ${command}`);
    
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    
    console.log('✅ Amplify型の生成が完了しました');
    
    // 生成された型ファイルの検証
    const isValid = await validateGeneratedTypes();
    if (!isValid) {
      console.error('❌ 生成された型ファイルに問題があります');
      return false;
    }
    
    // 型ファイルの後処理
    await postProcessGeneratedTypes(finalConfig.outputPath);
    
    return true;
  } catch (error) {
    console.error('❌ Amplify型の生成に失敗しました:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('InvalidCredentialError')) {
        console.error('🔑 AWS認証情報が設定されていません');
        console.error('   `npx ampx configure profile` を実行してプロファイルを設定してください');
      } else if (error.message.includes('not found')) {
        console.error('📦 必要なパッケージがインストールされていません');
        console.error('   `npm install` を実行してください');
      }
    }
    
    return false;
  }
}

/**
 * 生成された型ファイルの検証
 * 
 * 学習ポイント:
 * - TypeScript型定義の妥当性チェック
 * - 必要な型の存在確認
 * - 型の整合性検証
 * 
 * @returns 型ファイルの妥当性
 */
export async function validateGeneratedTypes(): Promise<boolean> {
  try {
    if (!existsSync(GENERATED_TYPES_PATH)) {
      console.warn('⚠️  生成された型ファイルが見つかりません');
      return false;
    }
    
    const typeContent = readFileSync(GENERATED_TYPES_PATH, 'utf-8');
    
    // 必要な型の存在確認
    const requiredTypes = [
      'User',
      'Conversation',
      'Message',
      'TraceStep',
      'AgentPreset',
      'Schema',
    ];
    
    const missingTypes = requiredTypes.filter(
      typeName => !typeContent.includes(`export type ${typeName}`) && 
                  !typeContent.includes(`export interface ${typeName}`)
    );
    
    if (missingTypes.length > 0) {
      console.error('❌ 必要な型が生成されていません:', missingTypes.join(', '));
      return false;
    }
    
    // TypeScript構文の基本チェック
    if (!typeContent.includes('export') || typeContent.includes('SyntaxError')) {
      console.error('❌ 生成された型ファイルに構文エラーがあります');
      return false;
    }
    
    console.log('✅ 生成された型ファイルは正常です');
    return true;
  } catch (error) {
    console.error('❌ 型ファイルの検証に失敗しました:', error);
    return false;
  }
}

/**
 * 生成された型ファイルの後処理
 * 
 * 学習ポイント:
 * - 生成された型の拡張とカスタマイズ
 * - コメントの追加と整理
 * - 型の再エクスポート
 * 
 * @param filePath - 処理対象の型ファイルパス
 */
async function postProcessGeneratedTypes(filePath: string): Promise<void> {
  try {
    if (!existsSync(filePath)) {
      return;
    }
    
    let content = readFileSync(filePath, 'utf-8');
    
    // ファイルヘッダーの追加
    const header = `/**
 * Generated Amplify Types - MAGI Decision System
 * 
 * このファイルはAmplify codegenによって自動生成されました。
 * 手動で編集しないでください。変更は amplify/data/resource.ts で行ってください。
 * 
 * 生成日時: ${new Date().toISOString()}
 * 
 * 学習ポイント:
 * - GraphQLスキーマからTypeScript型への自動変換
 * - 型安全なAPI呼び出しの実現
 * - Amplify Data APIとの統合
 */

`;
    
    // 既存のヘッダーを削除して新しいヘッダーを追加
    content = content.replace(/^\/\*\*[\s\S]*?\*\/\s*/, '');
    content = header + content;
    
    // 学習用コメントの追加
    content = content.replace(
      /export type (\w+) = {/g,
      (match, typeName) => {
        const comments = getTypeComments(typeName);
        return comments ? `${comments}\n${match}` : match;
      }
    );
    
    writeFileSync(filePath, content, 'utf-8');
    console.log('✅ 型ファイルの後処理が完了しました');
  } catch (error) {
    console.error('❌ 型ファイルの後処理に失敗しました:', error);
  }
}

/**
 * 型別の学習用コメントを取得
 * 
 * @param typeName - 型名
 * @returns 学習用コメント
 */
function getTypeComments(typeName: string): string | null {
  const comments: Record<string, string> = {
    User: `/**
 * ユーザーモデル型定義
 * 
 * 学習ポイント:
 * - 認証ユーザーの基本情報管理
 * - オーナーベースアクセス制御
 * - 会話との1対多リレーション
 */`,
    Conversation: `/**
 * 会話モデル型定義
 * 
 * 学習ポイント:
 * - 会話スレッドの管理
 * - エージェントプリセットとの関連付け
 * - メッセージとの1対多リレーション
 */`,
    Message: `/**
 * メッセージモデル型定義
 * 
 * 学習ポイント:
 * - ユーザーとアシスタントのメッセージ管理
 * - エージェント応答の保存
 * - トレース情報との関連付け
 */`,
    TraceStep: `/**
 * トレースステップモデル型定義
 * 
 * 学習ポイント:
 * - エージェント実行の詳細記録
 * - パフォーマンス監視用データ
 * - 実行トレースの可視化
 */`,
    AgentPreset: `/**
 * エージェントプリセットモデル型定義
 * 
 * 学習ポイント:
 * - エージェント設定の管理
 * - プリセットの共有機能
 * - 設定の再利用性向上
 */`,
  };
  
  return comments[typeName] || null;
}

/**
 * 開発環境での型チェック
 * 
 * 学習ポイント:
 * - 開発時の型整合性確認
 * - 自動型生成の検証
 * - 開発ワークフローの最適化
 */
export async function checkTypesInDevelopment(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  console.log('🔍 開発環境での型チェックを実行中...');
  
  // Amplifyリソースの存在確認
  if (!existsSync(AMPLIFY_OUTPUTS_PATH)) {
    console.warn('⚠️  Amplifyリソースがデプロイされていません');
    console.warn('   型生成をスキップします');
    return;
  }
  
  // 型ファイルの存在確認
  if (!existsSync(GENERATED_TYPES_PATH)) {
    console.log('📝 型ファイルが見つかりません。生成を試行します...');
    const success = await generateAmplifyTypes();
    
    if (!success) {
      console.warn('⚠️  型生成に失敗しました。手動実行が必要です:');
      console.warn('   npx ampx generate graphql-client-code --format modelgen --model-target typescript');
    }
    return;
  }
  
  // 型ファイルの検証
  const isValid = await validateGeneratedTypes();
  if (!isValid) {
    console.warn('⚠️  型ファイルに問題があります。再生成を推奨します');
  }
}

/**
 * 型生成のヘルパー関数
 * 
 * 学習ポイント:
 * - 開発者向けのユーティリティ関数
 * - 型生成プロセスの簡素化
 * - エラー処理の統一
 */
export const codegenUtils = {
  /**
   * 型の再生成（強制）
   */
  async regenerate(): Promise<boolean> {
    console.log('🔄 型の強制再生成を実行します...');
    return await generateAmplifyTypes();
  },
  
  /**
   * 型ファイルの存在確認
   */
  hasGeneratedTypes(): boolean {
    return existsSync(GENERATED_TYPES_PATH);
  },
  
  /**
   * Amplifyリソースのデプロイ状況確認
   */
  hasAmplifyResources(): boolean {
    return existsSync(AMPLIFY_OUTPUTS_PATH);
  },
  
  /**
   * 開発環境セットアップの確認
   */
  async checkSetup(): Promise<{
    hasResources: boolean;
    hasTypes: boolean;
    typesValid: boolean;
  }> {
    const hasResources = this.hasAmplifyResources();
    const hasTypes = this.hasGeneratedTypes();
    const typesValid = hasTypes ? await validateGeneratedTypes() : false;
    
    return {
      hasResources,
      hasTypes,
      typesValid,
    };
  },
};

// 開発環境での自動チェック
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // サーバーサイドでのみ実行
  checkTypesInDevelopment().catch(console.error);
}