/**
 * AgentCore Runtime用ヘルスチェックエンドポイント
 * 
 * AgentCore Runtimeの要件として、/ping (GET)エンドポイントが必要です。
 * このエンドポイントはコンテナの健全性を確認するために使用されます。
 */

export async function GET() {
  return Response.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'magisystem-backend',
    version: process.env.npm_package_version || '1.0.0'
  });
}
