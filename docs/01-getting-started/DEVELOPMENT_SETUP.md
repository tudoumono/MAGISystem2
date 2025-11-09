# 開発環境セットアップガイド

MAGI Decision Systemの完全な開発環境構築手順を説明します。

## 📋 前提条件

### 必須ツール

- **Node.js**: 18.x以上
- **Python**: 3.11以上
- **AWS CLI**: 最新版
- **Git**: 最新版

### AWS要件

- AWSアカウント
- Amazon Bedrock有効化（ap-northeast-1推奨）
- Claude 3.5 Sonnetモデルアクセス権限

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/tudoumono/MAGISystem2.git
cd MAGISystem2
```

### 2. フロントエンド環境

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.template .env.local
# .env.localを編集してAWS設定を追加
```

### 3. Python環境（エージェント）

```bash
cd agents

# 仮想環境の作成
python -m venv venv

# 仮想環境の有効化
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt
```

### 4. AWS認証情報の設定

```bash
aws configure
# AWS Access Key ID: [あなたのキー]
# AWS Secret Access Key: [あなたのシークレット]
# Default region name: ap-northeast-1
# Default output format: json
```

### 5. Amplify Gen 2のデプロイ

```bash
# ルートディレクトリに戻る
cd ..

# Amplifyリソースのデプロイ
npx ampx sandbox
```

## 🔧 開発ワークフロー

### フロントエンド開発

```bash
# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# Lint
npm run lint
```

### エージェント開発

```bash
cd agents

# テスト実行
cd tests
python test_magi.py

# ストリーミングテスト
python test_magi2.py
```

## 📁 プロジェクト構造

```
MAGISystem2/
├── src/                    # Next.jsフロントエンド
│   ├── app/               # App Router
│   ├── components/        # Reactコンポーネント
│   └── lib/               # ユーティリティ
├── amplify/               # Amplify Gen 2設定
│   ├── auth/             # 認証設定
│   ├── data/             # データスキーマ
│   └── backend.ts        # バックエンド定義
├── agents/                # Pythonエージェント
│   ├── magi_agent.py     # メインエージェント
│   ├── shared/           # 共通モジュール
│   └── tests/            # テストコード
└── docs/                  # ドキュメント
```

## 🧪 テスト

### フロントエンドテスト

```bash
# 単体テスト
npm test

# E2Eテスト
npm run test:e2e
```

### エージェントテスト

```bash
cd agents/tests

# 基本テスト
python test_magi.py

# 並列実行テスト
python test_magi_parallel.py

# カスタムプロンプトテスト
python test_magi3.py
```

## 🔍 トラブルシューティング

### Bedrock権限エラー

```bash
# モデルアクセス権限を確認
aws bedrock list-foundation-models --region ap-northeast-1

# 必要に応じてAWSコンソールでモデルアクセスを有効化
```

### Python依存関係エラー

```bash
# 依存関係を再インストール
pip install --upgrade -r requirements.txt

# キャッシュをクリア
pip cache purge
```

### Next.jsビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 📚 次のステップ

- **アーキテクチャ理解**: [../02-architecture/OVERVIEW.md](../02-architecture/OVERVIEW.md)
- **エージェント設定**: [../04-agent-configuration/AGENTCORE_SETUP.md](../04-agent-configuration/AGENTCORE_SETUP.md)
- **本番デプロイ**: [../03-deployment/CHECKLIST.md](../03-deployment/CHECKLIST.md)

## 🛠️ 開発ツール推奨設定

### VS Code拡張機能

- ESLint
- Prettier
- Python
- AWS Toolkit

### .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```
