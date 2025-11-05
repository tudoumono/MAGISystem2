#!/bin/bash
# MAGIストリーミング分類テスト実行スクリプト

echo "🧪 MAGI Streaming Classification Test"
echo "======================================"
echo ""

# testsディレクトリに移動
cd "$(dirname "$0")"

# 環境変数の確認
if [ -z "$MAGI_AGENT_ARN" ]; then
    echo "⚠️  MAGI_AGENT_ARN environment variable not set"
    echo "Using default ARN from script..."
else
    echo "✅ Using MAGI_AGENT_ARN: $MAGI_AGENT_ARN"
fi

echo ""
echo "📦 Installing dependencies..."
pip install boto3 -q

echo ""
echo "🚀 Running streaming test..."
python test_magi.py

echo ""
echo "✅ Test complete!"
echo ""
echo "📁 Output files:"
ls -lh streaming_output/

echo ""
echo "📄 View results:"
echo "  cat streaming_output/caspar_stream.txt"
echo "  cat streaming_output/balthasar_stream.txt"
echo "  cat streaming_output/melchior_stream.txt"
echo "  cat streaming_output/solomon_stream.txt"
echo "  cat streaming_output/summary.txt"
