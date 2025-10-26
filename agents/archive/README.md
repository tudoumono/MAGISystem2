# Archive - 非使用実装

このディレクトリには、AgentCore Runtime統合により不要となった実装が保管されています。

## 🚫 **非使用理由**

MAGI Decision SystemはAWS公式の**AgentCore Runtime**アーキテクチャに移行しました：

```
Next.js UI → API Gateway → AgentCore Runtime → Strands Agents
```

### **AgentCore Runtimeの利点**
- ✅ AWS公式サポート（bedrock-agentcore-starter-toolkit）
- ✅ 8時間実行（Lambda 15分制限を超越）
- ✅ 専用マイクロVM環境
- ✅ 自動スケーリングと監視
- ✅ セッション管理とコンテキスト保持
- ✅ 自動Bedrock統合

## 📁 **アーカイブファイル**

### `bedrock_test.py`
- **内容**: 直接Bedrock Runtime API呼び出し
- **非使用理由**: AgentCore RuntimeがBedrock統合を自動処理
- **代替**: BedrockAgentCoreAppによる統合

### `direct_bedrock_integration/`
- **内容**: 手動Boto3統合コード
- **非使用理由**: AgentCore Runtimeが全て自動化
- **代替**: Strands Agents + AgentCore Runtime

## ⚠️ **重要な注意**

これらのファイルは**使用しないでください**：
- 古いアーキテクチャパターン
- 手動エラーハンドリングが必要
- Lambda 15分制限の制約
- セッション管理の複雑性

## 🚀 **現在の実装**

正しい実装は以下を使用：
- `magi_strands_agents.py` - Strands Agents統合
- `shared/` - 型定義とユーティリティ
- AgentCore Runtime - AWS公式統合

---

**作成日**: 2025-10-26  
**理由**: AgentCore Runtime移行による統合アーキテクチャ変更