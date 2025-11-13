# フロントエンド ⇔ AgentCore Runtime 接続デバッグガイド

## 概要

このドキュメントは、Amplifyにデプロイされたフロントエンドから、DockerコンテナにデプロイされたAgentCore Runtimeへの接続問題をデバッグする手順を説明します。

## 前提条件

- ✅ Amplifyでフロントエンドがデプロイ済み
- ✅ 環境変数が設定済み
- ✅ AgentCore RuntimeがDockerでデプロイ済み
- ✅ 両方とも起動している

## 問題の症状

- CloudWatchにAgentCore Runtimeのログが表示されない
- フロントエンドからAgentCore Runtimeへの接続が失敗する
- チャット機能が動作しない

## デバッグ手順

### ステップ1: デバッグページで環境変数を確認

1. ブラウザで以下のURLにアクセス:
   ```
   https://your-amplify-domain/debug/environment-check
   ```

2. 以下の環境変数が正しく設定されているか確認:
   - `NEXT_PUBLIC_AGENTCORE_URL` - **最も重要**
   - `NEXT_PUBLIC_AWS_REGION`
   - `NEXT_PUBLIC_USER_POOL_ID`
   - `NEXT_PUBLIC_GRAPHQL_ENDPOINT`

3. もし`NEXT_PUBLIC_AGENTCORE_URL`が未設定または間違っている場合:
   - Amplify Consoleで環境変数を設定
   - **再デプロイを実行**（環境変数は再デプロイしないと反映されません）
   - ブラウザでハードリロード（Ctrl+Shift+R / Cmd+Shift+R）

### ステップ2: 基本接続テスト（/ping）

1. デバッグページで「1️⃣ AgentCore Runtime接続テスト（/ping）」ボタンをクリック

2. **成功の場合:**
   ```
   ✅ 接続成功!
   Status: 200
   Response: pong
   ```
   → ステップ3に進む

3. **失敗の場合（TypeError: Failed to fetch）:**

   **考えられる原因:**
   - URLが間違っている（http/https、ポート番号）
   - Dockerコンテナが起動していない
   - セキュリティグループでポートが開放されていない
   - CORS設定が適切でない
   - DNS解決に失敗している

   **確認項目:**
   ```bash
   # ECS/Fargateでタスクが起動しているか確認
   aws ecs list-tasks --cluster YOUR_CLUSTER_NAME
   aws ecs describe-tasks --cluster YOUR_CLUSTER_NAME --tasks TASK_ARN

   # ターゲットグループの健全性確認
   aws elbv2 describe-target-health --target-group-arn YOUR_TG_ARN

   # DNSが解決できるか確認
   nslookup your-agentcore-domain.com
   ```

### ステップ3: APIエンドポイントテスト（/api/invocations）

1. デバッグページで「2️⃣ API エンドポイントテスト（/api/invocations）」ボタンをクリック

2. **成功の場合:**
   ```
   ✅ APIエンドポイント接続成功!
   Content-Type: text/event-stream
   🔄 SSE ストリーミング開始
   ```
   → 接続は正常です。他の問題を確認してください

3. **失敗の場合:**

   **/pingは成功するが/api/invocationsが失敗する場合:**
   - Pythonプロセスが起動できていない
   - Python依存関係がインストールされていない
   - AgentCore側の環境変数が不足している
   - タイムアウトが発生している

### ステップ4: ブラウザの開発者ツールで詳細確認

1. ブラウザで `F12` を押して開発者ツールを開く

2. **Consoleタブ:**
   - エラーメッセージを確認
   - 赤色のエラーがないか確認
   - `CORS policy` という文字列がある場合はCORS問題

3. **Networkタブ:**
   - AgentCore RuntimeへのリクエストをフィルタリングMake sure to filter by your AgentCore URL
   - 失敗したリクエストをクリック
   - **Headers**: リクエストヘッダーとレスポンスヘッダーを確認
   - **Response**: エラーメッセージを確認
   - **Timing**: どの段階で失敗しているか確認

4. **Console で手動テスト:**
   ```javascript
   // 環境変数の確認
   console.log(process.env.NEXT_PUBLIC_AGENTCORE_URL);

   // 手動でfetch
   fetch('https://your-agentcore-url/ping')
     .then(r => r.text())
     .then(console.log)
     .catch(console.error);
   ```

### ステップ5: CloudWatch Logsでバックエンド確認

#### 5-1. ログが全く表示されない場合

**原因:** リクエストがAgentCore Runtimeに到達していない、またはログ設定の問題

**確認項目:**
1. **IAMロール:**
   ```bash
   # タスク実行ロールにCloudWatch Logs書き込み権限があるか確認
   aws iam get-role --role-name YOUR_ECS_TASK_EXECUTION_ROLE
   ```

2. **ECSタスク定義:**
   ```bash
   # awslogsドライバーが設定されているか確認
   aws ecs describe-task-definition --task-definition YOUR_TASK_DEFINITION
   ```

3. **ロググループの存在確認:**
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /ecs/
   ```

4. **ECSタスクの状態:**
   ```bash
   # タスクが起動直後にクラッシュしていないか
   aws ecs describe-tasks --cluster YOUR_CLUSTER --tasks TASK_ARN
   ```

#### 5-2. ログはあるがエラーが出ている場合

**よくあるエラーと対処法:**

1. **Python ModuleNotFoundError:**
   ```
   ModuleNotFoundError: No module named 'anthropic'
   ```
   → Dockerfileで `pip install -r requirements.txt` が実行されているか確認

2. **AWS認証エラー:**
   ```
   botocore.exceptions.NoCredentialsError: Unable to locate credentials
   ```
   → ECSタスクロールにAWS認証情報へのアクセス権があるか確認

3. **タイムアウトエラー:**
   ```
   Process timeout after 240000ms
   ```
   → `AGENTCORE_PROCESS_TIMEOUT_MS` や `MAGI_*_TIMEOUT_*` 環境変数を調整

### ステップ6: CORS設定の確認

#### AgentCore Runtimeのmiddleware.tsを確認:

```typescript
// agents/backend/src/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // これらのヘッダーが設定されているか確認
  response.headers.set('Access-Control-Allow-Origin', '*'); // または特定のドメイン
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}
```

#### curlでCORSヘッダーを確認:

```bash
curl -I -X OPTIONS https://your-agentcore-url/api/invocations \
  -H "Origin: https://your-amplify-domain" \
  -H "Access-Control-Request-Method: POST"
```

期待されるレスポンス:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### ステップ7: ネットワーク設定の確認

#### セキュリティグループ:

1. **AgentCore RuntimeのECSタスクが属するセキュリティグループ:**
   - インバウンドルール: ポート80/443を開放
   - ソース: ALB/NLBのセキュリティグループまたは 0.0.0.0/0

2. **ALB/NLBのセキュリティグループ:**
   - インバウンドルール: ポート80/443を開放
   - ソース: 0.0.0.0/0（インターネットからのアクセスを許可）

3. **確認コマンド:**
   ```bash
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   ```

#### ネットワークACL:

VPCのネットワークACLがトラフィックをブロックしていないか確認

#### ルートテーブル:

サブネットのルートテーブルが正しく設定されているか確認

### ステップ8: Docker/ECSの詳細確認

#### Dockerコンテナのヘルスチェック:

```bash
# ECSタスクの詳細を確認
aws ecs describe-tasks --cluster YOUR_CLUSTER --tasks TASK_ARN

# ヘルスチェックの状態を確認
aws elbv2 describe-target-health --target-group-arn YOUR_TG_ARN
```

#### コンテナ内で直接テスト（ECS Exec）:

```bash
# ECS Execを有効化
aws ecs execute-command \
  --cluster YOUR_CLUSTER \
  --task TASK_ARN \
  --container agentcore-runtime \
  --interactive \
  --command "/bin/bash"

# コンテナ内で
curl http://localhost:3000/ping
```

## チェックリスト

デバッグする際は、以下のチェックリストを順番に確認してください:

- [ ] **環境変数:** Amplify Consoleで`NEXT_PUBLIC_AGENTCORE_URL`が設定済み
- [ ] **再デプロイ:** 環境変数設定後に再デプロイ実施済み
- [ ] **ブラウザキャッシュ:** ハードリロード実施済み
- [ ] **デバッグページ:** 環境変数が正しく表示される
- [ ] **/ping成功:** 基本的な接続が確立している
- [ ] **ECSタスク:** タスクがRUNNING状態
- [ ] **セキュリティグループ:** 必要なポートが開放済み
- [ ] **CORS:** 適切なヘッダーが設定済み
- [ ] **IAMロール:** CloudWatch Logs書き込み権限あり
- [ ] **ログドライバー:** awslogsドライバーが設定済み
- [ ] **ターゲットグループ:** ヘルスチェックが通っている
- [ ] **DNS:** ドメイン名が解決可能
- [ ] **/api/invocations成功:** APIエンドポイントが正常に動作

## よくある問題と解決策

### 問題1: 環境変数が反映されない

**症状:** Amplify Consoleで設定したのに`NEXT_PUBLIC_AGENTCORE_URL`が未設定と表示される

**解決策:**
1. Amplify Consoleで再デプロイを実行
2. デプロイ完了まで待つ（通常5-10分）
3. ブラウザでハードリロード（Ctrl+Shift+R）
4. シークレットブラウジングモードで確認

### 問題2: CORSエラー

**症状:** ブラウザのConsoleに `Access-Control-Allow-Origin` エラー

**解決策:**
1. AgentCore Runtimeの `middleware.ts` でCORSヘッダーを設定
2. OPTIONSリクエストを適切に処理
3. 再デプロイ

### 問題3: CloudWatchにログがない

**症状:** ECSタスクは起動しているがCloudWatchにログが全く表示されない

**解決策:**
1. タスク実行ロールに `CloudWatchLogsFullAccess` ポリシーをアタッチ
2. ECSタスク定義で `awslogs` ドライバーを設定
3. ロググループを手動で作成（もしまだなければ）
4. タスクを再起動

### 問題4: タイムアウト

**症状:** リクエストは届くが途中でタイムアウトする

**解決策:**
1. `NEXT_PUBLIC_SSE_TIMEOUT_MS` を増やす（例: 300000 = 5分）
2. `AGENTCORE_PROCESS_TIMEOUT_MS` を増やす
3. ALB/NLBのアイドルタイムアウトを調整
4. Pythonスクリプトのパフォーマンスを改善

## 追加リソース

- [Amplify環境変数設定ガイド](./AMPLIFY_HOSTING_ENV_VARS.md)
- [タイムアウト設定ガイド](./TIMEOUT_ENVIRONMENT_CONFIGURATION.md)
- [AWS ECS トラブルシューティング](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/troubleshooting.html)
- [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)

## サポート

問題が解決しない場合は、以下の情報を収集してサポートに連絡してください:

1. デバッグページのスクリーンショット
2. ブラウザのConsoleタブのエラーメッセージ
3. ブラウザのNetworkタブの失敗したリクエストの詳細
4. CloudWatch Logsのエラーメッセージ（もしあれば）
5. ECSタスクの状態とイベント
6. 環境変数の設定値（機密情報を除く）
