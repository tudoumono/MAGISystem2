#!/usr/bin/env python3
"""
MAGI Agent - AgentCore Runtime Implementation

BedrockAgentCoreAppを使用したMAGI Decision Systemの基本実装。
AWS公式のAgentCore Runtimeアーキテクチャに準拠した単一エージェント版。

学習ポイント:
- BedrockAgentCoreAppの基本使用方法
- AgentCore Runtime統合パターン
- エントリーポイント関数の実装
- Strands Agentsとの統合
"""

import json
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

# AgentCore Runtime統合
from bedrock_agentcore import BedrockAgentCoreApp

# Strands Agents統合
from strands import Agent

# 共通型定義のインポート
from shared.types import (
    AgentType, DecisionType, AgentResponse, 
    MAGIDecisionRequest, MAGIDecisionResponse,
    JudgeResponse, VotingResult, AgentScore
)
from shared.prompts import get_agent_prompt
from shared.utils import generate_trace_id, format_execution_time


class MAGIAgentCore:
    """
    MAGI Agent - AgentCore Runtime統合版
    
    BedrockAgentCoreAppとStrands Agentsを統合した
    基本的なMAGI Decision Systemの実装。
    
    特徴:
    - AgentCore Runtime対応
    - 8時間実行対応
    - 自動セッション管理
    - 統合監視・ログ
    """
    
    def __init__(self):
        """MAGI AgentCoreを初期化"""
        self.app = BedrockAgentCoreApp()
        
        # Strands Agentsの初期化
        self.agents = {}
        self._initialize_agents()
        
        # 実行統計
        self.execution_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_execution_time": 0
        }
    
    def _initialize_agents(self):
        """Strands Agentsを初期化"""
        agent_configs = {
            AgentType.CASPAR: {
                "model": "anthropic.claude-3-5-sonnet-20240620-v1:0"
            },
            AgentType.BALTHASAR: {
                "model": "anthropic.claude-3-5-sonnet-20240620-v1:0"
            },
            AgentType.MELCHIOR: {
                "model": "anthropic.claude-3-5-sonnet-20240620-v1:0"
            },
            AgentType.SOLOMON: {
                "model": "anthropic.claude-3-5-sonnet-20240620-v1:0"
            }
        }
        
        for agent_type, config in agent_configs.items():
            try:
                # Strands Agentの基本初期化（temperatureは後で設定）
                agent = Agent(model=config["model"])
                self.agents[agent_type] = agent
                print(f"✅ {agent_type.value} agent initialized")
            except Exception as e:
                print(f"❌ Failed to initialize {agent_type.value}: {e}")
                self.agents[agent_type] = None
    
    async def process_decision(self, request: MAGIDecisionRequest) -> MAGIDecisionResponse:
        """
        MAGI意思決定プロセスを実行
        
        Args:
            request: 意思決定リクエスト
            
        Returns:
            MAGIDecisionResponse: 統合された意思決定結果
        """
        start_time = datetime.now()
        trace_id = request.trace_id or generate_trace_id()
        
        self.execution_stats["total_requests"] += 1
        
        try:
            print(f"🧠 MAGI Decision Process Started")
            print(f"   Question: {request.question}")
            print(f"   Trace ID: {trace_id}")
            
            # Step 1: 3賢者による並列分析
            sage_responses = await self._consult_three_sages(request.question, trace_id)
            
            # Step 2: SOLOMON Judgeによる統合評価
            judge_response = await self._solomon_judgment(sage_responses, request.question, trace_id)
            
            # Step 3: 結果の統合
            end_time = datetime.now()
            total_execution_time = int((end_time - start_time).total_seconds() * 1000)
            
            # エージェント応答が不足している場合の処理
            if len(sage_responses) < 3:
                # 不足しているエージェントのダミー応答を追加
                required_agents = {AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR}
                existing_agents = {r.agent_id for r in sage_responses}
                missing_agents = required_agents - existing_agents
                
                for missing_agent in missing_agents:
                    dummy_response = AgentResponse(
                        agent_id=missing_agent,
                        decision=DecisionType.REJECTED,
                        content=f"{missing_agent.value}エージェントは利用できませんでした",
                        reasoning="エージェント初期化失敗による自動否決",
                        confidence=0.0,
                        execution_time=0,
                        timestamp=datetime.now()
                    )
                    sage_responses.append(dummy_response)
            
            response = MAGIDecisionResponse(
                request_id=f"magi_{int(start_time.timestamp())}",
                trace_id=trace_id,
                agent_responses=sage_responses,
                judge_response=judge_response,
                total_execution_time=total_execution_time,
                trace_steps=[],  # 簡略化
                timestamp=start_time,
                version="1.0-agentcore"
            )
            
            # 統計更新
            self.execution_stats["successful_requests"] += 1
            self.execution_stats["total_execution_time"] += total_execution_time
            
            print(f"✅ MAGI Decision Complete ({total_execution_time}ms)")
            print(f"   Final Decision: {judge_response.final_decision.value}")
            print(f"   Voting: {judge_response.voting_result.approved}可決 / {judge_response.voting_result.rejected}否決")
            
            return response
            
        except Exception as e:
            self.execution_stats["failed_requests"] += 1
            print(f"❌ MAGI Decision Failed: {e}")
            raise
    
    async def _consult_three_sages(self, question: str, trace_id: str) -> list[AgentResponse]:
        """3賢者による並列分析"""
        print(f"🔮 Consulting Three Sages...")
        
        sage_types = [AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR]
        tasks = []
        
        for sage_type in sage_types:
            if self.agents.get(sage_type):
                task = self._consult_single_sage(sage_type, question, trace_id)
                tasks.append(task)
            else:
                print(f"   ⚠️  {sage_type.value} not available")
        
        # 並列実行
        if tasks:
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 成功した応答のみを収集
            valid_responses = []
            for i, response in enumerate(responses):
                if isinstance(response, Exception):
                    sage_type = sage_types[i]
                    print(f"   ❌ {sage_type.value} failed: {response}")
                    # エラー時のフォールバック応答
                    fallback_response = AgentResponse(
                        agent_id=sage_type,
                        decision=DecisionType.REJECTED,
                        content=f"{sage_type.value}の実行中にエラーが発生しました",
                        reasoning="システムエラーによる自動否決",
                        confidence=0.0,
                        execution_time=0,
                        timestamp=datetime.now()
                    )
                    valid_responses.append(fallback_response)
                else:
                    valid_responses.append(response)
            
            return valid_responses
        else:
            print("   ❌ No sages available")
            return []
    
    async def _consult_single_sage(self, sage_type: AgentType, question: str, trace_id: str) -> AgentResponse:
        """個別の賢者に相談"""
        agent = self.agents.get(sage_type)
        if not agent:
            raise Exception(f"{sage_type.value} not initialized")
        
        start_time = datetime.now()
        
        try:
            # システムプロンプト + 質問を組み合わせ
            system_prompt = get_agent_prompt(sage_type.value)
            full_prompt = f"{system_prompt}\n\n## 質問\n{question}\n\n上記の質問について、あなたの視点から分析し、指定されたJSON形式で回答してください。"
            
            print(f"   🤖 Consulting {sage_type.value.upper()}...")
            
            # Strands Agent呼び出し
            result = agent(full_prompt)
            
            end_time = datetime.now()
            execution_time = int((end_time - start_time).total_seconds() * 1000)
            
            # レスポンス解析
            response_text = str(result)
            parsed_response = self._parse_sage_response(response_text, sage_type, execution_time)
            
            print(f"   ✅ {sage_type.value.upper()}: {parsed_response.decision.value} (confidence: {parsed_response.confidence:.2f})")
            
            return parsed_response
            
        except Exception as e:
            end_time = datetime.now()
            execution_time = int((end_time - start_time).total_seconds() * 1000)
            print(f"   ❌ {sage_type.value.upper()} error: {e}")
            
            return AgentResponse(
                agent_id=sage_type,
                decision=DecisionType.REJECTED,
                content=f"エラー: {str(e)}",
                reasoning="実行エラーによる自動否決",
                confidence=0.0,
                execution_time=execution_time,
                timestamp=datetime.now()
            )
    
    def _parse_sage_response(self, response_text: str, agent_id: AgentType, execution_time: int) -> AgentResponse:
        """賢者の応答を解析"""
        try:
            # JSON部分を抽出
            if '{' in response_text and '}' in response_text:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                json_text = response_text[json_start:json_end]
                
                parsed = json.loads(json_text)
                
                decision = DecisionType(parsed.get('decision', 'REJECTED'))
                reasoning = parsed.get('reasoning', '解析エラー')
                confidence = float(parsed.get('confidence', 0.5))
                content = parsed.get('content', response_text)
                
                return AgentResponse(
                    agent_id=agent_id,
                    decision=decision,
                    content=content,
                    reasoning=reasoning,
                    confidence=max(0.0, min(1.0, confidence)),
                    execution_time=execution_time,
                    timestamp=datetime.now()
                )
            else:
                # JSON解析失敗時のフォールバック
                return self._fallback_parse_response(response_text, agent_id, execution_time)
                
        except (json.JSONDecodeError, ValueError, KeyError):
            return self._fallback_parse_response(response_text, agent_id, execution_time)
    
    def _fallback_parse_response(self, response_text: str, agent_id: AgentType, execution_time: int) -> AgentResponse:
        """フォールバック応答解析"""
        text_lower = response_text.lower()
        
        if 'approved' in text_lower or '可決' in text_lower or '承認' in text_lower:
            decision = DecisionType.APPROVED
        else:
            decision = DecisionType.REJECTED
        
        return AgentResponse(
            agent_id=agent_id,
            decision=decision,
            content=response_text,
            reasoning="テキスト解析による判断",
            confidence=0.6,
            execution_time=execution_time,
            timestamp=datetime.now()
        )
    
    async def _solomon_judgment(self, sage_responses: list[AgentResponse], question: str, trace_id: str) -> JudgeResponse:
        """SOLOMON Judgeによる統合評価"""
        print(f"⚖️  SOLOMON Judge Evaluation...")
        
        solomon_agent = self.agents.get(AgentType.SOLOMON)
        if not solomon_agent:
            return self._create_fallback_judgment(sage_responses)
        
        start_time = datetime.now()
        
        try:
            # 3賢者の結果をまとめたプロンプト作成
            sage_summary = self._create_sage_summary(sage_responses)
            solomon_prompt = f"""
{get_agent_prompt('solomon')}

## 元の質問
{question}

## 3賢者の判断結果
{sage_summary}

上記の3賢者の判断を評価し、統合判断を行ってください。指定されたJSON形式で回答してください。
"""
            
            # SOLOMON Agent呼び出し
            result = solomon_agent(solomon_prompt)
            end_time = datetime.now()
            execution_time = int((end_time - start_time).total_seconds() * 1000)
            
            # レスポンス解析
            response_text = str(result)
            judge_response = self._parse_solomon_response(response_text, sage_responses, execution_time)
            
            print(f"   ✅ SOLOMON: {judge_response.final_decision.value} (confidence: {judge_response.confidence:.2f})")
            
            return judge_response
            
        except Exception as e:
            print(f"   ❌ SOLOMON error: {e}")
            return self._create_fallback_judgment(sage_responses)
    
    def _create_sage_summary(self, sage_responses: list[AgentResponse]) -> str:
        """3賢者の結果要約を作成"""
        summary_parts = []
        
        for response in sage_responses:
            summary_parts.append(f"""
**{response.agent_id.value.upper()}**
- 判断: {response.decision.value}
- 根拠: {response.reasoning}
- 確信度: {response.confidence:.2f}
- 分析: {response.content[:200]}...
""")
        
        return "\n".join(summary_parts)
    
    def _parse_solomon_response(self, response_text: str, sage_responses: list[AgentResponse], execution_time: int) -> JudgeResponse:
        """SOLOMON応答を解析"""
        try:
            # JSON部分を抽出
            if '{' in response_text and '}' in response_text:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                json_text = response_text[json_start:json_end]
                
                parsed = json.loads(json_text)
                
                # 投票結果の集計
                approved = sum(1 for r in sage_responses if r.decision == DecisionType.APPROVED)
                rejected = sum(1 for r in sage_responses if r.decision == DecisionType.REJECTED)
                
                voting_result = VotingResult(
                    approved=approved,
                    rejected=rejected,
                    abstained=0
                )
                
                # スコア情報の抽出
                scores = []
                for score_data in parsed.get('scores', []):
                    scores.append(AgentScore(
                        agent_id=AgentType(score_data.get('agent_id', 'caspar')),
                        score=int(score_data.get('score', 75)),
                        reasoning=score_data.get('reasoning', '評価理由なし')
                    ))
                
                return JudgeResponse(
                    final_decision=DecisionType(parsed.get('final_decision', 'REJECTED')),
                    voting_result=voting_result,
                    scores=scores,
                    summary=parsed.get('summary', '統合評価完了'),
                    final_recommendation=parsed.get('final_recommendation', '詳細検討を推奨'),
                    reasoning=parsed.get('reasoning', '多数決による判断'),
                    confidence=float(parsed.get('confidence', 0.8)),
                    execution_time=execution_time,
                    timestamp=datetime.now()
                )
            else:
                return self._create_fallback_judgment(sage_responses)
                
        except (json.JSONDecodeError, ValueError, KeyError):
            return self._create_fallback_judgment(sage_responses)
    
    def _create_fallback_judgment(self, sage_responses: list[AgentResponse]) -> JudgeResponse:
        """フォールバック判断を作成"""
        approved = sum(1 for r in sage_responses if r.decision == DecisionType.APPROVED)
        rejected = sum(1 for r in sage_responses if r.decision == DecisionType.REJECTED)
        
        voting_result = VotingResult(
            approved=approved,
            rejected=rejected,
            abstained=0
        )
        
        final_decision = DecisionType.APPROVED if approved > rejected else DecisionType.REJECTED
        
        scores = [
            AgentScore(agent_id=r.agent_id, score=int(r.confidence * 100), reasoning="自動評価")
            for r in sage_responses
        ]
        
        return JudgeResponse(
            final_decision=final_decision,
            voting_result=voting_result,
            scores=scores,
            summary="3賢者の判断を集計しました",
            final_recommendation="慎重な検討を推奨します",
            reasoning=f"投票結果: 可決{approved}票、否決{rejected}票による判断",
            confidence=0.7,
            execution_time=0,
            timestamp=datetime.now()
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """実行統計を取得"""
        return {
            "total_requests": self.execution_stats["total_requests"],
            "successful_requests": self.execution_stats["successful_requests"],
            "failed_requests": self.execution_stats["failed_requests"],
            "success_rate": (
                self.execution_stats["successful_requests"] / self.execution_stats["total_requests"]
                if self.execution_stats["total_requests"] > 0 else 0
            ),
            "total_execution_time": self.execution_stats["total_execution_time"],
            "average_execution_time": (
                self.execution_stats["total_execution_time"] / self.execution_stats["successful_requests"]
                if self.execution_stats["successful_requests"] > 0 else 0
            )
        }


# AgentCore Runtime エントリーポイント
magi_core = MAGIAgentCore()


async def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    AgentCore Runtime エントリーポイント関数
    
    Args:
        event: AgentCore Runtimeからのイベント
        
    Returns:
        Dict[str, Any]: 処理結果
    """
    try:
        # イベントからリクエストを構築
        question = event.get('question', 'デフォルトの質問です')
        context = event.get('context')
        
        request = MAGIDecisionRequest(
            question=question,
            context=context
        )
        
        # MAGI意思決定実行
        response = await magi_core.process_decision(request)
        
        # レスポンスをJSONシリアライズ可能な形式に変換
        return {
            "statusCode": 200,
            "body": {
                "request_id": response.request_id,
                "trace_id": response.trace_id,
                "final_decision": response.judge_response.final_decision.value,
                "voting_result": {
                    "approved": response.judge_response.voting_result.approved,
                    "rejected": response.judge_response.voting_result.rejected,
                    "abstained": response.judge_response.voting_result.abstained
                },
                "summary": response.judge_response.summary,
                "recommendation": response.judge_response.final_recommendation,
                "confidence": response.judge_response.confidence,
                "execution_time": response.total_execution_time,
                "agent_responses": [
                    {
                        "agent_id": ar.agent_id.value,
                        "decision": ar.decision.value,
                        "reasoning": ar.reasoning,
                        "confidence": ar.confidence
                    }
                    for ar in response.agent_responses
                ],
                "timestamp": response.timestamp.isoformat(),
                "version": response.version
            }
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "body": {
                "error": str(e),
                "message": "MAGI Decision System execution failed"
            }
        }


# テスト実行関数
async def test_magi_agent():
    """MAGI Agentのテスト"""
    print("🚀 Testing MAGI Agent (AgentCore Runtime)")
    print("=" * 60)
    
    test_request = MAGIDecisionRequest(
        question="新しいAIシステムを全社に導入すべきか？",
        context="コスト削減と効率化が期待されるが、従業員の反発も予想される"
    )
    
    try:
        response = await magi_core.process_decision(test_request)
        
        print(f"\n📊 MAGI Decision Results:")
        print(f"   Final Decision: {response.judge_response.final_decision.value}")
        print(f"   Execution Time: {response.total_execution_time}ms")
        print(f"   Voting: {response.judge_response.voting_result.approved}可決 / {response.judge_response.voting_result.rejected}否決")
        print(f"   Summary: {response.judge_response.summary}")
        
        # 各賢者の結果
        print(f"\n🧠 Individual Sage Results:")
        for agent_response in response.agent_responses:
            print(f"   {agent_response.agent_id.value}: {agent_response.decision.value} (confidence: {agent_response.confidence:.2f})")
        
        # システム統計
        stats = magi_core.get_stats()
        print(f"\n📈 System Statistics:")
        print(f"   Total Requests: {stats['total_requests']}")
        print(f"   Success Rate: {stats['success_rate']:.2%}")
        print(f"   Average Execution Time: {stats['average_execution_time']:.0f}ms")
        
        return response
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return None


if __name__ == "__main__":
    # 直接実行時のテスト
    asyncio.run(test_magi_agent())