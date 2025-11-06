#!/bin/bash
# MAGI AgentCore Runtime Ping テスト実行例

echo "🚀 MAGI Ping テスト実行"
echo "設定は agents/.env ファイルから読み込まれます"
echo ""

# .envファイルの存在確認
if [ ! -f "../.env" ]; then
    echo "❌ agents/.env ファイルが見つかりません"
    echo "agents/.env.template をコピーして設定してください:"
    echo "  cp ../agents/.env.template ../agents/.env"
    echo "  # 設定を編集"
    exit 1
fi

echo "✅ agents/.env ファイルが見つかりました"
echo ""

# テスト実行
python test_ping.py