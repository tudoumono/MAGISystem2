# Design Document

## Overview

AWS Amplify Gen2とAmazon Bedrock AgentCoreを統合し、MAGIシステムの完全なインフラストラクチャを構築します。Next.js SSRアプリケーションのホスティング、認証・データ管理、エージェント実行基盤、そして統合観測システムを提供する包括的なクラウドアーキテクチャを設計します。

**学習目的**: AWS Amplify Gen2の最新機能、Amazon Bedrock AgentCoreの実用的な活用方法、OpenTelemetryによる分散トレーシングの統合パターンを習得し、実用的なフルスタックAIアプリケーションの構築方法を学習します。

## Architecture

### システム全体アーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Amplify Gen2                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Amplify Hosting                         │ │
│  │  • Next.js 15 SSR Application                          │ │
│  │  • Custom Domain + HTTPS                               │ │
│  │  • Auto Scaling + CDN                                  │ │
│  │  • Environment Variables Management                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Amplify Auth                            │ │
│  │  • Amazon Cognito User Pool                            │ │
│  │  • SSR Token Handling                                  │ │
│  │  • MFA + Social Providers                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Amplify Data                            │ │
│  │  • GraphQL API (AWS AppSync)                           │ │
│  │  • DynamoDB Tables                                     │ │
│  │  • Real-time Subscriptions                             │ │
│  │  • Owner-based Authorization                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               Amplify Functions                         │ │
│  │  • Custom Business Logic Handlers                      │ │
│  │  • Bedrock Integration Layer                           │ │
│  │  • OTEL Instrumentation                                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Amazon Bedrock AgentCore                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Runtime     │  │ Gateway     │  │ Memory              │  │
│  │ Service     │  │ Service     │  │ Service             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Identity    │  │Observability│  │ Auto Scaling        │  │
│  │ Service     │  │ (OTEL)      │  │ Management          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Strands Agents                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              SOLOMON Judge (Orchestrator)              │ │
│  │  • MAGI Decision System                                │ │
│  │  • 3 Sages Tool Integration                           │ │
│  │  • Voting + Scoring System                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ CASPAR  │  │BALTHASAR│  │MELCHIOR │                     │
│  │(保守的) │  │(革新的) │  │(バランス)│                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Observability & Monitoring                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ AWS X-Ray   │  │ CloudWatch  │  │ CloudWatch          │  │
│  │ Traces      │  │ Metrics     │  │ Logs                │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Unified Dashboard                          │ │
│  │  • End-to-End Tracing                                  │ │
│  │  • Performance Metrics                                 │ │
│  │  • Cost Analysis                                       │ │
│  │  • Alert Management                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### データフロー詳細
```
1. User Request Flow:
   Browser → Amplify Hosting → Next.js SSR → Amplify Functions
   
2. Authentication Flow:
   Next.js → Amplify Auth → Cognito → Session Management
   
3. Data Flow:
   Next.js → Amplify Data → AppSync → DynamoDB
   
4. Agent Execution Flow:
   Amplify Functions → AgentCore → Strands Agents → MAGI System
   
5. Observability Flow:
   All Components → OTEL → X-Ray + CloudWatch → Dashboard
```

## Components and Interfaces

### 1. Amplify Gen2 Configuration
```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { agentGateway } from './functions/agent-gateway/resource';

/**
 * MAGIシステムのAmplify Gen2バックエンド定義
 * 学習ポイント: Amplify Gen2のコード定義によるインフラ管理
 */
export const backend = defineBackend({
  auth,
  data,
  agentGateway,
});

// AgentCore統合のための追加設定
backend.agentGateway.addEnvironment({
  BEDROCK_REGION: 'us-east-1',
  AGENTCORE_ENDPOINT: backend.addOutput({
    customOutputKey: 'agentCoreEndpoint',
    value: process.env.AGENTCORE_ENDPOINT || 'https://agentcore.bedrock.amazonaws.com'
  }),
  OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp.amazonaws.com',
  OTEL_SERVICE_NAME: 'magi-system',
  OTEL_SERVICE_VERSION: '1.0.0'
});

// Bedrock権限の追加
backend.agentGateway.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'bedrock:InvokeModel',
    'bedrock:InvokeModelWithResponseStream',
    'bedrock:GetFoundationModel',
    'bedrock:ListFoundationModels'
  ],
  Resource: '*'
});

// AgentCore権限の追加
backend.agentGateway.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'bedrock-agent:InvokeAgent',
    'bedrock-agent:GetAgent',
    'bedrock-agent:ListAgents',
    'bedrock-runtime:InvokeAgent'
  ],
  Resource: '*'
});
```

### 2. Amplify Auth Configuration
```typescript
// amplify/auth/resource.ts
import { defineAuth } from '@aws-amplify/backend';

/**
 * MAGI システム認証設定
 * 学習ポイント: SSR対応のCognito設定とセキュリティ考慮
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'MAGIシステム - メール認証',
      verificationEmailBody: (createCode) => 
        `MAGIシステムへようこそ。認証コード: ${createCode()}`
    },
    // ソーシャルプロバイダー設定（オプション）
    externalProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        scopes: ['email', 'profile']
      },
      signInWithApple: {
        clientId: process.env.APPLE_CLIENT_ID!,
        keyId: process.env.APPLE_KEY_ID!,
        privateKey: process.env.APPLE_PRIVATE_KEY!,
        teamId: process.env.APPLE_TEAM_ID!
      }
    }
  },
  // MFA設定
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
    sms: true
  },
  // パスワードポリシー
  userAttributes: {
    email: {
      required: true,
      mutable: true
    },
    name: {
      required: false,
      mutable: true
    },
    'custom:user_role': {
      dataType: 'String',
      mutable: true
    }
  },
  // セキュリティ設定
  accountRecovery: 'EMAIL_ONLY',
  passwordPolicy: {
    minLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true
  }
});
```

### 3. Amplify Data Configuration
```typescript
// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * MAGIシステムデータスキーマ
 * 学習ポイント: GraphQL + DynamoDBの統合とリアルタイム機能
 */
const schema = a.schema({
  // ユーザーモデル
  User: a.model({
    id: a.id().required(),
    email: a.string().required(),
    name: a.string(),
    role: a.enum(['USER', 'ADMIN', 'RESEARCHER']),
    preferences: a.json(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    
    // リレーション
    conversations: a.hasMany('Conversation', 'userId'),
    agentPresets: a.hasMany('AgentPreset', 'createdBy')
  }).authorization(allow => [
    allow.owner(),
    allow.groups(['admin']).to(['read', 'update', 'delete'])
  ]),

  // 会話モデル
  Conversation: a.model({
    id: a.id().required(),
    userId: a.id().required(),
    title: a.string().required(),
    agentPresetId: a.string(),
    status: a.enum(['ACTIVE', 'ARCHIVED', 'DELETED']),
    metadata: a.json(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    
    // リレーション
    user: a.belongsTo('User', 'userId'),
    messages: a.hasMany('Message', 'conversationId'),
    agentPreset: a.belongsTo('AgentPreset', 'agentPresetId')
  }).authorization(allow => [
    allow.owner(),
    allow.groups(['admin']).to(['read'])
  ]),

  // メッセージモデル
  Message: a.model({
    id: a.id().required(),
    conversationId: a.id().required(),
    role: a.enum(['USER', 'ASSISTANT']),
    content: a.string().required(),
    
    // MAGI応答データ
    agentResponses: a.json(), // AgentResponse[]
    judgeResponse: a.json(),  // JudgeResponse
    
    // トレーシング
    traceId: a.string(),
    executionTime: a.integer(),
    
    createdAt: a.datetime().required(),
    
    // リレーション
    conversation: a.belongsTo('Conversation', 'conversationId'),
    traceSteps: a.hasMany('TraceStep', 'messageId')
  }).authorization(allow => [
    allow.owner(),
    allow.groups(['admin']).to(['read'])
  ]),

  // トレースステップモデル
  TraceStep: a.model({
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
    metadata: a.json(),
    timestamp: a.datetime().required(),
    
    // リレーション
    message: a.belongsTo('Message', 'messageId')
  }).authorization(allow => [
    allow.owner(),
    allow.groups(['admin']).to(['read'])
  ]),

  // エージェントプリセットモデル
  AgentPreset: a.model({
    id: a.id().required(),
    name: a.string().required(),
    description: a.string(),
    configs: a.json().required(), // Record<AgentType, AgentConfig>
    isDefault: a.boolean().default(false),
    isPublic: a.boolean().default(false),
    tags: a.string().array(),
    createdBy: a.string(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    
    // リレーション
    creator: a.belongsTo('User', 'createdBy'),
    conversations: a.hasMany('Conversation', 'agentPresetId')
  }).authorization(allow => [
    allow.owner(),
    allow.authenticated().to(['read']),
    allow.groups(['admin']).to(['read', 'update', 'delete'])
  ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
      description: 'API Key for public access'
    }
  }
});
```

### 4. Next.js OpenTelemetry Configuration
```typescript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // OpenTelemetry設定
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['@opentelemetry/api']
  },
  
  // Amplify Hosting最適化
  output: 'standalone',
  
  // 環境変数
  env: {
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME || 'magi-ui',
    OTEL_SERVICE_VERSION: process.env.OTEL_SERVICE_VERSION || '1.0.0',
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  }
};

module.exports = nextConfig;
```

```typescript
// instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

/**
 * Next.js OpenTelemetry設定
 * 学習ポイント: フロントエンドでの分散トレーシング設定
 */
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'magi-ui',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
  }),
  
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
    headers: {
      'x-aws-region': process.env.AWS_REGION || 'us-east-1'
    }
  }),
  
  instrumentations: [
    getNodeAutoInstrumentations({
      // Next.js特有の設定
      '@opentelemetry/instrumentation-fs': {
        enabled: false // ファイルシステム操作は除外
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        requestHook: (span, request) => {
          // カスタムスパン属性の追加
          span.setAttributes({
            'http.user_agent': request.headers['user-agent'],
            'magi.request_id': request.headers['x-request-id']
          });
        }
      }
    })
  ]
});

// SDK初期化
sdk.start();

console.log('OpenTelemetry initialized for MAGI System');

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated'))
    .catch((error) => console.log('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});
```

### 5. AgentCore Integration Configuration
```typescript
// amplify/functions/agent-gateway/agentcore-config.ts
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';
import { trace, context } from '@opentelemetry/api';

/**
 * AgentCore統合設定
 * 学習ポイント: Bedrock AgentCoreとの連携パターン
 */
export class AgentCoreIntegration {
  private client: BedrockAgentRuntimeClient;
  private tracer = trace.getTracer('magi-agentcore');

  constructor() {
    this.client = new BedrockAgentRuntimeClient({
      region: process.env.BEDROCK_REGION || 'us-east-1',
      // カスタムエンドポイント（AgentCore）
      endpoint: process.env.AGENTCORE_ENDPOINT
    });
  }

  /**
   * MAGI エージェント実行
   * AgentCoreを通じてStrands Agentsを実行
   */
  async executeMAGIDecision(
    question: string,
    agentConfig: any,
    traceId: string
  ): Promise<any> {
    return await this.tracer.startActiveSpan(
      'magi_decision_execution',
      {
        attributes: {
          'magi.question_length': question.length,
          'magi.trace_id': traceId,
          'magi.agent_config_id': agentConfig.id
        }
      },
      async (span) => {
        try {
          // AgentCore経由でStrands Agentsを実行
          const response = await this.client.invokeAgent({
            agentId: process.env.MAGI_AGENT_ID,
            agentAliasId: process.env.MAGI_AGENT_ALIAS_ID,
            sessionId: traceId,
            inputText: question,
            // カスタム設定の注入
            sessionState: {
              sessionAttributes: {
                agentConfig: JSON.stringify(agentConfig),
                traceId: traceId
              }
            }
          });

          span.setAttributes({
            'magi.response_length': response.completion?.length || 0,
            'magi.execution_success': true
          });

          return this.parseMAGIResponse(response);

        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ code: 2, message: (error as Error).message });
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  /**
   * MAGI応答のパース
   * AgentCoreからの応答を構造化
   */
  private parseMAGIResponse(response: any): any {
    // AgentCoreの応答からMAGI形式に変換
    return {
      agentResponses: this.extractAgentResponses(response),
      judgeResponse: this.extractJudgeResponse(response),
      traceId: response.sessionId,
      executionTime: response.executionTime || 0
    };
  }

  private extractAgentResponses(response: any): any[] {
    // 実装: AgentCoreの応答から3賢者の回答を抽出
    return [];
  }

  private extractJudgeResponse(response: any): any {
    // 実装: AgentCoreの応答からSOLOMON判断を抽出
    return {};
  }
}
```

## Security Considerations

### 1. IAM Roles and Policies
```typescript
// amplify/backend.ts (セキュリティ設定の追加)

// 最小権限の原則に基づくIAMポリシー
backend.agentGateway.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    // Bedrock最小権限
    'bedrock:InvokeModel',
    'bedrock:GetFoundationModel'
  ],
  Resource: [
    `arn:aws:bedrock:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:foundation-model/claude-3-*`,
    `arn:aws:bedrock:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:foundation-model/gpt-4-*`
  ]
});

// AgentCore特定権限
backend.agentGateway.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'bedrock-agent:InvokeAgent'
  ],
  Resource: [
    `arn:aws:bedrock-agent:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:agent/${process.env.MAGI_AGENT_ID}`
  ]
});

// CloudWatch Logs権限
backend.agentGateway.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'logs:CreateLogGroup',
    'logs:CreateLogStream',
    'logs:PutLogEvents'
  ],
  Resource: `arn:aws:logs:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:log-group:/aws/lambda/magi-*`
});
```

### 2. Environment Variables Management
```typescript
// amplify/backend.ts (環境変数管理)

// 機密情報はParameter Storeから取得
const getSecureParameter = (parameterName: string) => {
  return {
    fromParameterStore: `/magi/${process.env.NODE_ENV}/${parameterName}`
  };
};

backend.agentGateway.addEnvironment({
  // 公開可能な設定
  BEDROCK_REGION: 'us-east-1',
  OTEL_SERVICE_NAME: 'magi-agent-gateway',
  
  // 機密情報（Parameter Store）
  OPENAI_API_KEY: getSecureParameter('openai-api-key'),
  ANTHROPIC_API_KEY: getSecureParameter('anthropic-api-key'),
  AGENTCORE_API_KEY: getSecureParameter('agentcore-api-key')
});
```

## Performance Optimizations

### 1. Caching Strategy
```typescript
// lib/cache/amplify-cache.ts
import { Cache } from '@aws-amplify/cache';

/**
 * Amplify統合キャッシュ戦略
 * 学習ポイント: パフォーマンス最適化のキャッシュ設計
 */
export class MAGICacheManager {
  private cache = new Cache({
    keyPrefix: 'magi',
    capacityInBytes: 1024 * 1024 * 10, // 10MB
    itemMaxSize: 1024 * 200, // 200KB per item
    defaultTTL: 1000 * 60 * 30, // 30分
    defaultPriority: 5
  });

  // エージェント応答のキャッシュ
  async cacheAgentResponse(
    questionHash: string,
    agentConfig: any,
    response: any
  ): Promise<void> {
    const cacheKey = `agent_response:${questionHash}:${agentConfig.id}`;
    await this.cache.setItem(cacheKey, response, {
      ttl: 1000 * 60 * 60, // 1時間
      priority: 8 // 高優先度
    });
  }

  // プリセット設定のキャッシュ
  async cachePreset(presetId: string, preset: any): Promise<void> {
    const cacheKey = `preset:${presetId}`;
    await this.cache.setItem(cacheKey, preset, {
      ttl: 1000 * 60 * 60 * 24, // 24時間
      priority: 6
    });
  }
}
```

### 2. Auto Scaling Configuration
```typescript
// amplify/functions/agent-gateway/resource.ts
import { defineFunction } from '@aws-amplify/backend';

/**
 * エージェントゲートウェイ関数設定
 * 学習ポイント: サーバーレス関数の最適化
 */
export const agentGateway = defineFunction({
  name: 'agent-gateway',
  entry: './handler.ts',
  
  // パフォーマンス最適化
  runtime: 20, // Node.js 20
  timeout: 300, // 5分（MAGI実行用）
  memoryMB: 2048, // 2GB（AI処理用）
  
  // 環境変数
  environment: {
    NODE_ENV: process.env.NODE_ENV || 'production',
    BEDROCK_REGION: 'us-east-1',
    OTEL_SERVICE_NAME: 'magi-agent-gateway'
  },
  
  // 同時実行制限
  reservedConcurrency: 100,
  
  // デッドレターキュー
  deadLetterQueue: true
});

// CloudWatch Alarms
agentGateway.addCloudWatchAlarm({
  alarmName: 'MAGI-HighErrorRate',
  metricName: 'Errors',
  threshold: 10,
  evaluationPeriods: 2,
  comparisonOperator: 'GreaterThanThreshold'
});

agentGateway.addCloudWatchAlarm({
  alarmName: 'MAGI-HighLatency',
  metricName: 'Duration',
  threshold: 30000, // 30秒
  evaluationPeriods: 3,
  comparisonOperator: 'GreaterThanThreshold'
});
```

## Error Handling and Resilience

### 1. Fault Tolerance Design
```typescript
// lib/resilience/fault-tolerance.ts

/**
 * システム障害対応とフェイルオーバー機構
 * 学習ポイント: 分散システムの耐障害性設計
 */
export class FaultToleranceManager {
  // 自動復旧機能
  async handleSystemFailure(error: SystemError): Promise<void> {
    const recoveryStrategy = this.determineRecoveryStrategy(error);
    
    switch (recoveryStrategy) {
      case 'RESTART_SERVICE':
        await this.restartFailedService(error.serviceId);
        break;
      case 'FAILOVER_REGION':
        await this.executeRegionalFailover(error.region);
        break;
      case 'SCALE_RESOURCES':
        await this.emergencyScaleUp(error.resourceType);
        break;
      case 'CIRCUIT_BREAKER':
        await this.activateCircuitBreaker(error.endpoint);
        break;
    }
  }

  // AgentCore実行の自動リトライ
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        
        // エラーログとメトリクス記録
        await this.recordRetryAttempt(error, attempt, delay);
      }
    }
    throw new Error('Max retries exceeded');
  }

  // リソース解放の確実な実行
  async ensureResourceCleanup(traceId: string): Promise<void> {
    try {
      // AgentCore実行リソースの解放
      await this.releaseAgentCoreResources(traceId);
      
      // 一時的なデータの削除
      await this.cleanupTemporaryData(traceId);
      
      // メモリキャッシュのクリア
      await this.clearTraceCache(traceId);
      
    } catch (error) {
      // クリーンアップ失敗時の緊急処理
      await this.scheduleDelayedCleanup(traceId, error);
    }
  }
}
```

### 2. Circuit Breaker Pattern
```typescript
// lib/resilience/circuit-breaker.ts

/**
 * サーキットブレーカーパターン実装
 * 学習ポイント: 外部サービス呼び出しの保護機構
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeoutMs: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

## Development and Operations Efficiency

### 1. One-Command Environment Setup
```typescript
// scripts/setup-environment.ts

/**
 * ワンコマンド環境構築スクリプト
 * 学習ポイント: 開発効率化のための自動化
 */
export class EnvironmentSetup {
  async setupCompleteEnvironment(): Promise<void> {
    console.log('🚀 MAGI System Environment Setup Starting...');
    
    // 1. 依存関係のインストール
    await this.installDependencies();
    
    // 2. AWS Amplify初期化
    await this.initializeAmplify();
    
    // 3. 環境変数の設定
    await this.setupEnvironmentVariables();
    
    // 4. データベーススキーマの作成
    await this.createDatabaseSchema();
    
    // 5. AgentCoreの設定
    await this.configureAgentCore();
    
    // 6. 開発用データの投入
    await this.seedDevelopmentData();
    
    // 7. 監視・ログ設定
    await this.setupObservability();
    
    console.log('✅ Environment setup completed successfully!');
  }

  private async installDependencies(): Promise<void> {
    // Node.js依存関係
    await this.runCommand('npm install');
    
    // Python依存関係（Strands Agents）
    await this.runCommand('cd agents && pip install -r requirements.txt');
    
    // AWS CLI設定確認
    await this.verifyAWSConfiguration();
  }

  private async initializeAmplify(): Promise<void> {
    // Amplify Gen2プロジェクト初期化
    await this.runCommand('npx amplify configure');
    await this.runCommand('npx amplify init');
    
    // バックエンドリソースのデプロイ
    await this.runCommand('npx amplify push --yes');
  }
}
```

### 2. CI/CD Pipeline Configuration
```typescript
// .github/workflows/deploy.yml の設定内容

/**
 * GitHub Actions CI/CDパイプライン
 * 学習ポイント: 自動テスト・ビルド・デプロイの実装
 */
export const cicdPipelineConfig = {
  // 自動テスト実行
  testStage: {
    unitTests: 'npm run test:unit',
    integrationTests: 'npm run test:integration',
    e2eTests: 'npm run test:e2e',
    securityScan: 'npm audit && snyk test',
    typeCheck: 'npm run type-check'
  },
  
  // ビルドとデプロイ
  deployStage: {
    buildOptimization: 'npm run build:production',
    amplifyDeploy: 'npx amplify push --yes',
    agentCoreDeploy: 'python agents/deploy.py',
    smokeTests: 'npm run test:smoke'
  },
  
  // カナリアデプロイメント
  canaryDeployment: {
    trafficSplit: '10%', // 初期トラフィック
    monitoringPeriod: '30min',
    rollbackThreshold: '5%', // エラー率閾値
    fullDeploymentDelay: '2hours'
  }
};
```

### 3. Rollback and Recovery
```typescript
// lib/deployment/rollback-manager.ts

/**
 * 迅速なロールバック機能
 * 学習ポイント: 本番環境での安全なデプロイメント管理
 */
export class RollbackManager {
  async executeRollback(deploymentId: string): Promise<void> {
    const rollbackPlan = await this.createRollbackPlan(deploymentId);
    
    // 1. トラフィックの段階的切り替え
    await this.redirectTraffic(rollbackPlan.previousVersion);
    
    // 2. データベーススキーマのロールバック
    if (rollbackPlan.requiresSchemaRollback) {
      await this.rollbackDatabaseSchema(rollbackPlan.schemaVersion);
    }
    
    // 3. AgentCore設定の復元
    await this.restoreAgentCoreConfig(rollbackPlan.agentConfig);
    
    // 4. 監視とヘルスチェック
    await this.monitorRollbackHealth(rollbackPlan.healthChecks);
    
    // 5. 通知とドキュメント更新
    await this.notifyRollbackCompletion(deploymentId, rollbackPlan);
  }

  async createRollbackPlan(deploymentId: string): Promise<RollbackPlan> {
    const deployment = await this.getDeploymentDetails(deploymentId);
    const previousVersion = await this.getPreviousStableVersion(deployment);
    
    return {
      deploymentId,
      previousVersion: previousVersion.id,
      schemaVersion: previousVersion.schemaVersion,
      agentConfig: previousVersion.agentConfig,
      requiresSchemaRollback: this.requiresSchemaRollback(deployment, previousVersion),
      healthChecks: this.generateHealthChecks(previousVersion),
      estimatedDuration: this.calculateRollbackDuration(deployment)
    };
  }
}
```

## Cost Optimization

### 1. Resource Management
```typescript
// lib/cost-optimization/resource-manager.ts

/**
 * コスト最適化リソース管理
 * 学習ポイント: AWSコスト最適化のベストプラクティス
 */
export class ResourceManager {
  // DynamoDB On-Demand vs Provisioned の動的切り替え
  async optimizeDynamoDBBilling(): Promise<void> {
    const usage = await this.getDynamoDBUsage();
    
    if (usage.readCapacityUnits < 40 && usage.writeCapacityUnits < 40) {
      // 低使用量の場合はOn-Demandが経済的
      await this.switchToOnDemand();
    } else {
      // 高使用量の場合はProvisionedが経済的
      await this.switchToProvisioned(usage);
    }
  }

  // Lambda関数のメモリ最適化
  async optimizeLambdaMemory(): Promise<void> {
    const metrics = await this.getLambdaMetrics();
    
    // メモリ使用率が50%以下の場合はメモリを削減
    if (metrics.memoryUtilization < 0.5) {
      const newMemory = Math.max(512, metrics.allocatedMemory * 0.8);
      await this.updateLambdaMemory(newMemory);
    }
  }

  // 未使用リソースの検出と削除
  async cleanupUnusedResources(): Promise<void> {
    // 30日間アクセスのない会話を自動アーカイブ
    await this.archiveOldConversations(30);
    
    // 使用されていないエージェントプリセットを削除
    await this.cleanupUnusedPresets();
    
    // 古いトレースデータの削除
    await this.cleanupOldTraces(7); // 7日間保持
  }
}
```

### 2. Monitoring and Alerts
```typescript
// lib/monitoring/cost-monitor.ts

/**
 * コスト監視とアラート
 */
export class CostMonitor {
  // 月次コスト予測
  async predictMonthlyCost(): Promise<number> {
    const currentUsage = await this.getCurrentUsage();
    const daysInMonth = new Date().getDate();
    const remainingDays = 30 - daysInMonth;
    
    return currentUsage.cost * (30 / daysInMonth);
  }

  // コストアラートの設定
  async setupCostAlerts(): Promise<void> {
    // 予算の80%に達したらアラート
    await this.createBudgetAlert({
      budgetName: 'MAGI-Monthly-Budget',
      budgetLimit: 1000, // $1000/月
      alertThreshold: 80 // 80%
    });

    // 日次コストが異常に高い場合のアラート
    await this.createDailyCostAlert({
      threshold: 50, // $50/日
      action: 'NOTIFY_AND_THROTTLE'
    });
  }

  // 予算上限に近づいた際の自動制限機能
  async handleBudgetThreshold(currentSpend: number, budgetLimit: number): Promise<void> {
    const utilizationRate = currentSpend / budgetLimit;
    
    if (utilizationRate >= 0.9) {
      // 90%到達時：緊急制限
      await this.activateEmergencyThrottling();
      await this.notifyBudgetCritical(currentSpend, budgetLimit);
    } else if (utilizationRate >= 0.8) {
      // 80%到達時：警告とソフト制限
      await this.activateSoftThrottling();
      await this.notifyBudgetWarning(currentSpend, budgetLimit);
    }
  }

  private async activateEmergencyThrottling(): Promise<void> {
    // AgentCore実行の一時停止
    await this.pauseAgentCoreExecution();
    
    // 新規会話の制限
    await this.limitNewConversations();
    
    // 非必須機能の無効化
    await this.disableNonEssentialFeatures();
  }
}

/**
 * 統合ダッシュボード設定
 * 学習ポイント: システム全体状況の可視化
 */
export class UnifiedDashboard {
  async createSystemOverviewDashboard(): Promise<void> {
    const dashboard = {
      // システム状態セクション
      systemHealth: {
        widgets: [
          'amplify-hosting-status',
          'agentcore-availability',
          'database-performance',
          'authentication-metrics'
        ]
      },
      
      // パフォーマンスセクション
      performance: {
        widgets: [
          'response-latency-trends',
          'agent-execution-times',
          'database-query-performance',
          'cache-hit-rates'
        ]
      },
      
      // コスト分析セクション
      costAnalysis: {
        widgets: [
          'monthly-cost-breakdown',
          'service-cost-distribution',
          'usage-vs-budget-tracking',
          'cost-optimization-recommendations'
        ]
      },
      
      // ビジネスメトリクス
      businessMetrics: {
        widgets: [
          'active-users-count',
          'conversation-volume',
          'agent-success-rates',
          'user-satisfaction-scores'
        ]
      }
    };
    
    await this.deployDashboard(dashboard);
  }

  // リアルタイムアラート管理
  async setupAlertManagement(): Promise<void> {
    const alertConfig = {
      // 階層化アラート設定
      alertLevels: {
        INFO: { threshold: 'low', notification: 'dashboard-only' },
        WARNING: { threshold: 'medium', notification: 'email' },
        CRITICAL: { threshold: 'high', notification: 'email+sms' },
        EMERGENCY: { threshold: 'severe', notification: 'email+sms+call' }
      },
      
      // 自動エスカレーション
      escalation: {
        timeToEscalate: '15min',
        escalationChain: ['dev-team', 'ops-team', 'management'],
        autoResolveAfter: '24hours'
      },
      
      // インシデント対応
      incidentResponse: {
        autoCreateTicket: true,
        assignToOnCall: true,
        runPlaybook: true,
        notifyStakeholders: true
      }
    };
    
    await this.configureAlerts(alertConfig);
  }
}
```