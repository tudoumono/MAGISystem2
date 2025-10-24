/**
 * SignInForm Component - サインインフォーム
 * 
 * 目的: ユーザー認証のためのサインインインターフェースを提供
 * 設計理由: バリデーション、エラーハンドリング、UX最適化を統合
 * 
 * 主要機能:
 * - メールアドレスとパスワードによる認証
 * - リアルタイムバリデーション
 * - エラー表示とユーザーガイダンス
 * - ローディング状態の管理
 * 
 * 学習ポイント:
 * - React Hook Form による状態管理
 * - TypeScript でのフォームバリデーション
 * - useAuth フックとの連携
 * - アクセシビリティ対応
 * 
 * 使用例:
 * ```typescript
 * <SignInForm onSuccess={() => router.push('/dashboard')} />
 * ```
 * 
 * 関連: src/components/auth/AuthProvider.tsx, src/components/ui/Input.tsx
 */

'use client';

import React, { useState } from 'react';
import { useAuth, SignInCredentials } from './AuthProvider';
import { Button } from '../ui/Button';
import { Input, PasswordInput } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

/**
 * SignInFormコンポーネントのProps型定義
 */
export interface SignInFormProps {
  /** サインイン成功時のコールバック */
  onSuccess?: (() => void) | undefined;
  /** サインアップページへのリンク表示 */
  showSignUpLink?: boolean | undefined;
  /** パスワードリセットリンク表示 */
  showForgotPasswordLink?: boolean | undefined;
  /** 追加のCSS クラス */
  className?: string | undefined;
}

/**
 * フォームデータの型定義
 */
interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * フォームバリデーションエラーの型定義
 */
interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * SignInFormコンポーネント
 * 
 * 設計理由:
 * - 制御されたコンポーネントによる状態管理
 * - リアルタイムバリデーション
 * - エラー状態の適切な表示
 * - ローディング状態のUX最適化
 */
export const SignInForm: React.FC<SignInFormProps> = ({
  onSuccess,
  showSignUpLink = true,
  showForgotPasswordLink = true,
  className,
}) => {
  const { signIn, loading, error, clearError, isMockMode, isAuthenticated } = useAuth();
  
  // Hydrationエラー回避のためのクライアントサイド判定
  const [isClient, setIsClient] = useState(false);
  
  // フォーム状態管理
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // クライアントサイドマウント検出
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 認証成功後の処理
  React.useEffect(() => {
    console.log('SignInForm useEffect - isAuthenticated:', isAuthenticated, 'isSubmitting:', isSubmitting, 'loading:', loading);
    if (isAuthenticated && !loading) {
      console.log('Authentication successful, calling onSuccess callback');
      
      // isSubmittingをリセット
      if (isSubmitting) {
        setIsSubmitting(false);
      }
      
      // 認証成功コールバックを実行
      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      }
    }
  }, [isAuthenticated, loading, onSuccess]);
  
  /**
   * バリデーション関数
   * 
   * 学習ポイント:
   * - メールアドレスの正規表現チェック
   * - パスワード強度の基本チェック
   * - エラーメッセージの日本語対応
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // メールアドレスのバリデーション
    if (!formData.email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    // パスワードのバリデーション
    if (!formData.password) {
      errors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      errors.password = 'パスワードは6文字以上で入力してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  /**
   * 入力値変更ハンドラー
   * 
   * 学習ポイント:
   * - 制御されたコンポーネントの実装
   * - エラークリアのタイミング
   * - 型安全な状態更新
   */
  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // エラークリア
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
    
    if (error) {
      clearError();
    }
  };
  
  /**
   * フォーム送信ハンドラー
   * 
   * 学習ポイント:
   * - 非同期処理のエラーハンドリング
   * - ローディング状態の管理
   * - 成功時のコールバック実行
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      console.log('Starting sign in process...');
      setIsSubmitting(true);
      
      const credentials: SignInCredentials = {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      };
      
      console.log('Calling signIn with credentials:', { email: credentials.email });
      await signIn(credentials);
      console.log('signIn completed successfully');
      
      // 認証成功の場合、useEffectでonSuccessが呼ばれる
      // isSubmittingはuseEffectまたはcatchブロックでfalseに設定される
    } catch (err) {
      // エラーは AuthProvider で処理済み
      console.error('Sign in failed:', err);
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card {...(className && { className })}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">サインイン</CardTitle>
        <CardDescription className="text-center">
          {!isClient ? (
            'アカウントにログインしてください'
          ) : isMockMode ? (
            <>
              デモモード: <code className="text-xs bg-muted px-1 rounded">demo@demo.com</code> / <code className="text-xs bg-muted px-1 rounded">P@ssw0rd</code>
            </>
          ) : (
            'アカウントにログインしてください'
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 認証エラーの表示 */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="font-medium">{error.message}</p>
              {error.recoverySuggestion && (
                <p className="mt-1 text-xs opacity-90">{error.recoverySuggestion}</p>
              )}
            </div>
          )}
          
          {/* メールアドレス入力 */}
          <Input
            label="メールアドレス"
            type="email"
            placeholder="example@domain.com"
            value={formData.email}
            onChange={handleInputChange('email')}
            {...(formErrors.email && { error: formErrors.email })}
            required
            disabled={loading || isSubmitting}
            autoComplete="email"
          />
          
          {/* パスワード入力 */}
          <PasswordInput
            label="パスワード"
            placeholder="パスワードを入力"
            value={formData.password}
            onChange={handleInputChange('password')}
            {...(formErrors.password && { error: formErrors.password })}
            required
            disabled={loading || isSubmitting}
            autoComplete="current-password"
          />
          
          {/* ログイン状態保持 */}
          <div className="flex items-center space-x-2">
            <input
              id="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange('rememberMe')}
              disabled={loading || isSubmitting}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
              ログイン状態を保持する
            </label>
          </div>
          
          {/* サインインボタン */}
          <Button
            type="submit"
            className="w-full"
            loading={loading || isSubmitting}
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? 'サインイン中...' : 'サインイン'}
          </Button>
        </form>
        
        {/* 追加リンク */}
        <div className="mt-6 space-y-2 text-center text-sm">
          {showForgotPasswordLink && (
            <div>
              <button
                type="button"
                className="text-primary hover:underline focus:outline-none focus:underline"
                onClick={() => {
                  // パスワードリセット機能は後のPhaseで実装
                  alert('パスワードリセット機能は今後のPhaseで実装予定です');
                }}
              >
                パスワードをお忘れですか？
              </button>
            </div>
          )}
          
          {showSignUpLink && (
            <div className="text-muted-foreground">
              アカウントをお持ちでない方は{' '}
              <button
                type="button"
                className="text-primary hover:underline focus:outline-none focus:underline"
                onClick={() => {
                  // サインアップページに遷移
                  window.location.href = '/signup';
                }}
              >
                新規登録
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};