#!/usr/bin/env python3
"""
AgentCore Runtime GET /ping エンドポイントテスト

使用方法:
  python test_ping.py
  
設定方法:
  1. agents/.env ファイル
  2. 環境変数 MAGI_AGENT_ARN, APP_AWS_REGION (または AWS_REGION)
  3. .bedrock_agentcore.yaml ファイル（自動フォールバック）
"""

import sys
from pathlib import Path

# 共通設定モジュールをインポート
sys.path.append(str(Path(__file__).parent.parent))
from shared.config import get_config

import boto3
import json
import uuid
from datetime import datetime
from botocore.config import Config

def test_ping_endpoint():
    """GET /ping エンドポイントをテスト"""
    
    # 設定読み込み
    try:
        config = get_config()
        agent_runtime_arn = config.get_agent_arn()
        region = config.get_region()
    except ValueError as e:
        print(f"❌ 設定エラー: {e}")
        return False
    
    # Boto3クライアント設定
    config = Config(
        region_name=region,
        signature_version='v4',
        retries={'max_attempts': 3, 'mode': 'standard'},
        read_timeout=30,
        connect_timeout=10
    )
    
    client = boto3.client('bedrock-agentcore', config=config)
    
    print("🔍 AgentCore Runtime Ping テスト開始")
    print(f"   ARN: {agent_runtime_arn}")
    print(f"   Region: {region}")
    print("-" * 60)
    
    try:
        start_time = datetime.now()
        
        # Pingリクエスト送信
        # Note: bedrock-agentcore APIには直接的な/pingエンドポイントがないため、
        # 軽量なpayloadでヘルスチェックを実行
        response = client.invoke_agent_runtime(
            agentRuntimeArn=agent_runtime_arn,
            runtimeSessionId=f"ping-test-{uuid.uuid4()}",
            payload=json.dumps({"action": "ping", "test": True}).encode('utf-8')
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"✅ Ping成功!")
        print(f"   レスポンス時間: {duration:.3f}秒")
        print(f"   HTTPステータス: {response['ResponseMetadata']['HTTPStatusCode']}")
        
        # レスポンスヘッダー確認
        headers = response['ResponseMetadata'].get('HTTPHeaders', {})
        print(f"   Content-Type: {headers.get('content-type', 'N/A')}")
        print(f"   Request-ID: {response['ResponseMetadata'].get('RequestId', 'N/A')}")
        
        # ストリーミングレスポンス確認
        if 'EventStream' in response:
            print("   ストリーミング: 有効")
            
            # 最初のイベントのみ確認
            event_count = 0
            for event in response['EventStream']:
                if event_count >= 1:  # 最初の1イベントのみ
                    break
                    
                if 'chunk' in event:
                    chunk_data = event['chunk'].get('bytes', b'')
                    if chunk_data:
                        print(f"   初回チャンク: {len(chunk_data)} bytes")
                        event_count += 1
                        
        else:
            print("   ストリーミング: 無効")
            
        return True
        
    except Exception as e:
        print(f"❌ Ping失敗: {e}")
        print(f"   エラータイプ: {type(e).__name__}")
        
        # 詳細エラー情報
        if hasattr(e, 'response'):
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            print(f"   エラーコード: {error_code}")
            print(f"   エラーメッセージ: {error_message}")
            
        return False

def test_agent_status():
    """エージェントステータス確認"""
    
    print("\n🔍 AgentCore Runtime ステータス確認")
    print("-" * 60)
    
    try:
        # AWS CLIでエージェント情報取得
        import subprocess
        
        # 設定読み込み
        try:
            config = get_config()
            agent_runtime_arn = config.get_agent_arn()
            region = config.get_region()
        except ValueError as e:
            print(f"❌ 設定読み込みエラー: {e}")
            return
            
        cmd = [
            "aws", "bedrock-agentcore", "describe-agent-runtime",
            "--agent-runtime-arn", agent_runtime_arn,
            "--region", region,
            "--output", "json"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            status_data = json.loads(result.stdout)
            print(f"✅ エージェントステータス: {status_data.get('status', 'Unknown')}")
            print(f"   作成日時: {status_data.get('createdAt', 'N/A')}")
            print(f"   更新日時: {status_data.get('updatedAt', 'N/A')}")
        else:
            print(f"❌ ステータス取得失敗: {result.stderr}")
            
    except Exception as e:
        print(f"❌ ステータス確認エラー: {e}")

if __name__ == "__main__":
    # 設定表示
    config = get_config()
    config.print_config()
    
    print("\n🚀 MAGI AgentCore Runtime Ping テスト")
    print("=" * 60)
    
    # Ping テスト実行
    ping_success = test_ping_endpoint()
    
    # ステータス確認
    test_agent_status()
    
    # 結果サマリー
    print("\n" + "=" * 60)
    if ping_success:
        print("🎉 AgentCore Runtime は正常に動作しています")
    else:
        print("⚠️  AgentCore Runtime に問題があります")
        print("   - agents/.env ファイルの設定を確認してください")
        print("   - AWS認証情報を確認してください")
        print("   - エージェントがデプロイされているか確認してください")
        print("   - ネットワーク接続を確認してください")