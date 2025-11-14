/** @type {import('next').NextConfig} */
const nextConfig = {
  // AgentCore Runtime設定
  serverExternalPackages: ['child_process'],
  
  // ポート8080でリッスン（AgentCore Runtime標準）
  // 本番環境では環境変数PORT=8080が設定される
  
  // Standalone出力（Dockerコンテナ用）
  output: 'standalone',
  
  // 実験的機能（standalone出力の改善）
  outputFileTracingRoot: process.cwd(),
  
  // 静的ファイル最適化
  compress: true,

  // CORS設定（AgentCore Runtime用 - 参考記事準拠）
  async headers() {
    return [
      {
        source: '/invocations',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Amzn-Bedrock-AgentCore-Runtime-Session-Id, X-Amzn-Trace-Id' 
          }
        ]
      },
      {
        source: '/ping',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;