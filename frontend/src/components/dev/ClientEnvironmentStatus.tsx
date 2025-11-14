/**
 * Client Environment Status Component - クライアントサイド環境ステータス
 * 
 * このコンポーネントはクライアントサイドでのみ動作する環境ステータス表示です。
 * ルートレイアウトから呼び出され、開発環境でのみ表示されます。
 * 
 * 目的:
 * - SSRとの互換性確保
 * - クライアントサイドでの環境情報表示
 * - 開発者向けデバッグ支援
 * 
 * 設計理由:
 * - 'use client'ディレクティブによるクライアントコンポーネント化
 * - 条件付きレンダリングによる本番環境での非表示
 * - 固定位置での常時表示
 * 
 * 学習ポイント:
 * - Next.js 15のServer/Client Components分離
 * - 環境変数によるコンポーネント制御
 * - 開発者体験の向上手法
 * 
 * 使用例:
 * ```typescript
 * // layout.tsx で使用
 * <ClientEnvironmentStatus />
 * ```
 * 
 * 関連: src/components/dev/EnvironmentStatus.tsx, src/app/layout.tsx
 */

'use client';

import { EnvironmentStatus } from './EnvironmentStatus';

/**
 * Client Environment Status Component
 * 
 * 学習ポイント:
 * - クライアントサイドでのみ実行される
 * - 開発環境でのみ表示される
 * - 固定位置（右下）に配置される
 * - コンパクトモードで表示される
 */
export default function ClientEnvironmentStatus() {
  return (
    <EnvironmentStatus 
      compact
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    />
  );
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. ルートレイアウトでの使用:
 * ```typescript
 * // src/app/layout.tsx
 * import ClientEnvironmentStatus from '@/components/dev/ClientEnvironmentStatus';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <ClientEnvironmentStatus />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * 2. 条件付き表示:
 * ```typescript
 * // 開発環境でのみ表示（自動判定）
 * <ClientEnvironmentStatus />
 * 
 * // 管理者向けに常時表示
 * <EnvironmentStatus showAlways />
 * ```
 * 
 * 3. カスタム配置:
 * ```typescript
 * <EnvironmentStatus 
 *   compact
 *   className="fixed top-4 left-4 z-50"
 * />
 * ```
 */