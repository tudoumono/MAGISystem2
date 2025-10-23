/**
 * Card Component - 統一されたカードレイアウトコンポーネント
 * 
 * 目的: コンテンツをグループ化し、視覚的な階層を提供
 * 設計理由: 一貫したカードスタイルとレイアウトパターンの提供
 * 
 * 主要機能:
 * - ヘッダー、コンテンツ、フッターの構造化
 * - 影とボーダーによる視覚的分離
 * - レスポンシブ対応
 * - アクセシビリティ考慮
 * 
 * 学習ポイント:
 * - コンポーネント合成パターン
 * - React.forwardRef の活用
 * - セマンティックHTML の使用
 * - Tailwind CSS のレイアウトクラス
 * 
 * 使用例:
 * ```typescript
 * <Card>
 *   <CardHeader>
 *     <CardTitle>サインイン</CardTitle>
 *     <CardDescription>アカウントにログインしてください</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <SignInForm />
 *   </CardContent>
 * </Card>
 * ```
 * 
 * 関連: src/components/auth/SignInForm.tsx, src/components/ui/Button.tsx
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
 * CardコンポーネントのProps型定義
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 追加のCSS クラス */
  className?: string | undefined;
  /** 子要素 */
  children?: React.ReactNode;
}

/**
 * メインのCardコンポーネント
 * 
 * 設計理由:
 * - div要素をベースとしたコンテナ
 * - 影とボーダーによる視覚的分離
 * - 角丸とパディングによる親しみやすいデザイン
 * 
 * 学習ポイント:
 * - React.forwardRef による ref 転送
 * - HTMLDivElement の属性継承
 * - Tailwind CSS のシャドウとボーダー
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = 'Card';

/**
 * CardHeaderコンポーネント
 * 
 * 学習ポイント:
 * - セマンティックなheader要素の使用
 * - パディングとボーダーによる視覚的分離
 * - フレックスレイアウトによる配置
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </header>
  )
);

CardHeader.displayName = 'CardHeader';

/**
 * CardTitleコンポーネント
 * 
 * 学習ポイント:
 * - h3要素によるセマンティックな見出し
 * - フォントサイズと行間の調整
 * - アクセシビリティを考慮した見出し階層
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

/**
 * CardDescriptionコンポーネント
 * 
 * 学習ポイント:
 * - p要素による説明文の構造化
 * - 控えめな色とサイズによる階層表現
 * - 読みやすい行間の設定
 */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

/**
 * CardContentコンポーネント
 * 
 * 学習ポイント:
 * - メインコンテンツエリアの定義
 * - 適切なパディングによる読みやすさ
 * - フレキシブルなレイアウト対応
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

/**
 * CardFooterコンポーネント
 * 
 * 学習ポイント:
 * - フッターエリアの構造化
 * - フレックスレイアウトによるボタン配置
 * - 適切な間隔とパディング
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <footer
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    >
      {children}
    </footer>
  )
);

CardFooter.displayName = 'CardFooter';