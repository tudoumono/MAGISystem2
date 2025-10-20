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
        
        // システム全体のベースカラー
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
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
      
      // フォント設定
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      
      // レスポンシブブレークポイント
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
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