import { a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      id: a.id().required(),
      email: a.string().required(),
      name: a.string(),
      preferences: a.json(),
      conversations: a.hasMany('Conversation', 'userId'),
      settings: a.hasOne('UserSettings', 'userId'),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  UserSettings: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      tavilyApiKey: a.string(), // 暗号化推奨
      serperApiKey: a.string(), // フォールバック用
      enableWebSearch: a.boolean().default(false),
      searchProvider: a.enum(['tavily', 'serper']),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      user: a.belongsTo('User', 'userId'),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  Conversation: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      title: a.string().required(),
      agentPresetId: a.string(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      user: a.belongsTo('User', 'userId'),
      messages: a.hasMany('Message', 'conversationId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']), // テスト用にdeleteも追加
    ]),

  Message: a
    .model({
      id: a.id().required(),
      conversationId: a.id().required(),
      role: a.enum(['user', 'assistant']),
      content: a.string().required(),
      agentResponses: a.json(),
      judgeResponse: a.json(),
      traceId: a.string(),
      createdAt: a.datetime().required(),
      conversation: a.belongsTo('Conversation', 'conversationId'),
      traceSteps: a.hasMany('TraceStep', 'messageId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']), // テスト用にdeleteも追加
    ]),

  TraceStep: a
    .model({
      id: a.id().required(),
      messageId: a.id().required(),
      traceId: a.string().required(),
      stepNumber: a.integer().required(),
      agentId: a.string().required(),
      action: a.string().required(),
      toolsUsed: a.string().array(),
      citations: a.string().array(),
      duration: a.integer().required(),
      errorCount: a.integer().default(0),
      timestamp: a.datetime().required(),
      message: a.belongsTo('Message', 'messageId'),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  AgentPreset: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      configs: a.json().required(),
      isDefault: a.boolean().default(false),
      isPublic: a.boolean().default(false),
      createdBy: a.string(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

export type Schema = typeof schema;