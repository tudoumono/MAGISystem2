#!/bin/bash

# MAGISystem2 Backend デプロイスクリプト
# 
# このスクリプトはバックエンドAPIをECRにプッシュし、
# AgentCore Runtimeにデプロイする準備を行います。
#
# 使用方法:
#   ./scripts/deploy-backend.sh
#
# 前提条件:
#   - AWS CLIが設定済み
#   - Docker Buildxが利用可能
#   - 適切なIAM権限

set -e

# 設定
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
AGENT_NAME="magisystem-backend"
REPOSITORY_NAME="${AGENT_NAME}"

echo "========================================="
echo "MAGISystem2 Backend デプロイ"
echo "========================================="
echo "Account ID: ${ACCOUNT_ID}"
echo "Region: ${AWS_REGION}"
echo "Repository: ${REPOSITORY_NAME}"
echo "========================================="

# ECRリポジトリ作成（既に存在する場合は無視）
echo "ECRリポジトリを確認中..."
aws ecr create-repository \
  --repository-name ${REPOSITORY_NAME} \
  --region ${AWS_REGION} \
  2>/dev/null && echo "リポジトリを作成しました" || echo "リポジトリは既に存在します"

# ECRログイン
echo "ECRにログイン中..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin \
  ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# マルチプラットフォームビルダー作成
echo "Docker Buildxを設定中..."
docker buildx create --use --name multiarch-builder 2>/dev/null || \
  docker buildx use multiarch-builder

# イメージビルド＆プッシュ（ARM64アーキテクチャ）
echo "イメージをビルド中（ARM64）..."
docker buildx build \
  --platform linux/arm64 \
  -t ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPOSITORY_NAME}:latest \
  --push .

echo "========================================="
echo "デプロイ完了！"
echo "========================================="
echo "イメージURI:"
echo "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPOSITORY_NAME}:latest"
echo ""
echo "次のステップ:"
echo "1. AgentCore Runtimeコンソールでランタイムを作成"
echo "2. 上記のイメージURIを指定"
echo "3. ポート8080を設定"
echo "4. Cognito認証を設定"
echo "========================================="
