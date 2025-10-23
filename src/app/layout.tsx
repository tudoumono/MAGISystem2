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
import ClientEnvironmentStatus from '../components/dev/ClientEnvironmentStatus';

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
  creator: 'MAGI Development Team',
  publisher: 'MAGI Decision System',
  
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
  
  // PWA設定
  manifest: '/manifest.json',
  

  
  // ロボット設定
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * ルートレイアウトコンポーネント
 * 
 * 設計理由:
 * - html要素にフォント変数を設定
 * - body要素にTailwindのベースクラスを適用
 * - 全ページで共通のHTML構造を提供
 * 
 * 学習ポイント:
 * - React Server Componentsの使用
 * - childrenプロパティによるページコンテンツの挿入
 * - CSS変数によるフォント管理
 */
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
      <head>
        {/* Favicon設定 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* テーマカラー設定 */}
        <meta name="theme-color" content="#7c3aed" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
        
        {/* プリロード設定（パフォーマンス最適化） */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
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
        {/* メインコンテンツエリア */}
        <div id="root" className="relative min-h-screen">
          {children}
        </div>
        
        {/* ポータル用のコンテナ（モーダル、トースト等） */}
        <div id="portal-root" />
        
        {/* 開発環境での環境ステータス表示 */}
        <ClientEnvironmentStatus />
      </body>
    </html>
  );
}