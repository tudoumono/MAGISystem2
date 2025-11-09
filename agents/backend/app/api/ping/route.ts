/**
 * AgentCore Runtime /ping エンドポイント
 * 
 * ヘルスチェック用のエンドポイント。
 * AgentCore Runtimeの標準仕様に準拠。
 */

import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🏥 Health check requested');
  
  const startTime = Date.now();
  
  // 基本的なヘルスチェック
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MAGI AgentCore Runtime',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    }
  };
  
  const duration = Date.now() - startTime;
  console.log(`✅ Health check completed: healthy (${duration}ms)`);
  
  return NextResponse.json(healthStatus, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// OPTIONSメソッド（CORS対応）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}