/**
 * Home Page - AgentCore Runtime Backend
 * 
 * AgentCore Runtime内のNext.jsバックエンドのホームページです。
 * 主にAPIエンドポイントの説明とヘルスチェック情報を表示します。
 */

export default function HomePage() {
  return (
    <div>
      <h2>MAGI System Status</h2>
      <div>
        <h3>エージェント構成:</h3>
        <ul>
          <li><strong>CASPAR</strong> - 保守的・現実的な視点</li>
          <li><strong>BALTHASAR</strong> - 革新的・感情的な視点</li>
          <li><strong>MELCHIOR</strong> - バランス型・科学的な視点</li>
          <li><strong>SOLOMON</strong> - Judge（統合評価）</li>
        </ul>
      </div>
      
      <div>
        <h3>技術スタック:</h3>
        <ul>
          <li>Next.js 15 (App Router)</li>
          <li>Python 3.11 + Strands Agents</li>
          <li>Amazon Bedrock (Claude 3.5 Sonnet)</li>
          <li>AgentCore Runtime</li>
        </ul>
      </div>
      
      <div>
        <h3>API使用方法:</h3>
        <pre>{`
curl -X POST http://localhost:8080/api/invocations \\
  -H "Content-Type: application/json" \\
  -d '{"question": "AIの未来について教えてください"}'
        `}</pre>
      </div>
    </div>
  );
}