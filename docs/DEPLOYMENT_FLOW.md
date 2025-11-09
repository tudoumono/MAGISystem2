# MAGIシステム デプロイフロー

## 📊 デプロイ順序

```
1. AgentCore Runtime デプロイ
   ↓ ARN取得
2. 環境変数設定（ローカル/.env.local または Amplify Console）
   ↓
3. Next.jsアプリケーションのテスト/デプロイ
```

## 🚀 詳細手順

### Phase 1: AgentCore Runtime デプロイ

#### 前提条件
- AWS CLI設定済み
- Python 3.11以上
- Docker（オプション）

#### デプロイコマンド
```bash
cd agents

# AgentCore Runtime デプロイ
agentcore deploy \
  --name magi_agent \
  --runtime python3.11 \
  --handler magi_agent:app \
  --region ap-northeast-1

# デプロイ完了後、ARNが表示される
# 例: arn:aws:bedrock-agentcore:ap-northeast-1:262152767881:runtime/magi_agent-4ORNam2cHb
```

#### ARN確認方法
```bash
# デプロイ済みAgentCore Runtimeの一覧
agentcore list --region ap-northeast-1

# 特定のAgentCore Runtimeの詳細
agentcore status --name magi_agent --region ap-northeast-1
```

### Phase 2: 環境変数設定

#### ローカル開発環境
```bash
# プロジェクトルートで実行
cp .env.local.template .env.local

# .env.localを編集
# MAGI_AGENT_ARN=arn:aws:bedrock-agentcore:ap-northeast-1:YOUR_ACCOUNT:runtime/YOUR_AGENT
```

#### Amplify Hosting
1. **Amplify Console にアクセス**
   - https://console.aws.amazon.com/amplify/

2. **アプリを選択**
   - MAGISystem2 アプリを選択

3. **環境変数を設定**
   - 左メニュー → Hosting → 環境変数
   - 「変数を追加」をクリック

4. **変数を入力**
   ```
   キー: MAGI_AGENT_ARN
   値: arn:aws:bedrock-agentcore:ap-northeast-1:262152767881:runtime/magi_agent-4ORNam2cHb
   ```

5. **保存して再デプロイ**
   - 「保存」をクリック
   - 自動的に再デプロイが開始される

### Phase 3: Next.jsアプリケーション デプロイ

#### ローカルテスト
```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000/chat
```

#### Amplify Hosting デプロイ
```bash
# mainブランチにプッシュ（自動デプロイ）
git push origin main

# または Amplify Console から手動デプロイ
# Amplify Console → アプリ → Hosting → 再デプロイ
```

## 🔍 デプロイ確認

### AgentCore Runtime 確認
```bash
# ヘルスチェック
curl -X GET https://YOUR_AGENTCORE_ENDPOINT/ping

# テスト実行
cd agents/tests
python test_magi.py
```

### Next.jsアプリケーション 確認
```bash
# ローカル
curl -X POST http://localhost:3000/api/magi/stream \
  -H "Content-Type: application/json" \
  -d '{"question": "AIの倫理的課題について"}'

# Amplify Hosting
curl -X POST https://YOUR_AMPLIFY_DOMAIN/api/magi/stream \
  -H "Content-Type: application/json" \
  -d '{"question": "AIの倫理的課題について"}'
```

## ⚠️ トラブルシューティング

### MAGI_AGENT_ARN未設定エラー
```
Error: MAGI_AGENT_ARN environment variable is not set
```

**解決方法:**
1. `.env.local`（ローカル）または Amplify Console（本番）で環境変数を設定
2. 設定後、サーバーを再起動またはAmplifyを再デプロイ

### AgentCore Runtime接続エラー
```
Error: Failed to connect to AgentCore Runtime
```

**解決方法:**
1. ARNが正しいか確認
2. AgentCore Runtimeがデプロイされているか確認
3. IAMロールに適切な権限があるか確認

### 認証エラー
```
Error: Unauthorized - AWS credentials not found
```

**解決方法:**
- ローカル: `aws configure`でAWS認証情報を設定
- Amplify: IAMロールに`bedrock-agentcore:InvokeAgentRuntime`権限を追加

## 📚 関連ドキュメント

- [AgentCore Runtime実装](../agents/magi_agent.py)
- [テストスクリプト](../agents/tests/test_magi.py)
- [API Route実装](../src/app/api/magi/stream/route.ts)
- [環境変数テンプレート](../.env.local.template)
