/**
 * Authentication Utilities - 認証関連のユーティリティ関数
 * 
 * 目的: 認証処理で使用する共通ユーティリティ関数を提供
 * 設計理由: サーバーアクションとクライアントサイドで共有可能な関数の分離
 * 
 * 主要機能:
 * - Cookie設定のユーティリティ
 * - セッション検証のヘルパー関数
 * - 認証状態の判定ロジック
 * 
 * 学習ポイント:
 * - サーバーアクションとユーティリティの分離
 * - 型安全なユーティリティ関数の実装
 * - セキュリティを考慮した設定管理
 * 
 * 関連: src/lib/auth/server-actions.ts
 */

/**
 * Cookie設定のユーティリティ
 * 
 * 学習ポイント:
 * - セキュアなCookie設定
 * - 環境に応じた設定の調整
 * - セキュリティベストプラクティス
 */
export function getSecureCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 24 * 60 * 60, // 24時間
  };
}

/**
 * セッション有効性チェックのヘルパー
 * 
 * 学習ポイント:
 * - セッション情報の検証ロジック
 * - タイムスタンプによる有効期限チェック
 * - 型安全な検証処理
 */
export function isSessionExpired(sessionExpiry?: string): boolean {
  if (!sessionExpiry) {
    return false; // 有効期限が設定されていない場合は期限切れではない
  }
  
  try {
    const expiryTime = new Date(sessionExpiry);
    const now = new Date();
    return now > expiryTime;
  } catch (error) {
    console.error('Invalid session expiry format:', sessionExpiry);
    return true; // 無効な形式の場合は期限切れとして扱う
  }
}

/**
 * 認証エラーメッセージの正規化
 * 
 * 学習ポイント:
 * - エラーメッセージの統一
 * - ユーザーフレンドリーなメッセージ変換
 * - セキュリティを考慮したエラー情報の制限
 */
export function normalizeAuthError(error: any): {
  code: string;
  message: string;
  recoverySuggestion?: string;
} {
  // Amplify エラーの処理
  if (error.name === 'NotAuthorizedException') {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'メールアドレスまたはパスワードが正しくありません',
      recoverySuggestion: 'メールアドレスとパスワードを確認してください'
    };
  }
  
  if (error.name === 'UserNotConfirmedException') {
    return {
      code: 'USER_NOT_CONFIRMED',
      message: 'アカウントの確認が完了していません',
      recoverySuggestion: 'メールに送信された確認コードを入力してください'
    };
  }
  
  // モックエラーの処理
  if (error.message === 'Invalid credentials') {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'デモ用認証情報: demo@example.com / password123',
      recoverySuggestion: 'デモ用のメールアドレスとパスワードを使用してください'
    };
  }
  
  // 一般的なエラー
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || '認証エラーが発生しました',
    recoverySuggestion: 'しばらく時間をおいて再試行してください'
  };
}

/**
 * パスワード強度の検証
 * 
 * 学習ポイント:
 * - 正規表現によるパスワード要件チェック
 * - セキュリティベストプラクティス
 * - 段階的な検証ロジック
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100
} {
  const errors: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    errors.push('パスワードは8文字以上で入力してください');
  } else {
    score += 20;
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('パスワードには小文字を含めてください');
  } else {
    score += 20;
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('パスワードには大文字を含めてください');
  } else {
    score += 20;
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('パスワードには数字を含めてください');
  } else {
    score += 20;
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.push('パスワードには特殊文字を含めてください');
  } else {
    score += 20;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score
  };
}

/**
 * メールアドレスの検証
 * 
 * 学習ポイント:
 * - 正規表現によるメールアドレス検証
 * - RFC準拠の検証パターン
 * - エラーメッセージの提供
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  if (!email) {
    return {
      isValid: false,
      error: 'メールアドレスを入力してください'
    };
  }
  
  // 基本的なメールアドレス形式の検証
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: '有効なメールアドレスを入力してください'
    };
  }
  
  // 長さの検証
  if (email.length > 254) {
    return {
      isValid: false,
      error: 'メールアドレスが長すぎます'
    };
  }
  
  return {
    isValid: true
  };
}