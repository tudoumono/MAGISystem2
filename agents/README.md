/**
 * Strands Agents - MAGI Decision System
 * 
 * このディレクトリはエヴァンゲリオンのMAGIシステムにインスパイアされた
 * 多エージェント意思決定システムのStrands Agents実装を含みます。
 * 
 * システム構成:
 * - SOLOMON Judge: 統括者として3賢者を管理し、最終判断を行う
 * - CASPAR: 保守的・現実的な視点（リスク重視）
 * - BALTHASAR: 革新的・感情的な視点（創造性重視）
 * - MELCHIOR: バランス型・科学的な視点（論理性重視）
 * 
 * 学習ポイント:
 * - Strands Agentsフレームワークの使用方法
 * - A2A (Agent-to-Agent) プロトコルによる通信
 * - マルチエージェント協調による意思決定
 * - Amazon Bedrock AgentCoreとの統合パターン
 */

# Strands Agents - MAGI Decision System

## Overview

エヴァンゲリオンのMAGIシステムにインスパイアされた多エージェント意思決定システムです。

### Architecture

```
SOLOMON Judge (Orchestrator)
    ↓ Tool Calls
┌─────────┬─────────┬─────────┐
│ CASPAR  │BALTHASAR│MELCHIOR │
│(保守的) │(革新的) │(バランス)│
│ Tool    │ Tool    │ Tool    │
└─────────┴─────────┴─────────┘
```

### Agent Roles

- **SOLOMON Judge**: 統括者として3賢者の投票を集計し、最終的な可決/否決を決定
- **CASPAR**: 保守的・現実的な視点で可決/否決を判断（リスク重視）
- **BALTHASAR**: 革新的・感情的な視点で可決/否決を判断（創造性重視）
- **MELCHIOR**: バランス型・科学的な視点で可決/否決を判断（論理性重視）

## Directory Structure

```
agents/
├── README.md                 # このファイル
├── requirements.txt          # Python依存関係
├── shared/                   # 共通ユーティリティ
│   ├── __init__.py
│   ├── types.py             # 共通型定義
│   ├── prompts.py           # プロンプト管理
│   └── utils.py             # ユーティリティ関数
├── solomon/                  # SOLOMON Judge
│   ├── __init__.py
│   ├── agent.py             # SOLOMONエージェント実装
│   └── tools.py             # 3賢者ツール定義
├── caspar/                   # CASPAR エージェント
│   ├── __init__.py
│   └── agent.py
├── balthasar/                # BALTHASAR エージェント
│   ├── __init__.py
│   └── agent.py
├── melchior/                 # MELCHIOR エージェント
│   ├── __init__.py
│   └── agent.py
└── tests/                    # テスト
    ├── __init__.py
    ├── test_agents.py
    └── test_integration.py
```

## Setup Instructions

### Prerequisites
- Python 3.11+ 
- [uv](https://docs.astral.sh/uv/) - Fast Python package manager

### Installation

1. uvのインストール（まだの場合）:
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# または pip経由
pip install uv
```

2. プロジェクトのセットアップ:
```bash
cd agents

# 依存関係のインストール
uv sync

# 開発用依存関係も含める場合
uv sync --extra dev
```

3. 環境変数の設定:
```bash
export AWS_REGION=us-east-1
export BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

4. エージェントのテスト:
```bash
# 基本テスト
uv run python simple_test.py

# 包括的テスト
uv run python run_tests.py

# pytest実行
uv run pytest tests/ -v

# デモ実行
uv run python demo.py
```

## Integration with Bedrock AgentCore

このStrands Agentsシステムは、Amazon Bedrock AgentCoreと統合されます：

1. **Runtime Integration**: AgentCore Runtimeでの実行
2. **Observability**: OpenTelemetryによるトレーシング
3. **Memory Management**: AgentCore Memory Serviceとの連携
4. **A2A Protocol**: エージェント間通信の標準化

## Development Phases

- **Phase 1-2**: モックデータでの基本実装とテスト ✅
- **Phase 3**: 部分統合（認証・データは実データ、エージェントはモック）
- **Phase 4-6**: 完全統合（Bedrock AgentCore + 実データ）

## Why uv?

このプロジェクトでは[uv](https://docs.astral.sh/uv/)を使用してPython依存関係を管理しています：

### 利点
- **高速**: Rustで実装された高速パッケージマネージャー
- **AWS互換**: Amplify Functions、AgentCore、Lambda環境で完全サポート
- **現代的**: pyproject.tomlベースの標準的なPythonプロジェクト管理
- **セキュリティ**: 依存関係の脆弱性チェック機能
- **再現性**: uv.lockによる確定的な依存関係解決

### AWS統合での利点
- **Amplify Functions**: uvで管理された依存関係は自動的にデプロイ
- **AgentCore**: Python環境での依存関係解決が高速化
- **Lambda Layers**: uvによる効率的なレイヤー構築
- **Container**: Dockerイメージでのビルド時間短縮