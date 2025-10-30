# MAGISystem2 Backend - AgentCore Runtime用Dockerfile
# 
# このDockerfileはAmplify Hostingのストリーミング制限を回避するため、
# バックエンドAPIをAgentCore Runtimeにデプロイするために使用されます。
#
# 要件:
# - ARM64アーキテクチャ（AgentCore Runtime要件）
# - ポート8080でリッスン
# - /invocations と /ping エンドポイント提供
#
# 参考: https://qiita.com/moritalous/items/ea695f8a328585e1313b

FROM node:18-alpine AS base

# 依存関係のインストール
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# ソースコードのビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js standalone出力でビルド
RUN npm run build

# プロダクション用イメージ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# .nextディレクトリの準備
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Standalone出力をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
