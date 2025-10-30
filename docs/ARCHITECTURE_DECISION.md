# アーキテクチャ決定記録: bedrockAgentGateway削除

## 決定日
2025-10-30

## 状況
MAGISystem2プロジェクトで、`bedrockAgentGateway`（Amplify Gen2 Lambda関数）とNext.js API Routesの両方でBedrock AgentCore Runtime統合が実装されており、機能が重複していた。

## 決定
`bedrockAgentGateway`を完全に削除し、Next.js API Routesでの実装に統一する。

## 理由

### 1. 機能の重複
- `bedrockAgentGateway`: Amplify Gen2で定義されたLambda関数
- Next.js API Routes: `/api/bedrock-agents/execute`, `/api/magi/stream`
- 両方とも同じAgentCore Runtime SDKを使用
- 実装が重複しており、保守コストが増加

### 2. Next.js API Routesの利点
- **開発効率**: フロントエンドとバックエンドを同じコードベースで開発
- **型安全性**: TypeScriptの型定義を共有可能
- **デバッグ容易性**: Hot Reloadとローカル開発環境
- **デプロイ簡素化**: Amplify Hostingが自動的にLambda化
- **保守性**: 単一のコードベースで管理

### 3. 実際の使用状況
- `bedrockAgentGateway`は定義されているが、フロントエンドから呼び出されていない
- Next.js API Routesが実際に使用されている
- ビルドエラーが発生していた（モジュール解決の問題）

### 4. ストリーミング機能への影響なし
- Next.js API RoutesでもReadableStreamとSSEを使用可能
- Amplify HostingがAPI RoutesをLambdaとして最適化
- ユーザー体験は全く変わらない

### 5. AgentCore Runtime統合への影響なし
- AgentCore Runtime SDKの呼び出し方法は同一
- Tavilyなどのツール統合は変わらず
- IAM権限とセキュリティ設定も同一

## 結果

### 削除されたもの
- `amplify/functions/bedrock-agent-gateway/` ディレクトリ全体
  - `handler.ts`
  - `streaming-handler.ts`
  - `resource.ts`
  - `resource-fixed.ts`
  - `package.json`
  - その他のファイル
- `amplify/backend.ts`からのインポートと設定

### 残されたもの
- Next.js API Routes
  - `/api/bedrock-agents/execute`
  - `/api/magi/stream`
  - `/api/health/observability`
  - `/api/test/*`

## 現在のアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Amplify Hosting (Frontend)                      │
│  - Next.js 15 App Router                                     │
│  - React 19 Server Components                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Next.js API Routes (自動Lambda化)                    │
│  - /api/bedrock-agents/execute                               │
│  - /api/magi/stream                                          │
│  - /api/health/observability                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Bedrock AgentCore Runtime                            │
│  - Python magi_agent.py                                      │
│  - 3賢者エージェント並列実行                                  │
│  - SOLOMON Judge統合                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Amazon Bedrock API                              │
│  - Claude 3.5 Sonnet                                         │
│  - ストリーミングレスポンス                                   │
└─────────────────────────────────────────────────────────────┘
```

## 今後の方針

### API Routes の拡張
1. ストリーミング機能の強化
2. エラーハンドリングの改善
3. 認証とセキュリティの強化
4. パフォーマンス最適化

### 開発プロセス
1. フロントエンドとバックエンドの統合開発
2. 型定義の共有と型安全性の向上
3. テストの統合（E2Eテスト含む）
4. ドキュメントの整備

## 参考資料
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Amplify Hosting SSR Support](https://docs.aws.amazon.com/amplify/latest/userguide/server-side-rendering-amplify.html)
- [AWS Bedrock AgentCore Runtime](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-runtime.html)
