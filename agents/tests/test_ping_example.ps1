# MAGI AgentCore Runtime Ping テスト実行例 (PowerShell)

Write-Host "🚀 MAGI Ping テスト実行" -ForegroundColor Green
Write-Host "設定は agents/.env ファイルから読み込まれます" -ForegroundColor Cyan
Write-Host ""

# .envファイルの存在確認
if (-not (Test-Path "../.env")) {
    Write-Host "❌ agents/.env ファイルが見つかりません" -ForegroundColor Red
    Write-Host "agents/.env.template をコピーして設定してください:" -ForegroundColor Yellow
    Write-Host "  Copy-Item ../.env.template ../.env" -ForegroundColor Yellow
    Write-Host "  # 設定を編集" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ agents/.env ファイルが見つかりました" -ForegroundColor Green
Write-Host ""

# テスト実行
python test_ping.py