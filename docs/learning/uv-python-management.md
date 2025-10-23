# uv - Modern Python Package Management

## 概要

[uv](https://docs.astral.sh/uv/)は、Rustで実装された高速なPythonパッケージマネージャーです。MAGI Decision Systemでは、効率的な依存関係管理とAWS統合のためにuvを採用しています。

## 🚀 なぜuvを選ぶのか？

### 従来のpipとの比較

| 特徴 | pip | uv |
|------|-----|-----|
| インストール速度 | 遅い | 10-100倍高速 |
| 依存関係解決 | 単純 | 高度なSAT solver |
| ロックファイル | なし | uv.lock |
| 並列処理 | 限定的 | 完全並列 |
| キャッシュ | 基本的 | グローバル最適化 |
| プロジェクト管理 | 外部ツール必要 | 統合済み |

### AWS環境での利点

1. **Amplify Functions**: 高速ビルドとデプロイ
2. **Lambda**: Cold Start時間の短縮
3. **AgentCore**: 効率的な依存関係管理
4. **Container**: Dockerビルド時間の大幅短縮

## 📦 基本的な使い方

### インストール

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# pip経由（既存のPython環境がある場合）
pip install uv
```

### プロジェクトの初期化

```bash
# 新しいプロジェクトを作成
uv init my-project
cd my-project

# 既存のプロジェクトでuvを有効化
uv init --python 3.11
```

### 依存関係の管理

```bash
# パッケージの追加
uv add requests
uv add pytest --dev  # 開発用依存関係

# 依存関係のインストール
uv sync

# 特定の環境のみ
uv sync --no-dev  # 本番環境用

# 依存関係の更新
uv update
uv update requests  # 特定パッケージのみ
```

### 仮想環境の管理

```bash
# 仮想環境での実行
uv run python script.py
uv run pytest

# 仮想環境のアクティベート
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
```

## 🔧 pyproject.toml設定

### 基本設定

```toml
[project]
name = "my-project"
version = "0.1.0"
description = "My awesome project"
requires-python = ">=3.11"

dependencies = [
    "requests>=2.31.0",
    "pydantic>=2.5.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "black>=23.12.0",
    "mypy>=1.8.0",
]

test = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
]
```

### uv固有の設定

```toml
[tool.uv]
# Python version preference
python-preference = "only-managed"
python-downloads = "automatic"

# Package index
index-url = "https://pypi.org/simple"

# Resolution strategy
resolution = "highest"
prerelease = "disallow"

# Development dependencies
dev-dependencies = [
    "pytest>=7.4.0",
    "black>=23.12.0",
]
```

## 🏗️ MAGI Systemでの実装例

### プロジェクト構造

```
agents/
├── pyproject.toml          # メインプロジェクト設定
├── uv.lock                 # ロックファイル
├── uv.toml                 # uv設定
├── .python-version         # Python version
├── shared/                 # 共通コード
├── solomon/                # SOLOMONエージェント
├── caspar/                 # CASPARエージェント
├── balthasar/              # BALTHASARエージェント
├── melchior/               # MELCHIORエージェント
└── tests/                  # テスト
```

### 依存関係の定義

```toml
[project]
name = "magi-decision-system"
dependencies = [
    # Core framework
    "strands-agents>=0.1.0",
    
    # AWS integration
    "boto3>=1.34.0",
    
    # Data validation
    "pydantic>=2.5.0",
    
    # Async support
    "aiohttp>=3.9.0",
    
    # Observability
    "opentelemetry-api>=1.21.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.12.0",
    "mypy>=1.8.0",
]

aws = [
    "aioboto3>=12.0.0",
    "aws-lambda-powertools>=2.25.0",
]
```

## 🧪 テストとの統合

### pytest設定

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "-v --tb=short"
asyncio_mode = "auto"
```

### テスト実行

```bash
# 基本テスト
uv run pytest

# カバレッジ付き
uv run pytest --cov=shared --cov=solomon

# 特定のテスト
uv run pytest tests/test_agents.py -v

# 並列実行
uv run pytest -n auto
```

## 🔄 CI/CDとの統合

### GitHub Actions

```yaml
name: Test and Deploy

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install uv
        uses: astral-sh/setup-uv@v1
        with:
          version: "latest"
      
      - name: Set up Python
        run: uv python install 3.11
      
      - name: Install dependencies
        run: uv sync
      
      - name: Run tests
        run: uv run pytest
      
      - name: Run linting
        run: |
          uv run black --check .
          uv run ruff check .
          uv run mypy .
```

### AWS Amplify

```yaml
# amplify.yml
version: 1
backend:
  phases:
    build:
      commands:
        - echo "Installing uv..."
        - pip install uv
        - echo "Installing dependencies..."
        - uv sync --frozen --no-dev
        - echo "Building project..."
        - uv run python -m build
```

## 🚀 パフォーマンス最適化

### キャッシュ戦略

```bash
# グローバルキャッシュの場所確認
uv cache dir

# キャッシュのクリア
uv cache clean

# 特定パッケージのキャッシュクリア
uv cache clean boto3
```

### 並列インストール

```toml
[tool.uv]
# 並列ダウンロード数の設定
concurrent-downloads = 10

# ネットワークタイムアウト
timeout = 30
```

## 🛡️ セキュリティ

### 脆弱性チェック

```bash
# 依存関係の脆弱性スキャン
uv audit

# 特定パッケージの確認
uv audit --package boto3

# 修正可能な脆弱性の自動更新
uv update --upgrade-package boto3
```

### ロックファイル管理

```bash
# ロックファイルの生成
uv lock

# ロックファイルからの厳密インストール
uv sync --frozen

# ロックファイルの更新
uv lock --upgrade
```

## 📊 トラブルシューティング

### よくある問題

1. **Python version mismatch**
```bash
# 利用可能なPythonバージョン確認
uv python list

# 特定バージョンのインストール
uv python install 3.11
```

2. **依存関係の競合**
```bash
# 依存関係ツリーの確認
uv tree

# 競合の詳細表示
uv lock --verbose
```

3. **キャッシュの問題**
```bash
# キャッシュクリア後の再インストール
uv cache clean
uv sync --refresh
```

### デバッグ

```bash
# 詳細ログの有効化
uv --verbose sync

# 依存関係解決の詳細
uv lock --verbose

# 環境情報の表示
uv info
```

## 🎓 学習リソース

### 公式ドキュメント
- [uv Documentation](https://docs.astral.sh/uv/)
- [Python Packaging Guide](https://packaging.python.org/)
- [PEP 621 - pyproject.toml](https://peps.python.org/pep-0621/)

### ベストプラクティス
1. **ロックファイルをバージョン管理に含める**
2. **本番環境では`--frozen`フラグを使用**
3. **定期的な依存関係更新とテスト**
4. **セキュリティ監査の自動化**

### MAGI Systemでの活用
- Phase 1-2: 高速な開発サイクル
- Phase 3: Amplify統合での効率的ビルド
- Phase 4-6: AgentCoreでの最適化された実行環境

## 🎯 まとめ

uvを使用することで、MAGI Decision Systemの開発・デプロイメントが大幅に効率化されます：

- **開発効率**: 高速な依存関係管理
- **運用安定性**: 確定的なビルドプロセス
- **AWS統合**: 最適化されたクラウド環境での実行
- **セキュリティ**: 継続的な脆弱性管理

これらの利点により、複雑なマルチエージェントシステムの開発・運用が大幅に簡素化されます。