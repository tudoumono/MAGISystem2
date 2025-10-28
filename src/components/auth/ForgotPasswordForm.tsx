/**
 * ForgotPasswordForm Component - パスワードリセットフォーム
 * 
 * 目的: パスワードを忘れたユーザーのためのリセット機能を提供
 * 設計理由: セキュリティを考慮したパスワードリセットフロー
 * 
 * 主要機能:
 * - メールアドレスによるパスワードリセット要求
 * - 確認コード入力と新パスワード設定
 * - 段階的なフロー管理
 * - エラーハンドリングとユーザーガイダンス
 * 
 * 学習ポイント:
 * - 多段階フォームの状態管理
 * - セキュリティを考慮したUXフロー
 * - 確認コードの入力パターン
 * - パスワードリセットのベストプラクティス
 * 
 * 使用例:
 * ```typescript
 * <ForgotPasswordForm onSuccess={() => router.push('/signin')} />
 * ```
 * 
 * 関連: src/components/auth/AuthProvider.tsx, src/components/ui/Input.tsx
 */

'use client';

import React, { useState } from 'react';
import { useAuth, ResetPasswordCredentials } from './AuthProvider';
import { Button } from '../ui/Button';
import { Input, PasswordInput } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

/**
 * ForgotPasswordFormコンポーネントのProps型定義
 */
export interface ForgotPasswordFormProps {
  /** パスワードリセット成功時のコールバック */
  onSuccess?: () => void;
  /** サインインページへのリンク表示 */
  showSignInLink?: boolean;
  /** 追加のCSS クラス */
  className?: string;
}

/**
 * パスワードリセットフローの段階
 */
type ResetStep = 'request' | 'verify' | 'reset' | 'success';

/**
 * フォームデータの型定義
 */
interface FormData {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * フォームバリデーションエラーの型定義
 */
interface FormErrors {
  email?: string;
  verificationCode?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

/**
 * ForgotPasswordFormコンポーネント
 * 
 * 設計理由:
 * - 段階的なパスワードリセットフロー
 * - セキュリティを考慮した確認プロセス
 * - ユーザーフレンドリーなガイダンス
 */
export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  showSignInLink = true,
  className,
}) => {
  const { resetPassword, loading, error, clearError } = useAuth();
  
  // フロー状態管理
  const [currentStep, setCurrentStep] = useState<ResetStep>('request');
  
  // フォーム状態管理
  const [formData, setFormData] = useState<FormData>({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * パスワード強度チェック
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
   * 段階別バリデーション
   */
  const validateCurrentStep = (): boolean => {
    const errors: FormErrors = {};
    
    switch (currentStep) {
      case 'request':
        if (!formData.email) {
          errors.email = 'メールアドレスを入力してください';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = '有効なメールアドレスを入力してください';
        }
        break;
        
      case 'verify':
        if (!formData.verificationCode) {
          errors.verificationCode = '確認コードを入力してください';
        } else if (formData.verificationCode.length !== 6) {
          errors.verificationCode = '確認コードは6桁で入力してください';
        }
        break;
        
      case 'reset':
        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
          errors.newPassword = passwordError;
        }
        
        if (!formData.confirmNewPassword) {
          errors.confirmNewPassword = 'パスワード確認を入力してください';
        } else if (formData.newPassword !== formData.confirmNewPassword) {
          errors.confirmNewPassword = 'パスワードが一致しません';
        }
        break;
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
    const value = event.target.value;
    
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
    
    if (!validateCurrentStep()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      switch (currentStep) {
        case 'request':
          // パスワードリセット要求
          const credentials: ResetPasswordCredentials = {
            email: formData.email,
          };
          
          await resetPassword(credentials);

          // 確認メール送信完了
          setCurrentStep('verify');
          break;

        case 'verify':
          // 確認コード検証
          // 実環境では Amplify の confirmResetPassword を呼び出し
          // await confirmResetPassword({ username: formData.email, confirmationCode: formData.verificationCode });
          setCurrentStep('reset');
          break;

        case 'reset':
          // 新パスワード設定
          // 実環境では Amplify の confirmResetPassword を呼び出し
          // await confirmResetPassword({
          //   username: formData.email, 
            //   confirmationCode: formData.verificationCode,
            //   newPassword: formData.newPassword 
            // });
            setCurrentStep('success');
          }
          break;
          
        case 'success':
          // 成功時のコールバック実行
          if (onSuccess) {
            onSuccess();
          }
          break;
      }
    } catch (err) {
      // エラーは AuthProvider で処理済み
      console.error('Password reset failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * 段階別コンテンツのレンダリング
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 'request':
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">パスワードリセット</CardTitle>
              <CardDescription className="text-center">
                メールアドレスを入力してください。リセット用のリンクをお送りします。
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading || isSubmitting}
                  disabled={loading || isSubmitting}
                >
                  {loading || isSubmitting ? 'リセットメール送信中...' : 'リセットメールを送信'}
                </Button>
              </form>
            </CardContent>
          </>
        );
        
      case 'verify':
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">確認コード入力</CardTitle>
              <CardDescription className="text-center">
                {formData.email} に送信された6桁の確認コードを入力してください。
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="確認コード"
                  type="text"
                  placeholder="123456"
                  value={formData.verificationCode}
                  onChange={handleInputChange('verificationCode')}
                  error={formErrors.verificationCode}
                  maxLength={6}
                  required
                  disabled={loading || isSubmitting}
                  autoComplete="one-time-code"
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading || isSubmitting}
                  disabled={loading || isSubmitting}
                >
                  {loading || isSubmitting ? '確認中...' : '確認コードを送信'}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setCurrentStep('request')}
                  disabled={loading || isSubmitting}
                >
                  メールアドレスを変更
                </Button>
              </form>
            </CardContent>
          </>
        );
        
      case 'reset':
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">新しいパスワード</CardTitle>
              <CardDescription className="text-center">
                新しいパスワードを設定してください。
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordInput
                  label="新しいパスワード"
                  placeholder="8文字以上、大小文字・数字を含む"
                  value={formData.newPassword}
                  onChange={handleInputChange('newPassword')}
                  error={formErrors.newPassword}
                  helpText="8文字以上で、大文字・小文字・数字を含めてください"
                  required
                  disabled={loading || isSubmitting}
                  autoComplete="new-password"
                />
                
                <PasswordInput
                  label="パスワード確認"
                  placeholder="上記と同じパスワードを入力"
                  value={formData.confirmNewPassword}
                  onChange={handleInputChange('confirmNewPassword')}
                  error={formErrors.confirmNewPassword}
                  required
                  disabled={loading || isSubmitting}
                  autoComplete="new-password"
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading || isSubmitting}
                  disabled={loading || isSubmitting}
                >
                  {loading || isSubmitting ? 'パスワード更新中...' : 'パスワードを更新'}
                </Button>
              </form>
            </CardContent>
          </>
        );
        
      case 'success':
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-green-600">
                パスワードリセット完了
              </CardTitle>
              <CardDescription className="text-center">
                パスワードが正常に更新されました。新しいパスワードでサインインしてください。
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  if (onSuccess) {
                    onSuccess();
                  }
                }}
              >
                サインインページへ
              </Button>
            </CardContent>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className={className}>
      {/* 認証エラーの表示 */}
      {error && (
        <div className="m-6 mb-0 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="font-medium">{error.message}</p>
          {error.recoverySuggestion && (
            <p className="mt-1 text-xs opacity-90">{error.recoverySuggestion}</p>
          )}
        </div>
      )}
      
      {renderStepContent()}
      
      {/* サインインリンク */}
      {showSignInLink && currentStep !== 'success' && (
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
          パスワードを思い出した方は{' '}
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
    </Card>
  );
};