# AWS設定・インフラ定義

**役割**: AWS設定・インフラ定義

このディレクトリは、AWS Amplify Gen 2を使用したインフラストラクチャとバックエンドリソースの定義を管理しています。

## アーキテクチャ構成

```
amplify/
├── backend.ts                 # バックエンドリソース定義
├── auth/resource.ts           # Cognito認証設定
├── data/resource.ts           # GraphQLスキーマ定義
└── functions/                 # カスタムLambda関数
```

## 主要機能

- **認証システム**: Amazon Cognito設定
- **データベース**: DynamoDB + GraphQL API (AppSync)
- **カスタム関数**: Lambda関数定義
- **インフラ管理**: AWS CDKベースのリソース定義

## データフロー

```
フロントエンドUI (src/)
    ↓ GraphQL/REST API
AWS Amplify Gen 2 (amplify/)
    ├── Cognito (認証)
    ├── AppSync (GraphQL API)
    ├── DynamoDB (データストレージ)
    └── Lambda (カスタム処理)
```

## 重要な注意

⚠️ **このディレクトリはフロントエンドUIを含みません**

- フロントエンドUI: `src/` ディレクトリ
- AgentCore Runtime: `agents/` ディレクトリ
- AWS設定のみ: `amplify/` ディレクトリ

## デプロイ・管理

```bash
# Amplify環境セットアップ
npx ampx sandbox

# リソースデプロイ
npx ampx deploy

# 設定確認
npx ampx status
```

## 関連ディレクトリ

- `src/` - フロントエンドUI (Next.js)
- `agents/` - AgentCore Runtime (Next.js + Strands Agents)