# Task 3.2: Amazon Bedrock AgentCore統合 - ユーザーアクション手順書

## 📋 概要

**対象タスク**: Task 3.2「Amazon Bedrock AgentCore統合 **[👤 Human + 🤖 Kiro]**」

このドキュメントは、Task 3.2で **👤 Human（ユーザー）** が実施する必要がある作業の詳細手順書です。

### 🎯 Task 3.2の作業分担

**👤 Human（ユーザー）が実施する項目:**
- IAMユーザーに `AmazonBedrockFullAccess` と `BedrockAgentCoreFullAccess` 権限を追加
- AWS ConsoleでBedrock モデルアクセス権限を有効化  
- AgentCore Runtimeでの実行環境を構築（利用可能な場合）

**🤖 Kiro（AI）が実施済みの項目:**
- ✅ AWS MCP参照: 最新のBedrock AgentCore権限とセットアップ手順を確認
- ✅ OpenTelemetryトレーシングを有効化
- ✅ CloudWatch + AWS X-Rayとの連携を設定

**🎯 このドキュメントの特徴:**
- Task 3.2の **👤 Human作業項目** のみに特化
- 各操作について **コマンドライン** と **画面操作** の両方を併記
- 初心者は画面操作、上級者はコマンドラインを選択可能
- セキュリティベストプラクティスに準拠

**⚠️ 重要**: このドキュメントはTask 3.2専用です。他のタスクの手順は含まれていません。

## 🚀 Step 1: IAM権限の設定

**📋 Task 3.2対応項目**: IAMユーザーに `AmazonBedrockFullAccess` と `BedrockAgentCoreFullAccess` 権限を追加

### 1.1 必要な権限の追加

<details>
<summary>💻 <strong>コマンドライン版</strong> - AWS CLI</summary>

```bash
# 現在のユーザー名を確認
aws sts get-caller-identity --query 'Arn' --output text

# 必要なポリシーをアタッチ
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::aws:policy/BedrockAgentCoreFullAccess

# 権限の確認
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```

**メリット:** 一括で権限設定が完了、スクリプト化可能
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - AWS Console</summary>

1. **IAM Console にアクセス**
   - [IAM Console](https://console.aws.amazon.com/iam/) を開く
   - 左メニューから「Users（ユーザー）」を選択

2. **ユーザーの選択**
   - 現在使用中のユーザー（例：`magi-developer`）をクリック

3. **権限の追加**
   - 「Permissions（アクセス許可）」タブを選択
   - 「Add permissions（アクセス許可を追加）」をクリック
   - 「Attach policies directly（ポリシーを直接アタッチ）」を選択

4. **必要なポリシーを検索・選択**
   - 検索ボックスに「BedrockFullAccess」と入力
   - ✅ `AmazonBedrockFullAccess`（Amazon Bedrock フルアクセス）をチェック
   - 検索ボックスに「BedrockAgentCore」と入力  
   - ✅ `BedrockAgentCoreFullAccess`（Bedrock AgentCore フルアクセス）をチェック

5. **権限の適用**
   - 「Add permissions（アクセス許可を追加）」をクリック
   - 完了を確認

**メリット:** 視覚的に確認でき、権限の詳細も同時に確認可能
</details>

---

## 🤖 Step 2: Bedrock モデルアクセス権限の有効化

**📋 Task 3.2対応項目**: AWS ConsoleでBedrock モデルアクセス権限を有効化

### 2.1 Foundation Models の有効化

<details>
<summary>🖱️ <strong>画面操作版</strong> - AWS Console（推奨）</summary>

1. **Amazon Bedrock Console にアクセス**
   - [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock/) を開く
   - リージョンが「**Asia Pacific (Tokyo) ap-northeast-1**」になっていることを確認
   - **💡 新しいUI**: 2025年のAWS Management Console視覚的アップデートが適用済み

2. **Model catalog の確認**
   - 左メニューから「**Model catalog（モデルカタログ）**」を選択
   - または「**Playgrounds（プレイグラウンド）**」→「**Chat（チャット）**」を選択
   
   **💡 2025年の変更点**: 「Model access（モデルアクセス）」ページは廃止されました

3. **必要なモデルを有効化**

   **🚀 2025年10月最新情報**: Amazon Bedrockでは、**全てのサーバーレス基盤モデルが自動有効化**されるようになりました！

   **自動利用可能なモデル（Automatic Enablement）:**
   - ✅ **Amazon Titan Text G1 - Express** - 即座に利用可能
   - ✅ **Meta Llama モデル** - 即座に利用可能  
   - ✅ **OpenAI GPT-OSS モデル** - 即座に利用可能
   - ✅ **Mistral AI モデル** - 即座に利用可能
   - ✅ **その他サーバーレスモデル** - 即座に利用可能
   
   **一回限りの使用フォーム提出が必要:**
   - 🔄 **Anthropic Claude 3.5 Sonnet** - 初回利用時のみ使用フォーム提出
   - 🔄 **Anthropic Claude 3 Haiku** - 初回利用時のみ使用フォーム提出

4. **Anthropicモデルの初回設定（一回限り）**
   - **Playgrounds（プレイグラウンド）** → **Chat（チャット）** を選択
   - Model selector（モデル選択）から「**Anthropic Claude 3.5 Sonnet**」を選択
   - 初回利用時に「**Usage form（使用フォーム）**」が表示される場合:
     - **Use case（ユースケース）**: 「AI decision support system development」
     - **Organization details（組織詳細）**: 適切に入力
     - 「**Submit（送信）**」をクリック
   - ✅ **重要**: 組織管理アカウントで提出すると、全メンバーアカウントで自動有効化

5. **モデル利用可能性の確認**
   - **Model catalog（モデルカタログ）** または **Playgrounds（プレイグラウンド）** で確認
   - 全モデルが「**Available（利用可能）**」と表示されることを確認
   - 手動での「Request access（アクセス要求）」は不要

**メリット:** モデルの詳細情報を確認しながら選択可能
</details>

<details>
<summary>💻 <strong>コマンドライン版</strong> - AWS CLI</summary>

```bash
# 利用可能なモデル一覧を確認
aws bedrock list-foundation-models --region ap-northeast-1

# 特定のモデルの詳細確認
aws bedrock get-foundation-model \
  --model-identifier anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --region ap-northeast-1

# モデルアクセス状況の確認
aws bedrock list-model-customization-jobs --region ap-northeast-1
```

**💡 2025年の変更**: CLI経由でのモデルアクセス許可は不要になりました（自動有効化のため）
</details>

---

## 📊 Step 3: CloudWatch Transaction Search の有効化

**📋 Task 3.2関連項目**: 🤖 Kiroが実装したOpenTelemetryトレーシング機能を有効化するための設定

### 3.1 Transaction Search の設定

<details>
<summary>🖱️ <strong>画面操作版</strong> - CloudWatch Console（推奨）</summary>

1. **CloudWatch Console にアクセス**
   - [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/) を開く
   - リージョンが「**Asia Pacific (Tokyo) ap-northeast-1**」になっていることを確認
   - **💡 新しいUI**: 2025年の視覚的アップデートが適用済み（より読みやすく、モダンなデザイン）

2. **Transaction Search の有効化**
   - 左メニューから「**Application Signals（アプリケーションシグナル）**」→「**Transaction Search（トランザクション検索）**」を選択
   - 「**Enable Transaction Search（Transaction Searchを有効化）**」をクリック

3. **設定の調整**
   - ✅ **Ingest spans as structured logs（スパンを構造化ログとして取り込む）** をチェック
   - **Percentage of spans to index（インデックス化するスパンの割合）** を設定:
     - 開発環境: `100%`（全てのトレースを記録）
     - 本番環境: `1%`（無料枠、通常は十分）
     - 高負荷環境: `5-10%`（詳細分析が必要な場合）
   
   **💰 2025年料金情報**: 1%のスパンインデックス化は無料で利用可能

4. **有効化の完了**
   - 「**Enable（有効化）**」をクリック
   - ⏱️ **重要**: 設定完了まで約10分待機が必要です
   - **Visual Editor（ビジュアルエディター）** が利用可能になります

**メリット:** 設定内容を視覚的に確認でき、コスト影響も理解しやすい
</details>

<details>
<summary>💻 <strong>コマンドライン版</strong> - AWS CLI</summary>

```bash
# CloudWatch Logs リソースポリシーの作成
aws logs put-resource-policy \
  --policy-name TransactionSearchXRayAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "TransactionSearchXRayAccess",
      "Effect": "Allow", 
      "Principal": {"Service": "xray.amazonaws.com"},
      "Action": "logs:PutLogEvents",
      "Resource": [
        "arn:aws:logs:ap-northeast-1:*:log-group:/aws/spans:*",
        "arn:aws:logs:ap-northeast-1:*:log-group:/aws/application-signals/data:*"
      ]
    }]
  }'

# X-Ray トレースセグメントの送信先設定
aws xray update-trace-segment-destination \
  --destination CloudWatchLogs \
  --region ap-northeast-1

# インデックス化ルールの設定（開発環境: 100%）
aws xray update-indexing-rule \
  --name "Default" \
  --rule '{"Probabilistic": {"DesiredSamplingPercentage": 100}}' \
  --region ap-northeast-1
```

**メリット:** 自動化可能、設定の再現性が高い
</details>

---

## 🔧 Step 4: 依存関係のインストール

### 4.1 観測可能性パッケージのインストール

<details>
<summary>💻 <strong>コマンドライン版</strong> - npm/yarn</summary>

```bash
# 依存関係のインストール
npm install

# または yarn を使用する場合
yarn install

# インストール確認
npm list @opentelemetry/api @aws-sdk/client-cloudwatch aws-xray-sdk-core
```

**メリット:** 高速、バッチ処理可能
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - VS Code統合ターミナル</summary>

1. **VS Code でプロジェクトを開く**
   - VS Code を起動
   - 「File」→「Open Folder」でプロジェクトフォルダを選択

2. **統合ターミナルを開く**
   - 「Terminal」→「New Terminal」をクリック
   - または `Ctrl+Shift+`` (バッククォート) を押下

3. **依存関係のインストール**
   - ターミナルに `npm install` と入力してEnter
   - インストール進行状況を視覚的に確認

4. **インストール完了の確認**
   - `node_modules` フォルダが作成されていることを確認
   - `package-lock.json` が更新されていることを確認

**メリット:** 進行状況が見える、エラー時の対処が分かりやすい
</details>

---

## ⚙️ Step 5: 環境変数の設定

### 5.1 観測可能性設定の追加

<details>
<summary>💻 <strong>コマンドライン版</strong> - 自動設定</summary>

```bash
# 観測可能性設定テンプレートをメインファイルに追加
cat .env.local.observability.template >> .env.local

# 重複行の削除（必要に応じて）
sort .env.local | uniq > .env.local.tmp && mv .env.local.tmp .env.local

# 設定内容の確認
grep -E "^(OBSERVABILITY|OTEL|XRAY|CLOUDWATCH)" .env.local
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 手動編集</summary>

1. **設定テンプレートを開く**
   - VS Code で `.env.local.observability.template` を開く
   - 内容を全選択してコピー（Ctrl+A → Ctrl+C）

2. **メイン設定ファイルに追加**
   - `.env.local` ファイルを開く（存在しない場合は新規作成）
   - ファイルの末尾に移動
   - コピーした内容を貼り付け（Ctrl+V）

3. **必要な値を設定**
   ```env
   # AWS基本設定
   AWS_REGION=ap-northeast-1
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   
   # 観測可能性設定
   OBSERVABILITY_ENABLED=true
   OTEL_ENABLED=true
   XRAY_ENABLED=true
   CLOUDWATCH_ENABLED=true
   ```

4. **ファイルを保存**
   - Ctrl+S で保存

**メリット:** 各設定項目の意味を理解しながら設定可能
</details>

---

## 🏗️ Step 6: AgentCore Runtime実行環境の構築

### 6.1 IAM実行ロールの作成

<details>
<summary>💻 <strong>コマンドライン版</strong> - AWS CLI</summary>

```bash
# アカウントIDの取得
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 信頼ポリシーファイルの作成
cat > agentcore-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AssumeRolePolicy",
    "Effect": "Allow",
    "Principal": {"Service": "bedrock-agentcore.amazonaws.com"},
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": {"aws:SourceAccount": "$AWS_ACCOUNT_ID"},
      "ArnLike": {"aws:SourceArn": "arn:aws:bedrock-agentcore:ap-northeast-1:$AWS_ACCOUNT_ID:*"}
    }
  }]
}
EOF

# IAMロールの作成
aws iam create-role \
  --role-name MAGIAgentCoreExecutionRole \
  --assume-role-policy-document file://agentcore-trust-policy.json

# 実行ポリシーのアタッチ
aws iam attach-role-policy \
  --role-name MAGIAgentCoreExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonBedrockAgentCoreExecutionRolePolicy
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - IAM Console</summary>

1. **IAM Console にアクセス**
   - [IAM Console](https://console.aws.amazon.com/iam/) を開く
   - 左メニューから「Roles（ロール）」を選択

2. **新しいロールの作成**
   - 「Create role（ロールを作成）」をクリック
   - **Trusted entity type（信頼されたエンティティタイプ）**: `AWS service`
   - **Use case（ユースケース）**: `Other AWS services` を選択
   - 「Next（次へ）」をクリック

3. **権限ポリシーの選択**
   - 検索ボックスに「BedrockAgentCore」と入力
   - ✅ `AmazonBedrockAgentCoreExecutionRolePolicy` をチェック
   - 「Next（次へ）」をクリック

4. **ロール詳細の設定**
   - **Role name（ロール名）**: `MAGIAgentCoreExecutionRole`
   - **Description（説明）**: `Execution role for MAGI AgentCore runtime`
   - 「Create role（ロールを作成）」をクリック

5. **信頼関係の編集**
   - 作成したロールをクリック
   - 「Trust relationships（信頼関係）」タブを選択
   - 「Edit trust policy（信頼ポリシーを編集）」をクリック
   - 以下のJSONに置き換え（YOUR_ACCOUNT_IDを実際のアカウントIDに変更）:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": {"Service": "bedrock-agentcore.amazonaws.com"},
       "Action": "sts:AssumeRole",
       "Condition": {
         "StringEquals": {"aws:SourceAccount": "YOUR_ACCOUNT_ID"},
         "ArnLike": {"aws:SourceArn": "arn:aws:bedrock-agentcore:ap-northeast-1:YOUR_ACCOUNT_ID:*"}
       }
     }]
   }
   ```

**メリット:** 設定内容を視覚的に確認でき、間違いを防げる
</details>

---

## ✅ Step 7: 動作確認

### 7.1 観測可能性機能のテスト

<details>
<summary>💻 <strong>コマンドライン版</strong> - 開発サーバー起動</summary>

```bash
# 開発サーバーの起動
npm run dev

# 別のターミナルで健全性チェック
curl http://localhost:3000/api/health/observability

# 正常な場合の出力例:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "components": {
#     "otel": {"status": "up"},
#     "cloudwatch": {"status": "up"},
#     "xray": {"status": "up"}
#   }
# }
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - ブラウザ確認</summary>

1. **開発サーバーの起動**
   - VS Code統合ターミナルで `npm run dev` を実行
   - 「Local: http://localhost:3000」が表示されることを確認

2. **健全性チェック**
   - ブラウザで `http://localhost:3000/api/health/observability` にアクセス
   - JSON形式のレスポンスが表示されることを確認

3. **メインアプリケーションの確認**
   - ブラウザで `http://localhost:3000` にアクセス
   - MAGIシステムのUIが正常に表示されることを確認

**メリット:** 視覚的に動作確認でき、問題箇所を特定しやすい
</details>

### 7.2 AWS Console での確認

<details>
<summary>🖱️ <strong>画面操作版</strong> - 各サービスの確認</summary>

1. **CloudWatch メトリクスの確認**
   - [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/) → Metrics
   - 「Browse」タブで「MAGI/DecisionUI」名前空間を確認
   - カスタムメトリクスが表示されることを確認

2. **CloudWatch ログの確認**
   - CloudWatch Console → Logs → Log groups
   - `/aws/magi-decision-ui` ログループが作成されていることを確認

3. **X-Ray トレースの確認**
   - [X-Ray Console](https://console.aws.amazon.com/xray/) → Service map
   - サービスマップにアプリケーションが表示されることを確認

**メリット:** AWS環境での実際の動作を確認できる
</details>

---

## 🚨 トラブルシューティング

### よくある問題と解決方法

<details>
<summary>❌ <strong>「Access Denied」エラー</strong></summary>

**症状**: Bedrock AgentCore APIへのアクセスが拒否される

**解決方法**:
1. **IAM権限の確認**
   ```bash
   aws iam list-attached-user-policies --user-name YOUR_USERNAME
   ```
   - `AmazonBedrockFullAccess` と `BedrockAgentCoreFullAccess` が含まれているか確認

2. **リージョンの確認**
   - 環境変数 `AWS_REGION=ap-northeast-1` が設定されているか確認
   - Bedrock Consoleで同じリージョンが選択されているか確認

3. **モデルアクセス権限の確認**
   - Bedrock Console → Model access で必要なモデルが有効化されているか確認
</details>

<details>
<summary>❌ <strong>OpenTelemetry初期化エラー</strong></summary>

**症状**: OTEL関連のエラーが発生する

**解決方法**:
1. **依存関係の再インストール**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **環境変数の確認**
   ```bash
   grep -E "^(OTEL|OBSERVABILITY)" .env.local
   ```

3. **Node.jsバージョンの確認**
   ```bash
   node --version  # v18.0.0以上が必要
   ```
</details>

<details>
<summary>❌ <strong>CloudWatch Transaction Search が動作しない</strong></summary>

**症状**: トレースがCloudWatchに表示されない

**解決方法**:
1. **Transaction Searchの有効化確認**
   - CloudWatch Console → Application Signals → Transaction Search
   - 「Enabled」状態になっているか確認

2. **サンプリング率の確認**
   ```bash
   aws xray get-indexing-rules --region ap-northeast-1
   ```

3. **時間の確認**
   - Transaction Search有効化後、10分程度待ってから再確認
</details>

---

## 📋 完了チェックリスト

### 必須項目
- [ ] IAM権限（AmazonBedrockFullAccess + BedrockAgentCoreFullAccess）が設定済み
- [ ] Bedrockモデルアクセス権限が有効化済み
- [ ] CloudWatch Transaction Searchが有効化済み
- [ ] 観測可能性パッケージがインストール済み
- [ ] 環境変数が設定済み
- [ ] AgentCore実行ロールが作成済み
- [ ] 健全性チェックが正常に動作

### 確認項目
- [ ] `http://localhost:3000/api/health/observability` が正常なレスポンスを返す
- [ ] CloudWatch Metricsで「MAGI/DecisionUI」名前空間が確認できる
- [ ] CloudWatch Logsで `/aws/magi-decision-ui` ログループが確認できる
- [ ] X-Ray Service mapでアプリケーションが表示される

### セキュリティ確認
- [ ] `.env.local` ファイルが `.gitignore` に含まれている
- [ ] 不要なアクセスキーが削除されている
- [ ] MFA（多要素認証）が有効化されている

---

## 📚 参考資料

- [Amazon Bedrock AgentCore Developer Guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/)
- [AWS X-Ray Developer Guide](https://docs.aws.amazon.com/xray/latest/devguide/)
- [Amazon CloudWatch User Guide](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)

---

## 🆘 サポート

問題が解決しない場合は、以下の情報を含めてサポートに連絡してください：

1. エラーメッセージの全文
2. 環境変数の設定（機密情報は除く）
3. AWS CLIの出力結果
4. ブラウザの開発者ツールのログ

```bash
# デバッグ情報の収集
echo "=== AWS Identity ===" > debug-info.txt
aws sts get-caller-identity >> debug-info.txt 2>&1

echo "=== Bedrock Models ===" >> debug-info.txt  
aws bedrock list-foundation-models --region ap-northeast-1 >> debug-info.txt 2>&1

echo "=== Environment Variables ===" >> debug-info.txt
grep -E "^(AWS_|NEXT_PUBLIC_|OBSERVABILITY)" .env.local >> debug-info.txt 2>&1
```