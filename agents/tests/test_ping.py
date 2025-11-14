#!/usr/bin/env python3
"""
AgentCore Runtime 接続テスト

使用方法:
  python test_ping.py
  
設定方法:
  1. agents/.env ファイル
  2. 環境変数 MAGI_AGENT_ARN, APP_AWS_REGION
"""

import sys
from pathlib import Path

# 共通設定モジュールをインポート
sys.path.append(str(Path(__file__).parent.parent))

try:
    from shared.config import get_config
except ImportError as e:
    print(f"❌ インポートエラー: {e}")
    print(f"   shared/config.py が存在することを確認してください")
    sys.exit(1)

import boto3
import json
import uuid
from datetime import datetime
from botocore.config import Config


def test_agent_connectivity():
    """エージェント接続テスト"""
    
    try:
        config = get_config()
        agent_runtime_arn = config.get_agent_arn()
        region = config.get_region()
    except Exception as e:
        print(f"❌ 設定読み込みエラー: {e}")
        return False
    
    boto_config = Config(
        region_name=region,
        signature_version='v4',
        retries={'max_attempts': 3, 'mode': 'standard'},
        read_timeout=30,
        connect_timeout=10
    )
    
    client = boto3.client('bedrock-agentcore', config=boto_config)
    
    print("🔍 AgentCore Runtime 接続テスト開始")
    print(f"   ARN: {agent_runtime_arn}")
    print(f"   Region: {region}")
    print("-" * 60)
    
    try:
        start_time = datetime.now()
        
        # 軽量リクエストでエージェント呼び出し
        response = client.invoke_agent_runtime(
            agentRuntimeArn=agent_runtime_arn,
            runtimeSessionId=f"health-check-{uuid.uuid4()}",
            payload=json.dumps({"prompt": "ping"}).encode('utf-8')
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"✅ エージェント接続成功!")
        print(f"   レスポンス時間: {duration:.3f}秒")
        print(f"   HTTPステータス: {response['ResponseMetadata']['HTTPStatusCode']}")
        print(f"   Request-ID: {response['ResponseMetadata'].get('RequestId', 'N/A')}")
        
        # ストリーミングレスポンス確認
        if 'response' in response:
            print("   ストリーミング: 有効")
            try:
                for line in response['response'].iter_lines(chunk_size=10):
                    if line:
                        print(f"   Response: {line.decode('utf-8')[:100]}")
                        break  # 最初の行のみ
            except Exception as e:
                print(f"   ストリーミング読み込みエラー: {e}")
        else:
            print("   ストリーミング: 無効")
            
        return True
        
    except Exception as e:
        print(f"❌ エージェント接続失敗: {e}")
        print(f"   エラータイプ: {type(e).__name__}")
        
        if hasattr(e, 'response'):
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            print(f"   エラーコード: {error_code}")
            print(f"   エラーメッセージ: {error_message}")
            
        return False


def check_runtime_status():
    """ランタイムステータス確認"""
    
    print("\n🔍 AgentCore Runtime ステータス確認")
    print("-" * 60)
    
    try:
        config = get_config()
        region = config.get_region()
        
        client = boto3.client('bedrock-agentcore', region_name=region)
        
        response = client.list_agent_runtimes()
        
        if 'agentRuntimes' in response and len(response['agentRuntimes']) > 0:
            for runtime in response['agentRuntimes']:
                print(f"Runtime: {runtime.get('agentRuntimeName', 'N/A')}")
                print(f"Status: {runtime.get('status', 'N/A')}")
                print(f"ARN: {runtime.get('agentRuntimeArn', 'N/A')}")
                print()
        else:
            print("⚠️  登録されたRuntimeが見つかりません")
            
    except Exception as e:
        print(f"❌ ステータス確認エラー: {e}")


if __name__ == "__main__":
    try:
        # 設定表示
        print("🚀 MAGI AgentCore Runtime 接続テスト")
        print("=" * 60)
        
        config = get_config()
        config.print_config()
        
        print("\n" + "=" * 60)
        
        # 接続テスト実行
        success = test_agent_connectivity()
        
        # ステータス確認
        check_runtime_status()
        
        # 結果サマリー
        print("\n" + "=" * 60)
        if success:
            print("🎉 AgentCore Runtime は正常に動作しています")
        else:
            print("⚠️  AgentCore Runtime に問題があります")
            print("   - agents/.env ファイルの設定を確認してください")
            print("   - AWS認証情報を確認してください")
            print("   - エージェントがデプロイされているか確認してください")
            
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
