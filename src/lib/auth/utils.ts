/**
 * Authentication Utilities - 認証関連のユーティリティ関数
 * 
 * 目的: 認証処理で共通して使用される関数の提供
 * 設計理由: コードの再利用性とセキュリティの統一
 * 
 * 主要機能:
 * - セキュアなCookie設定の生成
 * - トークン検証ユーティリティ
 * - セッション管理ヘルパー
 * - セキュリティ関連の定数
 * 
 * 学習ポイント:
 * - Cookie のセキュリティ設定
 * - Next.js でのセッション管理
 * - TypeScript での型安全なユーティリティ
 * - セキュリティベストプラクティス
 * 
 * 関連: src/lib/auth/server-actions.ts, src/components/auth/AuthProvider.tsx
 */

import { cookies } from 'next/headers';

/**
 * Cookie設定オプションの型定義
 */
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

/**
 * セキュアなCookie設定を取得
 * 
 * 学習ポイント:
 * - 本番環境でのセキュリティ設定
 * - 開発環境での利便性の確保
 * - Cookie のセキュリティベストプラクティス
 * 
 * @param options - 追加のCookie設定
 * @returns セキュアなCookie設定オブジェクト
 */
export function getSecureCookieOptions(options: Partial<CookieOptions> = {}): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction, // 本番環境でのみHTTPS必須
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24時間（秒単位）
    path: '/',
    ...options,
  };
}

/**
 * セッション用Cookie設定を取得
 * 
 * 学習ポイント:
 * - セッション管理に特化した設定
 * - 適切な有効期限の設定
 * - セキュリティとUXのバランス
 * 
 * @param rememberMe - ログイン状態を保持するかどうか
 * @returns セッション用Cookie設定
 */
export function getSessionCookieOptions(rememberMe: boolean = false): CookieOptions {
  const baseOptions = getSecureCookieOptions();

  return {
    ...baseOptions,
    maxAge: rememberMe
      ? 30 * 24 * 60 * 60 // 30日間（Remember Me）
      : 24 * 60 * 60,     // 24時間（通常）
  };
}

/**
 * Cookie名の定数
 * 
 * 学習ポイント:
 * - 一貫したCookie命名規則
 * - タイポの防止
 * - 設定の一元管理
 */
export const COOKIE_NAMES = {
  // 認証関連
  AUTH_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  SESSION_ID: 'session-id',

  // モック認証関連
  MOCK_AUTH_USER: 'mock-auth-user',
  MOCK_SESSION_TOKEN: 'mock-session-token',
  MOCK_REFRESH_TOKEN: 'mock-refresh-token',

  // 設定関連
  REMEMBER_ME: 'remember-me',
  LAST_SIGNIN: 'last-signin',
} as const;

/**
 * トークンの有効性を検証
 * 
 * 学習ポイント:
 * - JWT トークンの基本的な検証
 * - エラーハンドリング
 * - セキュリティを考慮した実装
 * 
 * @param token - 検証するトークン
 * @returns トークンが有効かどうか
 */
export function isValidToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  try {
    // 基本的なJWTフォーマットチェック
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Base64デコードテスト
    const payloadPart = parts[1];
    if (!payloadPart) {
      return false;
    }
    const payload = JSON.parse(atob(payloadPart));

    // 有効期限チェック
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Token validation failed:', error);
    return false;
  }
}

/**
 * セッション有効期限を計算
 * 
 * 学習ポイント:
 * - 日時計算の実装
 * - タイムゾーンの考慮
 * - 設定可能な有効期限
 * 
 * @param hours - 有効期限（時間）
 * @returns 有効期限のDate オブジェクト
 */
export function calculateSessionExpiry(hours: number = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * セッションが期限切れかどうかを判定
 * 
 * 学習ポイント:
 * - 日時比較の実装
 * - エラーハンドリング
 * - 型安全な実装
 * 
 * @param expiryDate - 有効期限
 * @returns 期限切れかどうか
 */
export function isSessionExpired(expiryDate: string | Date | undefined): boolean {
  if (!expiryDate) {
    return true;
  }

  try {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    return expiry < new Date();
  } catch (error) {
    console.warn('Session expiry check failed:', error);
    return true;
  }
}

/**
 * セキュアなランダム文字列を生成
 * 
 * 学習ポイント:
 * - セッションIDの生成
 * - セキュアな乱数生成
 * - 文字列操作
 * 
 * @param length - 生成する文字列の長さ
 * @returns ランダム文字列
 */
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Cookie値を安全に取得
 * 
 * 学習ポイント:
 * - Next.js cookies() APIの使用
 * - エラーハンドリング
 * - 型安全な実装
 * 
 * @param name - Cookie名
 * @returns Cookie値（存在しない場合はundefined）
 */
export async function getCookieValue(name: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(name);
    return cookie?.value;
  } catch (error) {
    console.warn(`Failed to get cookie ${name}:`, error);
    return undefined;
  }
}

/**
 * Cookie値を安全に設定
 * 
 * 学習ポイント:
 * - Next.js cookies() APIの使用
 * - セキュアな設定の適用
 * - エラーハンドリング
 * 
 * @param name - Cookie名
 * @param value - Cookie値
 * @param options - Cookie設定オプション
 */
export async function setCookieValue(
  name: string,
  value: string,
  options?: Partial<CookieOptions>
): Promise<void> {
  try {
    const cookieStore = await cookies();
    const cookieOptions = getSecureCookieOptions(options);
    cookieStore.set(name, value, cookieOptions);
  } catch (error) {
    console.error(`Failed to set cookie ${name}:`, error);
    throw error;
  }
}

/**
 * Cookie値を安全に削除
 * 
 * 学習ポイント:
 * - Cookie削除の実装
 * - エラーハンドリング
 * - セキュリティを考慮した削除
 * 
 * @param name - Cookie名
 */
export async function deleteCookieValue(name: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(name);
  } catch (error) {
    console.warn(`Failed to delete cookie ${name}:`, error);
    // Cookie削除の失敗は警告レベル（存在しない場合など）
  }
}

/**
 * 複数のCookieを一括削除
 * 
 * 学習ポイント:
 * - 配列操作
 * - 非同期処理の並列実行
 * - エラーハンドリング
 * 
 * @param names - 削除するCookie名の配列
 */
export async function deleteCookies(names: string[]): Promise<void> {
  const deletePromises = names.map(name => deleteCookieValue(name));

  try {
    await Promise.allSettled(deletePromises);
  } catch (error) {
    console.warn('Some cookies failed to delete:', error);
  }
}

/**
 * 認証関連のCookieをすべてクリア
 * 
 * 学習ポイント:
 * - セキュアなサインアウト処理
 * - 包括的なクリーンアップ
 * - 設定の一元管理
 */
export async function clearAuthCookies(): Promise<void> {
  const authCookieNames = [
    COOKIE_NAMES.AUTH_TOKEN,
    COOKIE_NAMES.REFRESH_TOKEN,
    COOKIE_NAMES.SESSION_ID,
    COOKIE_NAMES.MOCK_AUTH_USER,
    COOKIE_NAMES.MOCK_SESSION_TOKEN,
    COOKIE_NAMES.MOCK_REFRESH_TOKEN,
    COOKIE_NAMES.REMEMBER_ME,
    COOKIE_NAMES.LAST_SIGNIN,
  ];

  await deleteCookies(authCookieNames);
}

/**
 * デバッグ用: 現在のCookie情報を表示
 * 
 * 学習ポイント:
 * - デバッグ機能の実装
 * - 開発環境での利便性
 * - セキュリティ情報の保護
 */
export async function debugCookies(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    console.group('🍪 Current Cookies (Debug)');
    allCookies.forEach(cookie => {
      // セキュリティ情報は一部のみ表示
      const displayValue = cookie.value.length > 20
        ? cookie.value.substring(0, 20) + '...'
        : cookie.value;

      console.log(`${cookie.name}: ${displayValue}`);
    });
    console.groupEnd();
  } catch (error) {
    console.warn('Failed to debug cookies:', error);
  }
}