# MAGI AgentCore Runtime Ping テスト実行例 (PowerShell)

# 環境変数設定
$env:MAGI_AGENT_ARN = "arn:aws:bedrock-agentcore:ap-northeast-1:262152767881:runtime/magi_agent-4ORNam2cHb"
$env:AWS_REGION = "ap-northeast-1"

# テスト実行
Write-Host "🚀 MAGI Ping テスト実行" -ForegroundColor Green
Write-Host "Agent ARN: $env:MAGI_AGENT_ARN" -ForegroundColor Cyan
Write-Host "Region: $env:AWS_REGION" -ForegroundColor Cyan
Write-Host ""

python test_ping.py