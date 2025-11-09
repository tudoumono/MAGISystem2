# 🚀 MAGI System - 5分クイックスタート

このガイドでは、MAGI Decision Systemをローカル環境で最速起動する手順を説明します。

## 前提条件

- Node.js 18.x以上
- Python 3.11以上
- AWS CLIとアカウント（Bedrock有効化済み）

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/tudoumono/MAGISystem2.git
cd MAGISystem2
```

### 2. Python環境のセットアップ

```bash
cd agents
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. AWS認証情報の設定

```bash
aws configure
# AWS Access Key ID、Secret Access Key、リージョン（ap-northeast-1推奨）を入力
```

### 4. MAGIエージェントのテスト

```bash
cd tests
python test_magi.py
```

成功すると、3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeの応答がストリーミング表示されます。

## 次のステップ

- **詳細な開発環境構築**: [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)
- **アーキテクチャ理解**: [../02-architecture/OVERVIEW.md](../02-architecture/OVERVIEW.md)
- **本番デプロイ**: [../03-deployment/CHECKLIST.md](../03-deployment/CHECKLIST.md)

## トラブルシューティング

### Bedrock権限エラー

```bash
# Bedrockモデルアクセス権限を確認
aws bedrock list-foundation-models --region ap-northeast-1
```

### Python依存関係エラー

```bash
# 依存関係を再インストール
pip install --upgrade -r requirements.txt
```

詳細は[DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)を参照してください。
