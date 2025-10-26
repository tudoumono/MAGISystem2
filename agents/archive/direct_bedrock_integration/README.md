# Direct Bedrock Integration - 非使用実装

このディレクトリには、直接Bedrock Runtime APIを使用した実装が保管されています。

## 🚫 **非使用理由**

AgentCore Runtime統合により、以下の理由で不要となりました：

### **直接Bedrock統合の問題点**
- ❌ 手動のBoto3クライアント管理
- ❌ 複雑なエラーハンドリング
- ❌ Lambda 15分実行制限
- ❌ セッション管理の複雑性
- ❌ 手動スケーリング設定
- ❌ 監視・ログ設定の手動実装

### **AgentCore Runtimeの利点**
- ✅ 自動Bedrock統合
- ✅ 8時間実行対応
- ✅ 専用マイクロVM環境
- ✅ 自動セッション管理
- ✅ 自動スケーリング
- ✅ 統合監視・ログ

## 📁 **アーカイブファイル**

### `bedrock_agent.py` (from caspar/)
- **内容**: CASPAR用直接Bedrock Runtime API実装
- **機能**: boto3.client('bedrock-runtime')による直接統合
- **非使用理由**: AgentCore RuntimeがBedrock統合を自動処理

## 🔄 **移行パス**

### **旧実装** (非使用)
```python
# 直接Bedrock API呼び出し
bedrock_client = boto3.client('bedrock-runtime')
response = bedrock_client.invoke_model(...)
```

### **新実装** (推奨)
```python
# AgentCore Runtime + Strands Agents
from strands import Agent
agent = Agent(model="anthropic.claude-3-5-sonnet-20240620-v1:0")
response = agent(prompt)
```

## ⚠️ **重要**

これらのファイルは**使用しないでください**：
- 古いアーキテクチャパターン
- 手動統合の複雑性
- AWS公式推奨外の実装

---

**移行日**: 2025-10-26  
**理由**: AgentCore Runtime統合による統一アーキテクチャ採用