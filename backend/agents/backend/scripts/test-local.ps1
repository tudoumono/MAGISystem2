# MAGI AgentCore Backend ローカルテストスクリプト (PowerShell)

Write-Host "🧪 MAGI AgentCore Backend ローカルテスト" -ForegroundColor Cyan
Write-Host ""

# テストデータ
$body = @{
    question = "AIの未来について教えてください"
} | ConvertTo-Json

Write-Host "📝 テスト質問: AIの未来について教えてください" -ForegroundColor Yellow
Write-Host ""

# POSTリクエスト送信
Write-Host "🚀 /api/invocations にリクエスト送信中..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/api/invocations" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 300

    Write-Host ""
    Write-Host "✅ レスポンス受信成功" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📄 レスポンス内容:" -ForegroundColor Yellow
    Write-Host $response.Content
    
} catch {
    Write-Host ""
    Write-Host "❌ エラー発生" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "エラー詳細:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

Write-Host ""
Write-Host "🏁 テスト完了" -ForegroundColor Cyan