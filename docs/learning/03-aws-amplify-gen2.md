# AWS Amplify Gen2学習ガイド

## 📚 学習目標

このドキュメントでは、MAGI Decision Systemの実装を通じて、AWS Amplify Gen2の実践的な使用方法を学習します。

## 🎯 AWS Amplify Gen2とは？

AWS Amplify Gen2は、TypeScriptファーストのフルスタック開発プラットフォームです。従来のCLIベース設定から、コードベース設定に移行し、型安全性と開発体験を大幅に向上させました。

### 主要な特徴
- **TypeScriptファースト**: 設定もTypeScriptで記述
- **defineBackend**: 統一されたバックエンド定義
- **Data/AI Kit**: GraphQL + DynamoDBの統合管理
- **Gen2 Functions**: 最新のLambda統合

## 📁 関連ソースコード

### 主要ファイル
- **`amplify/backend.ts`** - メインバックエンド設定
- **`amplify/auth/resource.ts`** - 認証システム設定
- **`amplify/data/resource.ts`** - データモデル設定
- **`amplify/functions/agent-gateway/`** - Lambda関数設定

## 🏗️ 実装パターン解説

### 1. バックエンド統合設定

**ファイル**: `amplify/backend.ts`

```typescript
/**
 * AWS Amplify Gen2 Backend Configuration
 * 
 * このファイルはAmplify Gen2の新しい設定方式を使用して、
 * MAGI Decision SystemのAWSバックエンドリソースを定義します。
 * 
 * 学習ポイント:
 * - Amplify Gen2では、backend.tsファイルでリソースを定義
 * - TypeScriptベースの設定により、型安全性を確保
 * - 認証、データ、関数を統合的に管理
 */

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { agentGateway } from './functions/agent-gateway/resource';

/**
 * Amplify バックエンドの定義
 * 
 * 設計理由:
 * - auth: Amazon Cognito による認証システム
 * - data: DynamoDB + AppSync による データ管理とリアルタイム通信
 * - agentGateway: Amazon Bedrock との統合用カスタム関数
 * 
 * 各リソースは独立したファイルで定義し、保守性を向上
 */
const backend = defineBackend({
  auth,
  data,
  agentGateway,
});

/**
 * データリソースへの追加権限設定
 * 
 * 学習ポイント:
 * - agentGateway関数がデータリソースにアクセスできるよう権限付与
 * - Amplify Gen2では、リソース間の権限管理が簡潔に記述可能
 */
backend.data.addDynamoDbDataSource('AgentGatewayDataSource', backend.agentGateway);

/**
 * 環境変数の設定
 * 
 * 学習ポイント:
 * - Lambda関数で使用する環境変数を設定
 * - データソースのテーブル名やAPIエンドポイントを動的に取得
 */
backend.agentGateway.addEnvironment('DATA_API_ENDPOINT', backend.data.graphqlUrl);
backend.agentGateway.addEnvironment('DATA_API_KEY', backend.data.apiKey);

export default backend;
```

**学習ポイント**:
- **defineBackend**: 統一されたバックエンド定義関数
- **リソース間連携**: 型安全なリソース参照
- **環境変数管理**: 動的な設定値の注入

### 2. 認証システムの設定

**ファイル**: `amplify/auth/resource.ts`

```typescript
/**
 * AWS Amplify Auth Configuration
 * 
 * このファイルはAmazon Cognitoを使用した認証システムを設定します。
 * MAGI Decision Systemのユーザー認証とセッション管理を担当します。
 * 
 * 学習ポイント:
 * - Amplify Gen2のauth設定方式
 * - Cognitoユーザープールとアイデンティティプールの設定
 * - セキュリティ設定とMFA（多要素認証）の考慮
 */

import { defineAuth } from '@aws-amplify/backend';

/**
 * 認証リソースの定義
 * 
 * 設計理由:
 * - loginWith.email: メールアドレスでのログインを有効化
 * - userAttributes: ユーザーに必要な属性を定義
 * - multifactor: セキュリティ強化のためのMFA設定
 */
export const auth = defineAuth({
  /**
   * ログイン方法の設定
   * 
   * 学習ポイント:
   * - email: メールアドレスでのログインを有効化
   * - 将来的にはOAuthプロバイダー（Google、GitHub等）も追加可能
   */
  loginWith: {
    email: true,
  },

  /**
   * ユーザー属性の設定
   * 
   * 設計理由:
   * - email: 必須属性として設定（ログインに使用）
   * - given_name: ユーザーの名前（UI表示用）
   * - family_name: ユーザーの姓（UI表示用）
   * - preferred_username: 表示名（オプション）
   */
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    given_name: {
      required: false,
      mutable: true,
    },
    family_name: {
      required: false,
      mutable: true,
    },
    preferred_username: {
      required: false,
      mutable: true,
    },
  },

  /**
   * 多要素認証（MFA）の設定
   * 
   * 学習ポイント:
   * - mode: 'optional' - ユーザーが選択可能
   * - sms: SMS認証を有効化
   * - totp: TOTP（Time-based One-Time Password）を有効化
   * 
   * セキュリティ考慮:
   * - 企業環境では 'required' に変更することを推奨
   * - TOTPアプリ（Google Authenticator等）の使用を推奨
   */
  multifactor: {
    mode: 'optional',
    sms: true,
    totp: true,
  },

  /**
   * パスワードポリシー
   * 
   * セキュリティ考慮:
   * - 最小長: 8文字
   * - 複雑性要件: 大文字、小文字、数字、記号を含む
   * - 一般的なパスワードの使用を禁止
   */
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
});
```

**学習ポイント**:
- **defineAuth**: 認証設定の統一関数
- **User Attributes**: カスタム属性の定義
- **Security Policies**: セキュリティポリシーの設定

### 3. データモデルの設計

**ファイル**: `amplify/data/resource.ts`

```typescript
/**
 * AWS Amplify Data Configuration
 * 
 * このファイルはAmplify Data/AI Kitを使用してデータモデルを定義します。
 * DynamoDB + AppSync GraphQL APIによるデータ管理とリアルタイム通信を設定します。
 * 
 * 学習ポイント:
 * - Amplify Gen2のdata設定方式
 * - GraphQLスキーマの自動生成
 * - リアルタイムサブスクリプション
 * - オーナーベースアクセス制御
 */

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * データスキーマの定義
 * 
 * 設計理由:
 * - User: ユーザー情報の管理
 * - Conversation: 会話スレッドの管理
 * - Message: メッセージとエージェント応答の保存
 * - TraceStep: 実行トレースの詳細記録
 * - AgentPreset: エージェント設定のプリセット管理
 */
const schema = a.schema({
  /**
   * ユーザーモデル
   * 
   * 学習ポイント:
   * - a.id(): 自動生成される一意識別子
   * - a.string().required(): 必須文字列フィールド
   * - a.json(): JSON形式のデータ保存
   * - a.hasMany(): 1対多のリレーション
   */
  User: a
    .model({
      id: a.id().required(),
      email: a.string().required(),
      name: a.string(),
      preferences: a.json(), // ユーザー設定（テーマ、言語等）
      conversations: a.hasMany('Conversation', 'userId'),
    })
    .authorization((allow) => [
      // オーナーベースアクセス制御
      // 学習ポイント: ユーザーは自分のデータのみアクセス可能
      allow.owner(),
    ]),

  /**
   * 会話モデル
   * 
   * 設計理由:
   * - title: 会話の識別用タイトル
   * - agentPresetId: 使用したプリセット設定の記録
   * - createdAt/updatedAt: タイムスタンプ管理
   * - リレーション: User(1) - Conversation(多) - Message(多)
   */
  Conversation: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      title: a.string().required(),
      agentPresetId: a.string(), // 使用したプリセットID
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      user: a.belongsTo('User', 'userId'),
      messages: a.hasMany('Message', 'conversationId'),
    })
    .authorization((allow) => [
      // 会話の所有者のみアクセス可能
      allow.owner(),
    ]),
});

/**
 * データリソースの定義
 * 
 * 学習ポイント:
 * - defineData(): Amplify Data/AI Kitの初期化
 * - schema: 上記で定義したGraphQLスキーマ
 * - authorizationModes: 認証方式の設定
 */
export const data = defineData({
  schema,
  authorizationModes: {
    // デフォルト認証方式: Amazon Cognito User Pool
    defaultAuthorizationMode: 'userPool',
    // API Key認証（開発・テスト用）
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/**
 * クライアント用の型定義をエクスポート
 * 
 * 学習ポイント:
 * - ClientSchema: フロントエンドで使用する型定義
 * - 自動生成されるGraphQL操作の型安全性を確保
 */
export type Schema = ClientSchema<typeof schema>;
```

**学習ポイント**:
- **Schema Definition**: a.schema()による型安全なスキーマ定義
- **Relationships**: hasMany/belongsToによるリレーション
- **Authorization**: 細かいアクセス制御の設定

### 4. Lambda関数の統合

**ファイル**: `amplify/functions/agent-gateway/resource.ts`

```typescript
/**
 * Agent Gateway Function Resource
 * 
 * このファイルはAmazon Bedrock AgentCoreとStrands Agentsとの統合を行う
 * カスタムLambda関数のリソース定義です。
 * 
 * 学習ポイント:
 * - Amplify Gen2でのカスタム関数定義
 * - Amazon Bedrockとの統合設定
 * - 環境変数とIAM権限の管理
 */

import { defineFunction } from '@aws-amplify/backend';

/**
 * エージェントゲートウェイ関数の定義
 * 
 * 設計理由:
 * - runtime: Node.js 20.x（最新の安定版）
 * - timeout: 5分（エージェント実行の時間を考慮）
 * - memoryMB: 1024MB（複数エージェントの並列実行に対応）
 * - environment: 必要な環境変数を設定
 */
export const agentGateway = defineFunction({
  name: 'agent-gateway',
  entry: './handler.ts',
  
  /**
   * ランタイム設定
   * 
   * 学習ポイント:
   * - runtime: 'nodejs20.x' - 最新のNode.js LTS版を使用
   * - timeout: 300秒 - エージェント実行時間を考慮した設定
   * - memoryMB: 1024MB - 複数エージェントの並列実行に必要なメモリ
   */
  runtime: 'nodejs20.x',
  timeout: 300, // 5分
  memoryMB: 1024,
  
  /**
   * 環境変数の設定
   * 
   * 学習ポイント:
   * - 環境変数は実行時に動的に設定される
   * - backend.tsで追加の環境変数を設定可能
   */
  environment: {
    // Amazon Bedrock設定
    BEDROCK_REGION: 'us-east-1',
    BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
    
    // OpenTelemetry設定
    OTEL_SERVICE_NAME: 'magi-agent-gateway',
    
    // ログレベル設定
    LOG_LEVEL: 'INFO',
  },
});
```

**学習ポイント**:
- **defineFunction**: Lambda関数の統一定義
- **Runtime Configuration**: 実行環境の詳細設定
- **Environment Variables**: 環境固有の設定管理

## 🎨 Amplify Gen2の特徴的な機能

### 1. TypeScriptファーストの設定

```typescript
// 従来のCLI設定（JSON）
{
  "auth": {
    "userPoolId": "us-east-1_XXXXXXXXX",
    "userPoolClientId": "XXXXXXXXXXXXXXXXXX"
  }
}

// Gen2の設定（TypeScript）
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: { required: true },
  },
});
```

### 2. リソース間の型安全な参照

```typescript
const backend = defineBackend({
  auth,
  data,
  agentGateway,
});

// 型安全なリソース参照
backend.agentGateway.addEnvironment(
  'DATA_API_ENDPOINT', 
  backend.data.graphqlUrl  // 型チェックされる
);
```

### 3. 自動生成される型定義

```typescript
// 自動生成されるクライアント型
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

// 型安全なデータ操作
const conversation = await client.models.Conversation.create({
  title: 'New Conversation',
  userId: 'user-123',
});
```

## 🔧 開発ワークフロー

### 1. ローカル開発

```bash
# Amplifyサンドボックスの起動
npx ampx sandbox

# 型定義の生成
npx ampx generate graphql-client-code
```

### 2. デプロイメント

```bash
# 本番環境へのデプロイ
npx ampx pipeline-deploy --branch main

# ステージング環境へのデプロイ
npx ampx pipeline-deploy --branch develop
```

### 3. 環境管理

```typescript
// 環境別設定
const backend = defineBackend({
  auth,
  data,
  agentGateway,
});

// 本番環境でのみ有効化
if (backend.environment === 'production') {
  backend.auth.addMfaRequirement();
}
```

## 🔍 実践的な使用例

### 1. フロントエンドでの認証

```typescript
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);

// サインイン
const user = await signIn({
  username: 'user@example.com',
  password: 'password123',
});

// 現在のユーザー取得
const currentUser = await getCurrentUser();
```

### 2. データ操作

```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

// 会話の作成
const conversation = await client.models.Conversation.create({
  title: 'AI Ethics Discussion',
  userId: currentUser.userId,
});

// リアルタイム購読
const subscription = client.models.Message.observeQuery().subscribe({
  next: (data) => {
    console.log('New messages:', data.items);
  },
});
```

### 3. Lambda関数の呼び出し

```typescript
import { post } from 'aws-amplify/api';

const response = await post({
  apiName: 'agentGateway',
  path: '/execute',
  options: {
    body: {
      message: 'Should we implement this feature?',
      agentConfig: defaultConfig,
    },
  },
});
```

## 📈 学習の進め方

### Phase 1-2: 基本設定とモック統合
1. `amplify/backend.ts`でリソース統合の仕組みを理解
2. `amplify/auth/resource.ts`で認証設定を学習
3. `amplify/data/resource.ts`でデータモデリングを習得
4. モック環境での動作確認

### Phase 3: 実際のデータ統合 🆕
1. Lambda関数との統合方法
2. リアルタイム機能の実装
3. 権限管理とセキュリティ設定
4. **実装例**: [Phase 3学習ガイド](./phases/phase3/README.md) *(Phase 3完了時に追加予定)*

### Phase 4-6: 本格運用への準備 🆕
1. 環境管理とCI/CD設定
2. 監視とログ設定
3. パフォーマンス最適化
4. **実装例**: [Phase 4-6学習ガイド](./phases/phase4-6/README.md) *(Phase 4-6完了時に追加予定)*

## 🎯 学習成果の確認

以下の質問に答えられるようになったら、基本的な理解ができています：

1. **設定方式**: Gen1とGen2の設定方式の違いは？
2. **型安全性**: TypeScriptファーストのメリットは？
3. **データモデル**: GraphQLスキーマの定義方法は？
4. **認証**: Cognitoの設定とフロントエンド統合は？
5. **関数統合**: Lambda関数の定義と呼び出し方法は？

## 🔗 関連学習リソース

- **TypeScript DDD**: `docs/learning/01-typescript-domain-driven-design.md`
- **Next.js App Router**: `docs/learning/02-nextjs-app-router.md`
- **Tailwind CSS Design System**: `docs/learning/04-tailwind-design-system.md`

## 📝 実習課題

1. **新しいデータモデルの追加**
   - UserPreferenceモデルを作成
   - 適切なリレーションを設定

2. **カスタム認証フローの実装**
   - ソーシャルログインの追加
   - カスタム属性の設定

3. **Lambda関数の拡張**
   - 新しいエンドポイントの追加
   - エラーハンドリングの強化

---

**次のステップ**: [Tailwind CSS Design System学習ガイド](./04-tailwind-design-system.md)で、デザインシステムの詳細を学習しましょう。