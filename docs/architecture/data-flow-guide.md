# MAGI Decision System - データフロー詳細ガイド

## 📋 目次

1. [データフロー概要](#データフロー概要)
2. [リクエスト処理フロー](#リクエスト処理フロー)
3. [AI判断プロセス](#ai判断プロセス)
4. [データ永続化](#データ永続化)
5. [リアルタイム更新](#リアルタイム更新)
6. [エラーハンドリング](#エラーハンドリング)
7. [パフォーマンス最適化](#パフォーマンス最適化)

---

## 🔄 データフロー概要

### 全体的なデータの流れ

```
ユーザー入力 → フロントエンド → API → Lambda → Python → AI → 結果返却
     ↓              ↓         ↓       ↓        ↓     ↓        ↓
   質問入力    →   UI更新  → 認証  → 処理  → 3賢者 → 統合 → 画面表示
```

### 身近な例での理解

**MAGI Decision Systemを「レストランでの注文」に例えると：**

1. **お客様（ユーザー）**: 「おすすめ料理は？」と質問
2. **ウェイター（フロントエンド）**: 注文を受け取り、厨房に伝達
3. **厨房長（API Gateway）**: 注文を整理し、各シェフに指示
4. **3人のシェフ（3賢者）**: それぞれ異なる視点で料理を提案
   - **和食シェフ（CASPAR）**: 伝統的で安全な料理を提案
   - **フレンチシェフ（BALTHASAR）**: 創造的で新しい料理を提案
   - **イタリアンシェフ（MELCHIOR）**: バランスの取れた料理を提案
5. **総料理長（SOLOMON Judge）**: 3人の提案を聞いて最終決定
6. **ウェイター**: お客様に結果を報告

---

## 📨 リクエスト処理フロー

### 1. ユーザーからのリクエスト開始

```typescript
// ユーザーがブラウザで質問を入力
const userInput = "新しいAI技術を導入すべきでしょうか？";

// フロントエンド（Next.js）でAPIを呼び出し
const response = await fetch('/api/agents/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    message: userInput,
    conversationId: "conv_12345",
    userId: "user_67890",
    timestamp: new Date().toISOString()
  })
});
```

### 2. CloudFront経由でのルーティング

```
ブラウザ → CloudFront → API Gateway
   ↓           ↓            ↓
HTTPS      キャッシュ     認証・検証
リクエスト   チェック      レート制限
```

**CloudFrontでの処理:**
- 静的コンテンツのキャッシュ確認
- 地理的に最も近いエッジサーバーから配信
- セキュリティヘッダーの追加

### 3. API Gatewayでの前処理

```json
{
  "requestId": "req_abc123",
  "httpMethod": "POST",
  "path": "/api/agents/ask",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs...",
    "User-Agent": "Mozilla/5.0...",
    "X-Forwarded-For": "203.0.113.1"
  },
  "body": "{\"message\":\"新しいAI技術を導入すべきでしょうか？\"}",
  "isBase64Encoded": false
}
```

**API Gatewayでの処理:**
- JWT トークンの検証
- CORS ヘッダーの設定
- レート制限の適用
- リクエストの妥当性チェック

### 4. Lambda Function起動

```typescript
// handler.ts
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // OpenTelemetryトレーシング開始
  return tracer.startActiveSpan('bedrock-agent-gateway', async (span) => {
    try {
      // リクエストボディの解析
      const request: AskAgentRequest = JSON.parse(event.body || '{}');
      
      // トレーシング情報の設定
      span.setAttributes({
        'http.method': event.httpMethod,
        'magi.message': request.message,
        'magi.user_id': request.metadata?.userId
      });
      
      // MAGI Decision Systemの実行
      const result = await executeMAGIDecisionSystem(request, span);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    } catch (error) {
      // エラーハンドリング
      span.recordException(error as Error);
      return createErrorResponse(error);
    }
  });
};
```

---

## 🤖 AI判断プロセス

### 1. Python Subprocess起動

```typescript
// TypeScript側でPythonプロセスを起動
async function executePythonMAGI(request: AskAgentRequest, span: any): Promise<any> {
  const pythonProcess = spawn('python3', ['magi_executor.py'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname,
    env: {
      ...process.env,
      AWS_REGION: 'ap-northeast-1',
      BEDROCK_AGENT_EXECUTION_ROLE_ARN: process.env.BEDROCK_AGENT_EXECUTION_ROLE_ARN
    }
  });

  // リクエストデータをJSONとしてPythonに送信
  const requestJson = JSON.stringify(request);
  pythonProcess.stdin.write(requestJson);
  pythonProcess.stdin.end();

  // Pythonからの応答を待機
  return new Promise((resolve, reject) => {
    let stdout = '';
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(JSON.parse(stdout));
      } else {
        reject(new Error(`Python process failed with code ${code}`));
      }
    });
  });
}
```

### 2. 3賢者による並列分析

```python
# magi_executor.py
async def _consult_three_sages(self, question: str) -> list:
    """3賢者による並列分析"""
    sage_types = ["caspar", "balthasar", "melchior"]
    
    # 並列実行タスクを作成
    tasks = [
        self._consult_single_sage(sage_type, question)
        for sage_type in sage_types
        if self.agents.get(sage_type)
    ]
    
    # 並列実行（同時に3人の賢者が判断）
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 結果の処理
    valid_responses = []
    for i, response in enumerate(responses):
        if isinstance(response, Exception):
            # エラー時のフォールバック
            fallback_response = create_fallback_response(sage_types[i])
            valid_responses.append(fallback_response)
        else:
            valid_responses.append(response)
    
    return valid_responses
```

### 3. 個別エージェントの判断プロセス

```python
async def _consult_single_sage(self, sage_type: str, question: str) -> Dict[str, Any]:
    """個別の賢者による判断"""
    agent_info = self.agents[sage_type]
    agent = agent_info["agent"]
    config = agent_info["config"]
    
    # プロンプト構築
    full_prompt = f"""
{config['system_prompt']}

## 質問
{question}

## 指示
上記の質問について、あなたの専門的視点から分析し、
以下のJSON形式で回答してください：

{{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}}
"""
    
    try:
        # Strands Agent経由でBedrock API呼び出し
        result = agent(full_prompt)
        response_text = str(result)
        
        # レスポンス解析
        parsed_response = self._parse_sage_response(response_text, sage_type)
        
        return {
            "agentId": sage_type,
            "decision": parsed_response.get('decision', 'REJECTED'),
            "content": parsed_response.get('analysis', response_text),
            "reasoning": parsed_response.get('reasoning', '解析エラー'),
            "confidence": float(parsed_response.get('confidence', 0.5)),
            "executionTime": 0,  # 実際の実行時間を計測
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        # エラー時の安全な応答
        return create_error_response(sage_type, str(e))
```

### 4. SOLOMON Judgeによる統合評価

```python
async def _solomon_judgment(self, sage_responses: list, question: str) -> Dict[str, Any]:
    """SOLOMON Judgeによる統合評価"""
    
    # 3賢者の結果をまとめたプロンプト作成
    sage_summary = self._create_sage_summary(sage_responses)
    
    solomon_prompt = f"""
あなたはSOLOMON Judge - MAGI Decision Systemの統括者です。

## 元の質問
{question}

## 3賢者の判断結果
{sage_summary}

## 指示
上記の3賢者の判断を評価し、統合判断を行ってください。
以下のJSON形式で回答してください：

{{
  "final_decision": "APPROVED" または "REJECTED",
  "voting_result": {{"approved": 数値, "rejected": 数値, "abstained": 数値}},
  "scores": [
    {{"agent_id": "caspar", "score": 0-100, "reasoning": "評価理由"}},
    {{"agent_id": "balthasar", "score": 0-100, "reasoning": "評価理由"}},
    {{"agent_id": "melchior", "score": 0-100, "reasoning": "評価理由"}}
  ],
  "summary": "統合要約（150-200文字）",
  "final_recommendation": "最終推奨事項（100-150文字）",
  "reasoning": "最終判断の根拠（150-200文字）",
  "confidence": 0.0-1.0の数値
}}
"""
    
    try:
        # SOLOMON Agent呼び出し
        result = self.agents["solomon"]["agent"](solomon_prompt)
        response_text = str(result)
        
        # レスポンス解析と投票結果集計
        return self._parse_solomon_response(response_text, sage_responses)
        
    except Exception as e:
        # フォールバック判断
        return self._create_fallback_judgment(sage_responses)
```

---

## 💾 データ永続化

### 1. DynamoDBへの保存

```typescript
// Amplify Data (GraphQL)を使用した保存
const saveConversation = async (conversationData: ConversationInput) => {
  try {
    const result = await client.graphql({
      query: createConversation,
      variables: {
        input: {
          id: conversationData.id,
          userId: conversationData.userId,
          title: conversationData.title,
          messages: conversationData.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            agentResponses: msg.agentResponses,
            judgeResponse: msg.judgeResponse,
            traceId: msg.traceId,
            timestamp: msg.timestamp
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
    
    return result.data.createConversation;
  } catch (error) {
    console.error('Failed to save conversation:', error);
    throw error;
  }
};
```

### 2. データ構造

```json
{
  "conversations": {
    "conv_12345": {
      "id": "conv_12345",
      "userId": "user_67890",
      "title": "AI技術導入の検討",
      "messages": [
        {
          "id": "msg_001",
          "role": "user",
          "content": "新しいAI技術を導入すべきでしょうか？",
          "timestamp": "2025-10-26T10:00:00Z"
        },
        {
          "id": "msg_002",
          "role": "assistant",
          "content": "MAGI Decision System による分析結果",
          "agentResponses": [
            {
              "agentId": "caspar",
              "decision": "REJECTED",
              "reasoning": "リスクが高すぎる",
              "confidence": 0.8
            },
            {
              "agentId": "balthasar", 
              "decision": "APPROVED",
              "reasoning": "革新的な可能性",
              "confidence": 0.9
            },
            {
              "agentId": "melchior",
              "decision": "APPROVED", 
              "reasoning": "データに基づく判断",
              "confidence": 0.85
            }
          ],
          "judgeResponse": {
            "finalDecision": "APPROVED",
            "votingResult": {
              "approved": 2,
              "rejected": 1,
              "abstained": 0,
              "totalVotes": 3
            },
            "summary": "2対1で可決。段階的導入を推奨。",
            "confidence": 0.85
          },
          "traceId": "trace_abc123",
          "timestamp": "2025-10-26T10:00:30Z"
        }
      ],
      "createdAt": "2025-10-26T10:00:00Z",
      "updatedAt": "2025-10-26T10:00:30Z"
    }
  }
}
```

---

## 🔄 リアルタイム更新

### 1. GraphQL Subscriptionによる更新

```typescript
// Frontend - リアルタイム更新の購読
const subscribeToConversationUpdates = (userId: string) => {
  const subscription = client.graphql({
    query: onUpdateConversation,
    variables: { userId }
  }).subscribe({
    next: (data) => {
      const updatedConversation = data.data.onUpdateConversation;
      
      // UIの状態を更新
      setConversations(prev => 
        prev.map(conv => 
          conv.id === updatedConversation.id 
            ? updatedConversation 
            : conv
        )
      );
      
      // 新しいメッセージの通知
      if (updatedConversation.messages.length > 0) {
        const latestMessage = updatedConversation.messages[updatedConversation.messages.length - 1];
        if (latestMessage.role === 'assistant') {
          showNotification('MAGI判断が完了しました');
        }
      }
    },
    error: (error) => {
      console.error('Subscription error:', error);
    }
  });
  
  return subscription;
};
```

### 2. 楽観的更新

```typescript
// ユーザーメッセージの即座表示
const sendMessage = async (message: string, conversationId: string) => {
  // 1. 楽観的更新（即座にUIに表示）
  const optimisticMessage = {
    id: `temp_${Date.now()}`,
    role: 'user' as const,
    content: message,
    timestamp: new Date(),
    status: 'sending'
  };
  
  setMessages(prev => [...prev, optimisticMessage]);
  
  try {
    // 2. 実際のAPI呼び出し
    const response = await fetch('/api/agents/ask', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId })
    });
    
    const result = await response.json();
    
    // 3. 実際の結果でUIを更新
    setMessages(prev => 
      prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, id: result.messageId, status: 'sent' }
          : msg
      )
    );
    
    // 4. MAGI応答を追加
    const magiMessage = {
      id: result.messageId + '_response',
      role: 'assistant' as const,
      content: 'MAGI Decision System による分析',
      agentResponses: result.agentResponses,
      judgeResponse: result.judgeResponse,
      timestamp: new Date(result.timestamp)
    };
    
    setMessages(prev => [...prev, magiMessage]);
    
  } catch (error) {
    // エラー時は楽観的更新を取り消し
    setMessages(prev => 
      prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, status: 'error' }
          : msg
      )
    );
  }
};
```

---

## 🚨 エラーハンドリング

### 1. 段階的機能縮退

```python
# エージェント失敗時の対応
async def _handle_agent_failure(self, agent_id: str, error: Exception) -> Dict[str, Any]:
    """エージェント失敗時のフォールバック処理"""
    
    fallback_decisions = {
        "caspar": "REJECTED",      # 保守的エージェントは安全側に
        "balthasar": "ABSTAINED",  # 革新的エージェントは判断保留
        "melchior": "ABSTAINED"    # バランス型エージェントは判断保留
    }
    
    return {
        "agentId": agent_id,
        "decision": fallback_decisions.get(agent_id, "ABSTAINED"),
        "content": f"エージェント {agent_id} の実行中にエラーが発生しました: {str(error)}",
        "reasoning": "システムエラーによる自動判断",
        "confidence": 0.0,
        "executionTime": 0,
        "timestamp": datetime.now().isoformat(),
        "error": {
            "code": "AGENT_EXECUTION_ERROR",
            "message": str(error)
        }
    }
```

### 2. リトライ機構

```typescript
// 指数バックオフによるリトライ
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // 指数バックオフ（1秒、2秒、4秒...）
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// 使用例
const result = await retryWithBackoff(
  () => executePythonMAGI(request, span),
  3,  // 最大3回リトライ
  1000  // 初期遅延1秒
);
```

### 3. サーキットブレーカー

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
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
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

---

## ⚡ パフォーマンス最適化

### 1. Lambda Cold Start対策

```typescript
// プロセスプールによる最適化
class PythonProcessPool {
  private pool: ChildProcess[] = [];
  private maxSize = 5;
  
  async getProcess(): Promise<ChildProcess> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    return this.createNewProcess();
  }
  
  returnProcess(process: ChildProcess) {
    if (this.pool.length < this.maxSize && !process.killed) {
      this.pool.push(process);
    } else {
      process.kill();
    }
  }
  
  private createNewProcess(): ChildProcess {
    return spawn('python3', ['magi_executor.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });
  }
}

const processPool = new PythonProcessPool();
```

### 2. キャッシュ戦略

```typescript
// メモリキャッシュ
const responseCache = new Map<string, CachedResponse>();

interface CachedResponse {
  data: AskAgentResponse;
  timestamp: number;
  ttl: number;
}

function getCacheKey(request: AskAgentRequest): string {
  // メッセージ内容をハッシュ化
  return crypto
    .createHash('sha256')
    .update(request.message)
    .digest('hex');
}

async function getCachedResponse(request: AskAgentRequest): Promise<AskAgentResponse | null> {
  const key = getCacheKey(request);
  const cached = responseCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return {
      ...cached.data,
      // キャッシュからの応答であることを示す
      metadata: {
        ...cached.data.metadata,
        fromCache: true
      }
    };
  }
  
  return null;
}

async function setCachedResponse(request: AskAgentRequest, response: AskAgentResponse) {
  const key = getCacheKey(request);
  responseCache.set(key, {
    data: response,
    timestamp: Date.now(),
    ttl: 3600000  // 1時間
  });
}
```

### 3. バッチ処理最適化

```python
# 複数リクエストの並列処理
async def process_batch_requests(self, requests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """複数のMAGI判断を並列処理"""
    
    # セマフォで同時実行数を制限
    semaphore = asyncio.Semaphore(3)  # 最大3つまで同時実行
    
    async def process_single_request(request_data):
        async with semaphore:
            return await self.execute_magi_decision(request_data)
    
    # 全リクエストを並列実行
    tasks = [process_single_request(req) for req in requests]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 結果の整理
    processed_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            processed_results.append({
                "success": False,
                "error": str(result),
                "request_id": requests[i].get("id", f"req_{i}")
            })
        else:
            processed_results.append(result)
    
    return processed_results
```

---

## 📊 監視・メトリクス

### 1. カスタムメトリクス

```typescript
// CloudWatch カスタムメトリクス送信
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({ region: 'ap-northeast-1' });

async function publishMetrics(
  metricName: string,
  value: number,
  unit: string,
  dimensions: Record<string, string> = {}
) {
  const params = {
    Namespace: 'MAGI/DecisionSystem',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
        Timestamp: new Date()
      }
    ]
  };
  
  try {
    await cloudwatch.send(new PutMetricDataCommand(params));
  } catch (error) {
    console.error('Failed to publish metrics:', error);
  }
}

// 使用例
await publishMetrics('DecisionLatency', executionTime, 'Milliseconds', {
  FinalDecision: result.judgeResponse.finalDecision,
  AgentCount: result.agentResponses.length.toString()
});
```

### 2. 分散トレーシング

```typescript
// OpenTelemetry スパンの詳細設定
const span = tracer.startSpan('magi-decision-process');

span.setAttributes({
  'magi.request.message': request.message,
  'magi.request.user_id': request.metadata?.userId,
  'magi.request.conversation_id': request.conversationId,
  'magi.agents.count': 4,
  'magi.agents.parallel': true
});

// 各エージェントの実行をトレース
for (const agentResponse of result.agentResponses) {
  span.addEvent('agent-response', {
    'agent.id': agentResponse.agentId,
    'agent.decision': agentResponse.decision,
    'agent.confidence': agentResponse.confidence,
    'agent.execution_time': agentResponse.executionTime
  });
}

// 最終結果をトレース
span.setAttributes({
  'magi.result.final_decision': result.judgeResponse.finalDecision,
  'magi.result.confidence': result.judgeResponse.confidence,
  'magi.result.execution_time': result.executionTime
});

span.end();
```

---

このドキュメントにより、MAGI Decision Systemのデータフローを完全に理解し、効率的な開発・運用が可能になります。

**作成者**: MAGI Development Team  
**最終更新**: 2025年10月26日  
**ドキュメントバージョン**: 1.0.0