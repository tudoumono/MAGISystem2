# Qiita記事対応: Streaming制限回避の実装変更

## 変更概要

このドキュメントは、[Qiita記事](https://qiita.com/moritalous/items/ea695f8a328585e1313b)で紹介されているAmplify Hostingのストリーミング制限を回避するための実装変更をまとめたものです。

## 変更理由

### Amplify Hostingの技術的制約

1. **ストリーミングレスポンス未対応**: HTTPストリーミングがプロキシレイヤーでサポートされていない
2. **30秒タイムアウト制限**: 長時間のAI処理でタイムアウトが発生
3. **Lambda制約**: サーバーレス環境の制限（メモリ、実行時間）

### MAGISystemへの影響

- リアルタイムなAIチャット体験が提供できない
- ユーザーは応答完了まで何も見えない状態で待機
- 複雑なAI処理（17-26秒）が30秒制限に接近

## アーキテクチャ変更

### Before（従来構成）

```
User → Amplify Hosting → Lambda → Bedrock
        └─ 30秒制限
        └─ ストリーミング不可
```

### After（新構成）

```
User → Amplify Hosting (Frontend)
       ↓
       AgentCore Runtime (Backend API)
       └─ ストリーミング対応
       └─ 長時間処理対応
       ↓
       Amazon Bedrock
```

## 実装変更一覧

### 1. 新規ファイル

#### バックエンドAPI

- `src/app/invocations/route.ts`: チャット処理エンドポイント
- `src/app/ping/route.ts`: ヘルスチェックエンドポイント
- `src/lib/api-client.ts`: 環境適応型APIクライアント

#### インフラ

- `Dockerfile`: AgentCore Runtime用コンテナ定義
- `.dockerignore`: ビルド最適化
- `scripts/deploy-backend.sh`: ECRデプロイ自動化

#### ドキュメント

- `docs/STREAMING_BACKEND_SETUP.md`: セットアップガイド
- `docs/QIITA_STREAMING_CHANGES.md`: 本ドキュメント

### 2. 変更ファイル

#### next.config.js

```javascript
// 追加: standalone出力設定
output: "standalone",

// 追加: CORS設定
async headers() {
  return [
    // ... 既存のヘッダー
    {
      source: '/invocations',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        // ... AgentCore固有ヘッダー
      ],
    },
  ];
}
```

#### package.json

```json
// 追加: ストリーミング対応ライブラリ
"dependencies": {
  "ai": "^3.4.0",
  "@ai-sdk/amazon-bedrock": "^1.0.0",
  "@aws-sdk/credential-providers": "^3.0.0",
  // ...
}
```

#### .env.local.template

```bash
# 追加: Streaming Backend設定
NEXT_PUBLIC_AGENT_ARN=arn:aws:bedrock-agentcore:...
NEXT_PUBLIC_LOCAL_BACKEND_URL=http://localhost:8080
```

#### README.md

- Streaming対応セクションの追加
- アーキテクチャ説明の更新

## 技術的詳細

### API仕様

#### POST /invocations

**目的**: AIチャット処理（ストリーミング対応）

**リクエスト**:
```json
{
  "messages": [
    { "role": "user", "content": "質問内容" }
  ]
}
```

**レスポンス**: Server-Sent Events形式のストリーミング

**実装ポイント**:
- `ai`ライブラリの`streamText`を使用
- Bedrock Claude 3.5 Sonnetモデル
- IAMロールベースの認証

#### GET /ping

**目的**: ヘルスチェック（AgentCore Runtime要件）

**レスポンス**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "magisystem-backend"
}
```

### 環境切り替えロジック

`src/lib/api-client.ts`で環境を自動判定：

```typescript
export function buildApiUrl(): string {
  if (process.env.NEXT_PUBLIC_AGENT_ARN) {
    // プロダクション: AgentCore Runtime
    return `https://bedrock-agentcore.${region}.amazonaws.com/...`;
  }
  // 開発: ローカル
  return 'http://localhost:8080/invocations';
}
```

### Docker設定

**重要ポイント**:
- ARM64アーキテクチャ（AgentCore Runtime要件）
- ポート8080（AgentCore Runtime要件）
- Next.js standalone出力

```dockerfile
FROM node:18-alpine AS base
# ... マルチステージビルド
EXPOSE 8080
CMD ["node", "server.js"]
```

## デプロイフロー

### 1. ローカル開発

```bash
# バックエンドAPI起動（ポート8080）
npm run dev

# フロントエンド起動（ポート3000）
# 自動的にlocalhost:8080に接続
```

### 2. プロダクションデプロイ

```bash
# 1. バックエンドをECRにプッシュ
./scripts/deploy-backend.sh

# 2. AgentCore Runtimeに登録
# - コンソールでランタイム作成
# - イメージURIを指定
# - Cognito認証設定

# 3. フロントエンドをAmplifyにデプロイ
# - 環境変数にAGENT_ARNを設定
amplify push
```

## セキュリティ考慮事項

### 認証フロー

1. ユーザーがCognitoで認証
2. JWTトークンを取得
3. フロントエンドがトークンをAuthorizationヘッダーに含める
4. AgentCore RuntimeがCognitoでトークンを検証
5. 検証成功後、Bedrockにリクエスト

### IAM権限

AgentCore Runtimeの実行ロールに必要な権限：

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": "arn:aws:bedrock:*:*:foundation-model/*"
}
```

## パフォーマンス改善

### Before（Amplify Hosting）

- 初回応答: 17-26秒後に一括表示
- ユーザー体験: 長時間の待機、応答なし

### After（AgentCore Runtime）

- 初回応答: 1-2秒でストリーミング開始
- ユーザー体験: リアルタイムなタイプライター効果

## トラブルシューティング

### よくある問題

1. **ローカルでストリーミングが動作しない**
   - ポート8080が使用中でないか確認
   - `npm run dev`でサーバーが起動しているか確認

2. **AgentCore Runtimeでエラー**
   - IAMロールにBedrock権限があるか確認
   - イメージがARM64でビルドされているか確認

3. **認証エラー**
   - Cognito設定が正しいか確認
   - JWTトークンが有効期限内か確認

## 今後の拡張

### Phase 1（現在）
- ✅ 基本的なストリーミング対応
- ✅ 環境切り替え機能

### Phase 2（予定）
- 📋 複数エージェントの並列ストリーミング
- 📋 トレース情報のリアルタイム表示
- 📋 エラーリトライ機構

### Phase 3（将来）
- 📋 WebSocketによる双方向通信
- 📋 ストリーミング中断・再開機能
- 📋 パフォーマンス最適化

## 参考資料

- [Qiita記事: Amplify HostingでのStreaming制限回避](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- [AWS Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/)
- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

## まとめ

この変更により、MAGISystemは以下を実現しました：

1. **技術的制約の克服**: Amplifyの制限を回避
2. **UX向上**: リアルタイムなストリーミング体験
3. **開発体験の維持**: 環境切り替えの透過性
4. **スケーラビリティ**: AgentCore Runtimeの活用

フロントエンドとバックエンドの責務分離により、各レイヤーの最適化が可能になりました。
