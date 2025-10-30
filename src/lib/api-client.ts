/**
 * API Client - 環境適応型エンドポイント管理
 * 
 * このファイルは開発環境とプロダクション環境で異なるAPIエンドポイントを
 * 透過的に切り替える機能を提供します。
 * 
 * 設計理由:
 * - 開発時: ローカルのバックエンド (localhost:8080)
 * - プロダクション: AgentCore Runtime
 * 
 * 環境変数:
 * - NEXT_PUBLIC_AGENT_ARN: AgentCore RuntimeのARN（プロダクション用）
 * - NEXT_PUBLIC_AWS_REGION: AWSリージョン
 * - NEXT_PUBLIC_QUALIFIER: ランタイム修飾子（デフォルト: DEFAULT）
 * - NEXT_PUBLIC_LOCAL_BACKEND_URL: ローカル開発用URL
 */

/**
 * 環境に応じたAPI URLを構築
 * 
 * @returns {string} APIエンドポイントURL
 */
export function buildApiUrl(): string {
  // プロダクション環境: AgentCore Runtime使用
  if (process.env.NEXT_PUBLIC_AGENT_ARN) {
    const agentArn = process.env.NEXT_PUBLIC_AGENT_ARN;
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1';
    const qualifier = process.env.NEXT_PUBLIC_QUALIFIER || 'DEFAULT';
    const escapedArn = encodeURIComponent(agentArn);
    
    return `https://bedrock-agentcore.${region}.amazonaws.com/runtimes/${escapedArn}/invocations?qualifier=${qualifier}`;
  }
  
  // 開発環境: ローカルバックエンド使用
  return process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || 'http://localhost:8080/invocations';
}

/**
 * API呼び出し用ヘッダーを構築
 * 
 * @param {string} [token] - Cognito認証トークン（オプション）
 * @returns {Record<string, string>} HTTPヘッダー
 */
export function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 認証トークンがある場合は追加
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // AgentCore固有ヘッダー（プロダクション環境のみ）
  if (process.env.NEXT_PUBLIC_AGENT_ARN) {
    headers['X-Amzn-Trace-Id'] = `trace-${Date.now()}`;
    headers['X-Amzn-Bedrock-AgentCore-Runtime-Session-Id'] = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  return headers;
}

/**
 * ヘルスチェックを実行
 * 
 * @returns {Promise<boolean>} バックエンドが正常かどうか
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_AGENT_ARN
      ? buildApiUrl().replace('/invocations', '/ping')
      : (process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || 'http://localhost:8080').replace('/invocations', '/ping');
    
    const response = await fetch(baseUrl);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
