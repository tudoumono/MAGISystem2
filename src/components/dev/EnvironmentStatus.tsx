/**
 * Environment Status Component - 環境ステータス表示
 * 
 * このコンポーネントは現在の環境モード（MOCK/DEVELOPMENT/PRODUCTION）と
 * Amplify接続状態を視覚的に表示します。開発者向けのデバッグ情報も提供します。
 * 
 * 目的:
 * - 現在の環境モードの明確な表示
 * - Amplify接続状態の監視
 * - 開発者向けデバッグ情報の提供
 * - 環境切り替えの支援
 * 
 * 設計理由:
 * - 開発時の環境確認を容易にする
 * - Phase移行時の状態把握を支援
 * - トラブルシューティングの効率化
 * - 視覚的に分かりやすいステータス表示
 * 
 * 学習ポイント:
 * - 環境変数の活用方法
 * - Amplify設定の検証パターン
 * - 開発者体験の向上手法
 * - 条件付きレンダリングの実装
 * 
 * 使用例:
 * ```typescript
 * // 開発環境でのみ表示
 * {process.env.NODE_ENV === 'development' && (
 *   <EnvironmentStatus />
 * )}
 * 
 * // 常時表示（管理者向け）
 * <EnvironmentStatus showAlways />
 * ```
 * 
 * 関連: src/lib/amplify/config.ts, src/lib/amplify/client.ts
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  getCurrentEnvironmentMode, 
  validateAmplifyConfig, 
  getEnvironmentSetupGuide,
  type EnvironmentMode,
  type ConfigValidationResult
} from '@/lib/amplify/config';
import { testAmplifyConnection } from '@/lib/amplify/client';

/**
 * コンポーネントのプロパティ型定義
 */
interface EnvironmentStatusProps {
  /** 本番環境でも常に表示するかどうか */
  showAlways?: boolean;
  /** コンパクト表示モード */
  compact?: boolean;
  /** クリック可能（詳細表示切り替え） */
  interactive?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 接続テスト結果の型定義
 */
interface ConnectionTestResult {
  success: boolean;
  mode: string;
  error?: string;
  details?: any;
  timestamp: Date;
}

/**
 * Environment Status Component
 */
export function EnvironmentStatus({
  showAlways = false,
  compact = false,
  interactive = true,
  className = ''
}: EnvironmentStatusProps) {
  // 状態管理（モードを初期化時に固定）
  const [mode, setMode] = useState<EnvironmentMode>(() => getCurrentEnvironmentMode());
  const [validation, setValidation] = useState<ConfigValidationResult | null>(null);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 環境情報の取得と検証
   */
  const checkEnvironmentStatus = async () => {
    setIsLoading(true);
    
    try {
      // 環境モードは初期化時に固定済み
      const currentMode = mode;
      
      // Amplify設定の検証
      const validationResult = validateAmplifyConfig();
      setValidation(validationResult);
      
      // 接続テスト（実環境のみ）
      if (currentMode !== 'MOCK') {
        try {
          const testResult = await testAmplifyConnection();
          setConnectionTest({
            ...testResult,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Connection test error:', error);
          setConnectionTest({
            success: false,
            mode: currentMode,
            error: error instanceof Error ? error.message : 'Connection test failed',
            details: {
              suggestion: 'Run "npx ampx push" to deploy Amplify resources',
              originalError: error
            },
            timestamp: new Date()
          });
        }
      } else {
        setConnectionTest({
          success: true,
          mode: 'MOCK',
          details: 'Mock mode - no real connection needed',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to check environment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 初期化とリフレッシュ
   */
  useEffect(() => {
    checkEnvironmentStatus();
  }, []);

  /**
   * 表示判定
   */
  const shouldShow = showAlways || process.env.NODE_ENV === 'development';
  if (!shouldShow) return null;

  /**
   * モード別のスタイル設定
   */
  const getModeStyles = (mode: EnvironmentMode) => {
    switch (mode) {
      case 'MOCK':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: '🔧',
          label: 'Mock Mode'
        };
      case 'DEVELOPMENT':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: '🚀',
          label: 'Development'
        };
      case 'PRODUCTION':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          icon: '⚡',
          label: 'Production'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: '❓',
          label: 'Unknown'
        };
    }
  };

  const styles = getModeStyles(mode);

  /**
   * 接続状態のスタイル
   */
  const getConnectionStyles = () => {
    if (!connectionTest) {
      return { icon: '⏳', text: 'Testing...', color: 'text-yellow-600' };
    }
    
    if (connectionTest.success) {
      return { icon: '✅', text: 'Connected', color: 'text-green-600' };
    } else {
      return { icon: '❌', text: 'Disconnected', color: 'text-red-600' };
    }
  };

  const connectionStyles = getConnectionStyles();

  /**
   * コンパクト表示
   */
  if (compact) {
    return (
      <div 
        className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${styles.bg} ${styles.border} ${styles.text} border ${className}`}
        onClick={interactive ? () => setShowDetails(!showDetails) : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        <span>{styles.icon}</span>
        <span className="font-medium">{styles.label}</span>
        {connectionTest && (
          <>
            <span className="text-gray-400">•</span>
            <span className={connectionStyles.color}>{connectionStyles.icon}</span>
          </>
        )}
      </div>
    );
  }

  /**
   * 詳細表示
   */
  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} p-4 ${className}`}>
      {/* ヘッダー */}
      <div 
        className={`flex items-center justify-between ${interactive ? 'cursor-pointer' : ''}`}
        onClick={interactive ? () => setShowDetails(!showDetails) : undefined}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{styles.icon}</span>
          <div>
            <h3 className={`font-semibold ${styles.text}`}>
              Environment: {styles.label}
            </h3>
            <div className="flex items-center space-x-2 text-sm">
              <span className={connectionStyles.color}>
                {connectionStyles.icon} {connectionStyles.text}
              </span>
              {validation && !validation.isValid && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-red-600">
                    ⚠️ {validation.errors.length} error(s)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {interactive && (
          <button
            className={`p-1 rounded hover:bg-white/50 ${styles.text}`}
            aria-label={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? '▼' : '▶'}
          </button>
        )}
      </div>

      {/* 詳細情報 */}
      {showDetails && (
        <div className="mt-4 space-y-3 text-sm">
          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Mode:</span>
              <span className="ml-2">{mode}</span>
            </div>
            <div>
              <span className="font-medium">Node Env:</span>
              <span className="ml-2">{process.env.NODE_ENV}</span>
            </div>
          </div>

          {/* 検証結果 */}
          {validation && (
            <div>
              <h4 className="font-medium mb-2">Configuration Validation:</h4>
              <div className="space-y-1">
                <div className={validation.isValid ? 'text-green-600' : 'text-red-600'}>
                  {validation.isValid ? '✅ Valid' : '❌ Invalid'}
                </div>
                
                {validation.errors.length > 0 && (
                  <div>
                    <span className="font-medium text-red-600">Errors:</span>
                    <ul className="ml-4 list-disc text-red-600">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validation.warnings.length > 0 && (
                  <div>
                    <span className="font-medium text-yellow-600">Warnings:</span>
                    <ul className="ml-4 list-disc text-yellow-600">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 接続テスト結果 */}
          {connectionTest && (
            <div>
              <h4 className="font-medium mb-2">Connection Test:</h4>
              <div className="space-y-1">
                <div className={connectionTest.success ? 'text-green-600' : 'text-red-600'}>
                  {connectionTest.success ? '✅ Success' : '❌ Failed'}
                </div>
                
                {connectionTest.error && (
                  <div className="text-red-600">
                    <span className="font-medium">Error:</span> {connectionTest.error}
                  </div>
                )}
                
                {connectionTest.details && (
                  <div className="text-gray-600">
                    <span className="font-medium">Details:</span>
                    <pre className="mt-1 text-xs bg-white/50 p-2 rounded overflow-auto">
                      {typeof connectionTest.details === 'string' 
                        ? connectionTest.details 
                        : JSON.stringify(connectionTest.details, null, 2)
                      }
                    </pre>
                  </div>
                )}
                
                <div className="text-gray-500 text-xs">
                  Last tested: {connectionTest.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* アクション */}
          <div className="flex space-x-2 pt-2 border-t border-white/50">
            <button
              onClick={checkEnvironmentStatus}
              disabled={isLoading}
              className={`px-3 py-1 rounded text-xs font-medium ${styles.text} bg-white/50 hover:bg-white/70 disabled:opacity-50`}
            >
              {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            
            {mode === 'MOCK' && (
              <button
                onClick={() => {
                  console.log(getEnvironmentSetupGuide());
                  alert('Setup guide logged to console');
                }}
                className={`px-3 py-1 rounded text-xs font-medium ${styles.text} bg-white/50 hover:bg-white/70`}
              >
                📋 Setup Guide
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. 開発環境での基本使用:
 * ```typescript
 * // 自動的に開発環境でのみ表示
 * <EnvironmentStatus />
 * ```
 * 
 * 2. 管理者ダッシュボードでの使用:
 * ```typescript
 * // 常時表示、コンパクトモード
 * <EnvironmentStatus showAlways compact />
 * ```
 * 
 * 3. デバッグパネルでの使用:
 * ```typescript
 * // 詳細情報を常時表示
 * <EnvironmentStatus showAlways interactive={false} />
 * ```
 * 
 * 4. カスタムスタイリング:
 * ```typescript
 * <EnvironmentStatus 
 *   className="fixed top-4 right-4 z-50" 
 *   compact 
 * />
 * ```
 */

export default EnvironmentStatus;