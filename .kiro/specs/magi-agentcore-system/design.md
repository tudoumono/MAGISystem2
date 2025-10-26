# MAGI Decision System - AgentCore Runtime設計書

## 概要

AWS公式の`bedrock-agentcore-starter-toolkit`を使用して、MAGI Decision SystemをAmazon Bedrock AgentCore Runtime上に実装する設計書です。

## アーキテクチャ

### システム全体構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │────│  API Gateway    │────│ AgentCore       │
│  (Frontend)     │    │   (REST API)    │    │ Runtime         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ HTTPS Request         │ InvokeAgentRuntime    │ Strands Agents
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   IAM Roles     │    │ MAGI Agents     │
│     (CDN)       │    │ (Authentication)│    │ (3 Sages + 1)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         ▼                       ▼                ┌─────────────────┐
┌─────────────────┐    ┌─────────────────┐     │   Bedrock API   │
│   DynamoDB      │    │   CloudWatch    │     │ (Claude Models) │
│ (Conversations) │    │ (Logs/Metrics)  │     └─────────────────┘
└─────────────────┘    └─────────────────┘
```

### AgentCore Runtime詳細

```
AgentCore Runtime (専用マイクロVM)
┌─────────────────────────────────────────────────────────┐
│                    Session Isolation                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              MAGI Agent Container               │ │
│  │                                                     │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │ │
│  │  │ CASPAR  │ │BALTHASAR│ │MELCHIOR │ │ SOLOMON │  │ │
│  │  │ Agent   │ │ Agent   │ │ Agent   │ │ Judge   │  │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │ │
│  │       │           │           │           │        │ │
│  │       └───────────┼───────────┼───────────┘        │ │
│  │                   │           │                    │ │
│  │                   ▼           ▼                    │ │
│  │            ┌─────────────────────┐                 │ │
│  │            │  Strands Agents     │                 │ │
│  │            │  Framework          │                 │ │
│  │            └─────────────────────┘                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                             │
│                           ▼                             │
│                 ┌─────────────────────┐                 │
│                 │    Bedrock API      │                 │
│                 │  (Claude 3.5 Sonnet)│                 │
│                 └─────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## コンポーネント設計

### 1. MAGI Agent実装 (`magi_agent.py`)

```python
from bedrock_agentcore import BedrockAgentCoreApp
from strands import Agent
import asyncio
import json
from datetime import datetime

app = BedrockAgentCoreApp()

class MAGIDecisionSystem:
    def __init__(self):
        self.agents = {
            'caspar': Agent(model="anthropic.claude-3-5-sonnet-20240620-v1:0"),
            'balthasar': Agent(model="anthropic.claude-3-5-sonnet-20240620-v1:0"),
            'melchior': Agent(model="anthropic.claude-3-5-sonnet-20240620-v1:0"),
            'solomon': Agent(model="anthropic.claude-3-5-sonnet-20240620-v1:0")
        }
        
        self.system_prompts = {
            'caspar': "保守的・現実的な賢者として判断...",
            'balthasar': "革新的・感情的な賢者として判断...",
            'melchior': "バランス型・科学的な賢者として判断...",
            'solomon': "統括者として3賢者の判断を統合..."
        }

@app.entrypoint
async def invoke(payload):
    """MAGI Decision System エントリーポイント"""
    magi = MAGIDecisionSystem()
    
    question = payload.get("prompt", "")
    session_id = payload.get("session_id", "")
    
    # 3賢者による並列分析
    sage_responses = await magi.consult_three_sages(question)
    
    # SOLOMON Judge統合評価
    judge_response = await magi.solomon_judgment(sage_responses, question)
    
    return {
        "conversation_id": session_id,
        "agent_responses": sage_responses,
        "judge_response": judge_response,
        "timestamp": datetime.now().isoformat()
    }
```

### 2. フロントエンド統合 (`api/agents/ask.ts`)

```typescript
// Next.js API Route
import { NextRequest, NextResponse } from 'next/server';
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';

const client = new BedrockAgentCoreClient({ 
  region: 'ap-northeast-1' 
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json();
    
    const command = new InvokeAgentRuntimeCommand({
      agentRuntimeArn: process.env.MAGI_AGENT_ARN,
      runtimeSessionId: conversationId || generateSessionId(),
      payload: JSON.stringify({
        prompt: message,
        session_id: conversationId
      })
    });
    
    const response = await client.send(command);
    
    // ストリーミング応答の処理
    const result = await processStreamingResponse(response);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'MAGI Decision System error' },
      { status: 500 }
    );
  }
}
```

### 3. 設定ファイル (`.bedrock_agentcore.yaml`)

```yaml
# AgentCore Runtime設定
bedrock_agentcore:
  region: ap-northeast-1
  runtime:
    memory: 2048  # 2GB (4エージェント並列実行用)
    timeout: 480  # 8分 (長時間実行対応)
    
# 環境変数
environment:
  MAGI_SYSTEM_VERSION: "2.0-agentcore"
  CLAUDE_MODEL_ID: "anthropic.claude-3-5-sonnet-20240620-v1:0"
  LOG_LEVEL: "INFO"
  
# 監視設定
observability:
  cloudwatch_logs: true
  tracing: true
  metrics: true
```

## データモデル

### リクエスト形式

```json
{
  "prompt": "新しいAI技術を導入すべきでしょうか？",
  "session_id": "session_12345",
  "context": "追加のコンテキスト情報",
  "metadata": {
    "user_id": "user_67890",
    "timestamp": "2025-10-26T10:00:00Z"
  }
}
```

### レスポンス形式

```json
{
  "conversation_id": "session_12345",
  "agent_responses": [
    {
      "agent_id": "caspar",
      "decision": "REJECTED",
      "reasoning": "リスクが高すぎる",
      "confidence": 0.8,
      "execution_time": 1200
    },
    {
      "agent_id": "balthasar",
      "decision": "APPROVED", 
      "reasoning": "革新的な可能性",
      "confidence": 0.9,
      "execution_time": 1100
    },
    {
      "agent_id": "melchior",
      "decision": "APPROVED",
      "reasoning": "データに基づく判断", 
      "confidence": 0.85,
      "execution_time": 1300
    }
  ],
  "judge_response": {
    "final_decision": "APPROVED",
    "voting_result": {
      "approved": 2,
      "rejected": 1,
      "abstained": 0,
      "total_votes": 3
    },
    "summary": "2対1で可決。段階的導入を推奨。",
    "confidence": 0.85,
    "execution_time": 800
  },
  "total_execution_time": 4400,
  "timestamp": "2025-10-26T10:00:30Z"
}
```

## エラーハンドリング

### 段階的機能縮退

1. **1エージェント失敗**: 残り2エージェント + SOLOMONで継続
2. **2エージェント失敗**: 残り1エージェント + フォールバック判断
3. **全エージェント失敗**: エラーレスポンス + 再試行推奨

### エラーレスポンス形式

```json
{
  "error": {
    "code": "AGENT_EXECUTION_ERROR",
    "message": "一部のエージェントが利用できません",
    "details": {
      "failed_agents": ["caspar"],
      "successful_agents": ["balthasar", "melchior", "solomon"],
      "retry_recommended": true
    }
  },
  "partial_result": {
    "available_responses": [...],
    "confidence_reduced": true
  }
}
```

## セキュリティ

### IAM権限

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agentcore:InvokeAgentRuntime"
      ],
      "Resource": "arn:aws:bedrock-agentcore:ap-northeast-1:*:agent-runtime/*"
    },
    {
      "Effect": "Allow", 
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
    }
  ]
}
```

### セッション分離

- 各ユーザーセッションは専用マイクロVMで実行
- CPU、メモリ、ファイルシステムの完全分離
- 最大8時間のセッション持続時間
- セッション終了時の自動リソースクリーンアップ

## パフォーマンス

### 目標値

| 指標 | 目標値 | AgentCore Runtime利点 |
|------|--------|---------------------|
| 初回応答時間 | < 3秒 | Cold Start なし |
| 並列処理時間 | < 5秒 | 専用マイクロVM |
| セッション持続 | 8時間 | 長時間実行対応 |
| 同時セッション | 1000+ | 自動スケーリング |

### 最適化戦略

1. **エージェント並列実行**: asyncio による真の並列処理
2. **ストリーミング応答**: リアルタイム結果配信
3. **セッション再利用**: 会話コンテキストの保持
4. **リソース最適化**: 消費ベース課金の活用

## 監視・運用

### CloudWatch統合

```python
import logging
from bedrock_agentcore.observability import trace, metrics

@trace("magi_decision")
async def consult_three_sages(self, question: str):
    with metrics.timer("sage_consultation_time"):
        # 3賢者による分析
        responses = await asyncio.gather(
            self.consult_sage("caspar", question),
            self.consult_sage("balthasar", question), 
            self.consult_sage("melchior", question)
        )
        
        metrics.counter("sage_consultations").increment(3)
        return responses
```

### ログ形式

```json
{
  "timestamp": "2025-10-26T10:00:30Z",
  "level": "INFO",
  "service": "magi-decision-system",
  "session_id": "session_12345",
  "trace_id": "trace_67890",
  "event": "sage_consultation_complete",
  "data": {
    "agent_id": "caspar",
    "decision": "REJECTED",
    "execution_time": 1200,
    "confidence": 0.8
  }
}
```

## デプロイメント

### 自動化されたデプロイフロー

```bash
# 1. プロジェクト初期化
mkdir magi-agentcore-system
cd magi-agentcore-system
python3 -m venv .venv
source .venv/bin/activate

# 2. 依存関係インストール
pip install bedrock-agentcore strands-agents bedrock-agentcore-starter-toolkit

# 3. エージェント設定
agentcore configure -e magi_agent.py -r ap-northeast-1

# 4. ローカルテスト
python magi_agent.py
curl -X POST http://localhost:8080/invocations -d '{"prompt": "テスト質問"}'

# 5. デプロイ実行
agentcore launch

# 6. 本番テスト
agentcore invoke '{"prompt": "新しいAI技術を導入すべき？"}'
```

### CI/CD統合

```yaml
# .github/workflows/deploy-agentcore.yml
name: Deploy MAGI AgentCore System

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install bedrock-agentcore strands-agents bedrock-agentcore-starter-toolkit
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Deploy to AgentCore Runtime
        run: |
          agentcore configure -e magi_agent.py -r ap-northeast-1 --auto-approve
          agentcore launch
      
      - name: Test deployment
        run: |
          agentcore invoke '{"prompt": "システムテスト"}'
```

この設計により、AWS公式ツールを使用した確実で保守しやすいMAGI Decision Systemが実現されます。