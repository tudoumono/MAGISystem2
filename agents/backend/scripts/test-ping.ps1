# MAGI AgentCore Backend ヘルスチェックスクリプト (PowerShell)

Write-Host "🏥 MAGI AgentCore Backend ヘルスチェック" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 /api/ping にリクエスト送信中..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod `
        -Uri "http://localhost:8080/api/ping" `
        -Method GET `
        -TimeoutSec 10

    Write-Host ""
    Write-Host "✅ ヘルスチェック成功" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 システム情報:" -ForegroundColor Yellow
    Write-Host "  Status: $($response.status)" -ForegroundColor Cyan
    Write-Host "  Service: $($response.service)" -ForegroundColor Cyan
    Write-Host "  Version: $($response.version)" -ForegroundColor Cyan
    Write-Host "  Uptime: $($response.uptime) seconds" -ForegroundColor Cyan
    Write-Host "  Response Time: $($response.responseTime)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🤖 エージェント状態:" -ForegroundColor Yellow
    Write-Host "  CASPAR: $($response.agents.caspar.status)" -ForegroundColor Cyan
    Write-Host "  BALTHASAR: $($response.agents.balthasar.status)" -ForegroundColor Cyan
    Write-Host "  MELCHIOR: $($response.agents.melchior.status)" -ForegroundColor Cyan
    Write-Host "  SOLOMON: $($response.agents.solomon.status)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔍 チェック結果:" -ForegroundColor Yellow
    Write-Host "  Python: $($response.checks.python.status)" -ForegroundColor Cyan
    Write-Host "  Memory: $($response.checks.memory.status) ($($response.checks.memory.details.used)MB / $($response.checks.memory.details.total)MB)" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ ヘルスチェック失敗" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "🏁 ヘルスチェック完了" -ForegroundColor Cyan