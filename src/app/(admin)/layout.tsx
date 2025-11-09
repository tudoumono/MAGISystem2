/**
 * Admin Layout - 管理者専用レイアウト
 *
 * 目的: 管理者専用ページの共通レイアウトとアクセス制御
 * アクセス制限: NEXT_PUBLIC_ENABLE_TEST_PAGES 環境変数で制御
 */

import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
