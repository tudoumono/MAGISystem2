/**
 * SignUpForm Component - サインアップフォーム
 * 
 * 目的: 新規ユーザー登録のためのインターフェースを提供
 * 設計理由: バリデーション、パスワード確認、利用規約同意を統合
 * 
 * 主要機能:
 * - メールアドレス、パスワード、名前の入力
 * - パスワード確認とバリデーション
 * - 利用規約への同意確認
 * - エラーハンドリングとユーザーガイダンス
 * 
 * 学習ポイント:
 * - フォームバリデーションの実装パターン
 * - パスワード強度チェック
 * - 確認フィールドの実装
 * - 利用規約同意のUXパターン
 * 
 * 使用例:
 * ```typescript
 * <SignUpForm onSuccess={() => router.push('/verify-email')} />
 * ```
 * 
 * 関連: src/components/auth/AuthProvider.tsx, src/components/ui/Input.tsx
 */

'use client';

import React, { useState } from 'react';
import { useAuth, SignUpCredentials } from './AuthProvider';
import { Button } from '../ui/Button';
import { Input, PasswordInput } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

/**
 * SignUpFormコンポーネントのProps型定義
 */
export interface SignUpFormProps {
  /** サインアップ成功時のコールバック */
  onSuccess?: () => void;
  /** サインインページへのリンク表示 */
  showSignInLink?: boolean;
  /** 追加のCSS クラス */
  className?: string;
}

/**
 * フォームデータの型定義
 */
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

/**
 * フォームバリデーションエラーの型定義
 */
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

/**
 * SignUpFormコンポーネント
 * 
 * 設計理由:
 * - 包括的なバリデーション
 * - セキュリティを考慮したパスワード要件
 * - ユーザーフレンドリーなエラー表示
 */
export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  showSignInLink = true,
  className,
}) => {
  const { signUp, loading, error, clearError, isMockMode } = useAuth();
  
  // フォーム状態管理
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * パスワード強度チェック
   * 
   * 学習ポイント:
   * - 正規表現によるパスワード要件チェック
   * - セキュリティベストプラクティス
   * - ユーザーフレンドリーなフィードバック
   */
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'パスワードを入力してください';
    }
    
    if (password.length < 8) {
      return 'パスワードは8文字以上で入力してください';
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return 'パスワードには小文字を含めてください';
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'パスワードには大文字を含めてください';
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return 'パスワードには数字を含めてください';
    }
    
    return undefined;
  };
  
  /**
   * フォームバリデーション
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // 名前のバリデーション
    if (!formData.name.trim()) {
      errors.name = '名前を入力してください';
    } else if (formData.name.trim().length < 2) {
      errors.name = '名前は2文字以上で入力してください';
    }
    
    // メールアドレスのバリデーション
    if (!formData.email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    // パスワードのバリデーション
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      errors.password = passwordError;
    }
    
    // パスワード確認のバリデーション
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'パスワード確認を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    // 利用規約同意のバリデーション
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = '利用規約に同意してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  /**
   * 入力値変更ハンドラー
   */
  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'agreeToTerms' ? event.target.checked : event.target.value;
    
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
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const credentials: SignUpCredentials = {
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };
      
      await signUp(credentials);
      
      // 成功時のコールバック実行
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // エラーは AuthProvider で処理済み
      console.error('Sign up failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">新規登録</CardTitle>
        <CardDescription className="text-center">
          {isMockMode ? (
            'デモモード: サインアップ機能をテストできます'
          ) : (
            'アカウントを作成してMAGIシステムを利用開始'
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
          
          {/* 名前入力 */}
          <Input
            label="名前"
            type="text"
            placeholder="山田 太郎"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={formErrors.name}
            required
            disabled={loading || isSubmitting}
            autoComplete="name"
          />
          
          {/* メールアドレス入力 */}
          <Input
            label="メールアドレス"
            type="email"
            placeholder="example@domain.com"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={formErrors.email}
            required
            disabled={loading || isSubmitting}
            autoComplete="email"
          />
          
          {/* パスワード入力 */}
          <PasswordInput
            label="パスワード"
            placeholder="8文字以上、大小文字・数字を含む"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={formErrors.password}
            helpText="8文字以上で、大文字・小文字・数字を含めてください"
            required
            disabled={loading || isSubmitting}
            autoComplete="new-password"
          />
          
          {/* パスワード確認入力 */}
          <PasswordInput
            label="パスワード確認"
            placeholder="上記と同じパスワードを入力"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={formErrors.confirmPassword}
            required
            disabled={loading || isSubmitting}
            autoComplete="new-password"
          />
          
          {/* 利用規約同意 */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <input
                id="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleInputChange('agreeToTerms')}
                disabled={loading || isSubmitting}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-muted-foreground">
                <span className="text-foreground">利用規約</span>および<span className="text-foreground">プライバシーポリシー</span>に同意します
              </label>
            </div>
            {formErrors.agreeToTerms && (
              <p className="text-xs text-destructive">{formErrors.agreeToTerms}</p>
            )}
          </div>
          
          {/* サインアップボタン */}
          <Button
            type="submit"
            className="w-full"
            loading={loading || isSubmitting}
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? 'アカウント作成中...' : 'アカウントを作成'}
          </Button>
        </form>
        
        {/* サインインリンク */}
        {showSignInLink && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は{' '}
            <button
              type="button"
              className="text-primary hover:underline focus:outline-none focus:underline"
              onClick={() => {
                // サインインページへの遷移は親コンポーネントで処理
                alert('サインインページへの遷移機能は親コンポーネントで実装してください');
              }}
            >
              サインイン
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};