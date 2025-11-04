#!/usr/bin/env python3
"""
Quick Lambda Test - 簡易テストスクリプト

使い方:
    python test/quick_test.py
"""

import json
import boto3

# 設定
FUNCTION_NAME = "magi-python-agents"
REGION = "ap-northeast-1"

# テストペイロード
payload = {
    "question": "こんにちは、MAGIシステム",
    "conversationId": "quick-test-001",
    "agentConfigs": {
        "caspar": {
            "model": "anthropic.claude-3-haiku-20240307-v1:0",  # 高速・低コスト
            "temperature": 0.3,
            "maxTokens": 1000,
            "topP": 0.9,
            "systemPrompt": "あなたはCASPARです。保守的に分析してください。",
            "enabled": True
        },
        "balthasar": {
            "model": "anthropic.claude-3-haiku-20240307-v1:0",
            "temperature": 0.7,
            "maxTokens": 1000,
            "topP": 0.95,
            "systemPrompt": "あなたはBALTHASARです。革新的に分析してください。",
            "enabled": True
        },
        "melchior": {
            "model": "anthropic.claude-3-haiku-20240307-v1:0",
            "temperature": 0.5,
            "maxTokens": 1000,
            "topP": 0.92,
            "systemPrompt": "あなたはMELCHIORです。バランス良く分析してください。",
            "enabled": True
        },
        "solomon": {
            "model": "anthropic.claude-3-haiku-20240307-v1:0",
            "temperature": 0.4,
            "maxTokens": 1500,
            "topP": 0.9,
            "systemPrompt": "あなたはSOLOMON Judgeです。3賢者を評価してください。",
            "enabled": True
        }
    }
}

print("Lambda関数を呼び出し中...")
print(f"関数名: {FUNCTION_NAME}")
print(f"質問: {payload['question']}")
print()

# Lambda クライアント
lambda_client = boto3.client('lambda', region_name=REGION)

try:
    # ストリーミング呼び出し
    response = lambda_client.invoke_with_response_stream(
        FunctionName=FUNCTION_NAME,
        Payload=json.dumps(payload)
    )
    
    print("ストリーミングレスポンス:")
    print("="*60)
    
    # イベントを処理
    for event in response['EventStream']:
        if 'PayloadChunk' in event:
            chunk = event['PayloadChunk']['Payload'].decode('utf-8')
            
            # SSEイベントを解析
            if chunk.startswith('data: '):
                try:
                    event_data = json.loads(chunk[6:])
                    event_type = event_data.get('type')
                    
                    if event_type == 'agent_start':
                        agent_id = event_data.get('agentId')
                        data = event_data.get('data', {})
                        print(f"\n👤 {agent_id}: {data.get('name')} ({data.get('model', 'N/A')})")
                        
                    elif event_type == 'agent_complete':
                        agent_id = event_data.get('agentId')
                        data = event_data.get('data', {})
                        print(f"✅ {agent_id}: {data.get('decision')} (信頼度: {data.get('confidence')})")
                        
                    elif event_type == 'judge_complete':
                        data = event_data.get('data', {})
                        print(f"\n⚖️  最終判断: {data.get('finalDecision')}")
                        print(f"   投票: {data.get('votingResult')}")
                        
                    elif event_type == 'complete':
                        print(f"\n🎉 完了!")
                        
                    elif event_type == 'error':
                        print(f"\n❌ エラー: {event_data.get('data')}")
                        
                except json.JSONDecodeError:
                    pass
                    
        elif 'InvokeComplete' in event:
            print("\n" + "="*60)
            print("ストリーミング完了")
            
    print("\n✅ テスト成功")
    
except Exception as e:
    print(f"\n❌ エラー: {str(e)}")
    import traceback
    traceback.print_exc()
