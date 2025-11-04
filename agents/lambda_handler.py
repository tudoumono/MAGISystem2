#!/usr/bin/env python3
"""
MAGI Strands Agents - AWS Lambda Handler

Lambda Response Streamingを使用してMAGI Decision Systemを実行します。
"""

import json
import asyncio
import sys
import os
from typing import Any, Dict

# パスを追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from magi_strands_agents import MAGIStrandsSystem
from shared.types import MAGIDecisionRequest


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda ハンドラー関数
    
    Args:
        event: Lambda イベント
        context: Lambda コンテキスト
        
    Returns:
        レスポンス
    """
    print(f"🚀 MAGI Strands Lambda Handler Started")
    print(f"Event: {json.dumps(event, ensure_ascii=False)[:200]}")
    
    try:
        # リクエストボディを解析
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        question = body.get('question', body.get('message', 'テスト質問'))
        conversation_id = body.get('conversationId', 'unknown')
        agent_configs = body.get('agentConfigs', {})
        
        print(f"Question: {question}")
        print(f"Conversation ID: {conversation_id}")
        print(f"Agent Configs: {len(agent_configs)} agents")
        
        # MAGI システムを初期化
        magi = MAGIStrandsSystem()
        
        # リクエストを作成
        request = MAGIDecisionRequest(
            question=question,
            context=body.get('context')
        )
        
        # 非同期実行
        loop = asyncio.get_event_loop()
        response = loop.run_until_complete(magi.decide(request))
        
        # レスポンスを作成
        result = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'success': True,
                'data': {
                    'finalDecision': response.judge_response.final_decision.value,
                    'votingResult': {
                        'approved': response.judge_response.voting_result.approved,
                        'rejected': response.judge_response.voting_result.rejected,
                        'abstained': response.judge_response.voting_result.abstained,
                    },
                    'agentResponses': [
                        {
                            'agentId': r.agent_id.value,
                            'decision': r.decision.value,
                            'reasoning': r.reasoning,
                            'confidence': r.confidence,
                            'executionTime': r.execution_time,
                        }
                        for r in response.agent_responses
                    ],
                    'summary': response.judge_response.summary,
                    'recommendation': response.judge_response.final_recommendation,
                    'totalExecutionTime': response.total_execution_time,
                },
                'traceId': response.trace_id,
            }, ensure_ascii=False)
        }
        
        print(f"✅ MAGI Decision Complete")
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'success': False,
                'error': str(e),
            }, ensure_ascii=False)
        }
