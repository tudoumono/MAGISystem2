#!/usr/bin/env python3
"""
MAGI Executor for Lambda Environment

Lambda環境でMAGI Decision Systemを実行するためのエグゼキューター。
Strands Agents SDKを使用して実際のClaude APIと統合します。

学習ポイント:
- Lambda環境でのStrands Agents実行
- JSON入出力による言語間通信
- エラーハンドリングと監視
"""

import json
import sys
import os
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

# Strands Agents SDK
try:
    from strands import Agent
    STRANDS_AVAILABLE = True
except ImportError:
    STRANDS_AVAILABLE = False
    print("Warning: Strands Agents SDK not available")


class MAGILambdaExecutor:
    """
    Lambda環境用MAGI Executor
    
    TypeScript Lambda関数からPythonスクリプトを呼び出し、
    Strands Agentsを使用してMAGI Decision Systemを実行します。
    """
    
    def __init__(self):
        """エグゼキューターを初期化"""
        self.agents = {}
        self.initialized = False
        
        if STRANDS_AVAILABLE:
            self._initialize_agents()
    
    def _initialize_agents(self):
        """MAGI エージェントを初期化"""
        try:
            # エージェント設定
            agent_configs = {
                "caspar": {
                    "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                    "personality": "保守的・現実的な賢者",
                    "system_prompt": """
あなたはCASPAR - MAGI Decision Systemの保守的・現実的な賢者です。

## 特性
- 保守的思考: 既存の方法や実績を重視
- 現実的判断: 実現可能性とリスクを慎重に評価
- リスク重視: 失敗時の影響を最優先で考慮

## 出力形式
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}

保守的な観点から慎重に判断してください。
"""
                },
                "balthasar": {
                    "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                    "personality": "革新的・感情的な賢者",
                    "system_prompt": """
あなたはBALTHASAR - MAGI Decision Systemの革新的・感情的な賢者です。

## 特性
- 革新的思考: 新しいアイデアと創造性を重視
- 感情的判断: 人間の感情と価値観を考慮
- 創造性重視: 従来の枠を超えた発想を評価

## 出力形式
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}

革新的で創造的な観点から判断してください。
"""
                },
                "melchior": {
                    "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                    "personality": "バランス型・科学的な賢者",
                    "system_prompt": """
あなたはMELCHIOR - MAGI Decision Systemのバランス型・科学的な賢者です。

## 特性
- バランス思考: 多角的な視点から総合判断
- 科学的分析: データと論理に基づく評価
- 論理性重視: 客観的で合理的な判断

## 出力形式
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}

科学的で論理的な観点から客観的に判断してください。
"""
                },
                "solomon": {
                    "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
                    "personality": "統括者・最終判断者",
                    "system_prompt": """
あなたはSOLOMON Judge - MAGI Decision Systemの統括者です。

## 役割
3賢者の判断を統合し、最終的な意思決定を行います。

## 出力形式
{
  "final_decision": "APPROVED" または "REJECTED",
  "voting_result": {"approved": 数値, "rejected": 数値, "abstained": 数値},
  "scores": [
    {"agent_id": "caspar", "score": 0-100, "reasoning": "評価理由"},
    {"agent_id": "balthasar", "score": 0-100, "reasoning": "評価理由"},
    {"agent_id": "melchior", "score": 0-100, "reasoning": "評価理由"}
  ],
  "summary": "統合要約（150-200文字）",
  "final_recommendation": "最終推奨事項（100-150文字）",
  "reasoning": "最終判断の根拠（150-200文字）",
  "confidence": 0.0-1.0の数値
}

客観的で公正な評価を行ってください。
"""
                }
            }
            
            # エージェント作成
            for agent_id, config in agent_configs.items():
                try:
                    agent = Agent(model=config["model"])
                    self.agents[agent_id] = {
                        "agent": agent,
                        "config": config
                    }
                    print(f"[OK] {agent_id.upper()} initialized")
                except Exception as e:
                    print(f"[ERROR] Failed to initialize {agent_id}: {e}")
                    self.agents[agent_id] = None
            
            self.initialized = True
            print(f"[INFO] Initialized {len([a for a in self.agents.values() if a])} agents")
            
        except Exception as e:
            print(f"[ERROR] Agent initialization failed: {e}")
            self.initialized = False
    
    async def execute_magi_decision(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        MAGI意思決定を実行
        
        Args:
            request_data: リクエストデータ
            
        Returns:
            Dict[str, Any]: 意思決定結果
        """
        if not self.initialized or not STRANDS_AVAILABLE:
            return {
                "success": False,
                "error": "MAGI system not initialized or Strands Agents not available",
                "timestamp": datetime.now().isoformat()
            }
        
        try:
            question = request_data.get("message", "")
            if not question:
                return {
                    "success": False,
                    "error": "No question provided",
                    "timestamp": datetime.now().isoformat()
                }
            
            print(f"[MAGI] Decision: {question}")
            
            # Step 1: 3賢者による並列分析
            sage_responses = await self._consult_three_sages(question)
            
            # Step 2: SOLOMON Judgeによる統合評価
            judge_response = await self._solomon_judgment(sage_responses, question)
            
            # Step 3: 結果の構築
            result = {
                "success": True,
                "conversationId": request_data.get("conversationId", f"conv_{int(datetime.now().timestamp())}"),
                "messageId": f"msg_{int(datetime.now().timestamp())}",
                "agentResponses": sage_responses,
                "judgeResponse": judge_response,
                "traceId": request_data.get("traceId", f"trace_{int(datetime.now().timestamp())}"),
                "executionTime": 0,  # 計算は省略
                "timestamp": datetime.now().isoformat()
            }
            
            print(f"[MAGI] Decision Complete: {judge_response.get('final_decision', 'UNKNOWN')}")
            return result
            
        except Exception as e:
            print(f"[ERROR] MAGI Decision Failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _consult_three_sages(self, question: str) -> list:
        """3賢者による並列分析"""
        sage_types = ["caspar", "balthasar", "melchior"]
        tasks = []
        
        for sage_type in sage_types:
            if self.agents.get(sage_type):
                task = self._consult_single_sage(sage_type, question)
                tasks.append(task)
        
        if tasks:
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            valid_responses = []
            for i, response in enumerate(responses):
                if isinstance(response, Exception):
                    sage_type = sage_types[i]
                    print(f"[ERROR] {sage_type} failed: {response}")
                    # エラー時のフォールバック
                    fallback_response = {
                        "agentId": sage_type,
                        "decision": "REJECTED",
                        "content": f"{sage_type}の実行中にエラーが発生しました",
                        "reasoning": "システムエラーによる自動否決",
                        "confidence": 0.0,
                        "executionTime": 0,
                        "timestamp": datetime.now().isoformat()
                    }
                    valid_responses.append(fallback_response)
                else:
                    valid_responses.append(response)
            
            return valid_responses
        else:
            return []
    
    async def _consult_single_sage(self, sage_type: str, question: str) -> Dict[str, Any]:
        """個別の賢者に相談"""
        agent_info = self.agents[sage_type]
        if not agent_info:
            raise Exception(f"{sage_type} not initialized")
        
        agent = agent_info["agent"]
        config = agent_info["config"]
        
        try:
            # プロンプト構築
            full_prompt = f"{config['system_prompt']}\n\n## 質問\n{question}\n\n上記の質問について、あなたの視点から分析し、指定されたJSON形式で回答してください。"
            
            print(f"[AGENT] Consulting {sage_type.upper()}...")
            
            # Strands Agent呼び出し
            result = agent(full_prompt)
            response_text = str(result)
            
            # レスポンス解析
            parsed_response = self._parse_sage_response(response_text, sage_type)
            
            print(f"[OK] {sage_type.upper()}: {parsed_response['decision']}")
            return parsed_response
            
        except Exception as e:
            print(f"[ERROR] {sage_type} error: {e}")
            return {
                "agentId": sage_type,
                "decision": "REJECTED",
                "content": f"エラー: {str(e)}",
                "reasoning": "実行エラーによる自動否決",
                "confidence": 0.0,
                "executionTime": 0,
                "timestamp": datetime.now().isoformat()
            }
    
    def _parse_sage_response(self, response_text: str, agent_id: str) -> Dict[str, Any]:
        """賢者の応答を解析"""
        try:
            # JSON部分を抽出
            if '{' in response_text and '}' in response_text:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                json_text = response_text[json_start:json_end]
                
                parsed = json.loads(json_text)
                
                return {
                    "agentId": agent_id,
                    "decision": parsed.get('decision', 'REJECTED'),
                    "content": parsed.get('analysis', response_text),
                    "reasoning": parsed.get('reasoning', '解析エラー'),
                    "confidence": float(parsed.get('confidence', 0.5)),
                    "executionTime": 0,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # フォールバック解析
                return self._fallback_parse_response(response_text, agent_id)
                
        except (json.JSONDecodeError, ValueError, KeyError):
            return self._fallback_parse_response(response_text, agent_id)
    
    def _fallback_parse_response(self, response_text: str, agent_id: str) -> Dict[str, Any]:
        """フォールバック応答解析"""
        text_lower = response_text.lower()
        
        if 'approved' in text_lower or '可決' in text_lower or '承認' in text_lower:
            decision = "APPROVED"
        else:
            decision = "REJECTED"
        
        return {
            "agentId": agent_id,
            "decision": decision,
            "content": response_text,
            "reasoning": "テキスト解析による判断",
            "confidence": 0.6,
            "executionTime": 0,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _solomon_judgment(self, sage_responses: list, question: str) -> Dict[str, Any]:
        """SOLOMON Judgeによる統合評価"""
        solomon_info = self.agents.get("solomon")
        if not solomon_info:
            return self._create_fallback_judgment(sage_responses)
        
        try:
            # 3賢者の結果をまとめたプロンプト作成
            sage_summary = self._create_sage_summary(sage_responses)
            solomon_prompt = f"""
{solomon_info['config']['system_prompt']}

## 元の質問
{question}

## 3賢者の判断結果
{sage_summary}

上記の3賢者の判断を評価し、統合判断を行ってください。指定されたJSON形式で回答してください。
"""
            
            print(f"[SOLOMON] Judge Evaluation...")
            
            # SOLOMON Agent呼び出し
            result = solomon_info["agent"](solomon_prompt)
            response_text = str(result)
            
            # レスポンス解析
            judge_response = self._parse_solomon_response(response_text, sage_responses)
            
            print(f"[OK] SOLOMON: {judge_response.get('final_decision', 'UNKNOWN')}")
            return judge_response
            
        except Exception as e:
            print(f"[ERROR] SOLOMON error: {e}")
            return self._create_fallback_judgment(sage_responses)
    
    def _create_sage_summary(self, sage_responses: list) -> str:
        """3賢者の結果要約を作成"""
        summary_parts = []
        
        for response in sage_responses:
            summary_parts.append(f"""
**{response['agentId'].upper()}**
- 判断: {response['decision']}
- 根拠: {response['reasoning']}
- 確信度: {response['confidence']:.2f}
- 分析: {response['content'][:200]}...
""")
        
        return "\n".join(summary_parts)
    
    def _parse_solomon_response(self, response_text: str, sage_responses: list) -> Dict[str, Any]:
        """SOLOMON応答を解析"""
        try:
            # JSON部分を抽出
            if '{' in response_text and '}' in response_text:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                json_text = response_text[json_start:json_end]
                
                parsed = json.loads(json_text)
                
                # 投票結果の集計
                approved = sum(1 for r in sage_responses if r['decision'] == 'APPROVED')
                rejected = sum(1 for r in sage_responses if r['decision'] == 'REJECTED')
                abstained = sum(1 for r in sage_responses if r['decision'] == 'ABSTAINED')
                
                return {
                    "finalDecision": parsed.get('final_decision', 'REJECTED'),
                    "votingResult": {
                        "approved": approved,
                        "rejected": rejected,
                        "abstained": abstained,
                        "totalVotes": approved + rejected + abstained
                    },
                    "scores": parsed.get('scores', []),
                    "summary": parsed.get('summary', '統合評価完了'),
                    "finalRecommendation": parsed.get('final_recommendation', '詳細検討を推奨'),
                    "reasoning": parsed.get('reasoning', '多数決による判断'),
                    "confidence": float(parsed.get('confidence', 0.8)),
                    "executionTime": 0,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return self._create_fallback_judgment(sage_responses)
                
        except (json.JSONDecodeError, ValueError, KeyError):
            return self._create_fallback_judgment(sage_responses)
    
    def _create_fallback_judgment(self, sage_responses: list) -> Dict[str, Any]:
        """フォールバック判断を作成"""
        approved = sum(1 for r in sage_responses if r['decision'] == 'APPROVED')
        rejected = sum(1 for r in sage_responses if r['decision'] == 'REJECTED')
        
        final_decision = "APPROVED" if approved > rejected else "REJECTED"
        
        scores = [
            {"agentId": r['agentId'], "score": int(r['confidence'] * 100), "reasoning": "自動評価"}
            for r in sage_responses
        ]
        
        return {
            "finalDecision": final_decision,
            "votingResult": {
                "approved": approved,
                "rejected": rejected,
                "abstained": 0,
                "totalVotes": approved + rejected
            },
            "scores": scores,
            "summary": "3賢者の判断を集計しました",
            "finalRecommendation": "慎重な検討を推奨します",
            "reasoning": f"投票結果: 可決{approved}票、否決{rejected}票による判断",
            "confidence": 0.7,
            "executionTime": 0,
            "timestamp": datetime.now().isoformat()
        }


# メイン実行関数
async def main():
    """メイン実行関数"""
    try:
        # 標準入力からリクエストデータを読み取り
        input_data = sys.stdin.read()
        request_data = json.loads(input_data) if input_data.strip() else {}
        
        # MAGI Executorを初期化
        executor = MAGILambdaExecutor()
        
        # MAGI意思決定を実行
        result = await executor.execute_magi_decision(request_data)
        
        # 結果をJSON形式で出力
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        # エラー時の出力
        error_result = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())