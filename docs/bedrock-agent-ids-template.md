# Bedrock Agent IDs 設定テンプレート

## 📋 エージェント情報記録用テンプレート

Human側でのエージェント作成完了後、以下のテンプレートに情報を記入してKiroに提供してください。

## 🤖 作成されたエージェント情報

### SOLOMON Supervisor Agent
```bash
SOLOMON_AGENT_ID="ここにSOLOMONのAgent IDを記入"
SOLOMON_AGENT_ALIAS_ARN="ここにSOLOMONのPROD Alias ARNを記入"
```

### CASPAR Collaborator Agent  
```bash
CASPAR_AGENT_ID="ここにCASPARのAgent IDを記入"
CASPAR_AGENT_ALIAS_ARN="ここにCASPARのPROD Alias ARNを記入"
```

### BALTHASAR Collaborator Agent
```bash
BALTHASAR_AGENT_ID="ここにBALTHASARのAgent IDを記入"  
BALTHASAR_AGENT_ALIAS_ARN="ここにBALTHASARのPROD Alias ARNを記入"
```

### MELCHIOR Collaborator Agent
```bash
MELCHIOR_AGENT_ID="ここにMELCHIORのAgent IDを記入"
MELCHIOR_AGENT_ALIAS_ARN="ここにMELCHIORのPROD Alias ARNを記入"
```

## 🔍 Agent IDとAlias ARNの確認方法

### Agent IDの確認:
1. AWS Bedrock Console → Agents
2. 作成したエージェントをクリック
3. **Agent ID** をコピー（例: `ABCDEFGHIJ`）

### Alias ARNの確認:
1. エージェント詳細ページ → **Aliases** タブ
2. `PROD` Aliasをクリック  
3. **Alias ARN** をコピー（例: `arn:aws:bedrock:us-east-1:123456789012:agent-alias/ABCDEFGHIJ/KLMNOPQRST`）

## ✅ 設定完了確認

以下の項目が全て完了していることを確認してください:

- [ ] 4つのエージェント全てが作成済み
- [ ] 各エージェントが正常にデプロイ済み  
- [ ] 各エージェントのPROD Aliasが作成済み
- [ ] SOLOMONでMulti-agent collaboration有効化済み
- [ ] 3賢者がSOLOMONのCollaboratorとして関連付け済み
- [ ] 全体のテストが正常に動作確認済み

## 📝 記入例

```bash
# 記入例（実際の値に置き換えてください）
SOLOMON_AGENT_ID="SOLOMON123"
SOLOMON_AGENT_ALIAS_ARN="arn:aws:bedrock:us-east-1:123456789012:agent-alias/SOLOMON123/PROD456"

CASPAR_AGENT_ID="CASPAR789"  
CASPAR_AGENT_ALIAS_ARN="arn:aws:bedrock:us-east-1:123456789012:agent-alias/CASPAR789/PROD101"

BALTHASAR_AGENT_ID="BALTHASAR112"
BALTHASAR_AGENT_ALIAS_ARN="arn:aws:bedrock:us-east-1:123456789012:agent-alias/BALTHASAR112/PROD131"

MELCHIOR_AGENT_ID="MELCHIOR415"
MELCHIOR_AGENT_ALIAS_ARN="arn:aws:bedrock:us-east-1:123456789012:agent-alias/MELCHIOR415/PROD161"
```

## 🚀 次のステップ

上記の情報を記入してKiroに提供していただければ、コードを正しいMulti-Agent Collaboration APIに修正いたします。