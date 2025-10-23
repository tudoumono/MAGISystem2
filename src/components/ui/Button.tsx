/**
 * Button Component - 統一されたボタンコンポーネント
 * 
 * 目的: アプリケーション全体で一貫したボタンスタイルを提供
 * 設計理由: バリアント、サイズ、状態を統一管理し、アクセシビリティを確保
 * 
 * 主要機能:
 * - 複数のバリアント（primary、secondary、destructive等）
 * - サイズバリエーション（sm、md、lg）
 * - ローディング状態とアクセシビリティ対応
 * - フォーカス管理とキーボードナビゲーション
 * 
 * 学習ポイント:
 * - React.forwardRef の使用方法
 * - TypeScript での props の型定義
 * - Tailwind CSS のバリアント管理
 * - アクセシビリティ属性の適切な使用
 * 
 * 使用例:
 * ```typescript
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   サインイン
 * </Button>
 * 
 * <Button variant="secondary" loading disabled>
 *   処理中...
 * </Button>
 * ```
 * 
 * 関連: src/components/ui/Input.tsx, src/lib/utils/cn.ts
 */

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * クラス名を結合するユーティリティ関数
 * 
 * 学習ポイント:
 * - clsx: 条件付きクラス名の結合
 * - twMerge: Tailwind CSS クラスの競合解決
 */
function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return twMerge(clsx(inputs));
}

/**
 * ボタンのバリアント定義
 * 
 * 学習ポイント:
 * - オブジェクトによるスタイルバリアントの管理
 * - Tailwind CSS クラスの組み合わせパターン
 * - ホバー、フォーカス、無効化状態の統一
 */
const buttonVariants = {
  variant: {
    primary: [
      'bg-primary text-primary-foreground',
      'hover:bg-primary/90',
      'focus-visible:ring-primary',
      'disabled:bg-primary/50'
    ].join(' '),
    
    secondary: [
      'bg-secondary text-secondary-foreground',
      'hover:bg-secondary/80',
      'focus-visible:ring-secondary',
      'disabled:bg-secondary/50'
    ].join(' '),
    
    destructive: [
      'bg-destructive text-destructive-foreground',
      'hover:bg-destructive/90',
      'focus-visible:ring-destructive',
      'disabled:bg-destructive/50'
    ].join(' '),
    
    outline: [
      'border border-input bg-background',
      'hover:bg-accent hover:text-accent-foreground',
      'focus-visible:ring-ring',
      'disabled:bg-background/50'
    ].join(' '),
    
    ghost: [
      'hover:bg-accent hover:text-accent-foreground',
      'focus-visible:ring-ring',
      'disabled:bg-transparent disabled:text-muted-foreground'
    ].join(' '),
    
    link: [
      'text-primary underline-offset-4',
      'hover:underline',
      'focus-visible:ring-primary',
      'disabled:text-muted-foreground disabled:no-underline'
    ].join(' '),
  },
  
  size: {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg',
    icon: 'h-10 w-10',
  },
};

/**
 * ボタンコンポーネントのProps型定義
 * 
 * 学習ポイント:
 * - React.ButtonHTMLAttributes の継承
 * - オプショナルプロパティの定義
 * - バリアント型の制約
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** ボタンのスタイルバリアント */
  variant?: keyof typeof buttonVariants.variant;
  /** ボタンのサイズ */
  size?: keyof typeof buttonVariants.size;
  /** ローディング状態 */
  loading?: boolean;
  /** 追加のCSS クラス */
  className?: string;
  /** 子要素 */
  children?: React.ReactNode;
}

/**
 * ローディングスピナーコンポーネント
 * 
 * 学習ポイント:
 * - SVG アニメーションの実装
 * - アクセシビリティ属性（aria-hidden）
 * - CSS アニメーションとの組み合わせ
 */
const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Buttonコンポーネント
 * 
 * 設計理由:
 * - forwardRef でref の転送を可能にする
 * - 条件付きレンダリングでローディング状態を管理
 * - アクセシビリティ属性を適切に設定
 * 
 * 学習ポイント:
 * - React.forwardRef の型定義
 * - 条件付きクラス名の適用
 * - disabled 状態の管理
 * - aria-disabled とdisabled の使い分け
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    // ローディング中または明示的に無効化されている場合
    const isDisabled = loading || disabled;
    
    return (
      <button
        className={cn(
          // ベーススタイル
          'inline-flex items-center justify-center gap-2',
          'rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // バリアントとサイズの適用
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          
          // カスタムクラス
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* ローディングスピナー */}
        {loading && (
          <LoadingSpinner className="h-4 w-4" />
        )}
        
        {/* ボタンテキスト */}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * ボタングループコンポーネント
 * 
 * 学習ポイント:
 * - 複数ボタンの統一レイアウト
 * - フレックスボックスによる配置
 * - レスポンシブ対応
 */
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ 
  children, 
  className,
  orientation = 'horizontal'
}) => {
  return (
    <div
      className={cn(
        'flex gap-2',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';