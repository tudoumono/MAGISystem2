/**
 * ServerAuthProvider Component - サーバーサイド認証プロバイダー
 * 
 * 目的: SSR対応の認証状態管理とクライアントサイドとの連携
 * 設計理由: サーバーサイドで取得した認証情報をクライアントに安全に渡す
 * 
 * 主要機能:
 * - サーバーサイドでの認証状態取得
 * - クライアントサイドへの安全な状態受け渡し
 * - ハイドレーション時の状態同期
 * - セッション情報の初期化
 * 
 * 学習ポイント:
 * - Next.js 15 でのSSR認証パターン
 * - サーバーコンポーネントとクライアントコンポーネントの連携
 * - ハイドレーション時の状態管理
 * - セキュリティを考慮した情報の受け渡し
 * 
 * 使用例:
 * ```typescript
 * // app/layout.tsx
 * export default async function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ServerAuthProvider>
 *           <AuthProvider>
 *             {children}
 *           </AuthProvider>
 *         </ServerAuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * 関連: src/lib/auth/server-actions.ts, src/components/auth/AuthProvider.tsx
 */

import React from 'react';
import { getSessionInfo, SessionInfo } from '@/lib/auth/server-actions';

/**
 * サーバーサイド認証プロバイダーのProps型定義
 */
export interface ServerAuthProviderProps {
  children: React.ReactNode;
}

/**
 * クライアントサイドに渡すセッション情報の型定義
 * 
 * 学習ポイント:
 * - セキュリティを考慮した情報の制限
 * - JSON シリアライズ可能な型の使用
 * - クライアントサイドとの型の整合性
 */
export interface ClientSessionInfo {
  isAuthenticated: boolean;
  user: {
    userId: string;
    username: string;
    email?: string | undefined;
    name?: string | undefined;
  } | null;
  timestamp: string;
}

/**
 * ServerAuthProviderコンポーネント
 * 
 * 設計理由:
 * - サーバーサイドでの認証状態取得
 * - クライアントサイドへの安全な情報受け渡し
 * - ハイドレーション時の状態同期
 * 
 * 学習ポイント:
 * - async Server Component の実装
 * - セッション情報の取得と処理
 * - エラーハンドリングの実装
 */
export async function ServerAuthProvider({ children }: ServerAuthProviderProps) {
  let sessionInfo: SessionInfo;
  
  try {
    // サーバーサイドでセッション情報を取得
    sessionInfo = await getSessionInfo();
  } catch (error) {
    console.error('Failed to get session info in ServerAuthProvider:', error);
    
    // エラー時のフォールバック
    sessionInfo = {
      user: null,
      isAuthenticated: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
        timestamp: new Date().toISOString(),
      },
    };
  }
  
  // クライアントサイドに渡すセッション情報を構築
  const clientSessionInfo: ClientSessionInfo = {
    isAuthenticated: sessionInfo.isAuthenticated,
    user: sessionInfo.user ? {
      userId: sessionInfo.user.userId,
      username: sessionInfo.user.username,
      email: sessionInfo.user.email,
      name: sessionInfo.user.name,
    } : null,
    timestamp: new Date().toISOString(),
  };
  
  return (
    <>
      {/* セッション情報をクライアントサイドに渡すためのスクリプト */}
      <script
        id="server-session-info"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(clientSessionInfo),
        }}
      />
      
      {children}
    </>
  );
}

/**
 * クライアントサイドでサーバーセッション情報を取得するユーティリティ
 * 
 * 学習ポイント:
 * - DOM からのデータ取得
 * - JSON パースとエラーハンドリング
 * - 型安全な情報の取得
 * 
 * 使用例:
 * ```typescript
 * // クライアントコンポーネント内で使用
 * const serverSession = getServerSessionInfo();
 * if (serverSession?.isAuthenticated) {
 *   // 認証済みの処理
 * }
 * ```
 */
export function getServerSessionInfo(): ClientSessionInfo | null {
  if (typeof window === 'undefined') {
    // サーバーサイドでは null を返す
    return null;
  }
  
  try {
    const scriptElement = document.getElementById('server-session-info');
    
    if (!scriptElement || !scriptElement.textContent) {
      return null;
    }
    
    const sessionInfo: ClientSessionInfo = JSON.parse(scriptElement.textContent);

    // 基本的な検証
    if (typeof sessionInfo.isAuthenticated !== 'boolean') {
      console.warn('Invalid server session info format');
      return null;
    }

    return sessionInfo;
  } catch (error) {
    console.error('Failed to parse server session info:', error);
    return null;
  }
}

/**
 * サーバーセッション情報をクリアするユーティリティ
 * 
 * 学習ポイント:
 * - DOM 操作によるクリーンアップ
 * - メモリリークの防止
 * - セキュリティを考慮した情報の削除
 */
export function clearServerSessionInfo(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const scriptElement = document.getElementById('server-session-info');
    
    if (scriptElement) {
      // セッション情報をクリア
      scriptElement.textContent = '';
      
      // 要素を削除
      scriptElement.remove();
    }
  } catch (error) {
    console.error('Failed to clear server session info:', error);
  }
}

/**
 * サーバーセッション情報の有効性をチェックするユーティリティ
 * 
 * 学習ポイント:
 * - セッション情報の有効期限チェック
 * - タイムスタンプによる鮮度確認
 * - セキュリティを考慮した検証
 */
export function isServerSessionValid(maxAge: number = 5 * 60 * 1000): boolean {
  const sessionInfo = getServerSessionInfo();
  
  if (!sessionInfo) {
    return false;
  }
  
  try {
    const sessionTime = new Date(sessionInfo.timestamp);
    const now = new Date();
    const age = now.getTime() - sessionTime.getTime();
    
    // セッション情報が古すぎる場合は無効
    return age <= maxAge;
  } catch (error) {
    console.error('Failed to validate server session timestamp:', error);
    return false;
  }
}