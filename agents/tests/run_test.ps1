# MAGIストリーミング分類テスト実行スクリプト (PowerShell)

Write-Host "🧪 MAGI Streaming Classification Test" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# testsディレクトリに移動
Set-Location $PSScriptRoot

# 環境変数の確認
if (-not $env:MAGI_AGENT_ARN) {
    Write-Host "⚠️  MAGI_AGENT_ARN environment variable not set" -ForegroundColor Yellow
    Write-Host "Using configuration from .env files..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Using MAGI_AGENT_ARN: $env:MAGI_AGENT_ARN" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pip install boto3 -q

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Running streaming test..." -ForegroundColor Cyan
python test_magi.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Test execution failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Green
Write-Host ""

# 出力ファイルの確認
if (Test-Path "streaming_output") {
    Write-Host "📁 Output files:" -ForegroundColor Cyan
    Get-ChildItem streaming_output -File | Format-Table Name, Length, LastWriteTime -AutoSize
    
    Write-Host ""
    Write-Host "📄 View results:" -ForegroundColor Cyan
    Write-Host "  Get-Content streaming_output\caspar_stream.txt" -ForegroundColor Gray
    Write-Host "  Get-Content streaming_output\balthasar_stream.txt" -ForegroundColor Gray
    Write-Host "  Get-Content streaming_output\melchior_stream.txt" -ForegroundColor Gray
    Write-Host "  Get-Content streaming_output\solomon_stream.txt" -ForegroundColor Gray
    Write-Host "  Get-Content streaming_output\summary.txt" -ForegroundColor Gray
    
    # サマリーファイルがあれば内容を表示
    if (Test-Path "streaming_output\summary.txt") {
        Write-Host ""
        Write-Host "📊 Test Summary:" -ForegroundColor Yellow
        Write-Host "=================" -ForegroundColor Yellow
        Get-Content streaming_output\summary.txt
    }
} else {
    Write-Host "⚠️  No output directory found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 MAGI test workflow completed successfully!" -ForegroundColor Green