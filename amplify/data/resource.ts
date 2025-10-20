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

  /**
   * メッセージモデル
   * 
   * 設計理由:
   * - role: 'user' | 'assistant' でメッセージの種類を区別
   * - content: メッセージ本文
   * - agentResponses: 3賢者の応答をJSON形式で保存
   * - judgeResponse: SOLOMON Judgeの評価をJSON形式で保存
   * - traceId: 実行トレースとの関連付け
   */
  Message: a
    .model({
      id: a.id().required(),
      conversationId: a.id().required(),
      role: a.enum(['user', 'assistant']),
      content: a.string().required(),
      agentResponses: a.json(), // AgentResponse[]
      judgeResponse: a.json(),  // JudgeResponse
      traceId: a.string(),
      createdAt: a.datetime().required(),
      conversation: a.belongsTo('Conversation', 'conversationId'),
      traceSteps: a.hasMany('TraceStep', 'messageId'),
    })
    .authorization((allow) => [
      // メッセージの所有者（会話の所有者）のみアクセス可能
      allow.owner(),
    ]),

  /**
   * トレースステップモデル
   * 
   * 設計理由:
   * - traceId: 実行トレース全体の識別子
   * - stepNumber: ステップの順序
   * - agentId: 実行したエージェント
   * - action: 実行アクションの要約
   * - toolsUsed: 使用ツール一覧（配列）
   * - citations: 引用リンク一覧（配列）
   * - duration: 実行時間（パフォーマンス監視用）
   * - errorCount: エラー・リトライ回数（信頼性監視用）
   */
  TraceStep: a
    .model({
      id: a.id().required(),
      messageId: a.id().required(),
      traceId: a.string().required(),
      stepNumber: a.integer().required(),
      agentId: a.string().required(),
      action: a.string().required(),
      toolsUsed: a.string().array(), // 使用ツール一覧
      citations: a.string().array(),  // 引用URL一覧
      duration: a.integer().required(), // 実行時間（ミリ秒）
      errorCount: a.integer().default(0), // エラー回数
      timestamp: a.datetime().required(),
      message: a.belongsTo('Message', 'messageId'),
    })
    .authorization((allow) => [
      // トレースの所有者のみアクセス可能
      allow.owner(),
    ]),

  /**
   * エージェントプリセットモデル
   * 
   * 設計理由:
   * - name: プリセット名
   * - description: プリセットの説明
   * - configs: エージェント設定をJSON形式で保存
   * - isDefault: デフォルトプリセットの識別
   * - isPublic: 他ユーザーとの共有可否
   * - createdBy: 作成者（公開プリセット用）
   */
  AgentPreset: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      configs: a.json().required(), // AgentConfig[]
      isDefault: a.boolean().default(false),
      isPublic: a.boolean().default(false),
      createdBy: a.string(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      // 作成者は全操作可能、認証済みユーザーは読み取り可能
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),
});

/**
 * データリソースの定義
 * 
 * 学習ポイント:
 * - defineData(): Amplify Data/AI Kitの初期化
 * - schema: 上記で定義したGraphQLスキーマ
 * - authorizationModes: 認証方式の設定
 * - リアルタイム更新: AppSyncによるGraphQLサブスクリプションが自動で有効化
 *   - onCreate, onUpdate, onDeleteサブスクリプションが全モデルで利用可能
 *   - オーナーベースアクセス制御がサブスクリプションにも適用される
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