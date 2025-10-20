# Technical Architecture

## フロントエンド
- **Framework**: Next.js 15 + TypeScript + Tailwind CSS
- **Hosting**: AWS Amplify Hosting (SSR対応)
- **State Management**: React Server Components + Client Components
- **UI Components**: Headless UI + Radix UI

## 認証・セキュリティ
- **Authentication**: AWS Amplify Auth (Amazon Cognito)
- **SSR Token Handling**: リクエストCookieからのトークン抽出
- **Authorization**: サーバーアクションでの会話API保護
- **Security**: CSRF保護、XSS対策、Content Security Policy

## データ層
- **Data Management**: AWS Amplify Data/AI Kit
- **Database**: Amazon DynamoDB (Amplify管理)
- **Models**: User/Conversation/Message/TraceStep
- **Real-time**: AWS AppSync (GraphQL Subscriptions)

## LLM・エージェント基盤
- **LLM Gateway**: AWS Amplify → Amazon Bedrock カスタムハンドラー
- **Agent Runtime**: Amazon Bedrock AgentCore
- **Multi-Agent Framework**: Strands Agents (Python)
- **Agent Orchestration**: SOLOMON = Judge, 3賢者 = Workers

## 実行・観測基盤
- **Runtime**: Amazon Bedrock AgentCore
- **Observability**: AgentCore Observability + OpenTelemetry
- **Monitoring**: Amazon CloudWatch + AWS X-Ray
- **Tracing**: トレースID連携 (UI ↔ AgentCore)

## マルチエージェント設計
- **Framework**: Strands Agents (Python)
- **Communication**: Agent-to-Agent (A2A) Protocol
- **Orchestration**: SOLOMON Judge による集約・評価
- **Parallel Execution**: 3賢者の並列実行

## 可観測性
- **Frontend**: Next.js + OpenTelemetry (OTEL)
- **Backend**: AgentCore Observability
- **Correlation**: トレースID連携
- **Metrics**: トークン使用量、レイテンシ、エラー率、セッション数
- **Dashboards**: CloudWatch + カスタムダッシュボード

## 技術スタック詳細
```
Frontend: Next.js 15 + TypeScript + Tailwind
├── Authentication: Amplify Auth (Cognito)
├── Data: Amplify Data/AI Kit
└── Hosting: Amplify Hosting (SSR)

Backend: Amazon Bedrock + Strands Agents
├── AgentCore: Runtime + Observability
├── Multi-Agent: Strands (Python)
└── Integration: Custom Handlers

Observability: OpenTelemetry + CloudWatch
├── Frontend: Next.js OTEL
├── Backend: AgentCore OTEL
└── Correlation: Trace ID linking
```