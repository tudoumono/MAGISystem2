# Lambda Function Test Scripts

MAGI Python Agents Lambda関数をテストするためのスクリプト集です。

## 前提条件

### 1. Python環境

```bash
python --version  # Python 3.7以上
```

### 2. boto3のインストール

```bash
pip install boto3
```

### 3. AWS認証情報の設定

以下のいずれかの方法で設定:

#### 方法1: AWS CLIで設定

```bash
aws configure
```

入力項目:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name: `ap-northeast-1`
- Default output format: `json`

#### 方法2: 環境変数で設定

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ap-northeast-1
```

#### 方法3: IAMロール（EC2/Lambda内で実行する場合）

IAMロールが自動的に使用されます。

---

## テストスクリプト

### 1. quick_test.py - 簡易テスト

最も簡単なテストスクリプトです。

**実行方法:**

```bash
python test/quick_test.py
```

**機能:**
- Lambda関数をストリーミングモードで呼び出し
- エージェント設定を含むリクエストを送信
- 主要なイベントのみ表示

**出力例:**

```
Lambda関数を呼び出し中...
関数名: magi-python-agents
質問: こんにちは、MAGIシステム

ストリーミングレスポンス:
============================================================

👤 melchior: MELCHIOR (anthropic.claude-3-haiku-20240307-v1:0)
✅ melchior: APPROVED (信頼度: 0.82)

👤 caspar: CASPAR (anthropic.claude-3-haiku-20240307-v1:0)
✅ caspar: REJECTED (信頼度: 0.85)

👤 balthasar: BALTHASAR (anthropic.claude-3-haiku-20240307-v1:0)
✅ balthasar: APPROVED (信頼度: 0.92)

⚖️  最終判断: APPROVED
   投票: {'approved': 2, 'rejected': 1, 'abstained': 0}

🎉 完了!

============================================================
ストリーミング完了

✅ テスト成功
```

---

### 2. lambda_test.py - 詳細テスト

より詳細なテストとデバッグ機能を提供します。

**実行方法:**

```bash
python test/lambda_test.py
```

**機能:**
- 対話式メニュー
- 複数のテストケース
- 詳細なイベント表示
- エラーハンドリング

**テストメニュー:**

```
テストメニュー:
============================================================
1. シンプルなリクエスト（同期）
2. エージェント設定を含むリクエスト（ストリーミング）
3. 無効化されたエージェントのテスト
4. すべてのテストを実行
0. 終了

選択してください (0-4):
```

**テストケース:**

#### テスト1: シンプルなリクエスト

エージェント設定なしで呼び出し（デフォルトモデル使用）

```python
payload = {
    "question": "こんにちは",
    "conversationId": "test-001"
}
```

#### テスト2: エージェント設定を含むリクエスト

最新モデルを指定して呼び出し

```python
payload = {
    "question": "AIの未来について教えてください",
    "agentConfigs": {
        "caspar": {
            "model": "anthropic.claude-3-7-sonnet-20250219-v1:0",
            "temperature": 0.3,
            ...
        },
        ...
    }
}
```

#### テスト3: 無効化されたエージェント

特定のエージェントを無効化してテスト

```python
payload['agentConfigs']['caspar']['enabled'] = False
```

---

## トラブルシューティング

### エラー: boto3 is not installed

**原因:** boto3がインストールされていない

**解決策:**

```bash
pip install boto3
```

### エラー: AWS認証エラー

**原因:** AWS認証情報が設定されていない

**解決策:**

```bash
aws configure
```

または環境変数を設定:

```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

### エラー: Function not found

**原因:** Lambda関数名が間違っている、または関数が存在しない

**解決策:**

1. Lambda関数名を確認:

```bash
aws lambda list-functions --region ap-northeast-1 | grep magi
```

2. スクリプト内の`FUNCTION_NAME`を修正:

```python
FUNCTION_NAME = "your-actual-function-name"
```

### エラー: AccessDeniedException

**原因:** IAMユーザーにLambda実行権限がない

**解決策:**

IAMユーザーに以下のポリシーを追加:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction",
        "lambda:InvokeWithResponseStream"
      ],
      "Resource": "arn:aws:lambda:ap-northeast-1:*:function:magi-python-agents"
    }
  ]
}
```

### エラー: ValidationException: The provided model identifier is invalid

**原因:** 指定したモデルのアクセスが有効化されていない

**解決策:**

1. AWS Bedrockコンソールにアクセス
2. 「Model access」を選択
3. 使用するモデルの「Request access」をクリック
4. フォームを送信

---

## カスタマイズ

### モデルの変更

`quick_test.py`または`lambda_test.py`内の`agentConfigs`を編集:

```python
"caspar": {
    "model": "anthropic.claude-opus-4-1-20250805-v1:0",  # 最高性能
    "temperature": 0.3,
    ...
}
```

### 質問の変更

```python
payload = {
    "question": "あなたの質問をここに入力",
    ...
}
```

### タイムアウトの設定

boto3クライアントの設定:

```python
from botocore.config import Config

config = Config(
    read_timeout=300,  # 5分
    connect_timeout=10
)

lambda_client = boto3.client('lambda', region_name=REGION, config=config)
```

---

## 高度な使用例

### 1. 複数の質問を連続テスト

```python
questions = [
    "こんにちは",
    "AIの未来について",
    "気候変動対策について"
]

for question in questions:
    payload = create_test_request(question)
    invoke_lambda_streaming(FUNCTION_NAME, payload)
    time.sleep(5)  # 次のリクエストまで待機
```

### 2. パフォーマンス測定

```python
import time

start_time = time.time()
invoke_lambda_streaming(FUNCTION_NAME, payload)
elapsed_time = time.time() - start_time

print(f"総実行時間: {elapsed_time:.2f}秒")
```

### 3. ログ出力

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='lambda_test.log'
)

logger = logging.getLogger(__name__)
logger.info("テスト開始")
```

---

## 参考資料

- [AWS Lambda Python SDK](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/lambda.html)
- [AWS Bedrock Models](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)
- [参考記事: Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)

---

## サポート

問題が発生した場合:

1. エラーメッセージを確認
2. CloudWatch Logsを確認
3. GitHubでIssueを作成
