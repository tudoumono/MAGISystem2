/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15の新機能を活用した設定
  experimental: {
    // React 19の新機能を有効化（React Compilerは後で追加）
    // reactCompiler: true,

    // AWS SDK等のNode.js専用パッケージをバンドリングから除外
    serverComponentsExternalPackages: [
      '@aws-sdk/client-bedrock-agent-runtime',
      '@aws-sdk/client-cloudwatch',
      '@aws-sdk/client-cloudwatch-logs',
      'aws-xray-sdk-core',
      '@opentelemetry/auto-instrumentations-node',
    ],
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