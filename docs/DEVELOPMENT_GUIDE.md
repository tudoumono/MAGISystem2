# 開発ガイド

## 目次

1. [開発環境のセットアップ](#開発環境のセットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [開発ワークフロー](#開発ワークフロー)
4. [コーディング規約](#コーディング規約)
5. [テスト](#テスト)
6. [デプロイ](#デプロイ)

## 開発環境のセットアップ

### 必要な環境

- **Node.js**: 20.x以上
- **Python**: 3.13以上
- **AWS CLI**: 最新版
- **Git**: 最新版

### フロントエンド開発

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# Lint
npm run lint
```

### バックエンド開発（Pythonエージェント）

```bash
# agentsディレクトリに移動
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

# テストの実行
python -m pytest tests/
```

## プロジェクト構造

### フロントエンド

```
src/
├── app/                    # Next.js App Router
│   ├── (protected)/       # 認証が必要なページ
│   ├── test/              # テストページ
│   │   ├── agents/        # エージェントテスト
│   │   ├── data/          # データテスト
│   │   ├── integration/   # 統合テスト
│   │   └── trace/         # トレーステスト
│   └── api/               # API Routes
│
├── components/            # Reactコンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   ├── agents/           # エージェント関連
│   ├── auth/             # 認証関連
│   ├── chat/             # チャット関連
│   └── trace/            # トレース表示
│
├── lib/                  # ユーティリティ
│   ├── agents/          # エージェント連携
│   ├── amplify/         # Amplify設定
│   ├── auth/            # 認証ユーティリティ
│   ├── graphql/         # GraphQL関連
│   ├── mock/            # モックデータ
│   ├── observability/   # 観測可能性
│   ├── realtime/        # リアルタイム機能
│   └── trace/           # トレース処理
│
├── hooks/               # カスタムフック
└── types/               # TypeScript型定義
```

### バックエンド（Pythonエージェント）

```
agents/
├── caspar/              # CASPAR（保守的視点）
├── balthasar/           # BALTHASAR（革新的視点）
├── melchior/            # MELCHIOR（バランス型視点）
├── solomon/             # SOLOMON Judge（統括者）
├── shared/              # 共通ユーティリティ
├── tests/               # テストコード
├── scripts/             # 開発用スクリプト
└── magi_agent.py        # メインエージェント
```

## 開発ワークフロー

### 1. 新機能の開発

```bash
# 新しいブランチを作成
git checkout -b feature/new-feature

# 開発
# ...

# コミット
git add .
git commit -m "feat: Add new feature"

# プッシュ
git push origin feature/new-feature

# Pull Requestを作成
```

### 2. バグ修正

```bash
# バグ修正用ブランチを作成
git checkout -b fix/bug-description

# 修正
# ...

# コミット
git add .
git commit -m "fix: Fix bug description"

# プッシュ
git push origin fix/bug-description
```

### 3. コミットメッセージ規約

Conventional Commits形式を使用：

- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメント変更
- `style:` - コードスタイル変更（機能に影響なし）
- `refactor:` - リファクタリング
- `test:` - テスト追加・修正
- `chore:` - ビルドプロセスやツールの変更

例：
```
feat: Add MAGI trace visualization
fix: Resolve authentication error
docs: Update README with new structure
```

## コーディング規約

### TypeScript/React

1. **命名規則**
   - コンポーネント: PascalCase (`AgentPanel.tsx`)
   - 関数・変数: camelCase (`handleSubmit`, `userName`)
   - 定数: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
   - 型・インターフェース: PascalCase (`AgentResponse`)

2. **ファイル構成**
   ```typescript
   // インポート
   import { useState } from 'react';
   
   // 型定義
   interface Props {
     // ...
   }
   
   // コンポーネント
   export default function Component({ }: Props) {
     // ...
   }
   ```

3. **コメント**
   - 複雑なロジックには説明を追加
   - JSDocコメントで関数を文書化
   - TODOコメントは避ける（Issueを作成）

### Python

1. **命名規則**
   - クラス: PascalCase (`AgentOrchestrator`)
   - 関数・変数: snake_case (`process_request`, `user_name`)
   - 定数: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)

2. **型ヒント**
   ```python
   def process_request(question: str) -> dict:
       # ...
   ```

3. **Docstrings**
   ```python
   def function_name(param: str) -> str:
       """
       Brief description.
       
       Args:
           param: Parameter description
           
       Returns:
           Return value description
       """
   ```

## テスト

### フロントエンドテスト

```bash
# 開発用テストページ
npm run dev
# http://localhost:3000/test にアクセス

# 型チェック
npm run type-check

# Lint
npm run lint
```

### バックエンドテスト

```bash
cd agents

# 全テスト実行
python -m pytest tests/

# 特定のテスト実行
python -m pytest tests/test_agents.py

# カバレッジ付き
python -m pytest --cov=. tests/
```

## デプロイ

### Amplify Hosting（自動デプロイ）

```bash
# mainブランチにプッシュすると自動デプロイ
git push origin main
```

### 手動デプロイ

```bash
# ビルド
npm run build

# Amplifyサンドボックス
npx ampx sandbox

# 本番デプロイ
npx ampx pipeline-deploy --branch main
```

## トラブルシューティング

### よくある問題

1. **ビルドエラー**
   ```bash
   # node_modulesを削除して再インストール
   rm -rf node_modules
   npm install
   ```

2. **型エラー**
   ```bash
   # 型チェックを実行
   npm run type-check
   ```

3. **Amplifyエラー**
   ```bash
   # Amplify設定を確認
   npx ampx status
   ```

## 参考リソース

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Amplify Gen2 Documentation](https://docs.amplify.aws/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Python Documentation](https://docs.python.org/3/)

## サポート

問題が発生した場合は、以下を確認してください：

1. [環境セットアップガイド](./ENVIRONMENT_SETUP.md)
2. [テスト構造ドキュメント](./TEST_STRUCTURE.md)
3. [学習ガイド](./learning/)
4. GitHubのIssues

---

最終更新: 2025/10/29
