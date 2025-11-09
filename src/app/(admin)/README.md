# Admin Section - 管理者専用エリア

## 概要

このディレクトリには開発・デバッグ用の管理者専用ページが含まれています。

## アクセス制御

環境変数 `NEXT_PUBLIC_ENABLE_TEST_PAGES` で制御されます。

### 開発環境で有効化

`.env.local` ファイルに以下を追加：

```bash
NEXT_PUBLIC_ENABLE_TEST_PAGES=true
```

### 本番環境で無効化（推奨）

```bash
NEXT_PUBLIC_ENABLE_TEST_PAGES=false
```

または環境変数を設定しない（デフォルトで無効）

## 利用可能なページ

### テストダッシュボード
- **URL**: `/admin/test`
- **用途**: 開発・デバッグ用の統合テストダッシュボード
- **機能**:
  - システム診断
  - API Health Check
  - データモデルテスト（実装予定）
  - 統合テスト（実装予定）
  - UI/UXテスト（実装予定）

## 新しいテストページの追加方法

1. **テストページを作成**:
   ```
   src/app/(admin)/test/your-test/page.tsx
   ```

2. **テストダッシュボードにカードを追加**:
   `src/app/(admin)/test/page.tsx` に `TestCard` を追加

3. **アクセス制御は自動的に適用**:
   `(admin)` ルートグループ配下のすべてのページは環境変数で制御されます

## セキュリティ上の注意

⚠️ **重要**: 本番環境では必ず `NEXT_PUBLIC_ENABLE_TEST_PAGES=false` に設定してください。

- テストページには機密情報や内部実装の詳細が含まれる可能性があります
- 一般ユーザーがアクセスできないようにする必要があります
- 環境変数が設定されていない場合、自動的にダッシュボードにリダイレクトされます

## アーキテクチャ

```
src/app/(admin)/
├── layout.tsx          # 管理者レイアウト
├── test/
│   ├── page.tsx        # テストダッシュボード
│   ├── your-test/      # カスタムテストページ
│   │   └── page.tsx
│   └── ...
└── README.md           # このファイル
```

## 実装例

```tsx
// src/app/(admin)/test/my-test/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyTestPage() {
  const router = useRouter();

  useEffect(() => {
    // アクセス制御
    if (process.env.NEXT_PUBLIC_ENABLE_TEST_PAGES !== 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div>
      <h1>My Test Page</h1>
      {/* テストコンテンツ */}
    </div>
  );
}
```
