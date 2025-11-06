@echo off
REM MAGIストリーミング分類テスト実行スクリプト (Windows)

echo 🧪 MAGI Streaming Classification Test
echo ======================================
echo.

REM testsディレクトリに移動
cd /d "%~dp0"

REM 環境変数の確認
if "%MAGI_AGENT_ARN%"=="" (
    echo ⚠️  MAGI_AGENT_ARN environment variable not set
    echo Using default ARN from script...
) else (
    echo ✅ Using MAGI_AGENT_ARN: %MAGI_AGENT_ARN%
)

echo.
echo 📦 Installing dependencies...
pip install boto3 -q

echo.
echo 🚀 Running streaming test...
python test_magi.py

echo.
echo ✅ Test complete!
echo.
echo 📁 Output files:
dir streaming_output

echo.
echo 📄 View results:
echo   type streaming_output\caspar_stream.txt
echo   type streaming_output\balthasar_stream.txt
echo   type streaming_output\melchior_stream.txt
echo   type streaming_output\solomon_stream.txt
echo   type streaming_output\summary.txt

pause
