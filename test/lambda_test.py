#!/usr/bin/env python3
"""
MAGI Python Agents Lambda Function Test Script

このスクリプトは、Lambda関数を直接呼び出してテストします。
エージェント設定（agentConfigs）を含むリクエストを送信し、
ストリーミングレスポンスを受信します。
"""

import json
import sys
import time
from typing import Dict, Any

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    print("Error: boto3 is not installed")
    print("Install it with: pip install boto3")
    sys.exit(1)


# Lambda関数名（環境に応じて変更）
LAMBDA_FUNCTION_NAME = "magi-python-agents"
REGION = "ap-northeast-1"


def create_test_request(question: str = "こんにちは") -> Dict[str, Any]:
    """
    テストリクエストを作成
    
    Args:
        question: テスト質問
        
    Returns:
        リクエストボディ
    """
    return {
        "question": question,
        "conversationId": "test-conversation-001",
        "agentConfigs": {
            "caspar": {
                "model": "anthropic.claude-3-7-sonnet-20250219-v1:0",
                "temperature": 0.3,
                "maxTokens": 2000,
                "topP": 0.9,
                "systemPrompt": "あなたはCASPAR（カスパー）です。保守的で現実的な視点から分析を行います。",
                "enabled": True
            },
            "balthasar": {
                "model": "amazon.nova-pro-v1:0",
                "temperature": 0.7,
                "maxTokens": 2000,
                "topP": 0.95,
                "systemPrompt": "あなたはBALTHASAR（バルタザール）です。革新的で感情的な視点から分析を行います。",
                "enabled": True
            },
            "melchior": {
                "model": "anthropic.claude-sonnet-4-5-20250929-v1:0",
                "temperature": 0.5,
                "maxTokens": 2000,
                "topP": 0.92,
                "systemPrompt": "あなたはMELCHIOR（メルキオール）です。バランス型で科学的な視点から分析を行います。",
                "enabled": True
            },
            "solomon": {
                "model": "anthropic.claude-opus-4-1-20250805-v1:0",
                "temperature": 0.4,
                "maxTokens": 3000,
                "topP": 0.9,
                "systemPrompt": "あなたはSOLOMON Judgeです。3賢者の回答を評価・統合し、最終判断を下します。",
                "enabled": True
            }
        }
    }


def invoke_lambda_sync(function_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Lambda関数を同期的に呼び出す（非ストリーミング）
    
    Args:
        function_name: Lambda関数名
        payload: リクエストペイロード
        
    Returns:
        レスポンス
    """
    print(f"\n{'='*60}")
    print(f"Lambda関数を呼び出し中: {function_name}")
    print(f"リージョン: {REGION}")
    print(f"{'='*60}\n")
    
    # Lambda クライアントを作成
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    try:
        # Lambda関数を呼び出し
        print("リクエスト送信中...")
        print(f"質問: {payload['question']}")
        print(f"エージェント設定: {len(payload.get('agentConfigs', {}))} agents")
        
        start_time = time.time()
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',  # 同期呼び出し
            Payload=json.dumps(payload)
        )
        
        elapsed_time = time.time() - start_time
        
        # レスポンスを解析
        status_code = response['StatusCode']
        print(f"\nステータスコード: {status_code}")
        print(f"実行時間: {elapsed_time:.2f}秒")
        
        if status_code == 200:
            # ペイロードを読み取り
            response_payload = json.loads(response['Payload'].read())
            print("\n✅ Lambda関数の呼び出しに成功しました")
            return response_payload
        else:
            print(f"\n❌ エラー: ステータスコード {status_code}")
            return {"error": f"Status code: {status_code}"}
            
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"\n❌ AWS エラー: {error_code}")
        print(f"メッセージ: {error_message}")
        return {"error": error_message}
    except Exception as e:
        print(f"\n❌ 予期しないエラー: {str(e)}")
        return {"error": str(e)}


def invoke_lambda_streaming(function_name: str, payload: Dict[str, Any]):
    """
    Lambda関数をストリーミングモードで呼び出す
    
    Args:
        function_name: Lambda関数名
        payload: リクエストペイロード
    """
    print(f"\n{'='*60}")
    print(f"Lambda関数をストリーミングモードで呼び出し中: {function_name}")
    print(f"リージョン: {REGION}")
    print(f"{'='*60}\n")
    
    # Lambda クライアントを作成
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    try:
        print("ストリーミングリクエスト送信中...")
        print(f"質問: {payload['question']}")
        print(f"エージェント設定:")
        for agent_id, config in payload.get('agentConfigs', {}).items():
            print(f"  - {agent_id}: {config['model']}")
        
        start_time = time.time()
        
        # Lambda Response Streamingを使用
        response = lambda_client.invoke_with_response_stream(
            FunctionName=function_name,
            Payload=json.dumps(payload)
        )
        
        print("\n" + "="*60)
        print("ストリーミングレスポンス:")
        print("="*60 + "\n")
        
        # ストリームを処理
        event_stream = response['EventStream']
        event_count = 0
        
        for event in event_stream:
            if 'PayloadChunk' in event:
                # チャンクを取得
                chunk = event['PayloadChunk']['Payload'].decode('utf-8')
                
                # SSEイベントを解析
                if chunk.startswith('data: '):
                    event_data = chunk[6:].strip()  # 'data: ' を削除
                    
                    try:
                        event_json = json.loads(event_data)
                        event_type = event_json.get('type')
                        agent_id = event_json.get('agentId', 'N/A')
                        
                        event_count += 1
                        
                        # イベントタイプに応じて表示
                        if event_type == 'system_start':
                            print(f"🚀 システム開始")
                            print(f"   {event_json.get('data', {})}")
                            
                        elif event_type == 'agent_start':
                            print(f"\n👤 エージェント開始: {agent_id}")
                            data = event_json.get('data', {})
                            print(f"   名前: {data.get('name')}")
                            print(f"   タイプ: {data.get('type')}")
                            print(f"   モデル: {data.get('model', 'N/A')}")
                            
                        elif event_type == 'agent_thinking':
                            # 思考プロセスは簡潔に表示
                            pass
                            
                        elif event_type == 'agent_chunk':
                            # テキストチャンクは表示しない（多すぎるため）
                            pass
                            
                        elif event_type == 'agent_complete':
                            data = event_json.get('data', {})
                            print(f"✅ エージェント完了: {agent_id}")
                            print(f"   判断: {data.get('decision')}")
                            print(f"   信頼度: {data.get('confidence')}")
                            print(f"   実行時間: {data.get('executionTime')}ms")
                            
                        elif event_type == 'judge_start':
                            print(f"\n⚖️  SOLOMON Judge 開始")
                            
                        elif event_type == 'judge_complete':
                            data = event_json.get('data', {})
                            print(f"\n✅ SOLOMON Judge 完了")
                            print(f"   最終判断: {data.get('finalDecision')}")
                            print(f"   投票結果: {data.get('votingResult')}")
                            print(f"   信頼度: {data.get('confidence')}")
                            
                        elif event_type == 'complete':
                            print(f"\n🎉 全体完了")
                            print(f"   {event_json.get('data', {}).get('message')}")
                            
                        elif event_type == 'error':
                            print(f"\n❌ エラー発生")
                            print(f"   {event_json.get('data', {})}")
                            
                    except json.JSONDecodeError:
                        # JSONでない場合はそのまま表示
                        print(chunk, end='')
                        
            elif 'InvokeComplete' in event:
                elapsed_time = time.time() - start_time
                print(f"\n{'='*60}")
                print(f"ストリーミング完了")
                print(f"総イベント数: {event_count}")
                print(f"実行時間: {elapsed_time:.2f}秒")
                print(f"{'='*60}")
                
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"\n❌ AWS エラー: {error_code}")
        print(f"メッセージ: {error_message}")
    except Exception as e:
        print(f"\n❌ 予期しないエラー: {str(e)}")
        import traceback
        traceback.print_exc()


def test_simple_request():
    """
    シンプルなリクエストでテスト
    """
    print("\n" + "="*60)
    print("テスト1: シンプルなリクエスト")
    print("="*60)
    
    payload = {
        "question": "こんにちは",
        "conversationId": "test-001"
    }
    
    result = invoke_lambda_sync(LAMBDA_FUNCTION_NAME, payload)
    print("\nレスポンス:")
    print(json.dumps(result, indent=2, ensure_ascii=False))


def test_with_agent_configs():
    """
    エージェント設定を含むリクエストでテスト
    """
    print("\n" + "="*60)
    print("テスト2: エージェント設定を含むリクエスト")
    print("="*60)
    
    payload = create_test_request("AIの未来について教えてください")
    
    # ストリーミングモードで呼び出し
    invoke_lambda_streaming(LAMBDA_FUNCTION_NAME, payload)


def test_disabled_agent():
    """
    無効化されたエージェントのテスト
    """
    print("\n" + "="*60)
    print("テスト3: 無効化されたエージェント")
    print("="*60)
    
    payload = create_test_request("テスト質問")
    # CASPARを無効化
    payload['agentConfigs']['caspar']['enabled'] = False
    
    invoke_lambda_streaming(LAMBDA_FUNCTION_NAME, payload)


def main():
    """
    メイン関数
    """
    print("\n" + "="*60)
    print("MAGI Python Agents Lambda Function Test")
    print("="*60)
    
    # AWS認証情報を確認
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"\nAWSアカウント: {identity['Account']}")
        print(f"ユーザー: {identity['Arn']}")
    except Exception as e:
        print(f"\n❌ AWS認証エラー: {str(e)}")
        print("\nAWS認証情報を設定してください:")
        print("  aws configure")
        print("または環境変数を設定:")
        print("  export AWS_ACCESS_KEY_ID=...")
        print("  export AWS_SECRET_ACCESS_KEY=...")
        sys.exit(1)
    
    # テストメニュー
    print("\n" + "="*60)
    print("テストメニュー:")
    print("="*60)
    print("1. シンプルなリクエスト（同期）")
    print("2. エージェント設定を含むリクエスト（ストリーミング）")
    print("3. 無効化されたエージェントのテスト")
    print("4. すべてのテストを実行")
    print("0. 終了")
    
    choice = input("\n選択してください (0-4): ").strip()
    
    if choice == '1':
        test_simple_request()
    elif choice == '2':
        test_with_agent_configs()
    elif choice == '3':
        test_disabled_agent()
    elif choice == '4':
        test_simple_request()
        test_with_agent_configs()
        test_disabled_agent()
    elif choice == '0':
        print("終了します")
        sys.exit(0)
    else:
        print("無効な選択です")
        sys.exit(1)
    
    print("\n✅ テスト完了")


if __name__ == "__main__":
    main()
