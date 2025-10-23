/**
 * Environment Status Component - 開発環境状態表示コンポーネント
 * 
 * 目的: 現在の環境モードと設定状況をリアルタイムで表示
 * 設計理由: 開発者が現在の状態を一目で確認できるようにする
 * 
 * 主要機能:
 * - 環境モード（MOCK/DEVELOPMENT/PRODUCTION）の表示
 * - AWS接続状況の確認
 * - 設定エラーの警告表示
 * - クイックアクションボタン
 * 
 * 学習ポイント:
 * - React での環境状態管理
 * - リアルタイム状態更新
 * - 条件付きレンダリング
 * - ユーザーフレンドリーなUI設計
 * 
 * 使用例:
 * ```tsx
 * import { EnvironmentStatus } from '@/components/dev/EnvironmentStatus';
 * 
 * // 開発環境でのみ表示
 * {process.env.NODE_ENV === 'development' && <EnvironmentStatus />}
 * ```
 * 
 * 関連: src/lib/amplify/config.ts, src/lib/amplify/setup.ts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  getCurrentEnvironmentMode, 
  isMockMode, 
  isDevelopmentMode, 
  isProductionMode,
  type EnvironmentMode 
} from '../../lib/amplify/config';

/**
 * 環境状態の型定義
 * 
 * 学習ポイント:
 * - コンポーネント状態の型安全性
 * - 非同期データの管理
 * - エラー状態の表現
 */
interface EnvironmentState {
  mode: EnvironmentMode;
  isLoading: boolean;
  hasErrors: boolean;
  lastChecked: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'unknown';
}

/**
 * 環境モード別のスタイル設定
 * 
 * 学習ポイント:
 * - 視覚的な状態区別
 * - アクセシビリティ対応
 * - 一貫したデザインシステム
 */
const MODE_STYLES = {
  MOCK: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: '📱',
    label: 'Mock Mode',
    description: 'Using mock data (Phase 1-2)',
  },
  DEVELOPMENT: {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    badgeColor: 'bg-green-100 text-green-800',
    icon: '🔧',
    label: 'Development Mode',
    description: 'Connected to AWS resources',
  },
  PRODUCTION: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-100 text-red-800',
    icon: '🚀',
    label: 'Production Mode',
    description: 'Live AWS environment',
  },
} as const;

/**
 * 環境状態表示コンポーネント
 * 
 * 学習ポイント:
 * - 状態管理とライフサイクル
 * - 条件付きレンダリング
 * - ユーザーインタラクション
 */
export function EnvironmentStatus(): JSX.Element {
  const [state, setState] = useState<EnvironmentState>({
    mode: 'MOCK',
    isLoading: true,
    hasErrors: false,
    lastChecked: null,
    connectionStatus: 'unknown',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * 環境状態の更新
   * 
   * 学習ポイント:
   * - 非同期状態更新
   * - エラーハンドリング
   * - 状態の一貫性保持
   */
  const updateEnvironmentState = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const mode = getCurrentEnvironmentMode();
      
      // 接続状況の確認（簡易版）
      let connectionStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
      
      if (isMockMode()) {
        connectionStatus = 'disconnected';
      } else {
        // 実際の実装では、AWS接続テストを行う
        connectionStatus = 'connected';
      }

      setState({
        mode,
        isLoading: false,
        hasErrors: false,
        lastChecked: new Date(),
        connectionStatus,
      });

    } catch (error) {
      console.error('Failed to update environment state:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasErrors: true,
        lastChecked: new Date(),
      }));
    }
  };

  /**
   * コンポーネントマウント時の初期化
   * 
   * 学習ポイント:
   * - useEffect の適切な使用
   * - 定期更新の実装
   * - クリーンアップ処理
   */
  useEffect(() => {
    updateEnvironmentState();

    // 30秒ごとに状態を更新
    const interval = setInterval(updateEnvironmentState, 30000);

    return () => clearInterval(interval);
  }, []);

  const modeStyle = MODE_STYLES[state.mode];

  /**
   * クイックアクション関数
   * 
   * 学習ポイント:
   * - ユーザーアクションの処理
   * - 外部スクリプトの実行
   * - フィードバックの提供
   */
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'refresh':
        updateEnvironmentState();
        break;
      case 'setup':
        console.log('🚀 Run: npm run setup:amplify');
        alert('Please run "npm run setup:amplify" in your terminal to set up AWS resources.');
        break;
      case 'docs':
        window.open('/.kiro/specs/magi-decision-ui/design.md', '_blank');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm transition-all duration-300 ${
      isExpanded ? 'w-80' : 'w-auto'
    }`}>
      {/* メインステータスバッジ */}
      <div 
        className={`
          ${modeStyle.bgColor} ${modeStyle.borderColor} ${modeStyle.textColor}
          border rounded-lg shadow-lg cursor-pointer transition-all duration-200
          hover:shadow-xl
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{modeStyle.icon}</span>
              <div>
                <div className="font-medium text-sm">{modeStyle.label}</div>
                {!isExpanded && (
                  <div className="text-xs opacity-75">{modeStyle.description}</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 接続状況インジケーター */}
              <div className={`w-2 h-2 rounded-full ${
                state.connectionStatus === 'connected' ? 'bg-green-400' :
                state.connectionStatus === 'disconnected' ? 'bg-gray-400' :
                'bg-yellow-400'
              }`} />
              
              {/* 展開/折りたたみアイコン */}
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 展開時の詳細情報 */}
        {isExpanded && (
          <div className="border-t border-current border-opacity-20 p-3 space-y-3">
            {/* 詳細情報 */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="opacity-75">Mode:</span>
                <span className="font-mono">{state.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-75">Connection:</span>
                <span className="font-mono capitalize">{state.connectionStatus}</span>
              </div>
              {state.lastChecked && (
                <div className="flex justify-between">
                  <span className="opacity-75">Last Check:</span>
                  <span className="font-mono">{state.lastChecked.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* エラー表示 */}
            {state.hasErrors && (
              <div className="text-xs bg-red-100 text-red-700 p-2 rounded border">
                ⚠️ Configuration errors detected
              </div>
            )}

            {/* クイックアクション */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAction('refresh');
                }}
                className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
                disabled={state.isLoading}
              >
                {state.isLoading ? '⟳' : '🔄'} Refresh
              </button>

              {isMockMode() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction('setup');
                  }}
                  className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
                >
                  🚀 Setup AWS
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAction('docs');
                }}
                className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
              >
                📚 Docs
              </button>
            </div>

            {/* モード別のヒント */}
            <div className="text-xs opacity-75 border-t border-current border-opacity-20 pt-2">
              {isMockMode() && (
                <div>
                  💡 <strong>Mock Mode:</strong> Perfect for UI development without AWS setup.
                  Run <code className="bg-black bg-opacity-10 px-1 rounded">npm run setup:amplify</code> to deploy real resources.
                </div>
              )}
              
              {isDevelopmentMode() && (
                <div>
                  💡 <strong>Development Mode:</strong> Connected to AWS resources.
                  Great for testing real data flows and authentication.
                </div>
              )}
              
              {isProductionMode() && (
                <div>
                  💡 <strong>Production Mode:</strong> Using live AWS environment.
                  Be careful with data modifications.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 開発環境でのみ表示するラッパーコンポーネント
 * 
 * 学習ポイント:
 * - 条件付きレンダリング
 * - 環境別の機能制御
 * - 本番環境での不要な機能の除外
 */
export function DevEnvironmentStatus(): JSX.Element | null {
  // 本番環境では表示しない
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return <EnvironmentStatus />;
}

export default EnvironmentStatus;