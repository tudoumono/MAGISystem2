# Next.js App Router学習ガイド

## 📚 学習目標

このドキュメントでは、MAGI Decision Systemの実装を通じて、Next.js 15のApp Routerの実践的な使用方法を学習します。

## 🎯 Next.js App Routerとは？

Next.js 13で導入され、Next.js 15で完全に成熟したファイルベースルーティングシステムです。React Server Componentsを活用し、パフォーマンスとDXを大幅に向上させます。

### 主要な特徴
- **ファイルベースルーティング**: ディレクトリ構造がURLに対応
- **React Server Components**: サーバーサイドでのコンポーネント実行
- **Streaming**: 段階的なページ読み込み
- **Metadata API**: SEO最適化の新しいアプローチ

## 📁 関連ソースコード

### 主要ファイル
- **`src/app/layout.tsx`** - ルートレイアウト（全ページ共通）
- **`src/app/page.tsx`** - ホームページコンポーネント
- **`src/app/globals.css`** - グローバルスタイル
- **`next.config.js`** - Next.js設定ファイル

## 🏗️ 実装パターン解説

### 1. ルートレイアウトの設計

**ファイル**: `src/app/layout.tsx`

```typescript
/**
 * Root Layout Component
 * 
 * Next.js 15 App Routerのルートレイアウトコンポーネントです。
 * 全ページで共通のHTML構造、メタデータ、グローバルスタイルを定義します。
 * 
 * 学習ポイント:
 * - Next.js 15のApp Router構造
 * - TypeScriptでのReact Server Components
 * - Tailwind CSSの統合
 * - メタデータAPIの使用
 */

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

/**
 * フォント設定
 * 
 * 学習ポイント:
 * - next/font/googleによる最適化されたフォント読み込み
 * - Inter: 読みやすいサンセリフフォント（UI用）
 * - JetBrains Mono: 等幅フォント（コード表示用）
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});
```

**学習ポイント**:
- **React Server Components**: デフォルトでサーバーサイド実行
- **Font Optimization**: next/fontによる自動最適化
- **CSS Variables**: フォントのCSS変数化

### 2. メタデータAPIの活用

**ファイル**: `src/app/layout.tsx` (行 35-80)

```typescript
/**
 * ビューポート設定
 * 
 * 学習ポイント:
 * - Next.js 15では viewport は別途エクスポート
 * - レスポンシブデザインの基本設定
 */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/**
 * メタデータ設定
 * 
 * 学習ポイント:
 * - Next.js 15のMetadata API
 * - SEO最適化のための基本設定
 * - PWA対応のための設定
 */
export const metadata: Metadata = {
  title: {
    default: 'MAGI Decision System',
    template: '%s | MAGI Decision System',
  },
  description: 'エヴァンゲリオンのMAGIシステムにインスパイアされた多エージェント意思決定システム',
  keywords: ['AI', 'Decision Support', 'Multi-Agent', 'MAGI', 'Evangelion'],
  authors: [{ name: 'MAGI Development Team' }],
  
  // Open Graph設定（SNS共有用）
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://magi-decision.example.com',
    title: 'MAGI Decision System',
    description: '3賢者による多視点分析で最適な意思決定をサポート',
    siteName: 'MAGI Decision System',
  },
  
  // Twitter Card設定
  twitter: {
    card: 'summary_large_image',
    title: 'MAGI Decision System',
    description: '3賢者による多視点分析で最適な意思決定をサポート',
    creator: '@magi_decision',
  },
};
```

**学習ポイント**:
- **Static Metadata**: ビルド時に生成される静的メタデータ
- **Template System**: ページごとのタイトル生成
- **SEO Optimization**: 検索エンジン最適化の基本設定

### 3. ページコンポーネントの設計

**ファイル**: `src/app/page.tsx`

```typescript
/**
 * Home Page Component
 * 
 * MAGI Decision Systemのホームページコンポーネントです。
 * 現在はPhase 1の開発段階のため、システムの概要と開発状況を表示します。
 * 
 * 学習ポイント:
 * - Next.js 15のPage Component
 * - React Server Componentsの使用
 * - Tailwind CSSによるスタイリング
 * - 段階的開発アプローチの説明
 */

import Link from 'next/link';

/**
 * ホームページコンポーネント
 * 
 * 設計理由:
 * - システムの概要説明
 * - 開発フェーズの説明
 * - 各機能へのナビゲーション
 * - 学習用の詳細情報提供
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-magi-solomon-50 via-white to-magi-caspar-50">
      {/* ヘッダーセクション */}
      <header className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-magi-caspar-500/10 via-magi-balthasar-500/10 to-magi-melchior-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-magi-caspar-600 via-magi-balthasar-600 to-magi-melchior-600 bg-clip-text text-transparent">
                MAGI
              </span>{' '}
              Decision System
            </h1>
            {/* ... */}
          </div>
        </div>
      </header>
      {/* ... */}
    </div>
  );
}
```

**学習ポイント**:
- **Server Components**: デフォルトでサーバーサイド実行
- **Client Components**: 'use client'ディレクティブで明示的に指定
- **Tailwind Integration**: カスタムテーマカラーの活用

### 4. Next.js設定の最適化

**ファイル**: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15の新機能を活用した設定
  experimental: {
    // React 19の新機能を有効化（React Compilerは後で追加）
    // reactCompiler: true,
  },
  
  // TypeScript設定の最適化
  typescript: {
    // 型チェックを厳密に実行
    ignoreBuildErrors: false,
  },
  
  // ESLint設定
  eslint: {
    // ビルド時にESLintを実行
    ignoreDuringBuilds: false,
  },
  
  // 画像最適化設定（将来のアバター画像等に対応）
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // セキュリティヘッダー設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**学習ポイント**:
- **Experimental Features**: 最新機能の段階的導入
- **Security Headers**: セキュリティ強化の設定
- **Image Optimization**: 自動画像最適化の設定

## 🎨 App Routerの特徴的な機能

### 1. ファイルベースルーティング

```
src/app/
├── layout.tsx          # ルートレイアウト
├── page.tsx           # ホームページ (/)
├── loading.tsx        # ローディングUI
├── error.tsx          # エラーUI
├── not-found.tsx      # 404ページ
├── dashboard/
│   ├── layout.tsx     # ダッシュボードレイアウト
│   ├── page.tsx       # ダッシュボードページ (/dashboard)
│   └── settings/
│       └── page.tsx   # 設定ページ (/dashboard/settings)
└── api/
    └── agents/
        └── route.ts   # API Route (/api/agents)
```

### 2. Server ComponentsとClient Components

```typescript
// Server Component (デフォルト)
export default function ServerComponent() {
  // サーバーサイドで実行
  // データベースアクセス可能
  // バンドルサイズに含まれない
  return <div>Server Component</div>;
}

// Client Component
'use client';
export default function ClientComponent() {
  // ブラウザで実行
  // インタラクティブな機能
  // useState, useEffectが使用可能
  return <div>Client Component</div>;
}
```

### 3. Streaming とSuspense

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>即座に表示</h1>
      <Suspense fallback={<div>読み込み中...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}

async function SlowComponent() {
  // 時間のかかる処理
  const data = await fetchData();
  return <div>{data}</div>;
}
```

## 🔧 TypeScript統合

### 1. 型安全なページコンポーネント

```typescript
// ページコンポーネントの型定義
interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  return <div>ID: {params.id}</div>;
}
```

### 2. メタデータの型安全性

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ページタイトル',
  description: 'ページの説明',
};
```

## 🎯 パフォーマンス最適化

### 1. 自動コード分割

```typescript
// 動的インポートによる遅延読み込み
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>読み込み中...</p>,
});
```

### 2. 画像最適化

```typescript
import Image from 'next/image';

export default function OptimizedImage() {
  return (
    <Image
      src="/hero-image.jpg"
      alt="ヒーロー画像"
      width={800}
      height={600}
      priority // LCPの改善
    />
  );
}
```

## 🔍 実践的な使用例

### 1. レイアウトの階層化

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <nav>ダッシュボードナビ</nav>
      <main>{children}</main>
    </div>
  );
}
```

### 2. エラーハンドリング

```typescript
// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={() => reset()}>再試行</button>
    </div>
  );
}
```

## 📈 学習の進め方

### Phase 1: 基本構造の理解
1. `src/app/layout.tsx`でルートレイアウトの仕組みを理解
2. `src/app/page.tsx`でページコンポーネントの作成方法を学習
3. ファイルベースルーティングの規則を把握

### Phase 2: 高度な機能の習得
1. Server ComponentsとClient Componentsの使い分け
2. Metadata APIによるSEO最適化
3. StreamingとSuspenseによるUX向上

### Phase 3: パフォーマンス最適化
1. 自動コード分割の活用
2. 画像最適化の実装
3. Core Web Vitalsの改善

## 🎯 学習成果の確認

以下の質問に答えられるようになったら、基本的な理解ができています：

1. **ルーティング**: ファイル構造とURLの対応関係は？
2. **コンポーネント**: Server ComponentsとClient Componentsの違いは？
3. **メタデータ**: SEO最適化のためのMetadata APIの使い方は？
4. **パフォーマンス**: Streamingはどのような問題を解決しますか？
5. **型安全性**: TypeScriptとの統合でどんな利点がありますか？

## 🔗 関連学習リソース

- **TypeScript DDD**: `docs/learning/01-typescript-domain-driven-design.md`
- **AWS Amplify Gen2**: `docs/learning/03-aws-amplify-gen2.md`
- **Tailwind CSS Design System**: `docs/learning/04-tailwind-design-system.md`

## 📝 実習課題

1. **新しいページの作成**
   - `/about`ページを作成
   - 専用レイアウトを適用

2. **動的ルーティング**
   - `/agents/[id]`ページを作成
   - パラメータを使用した表示

3. **エラーハンドリング**
   - カスタムエラーページの実装
   - 404ページのカスタマイズ

---

**次のステップ**: [AWS Amplify Gen2学習ガイド](./03-aws-amplify-gen2.md)で、バックエンド統合の詳細を学習しましょう。