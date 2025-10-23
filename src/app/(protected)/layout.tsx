/**
 * Protected Layout - 保護されたページのレイアウト
 * 
 * 目的: 認証が必要なページの共通レイアウトと認証ガードを提供
 * 設計理由: 認証チェックとレイアウトの統合による効率的な実装
 * 
 * 主要機能:
 * - 認証ガードによるアクセス制御
 * - 保護されたページの共通レイアウト
 * - ローディング状態の管理
 * - 未認証時の適切なリダイレクト
 * 
 * 学習ポイント:
 * - Next.js 15 App Router のレイアウトコンポーネント
 * - ProtectedRoute コンポーネントの活用
 * - 認証フローの実装パターン
 * - レイアウトとセキュリティの統合
 * 
 * 使用例:
 * ```
 * app/(protected)/
 * ├── layout.tsx (このファイル)
 * ├── dashboard/page.tsx
 * ├── chat/page.tsx
 * └── settings/page.tsx
 * ```
 * 
 * 関連: src/components/auth/ProtectedRoute.tsx, src/middleware.ts
 */

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

/**
 * ProtectedLayoutコンポーネントのProps型定義
 */
interface ProtectedLayoutProps {
  children: React.ReactNode;
}

/**
 * ProtectedLayoutコンポーネント
 * 
 * 設計理由:
 * - 認証ガードとレイアウトの統合
 * - 保護されたページの一貫したUX
 * - 効率的な認証チェック
 * 
 * 学習ポイント:
 * - レイアウトコンポーネントでの認証ガード
 * - ProtectedRoute の適切な使用
 * - 子コンポーネントへの適切な props 渡し
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute
      redirectTo="/signin"
      redirectAfterAuth="/dashboard"
    >
      {children}
    </ProtectedRoute>
  );
}