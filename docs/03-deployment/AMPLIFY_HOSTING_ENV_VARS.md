# Amplify Hosting 環境変数設定ガイド

Amplify Hostingで必要な環境変数の設定ガイドです。

## 重要な制約

⚠️ **Amplify Hostingでは `AWS_` で始まる環境変数は予約済みのため設定できません。**

このため、本プロジェクトでは以下の対応を実施しています：
- `AWS_REGION` → `APP_AWS_REGION` に変更
- `BEDROCK_REGION` → 削除（`APP_AWS_REGION` で統一）
- `AWS_DEFAULT_REGION` → 削除（ローカル開発のみ使用）

## 必須環境変数

Amplifyコンソールで以下の環境変数を設定してください：

```bash
# AWSリージョン設定
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
APP_AWS_REGION=ap-northeast-1

# AgentCore Runtime URL（ストリーミング機能用）
NEXT_PUBLIC_AGENTCORE_URL=https://your-agentcore-runtime.example.com
```

### 設定方法

1. AWS Amplify コンソールを開く
2. アプリケーションを選択
3. 左メニューから「Environment variables」を選択
4. 「Manage variables」をクリック
5. 上記の環境変数を追加

### 各変数の説明

| 変数名 | 説明 | 値の例 |
|--------|------|--------|
| `NEXT_PUBLIC_AWS_REGION` | フロントエンドで使用するAWSリージョン | `ap-northeast-1` |
| `APP_AWS_REGION` | バックエンド（Python）で使用するAWSリージョン | `ap-northeast-1` |
| `NEXT_PUBLIC_AGENTCORE_URL` | AgentCore RuntimeのエンドポイントURL | `https://agentcore.example.com` |

## 推奨環境変数

本番環境では以下の設定も推奨します：

```bash
# 本番環境設定
NODE_ENV=production
NEXT_PUBLIC_ENABLE_TEST_PAGES=false

# タイムアウト設定（オプション）
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000
```

### 各変数の説明

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `NODE_ENV` | Node.js実行環境 | `production` |
| `NEXT_PUBLIC_ENABLE_TEST_PAGES` | テストページの有効化 | `false` |
| `NEXT_PUBLIC_SSE_TIMEOUT_MS` | SSEストリーミングタイムアウト（ミリ秒） | `240000` (4分) |

## 認証関連環境変数

Amplifyで認証を設定している場合、以下の環境変数が自動的に設定されます：

```bash
# Amazon Cognito（Amplifyが自動設定）
NEXT_PUBLIC_USER_POOL_ID=<自動設定>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<自動設定>
NEXT_PUBLIC_IDENTITY_POOL_ID=<自動設定>

# AWS AppSync（Amplifyが自動設定）
NEXT_PUBLIC_GRAPHQL_ENDPOINT=<自動設定>
NEXT_PUBLIC_API_KEY=<自動設定>
```

これらは `amplify_outputs.json` から自動的に読み込まれるため、手動設定は不要です。

## タイムアウト設定の詳細

多層タイムアウト設計（A2A設計）を採用しています：

```bash
# フロントエンド → AgentCore Runtime
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000          # 4分

# AgentCore Runtime → Python MAGI Agent
AGENTCORE_PROCESS_TIMEOUT_MS=210000        # 3.5分

# Python MAGI Agent内部タイムアウト
MAGI_SAGE_TIMEOUT_SECONDS=90               # 各賢者: 1.5分
MAGI_SOLOMON_TIMEOUT_SECONDS=60            # SOLOMON: 1分
MAGI_TOTAL_TIMEOUT_SECONDS=180             # 全体: 3分
MAGI_EVENT_QUEUE_TIMEOUT_SECONDS=120       # イベントキュー: 2分
```

詳細は [TIMEOUT_ENVIRONMENT_CONFIGURATION.md](../TIMEOUT_ENVIRONMENT_CONFIGURATION.md) を参照してください。

## ローカル開発環境との違い

| 環境変数 | Amplify Hosting | ローカル開発 | 備考 |
|----------|-----------------|-------------|------|
| `APP_AWS_REGION` | ✅ 必須 | ✅ 推奨 | バックエンド用 |
| `AWS_REGION` | ❌ 設定不可 | ✅ 使用可能 | 後方互換性のため残存 |
| `AWS_DEFAULT_REGION` | ❌ 設定不可 | ✅ 使用可能 | AWS CLI用 |
| `BEDROCK_REGION` | ❌ 削除済み | ❌ 削除済み | APP_AWS_REGIONで統一 |

## トラブルシューティング

### 環境変数が反映されない場合

1. Amplifyコンソールで変数が正しく設定されているか確認
2. アプリケーションを再デプロイ
3. ブラウザのキャッシュをクリア

### `AWS_` で始まる環境変数エラー

```
Error: Environment variables cannot start with the reserved prefix "AWS".
```

このエラーが表示された場合は、`AWS_REGION` を `APP_AWS_REGION` に変更してください。

### AgentCore Runtimeへの接続エラー

`NEXT_PUBLIC_AGENTCORE_URL` が正しく設定されているか確認してください：
- プロトコル（`https://`）を含める
- トレイリングスラッシュは不要
- 正しいドメイン/IPアドレスを指定

## 参考リンク

- [Amplify Hosting 環境変数公式ドキュメント](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [プロジェクトのタイムアウト設定](../TIMEOUT_ENVIRONMENT_CONFIGURATION.md)
- [AgentCore セットアップガイド](../04-agent-configuration/AGENTCORE_SETUP.md)
