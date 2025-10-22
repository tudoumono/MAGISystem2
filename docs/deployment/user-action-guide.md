# MAGI Decision System - ユーザーアクション手順書

## 📋 概要

Task 2.2 完了後、実際のAWSリソースをデプロイし、アプリケーションを動作させるための手順書です。

**🎯 このドキュメントの特徴:**
- 各操作について **コマンドライン** と **画面操作** の両方を併記
- 初心者は画面操作、上級者はコマンドラインを選択可能
- 両方の方法の関係性と背景を理解できる構成

**✨ 重要:** このガイドは **画面操作のみでも完全に実施可能** です。AWS CLI のインストールや複雑なコマンド操作なしで、ブラウザだけで全ての設定を完了できます。

## 🔄 操作方法の選び方

| 項目 | コマンドライン | 画面操作 |
|------|---------------|----------|
| **速度** | ⚡ 高速 | 🐌 やや時間がかかる |
| **学習コスト** | 📚 高い | 👶 低い |
| **自動化** | ✅ 可能 | ❌ 困難 |
| **視覚的理解** | ❌ 抽象的 | ✅ 直感的 |
| **エラー対応** | 🔧 ログ解析必要 | 👀 画面で確認しやすい |
| **推奨レベル** | 中級者以上 | 初心者〜中級者 |

## 🚨 重要: CDKブートストラップについて

### CDKブートストラップとは
AWS CDKを使用する前に、AWS環境を準備する**一回限りの**プロセスです。以下のリソースを作成します：
- IAMロール（deploy-role、file-publishing-role等）
- S3バケット（CDKアセット保管用）
- ECRリポジトリ（Dockerイメージ用）
- KMSキー、SSMパラメータ

### 🔐 必要な権限レベル
- **ブートストラップ実行**: `AdministratorAccess` または同等の強い権限
- **通常のデプロイ**: `PowerUserAccess` + `AmplifyBackendDeployFullAccess`

### 📋 推奨実行フロー
1. **管理者がブートストラップを実行** （一回のみ）
2. **開発者が通常権限でデプロイ** （継続的）

---

## 🚀 Step 1: AWS認証情報の設定

> **⚠️ 重要なセキュリティ情報**  
> AWS は2023年以降、長期的なアクセスキーの使用を**非推奨**としています。  
> 以下の推奨方法を使用してください：

**🏆 推奨度順:**
1. **AWS IAM Identity Center (SSO)** - 最も安全
2. **AWS CLI v2 + 一時的認証情報** - 開発者向け推奨
3. **短期アクセスキー（30日以内）** - 短期プロジェクト用
4. ~~長期アクセスキー~~ - **非推奨・セキュリティリスク**

### 1.1 AWS CLI v2 のインストール

> **💡 重要な選択肢**  
> **画面操作のみで進める場合、このステップは不要です。**  
> Step 1.2 の「画面操作版」のみを使用すれば、AWS CLI なしで全ての設定が可能です。

<details>
<summary>💻 <strong>コマンドライン版</strong> - 高速インストール</summary>

```bash
# Windows (PowerShell)
winget install Amazon.AWSCLI

# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# バージョン確認（v2.x.x であることを確認）
aws --version
```

**メリット:** 一行で完了、スクリプト化可能、最新のセキュリティ機能対応
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 視覚的で安全</summary>

1. **Windows:**
   - [AWS CLI v2 インストーラー](https://awscli.amazonaws.com/AWSCLIV2.msi) をダウンロード
   - ダウンロードした `.msi` ファイルをダブルクリック
   - インストールウィザードに従って進む

2. **macOS:**
   - [AWS CLI v2 インストーラー](https://awscli.amazonaws.com/AWSCLIV2.pkg) をダウンロード
   - ダウンロードした `.pkg` ファイルをダブルクリック
   - インストールウィザードに従って進む

3. **Linux:**
   - ブラウザで [AWS CLI ダウンロードページ](https://aws.amazon.com/cli/) にアクセス
   - 「Download and install」セクションからLinux版をダウンロード
   - ファイルマネージャーで解凍してインストール

**確認:** コマンドプロンプトで `aws --version` を実行し、v2.x.x が表示されることを確認

**メリット:** 進行状況が見える、エラー時の対処が分かりやすい、最新セキュリティ対応
</details>

---

### 1.2 安全な認証設定

<details>
<summary>🏆 <strong>推奨方法 A: IAM Identity Center (SSO)</strong> - 最も安全</summary>

#### **Step 1.2.1: IAM Identity Center の設定**

**画面操作での設定:**
1. [AWS Console](https://console.aws.amazon.com/) にルートユーザーでログイン
2. 「IAM Identity Center」を検索してアクセス
3. 「Enable」をクリックしてサービスを有効化
4. **Users（ユーザー）** → 「Add user（ユーザーを追加）」で開発用ユーザーを作成:
   - Username（ユーザー名）: `magi-developer`
   - Email（メールアドレス）: あなたのメールアドレス
   - First name / Last name（姓名）: 適切に入力
5. **Permission sets（アクセス許可セット）** → 「Create permission set（アクセス許可セットを作成）」:
   - Type（タイプ）: `Predefined permission set（事前定義されたアクセス許可セット）`
   - Policy（ポリシー）: `PowerUserAccess` (必須 - IAM管理以外の全操作)
   - **追加で必要**: `AmplifyBackendDeployFullAccess` (必須 - Amplifyデプロイ専用)
   
   **複数ポリシーの追加方法:**
   - 「Create permission set」で最初に `PowerUserAccess` を選択
   - 作成後、Permission set を編集して `AmplifyBackendDeployFullAccess` を追加
   - ⚠️ **AdministratorAccess は避ける** (セキュリティリスク)
   - Name（名前）: `MAGIDeveloperAccess`
6. **AWS accounts（AWSアカウント）** → アカウントを選択 → ユーザーと権限セットを割り当て

#### **Step 1.2.2: CLI での SSO 設定**

```bash
# SSO セッションの設定
aws configure sso

# 入力項目:
# SSO session name: magi-dev
# SSO start URL: https://[your-sso-domain].awsapps.com/start
# SSO region: ap-northeast-1
# SSO registration scopes: sso:account:access

# プロファイル設定
# CLI default client Region: ap-northeast-1
# CLI default output format: json
# CLI profile name: magi-dev
```

#### **Step 1.2.3: SSO ログイン**

```bash
# SSO ログイン
aws sso login --profile magi-dev

# 認証確認
aws sts get-caller-identity --profile magi-dev
```

**メリット:** 
- ✅ 最高レベルのセキュリティ
- ✅ 一時的な認証情報の自動更新
- ✅ 中央集権的なアクセス管理
- ✅ 監査ログの自動記録
</details>

<details>
<summary>🥈 <strong>推奨方法 B: 短期アクセスキー</strong> - 短期プロジェクト用</summary>

#### **Step 1.2.1: IAM ユーザーの作成（一時的）**

**画面操作での設定:**
1. [IAM Console](https://console.aws.amazon.com/iam/) にアクセス
2. **Users（ユーザー）** → 「Create user（ユーザーを作成）」:
   - User name（ユーザー名）: `magi-temp-developer`
   - ✅ 「Provide user access to the AWS Management Console（AWS Management Consoleへのユーザーアクセスを提供する）」をチェック
   - Console password（コンソールパスワード）: 「Custom password（カスタムパスワード）」で強力なパスワードを設定
   - ❌ 「Users must create a new password at next sign-in（次回サインイン時にユーザーは新しいパスワードを作成する必要があります）」のチェックを外す

3. **Permissions（アクセス許可）** → 「Attach policies directly（ポリシーを直接アタッチ）」:
   - ✅ `PowerUserAccess` (必須 - 基本開発権限)
   - ✅ `AmplifyBackendDeployFullAccess` (必須 - Amplifyデプロイ専用)
   - ⚠️ **AdministratorAccess は避ける** (セキュリティリスク)

4. **Review and create（確認して作成）** → 「Create user（ユーザーを作成）」

#### **Step 1.2.2.1: 追加権限の設定（重要）**

**🚨 重要**: Amplify Gen2の初期化には `AmplifyBackendDeployFullAccess` では不十分です。

**なぜ AmplifyBackendDeployFullAccess では不十分？**
- `npx ampx sandbox deploy` は内部でCDKを使用
- CDKが自動的にbootstrapを実行しようとする
- このポリシーは**既にbootstrap済み**の環境で既存CDKロールを使う権限のみ
- `sts:AssumeRole` - 既存CDKロールの引き受けのみ可能
- `iam:CreateRole` - IAMロール作成権限が**含まれていない**
- **Amplify初期化時にCDKブートストラップが自動実行される**

**Amplify初期化時に自動作成されるリソース:**
- **CDKToolkitスタック** - CloudFormationスタック
- **IAMロール** - deploy-role、file-publishing-role、image-publishing-role等
- **S3バケット** - CDKアセット保管用
- **ECRリポジトリ** - Dockerイメージ用  
- **KMSキー** - 暗号化用
- **SSMパラメータ** - バージョン情報用
- **Amplifyアプリリソース** - Cognito、AppSync、DynamoDB等

**解決策（推奨順）:**

**🥇 方法1: 管理者権限でAmplify初期化（最も推奨）**
1. 管理者権限を持つユーザーで `npx ampx sandbox deploy` を実行
2. 初期化完了後は `magi-developer` が `AmplifyBackendDeployFullAccess` でデプロイ可能
3. **理由**: Amplify初期化時にCDKブートストラップが自動実行されるため

**🥈 方法2: 管理者に依頼（組織ポリシー準拠）**
1. 管理者にAmplify初期化（`npx ampx sandbox deploy`）を依頼
2. 初期化完了後、開発者は通常権限でデプロイ可能
3. **メリット**: 開発者にCreateRole権限を付与する必要なし

**🥉 方法3: 一時的にAmplify初期化権限を付与**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:GetRole", 
        "iam:PutRolePolicy",
        "iam:AttachRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "s3:CreateBucket",
        "ecr:CreateRepository",
        "kms:CreateKey",
        "ssm:PutParameter",
        "cloudformation:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**最終的な権限構成（bootstrap後）:**
- ✅ `PowerUserAccess` - 基本開発権限（IAM管理以外の全操作）
- ✅ `AmplifyBackendDeployFullAccess` - Amplifyデプロイ専用（既存CDKロール使用）

#### **Step 1.2.2: 短期アクセスキーの作成**

1. 作成したユーザー `magi-temp-developer` をクリック
2. **Security credentials（セキュリティ認証情報）** タブ → 「Create access key（アクセスキーを作成）」
3. **Use case（ユースケース）** → 「Command Line Interface (CLI)」を選択
4. ⚠️ 「I understand the above recommendation...（上記の推奨事項を理解しています...）」をチェック
5. **Description tag（説明タグ）** → 「MAGI Development - 30 days only」
6. 「Create access key（アクセスキーを作成）」をクリック
7. **重要:** Access key と Secret key をすぐにコピーして安全に保存

#### **Step 1.2.3: CLI 設定**

```bash
# 一時的なプロファイルの設定
aws configure --profile magi-temp

# 入力項目:
# AWS Access Key ID: [上記で作成したアクセスキー]
# AWS Secret Access Key: [上記で作成したシークレットキー]
# Default region name: ap-northeast-1
# Default output format: json
```

#### **Step 1.2.4: セキュリティ設定**

```bash
# 認証確認
aws sts get-caller-identity --profile magi-temp

# ⚠️ 重要: カレンダーに30日後のリマインダーを設定
# プロジェクト完了後は必ずアクセスキーを削除
```

**⚠️ セキュリティ注意事項:**
- アクセスキーは絶対にGitにコミットしない
- 30日以内にプロジェクト完了またはキー削除
- 定期的にアクセスキーをローテーション
- 最小権限の原則を適用

**メリット:** 
- ✅ 設定が簡単
- ✅ 短期プロジェクトに適している
- ⚠️ 手動でのセキュリティ管理が必要
</details>

<details>
<summary>❌ <strong>非推奨方法: 長期アクセスキー</strong> - セキュリティリスク</summary>

**なぜ非推奨なのか:**
- 🚨 **セキュリティリスク:** 長期間有効な認証情報
- 🚨 **漏洩リスク:** コードリポジトリへの誤コミット
- 🚨 **管理困難:** 手動でのローテーションが必要
- 🚨 **監査困難:** アクセス履歴の追跡が困難

**AWS の推奨事項:**
> "We recommend that you don't generate long-term access keys for your AWS account root user or IAM users. Instead, create IAM roles and generate temporary security credentials."

**代替案:** 上記の推奨方法 A または B を使用してください。
</details>

---

### 1.3 認証確認

<details>
<summary>💻 <strong>コマンドライン版</strong> - プロファイル指定確認</summary>

```bash
# SSO プロファイルの場合
aws sts get-caller-identity --profile magi-dev

# 短期アクセスキープロファイルの場合  
aws sts get-caller-identity --profile magi-temp

# 正常な場合の出力例:
# {
#     "UserId": "AIDACKCEVSQ6C2EXAMPLE", 
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/magi-developer"
# }

# デフォルトプロファイルの設定
export AWS_PROFILE=magi-dev  # Linux/macOS
set AWS_PROFILE=magi-dev     # Windows
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - Console確認</summary>

1. **AWS Console での確認:**
   - [AWS Console](https://console.aws.amazon.com/) にアクセス
   - 右上のユーザー名をクリック
   - 「Security credentials（セキュリティ認証情報）」を選択
   - ページが正常に表示されれば認証成功

2. **設定内容の確認:**
   - ✅ 右上に **Account ID（アカウントID）** が表示されている
   - ✅ 右上のリージョン表示が「**Asia Pacific (Tokyo) ap-northeast-1**」になっている
   - ✅ エラーメッセージや「Access Denied（アクセス拒否）」が表示されない
   - ✅ ユーザー名が `magi-developer` または `magi-temp-developer` になっている

3. **セキュリティ確認:**
   - **Access keys（アクセスキー）** セクションで不要なアクセスキーがないことを確認
   - **MFA devices（MFAデバイス）** で多要素認証が設定されていることを確認（推奨）

3. **追加確認（オプション）:**
   - 左上の「Services」をクリック
   - 「IAM」を検索して選択
   - IAM ダッシュボードが表示されれば権限も正常

**✅ 成功の確認ポイント:**
- AWS Console にログインできる
- アカウント情報が正しく表示される
- 各種AWSサービスにアクセスできる
- 選択した認証方法が正常に動作している

**❌ 問題がある場合:**
- 「Invalid credentials」エラー → 認証設定を再確認
- 「Access Denied」エラー → IAM権限を確認
- SSO ログインエラー → SSO設定を確認

**ビルドエラーの対処:**
1. **Build history** で失敗したビルドを確認
2. **Build logs** で具体的なエラーメッセージを確認
3. **上記のトラブルシューティングセクション** を参照して対処
4. **Build settings** で設定を調整後、再デプロイ

**メリット:** 
- 視覚的に確認でき、問題箇所を特定しやすい
- AWS Console の使い方も同時に学習できる
- 設定ファイルの内容を直接確認できる
</details>

---

### 1.4 セキュリティベストプラクティス

## 🎯 実行すべきアクション

### ✅ 必須設定（すぐに実行）

1. **権限設定の確認**
   - 前のステップで `PowerUserAccess` + `AmplifyBackendDeployFullAccess` を選択した場合 → そのまま進む
   - より安全にしたい場合 → 下記のカスタムポリシーに変更

2. **MFA（多要素認証）の有効化**
   - IAM Console → Users（ユーザー） → あなたのユーザー → Security credentials（セキュリティ認証情報）
   - 「Assign MFA device（MFAデバイスを割り当て）」をクリック
   - 「Virtual MFA device（仮想MFAデバイス）」を選択
   - Google Authenticator アプリでQRコードをスキャン

3. **`.gitignore` ファイルの設定**
   - プロジェクトルートに `.gitignore` ファイルを作成
   - 以下の内容を追加:
   ```gitignore
   # AWS認証情報（重要！）
   .aws/
   .env.local
   .env.*.local
   amplify_outputs.json
   
   # 一時ファイル
   *.pem
   *.key
   ```

### 🔒 推奨権限設定

**🥇 最も安全（推奨）: MAGIプロジェクト専用ポリシー**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MAGIAmplifyDevelopment",
      "Effect": "Allow",
      "Action": [
        "amplify:*",
        "cognito-idp:*",
        "appsync:*",
        "dynamodb:*",
        "lambda:*",
        "logs:*",
        "cloudformation:*",
        "s3:*",
        "iam:GetRole",
        "iam:PassRole",
        "sts:AssumeRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "MAGIBedrockAgents",
      "Effect": "Allow",
      "Action": [
        "bedrock:*",
        "bedrock-agentcore:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "MAGIMonitoring",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:*",
        "xray:*",
        "application-signals:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "MAGIDomainManagement",
      "Effect": "Allow",
      "Action": [
        "route53:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**🥈 簡単設定: PowerUserAccess + AmplifyBackendDeployFullAccess（前のステップで選択済み）**
- PowerUserAccess: IAM管理以外の全操作が可能
- AmplifyBackendDeployFullAccess: Amplifyデプロイ専用（既存CDKロール使用）
- **注意**: CDKブートストラップは管理者権限で別途実行が必要

**❌ 絶対に避ける: AdministratorAccess**
- 全権限でセキュリティリスク大

### 📅 完了チェックリスト

**今すぐ確認:**
- [ ] MFA が有効化されている
- [ ] `.gitignore` ファイルが作成されている
- [ ] 権限が `PowerUserAccess` + `AmplifyBackendDeployFullAccess` または カスタムポリシー
- [ ] `AdministratorAccess` を使用していない

**30日後に確認:**
- [ ] アクセスキーをローテーション（短期アクセスキー使用の場合）
- [ ] 不要なリソースを削除
- [ ] CloudTrail ログを確認

### 📅 今後のフェーズで追加予定の権限

**Phase 3: エージェント統合時に追加:**
- [ ] `AmazonBedrockFullAccess` - AI/MLモデルアクセス用
- [ ] `BedrockAgentCoreFullAccess` - エージェント実行基盤用
- [ ] `AWSLambdaFullAccess` - エージェント関数のデプロイ・管理用

**Phase 4: 本番環境構築時に追加:**
- [ ] `CloudWatchFullAccess` - ログ・監視・アラート設定用
- [ ] `AmazonRoute53FullAccess` - カスタムドメイン設定用（オプション）

**権限追加の手順:**
1. IAM Console → Users → `magi-developer` → Permissions
2. 「Add permissions」→「Attach policies directly」
3. 必要なポリシーを検索・選択
4. 「Add permissions」で追加

**各権限の詳細:**

**🤖 AmazonBedrockFullAccess**
- Amazon Bedrockの全機能へのアクセス
- Claude、GPT等のLLMモデル呼び出し
- モデル推論とファインチューニング
- エージェント作成と管理

**🔧 BedrockAgentCoreFullAccess**  
- Amazon Bedrock AgentCoreの全機能
- エージェント実行環境の管理
- A2A（Agent-to-Agent）プロトコル
- 分散トレーシングとObservability

**⚡ AWSLambdaFullAccess**
- Lambda関数の作成・更新・削除
- 関数のデプロイとバージョン管理
- トリガーとイベントソースの設定
- VPC設定とネットワーク管理

**📊 CloudWatchFullAccess**
- ログ・メトリクス・アラームの管理
- ダッシュボード作成と監視設定
- X-Ray分散トレーシング
- Application Insights

**🌐 AmazonRoute53FullAccess**
- DNS管理とドメイン設定
- ヘルスチェックと監視
- トラフィックルーティング
- カスタムドメイン設定

### 🔒 セキュリティ考慮事項

**各権限の安全性評価:**

| 権限 | 安全性レベル | 理由 | 注意点 |
|------|-------------|------|--------|
| `PowerUserAccess` | ✅ 安全 | IAM管理を除く全操作（AWS公式推奨） | IAMユーザー作成不可 |
| `AmplifyBackendDeployFullAccess` | ✅ 安全 | Amplify専用（AWS公式・用途限定） | CDK操作のみ |
| `AmazonBedrockFullAccess` | ✅ 安全 | AI/ML専用（用途限定） | モデル呼び出し料金に注意 |
| `BedrockAgentCoreFullAccess` | ✅ 安全 | エージェント実行専用 | 実行時間制限推奨 |
| `AWSLambdaFullAccess` | ⚠️ 注意 | サーバーレス専用だが影響範囲広い | 関数数・実行時間制限推奨 |
| `CloudWatchFullAccess` | ⚠️ 注意 | 監視専用だが設定変更可能 | アラーム設定の誤操作注意 |
| `AmazonRoute53FullAccess` | ⚠️ 注意 | DNS管理（影響範囲限定だが重要） | 本番ドメイン操作注意 |

**AdministratorAccess を避ける理由:**
- 🚨 全AWSサービスへの無制限アクセス
- 🚨 請求・アカウント設定の変更可能
- 🚨 セキュリティ設定の変更可能
- 🚨 他のユーザー・ロールの管理可能
- 🚨 リソース削除による重大な影響

**推奨セキュリティ設定:**
1. **MFA（多要素認証）の有効化** - 必須
2. **アクセスキーの定期ローテーション** - 30日以内
3. **CloudTrail監査ログの有効化** - 全操作記録
4. **請求アラートの設定** - 予期しない課金の検知
5. **リソースタグの統一** - `Project:MAGI`, `Environment:Dev`

---

## 🔧 Step 1.5: Amplify初期化の実行

> **⚠️ 重要**  
> このステップは**管理者権限**が必要です。開発者権限（PowerUserAccess + AmplifyBackendDeployFullAccess）では実行できません。  
> `npx ampx sandbox deploy` 実行時にCDKブートストラップが自動実行されるためです。

### 1.5.1 Amplify初期化の実行方法

<details>
<summary>🏆 <strong>推奨方法: 管理者による実行</strong></summary>

**管理者が実行する場合:**
1. 管理者権限を持つユーザーでAWSにログイン
2. プロジェクトディレクトリで以下のコマンドを実行:
```bash
# Amplify CLI のインストール（未インストールの場合）
npm install -g @aws-amplify/cli-internal

# Amplify初期化（CDKブートストラップも自動実行）
npx ampx sandbox deploy

# または段階的に実行
cdk bootstrap aws://[ACCOUNT-ID]/ap-northeast-1  # 手動bootstrap
npx ampx sandbox deploy                           # Amplify初期化
```

**実行後の確認:**
- CloudFormationコンソールで `CDKToolkit` スタックが作成されていることを確認
- CloudFormationコンソールで `amplify-*` スタックが作成されていることを確認
- S3コンソールで CDKアセットバケットが作成されていることを確認

</details>

<details>
<summary>🔧 <strong>開発者が実行する場合: 一時的権限付与</strong></summary>

**組織ポリシーで管理者実行ができない場合:**

1. **一時的にCDKブートストラップ権限を付与:**
   - IAM Console → Users → `magi-developer` → Permissions
   - 「Add permissions」→「Attach policies directly」
   - 以下のカスタムポリシーを作成・アタッチ:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CDKBootstrapPermissions",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:GetRole",
        "iam:PutRolePolicy", 
        "iam:AttachRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:DetachRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:DeleteRole",
        "s3:*",
        "ecr:*",
        "kms:*",
        "ssm:*",
        "cloudformation:*"
      ],
      "Resource": "*"
    }
  ]
}
```

2. **Amplify初期化を実行:**
```bash
npx ampx sandbox deploy
```

3. **⚠️ 重要: 初期化完了後、上記の強い権限を削除**
   - セキュリティのため、ブートストラップ専用権限は即座に削除
   - 通常の開発権限（PowerUserAccess + AmplifyBackendDeployFullAccess）のみ残す

</details>

<details>
<summary>❌ <strong>トラブルシューティング</strong></summary>

**よくあるエラーと解決方法:**

1. **`iam:CreateRole` エラー**
   ```
   User is not authorized to perform: iam:CreateRole
   ```
   - **原因**: IAMロール作成権限が不足
   - **解決**: 管理者権限でブートストラップを実行

2. **`s3:CreateBucket` エラー**
   ```
   Access Denied when calling CreateBucket
   ```
   - **原因**: S3バケット作成権限が不足
   - **解決**: 上記のCDKブートストラップ権限を付与

3. **既にブートストラップ済みの場合**
   ```
   CDKToolkit stack already exists
   ```
   - **対処**: 正常な状態です。このステップをスキップして次に進む

</details>

### 1.5.2 Amplify初期化完了の確認

**確認項目:**
- [ ] CloudFormationで `CDKToolkit` スタックが `CREATE_COMPLETE` 状態
- [ ] CloudFormationで `amplify-*` スタックが `CREATE_COMPLETE` 状態
- [ ] S3で CDKアセットバケットが作成済み
- [ ] IAMで CDK実行ロールが作成済み
- [ ] Cognitoユーザープールが作成済み
- [ ] AppSync GraphQL APIが作成済み
- [ ] DynamoDBテーブルが作成済み
- [ ] 一時的な強い権限を削除済み（開発者が実行した場合）

---

## 🚨 トラブルシューティング: Amplifyビルドエラー

### よくあるビルドエラーと解決方法

<details>
<summary>❌ <strong>Build failed with exit code 1</strong></summary>

**エラーの特徴:**
```
Build failed
!!! Error: Command failed with exit code 1
```

**主な原因と解決方法:**

**1. メモリ不足エラー**
```bash
# Node.jsヒープメモリ不足の場合
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**解決方法:**
- Amplify Console → App Settings → Build settings
- Environment variables に追加:
  - `NODE_OPTIONS`: `--max-old-space-size=4096`
- または Build instance を Large/XLarge にアップグレード

**2. Node.jsバージョンエラー**
```bash
NODE.JS VERSION NOT SUPPORTED
Your application uses Node.js v18.x.x, which is no longer supported
```

**解決方法:**
- `package.json` に Node.js 20+ を指定:
```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**3. Next.js Edge API Routes エラー**
```bash
Edge API routes are not supported
```

**解決方法:**
- Edge API Routes を通常のAPI Routes に変更
- `export const runtime = 'edge'` を削除

**4. ビルド出力サイズ超過**
```bash
Build output exceeds maximum allowed size (220MB)
```

**解決方法:**
- `amplify.yml` に不要ファイル削除を追加:
```yaml
frontend:
  phases:
    build:
      commands:
        - npm run build
        - rm -f node_modules/@swc/core-linux-x64-gnu/swc.linux-x64-gnu.node
        - rm -f node_modules/@swc/core-linux-x64-musl/swc.linux-x64-musl.node
```

</details>

<details>
<summary>🔧 <strong>Build Instance のアップグレード</strong></summary>

**大規模アプリケーションの場合:**

1. **Amplify Console にアクセス**
2. **App Settings → Build settings**
3. **Build instance** を変更:
   - **Medium**: 8 GiB memory, 4 vCPUs（デフォルト）
   - **Large**: 16 GiB memory, 8 vCPUs
   - **XLarge**: 72 GiB memory, 36 vCPUs

**料金への影響:**
- Large: 約2倍のコスト
- XLarge: 約9倍のコスト

</details>

<details>
<summary>📋 <strong>ビルドログの確認方法</strong></summary>

**詳細なエラー情報の取得:**

1. **Amplify Console → アプリ → Build history**
2. **失敗したビルドをクリック**
3. **各フェーズのログを確認:**
   - Provision
   - Build
   - Deploy
   - Verify

**CLI での確認:**
```bash
# ビルドジョブの詳細取得
aws amplify get-job --app-id [APP-ID] --branch-name main --job-id [JOB-ID]

# ビルドアーティファクトのダウンロード
# 上記コマンドの出力からartifacts URLを取得してダウンロード
```

</details>

---

## 🏗️ Step 2: Amplify リソースのデプロイ

### 2.1 Amplify プロジェクトの初期化

> **⚠️ 前提条件確認**  
> Step 1.5でAmplify初期化が完了していることを確認してください。

<details>
<summary>💻 <strong>コマンドライン版</strong> - 継続開発</summary>

```bash
# 既に初期化済みの場合（Step 1.5完了後）
npx ampx sandbox deploy

# 初回の場合（管理者権限で実行済みの場合）
npx ampx configure profile
# プロファイル名を入力（例: magi-dev）
```

**ビルドエラーが発生した場合:**
```bash
# メモリ不足の場合
export NODE_OPTIONS="--max-old-space-size=4096"
npx ampx sandbox deploy

# 詳細ログで確認
npx ampx sandbox deploy --verbose
```

**背景:** `amplify/team-provider-info.json` ファイルが作成され、プロジェクト設定が保存される
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - Amplify Console経由</summary>

1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/) にアクセス
2. 「Create new app（新しいアプリを作成）」をクリック
3. 「Build an app（アプリを構築）」を選択
4. **Git provider（Gitプロバイダー）の選択:**
   - GitHub を選択
   - 「Connect branch（ブランチを接続）」をクリック
   - GitHubアカウントでログイン
   - Repository（リポジトリ） `MAGISystem2` を選択
   - Branch（ブランチ） `main` を選択

5. **App settings（アプリ設定）:**
   - App name（アプリ名）: `magi-decision-system`
   - Environment name（環境名）: `dev`
   - 「Next（次へ）」をクリック

**ビルドエラーが発生した場合:**
1. **Build settings** でNode.js 20+を指定
2. **Environment variables** で `NODE_OPTIONS` を設定
3. **Build instance** をLargeにアップグレード（必要に応じて）

**メリット:** Git連携が自動設定され、CI/CDパイプラインも同時に構築される
</details>

---

### 2.2 リソースのデプロイ

<details>
<summary>💻 <strong>コマンドライン版</strong> - 一括デプロイ</summary>

```bash
# 全リソースをデプロイ
npx ampx push

# デプロイ内容の確認:
# ✅ Auth (Amazon Cognito)
# ✅ Data (DynamoDB + AppSync) 
# ✅ Functions (Lambda)
```

**⚠️ 重要**: デプロイには5-10分程度かかります。完了まで待機してください。

**進行状況の確認:**
```bash
# リアルタイムでログを確認
npx ampx logs --follow
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 段階的デプロイ</summary>

#### **Option A: Amplify Console での自動デプロイ**
1. 前のステップでGit連携を設定した場合、自動的にデプロイが開始
2. Amplify Console で進行状況を確認:
   - 「Provision（プロビジョン）」: AWSリソースの作成
   - 「Build（ビルド）」: アプリケーションのビルド
   - 「Deploy（デプロイ）」: デプロイメント
   - 「Verify（検証）」: 動作確認

#### **Option B: 手動でのリソース作成**

**🔐 Step 2.2.1: Cognito User Pool の作成**
1. [Amazon Cognito Console](https://console.aws.amazon.com/cognito/) にアクセス
2. 「Create user pool（ユーザープールを作成）」をクリック
3. **Configure sign-in experience（サインイン エクスペリエンスの設定）:**
   - Provider types（プロバイダータイプ）: `Cognito user pool`
   - Cognito user pool sign-in options（Cognito ユーザープール サインインオプション）: `Email`
   - 「Next（次へ）」をクリック

4. **Configure security requirements（セキュリティ要件の設定）:**
   - Password policy（パスワードポリシー）: `Cognito defaults` または カスタム設定
   - Multi-factor authentication（多要素認証）: `Optional（オプション）` (推奨)
   - 「Next（次へ）」をクリック

5. **Configure sign-up experience（サインアップ エクスペリエンスの設定）:**
   - Self-service sign-up（セルフサービス サインアップ）: `Enable（有効）`
   - Required attributes（必須属性）: `email`
   - 「Next（次へ）」をクリック

6. **Configure message delivery（メッセージ配信の設定）:**
   - Email provider（メールプロバイダー）: `Send email with Cognito`
   - 「Next（次へ）」をクリック

7. **Integrate your app（アプリの統合）:**
   - User pool name（ユーザープール名）: `magi-user-pool`
   - App client name（アプリクライアント名）: `magi-web-client`
   - 「Next（次へ）」をクリック

8. 設定を確認して「Create user pool（ユーザープールを作成）」をクリック

**📊 Step 2.2.2: AppSync GraphQL API の作成**
1. [AWS AppSync Console](https://console.aws.amazon.com/appsync/) にアクセス
2. 「Create API（APIを作成）」をクリック
3. 「Build from scratch（ゼロから構築）」を選択
4. **API details（API詳細）:**
   - API name（API名）: `magi-graphql-api`
   - 「Create（作成）」をクリック

5. **Schema（スキーマ）の設定:**
   - 左メニューから「Schema（スキーマ）」を選択
   - `amplify/data/resource.ts` の内容をGraphQLスキーマに変換して貼り付け
   - 「Save Schema（スキーマを保存）」をクリック

6. **Data sources（データソース）の設定:**
   - 「Data Sources（データソース）」を選択
   - 「Create data source（データソースを作成）」をクリック
   - DynamoDBテーブルを作成・接続

**メリット:** 各リソースの設定を詳細に確認・カスタマイズできる
</details>

---

### 2.3 デプロイ完了の確認

<details>
<summary>💻 <strong>コマンドライン版</strong> - ステータス確認</summary>

```bash
# デプロイ状況の確認
npx ampx status

# 成功時の出力例:
# Current Environment: dev
# 
# | Category | Resource name   | Operation | Provider plugin   |
# | -------- | --------------- | --------- | ----------------- |
# | Auth     | magi-auth       | Create    | awscloudformation |
# | Api      | magi-api        | Create    | awscloudformation |
# | Function | agent-gateway   | Create    | awscloudformation |
```

**詳細確認:**
```bash
# 各リソースの詳細情報
npx ampx status --verbose
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - Console での確認</summary>

#### **Amplify Console での確認:**
1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/) にアクセス
2. 作成したアプリ `magi-decision-system` をクリック
3. **Backend environments** タブを確認:
   - ✅ Authentication (Cognito)
   - ✅ API (AppSync)
   - ✅ Storage (DynamoDB)

#### **個別サービスでの確認:**

**🔐 Cognito の確認:**
1. [Cognito Console](https://console.aws.amazon.com/cognito/) → User pools
2. `magi-user-pool` が作成されていることを確認
3. **確認項目:**
   - Pool ID をメモ (例: `ap-northeast-1_xxxxxxxxx`)
   - App clients タブで Client ID をメモ

**📊 AppSync の確認:**
1. [AppSync Console](https://console.aws.amazon.com/appsync/) → APIs
2. `magi-graphql-api` が作成されていることを確認
3. **確認項目:**
   - GraphQL endpoint URL をメモ
   - API Keys タブで API Key をメモ

**💾 DynamoDB の確認:**
1. [DynamoDB Console](https://console.aws.amazon.com/dynamodb/) → Tables
2. 以下のテーブルが作成されていることを確認:
   - `User-xxxxx-dev`
   - `Conversation-xxxxx-dev`
   - `Message-xxxxx-dev`
   - `TraceStep-xxxxx-dev`
   - `AgentPreset-xxxxx-dev`

**メリット:** 各リソースの詳細設定を視覚的に確認でき、問題箇所を特定しやすい
</details>

## ⚙️ Step 3: 環境変数の設定

### 3.1 自動設定スクリプトの実行

<details>
<summary>💻 <strong>コマンドライン版</strong> - 自動抽出・設定</summary>

```bash
# 環境変数自動設定スクリプトを実行
node scripts/setup-env.js

# 実行内容:
# 1. amplify_outputs.json から値を抽出
# 2. .env.local ファイルを自動生成
# 3. 設定値の検証
```

**背景:** このスクリプトは以下の処理を自動化:
- JSON解析とキー抽出
- 環境変数ファイルの生成
- 設定値の妥当性チェック
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 手動コピー＆ペースト</summary>

**Step 3.1.1: 設定値の収集**

1. **Cognito情報の取得:**
   - [Cognito Console](https://console.aws.amazon.com/cognito/) → User pools
   - `magi-user-pool` をクリック
   - **User pool overview** で以下をコピー:
     ```
     User pool ID: ap-northeast-1_xxxxxxxxx
     ```
   - **App integration** タブ → **App clients** で以下をコピー:
     ```
     Client ID: xxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

2. **AppSync情報の取得:**
   - [AppSync Console](https://console.aws.amazon.com/appsync/) → APIs
   - `magi-graphql-api` をクリック
   - **Settings** で以下をコピー:
     ```
     GraphQL endpoint: https://xxxxxxxxxx.appsync-api.ap-northeast-1.amazonaws.com/graphql
     ```
   - **API Keys** で以下をコピー:
     ```
     API Key: da2-xxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

**Step 3.1.2: 環境変数ファイルの作成**

1. プロジェクトルートで `.env.local` ファイルを作成
2. 以下の内容を貼り付け（上記で取得した値に置き換え）:

```env
# AWS Region
NEXT_PUBLIC_AWS_REGION=ap-northeast-1

# Cognito Configuration
NEXT_PUBLIC_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# AppSync Configuration  
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://xxxxxxxxxx.appsync-api.ap-northeast-1.amazonaws.com/graphql
NEXT_PUBLIC_API_KEY=da2-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**メリット:** 各値の意味を理解しながら設定でき、間違いがあっても特定しやすい
</details>

---

### 3.2 設定値の検証

<details>
<summary>💻 <strong>コマンドライン版</strong> - 自動検証</summary>

```bash
# 環境変数の確認
cat .env.local

# 設定値の妥当性チェック
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
console.log('✅ Environment variables loaded:');
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_')) {
    const [key, value] = line.split('=');
    console.log(\`  \${key}: \${value ? '✓ Set' : '❌ Missing'}\`);
  }
});
"
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 手動確認</summary>

**チェックリスト:**

1. **.env.local ファイルの確認:**
   - [ ] ファイルがプロジェクトルートに存在する
   - [ ] ファイルサイズが0バイトでない
   - [ ] 文字エンコーディングがUTF-8

2. **各環境変数の確認:**
   - [ ] `NEXT_PUBLIC_AWS_REGION` = `ap-northeast-1`
   - [ ] `NEXT_PUBLIC_USER_POOL_ID` が `ap-northeast-1_` で始まる
   - [ ] `NEXT_PUBLIC_USER_POOL_CLIENT_ID` が26文字程度の英数字
   - [ ] `NEXT_PUBLIC_GRAPHQL_ENDPOINT` が `https://` で始まり `.amazonaws.com/graphql` で終わる
   - [ ] `NEXT_PUBLIC_API_KEY` が `da2-` で始まる

3. **AWS Console での再確認:**
   - Cognito Console で User Pool ID が一致することを確認
   - AppSync Console で GraphQL endpoint が一致することを確認

**トラブルシューティング:**
- 値が間違っている場合 → AWS Console で正しい値を再取得
- ファイルが読み込まれない場合 → ファイル名とパスを確認
- 権限エラーの場合 → ファイルの読み書き権限を確認
</details>

---

### 3.3 設定値の取得方法（参考）

<details>
<summary>💻 <strong>コマンドライン版</strong> - JSON解析</summary>

**amplify_outputs.json から取得:**
```bash
# jq コマンドを使用（要インストール）
# User Pool ID
cat amplify_outputs.json | jq -r '.auth.user_pool_id'

# GraphQL Endpoint  
cat amplify_outputs.json | jq -r '.data.url'

# API Key
cat amplify_outputs.json | jq -r '.data.api_key'
```

**jq がない場合:**
```bash
# Node.js を使用
node -e "
const config = require('./amplify_outputs.json');
console.log('User Pool ID:', config.auth?.user_pool_id);
console.log('GraphQL Endpoint:', config.data?.url);
console.log('API Key:', config.data?.api_key);
"
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - Console ナビゲーション</summary>

**効率的なConsole操作のコツ:**

1. **ブラウザタブの活用:**
   - Cognito Console用のタブ
   - AppSync Console用のタブ  
   - DynamoDB Console用のタブ
   - を同時に開いて切り替えながら作業

2. **ブックマークの活用:**
   - よく使うConsoleページをブックマーク
   - 「AWS-MAGI」フォルダを作成して整理

3. **検索機能の活用:**
   - AWS Console上部の検索バーで「Cognito」「AppSync」等を検索
   - リソース名で直接検索（例：「magi-user-pool」）

4. **設定値のメモ:**
   - テキストエディタやメモアプリに一時保存
   - スクリーンショットで設定画面を保存

**メリット:** AWSサービスの構造を理解しながら設定でき、将来の運用・保守に役立つ
</details>

## 🔐 Step 4: 認証設定の確認

### 4.1 Cognito User Pool の設定確認

<details>
<summary>💻 <strong>コマンドライン版</strong> - 詳細情報取得</summary>

```bash
# User Pool の詳細確認
aws cognito-idp describe-user-pool --user-pool-id [YOUR_USER_POOL_ID]

# 設定の要点確認
aws cognito-idp describe-user-pool --user-pool-id [YOUR_USER_POOL_ID] \
  --query 'UserPool.{
    Name:Name,
    Status:Status,
    EmailConfig:EmailConfiguration,
    PasswordPolicy:Policies.PasswordPolicy,
    MfaConfig:MfaConfiguration
  }' \
  --output table
```

**背景:** JSON形式で全設定が出力され、スクリプトでの自動チェックが可能
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 視覚的設定確認</summary>

1. [Cognito Console](https://console.aws.amazon.com/cognito/) → User pools → `magi-user-pool`

2. **Sign-in experience タブの確認:**
   - ✅ **Provider types:** `Cognito user pool` が選択されている
   - ✅ **Cognito user pool sign-in options:** `Email` がチェックされている
   - ✅ **Username requirements:** 適切に設定されている

3. **Security タブの確認:**
   - ✅ **Password policy:** 
     - Minimum length: 8文字以上
     - Require numbers: ✓
     - Require special characters: ✓
     - Require uppercase letters: ✓
     - Require lowercase letters: ✓
   - ✅ **Multi-factor authentication:** `Optional` または `Required`
   - ✅ **User account recovery:** `Email only` が設定されている

4. **Sign-up experience タブの確認:**
   - ✅ **Self-registration:** `Enable self-registration` がチェック
   - ✅ **Required attributes:** `email` が選択されている
   - ✅ **Email verification:** 有効になっている

5. **Message delivery タブの確認:**
   - ✅ **Email:** `Send email with Cognito` が選択されている
   - ✅ **SES Configuration:** 必要に応じて設定

**メリット:** 各設定項目の意味と影響を理解しながら確認できる
</details>

---

### 4.2 必要な設定項目の確認

<details>
<summary>💻 <strong>コマンドライン版</strong> - 自動チェックスクリプト</summary>

```bash
# 設定チェックスクリプトの実行
cat > check-cognito-config.sh << 'EOF'
#!/bin/bash
USER_POOL_ID=$1

echo "🔍 Cognito User Pool 設定チェック"
echo "================================"

# 基本情報
echo "📋 基本情報:"
aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID \
  --query 'UserPool.{Name:Name,Status:Status}' --output table

# パスワードポリシー
echo "🔒 パスワードポリシー:"
aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID \
  --query 'UserPool.Policies.PasswordPolicy' --output table

# MFA設定
echo "🛡️ MFA設定:"
aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID \
  --query 'UserPool.MfaConfiguration' --output text

echo "✅ チェック完了"
EOF

chmod +x check-cognito-config.sh
./check-cognito-config.sh [YOUR_USER_POOL_ID]
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - チェックリスト形式</summary>

**✅ 設定確認チェックリスト:**

**🔐 認証設定:**
- [ ] **Email認証が有効:** Sign-in experience → Email がチェック済み
- [ ] **ユーザー名要件:** 適切な形式が設定されている
- [ ] **大文字小文字の区別:** 必要に応じて設定

**🔒 セキュリティ設定:**
- [ ] **パスワードポリシー設定済み:**
  - [ ] 最小長: 8文字以上
  - [ ] 数字必須: ✓
  - [ ] 特殊文字必須: ✓  
  - [ ] 大文字必須: ✓
  - [ ] 小文字必須: ✓
- [ ] **MFA設定:** Optional または Required
- [ ] **アカウント復旧:** Email only

**📧 メッセージ配信:**
- [ ] **Email provider:** Send email with Cognito
- [ ] **カスタムメッセージ:** 必要に応じて設定
- [ ] **送信者情報:** 適切に設定

**🔧 アプリ統合:**
- [ ] **App client:** `magi-web-client` が作成済み
- [ ] **Callback URLs:** 必要に応じて設定
- [ ] **OAuth flows:** 必要に応じて設定

**確認方法:** 各タブを順番にクリックして、上記項目を目視確認
</details>

---

### 4.3 テストユーザーの作成

<details>
<summary>💻 <strong>コマンドライン版</strong> - バッチ作成</summary>

```bash
# テストユーザーの作成
aws cognito-idp admin-create-user \
  --user-pool-id [YOUR_USER_POOL_ID] \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# 複数ユーザーの一括作成
for i in {1..3}; do
  aws cognito-idp admin-create-user \
    --user-pool-id [YOUR_USER_POOL_ID] \
    --username "testuser${i}@example.com" \
    --user-attributes Name=email,Value="testuser${i}@example.com" \
    --temporary-password "TempPass123!" \
    --message-action SUPPRESS
  echo "✅ testuser${i}@example.com created"
done
```

**背景:** `--message-action SUPPRESS` により確認メールを送信せずにユーザー作成
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 個別作成</summary>

1. [Cognito Console](https://console.aws.amazon.com/cognito/) → User pools → `magi-user-pool`

2. **Users タブ** → 「Create user」をクリック

3. **User information:**
   - **Username:** `testuser@example.com`
   - **Email address:** `testuser@example.com` (同じ値)
   - **Mark email address as verified:** ✓ チェック

4. **Temporary password:**
   - **Set password:** を選択
   - **Temporary password:** `TempPass123!`
   - **User must create a new password at next sign-in:** ✓ チェック

5. 「Create user」をクリック

**追加のテストユーザー作成:**
- `admin@example.com` (管理者用)
- `demo@example.com` (デモ用)
- `test@example.com` (テスト用)

**確認方法:**
1. **Users タブ** でユーザー一覧を確認
2. 各ユーザーの **Account status** が `FORCE_CHANGE_PASSWORD` になっていることを確認
3. **Email verified** が `True` になっていることを確認

**メリット:** 
- ユーザー作成プロセスを理解できる
- 個別にユーザー属性をカスタマイズ可能
- 作成後すぐに詳細設定を確認・変更できる
</details>

## 🚀 Step 5: アプリケーションの起動と確認

### 5.1 開発サーバーの起動

<details>
<summary>💻 <strong>コマンドライン版</strong> - ターミナル起動</summary>

```bash
# 開発サーバーを起動
npm run dev

# または
yarn dev

# 詳細ログ付きで起動
npm run dev -- --verbose

# 特定ポートで起動
npm run dev -- --port 3001
```

**起動確認:**
```bash
# 別ターミナルで接続確認
curl http://localhost:3000

# プロセス確認
ps aux | grep next
```

**背景:** Next.js開発サーバーがポート3000で起動し、ホットリロード機能が有効になる
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - IDE統合起動</summary>

#### **Visual Studio Code での起動:**

1. **ターミナル統合起動:**
   - VS Code でプロジェクトを開く
   - `Ctrl + Shift + `` (バッククォート) でターミナルを開く
   - `npm run dev` を実行

2. **デバッグモードでの起動:**
   - サイドバーの「Run and Debug」(Ctrl+Shift+D) をクリック
   - 「create a launch.json file」をクリック
   - 「Node.js」を選択
   - F5 キーでデバッグ起動

3. **タスクランナーでの起動:**
   - `Ctrl + Shift + P` でコマンドパレットを開く
   - 「Tasks: Run Task」を選択
   - 「npm: dev」を選択

#### **ブラウザでの確認:**

1. **自動起動の場合:**
   - 開発サーバー起動時に自動でブラウザが開く
   - `http://localhost:3000` が表示される

2. **手動アクセスの場合:**
   - ブラウザで `http://localhost:3000` にアクセス
   - ブックマークに追加して今後のアクセスを簡単に

**メリット:** IDE統合により、コード変更とブラウザ確認を同一画面で実行可能
</details>

---

### 5.2 動作確認

<details>
<summary>💻 <strong>コマンドライン版</strong> - 自動テスト</summary>

```bash
# 基本接続テスト
curl -I http://localhost:3000

# APIエンドポイントのテスト
curl -X POST http://localhost:3000/api/health \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 自動テストスイートの実行
npm run test

# E2Eテストの実行
npm run test:e2e
```

**ログ監視:**
```bash
# リアルタイムログ監視
tail -f .next/trace

# エラーログのフィルタリング
npm run dev 2>&1 | grep -i error
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 手動確認</summary>

#### **Step 5.2.1: 基本アクセス確認**

1. **ページ表示確認:**
   - ブラウザで `http://localhost:3000` にアクセス
   - ✅ ページが正常に表示される
   - ✅ レイアウトが崩れていない
   - ✅ ローディング時間が適切（3秒以内）

2. **レスポンシブ確認:**
   - F12 で開発者ツールを開く
   - デバイスツールバー（Ctrl+Shift+M）をクリック
   - 異なる画面サイズで表示確認:
     - 📱 Mobile (375px)
     - 📱 Tablet (768px) 
     - 💻 Desktop (1200px)

#### **Step 5.2.2: 認証機能の確認**

1. **サインアップページ:**
   - 「Sign Up」リンクをクリック
   - ✅ フォームが正常に表示される
   - ✅ バリデーションが動作する
   - ✅ エラーメッセージが適切に表示される

2. **サインインページ:**
   - 「Sign In」リンクをクリック
   - ✅ フォームが正常に表示される
   - ✅ 「Forgot Password」リンクが動作する

3. **認証フローのテスト:**
   - 前のステップで作成したテストユーザーでログイン:
     - Email: `testuser@example.com`
     - Password: `TempPass123!`
   - ✅ パスワード変更画面が表示される
   - ✅ 新しいパスワードを設定できる
   - ✅ ログイン後のダッシュボードが表示される

#### **Step 5.2.3: API接続の確認**

1. **開発者ツールでの確認:**
   - F12 で開発者ツールを開く
   - **Console タブ:**
     - ✅ エラーメッセージがない
     - ✅ 警告が最小限
   - **Network タブ:**
     - ✅ GraphQL APIへのリクエストが成功（200 OK）
     - ✅ 認証ヘッダーが正しく送信される
     - ✅ レスポンス時間が適切（1秒以内）

2. **GraphQL Playground での確認:**
   - AppSync Console → APIs → `magi-graphql-api` → Queries
   - 以下のクエリを実行:
   ```graphql
   query ListUsers {
     listUsers {
       items {
         id
         email
         name
       }
     }
   }
   ```
   - ✅ クエリが正常に実行される
   - ✅ 認証エラーが発生しない

**メリット:** 実際のユーザー体験を確認でき、問題箇所を直感的に特定できる
</details>

---

### 5.3 トラブルシューティング

<details>
<summary>💻 <strong>コマンドライン版</strong> - ログベース診断</summary>

**よくある問題と解決方法:**

1. **認証エラー**
   ```bash
   # エラーログの確認
   grep -i "auth" .next/trace
   
   # AWS認証情報の再設定
   aws configure
   
   # 認証情報の確認
   aws sts get-caller-identity
   ```

2. **環境変数エラー**
   ```bash
   # 環境変数の確認
   node -e "console.log(process.env)" | grep NEXT_PUBLIC
   
   # .env.local の再読み込み
   source .env.local  # Linux/macOS
   # Windows では再起動が必要
   ```

3. **GraphQL接続エラー**
   ```bash
   # ネットワーク接続確認
   curl -I $NEXT_PUBLIC_GRAPHQL_ENDPOINT
   
   # API Key の確認
   echo $NEXT_PUBLIC_API_KEY
   ```

**診断スクリプト:**
```bash
# 総合診断スクリプト
cat > diagnose.sh << 'EOF'
#!/bin/bash
echo "🔍 MAGI System 診断開始"
echo "======================"

echo "📋 環境変数チェック:"
env | grep NEXT_PUBLIC || echo "❌ 環境変数が設定されていません"

echo "🔗 ネットワーク接続チェック:"
curl -s -I http://localhost:3000 && echo "✅ ローカルサーバー接続OK" || echo "❌ ローカルサーバー接続NG"

echo "☁️ AWS接続チェック:"
aws sts get-caller-identity > /dev/null && echo "✅ AWS認証OK" || echo "❌ AWS認証NG"

echo "✅ 診断完了"
EOF

chmod +x diagnose.sh
./diagnose.sh
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 視覚的診断</summary>

#### **問題の特定方法:**

**🔍 Step 5.3.1: エラーの種類を特定**

1. **ページが全く表示されない場合:**
   - ✅ ターミナルで開発サーバーが起動しているか確認
   - ✅ ポート3000が他のプロセスで使用されていないか確認
   - ✅ ファイアウォールでポート3000がブロックされていないか確認

2. **ページは表示されるが機能しない場合:**
   - F12 → Console タブでエラーメッセージを確認
   - F12 → Network タブで失敗しているリクエストを確認
   - F12 → Application タブで環境変数を確認

3. **認証が動作しない場合:**
   - Cognito Console でUser Poolの状態を確認
   - AppSync Console でAPIの状態を確認
   - .env.local ファイルの内容を確認

**🔧 Step 5.3.2: 問題別解決方法**

**認証エラーの解決:**
1. [Cognito Console](https://console.aws.amazon.com/cognito/) → User pools → `magi-user-pool`
2. **General settings** で User Pool ID を確認
3. **App clients** で Client ID を確認
4. `.env.local` ファイルの値と一致するか確認
5. 不一致の場合は正しい値に更新

**環境変数エラーの解決:**
1. プロジェクトルートに `.env.local` ファイルが存在するか確認
2. ファイル内容が正しい形式か確認:
   ```env
   NEXT_PUBLIC_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
   ```
3. 値に余分なスペースや改行がないか確認
4. 開発サーバーを再起動（Ctrl+C → `npm run dev`）

**GraphQL接続エラーの解決:**
1. [AppSync Console](https://console.aws.amazon.com/appsync/) → APIs → `magi-graphql-api`
2. **Settings** で GraphQL endpoint を確認
3. **API Keys** で API Key を確認
4. `.env.local` の値と一致するか確認
5. API Keyの有効期限を確認

**🔄 Step 5.3.3: 設定の再確認手順**

1. **AWS Console での確認:**
   - 各サービスのダッシュボードで緑色のステータスを確認
   - エラーや警告がないことを確認

2. **ローカル設定の確認:**
   - `.env.local` ファイルを開いて内容を確認
   - VS Code の問題タブでエラーがないことを確認

3. **ブラウザでの確認:**
   - キャッシュをクリア（Ctrl+Shift+Delete）
   - シークレットモードで再度アクセス
   - 異なるブラウザで確認

**メリット:** 問題の原因を段階的に特定でき、解決過程でシステム全体の理解が深まる
</details>

## 📊 Step 6: 動作確認テスト

### 6.1 基本機能テスト

<details>
<summary>💻 <strong>コマンドライン版</strong> - 自動テストスイート</summary>

```bash
# 単体テストの実行
npm run test

# カバレッジ付きテスト
npm run test -- --coverage

# 監視モードでのテスト
npm run test -- --watch

# E2Eテストの実行（オプション）
npm run test:e2e

# 特定のテストファイルのみ実行
npm run test -- --testPathPattern=useConversations

# パフォーマンステスト
npm run test:performance
```

**テスト結果の確認:**
```bash
# テスト結果のサマリー表示
npm run test -- --verbose

# 失敗したテストの詳細確認
npm run test -- --verbose --no-coverage
```

**背景:** Jest + React Testing Library による自動テストで品質を保証
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - 手動テスト実行</summary>

#### **VS Code でのテスト実行:**

1. **Test Explorer の使用:**
   - VS Code で「Test Explorer UI」拡張機能をインストール
   - サイドバーのテストアイコンをクリック
   - 個別テストを選択して実行
   - 結果を視覚的に確認

2. **デバッグモードでのテスト:**
   - テストファイルを開く（例：`src/hooks/__tests__/useConversations.test.ts`）
   - ブレークポイントを設定
   - F5 でデバッグ実行
   - ステップ実行で動作を確認

#### **ブラウザでのテスト確認:**

1. **Jest HTML Reporter:**
   ```bash
   npm install --save-dev jest-html-reporter
   npm run test
   ```
   - `test-report.html` をブラウザで開く
   - テスト結果を視覚的に確認

2. **Coverage Report:**
   ```bash
   npm run test -- --coverage
   ```
   - `coverage/lcov-report/index.html` をブラウザで開く
   - コードカバレッジを確認

**メリット:** テスト結果を視覚的に確認でき、問題箇所を直感的に特定できる
</details>

---

### 6.2 手動テストシナリオ

<details>
<summary>💻 <strong>コマンドライン版</strong> - スクリプト化テスト</summary>

```bash
# 自動テストスクリプトの作成
cat > manual-test.sh << 'EOF'
#!/bin/bash

echo "🧪 MAGI System 手動テスト開始"
echo "============================"

# サーバー起動確認
echo "1. サーバー起動確認..."
curl -s http://localhost:3000 > /dev/null && echo "✅ OK" || echo "❌ NG"

# 認証API確認
echo "2. 認証API確認..."
# 実際のAPIテストコードをここに追加

# GraphQL API確認
echo "3. GraphQL API確認..."
# 実際のGraphQLテストコードをここに追加

echo "✅ 手動テスト完了"
EOF

chmod +x manual-test.sh
./manual-test.sh
```

**API テストの例:**
```bash
# GraphQL クエリのテスト
curl -X POST $NEXT_PUBLIC_GRAPHQL_ENDPOINT \
  -H "Content-Type: application/json" \
  -H "x-api-key: $NEXT_PUBLIC_API_KEY" \
  -d '{"query": "query { listUsers { items { id email } } }"}'
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - ユーザーシナリオテスト</summary>

#### **✅ 認証機能テストシナリオ**

**🔐 Test Case 1: ユーザー登録**
1. `http://localhost:3000` にアクセス
2. 「Sign Up」をクリック
3. 以下の情報を入力:
   - Email: `newuser@example.com`
   - Password: `NewPass123!`
   - Confirm Password: `NewPass123!`
4. 「Sign Up」ボタンをクリック
5. ✅ **期待結果:** 確認コード入力画面が表示される

**📧 Test Case 2: メール認証**
1. [Cognito Console](https://console.aws.amazon.com/cognito/) → User pools → `magi-user-pool` → Users
2. `newuser@example.com` を選択
3. 「Confirm user」をクリック（テスト環境のため手動確認）
4. アプリに戻り、確認コード画面で「Skip」または適当なコードを入力
5. ✅ **期待結果:** ログイン画面にリダイレクトされる

**🔑 Test Case 3: ログイン**
1. ログイン画面で以下を入力:
   - Email: `testuser@example.com`
   - Password: `TempPass123!`
2. 「Sign In」をクリック
3. パスワード変更画面で新しいパスワードを設定
4. ✅ **期待結果:** ダッシュボードが表示される

**🚪 Test Case 4: ログアウト**
1. 右上のユーザーメニューをクリック
2. 「Sign Out」をクリック
3. ✅ **期待結果:** ログイン画面にリダイレクトされる

#### **✅ データ操作テストシナリオ**

**💬 Test Case 5: 会話作成**
1. ログイン後のダッシュボードで「New Conversation」をクリック
2. 会話タイトル: `AIの倫理について`
3. 「Create」をクリック
4. ✅ **期待結果:** 新しい会話画面が表示される

**📝 Test Case 6: メッセージ送信**
1. メッセージ入力欄に以下を入力:
   ```
   AIの倫理的な使用について、どのような点に注意すべきでしょうか？
   ```
2. 「Send」ボタンをクリック
3. ✅ **期待結果:** 
   - メッセージが即座に表示される（楽観的更新）
   - エージェント実行中の表示が現れる
   - 3賢者の応答が段階的に表示される

**📋 Test Case 7: 会話履歴表示**
1. サイドバーの「Conversations」をクリック
2. 作成した会話 `AIの倫理について` をクリック
3. ✅ **期待結果:** 
   - 会話履歴が正しく表示される
   - メッセージの順序が正しい
   - エージェント応答が保持されている

**🗑️ Test Case 8: 会話削除**
1. 会話一覧で削除したい会話の「...」メニューをクリック
2. 「Delete」を選択
3. 確認ダイアログで「Delete」をクリック
4. ✅ **期待結果:** 
   - 会話が一覧から削除される
   - 削除確認メッセージが表示される

#### **✅ エージェント機能テストシナリオ（モック）**

**🤖 Test Case 9: エージェント応答の確認**
1. 新しい会話でメッセージを送信:
   ```
   クラウドコンピューティングの導入について判断してください
   ```
2. エージェント実行中の表示を確認:
   - ✅ CASPAR: 実行中 → 完了
   - ✅ BALTHASAR: 実行中 → 完了  
   - ✅ MELCHIOR: 実行中 → 完了
   - ✅ SOLOMON: 実行中 → 完了

**⚖️ Test Case 10: MAGI投票システムの確認**
1. エージェント応答完了後、以下を確認:
   - ✅ **3賢者の個別応答:** 各エージェントの判断（APPROVED/REJECTED）
   - ✅ **投票結果:** 可決/否決/棄権の集計
   - ✅ **SOLOMON評価:** 各賢者へのスコア（0-100点）
   - ✅ **最終判断:** 統合された推奨事項

**📊 Test Case 11: トレース情報の確認**
1. メッセージの「View Trace」をクリック
2. トレースステップを確認:
   - ✅ 各ステップの実行時間
   - ✅ 使用されたツール
   - ✅ 引用情報
   - ✅ エラー回数

**メリット:** 実際のユーザー体験を通じてシステム全体の動作を確認できる
</details>

## 🔧 Step 7: 本番環境への準備（オプション）

### 7.1 本番環境用の設定

```bash
# 本番環境の作成
npx ampx push --environment production
```

### 7.2 ドメイン設定

```bash
# カスタムドメインの設定
npx ampx add hosting
```

### 7.3 CI/CD設定

```bash
# GitHub Actions用の設定
npx ampx configure cicd
```

## 🔧 Step 7: 本番環境への準備（オプション）

<details>
<summary>💻 <strong>コマンドライン版</strong> - 自動化デプロイ</summary>

### 7.1 本番環境の作成

```bash
# 本番環境の作成
npx ampx push --environment production

# 環境固有の設定
npx ampx configure project --environment production
```

### 7.2 CI/CD パイプラインの設定

```bash
# GitHub Actions の設定
npx ampx configure cicd

# 自動デプロイの設定
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to AWS Amplify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npx ampx push --yes
EOF
```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - Console設定</summary>

### 7.1 Amplify Console での本番設定

1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/) → アプリを選択
2. **App settings** → **Environment variables**
3. 本番環境用の環境変数を追加:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_ENV=production
   ```

### 7.2 カスタムドメインの設定

1. **App settings** → **Domain management**
2. 「Add domain」をクリック
3. ドメイン名を入力（例：`magi.yourdomain.com`）
4. SSL証明書の自動設定を確認
5. 「Save」をクリック

### 7.3 ブランチ戦略の設定

1. **App settings** → **General**
2. **Connected branches** で以下を設定:
   - `main` → Production environment
   - `develop` → Staging environment
   - `feature/*` → Preview deployments
</details>

---

## 📞 サポート情報

### 問題が発生した場合

<details>
<summary>💻 <strong>コマンドライン版</strong> - ログベース診断</summary>

1. **ログの確認**
   ```bash
   # Amplify ログの確認
   npx ampx logs
   
   # Next.js ログの確認
   npm run dev -- --verbose
   
   # AWS CloudWatch ログの確認
   aws logs describe-log-groups --log-group-name-prefix "/aws/amplify"
   ```

2. **設定の再確認**
   ```bash
   # Amplify 設定の確認
   npx ampx status
   
   # 環境変数の確認
   cat .env.local
   
   # AWS リソースの確認
   aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE
   ```

3. **リソースの再デプロイ**
   ```bash
   # 強制再デプロイ
   npx ampx push --force
   
   # 特定リソースのみ再デプロイ
   npx ampx push --category auth
   ```
</details>

<details>
<summary>🖱️ <strong>画面操作版</strong> - Console診断</summary>

1. **AWS Console での確認**
   - [CloudFormation Console](https://console.aws.amazon.com/cloudformation/) でスタック状態を確認
   - [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/) でログとメトリクスを確認
   - 各サービスのダッシュボードで健全性を確認

2. **Amplify Console での確認**
   - **Monitoring** タブでアプリケーションメトリクスを確認
   - **Build history** でデプロイ履歴を確認
   - **Logs** でビルド・デプロイログを確認

3. **問題の特定と解決**
   - エラーメッセージを AWS Console で検索
   - AWS Support Center でケースを作成
   - AWS Community Forums で質問
</details>

---

### 学習リソース

**📚 公式ドキュメント:**
- [AWS Amplify Documentation](https://docs.amplify.aws/) - 包括的なAmplifyガイド
- [Next.js Documentation](https://nextjs.org/docs) - Next.jsの詳細リファレンス
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/) - 認証システムの詳細
- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/) - GraphQL APIの詳細

**🎥 動画チュートリアル:**
- [AWS Amplify YouTube Channel](https://www.youtube.com/c/AWSAmplify)
- [Next.js Conf Talks](https://nextjs.org/conf)

**💬 コミュニティ:**
- [AWS Amplify Discord](https://discord.gg/amplify)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)

---

## ✅ 完了確認チェックリスト

### 🎯 必須項目

**AWS リソース:**
- [ ] **Cognito User Pool** が作成され、正常に動作している
- [ ] **AppSync GraphQL API** が作成され、スキーマが正しく設定されている
- [ ] **DynamoDB テーブル** が全て作成されている
- [ ] **Lambda 関数** (agent-gateway) が作成されている

**ローカル環境:**
- [ ] **.env.local** ファイルが正しく設定されている
- [ ] **開発サーバー** が正常に起動する (`npm run dev`)
- [ ] **ブラウザアクセス** で http://localhost:3000 が表示される

**認証機能:**
- [ ] **ユーザー登録** が正常に動作する
- [ ] **ログイン・ログアウト** が正常に動作する
- [ ] **パスワードリセット** が正常に動作する

**データ操作:**
- [ ] **会話作成・削除** が正常に動作する
- [ ] **メッセージ送信** が正常に動作する
- [ ] **エージェント応答** (モック) が正常に表示される

### 🚀 オプション項目

**高度な機能:**
- [ ] **リアルタイム更新** が動作している
- [ ] **トレース情報** が正しく記録・表示される
- [ ] **エラーハンドリング** が適切に動作する

**本番準備:**
- [ ] **本番環境** が設定されている
- [ ] **カスタムドメイン** が設定されている
- [ ] **CI/CD パイプライン** が設定されている

---

## 🎉 完了！次のステップ

**おめでとうございます！** 
MAGI Decision System の基盤が正常に構築されました。

### 📋 現在の状況
- ✅ **フロントエンド基盤**: Next.js + TypeScript + Tailwind CSS
- ✅ **認証システム**: Amazon Cognito
- ✅ **データ管理**: DynamoDB + AppSync GraphQL
- ✅ **型安全なAPI**: カスタムフック + 楽観的更新
- ✅ **モックエージェント**: 3賢者 + SOLOMON Judge

### 🔄 次のフェーズ (Phase 3)
1. **実際のエージェント統合**: Amazon Bedrock + Strands Agents
2. **MAGI投票システム**: 実際の意思決定ロジック
3. **トレース可視化**: リアルタイム実行監視
4. **UI/UX 改善**: エージェント応答の視覚化

### 🛠️ 開発継続のために
- **コードの理解**: `src/hooks/` と `src/types/` の実装を確認
- **AWS学習**: 各サービスの詳細機能を学習
- **Next.js習得**: React Server Components と最新機能の活用
- **TypeScript向上**: 高度な型システムの活用

**準備完了です！** 次のタスクに進んでMAGIシステムを完成させましょう。