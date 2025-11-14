/**
 * Root Layout - AgentCore Runtime Backend
 * 
 * このファイルはNext.js App Routerの最小限のレイアウトです。
 * AgentCore Runtime内では主にAPIエンドポイントとして機能します。
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <main>
          <h1>MAGI AgentCore Runtime Backend</h1>
          <p>このバックエンドはAgentCore Runtime内で動作しています。</p>
          <div>
            <h2>利用可能なエンドポイント:</h2>
            <ul>
              <li><code>POST /api/invocations</code> - MAGI エージェント実行</li>
              <li><code>GET /api/ping</code> - ヘルスチェック</li>
            </ul>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}