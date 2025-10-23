/**
 * Input Component - 統一された入力フィールドコンポーネント
 * 
 * 目的: フォーム入力の一貫したスタイルとバリデーション機能を提供
 * 設計理由: アクセシビリティ、エラーハンドリング、ラベル管理を統一
 * 
 * 主要機能:
 * - 複数の入力タイプ対応（text、email、password等）
 * - エラー状態の視覚的表示
 * - ラベルとヘルプテキストの統合管理
 * - アクセシビリティ属性の自動設定
 * 
 * 学習ポイント:
 * - React.forwardRef による ref 転送
 * - TypeScript での HTML 属性の継承
 * - アクセシビリティ（ARIA）属性の適切な使用
 * - エラー状態の管理パターン
 * 
 * 使用例:
 * ```typescript
 * <Input
 *   label="メールアドレス"
 *   type="email"
 *   placeholder="example@domain.com"
 *   error="有効なメールアドレスを入力してください"
 *   required
 * />
 * ```
 * 
 * 関連: src/components/ui/Button.tsx, src/components/auth/SignInForm.tsx
 */

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * クラス名を結合するユーティリティ関数
 */
function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return twMerge(clsx(inputs));
}

/**
 * 入力フィールドのProps型定義
 * 
 * 学習ポイント:
 * - React.InputHTMLAttributes の継承
 * - カスタムプロパティの追加
 * - オプショナルプロパティの適切な定義
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** ラベルテキスト */
  label?: string | undefined;
  /** エラーメッセージ */
  error?: string | undefined;
  /** ヘルプテキスト */
  helpText?: string | undefined;
  /** 追加のCSS クラス */
  className?: string | undefined;
  /** ラベルのCSS クラス */
  labelClassName?: string | undefined;
  /** コンテナのCSS クラス */
  containerClassName?: string | undefined;
}

/**
 * Inputコンポーネント
 * 
 * 設計理由:
 * - ラベル、入力フィールド、エラーメッセージを一体化
 * - アクセシビリティ属性の自動設定
 * - エラー状態の視覚的フィードバック
 * 
 * 学習ポイント:
 * - React.forwardRef の使用パターン
 * - 条件付きレンダリングの実装
 * - ARIA属性による支援技術対応
 * - CSS クラスの動的適用
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    labelClassName,
    containerClassName,
    label,
    error,
    helpText,
    id,
    required,
    disabled,
    ...props 
  }, ref) => {
    // 一意のIDを生成（ラベルとの関連付けに使用）
    const inputId = id || `input-${React.useId()}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helpId = helpText ? `${inputId}-help` : undefined;
    
    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* ラベル */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-foreground',
              required && 'after:content-["*"] after:ml-0.5 after:text-destructive',
              disabled && 'text-muted-foreground',
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        
        {/* 入力フィールド */}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            // ベーススタイル
            'flex h-10 w-full rounded-md border px-3 py-2',
            'text-sm placeholder:text-muted-foreground',
            'transition-colors duration-200',
            
            // フォーカス状態
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            
            // 通常状態
            !error && 'border-input bg-background focus-visible:ring-ring hover:border-ring/50',
            
            // エラー状態
            error && 'border-destructive bg-destructive/5 focus-visible:ring-destructive placeholder:text-destructive/60',
            
            // 無効状態
            disabled && 'cursor-not-allowed opacity-50 bg-muted text-muted-foreground',
            
            className
          )}
          required={required}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            errorId,
            helpId
          ).trim() || undefined}
          {...props}
        />
        
        {/* ヘルプテキスト */}
        {helpText && !error && (
          <p
            id={helpId}
            className="text-xs text-muted-foreground"
          >
            {helpText}
          </p>
        )}
        
        {/* エラーメッセージ */}
        {error && (
          <p
            id={errorId}
            className="text-xs text-destructive flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="h-3 w-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * パスワード入力コンポーネント
 * 
 * 学習ポイント:
 * - パスワード表示/非表示の切り替え
 * - セキュリティを考慮したUX
 * - アイコンボタンの実装
 */
export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /** パスワード強度の表示 */
  showStrength?: boolean | undefined;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };
    
    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', props.className)}
        />
        
        {/* パスワード表示切り替えボタン */}
        <button
          type="button"
          className={cn(
            'absolute right-0 top-0 h-full px-3',
            'flex items-center text-muted-foreground',
            'hover:text-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-md'
          )}
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
          tabIndex={0}
        >
          {showPassword ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';