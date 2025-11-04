# Strands Agents + Tavily Web Search Integration

## 概要

Strands Agentsには20以上の組み込みツールがあり、Tavilyとのネイティブ統合が公式にサポートされています。
Bedrock Agents + Lambda関数よりもシンプルで効率的な実装が可能です。

## アーキテクチャ

```
User Query
    ↓
MAGI System (3賢者)
    ↓
Strands Agent (tools=['tavily_search'])
    ↓
Tavily API (ネイティブ統合)
    ↓
Search Results → 判断材料
```

## 前提条件

- Python 3.11+
- Strands Agents SDK 1.0+
- Tavily API Key

## セットアップ手順

### 1. Tavily API Keyの取得

```bash
# https://tavily.com でアカウント作成
# API Keyを取得
```

### 2. 環境変数の設定

```bash
# .env ファイルに追加
TAVILY_API_KEY=your-tavily-api-key-here
```

### 3. Strands Agentsの依存関係インストール

```bash
cd agents
pip install strands-agents[tavily]
# または
pip install tavily-python
```

### 4. MAGI Agentsの更新

```python
from strands import Agent

# Web検索対応エージェントの作成
agent = Agent(
    model="anthropic.claude-3-5-sonnet-20241022-v2:0",
    tools=['tavily_search'],  # Tavilyツールを有効化
    system_prompt="""
あなたはMAGI Decision Systemの賢者です。
必要に応じてWeb検索を使用して最新情報を収集してください。
"""
)

# 使用例
response = agent("最新のAI技術トレンドについて教えてください")
```

## 実装例

### 基本的なWeb検索

```python
from strands import Agent
import os

# Tavily API Keyを環境変数から取得
os.environ['TAVILY_API_KEY'] = 'your-api-key'

# Web検索対応エージェント
research_agent = Agent(
    model="anthropic.claude-3-5-sonnet-20241022-v2:0",
    tools=['tavily_search'],
    system_prompt="""
あなたはリサーチエージェントです。
ユーザーの質問に対して、Web検索を使用して最新の情報を収集し、
信頼できるソースを引用しながら回答してください。
"""
)

# 検索実行
result = research_agent("2025年のAI市場規模予測は？")
print(result)
```

### MAGI 3賢者への統合

```python
from strands import Agent
from typing import Dict, List

class MAGIWebSearchSystem:
    """Web検索対応MAGI System"""
    
    def __init__(self):
        self.agents = self._initialize_agents()
    
    def _initialize_agents(self) -> Dict[str, Agent]:
        """Web検索対応の3賢者を初期化"""
        
        # 共通ツール設定
        common_tools = ['tavily_search']
        
        return {
            'caspar': Agent(
                model="anthropic.claude-3-5-sonnet-20241022-v2:0",
                tools=common_tools,
                system_prompt="""
あなたはCASPAR - 保守的・現実的な賢者です。
Web検索を使用して、過去の実績や統計データを収集し、
リスクを慎重に評価してください。
"""
            ),
            
            'balthasar': Agent(
                model="anthropic.claude-3-5-sonnet-20241022-v2:0",
                tools=common_tools,
                system_prompt="""
あなたはBALTHASAR - 革新的・感情的な賢者です。
Web検索を使用して、最新のトレンドや革新的な事例を収集し、
創造的な視点から評価してください。
"""
            ),
            
            'melchior': Agent(
                model="anthropic.claude-3-5-sonnet-20241022-v2:0",
                tools=common_tools,
                system_prompt="""
あなたはMELCHIOR - バランス型・科学的な賢者です。
Web検索を使用して、データと論理的根拠を収集し、
客観的に評価してください。
"""
            )
        }
    
    async def decide(self, question: str) -> Dict:
        """3賢者による意思決定（Web検索対応）"""
        
        # 並列実行
        import asyncio
        
        tasks = [
            asyncio.to_thread(self.agents['caspar'], question),
            asyncio.to_thread(self.agents['balthasar'], question),
            asyncio.to_thread(self.agents['melchior'], question)
        ]
        
        responses = await asyncio.gather(*tasks)
        
        return {
            'caspar': responses[0],
            'balthasar': responses[1],
            'melchior': responses[2]
        }
```

## 利用可能なTavilyツール

Strands Agentsで利用可能なTavily関連ツール：

### 1. `tavily_search`
基本的なWeb検索

```python
agent = Agent(tools=['tavily_search'])
result = agent("最新のAWS Bedrock機能は？")
```

### 2. `tavily_extract`
特定URLからのコンテンツ抽出

```python
agent = Agent(tools=['tavily_extract'])
result = agent("https://aws.amazon.com/bedrock/ の内容を要約して")
```

### 3. `tavily_qna_search`
Q&A形式の検索（直接回答を取得）

```python
agent = Agent(tools=['tavily_qna_search'])
result = agent("Claude 3.5 Sonnetのコンテキストウィンドウは？")
```

## 高度な設定

### カスタムTavily設定

```python
from strands import Agent, tool
from tavily import TavilyClient

# カスタムTavilyクライアント
@tool
def custom_tavily_search(query: str, max_results: int = 10) -> dict:
    """カスタムTavily検索"""
    client = TavilyClient(api_key=os.environ['TAVILY_API_KEY'])
    
    return client.search(
        query=query,
        search_depth="advanced",
        max_results=max_results,
        include_answer=True,
        include_raw_content=False,
        include_domains=[],  # 特定ドメインに限定
        exclude_domains=[]   # 特定ドメインを除外
    )

# カスタムツールを使用
agent = Agent(
    tools=[custom_tavily_search],
    system_prompt="カスタム検索ツールを使用してください"
)
```

### 検索結果のフィルタリング

```python
@tool
def filtered_tavily_search(query: str, domain_filter: str = None) -> dict:
    """ドメインフィルタ付きTavily検索"""
    client = TavilyClient(api_key=os.environ['TAVILY_API_KEY'])
    
    include_domains = [domain_filter] if domain_filter else []
    
    results = client.search(
        query=query,
        search_depth="advanced",
        include_domains=include_domains
    )
    
    # 結果を整形
    formatted_results = []
    for result in results.get('results', []):
        formatted_results.append({
            'title': result['title'],
            'url': result['url'],
            'content': result['content'][:500],  # 500文字に制限
            'score': result.get('score', 0)
        })
    
    return {
        'query': query,
        'results': formatted_results,
        'total': len(formatted_results)
    }
```

## パフォーマンス最適化

### 1. 並列検索

```python
import asyncio
from strands import Agent

async def parallel_research(queries: List[str]):
    """複数クエリの並列検索"""
    agent = Agent(tools=['tavily_search'])
    
    tasks = [
        asyncio.to_thread(agent, query)
        for query in queries
    ]
    
    return await asyncio.gather(*tasks)

# 使用例
queries = [
    "AWS Bedrock 最新機能",
    "Anthropic Claude 3.5 性能",
    "マルチエージェントシステム 事例"
]

results = asyncio.run(parallel_research(queries))
```

### 2. キャッシュ戦略

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def cached_search(query_hash: str, query: str) -> dict:
    """検索結果のキャッシュ"""
    client = TavilyClient(api_key=os.environ['TAVILY_API_KEY'])
    return client.search(query=query)

def search_with_cache(query: str) -> dict:
    """キャッシュ付き検索"""
    query_hash = hashlib.md5(query.encode()).hexdigest()
    return cached_search(query_hash, query)
```

## トラブルシューティング

### よくある問題

#### 1. API Key未設定エラー
```python
# エラー: TAVILY_API_KEY not found
# 解決策:
import os
os.environ['TAVILY_API_KEY'] = 'your-api-key'
```

#### 2. レート制限エラー
```python
# エラー: Rate limit exceeded
# 解決策: リトライロジックの実装
import time
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def search_with_retry(query: str):
    client = TavilyClient(api_key=os.environ['TAVILY_API_KEY'])
    return client.search(query=query)
```

#### 3. タイムアウトエラー
```python
# エラー: Request timeout
# 解決策: タイムアウト設定
import httpx

client = TavilyClient(
    api_key=os.environ['TAVILY_API_KEY'],
    timeout=30.0  # 30秒タイムアウト
)
```

## セキュリティ考慮事項

### 1. API Key管理

```python
# AWS Secrets Managerからの取得
import boto3
import json

def get_tavily_api_key():
    """Secrets ManagerからTavily API Keyを取得"""
    client = boto3.client('secretsmanager', region_name='ap-northeast-1')
    
    response = client.get_secret_value(SecretId='tavily-api-key')
    secret = json.loads(response['SecretString'])
    
    return secret['apiKey']

os.environ['TAVILY_API_KEY'] = get_tavily_api_key()
```

### 2. 検索結果のサニタイゼーション

```python
import re
from html import unescape

def sanitize_search_results(results: dict) -> dict:
    """検索結果のサニタイゼーション"""
    sanitized = results.copy()
    
    for result in sanitized.get('results', []):
        # HTMLタグの除去
        result['content'] = re.sub(r'<[^>]+>', '', result['content'])
        # HTMLエンティティのデコード
        result['content'] = unescape(result['content'])
        # 余分な空白の削除
        result['content'] = ' '.join(result['content'].split())
    
    return sanitized
```

## 監視とログ

### CloudWatch統合

```python
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch', region_name='ap-northeast-1')

def log_search_metrics(query: str, results_count: int, latency_ms: int):
    """検索メトリクスをCloudWatchに送信"""
    cloudwatch.put_metric_data(
        Namespace='MAGI/WebSearch',
        MetricData=[
            {
                'MetricName': 'SearchRequests',
                'Value': 1,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'SearchLatency',
                'Value': latency_ms,
                'Unit': 'Milliseconds',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'ResultsCount',
                'Value': results_count,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            }
        ]
    )
```

## コスト最適化

### Tavily料金プラン

- **Free Tier**: 1,000 requests/month
- **Basic**: $49/month (10,000 requests)
- **Pro**: $149/month (50,000 requests)
- **Enterprise**: カスタム価格

### コスト削減戦略

1. **キャッシュの活用**: 同じクエリの重複検索を避ける
2. **検索深度の調整**: `search_depth="basic"`で十分な場合も
3. **結果数の制限**: `max_results=5`で必要最小限に
4. **バッチ処理**: 複数クエリをまとめて処理

## 次のステップ

1. **Knowledge Base統合**: 検索結果をBedrock Knowledge Baseに保存
2. **マルチモーダル対応**: 画像・動画検索の追加
3. **カスタム検索エンジン**: 特定ドメインに特化
4. **リアルタイム更新**: WebSocketによるライブ検索

## 参考資料

- [Strands Agents Documentation](https://strandsagents.com/latest/)
- [Tavily API Documentation](https://docs.tavily.com/)
- [AWS Blog: Strands + Tavily Integration](https://aws.amazon.com/blogs/machine-learning/build-dynamic-web-research-agents-with-the-strands-agents-sdk-and-tavily/)
- [Strands Agents GitHub](https://github.com/awslabs/strands-agents)