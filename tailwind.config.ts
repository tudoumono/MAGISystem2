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
      // MAGIシステムのテーマカラー（エヴァンゲリオン風 + 洗練されたパレット）
      colors: {
        // MAGI System Colors - エヴァンゲリオンの配色を参考（ネオンエフェクト対応）
        magi: {
          // CASPAR（保守的・科学者）- 鮮やかな青系
          caspar: {
            50: '#e0f2fe',
            100: '#bae6fd',
            200: '#7dd3fc',
            300: '#38bdf8',
            400: '#0ea5e9',
            500: '#0284c7',
            600: '#0369a1',
            700: '#075985',
            800: '#0c4a6e',
            900: '#082f49',
            neon: '#00d9ff', // ネオンブルー
            glow: 'rgba(0, 217, 255, 0.5)',
          },
          // BALTHASAR（革新的・母性）- 鮮やかな赤/マゼンタ系
          balthasar: {
            50: '#fef1f7',
            100: '#fee5ef',
            200: '#fecce3',
            300: '#fda4cd',
            400: '#fb71b0',
            500: '#f43f93',
            600: '#e01e7c',
            700: '#c2185b',
            800: '#a11650',
            900: '#881447',
            neon: '#ff0080', // ネオンマゼンタ
            glow: 'rgba(255, 0, 128, 0.5)',
          },
          // MELCHIOR（バランス型・女性科学者）- 鮮やかな緑/シアン系
          melchior: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
            neon: '#00ff9f', // ネオングリーン
            glow: 'rgba(0, 255, 159, 0.5)',
          },
          // SOLOMON（統括者・王）- 神秘的な紫/ゴールド系
          solomon: {
            50: '#faf5ff',
            100: '#f3e8ff',
            200: '#e9d5ff',
            300: '#d8b4fe',
            400: '#c084fc',
            500: '#a855f7',
            600: '#9333ea',
            700: '#7e22ce',
            800: '#6b21a8',
            900: '#581c87',
            neon: '#bf40ff', // ネオンパープル
            gold: '#ffd700', // アクセントゴールド
            glow: 'rgba(191, 64, 255, 0.5)',
          },
        },

        // 判定結果の色分け（より鮮やか）
        decision: {
          approved: '#10b981',   // 可決 - エメラルドグリーン
          rejected: '#f43f93',   // 否決 - マゼンタレッド
          pending: '#f59e0b',    // 保留 - アンバー
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

      // 洗練されたアニメーション設定
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-down': 'fadeInDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'thinking': 'thinking 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'neon-flicker': 'neonFlicker 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        thinking: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%, 100%': { filter: 'brightness(1) drop-shadow(0 0 5px currentColor)' },
          '50%': { filter: 'brightness(1.2) drop-shadow(0 0 20px currentColor)' },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor'
          },
          '50%': {
            boxShadow: '0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor'
          },
        },
        neonFlicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            opacity: '1',
            filter: 'brightness(1)',
          },
          '20%, 24%, 55%': {
            opacity: '0.8',
            filter: 'brightness(0.8)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },

      // 洗練されたタイポグラフィ
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-display)', 'SF Pro Display', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },

      // 空白の美学 - Apple的なスペーシング
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },

      // ガラスモーフィズム用のブラー
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },

      // ボックスシャドウ（深度を表現）
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 12px 48px 0 rgba(0, 0, 0, 0.15)',
        'neon-caspar': '0 0 20px rgba(0, 217, 255, 0.5), 0 0 40px rgba(0, 217, 255, 0.3)',
        'neon-balthasar': '0 0 20px rgba(255, 0, 128, 0.5), 0 0 40px rgba(255, 0, 128, 0.3)',
        'neon-melchior': '0 0 20px rgba(0, 255, 159, 0.5), 0 0 40px rgba(0, 255, 159, 0.3)',
        'neon-solomon': '0 0 20px rgba(191, 64, 255, 0.5), 0 0 40px rgba(191, 64, 255, 0.3)',
        'elevation-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },

      // レスポンシブブレークポイント
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },

      // トランジション
      transitionDuration: {
        '400': '400ms',
      },

      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
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