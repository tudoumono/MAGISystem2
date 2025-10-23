/**
 * Client Environment Status Wrapper - クライアント環境ステータスラッパー
 * 
 * 目的: Next.js 15 Server ComponentからClient Componentを安全に使用
 * 設計理由: Server ComponentとClient Componentの境界を明確にする
 * 
 * 学習ポイント:
 * - Next.js 15のServer/Client Component分離
 * - 動的インポートの適切な使用
 * - 開発環境での条件付きレンダリング
 */

'use client';

import dynamic from 'next/dynamic';

// 環境ステータスコンポーネントを動的にロード
const EnvironmentStatus = dynamic(
  () => import('./EnvironmentStatus'),
  { 
    ssr: false, // クライアントサイドでのみレンダリング
    loading: () => null // ローディング中は何も表示しない
  }
);

/**
 * クライアント環境ステータスコンポーネント
 * 
 * 学習ポイント:
 * - 'use client'ディレクティブによるClient Component化
 * - 開発環境でのみ表示する条件分岐
 * - 動的インポートによる遅延ローディング
 */
export default function ClientEnvironmentStatus(): JSX.Element | null {
  // 本番環境では表示しない
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return <EnvironmentStatus />;
}