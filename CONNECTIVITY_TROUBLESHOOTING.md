# AgentCore Runtime接続トラブルシューティングガイド

**状況**: フロントエンド（Amplify Hosting）からAgentCore Runtime（Docker）への接続が失敗している

**症状**:
- ブラウザで`Failed to start streaming: TypeError: Failed to fetch`エラー
- AgentCore RuntimeのCloudWatchにログが記録されない
- チャット機能が動作しない

---

## 📋 即座に確認すべきこと

### 1. デバッグページで環境変数を確認

まず、デバッグページにアクセスして環境変数が正しく設定されているか確認してください：

```
https://your-amplify-app-url/debug/env
```

#### ✅ 正常な状態
```
NEXT_PUBLIC_AGENTCORE_URL: https://your-agentcore-runtime.execute-api.ap-northeast-1.amazonaws.com
NODE_ENV: production
```

#### ❌ 問題がある状態
```
NEXT_PUBLIC_AGENTCORE_URL: ❌ 未設定
```

### 2. ブラウザのコンソールログを確認

**期待されるログ**（修正後のコード）：
```
🔗 Connecting to AgentCore Runtime: https://your-url/api/invocations
```

**このログが表示されない場合** → 古いビルドが動いています

---

## 🔧 問題と解決方法

### 問題A: NEXT_PUBLIC_AGENTCORE_URLが未設定

#### 症状
- デバッグページで「❌ 未設定」と表示される
- `localhost:8080`へ接続しようとしている

#### 解決方法

1. **AWS Amplify Consoleを開く**
   ```
   AWS Console → AWS Amplify → アプリケーション選択
   ```

2. **環境変数を設定**
   - 左メニューから「Environment variables」を選択
   - 「Manage variables」をクリック
   - 以下を追加：
     ```
     Variable: NEXT_PUBLIC_AGENTCORE_URL
     Value: https://your-agentcore-runtime-url
     ```
   - **重要**: `NEXT_PUBLIC_` プレフィックスが必要です

3. **保存して再デプロイ**
   - 「Save」をクリック
   - 左メニューから「Build settings」→「Redeploy this version」

4. **デプロイ完了を確認**
   - 「Deployments」タブでステータスを確認
   - 緑色のチェックマークが表示されるまで待つ（通常3-5分）

5. **ブラウザのキャッシュをクリア**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

6. **デバッグページで再確認**
   - `/debug/env`にアクセス
   - 環境変数が表示されることを確認

---

### 問題B: 古いビルドが動いている

#### 症状
- Amplify Consoleで環境変数を設定したのに、デバッグページで未設定
- 新しいログ（`🔗 Connecting to...`）が表示されない

#### 解決方法

1. **Amplifyのデプロイステータスを確認**
   ```
   Amplify Console → Deployments タブ
   ```
   - 最新のデプロイが「成功」になっているか確認

2. **CloudFrontキャッシュをクリア**（該当する場合）
   - Amplifyが内部的にCloudFrontを使用している場合
   - Amplify Consoleから自動的に処理されますが、時間がかかる場合があります

3. **強制的にブラウザを更新**
   - プライベートブラウジングモードで開く
   - または別のブラウザで試す

4. **ビルドログを確認**
   ```
   Amplify Console → Deployments → 最新ビルドをクリック
   ```
   - 「Build」セクションで環境変数が読み込まれているか確認
   - ログに`NEXT_PUBLIC_AGENTCORE_URL`が表示されるか確認

---

### 問題C: AgentCore RuntimeのURLが間違っている

#### 症状
- 環境変数は設定されている
- 接続テストボタンで`Failed to fetch`または`404 Not Found`

#### 確認方法

1. **AgentCore RuntimeのURLを確認**

   デプロイ方法によってURLが異なります：

   **AWS App Runnerの場合**:
   ```
   https://xxxxx.ap-northeast-1.awsapprunner.com
   ```

   **ECS/ALBの場合**:
   ```
   https://your-alb-url.elb.ap-northeast-1.amazonaws.com
   ```

   **API Gatewayの場合**:
   ```
   https://xxxxx.execute-api.ap-northeast-1.amazonaws.com
   ```

2. **/pingエンドポイントを直接テスト**

   ブラウザまたはcurlでアクセス：
   ```bash
   curl https://your-agentcore-runtime-url/ping
   ```

   **期待される応答**:
   ```json
   {
     "status": "healthy",
     "service": "MAGI AgentCore Runtime",
     "timestamp": "2025-11-12T..."
   }
   ```

3. **URLの形式を確認**
   - ✅ 正しい: `https://xxxxx.awsapprunner.com`
   - ❌ 間違い: `https://xxxxx.awsapprunner.com/` (末尾スラッシュ)
   - ❌ 間違い: `http://xxxxx` (HTTPではなくHTTPSを使用)
   - ❌ 間違い: `https://xxxxx.awsapprunner.com/api/invocations` (パスを含めない)

---

### 問題D: CORSエラー

#### 症状
- ブラウザのコンソールに以下のようなエラー：
  ```
  Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
  ```

#### 確認方法

1. **ブラウザのNetwork TabでCORSヘッダーを確認**
   ```
   F12 → Network タブ → 失敗したリクエストを選択 → Headers
   ```

   **必要なレスポンスヘッダー**:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
   ```

2. **AgentCore Runtimeのコードを確認**

   `agents/backend/src/app/api/invocations/route.ts`の288行目あたり：
   ```typescript
   headers: {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
   }
   ```

3. **OPTIONSプリフライトリクエストを確認**

   Network Tabで`OPTIONS`リクエストが成功しているか確認：
   - ステータスコード: `200 OK`
   - CORSヘッダーが含まれている

#### 解決方法

もしCORSエラーが発生している場合：

1. AgentCore Runtimeの前段にロードバランサーやAPIゲートウェイがある場合、そちらでもCORS設定が必要
2. セキュリティグループでHTTPS（443）が許可されているか確認

---

### 問題E: ネットワーク/ファイアウォールの問題

#### 症状
- `/ping`エンドポイントにもアクセスできない
- タイムアウトエラー

#### 確認方法

1. **セキュリティグループを確認**（ECS/App Runnerの場合）
   ```
   インバウンドルール:
   - Type: HTTPS
   - Port: 443
   - Source: 0.0.0.0/0 (または Amplify HostingのIP範囲)
   ```

2. **AgentCore Runtimeが起動しているか確認**

   **App Runnerの場合**:
   ```
   AWS Console → App Runner → サービス選択 → Status: Running
   ```

   **ECSの場合**:
   ```
   AWS Console → ECS → クラスター選択 → タスク選択 → Status: RUNNING
   ```

3. **CloudWatch Logsを確認**
   ```
   AWS Console → CloudWatch → Log groups
   ```
   - AgentCore Runtimeのログが出力されているか
   - 起動エラーがないか確認

---

## 🧪 デバッグページの使用方法

### 接続テストボタン

1. `/debug/env`ページにアクセス
2. 「AgentCore Runtime接続テスト」ボタンをクリック
3. 結果を確認：

#### ✅ 成功の場合
```
接続成功!
Status: 200
Response: {"status":"healthy",...}
```

#### ❌ 失敗の場合

**`Failed to fetch`**:
- AgentCore RuntimeのURLが間違っている
- AgentCore Runtimeが起動していない
- ネットワーク/ファイアウォールの問題

**`404 Not Found`**:
- URLは正しいが、`/ping`エンドポイントが存在しない
- AgentCore Runtimeのルーティング設定を確認

**`CORS error`**:
- AgentCore RuntimeのCORS設定を確認
- プリフライトリクエストが失敗している

---

## 📝 チェックリスト

完全なトラブルシューティングチェックリスト：

### フロントエンド（Amplify Hosting）

- [ ] Amplify Consoleで`NEXT_PUBLIC_AGENTCORE_URL`が設定されている
- [ ] 環境変数設定後に再デプロイを実行した
- [ ] デプロイが完了している（緑色のチェックマーク）
- [ ] ブラウザのキャッシュをクリアした
- [ ] `/debug/env`で環境変数が表示される
- [ ] ブラウザコンソールで`🔗 Connecting to...`ログが表示される

### AgentCore Runtime

- [ ] AgentCore Runtimeがデプロイされている
- [ ] サービスのステータスが「Running」になっている
- [ ] `/ping`エンドポイントに直接アクセスできる
- [ ] CloudWatch Logsにログが出力されている
- [ ] セキュリティグループでHTTPS（443）が許可されている
- [ ] CORS設定が正しい

### ネットワーク

- [ ] AgentCore RuntimeのURLが正しい（スキーム、ホスト名）
- [ ] 末尾のスラッシュやパスが含まれていない
- [ ] HTTPSを使用している（HTTPではない）
- [ ] ファイアウォール/セキュリティグループが許可している

---

## 🆘 それでも解決しない場合

### 1. ブラウザのNetwork Tabを確認

1. F12キーを押してデベロッパーツールを開く
2. Networkタブに移動
3. チャットメッセージを送信
4. `/api/invocations`へのリクエストを探す
5. 以下を確認：
   - Request URL: どこに接続しようとしているか
   - Status Code: 何が返ってきているか
   - Response: エラーメッセージの内容

### 2. 詳細なログを取得

ブラウザのコンソールで以下を実行：
```javascript
console.log('AgentCore URL:', process.env.NEXT_PUBLIC_AGENTCORE_URL);
```

期待される出力：
```
AgentCore URL: https://your-agentcore-runtime-url
```

`undefined`が表示される場合 → 環境変数が設定されていない

### 3. curlでの直接テスト

ターミナルで以下を実行：
```bash
# Pingテスト
curl -v https://your-agentcore-runtime-url/ping

# Invocationsテスト
curl -v -X POST https://your-agentcore-runtime-url/api/invocations \
  -H "Content-Type: application/json" \
  -d '{"question":"テスト","sessionId":"test-123"}'
```

これが失敗する場合、フロントエンドの問題ではなくAgentCore Runtime側の問題です。

---

## 📚 関連ドキュメント

- [環境変数設定ガイド](docs/03-deployment/AMPLIFY_HOSTING_ENV_VARS.md)
- [ストリーミングエラー分析](STREAMING_ERROR_ANALYSIS.md)
- [AgentCoreセットアップガイド](docs/04-agent-configuration/AGENTCORE_SETUP.md)

---

## 🎯 最も一般的な原因

過去の経験から、以下が最も一般的な原因です：

1. **環境変数設定後に再デプロイしていない**（60%）
2. **古いブラウザキャッシュ**（20%）
3. **AgentCore RuntimeのURLが間違っている**（15%）
4. **AgentCore Runtimeが起動していない**（5%）

まずは上記4つを重点的に確認してください。

---

**最終更新**: 2025-11-12
