#!/usr/bin/env python3
"""
Bedrock API Test - 実際のClaude APIテスト

このスクリプトは実際のAmazon Bedrock Claude APIを呼び出して
MAGI Decision Systemの基本動作をテストします。

学習ポイント:
- Bedrock Runtime APIの使用方法
- Claude 3.5 Sonnetとの実際の通信
- エラーハンドリングとレスポンス解析
"""

import json
import boto3
import time
from datetime import datetime
from typing import Dict, Any, Optional

def test_bedrock_connection():
    """Bedrock接続テスト"""
    print("🔗 Testing Bedrock connection...")
    
    try:
        client = boto3.client('bedrock-runtime', region_name='ap-northeast-1')
        
        # 利用可能なモデルを確認（別のAPIを使用）
        bedrock_client = boto3.client('bedrock', region_name='ap-northeast-1')
        models = bedrock_client.list_foundation_models()
        
        claude_models = [
            model for model in models['modelSummaries'] 
            if 'claude' in model['modelId'].lower()
        ]
        
        print(f"✅ Bedrock connection successful!")
        print(f"📋 Available Claude models: {len(claude_models)}")
        for model in claude_models[:3]:  # 最初の3つを表示
            print(f"   - {model['modelId']}: {model['modelName']}")
        
        return client
        
    except Exception as e:
        print(f"❌ Bedrock connection failed: {e}")
        return None

def test_claude_api_call(client, model_id: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"):
    """Claude APIの基本テスト"""
    print(f"\n🤖 Testing Claude API call with {model_id}...")
    
    try:
        # テスト用のプロンプト
        test_prompt = """
あなたはMAGI Decision Systemのテストエージェントです。
以下の質問に対して、簡潔に回答してください：

質問: 「新しいAIシステムを導入すべきか？」

以下の形式で回答してください：
- 判断: APPROVED または REJECTED
- 理由: 判断の根拠を1-2文で
- 確信度: 0.0-1.0の数値
"""

        # Bedrock APIリクエスト
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "temperature": 0.5,
            "messages": [
                {
                    "role": "user",
                    "content": test_prompt
                }
            ]
        }
        
        start_time = time.time()
        
        response = client.invoke_model(
            modelId=model_id,
            body=json.dumps(request_body),
            contentType='application/json',
            accept='application/json'
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        # レスポンス解析
        response_body = json.loads(response['body'].read())
        
        print(f"✅ Claude API call successful!")
        print(f"⏱️  Execution time: {execution_time}ms")
        print(f"📝 Response:")
        print(f"   Content: {response_body['content'][0]['text'][:200]}...")
        print(f"   Usage: {response_body.get('usage', 'N/A')}")
        
        return {
            "success": True,
            "content": response_body['content'][0]['text'],
            "execution_time": execution_time,
            "usage": response_body.get('usage', {}),
            "model_id": model_id
        }
        
    except Exception as e:
        print(f"❌ Claude API call failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "model_id": model_id
        }

def test_magi_agent_simulation(client):
    """MAGI 3賢者のシミュレーションテスト"""
    print(f"\n🧠 Testing MAGI 3-Sage simulation...")
    
    agents = {
        "CASPAR": {
            "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0",
            "personality": "保守的・現実的な視点。リスクを重視し、慎重な判断を行う。",
            "temperature": 0.3
        },
        "BALTHASAR": {
            "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0", 
            "personality": "革新的・感情的な視点。創造性と新しい可能性を重視する。",
            "temperature": 0.7
        },
        "MELCHIOR": {
            "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0",
            "personality": "バランス型・科学的な視点。データと論理に基づいて判断する。",
            "temperature": 0.5
        }
    }
    
    question = "リモートワークを全社的に導入すべきか？"
    
    results = {}
    
    for agent_name, config in agents.items():
        print(f"\n🤖 Testing {agent_name}...")
        
        prompt = f"""
あなたは{agent_name} - MAGI Decision Systemの賢者です。

あなたの特性: {config['personality']}

以下の質問について、あなたの視点から判断してください：
質問: {question}

以下の形式で回答してください：
判断: APPROVED または REJECTED
理由: あなたの視点からの判断根拠（2-3文）
確信度: 0.0-1.0の数値
"""

        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "temperature": config['temperature'],
            "messages": [
                {
                    "role": "user", 
                    "content": prompt
                }
            ]
        }
        
        try:
            start_time = time.time()
            
            response = client.invoke_model(
                modelId=config['model_id'],
                body=json.dumps(request_body),
                contentType='application/json',
                accept='application/json'
            )
            
            execution_time = int((time.time() - start_time) * 1000)
            response_body = json.loads(response['body'].read())
            content = response_body['content'][0]['text']
            
            results[agent_name] = {
                "success": True,
                "content": content,
                "execution_time": execution_time,
                "temperature": config['temperature']
            }
            
            print(f"✅ {agent_name} response ({execution_time}ms):")
            print(f"   {content[:150]}...")
            
        except Exception as e:
            print(f"❌ {agent_name} failed: {e}")
            results[agent_name] = {
                "success": False,
                "error": str(e)
            }
    
    return results

def main():
    """メインテスト実行"""
    print("🚀 MAGI Decision System - Bedrock Integration Test")
    print("=" * 60)
    print(f"Test Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Region: ap-northeast-1")
    print()
    
    # 1. Bedrock接続テスト
    client = test_bedrock_connection()
    if not client:
        print("❌ Cannot proceed without Bedrock connection")
        return
    
    # 2. 基本Claude APIテスト
    basic_test = test_claude_api_call(client)
    if not basic_test['success']:
        print("❌ Basic Claude API test failed")
        return
    
    # 3. MAGI 3賢者シミュレーション
    magi_results = test_magi_agent_simulation(client)
    
    # 4. 結果サマリー
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    successful_agents = sum(1 for result in magi_results.values() if result['success'])
    total_agents = len(magi_results)
    
    print(f"✅ Basic API Test: {'PASSED' if basic_test['success'] else 'FAILED'}")
    print(f"🧠 MAGI Agents Test: {successful_agents}/{total_agents} agents successful")
    
    if successful_agents == total_agents:
        print("\n🎉 All tests passed! Ready for Strands Agents integration.")
        print("\n🚀 Next steps:")
        print("  1. Implement actual Strands Agents SDK integration")
        print("  2. Create SOLOMON orchestrator")
        print("  3. Integrate with Amplify Gateway")
    else:
        print(f"\n⚠️  {total_agents - successful_agents} agents failed. Check configuration.")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()