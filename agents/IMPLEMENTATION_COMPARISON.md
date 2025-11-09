# 実装パターン比較：AgentCore Runtime実装方式

## ⚠️ 重要な前提理解

**すべてのパターンで共通:**
- AgentCore RuntimeはDockerコンテナとしてAWSにデプロイされます
- `/invocations`エンドポイント（POST）が必須
- `/ping`エンドポイント（GET）が必須
- ポート8080でリッスン
- Server-Sent Eventsでストリーミング
- フロントエンド（Next.js）は別途Amplify Hostingにデプロイ

**違いは「AgentCore Runtimeコンテナの中身」です。**

## 📊 アーキテクチャ比較

### パターンA: Next.js + Python統合コンテナ（Phase 2実装）✅ 動作確認済み

```
Amplify Hosting (Next.js Frontend)
    ↓ HTTP POST (BedrockAgentCoreClient)
    ↓ または直接HTTP POST
AgentCore Runtime (Docker Container) ← AWS管理
    ├─ Next.jsバックエンド (ポート8080)
    │   ├─ POST /invocations ← エンドポイント提供
    │   ├─ GET /ping
    │   └─ spawn('python', ['magi_agent.py']) ← 子プロセス起動
    └─ Python magi_agent.py (子プロセス)
        ├─ 標準入力: JSON リクエスト受信
        ├─ 標準出力: JSON Lines ストリーミング出力
        └─ 3賢者 + SOLOMON Judge (Strands Agents)
```

**Dockerfile:**
```dockerfile
FROM python:3.11

# Node.jsインストール
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Next.jsアプリ
COPY backend /app/backend
WORKDIR /app/backend
RUN npm install && npm run build

# Pythonエージェント
COPY magi_agent.py /app/
RUN pip install -r requirements.txt

EXPOSE 8080
CMD ["npm", "start"]
```

**特徴:**
- ✅ Next.jsが`/invocations`エンドポイントを提供
- ✅ リクエストごとにPythonプロセスをspawn
- ⚠️ プロセス起動オーバーヘッドあり（~100ms）
- ⚠️ 標準入出力でプロセス間通信
- ✅ Phase 2で動作確認済み（11.96秒、383イベント）

### パターンB: Python FastAPI直接実装（AWS推奨）⭐ 推奨

```
Amplify Hosting (Next.js Frontend)
    ↓ HTTP POST (BedrockAgentCoreClient)
AgentCore Runtime (Docker Container) ← AWS管理
    └─ FastAPI (ポート8080)
        ├─ POST /invocations ← エンドポイント提供
        ├─ GET /ping
        └─ 3賢者 + SOLOMON Judge (Strands Agents)
            └─ 直接実行（プロセスspawnなし）
```

**Dockerfile:**
```dockerfile
FROM python:3.11

# Pythonパッケージ
COPY requirements.txt /app/
WORKDIR /app
RUN pip install -r requirements.txt

# Pythonエージェント
COPY magi_agent.py /app/
COPY shared /app/shared

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**特徴:**
- ✅ FastAPIが`/invocations`エンドポイントを提供
- ✅ Pythonのみで完結（シンプル）
- ✅ プロセスspawnなし（高速）
- ✅ AgentCore Runtime標準パターン
- ✅ AWS公式ドキュメントで推奨

### パターンC: AWS SDK + FastAPI（TypeScript統合）

```
Amplify Hosting (Next.js Frontend)
    ↓ useChat() → /api/invoke
Next.js API Route
    ↓ BedrockAgentCoreClient.send()
AgentCore Runtime (Docker Container) ← AWS管理
    └─ FastAPI (ポート8080)
        ├─ POST /invocations
        ├─ GET /ping
        └─ 3賢者 + SOLOMON Judge (Strands Agents)
```

**特徴:**
- ✅ TypeScript側の実装が簡素化
- ✅ AWS SDK公式サポート
- ✅ 型安全性
- ⚠️ フロントエンド側の実装が必要

## 🔍 詳細比較

### 1. デプロイ構成

**⚠️ 重要: すべてのパターンで2段階デプロイが必要です**

#### 共通デプロイフロー

```bash
# ステップ1: AgentCore Runtimeをデプロイ（Dockerコンテナ）
docker build -t magi-agentcore .
docker push <ecr-repo>/magi-agentcore:latest
aws bedrock-agentcore create-runtime --runtime-name magi-agent

# ステップ2: Next.jsフロントエンドをデプロイ（Amplify Hosting）
amplify hosting deploy
```

#### パターンA: Next.js + Python統合コンテナ

**Dockerfile:**
```dockerfile
FROM python:3.11

# Node.jsインストール（追加オーバーヘッド）
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Next.jsアプリ
COPY backend /app/backend
WORKDIR /app/backend
RUN npm install && npm run build

# Pythonエージェント
COPY magi_agent.py /app/
RUN pip install -r requirements.txt

EXPOSE 8080
CMD ["npm", "start"]
```

**イメージサイズ:** ~1.5GB（Python + Node.js）

#### パターンB: Python FastAPI直接実装（推奨）

**Dockerfile:**
```dockerfile
FROM python:3.11

# Pythonパッケージのみ
COPY requirements.txt /app/
WORKDIR /app
RUN pip install -r requirements.txt

# Pythonエージェント
COPY magi_agent.py /app/
COPY shared /app/shared

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**イメージサイズ:** ~800MB（Pythonのみ）

#### パターンC: AWS SDK + FastAPI

**AgentCore Runtime（同じ）:**
```dockerfile
# パターンBと同じDockerfile
FROM python:3.11
...
```

**Next.js側（追加実装）:**
```typescript
// app/api/invoke/route.ts
import { BedrockAgentCoreClient } from '@aws-sdk/client-bedrock-agentcore';
// AWS SDK実装
```

### 2. コード実装

#### 参考記事準拠（Phase 2）

**Next.js側:**
```typescript
// agents/backend/app/api/invocations/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const stream = new ReadableStream({
    start(controller) {
      // Pythonプロセスを起動
      const pythonProcess = spawn('python', ['magi_agent.py'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // 入力データを送信
      pythonProcess.stdin.write(JSON.stringify(body));
      pythonProcess.stdin.end();
      
      // 標準出力を処理
      pythonProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${line}\n\n`)
            );
          }
        }
      });
      
      pythonProcess.on('close', () => {
        controller.close();
      });
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Python側:**
```python
# agents/magi_agent.py
async def main():
    # 標準入力からリクエスト受信
    input_data = sys.stdin.read()
    payload = json.loads(input_data)
    
    # MAGI決定プロセス実行
    magi_strands = MAGIStrandsAgent()
    async for event in magi_strands.process_decision_stream(payload):
        # 標準出力にJSON行を出力
        print(json.dumps(event), flush=True)

if __name__ == "__main__":
    asyncio.run(main())
```

#### AWS SDK実装

**Next.js側:**
```typescript
// app/api/invoke/route.ts
import { 
  BedrockAgentCoreClient, 
  InvokeAgentRuntimeCommand 
} from '@aws-sdk/client-bedrock-agentcore';

export async function POST(request: NextRequest) {
  const { question } = await request.json();
  
  // BedrockAgentCoreClientの初期化
  const client = new BedrockAgentCoreClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
  });
  
  // セッションID生成
  const sessionId = `session-${Date.now()}`;
  
  // InvokeAgentRuntimeCommandの実行
  const command = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: process.env.MAGI_AGENT_ARN!,
    runtimeSessionId: sessionId,
    payload: new TextEncoder().encode(JSON.stringify({ question }))
  });
  
  const response = await client.send(command);
  
  // Server-Sent Eventsでストリーミング
  const stream = new ReadableStream({
    async start(controller) {
      // response.responseはAsyncIterableStream
      for await (const event of response.response) {
        const sseData = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(new TextEncoder().encode(sseData));
      }
      controller.close();
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Python側:**
```python
# agents/magi_agent.py（同じ実装）
# AgentCore Runtimeとして独立デプロイ
```

### 3. 通信プロトコル

**⚠️ 重要: すべてのパターンでHTTPプロトコルを使用します**

#### 共通: フロントエンド → AgentCore Runtime

```
Next.js (Amplify Hosting)
    ↓ HTTP POST
    ↓ https://bedrock-agentcore.{region}.amazonaws.com/runtimes/{arn}/invocations
    ↓ Headers: SigV4署名
    ↓ Body: {"question": "..."}
AgentCore Runtime (Docker Container)
    ↓ /invocations エンドポイント
    ↓ Server-Sent Events
    ↓ data: {"type": "start", "data": {...}}
    ↓ data: {"type": "sage_chunk", "data": {...}}
    ↓ data: {"type": "complete", "data": {...}}
Next.js (Amplify Hosting)
```

#### パターンA: AgentCore Runtime内部（Next.js → Python）

```
/invocations エンドポイント（Next.js）
    ↓ spawn('python', ['magi_agent.py'])
    ↓ 標準入力: {"question": "..."}
Python magi_agent.py（子プロセス）
    ↓ 標準出力: {"type": "start", "data": {...}}
    ↓ 標準出力: {"type": "sage_chunk", "data": {...}}
    ↓ 標準出力: {"type": "complete", "data": {...}}
Next.js（親プロセス）
    ↓ Server-Sent Events変換
    ↓ data: {"type": "start", "data": {...}}\n\n
フロントエンド
```

**特徴:**
- ⚠️ プロセス間通信（標準入出力）
- ⚠️ プロセス起動オーバーヘッド
- ⚠️ バッファリング管理が必要

#### パターンB/C: AgentCore Runtime内部（FastAPI直接）

```
/invocations エンドポイント（FastAPI）
    ↓ 直接実行（プロセスspawnなし）
Python magi_agent.py（同一プロセス）
    ↓ async generator
    ↓ yield {"type": "start", "data": {...}}
    ↓ yield {"type": "sage_chunk", "data": {...}}
    ↓ yield {"type": "complete", "data": {...}}
FastAPI（StreamingResponse）
    ↓ Server-Sent Events
    ↓ data: {"type": "start", "data": {...}}\n\n
フロントエンド
```

**特徴:**
- ✅ 同一プロセス内（高速）
- ✅ プロセス起動なし
- ✅ 直接ストリーミング

## 📈 パフォーマンス比較

### パターンA: Next.js + Python統合（Phase 2実装）

**実測値（test_magi2.py）:**
- 総実行時間: **11.96秒**
- 総イベント数: **383イベント**
- プロセス起動: **~100ms**
- 3賢者並列実行: **~10秒**
- SOLOMON Judge: **~1.5秒**

**内訳:**
```
HTTP POST → AgentCore Runtime: ~50ms
Next.js /invocations 受信: ~10ms
Python spawn起動: ~100ms ← オーバーヘッド
3賢者並列実行: ~10秒
SOLOMON Judge: ~1.5秒
ストリーミング: リアルタイム
---
合計: ~11.96秒
```

### パターンB: Python FastAPI直接（推定）⭐ 最速

**推定値:**
- 総実行時間: **11.8秒**（-160ms改善）
- 総イベント数: **383イベント**（同じ）
- プロセス起動: **0ms**（なし）
- 3賢者並列実行: **~10秒**
- SOLOMON Judge: **~1.5秒**

**内訳:**
```
HTTP POST → AgentCore Runtime: ~50ms
FastAPI /invocations 受信: ~10ms
Python spawn起動: 0ms ← オーバーヘッドなし
3賢者並列実行: ~10秒
SOLOMON Judge: ~1.5秒
ストリーミング: リアルタイム
---
合計: ~11.8秒（100ms改善）
```

### パターンC: AWS SDK + FastAPI（推定）

**推定値:**
- 総実行時間: **11.8秒**（パターンBと同じ）
- 総イベント数: **383イベント**（同じ）
- AWS SDK呼び出し: **~50ms**（パターンBと同等）

**内訳:**
```
AWS SDK呼び出し: ~50ms（HTTP POSTと同等）
AgentCore Runtime処理: パターンBと同じ
---
合計: ~11.8秒
```

**結論:**
- パターンAのプロセスspawnオーバーヘッド: **~100ms**
- パターンB/Cは同等のパフォーマンス
- 実質的な差は**プロセス起動の有無のみ**

## 💰 コスト比較

**⚠️ 重要: すべてのパターンで同じコスト構成です**

### 共通コスト構成

```
Amplify Hosting (Next.js Frontend): $5-10/月
AgentCore Runtime (Docker Container): $20-40/月
Bedrock API (LLM推論): $50-100/月
データ転送: $1-5/月
---
合計: $76-155/月（1000リクエスト/月）
```

### パターン別の微細な差

#### パターンA: Next.js + Python統合

**Dockerイメージサイズ:** ~1.5GB
- Node.js + Python両方を含む
- ビルド時間: 長い
- コールドスタート: やや遅い

**月間コスト:** $76-155/月

#### パターンB: Python FastAPI直接（推奨）

**Dockerイメージサイズ:** ~800MB
- Pythonのみ
- ビルド時間: 短い
- コールドスタート: 速い

**月間コスト:** $76-155/月（同じ）

**コスト削減効果:**
- イメージサイズ半減 → ビルド時間短縮
- コールドスタート高速化 → レスポンス改善
- 実質的なコスト差: ほぼなし

#### パターンC: AWS SDK + FastAPI

**月間コスト:** $76-155/月（同じ）

**追加メリット:**
- TypeScript実装の保守性向上
- AWS SDK公式サポート

## 🛠️ 開発体験

### 参考記事準拠（Phase 2）

**メリット:**
- ✅ ローカル開発が簡単（`npm run dev`で完結）
- ✅ デバッグが容易（同一プロセス内）
- ✅ デプロイが単純（1つのコンテナ）
- ✅ 依存関係が明確（requirements.txt + package.json）

**デメリット:**
- ❌ Dockerfileの管理が必要
- ❌ Node.js + Python両方のセットアップ
- ❌ プロセス間通信のデバッグ

**ローカル開発:**
```bash
# 1. Pythonエージェントをテスト
cd agents/tests
python test_magi2.py

# 2. Next.jsバックエンドを起動
cd agents/backend
npm run dev

# 3. フロントエンドを起動
cd ../../
npm run dev
```

### AWS SDK実装

**メリット:**
- ✅ TypeScript/JavaScriptのみで完結
- ✅ AWS公式SDKのメンテナンス保証
- ✅ 型安全性による開発効率向上
- ✅ エコシステムが豊富

**デメリット:**
- ❌ AgentCore Runtimeの別途デプロイ
- ❌ ローカル開発が複雑（モック必要）
- ❌ ネットワークレイテンシのテスト困難
- ❌ AWS認証情報の管理

**ローカル開発:**
```bash
# 1. AgentCore Runtimeをデプロイ（AWS環境）
cd agents
agentcore deploy

# 2. Next.jsアプリを起動（ローカル）
cd ../
npm run dev

# 3. AWS認証情報を設定
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export MAGI_AGENT_ARN=...
```

## 🎯 推奨判断基準

### パターンA: Next.js + Python統合を選ぶべきケース

✅ **以下の条件に当てはまる場合:**
- Phase 2で動作確認済みの実装を継続したい
- 既存のNext.js実装を活用したい
- 移行コストを最小化したい

⚠️ **デメリット:**
- プロセスspawnオーバーヘッド（~100ms）
- Dockerイメージサイズ大（~1.5GB）
- 保守対象が2言語（Node.js + Python）

**推奨プロジェクト:**
- Phase 2からの継続開発
- 短期プロトタイプ
- 移行リソースが限られている

### パターンB: Python FastAPI直接を選ぶべきケース ⭐ 推奨

✅ **以下の条件に当てはまる場合:**
- AgentCore Runtime標準パターンを採用したい
- パフォーマンスを最適化したい
- シンプルな実装を重視
- AWS公式ドキュメントに準拠したい
- Dockerイメージサイズを削減したい

✅ **メリット:**
- プロセスspawnなし（高速）
- Dockerイメージ半減（~800MB）
- 保守対象が1言語（Pythonのみ）
- AWS推奨パターン

**推奨プロジェクト:**
- 新規開発
- 本番環境デプロイ
- 長期運用が前提
- パフォーマンス重視

### パターンC: AWS SDK + FastAPIを選ぶべきケース

✅ **以下の条件に当てはまる場合:**
- TypeScript側の実装を簡素化したい
- AWS SDK公式サポートを重視
- 型安全性を最大化したい
- フロントエンド開発者が多い

✅ **メリット:**
- TypeScript実装が簡潔
- AWS SDK公式メンテナンス
- 型安全性
- エコシステムが豊富

**推奨プロジェクト:**
- TypeScript中心の開発チーム
- エンタープライズアプリケーション
- 複数サービスとの統合が必要

## 🔄 移行戦略

### Phase 2 → Python FastAPI直接実装への移行（推奨）

**段階的移行:**

#### Phase 3.1: FastAPI実装作成

```python
# agents/main.py（新規作成）
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from magi_agent import MAGIStrandsAgent
import json

app = FastAPI()

@app.post("/invocations")
async def invocations(request: dict):
    """AgentCore Runtime /invocations エンドポイント"""
    
    async def generate():
        magi = MAGIStrandsAgent()
        async for event in magi.process_decision_stream(request):
            yield f"data: {json.dumps(event)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

@app.get("/ping")
async def ping():
    """AgentCore Runtime /ping エンドポイント"""
    return {"status": "healthy"}
```

#### Phase 3.2: Dockerfile更新

```dockerfile
# agents/Dockerfile（更新）
FROM python:3.11

# Pythonパッケージのみ（Node.js削除）
COPY requirements.txt /app/
WORKDIR /app
RUN pip install -r requirements.txt fastapi uvicorn

# Pythonエージェント
COPY magi_agent.py /app/
COPY main.py /app/
COPY shared /app/shared

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

#### Phase 3.3: テスト

```bash
# ローカルテスト
cd agents
uvicorn main:app --host 0.0.0.0 --port 8080

# 別ターミナルでテスト
cd agents/tests
python test_magi2.py
```

#### Phase 3.4: デプロイ

```bash
# AgentCore Runtimeを更新
docker build -t magi-agentcore:fastapi .
docker push <ecr-repo>/magi-agentcore:fastapi
aws bedrock-agentcore update-runtime --runtime-name magi-agent
```

#### Phase 3.5: クリーンアップ

```bash
# Next.jsバックエンドを削除
rm -rf agents/backend
```

### Phase 2 → AWS SDK + FastAPIへの移行

**追加ステップ:**

#### Phase 3.6: Next.js側にAWS SDK実装

```typescript
// app/api/invoke/route.ts（新規）
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';

export async function POST(request: NextRequest) {
  const { question } = await request.json();
  
  const client = new BedrockAgentCoreClient({
    region: process.env.AWS_REGION,
  });
  
  const command = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: process.env.MAGI_AGENT_ARN!,
    runtimeSessionId: `session-${Date.now()}`,
    payload: new TextEncoder().encode(JSON.stringify({ question }))
  });
  
  const response = await client.send(command);
  
  // ストリーミングレスポンス
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of response.response) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      }
      controller.close();
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

## 📊 最終推奨

### MAGIシステム2での推奨

**Python FastAPI直接実装（パターンB）への移行を推奨します。**

**理由:**

1. **AWS推奨パターン**
   - AgentCore Runtime標準実装
   - AWS公式ドキュメントで推奨
   - Strands Agents公式ガイドで推奨

2. **パフォーマンス改善**
   - プロセスspawnなし（~100ms削減）
   - Dockerイメージ半減（1.5GB → 800MB）
   - コールドスタート高速化

3. **保守性向上**
   - Pythonのみで完結（シンプル）
   - 標準的なFastAPI実装
   - デバッグが容易

4. **Phase 2からの移行コスト**
   - 低い（main.pyを追加するだけ）
   - magi_agent.pyは再利用可能
   - テストコードも再利用可能

5. **長期的なメリット**
   - AWS公式サポート
   - コミュニティ実績豊富
   - 将来的な拡張が容易

### 実装優先順位

#### 優先度1: Python FastAPI直接実装（パターンB）⭐ 推奨

**対象:**
- 新規開発
- Phase 2からの移行
- 本番環境デプロイ

**移行コスト:** 低（main.py追加のみ）
**メリット:** 最大（パフォーマンス + 保守性）

#### 優先度2: AWS SDK + FastAPI（パターンC）

**対象:**
- TypeScript中心の開発チーム
- エンタープライズ要件
- 複数サービス統合

**移行コスト:** 中（Next.js側の実装追加）
**メリット:** TypeScript統合、型安全性

#### 優先度3: Phase 2実装継続（パターンA）

**対象:**
- 短期プロトタイプ
- 移行リソースが限られている
- 既存実装の継続使用

**移行コスト:** なし
**デメリット:** プロセスspawnオーバーヘッド

### 推奨移行タイムライン

```
現在（Phase 2）
    ↓ 1-2週間
Phase 3.1: FastAPI実装作成
    ↓ 1週間
Phase 3.2: テスト・検証
    ↓ 1週間
Phase 3.3: 本番デプロイ
    ↓ 1週間
Phase 3.4: クリーンアップ
---
合計: 4-5週間
```

**Phase 2実装は動作確認済みなので、並行運用しながら段階的に移行することを推奨します。**

## 🔗 参考資料

### Phase 2実装
- `agents/PHASE2_BASELINE_COMPLETE.md` - 動作確認ドキュメント
- `agents/backend/app/api/invocations/route.ts` - Next.js実装
- `agents/magi_agent.py` - Python実装
- `agents/tests/test_magi2.py` - テストスクリプト

### AWS SDK実装
- `agents/JAVASCRIPT_SDK_IMPLEMENTATION.md` - 実装ガイド
- [@aws-sdk/client-bedrock-agentcore](https://www.npmjs.com/package/@aws-sdk/client-bedrock-agentcore)
- [AWS公式ドキュメント](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-invoke-agent.html)
