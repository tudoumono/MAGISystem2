# ストリーミングデータフロー詳細

## リアルタイムデータフローの可視化

### 1. リクエストフロー

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: ユーザーが質問を送信                                   │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend (Amplify Hosting)                                    │
│                                                               │
│  const response = await fetch(lambdaFunctionUrl, {           │
│    method: 'POST',                                           │
│    body: JSON.stringify({ question: '...' })                 │
│  });                                                         │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Lambda Function URL (直接呼び出し)                     │
│                                                               │
│  ⚠️ 重要: Amplifyのプロキシレイヤーを経由しない！              │
│  → ストリーミング制限を回避                                    │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Lambda Handler (streaming-handler.ts)                │
│                                                               │
│  export const handler = awslambda.streamifyResponse(         │
│    async (event, responseStream) => {                        │
│      // ストリーミング処理開始                                 │
│    }                                                         │
│  );                                                          │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Bedrock AgentCore Runtime呼び出し                     │
│                                                               │
│  const command = new InvokeAgentCommand({                    │
│    agentId: 'magi_agent-4ORNam2cHb',                        │
│    inputText: question,                                      │
│    enableTrace: true                                         │
│  });                                                         │
│                                                              │
│  const agentResponse = await bedrockClient.send(command);    │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 5: AgentCore Runtime (Python magi_agent.py)             │
│                                                               │
│  - CASPAR エージェント実行                                     │
│  - BALTHASAR エージェント実行                                  │
│  - MELCHIOR エージェント実行                                   │
│  - SOLOMON Judge統合                                          │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 6: Bedrock API (Claude 3.5 Sonnet)                      │
│                                                               │
│  - ストリーミングレスポンス生成                                 │
│  - チャンクごとに返却                                          │
└──────────────────────────────────────────────────────────────┘
```

### 2. レスポンスストリーミングフロー

```
┌──────────────────────────────────────────────────────────────┐
│ Bedrock API                                                   │
│  [Chunk 1] [Chunk 2] [Chunk 3] ... [Chunk N]                │
└──────────────────────────────────────────────────────────────┘
         │         │         │              │
         ▼         ▼         ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│ AgentCore Runtime                                             │
│  [処理1] [処理2] [処理3] ... [処理N]                          │
└──────────────────────────────────────────────────────────────┘
         │         │         │              │
         ▼         ▼         ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│ Lambda Handler (streaming-handler.ts)                         │
│                                                               │
│  for await (const chunk of agentResponse.completion) {       │
│    if (chunk.chunk?.bytes) {                                 │
│      const text = decode(chunk.chunk.bytes);                 │
│                                                              │
│      // 即座に送信（バッファリングしない）                     │
│      responseStream.write(`data: ${JSON.stringify({         │
│        type: 'chunk',                                        │
│        content: text,                                        │
│        timestamp: new Date().toISOString()                   │
│      })}\n\n`);                                              │
│    }                                                         │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
         │         │         │              │
         ▼         ▼         ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│ Lambda Function URL (Response Streaming)                      │
│  HTTP/1.1 200 OK                                             │
│  Content-Type: text/event-stream                             │
│  Transfer-Encoding: chunked                                  │
│                                                              │
│  data: {"type":"chunk","content":"こんにちは",...}            │
│                                                              │
│  data: {"type":"chunk","content":"、MAGI",...}               │
│                                                              │
│  data: {"type":"chunk","content":"システムです",...}          │
│                                                              │
│  data: {"type":"complete",...}                               │
└──────────────────────────────────────────────────────────────┘
         │         │         │              │
         ▼         ▼         ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend (EventSource or fetch)                               │
│                                                               │
│  eventSource.onmessage = (event) => {                        │
│    const data = JSON.parse(event.data);                      │
│                                                              │
│    switch (data.type) {                                      │
│      case 'chunk':                                           │
│        // リアルタイムに表示                                   │
│        appendToChat(data.content);                           │
│        break;                                                │
│      case 'complete':                                        │
│        // 完了処理                                            │
│        eventSource.close();                                  │
│        break;                                                │
│    }                                                         │
│  };                                                          │
└──────────────────────────────────────────────────────────────┘
         │         │         │              │
         ▼         ▼         ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│ User Browser                                                  │
│  [こんにちは][、MAGI][システムです]                            │
│  ↑ タイプライター効果でリアルタイム表示                         │
└──────────────────────────────────────────────────────────────┘
```

## タイムライン比較

### 従来のバッファリング型（Amplify Hostingの制限）

```
Time:  0s    5s    10s   15s   20s   25s   30s
       │     │     │     │     │     │     │
User:  [送信]                         [タイムアウト]
       └─────────────────────────────┘
       何も見えない...待機中...

Lambda: [処理中──────────────────────] [全データ返却]
                                      ↑ 30秒制限でタイムアウト

Result: ❌ エラー（タイムアウト）
```

### Lambda Response Streaming（現在の実装）

```
Time:  0s    1s    2s    3s    4s    5s    ...   20s
       │     │     │     │     │     │           │
User:  [送信][表示][表示][表示][表示][表示] ... [完了]
       └─────┴─────┴─────┴─────┴─────┴─────────┴─
       即座に応答開始！リアルタイムに表示

Lambda: [処理開始]
        └→[Chunk1送信]
           └→[Chunk2送信]
              └→[Chunk3送信]
                 └→[Chunk4送信]
                    └→[Chunk5送信]
                       └→ ... [完了]

Result: ✅ 成功（ストリーミング配信）
```

## メモリ使用量の比較

### バッファリング型

```
Memory Usage:
  ┌─────────────────────────────────────┐
  │ ████████████████████████████████████│ 100% (全データ保持)
  └─────────────────────────────────────┘
  
  - 全レスポンスをメモリに溜め込む
  - 大きなレスポンスでメモリ不足のリスク
  - Lambda制限: 最大6MB
```

### ストリーミング型

```
Memory Usage:
  ┌─────────────────────────────────────┐
  │ ██                                  │ 5-10% (チャンクのみ)
  └─────────────────────────────────────┘
  
  - チャンクを受信したら即座に送信
  - メモリに溜め込まない
  - Lambda制限: 最大20MB（ストリーミング）
```

## Server-Sent Events (SSE) フォーマット

### データ形式

```
data: {"type":"chunk","content":"こんにちは","timestamp":"2024-01-01T00:00:00.000Z"}

data: {"type":"chunk","content":"、MAGI","timestamp":"2024-01-01T00:00:01.000Z"}

data: {"type":"chunk","content":"システムです","timestamp":"2024-01-01T00:00:02.000Z"}

data: {"type":"trace","trace":{...},"timestamp":"2024-01-01T00:00:03.000Z"}

data: {"type":"complete","sessionId":"session_123","executionTime":5000}

```

### イベントタイプ

1. **chunk**: AIレスポンスのチャンク
   ```json
   {
     "type": "chunk",
     "content": "テキスト内容",
     "chunkNumber": 1,
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **trace**: トレース情報
   ```json
   {
     "type": "trace",
     "trace": {
       "agentId": "caspar",
       "action": "thinking",
       "details": "..."
     },
     "timestamp": "2024-01-01T00:00:01.000Z"
   }
   ```

3. **complete**: 完了通知
   ```json
   {
     "type": "complete",
     "sessionId": "session_123",
     "agentId": "magi_agent-4ORNam2cHb",
     "executionTime": 5000,
     "chunkCount": 42,
     "totalBytes": 12345,
     "timestamp": "2024-01-01T00:00:05.000Z"
   }
   ```

4. **error**: エラー通知
   ```json
   {
     "type": "error",
     "error": "Internal Server Error",
     "message": "AgentCore Runtime実行中にエラーが発生しました",
     "details": "...",
     "timestamp": "2024-01-01T00:00:03.000Z"
   }
   ```

## 実装のポイント

### 1. Lambda側（送信側）

```typescript
// ストリーミングハンドラーの定義
export const handler = awslambda.streamifyResponse(
  async (event, responseStream) => {
    try {
      // AgentCore Runtime呼び出し
      const agentResponse = await bedrockClient.send(command);
      
      // ストリーミングレスポンスの処理
      for await (const chunk of agentResponse.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          
          // Server-Sent Events形式で送信
          responseStream.write(`data: ${JSON.stringify({
            type: 'chunk',
            content: text,
            timestamp: new Date().toISOString(),
          })}\n\n`);
          
          // ⚠️ 重要: await しない（即座に送信）
        }
      }
      
      // 完了通知
      responseStream.write(`data: ${JSON.stringify({
        type: 'complete',
        timestamp: new Date().toISOString(),
      })}\n\n`);
      
    } finally {
      // ストリームを閉じる
      responseStream.end();
    }
  }
);
```

### 2. Frontend側（受信側）

```typescript
// EventSourceを使用した受信
const eventSource = new EventSource(lambdaFunctionUrl);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'chunk':
      // チャンクを受信したら即座に表示
      setMessages(prev => [...prev, data.content]);
      break;
      
    case 'trace':
      // トレース情報を更新
      setTraceSteps(prev => [...prev, data.trace]);
      break;
      
    case 'complete':
      // 完了処理
      console.log('Streaming completed');
      eventSource.close();
      break;
      
    case 'error':
      // エラー処理
      console.error('Streaming error:', data);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('EventSource error:', error);
  eventSource.close();
};
```

## パフォーマンス指標

### レイテンシ

| 指標 | バッファリング型 | ストリーミング型 |
|------|----------------|----------------|
| 初回応答 | 15-25秒 | 1-2秒 |
| 完了まで | 15-25秒 | 15-25秒 |
| ユーザー体験 | ❌ 長時間待機 | ✅ 即座に開始 |

### スループット

| 指標 | バッファリング型 | ストリーミング型 |
|------|----------------|----------------|
| 最大レスポンスサイズ | 6MB | 20MB |
| メモリ使用量 | 高い（全データ） | 低い（チャンクのみ） |
| 同時実行数 | 制限あり | 高い |

### コスト

| 項目 | バッファリング型 | ストリーミング型 |
|------|----------------|----------------|
| Lambda実行時間 | 同じ | 同じ |
| メモリ使用量 | 高い | 低い |
| データ転送 | 同じ | 同じ |
| **総コスト** | やや高い | やや低い |

## まとめ

### なぜストリーミングが機能するのか

1. **Lambda Response Streaming**: AWS Lambdaの新機能を活用
2. **Lambda Function URL**: 直接呼び出しでAmplifyプロキシを回避
3. **awslambda.streamifyResponse()**: ストリーミング専用ハンドラー
4. **Server-Sent Events**: 標準的なストリーミングプロトコル
5. **for await**: 非同期イテレーションで効率的な処理

### 技術的優位性

- ✅ リアルタイムレスポンス（1-2秒で開始）
- ✅ メモリ効率的（チャンクのみ保持）
- ✅ 大きなレスポンス対応（最大20MB）
- ✅ タイムアウト回避（15分まで対応）
- ✅ ユーザー体験向上（タイプライター効果）

### Qiita記事のアプローチとの違い

| 項目 | Qiita記事 | 現在のMAGISystem |
|------|----------|-----------------|
| 実装方法 | Next.jsコンテナ化 | Lambda Response Streaming |
| AgentCore Runtime数 | 2つ | 1つ |
| 運用負荷 | 高い | 低い |
| コスト | 高い | 低い |
| 開発体験 | 環境切り替え必要 | 統一エンドポイント |
