/**
 * Auth Layout - 認証関連ページのレイアウト
 * 
 * 目的: 認証ページ（サインイン、サインアップ等）の共通レイアウトを提供
 * 設計理由: 認証フローの一貫したデザインとUX
 * 
 * 主要機能:
 * - 認証ページ共通のレイアウト構造
 * - 背景デザインとブランディング
 * - レスポンシブ対応
 * - アクセシビリティ考慮
 * 
 * 学習ポイント:
 * - Next.js 15 App Router のレイアウトコンポーネント
 * - 認証フローのUXパターン
 * - CSS Grid と Flexbox の活用
 * - ブランディングとデザインシステム
 * 
 * 使用例:
 * ```
 * app/(auth)/
 * ├── layout.tsx (このファイル)
 * ├── signin/page.tsx
 * ├── signup/page.tsx
 * └── forgot-password/page.tsx
 * ```
 * 
 * 関連: src/app/layout.tsx, src/components/auth/AuthProvider.tsx
 */

import React from 'react';
import { Metadata } from 'next';

/**
 * 認証レイアウトのメタデータ
 * 
 * 学習ポイント:
 * - レイアウトレベルでのメタデータ設定
 * - 認証ページ固有のSEO設定
 * - セキュリティを考慮したメタデータ
 */
export const metadata: Metadata = {
  robots: {
    index: false, // 認証ページは検索エンジンにインデックスしない
    follow: false,
  },
};

/**
 * AuthLayoutコンポーネントのProps型定義
 */
interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayoutコンポーネント
 * 
 * 設計理由:
 * - 認証ページの統一されたレイアウト
 * - ブランディングとビジュアルアイデンティティ
 * - レスポンシブデザインの実装
 * 
 * 学習ポイント:
 * - レイアウトコンポーネントの実装パターン
 * - CSS Grid による複雑なレイアウト
 * - グラデーションとアニメーション
 * - アクセシビリティ対応
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* 背景パターン */}
      <div className="absolute inset-0 overflow-hidden">
        {/* グリッドパターン */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* 装飾的な要素 */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* 左上の装飾 */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          
          {/* 右下の装飾 */}
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-magi-solomon-500/5 to-transparent rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>
      </div>
      
      {/* メインコンテンツエリア */}
      <div className="relative z-10 flex min-h-screen">
        {/* 左側: ブランディングエリア（デスクトップのみ） */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 xl:px-12">
          <div className="mx-auto max-w-md">
            {/* ロゴとタイトル */}
            <div className="text-center space-y-6">
              {/* MAGIシステムロゴ（将来的に画像に置き換え） */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-magi-caspar-500 via-magi-balthasar-500 to-magi-melchior-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">M</span>
              </div>
              
              {/* システム名 */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  MAGI Decision System
                </h1>
                <p className="text-lg text-muted-foreground">
                  多エージェント意思決定システム
                </p>
              </div>
              
              {/* 3賢者の紹介 */}
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  3賢者による多視点分析で最適な意思決定をサポート
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-magi-caspar-50 border border-magi-caspar-200 rounded-lg">
                    <div className="w-3 h-3 bg-magi-caspar-500 rounded-full" />
                    <div className="text-left">
                      <div className="font-medium text-magi-caspar-700">CASPAR</div>
                      <div className="text-xs text-magi-caspar-600">保守的・現実的な視点</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-magi-balthasar-50 border border-magi-balthasar-200 rounded-lg">
                    <div className="w-3 h-3 bg-magi-balthasar-500 rounded-full" />
                    <div className="text-left">
                      <div className="font-medium text-magi-balthasar-700">BALTHASAR</div>
                      <div className="text-xs text-magi-balthasar-600">革新的・感情的な視点</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-magi-melchior-50 border border-magi-melchior-200 rounded-lg">
                    <div className="w-3 h-3 bg-magi-melchior-500 rounded-full" />
                    <div className="text-left">
                      <div className="font-medium text-magi-melchior-700">MELCHIOR</div>
                      <div className="text-xs text-magi-melchior-600">バランス型・科学的な視点</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-magi-solomon-50 border border-magi-solomon-200 rounded-lg">
                  <div className="w-3 h-3 bg-magi-solomon-500 rounded-full" />
                  <div className="text-left">
                    <div className="font-medium text-magi-solomon-700">SOLOMON Judge</div>
                    <div className="text-xs text-magi-solomon-600">統括・評価・最終判断</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右側: 認証フォームエリア */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 xl:px-12">
          <div className="mx-auto w-full max-w-md">
            {/* モバイル用のロゴ */}
            <div className="lg:hidden text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-magi-caspar-500 via-magi-balthasar-500 to-magi-melchior-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
                <span className="text-xl font-bold text-white">M</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                MAGI Decision System
              </h1>
            </div>
            
            {/* 認証フォームコンテンツ */}
            <main>
              {children}
            </main>
          </div>
        </div>
      </div>
      
      {/* フッター */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 text-center text-xs text-muted-foreground">
        <p>
          © 2024 MAGI Decision System. 
          エヴァンゲリオンのMAGIシステムにインスパイアされた学習プロジェクト
        </p>
      </footer>
    </div>
  );
}