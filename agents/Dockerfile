# MAGI AgentCore Runtime Dockerfile
# Node.js + Python統合版（参考記事完全準拠）
#
# このDockerfileは1つのコンテナ内でNext.jsバックエンドとPythonエージェントを統合します。
# AgentCore Runtime仕様に準拠（ポート8080、/invocations、/ping）

# ベースイメージ: Ubuntu 22.04 (glibc 2.35対応)
FROM ubuntu:22.04

# 作業ディレクトリ設定
WORKDIR /app

# 非対話モード設定
ENV DEBIAN_FRONTEND=noninteractive

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3.11 \
    python3.11-dev \
    python3.11-venv \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Python3.11をデフォルトに設定
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Node.js 18.x インストール (Ubuntu用)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Python依存関係のコピーとインストール
COPY requirements.txt pyproject.toml ./
COPY shared/ ./shared/
RUN pip install --no-cache-dir -r requirements.txt

# Pythonエージェントファイルのコピー
COPY magi_agent.py ./
COPY shared/ ./shared/

# Next.jsバックエンドのコピーとビルド
COPY backend/package*.json ./backend/
WORKDIR /app/backend

# 開発依存関係を含めてインストール（ビルドに必要）
RUN npm ci

# Next.jsソースコードのコピー
COPY backend/ ./

# 実行権限を付与してNext.jsビルド
RUN chmod +x node_modules/.bin/* && npm run build

# standalone出力の静的ファイルをコピー
RUN if [ -d ".next/static" ]; then \
      mkdir -p .next/standalone/.next && \
      cp -r .next/static .next/standalone/.next/; \
    fi

# 本番用依存関係のみ再インストール（イメージサイズ削減）
RUN npm prune --production

# 実行時環境変数
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV PYTHONPATH=/app
ENV MAGI_SCRIPT_PATH=/app/magi_agent.py
ENV PYTHON_PATH=python

# ポート8080を公開（AgentCore Runtime標準）
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/ping || exit 1

# Next.jsバックエンドを起動
CMD ["npm", "start"]