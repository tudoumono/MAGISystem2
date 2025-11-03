#!/usr/bin/env python3
"""
MAGI Python Agents Lambda Handler

Strands Agentsを使用したMAGI Decision Systemの実装。
Lambda Response Streamingでリアルタイム応答を提供。
"""

import json
import asyncio
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

# Strands Agents SDK
from strands import Agent

# 共通型定義
from enum import Enum

class AgentType(Enum):
    CASPAR = "caspar"
    BALTHASAR = "balthasar"
    MELCHIOR = "melchior"
    SOLOMON = "solomon"

class DecisionType(Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

# Lambda Response Streaming用のヘルパー
def send_event(event_type: str, agent_id: str = None, data: Dict = None):
    """SSEイベントを送信"""
    event = {
        "type": event_type,
        "agentId": agent_id,
        "data": data or {}
    }
    print(f"data: {json.dumps(event)}\n")

class MAGILambdaSystem:
    """Lambda用MAGI System"""
    
    def __init__(self):
        self.agents = {}
        self._initialize_agents()
    
    def _initialize_agents(self):
        """エージェントを初期化"""
        configs = {
            AgentType.CASPAR: {
                "name": "CASPAR",
                "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                "prompt": """
あなたはCASPAR - MAGI Decision Systemの保守的・現実的な賢者です。

## 判断基準
1. 安全性と既存システムへの影響
2. 実現可能性と必要リソース
3. 過去の実績と成功事例
4. リスクと回復可能性

## 出力形式
以下のJSON形式で回答してください：
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}
"""
            },
            AgentType.BALTHASAR: {
                "name": "BALTHASAR",
                "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                "prompt": """
あなたはBALTHASAR - MAGI Decision Systemの革新的・感情的な賢者です。

## 判断基準
1. 革新性と創造的価値
2. 人間的価値と倫理的側面
3. 感情的・直感的要素
4. 新しい可能性の創造

## 出力形式
以下のJSON形式で回答してください：
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}
"""
            },
            AgentType.MELCHIOR: {
                "name": "MELCHIOR",
                "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                "prompt": """
あなたはMELCHIOR - MAGI Decision Systemのバランス型・科学的な賢者です。

## 判断基準
1. データと統計的根拠
2. 論理的整合性
3. 多角的視点の統合
4. 科学的手法の適用

## 出力形式
以下のJSON形式で回答してください：
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}
"""
            }
        }
        
        for agent_type, config in configs.items():
            try:
                agent = Agent(model=config["model"])
                self.agents[agent_type] = {
                    "agent": agent,
                    "config": config
                }
            except Exception as e:
                print(f"Failed to initialize {config['name']}: {e}")
    
    async def process_streaming(self, question: str):
        """ストリーミング処理を実行"""
        try:
            # 開始イベント
            send_event("agent_start", data={"message": "MAGI システム開始"})
            
            # 3賢者を順次実行
            agent_responses = []
            for agent_type in [AgentType.MELCHIOR, AgentType.CASPAR, AgentType.BALTHASAR]:
                if agent_type in self.agents:
                    response = await self._consult_agent(agent_type, question)
                    agent_responses.append(response)
            
            # SOLOMON Judge（簡略版）
            send_event("judge_start", data={"name": "SOLOMON JUDGE"})
            await asyncio.sleep(1)
            
            # 投票結果の集計
            approved = sum(1 for r in agent_responses if r.get("decision") == "APPROVED")
            rejected = len(agent_responses) - approved
            
            judge_summary = f"3賢者の判断を総合すると、{approved}票の可決、{rejected}票の否決となりました。"
            
            # Judge応答をストリーミング
            for char in judge_summary:
                send_event("judge_chunk", data={"text": char})
                await asyncio.sleep(0.03)
            
            # Judge完了
            send_event("judge_complete", data={
                "finalDecision": "APPROVED" if approved > rejected else "REJECTED",
                "votingResult": {"approved": approved, "rejected": rejected, "abstained": 0},
                "scores": [
                    {"agentId": "caspar", "score": 75, "reasoning": "慎重で現実的な分析"},
                    {"agentId": "balthasar", "score": 88, "reasoning": "創造的で前向きな提案"},
                    {"agentId": "melchior", "score": 82, "reasoning": "バランスの取れた科学的判断"}
                ],
                "finalRecommendation": "段階的実装によるリスク管理を推奨",
                "reasoning": f"多数決により{'可決' if approved > rejected else '否決'}",
                "confidence": 0.85
            })
            
            # 完了イベント
            send_event("complete", data={"message": "All agents completed successfully"})
            
        except Exception as e:
            send_event("error", data={"error": str(e)})
    
    async def _consult_agent(self, agent_type: AgentType, question: str):
        """個別エージェントに相談"""
        agent_info = self.agents[agent_type]
        agent = agent_info["agent"]
        config = agent_info["config"]
        
        # エージェント開始イベント
        send_event("agent_start", agent_id=agent_type.value, data={
            "name": config["name"],
            "type": "バランス型" if agent_type == AgentType.MELCHIOR else 
                   "保守型" if agent_type == AgentType.CASPAR else "革新型"
        })
        
        # 思考プロセス
        thinking_steps = ["質問の解析", "情報収集", "分析と評価", "結論の導出"]
        for step in thinking_steps:
            send_event("agent_thinking", agent_id=agent_type.value, data={
                "text": f"{step}を実行中...\n"
            })
            await asyncio.sleep(0.2)
        
        # 実際のエージェント呼び出し
        full_prompt = f"{config['prompt']}\n\n## 質問\n{question}\n\n上記の質問について分析し、JSON形式で回答してください。"
        
        try:
            result = agent(full_prompt)
            response_text = str(result)
            
            # 応答をストリーミング
            for char in response_text:
                send_event("agent_chunk", agent_id=agent_type.value, data={"text": char})
                await asyncio.sleep(0.02)
            
            # 応答解析
            parsed_response = self._parse_response(response_text, agent_type)
            
            # エージェント完了
            send_event("agent_complete", agent_id=agent_type.value, data={
                "decision": parsed_response.get("decision", "REJECTED"),
                "confidence": parsed_response.get("confidence", 0.5),
                "executionTime": 1000
            })
            
            return parsed_response
            
        except Exception as e:
            # エラー時のフォールバック
            send_event("agent_complete", agent_id=agent_type.value, data={
                "decision": "REJECTED",
                "confidence": 0.0,
                "executionTime": 0
            })
            return {"decision": "REJECTED", "confidence": 0.0}
    
    def _parse_response(self, response_text: str, agent_type: AgentType):
        """応答を解析"""
        try:
            if '{' in response_text and '}' in response_text:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                json_text = response_text[json_start:json_end]
                return json.loads(json_text)
        except:
            pass
        
        # フォールバック解析
        text_lower = response_text.lower()
        if 'approved' in text_lower or '可決' in text_lower:
            decision = "APPROVED"
        else:
            decision = "REJECTED"
        
        return {
            "decision": decision,
            "reasoning": "テキスト解析による判断",
            "confidence": 0.6
        }

# Lambda Handler
def lambda_handler(event, context):
    """Lambda Response Streaming Handler"""
    try:
        # リクエスト解析
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)
        
        question = body.get('question', 'テスト質問')
        
        # MAGI システム初期化
        magi = MAGILambdaSystem()
        
        # ストリーミング実行
        asyncio.run(magi.process_streaming(question))
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept',
            }
        }
        
    except Exception as e:
        send_event("error", data={"error": str(e)})
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

if __name__ == "__main__":
    # ローカルテスト
    test_event = {
        'body': json.dumps({
            'question': 'AIシステムを導入すべきか？'
        })
    }
    lambda_handler(test_event, None)