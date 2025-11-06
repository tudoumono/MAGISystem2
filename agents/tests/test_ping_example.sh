#!/bin/bash
# MAGI AgentCore Runtime Ping テスト実行例

# 環境変数設定
export MAGI_AGENT_ARN="arn:aws:bedrock-agentcore:ap-northeast-1:262152767881:runtime/magi_agent-4ORNam2cHb"
export AWS_REGION="ap-northeast-1"

# テスト実行
echo "🚀 MAGI Ping テスト実行"
echo "Agent ARN: $MAGI_AGENT_ARN"
echo "Region: $AWS_REGION"
echo ""

python test_ping.py