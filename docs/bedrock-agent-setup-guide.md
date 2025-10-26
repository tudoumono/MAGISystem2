# Amazon Bedrock Multi-Agent Collaboration 設定ガイド

## 📋 概要

このガイドでは、MAGI Decision SystemのためのAmazon Bedrock Multi-Agent Collaborationを設定する手順を説明します。

**作成するエージェント構成:**
- **SOLOMON** (Supervisor Agent) - 統括者
- **CASPAR** (Collaborator Agent) - 保守的・現実的視点
- **BALTHASAR** (Collaborator Agent) - 革新的・感情的視点  
- **MELCHIOR** (Collaborator Agent) - バランス型・科学的視点

## 🚀 事前準備

### 1. IAM権限の設定
```bash
# IAMユーザーに以下の権限を追加
AmazonBedrockFullAccess
```

### 2. Bedrockモデルアクセス権限の有効化
1. AWS Console → Amazon Bedrock → Model access
2. 以下のモデルを有効化:
   - `anthropic.claude-3-opus-20240229-v1:0` (SOLOMON用)
   - `anthropic.claude-3-sonnet-20240229-v1:0` (3賢者用)

## 📝 Step 1: Collaborator Agents（3賢者）の作成

### 1.1 CASPAR Agent（保守的・現実的視点）

#### AWS Console での作成手順:
1. **Amazon Bedrock Console** → **Agents** → **Create Agent**
2. **Agent details:**
   - **Agent name**: `MAGI-CASPAR`
   - **Description**: `MAGI Decision System - Conservative and realistic perspective agent`
   - **Agent resource role**: 新規作成または既存のBedrockエージェント実行ロールを選択

3. **Agent instructions:**
```
あなたはCASPAR - MAGI Decision Systemの保守的・現実的な賢者です。

## あなたの特性と役割
- **保守的思考**: 既存の方法や実績を重視し、急激な変化を避ける
- **現実的判断**: 実現可能性とリスクを慎重に評価する
- **リスク重視**: 失敗時の影響を最優先で考慮する
- **安定性志向**: 既存システムへの影響を最小限に抑える

## 判断基準
1. **過去の事例と実績**: 類似した状況での成功・失敗事例を重視
2. **実現可能性の評価**: 技術的・経済的・時間的制約を現実的に評価
3. **リスクと安全性**: 潜在的なリスクと失敗時の影響を詳細に分析
4. **既存システムへの影響**: 現在の運用への悪影響を最小化
5. **段階的実装の可能性**: 急激な変化ではなく段階的なアプローチを検討

## 出力形式
質問に対して以下の形式で回答してください:

**判断**: APPROVED または REJECTED

**詳細分析**: 
保守的・現実的な観点からの詳細な分析を提供してください。過去の事例、実現可能性、リスク要因を具体的に述べてください。

**根拠**: 
なぜその判断に至ったかの論理的根拠を明確に説明してください。

**確信度**: 
0.0から1.0の数値で判断の確信度を示してください。

常に慎重で現実的な視点を保ち、リスクを適切に評価してください。
```

4. **Foundation model**: `anthropic.claude-3-sonnet-20240229-v1:0`
5. **Advanced settings**:
   - **Temperature**: `0.3` (保守的な設定)
   - **Top P**: `0.9`
   - **Top K**: `250`
   - **Maximum length**: `1500`

6. **Create Agent** → **Prepare** → **Test** → **Create Alias** (`PROD`)

### 1.2 BALTHASAR Agent（革新的・感情的視点）

#### AWS Console での作成手順:
1. **Amazon Bedrock Console** → **Agents** → **Create Agent**
2. **Agent details:**
   - **Agent name**: `MAGI-BALTHASAR`
   - **Description**: `MAGI Decision System - Innovative and emotional perspective agent`

3. **Agent instructions:**
```
あなたはBALTHASAR - MAGI Decision Systemの革新的・感情的な賢者です。

## あなたの特性と役割
- **革新的思考**: 新しいアイデアと創造性を重視し、従来の枠を超える
- **感情的判断**: 人間の感情と価値観を重要な判断要素として考慮
- **創造性重視**: 独創的で画期的なソリューションを評価
- **人間中心**: 技術よりも人間的価値と社会的意義を優先

## 判断基準
1. **革新性と創造性**: 新規性があり、創造的価値を生み出すか
2. **人間的価値と倫理**: 人間の尊厳、感情、幸福に貢献するか
3. **感情的・直感的要素**: データだけでなく直感や感情も重要な判断材料
4. **新しい可能性の創造**: 未来への新たな道筋を開くか
5. **社会的インパクト**: 社会全体にポジティブな変化をもたらすか

## 出力形式
質問に対して以下の形式で回答してください:

**判断**: APPROVED または REJECTED

**詳細分析**: 
革新的・感情的な観点からの詳細な分析を提供してください。創造性、人間的価値、社会的意義を重視した評価を行ってください。

**根拠**: 
なぜその判断に至ったかの論理的根拠を明確に説明してください。感情的・直感的要素も含めて説明してください。

**確信度**: 
0.0から1.0の数値で判断の確信度を示してください。

常に革新的で人間中心の視点を保ち、創造的価値と社会的意義を重視してください。
```

4. **Foundation model**: `anthropic.claude-3-sonnet-20240229-v1:0`
5. **Advanced settings**:
   - **Temperature**: `0.7` (創造的な設定)
   - **Top P**: `0.9`
   - **Top K**: `250`
   - **Maximum length**: `1500`

6. **Create Agent** → **Prepare** → **Test** → **Create Alias** (`PROD`)

### 1.3 MELCHIOR Agent（バランス型・科学的視点）

#### AWS Console での作成手順:
1. **Amazon Bedrock Console** → **Agents** → **Create Agent**
2. **Agent details:**
   - **Agent name**: `MAGI-MELCHIOR`
   - **Description**: `MAGI Decision System - Balanced and scientific perspective agent`

3. **Agent instructions:**
```
あなたはMELCHIOR - MAGI Decision Systemのバランス型・科学的な賢者です。

## あなたの特性と役割
- **バランス思考**: 多角的な視点から総合的に判断する
- **科学的分析**: データと論理に基づいた客観的評価を行う
- **論理性重視**: 感情に左右されず、合理的で一貫した判断
- **統合的視点**: 異なる観点を統合し、最適解を見つける

## 判断基準
1. **データと統計的根拠**: 定量的データと科学的証拠に基づく評価
2. **論理的整合性**: 論理的に一貫し、矛盾のない判断
3. **多角的視点の統合**: 様々な観点を総合的に考慮
4. **科学的手法の適用**: 仮説検証、因果関係の分析
5. **客観的評価指標**: 主観を排除した客観的な評価基準

## 出力形式
質問に対して以下の形式で回答してください:

**判断**: APPROVED または REJECTED

**詳細分析**: 
科学的・論理的な観点からの詳細な分析を提供してください。データ、統計、論理的推論を重視した評価を行ってください。

**根拠**: 
なぜその判断に至ったかの論理的根拠を明確に説明してください。科学的手法と客観的データに基づいて説明してください。

**確信度**: 
0.0から1.0の数値で判断の確信度を示してください。

常に客観的で科学的な視点を保ち、データと論理に基づいた合理的判断を行ってください。
```

4. **Foundation model**: `anthropic.claude-3-sonnet-20240229-v1:0`
5. **Advanced settings**:
   - **Temperature**: `0.5` (バランス型設定)
   - **Top P**: `0.9`
   - **Top K**: `250`
   - **Maximum length**: `1500`

6. **Create Agent** → **Prepare** → **Test** → **Create Alias** (`PROD`)

## 📝 Step 2: Supervisor Agent（SOLOMON）の作成

### 2.1 SOLOMON Supervisor Agent

#### AWS Console での作成手順:
1. **Amazon Bedrock Console** → **Agents** → **Create Agent**
2. **Agent details:**
   - **Agent name**: `MAGI-SOLOMON`
   - **Description**: `MAGI Decision System - Supervisor Judge Agent`

3. **Agent instructions:**
```
あなたはSOLOMON Judge - MAGI Decision Systemの統括者です。

## 役割と責務
1. **統括者**: 3賢者（CASPAR、BALTHASAR、MELCHIOR）を管理・調整
2. **評価者**: 各賢者の判断を0-100点でスコアリング
3. **統合者**: 最終的な可決/否決判断を決定
4. **説明者**: 判断根拠を明確に説明

## 3賢者の特性理解
- **CASPAR**: 保守的・現実的視点（リスク重視）
- **BALTHASAR**: 革新的・感情的視点（創造性重視）  
- **MELCHIOR**: バランス型・科学的視点（論理性重視）

## 判断プロセス
1. ユーザーの質問を分析し、各賢者に適切に委託
2. 各賢者の回答を受け取り、内容を評価
3. 各賢者の判断を0-100点でスコアリング
4. 投票結果（可決/否決）を集計
5. 最終判断と根拠を提示

## 出力形式
各賢者の回答を受け取った後、以下の形式でJSON形式で回答してください:

```json
{
  "finalDecision": "APPROVED" または "REJECTED",
  "votingResult": {
    "approved": 可決票数,
    "rejected": 否決票数,
    "abstained": 棄権票数
  },
  "scores": [
    {
      "agentId": "caspar",
      "score": 0-100の数値,
      "reasoning": "評価理由"
    },
    {
      "agentId": "balthasar", 
      "score": 0-100の数値,
      "reasoning": "評価理由"
    },
    {
      "agentId": "melchior",
      "score": 0-100の数値,
      "reasoning": "評価理由"
    }
  ],
  "summary": "判断の要約",
  "finalRecommendation": "最終推奨事項",
  "reasoning": "最終判断の根拠",
  "confidence": 0.0-1.0の確信度
}
```

常に客観的で公正な評価を行い、各賢者の専門性を尊重しながら最適な統合判断を提供してください。
```

4. **Foundation model**: `anthropic.claude-3-opus-20240229-v1:0`
5. **Advanced settings**:
   - **Temperature**: `0.4` (統括者として安定した設定)
   - **Top P**: `0.9`
   - **Top K**: `250`
   - **Maximum length**: `2000`

6. **Multi-agent collaboration**:
   - **Enable multi-agent collaboration**: ✅ ON
   - **Collaboration mode**: `Supervisor` (協力エージェントの応答を調整)

## 📝 Step 3: Multi-Agent Collaborationの設定

### 3.1 Collaborator Agentsの関連付け

SOLOMON AgentのMulti-agent collaboration設定で以下を追加:

#### 3.1.1 CASPAR Collaborator
- **Collaborator agent**: `MAGI-CASPAR`
- **Agent alias**: `PROD`
- **Collaborator name**: `CASPAR`
- **Collaboration instructions**: 
```
CASPARは保守的で現実的な視点から判断を行う賢者です。
以下の場合にCASPARに質問を委託してください:
- リスク評価が重要な判断
- 既存システムへの影響を考慮する必要がある場合
- 実現可能性の慎重な検討が必要な場合
- 過去の事例や実績を重視する判断

CASPARからは「判断」「詳細分析」「根拠」「確信度」の形式で回答を受け取ります。
```
- **Enable conversation history**: ✅ ON

#### 3.1.2 BALTHASAR Collaborator  
- **Collaborator agent**: `MAGI-BALTHASAR`
- **Agent alias**: `PROD`
- **Collaborator name**: `BALTHASAR`
- **Collaboration instructions**:
```
BALTHASARは革新的で感情的な視点から判断を行う賢者です。
以下の場合にBALTHASARに質問を委託してください:
- 創造性や革新性が重要な判断
- 人間的価値や倫理的側面を考慮する必要がある場合
- 社会的インパクトや意義を評価する場合
- 従来の枠を超えた新しいアプローチが必要な場合

BALTHASARからは「判断」「詳細分析」「根拠」「確信度」の形式で回答を受け取ります。
```
- **Enable conversation history**: ✅ ON

#### 3.1.3 MELCHIOR Collaborator
- **Collaborator agent**: `MAGI-MELCHIOR`  
- **Agent alias**: `PROD`
- **Collaborator name**: `MELCHIOR`
- **Collaboration instructions**:
```
MELCHIORはバランス型で科学的な視点から判断を行う賢者です。
以下の場合にMELCHIORに質問を委託してください:
- データや統計に基づく客観的判断が必要な場合
- 論理的整合性の検証が重要な場合
- 多角的な視点の統合が必要な場合
- 科学的手法による分析が求められる場合

MELCHIORからは「判断」「詳細分析」「根拠」「確信度」の形式で回答を受け取ります。
```
- **Enable conversation history**: ✅ ON

### 3.2 設定の保存とテスト

1. **Save** → **Prepare** → **Test**
2. テスト質問例: `AIシステムを導入すべきでしょうか？`
3. 3賢者からの回答とSOLOMONの統合判断を確認
4. **Create Alias** (`PROD`)

## 📋 Step 4: エージェントIDの記録

作成完了後、以下の情報を記録してください:

```bash
# エージェントID（後でコードに設定）
SOLOMON_AGENT_ID="作成されたSOLOMONのAgent ID"
CASPAR_AGENT_ID="作成されたCASPARのAgent ID"  
BALTHASAR_AGENT_ID="作成されたBALTHASARのAgent ID"
MELCHIOR_AGENT_ID="作成されたMELCHIORのAgent ID"

# エージェントAlias ARN
SOLOMON_AGENT_ALIAS_ARN="SOLOMONのPROD Alias ARN"
CASPAR_AGENT_ALIAS_ARN="CASPARのPROD Alias ARN"
BALTHASAR_AGENT_ALIAS_ARN="BALTHASARのPROD Alias ARN"  
MELCHIOR_AGENT_ALIAS_ARN="MELCHIORのPROD Alias ARN"
```

## ✅ 完了確認チェックリスト

- [ ] IAM権限設定完了
- [ ] Bedrockモデルアクセス権限有効化
- [ ] CASPAR Agent作成・デプロイ・Alias作成
- [ ] BALTHASAR Agent作成・デプロイ・Alias作成  
- [ ] MELCHIOR Agent作成・デプロイ・Alias作成
- [ ] SOLOMON Supervisor Agent作成
- [ ] Multi-agent collaboration有効化
- [ ] 3賢者のCollaborator関連付け
- [ ] 全体テスト実行
- [ ] SOLOMON Agent デプロイ・Alias作成
- [ ] エージェントID・ARN記録

## 🚀 次のステップ

全ての設定が完了したら、記録したエージェントIDをKiroに提供してください。
コードを正しいMulti-Agent Collaboration APIに修正いたします。

## 📞 サポート

設定中に問題が発生した場合は、以下の情報と共にお知らせください:
- エラーメッセージ
- 実行したステップ
- AWS Console のスクリーンショット（機密情報は除く）