# Tailwind CSS Design System学習ガイド

## 📚 学習目標

このドキュメントでは、MAGI Decision Systemの実装を通じて、Tailwind CSSを使ったデザインシステムの構築方法を学習します。

## 🎯 Tailwind CSS Design Systemとは？

Tailwind CSSは、ユーティリティファーストのCSSフレームワークです。事前定義されたクラスを組み合わせて、一貫性のあるデザインシステムを効率的に構築できます。

### 主要な特徴
- **ユーティリティファースト**: 小さな単機能クラスの組み合わせ
- **カスタマイズ性**: 設定ファイルによる柔軟なカスタマイズ
- **パフォーマンス**: 未使用CSSの自動削除（PurgeCSS）
- **レスポンシブ**: モバイルファーストのレスポンシブデザイン

## 📁 関連ソースコード

### 主要ファイル
- **`tailwind.config.ts`** - Tailwind設定とカスタムテーマ
- **`src/app/globals.css`** - グローバルスタイルとカスタムコンポーネント
- **`src/app/page.tsx`** - デザインシステムの実装例
- **`src/app/layout.tsx`** - フォント設定とベーススタイル

## 🏗️ 実装パターン解説

### 1. カスタムテーマの設計

**ファイル**: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  // Tailwind CSSが適用されるファイルパスを指定
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  // ダークモード設定（将来のテーマ切り替えに対応）
  darkMode: 'class',
  
  theme: {
    extend: {
      // MAGIシステムのテーマカラー（エヴァンゲリオン風）
      colors: {
        // MAGI System Colors - エヴァンゲリオンの配色を参考
        magi: {
          // CASPAR（保守的）- 青系
          caspar: {
            50: '#eff6ff',
            100: '#dbeafe',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            900: '#1e3a8a',
          },
          // BALTHASAR（革新的）- 赤系
          balthasar: {
            50: '#fef2f2',
            100: '#fee2e2',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            900: '#7f1d1d',
          },
          // MELCHIOR（バランス型）- 緑系
          melchior: {
            50: '#f0fdf4',
            100: '#dcfce7',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            900: '#14532d',
          },
          // SOLOMON（統括者）- 紫系
          solomon: {
            50: '#faf5ff',
            100: '#f3e8ff',
            500: '#a855f7',
            600: '#9333ea',
            700: '#7c3aed',
            900: '#581c87',
          },
        },
        
        // 判定結果の色分け
        decision: {
          approved: '#22c55e',   // 可決 - 緑
          rejected: '#ef4444',   // 否決 - 赤
          pending: '#f59e0b',    // 保留 - 黄
        },
      },
      
      // アニメーション設定（リアルタイム更新用）
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'thinking': 'thinking 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        thinking: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  
  plugins: [
    // フォーム要素のスタイリング
    require('@tailwindcss/forms'),
    // タイポグラフィの改善
    require('@tailwindcss/typography'),
  ],
}

export default config
```

**学習ポイント**:
- **Color Palette**: ブランドカラーの体系的な定義
- **Custom Animations**: ブランド固有のアニメーション
- **Plugin Integration**: 機能拡張プラグインの活用

### 2. グローバルスタイルとコンポーネント

**ファイル**: `src/app/globals.css`

```css
/**
 * Global Styles for MAGI Decision System
 * 
 * このファイルはアプリケーション全体で使用されるグローバルスタイルを定義します。
 * Tailwind CSSのベーススタイルとカスタムCSS変数を含みます。
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

/**
 * CSS変数の定義
 * 
 * 学習ポイント:
 * - :root セレクターでグローバル変数を定義
 * - HSL色空間の使用（色の調整が容易）
 * - ライトモードとダークモードの切り替え対応
 */
@layer base {
  :root {
    /* ライトモードの色定義 */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 262.1 83.3% 57.8%;
    --primary-foreground: 210 40% 98%;
    /* ... */
  }

  .dark {
    /* ダークモードの色定義 */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}

/**
 * カスタムコンポーネントスタイル
 * 
 * 学習ポイント:
 * - @layer components でコンポーネント固有のスタイルを定義
 * - 再利用可能なスタイルパターンの作成
 */
@layer components {
  /* MAGI システム固有のスタイル */
  .magi-panel {
    @apply bg-card border border-border rounded-lg shadow-sm;
  }
  
  .magi-panel-header {
    @apply px-6 py-4 border-b border-border;
  }
  
  .magi-panel-content {
    @apply px-6 py-4;
  }
  
  /* エージェント固有の色分け */
  .agent-caspar {
    @apply border-l-4 border-l-magi-caspar-500;
  }
  
  .agent-balthasar {
    @apply border-l-4 border-l-magi-balthasar-500;
  }
  
  .agent-melchior {
    @apply border-l-4 border-l-magi-melchior-500;
  }
  
  .agent-solomon {
    @apply border-l-4 border-l-magi-solomon-500;
  }
  
  /* 判定結果のスタイル */
  .decision-approved {
    @apply bg-green-50 border-green-200 text-green-800;
  }
  
  .decision-rejected {
    @apply bg-red-50 border-red-200 text-red-800;
  }
}
```

**学習ポイント**:
- **Layer System**: base/components/utilitiesの階層管理
- **CSS Variables**: 動的テーマ切り替えの基盤
- **Component Classes**: 再利用可能なコンポーネントスタイル

### 3. レスポンシブデザインの実装

**ファイル**: `src/app/page.tsx` (行 50-80)

```typescript
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
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              エヴァンゲリオンのMAGIシステムにインスパイアされた<br />
              3賢者による多視点分析システム
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-magi-caspar-100 text-magi-caspar-800 px-4 py-2 rounded-full text-sm font-medium">
                CASPAR - 保守的視点
              </div>
              <div className="bg-magi-balthasar-100 text-magi-balthasar-800 px-4 py-2 rounded-full text-sm font-medium">
                BALTHASAR - 革新的視点
              </div>
              <div className="bg-magi-melchior-100 text-magi-melchior-800 px-4 py-2 rounded-full text-sm font-medium">
                MELCHIOR - バランス型視点
              </div>
              <div className="bg-magi-solomon-100 text-magi-solomon-800 px-4 py-2 rounded-full text-sm font-medium">
                SOLOMON - 統括判断
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* ... */}
    </div>
  );
}
```

**学習ポイント**:
- **Responsive Typography**: sm:text-5xl lg:text-6xlによる段階的サイズ調整
- **Spacing System**: px-4 sm:px-6 lg:px-8による一貫したスペーシング
- **Color System**: カスタムMAGIカラーの活用

### 4. フォントシステムの統合

**ファイル**: `src/app/layout.tsx` (行 20-40)

```typescript
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="ja" 
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body 
        className={`
          min-h-screen 
          bg-background 
          font-sans 
          antialiased
          text-foreground
          selection:bg-primary/20
        `}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
```

**学習ポイント**:
- **Font Variables**: CSS変数によるフォント管理
- **Font Display**: 'swap'による読み込み最適化
- **Typography Scale**: Tailwindの統一されたタイポグラフィシステム

## 🎨 デザインシステムの構成要素

### 1. カラーパレット

```typescript
// MAGIシステムのブランドカラー
const magiColors = {
  caspar: {
    50: '#eff6ff',    // 最も薄い
    100: '#dbeafe',
    500: '#3b82f6',   // メインカラー
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',   // 最も濃い
  },
  // 他のエージェントカラー...
};

// 使用例
<div className="bg-magi-caspar-50 text-magi-caspar-900 border-magi-caspar-200">
  CASPAR エージェント
</div>
```

### 2. スペーシングシステム

```css
/* Tailwindのスペーシングスケール */
.space-1 { margin: 0.25rem; }  /* 4px */
.space-2 { margin: 0.5rem; }   /* 8px */
.space-4 { margin: 1rem; }     /* 16px */
.space-6 { margin: 1.5rem; }   /* 24px */
.space-8 { margin: 2rem; }     /* 32px */

/* 使用例 */
<div className="p-6 mb-4 space-y-2">
  <h2 className="text-xl font-semibold">タイトル</h2>
  <p className="text-muted-foreground">説明文</p>
</div>
```

### 3. タイポグラフィシステム

```css
/* フォントサイズとライン高さの組み合わせ */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }

/* 使用例 */
<h1 className="text-4xl font-bold text-foreground">
  メインタイトル
</h1>
<p className="text-lg text-muted-foreground">
  サブタイトル
</p>
```

### 4. コンポーネントパターン

```css
/* 再利用可能なコンポーネントクラス */
.magi-panel {
  @apply bg-card border border-border rounded-lg shadow-sm;
}

.magi-button-primary {
  @apply bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors;
}

.magi-input {
  @apply border border-input bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring;
}
```

## 🔧 レスポンシブデザインパターン

### 1. ブレークポイントシステム

```typescript
// tailwind.config.tsでのカスタムブレークポイント
screens: {
  'xs': '475px',
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
},

// 使用例
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* レスポンシブグリッド */}
</div>
```

### 2. モバイルファーストアプローチ

```typescript
// モバイル → デスクトップの順で設計
<div className="
  text-sm          // モバイル: 小さいテキスト
  sm:text-base     // タブレット: 標準サイズ
  lg:text-lg       // デスクトップ: 大きいテキスト
  px-4             // モバイル: 狭いパディング
  sm:px-6          // タブレット: 中程度のパディング
  lg:px-8          // デスクトップ: 広いパディング
">
  レスポンシブコンテンツ
</div>
```

## 🎯 アクセシビリティ対応

### 1. カラーコントラスト

```css
/* 高コントラストモード対応 */
@media (prefers-contrast: high) {
  .magi-panel {
    @apply border-2;
  }
  
  .decision-approved {
    @apply bg-green-100 border-green-400;
  }
}
```

### 2. 動きの制御

```css
/* 動きを抑制する設定 */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-thinking {
    animation: none;
  }
  
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

### 3. フォーカス管理

```css
/* フォーカス表示の統一 */
.focus-visible-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
}
```

## 🔍 実践的な使用例

### 1. エージェントカードコンポーネント

```typescript
function AgentCard({ agent, decision }: { agent: AgentType, decision: DecisionType }) {
  return (
    <div className={`
      magi-panel 
      agent-${agent}
      transition-all 
      duration-300 
      hover:shadow-md
    `}>
      <div className="magi-panel-header">
        <h3 className="text-lg font-semibold text-foreground">
          {agent.toUpperCase()}
        </h3>
        <span className={`
          inline-flex 
          items-center 
          px-2 
          py-1 
          rounded-full 
          text-xs 
          font-medium
          ${decision === 'APPROVED' ? 'decision-approved' : 'decision-rejected'}
        `}>
          {decision === 'APPROVED' ? '✓ 可決' : '✗ 否決'}
        </span>
      </div>
      <div className="magi-panel-content">
        <p className="text-muted-foreground">
          {AGENT_DESCRIPTIONS[agent]}
        </p>
      </div>
    </div>
  );
}
```

### 2. レスポンシブナビゲーション

```typescript
function Navigation() {
  return (
    <nav className="
      flex 
      flex-col 
      sm:flex-row 
      items-start 
      sm:items-center 
      gap-4 
      sm:gap-8
    ">
      <Link 
        href="/dashboard" 
        className="
          text-foreground 
          hover:text-primary 
          transition-colors 
          font-medium
        "
      >
        ダッシュボード
      </Link>
      <Link 
        href="/conversations" 
        className="
          text-muted-foreground 
          hover:text-foreground 
          transition-colors
        "
      >
        会話履歴
      </Link>
    </nav>
  );
}
```

## 📈 学習の進め方

### Phase 1: 基本概念の理解
1. `tailwind.config.ts`でカスタムテーマの設定方法を学習
2. `src/app/globals.css`でレイヤーシステムを理解
3. ユーティリティクラスの組み合わせ方を習得

### Phase 2: デザインシステムの構築
1. 一貫したカラーパレットの設計
2. 再利用可能なコンポーネントクラスの作成
3. レスポンシブデザインパターンの実装

### Phase 3: 高度な機能の活用
1. アクセシビリティ対応の実装
2. ダークモード対応
3. パフォーマンス最適化

## 🎯 学習成果の確認

以下の質問に答えられるようになったら、基本的な理解ができています：

1. **ユーティリティファースト**: どのような利点がありますか？
2. **カスタムテーマ**: ブランドカラーをどう定義しますか？
3. **レスポンシブ**: モバイルファーストの実装方法は？
4. **コンポーネント**: 再利用可能なスタイルの作成方法は？
5. **アクセシビリティ**: どのような配慮が必要ですか？

## 🔗 関連学習リソース

- **TypeScript DDD**: `docs/learning/01-typescript-domain-driven-design.md`
- **Next.js App Router**: `docs/learning/02-nextjs-app-router.md`
- **AWS Amplify Gen2**: `docs/learning/03-aws-amplify-gen2.md`

## 📝 実習課題

1. **新しいカラーテーマの作成**
   - ダークモード用のカラーパレット
   - 高コントラストモードの対応

2. **カスタムコンポーネントの実装**
   - ボタンコンポーネントのバリエーション
   - フォームコンポーネントの統一

3. **レスポンシブレイアウトの構築**
   - 複雑なグリッドレイアウト
   - モバイル最適化の実装

---

**次のステップ**: [モックデータ活用学習ガイド](./05-mock-data-patterns.md)で、フロントエンドファースト開発の詳細を学習しましょう。