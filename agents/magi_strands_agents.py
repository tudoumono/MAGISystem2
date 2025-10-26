#!/usr/bin/env python3
"""
MAGI Decision System - Strands Agents Implementation

Strands Agents SDKを使用したMAGI Decision Systemの実装。
3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる意思決定システム。

学習ポイント:
- Strands Agents SDKの実際の使用方法
- 複数エージェントの協調実装
- Bedrock統合による実際のLLM呼び出し
- エージェント間の結果統合
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Strands Agents SDK
from strands import Agent

# 共通型定義のインポート
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from shared.types import AgentType, DecisionType, AgentResponse, JudgeResponse, MAGIDecisionRequest, MAGIDecisionResponse
from shared.utils import generate_trace_id, format_execution_time


@dataclass
class MAGIAgentConfig:
    """MAGI エージェント設定"""
    agent_id: AgentType
    name: str
    personality: str
    system_prompt: str
    model: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"


class MAGIStrandsSystem:
    """
    MAGI Decision System - Strands Agents実装
    
    3賢者による多視点分析とSOLOMON Judgeによる統合評価を行います。
    
    アーキテクチャ:
    - CASPAR: 保守的・現実的な視点
    - BALTHASAR: 革新的・感情的な視点  
    - MELCHIOR: バランス型・科学的な視点
    - SOLOMON: 統括者として最終判断
    """
    
    def __init__(self):
        """MAGI システムを初期化"""
        self.agents = {}
        self.execution_stats = {
            "total_decisions": 0,
            "total_execution_time": 0,
            "agent_stats": {}
        }
        
        # エージェント設定を定義
        self.agent_configs = self._define_agent_configs()
        
        # エージェントを初期化
        self._initialize_agents()
    
    def _define_agent_configs(self) -> Dict[AgentType, MAGIAgentConfig]:
        """エージェント設定を定義"""
        return {
            AgentType.CASPAR: MAGIAgentConfig(
                agent_id=AgentType.CASPAR,
                name="CASPAR",
                personality="保守的・現実的な賢者",
                system_prompt="""
あなたはCASPAR - MAGI Decision Systemの保守的・現実的な賢者です。

## あなたの特性
- 保守的思考: 既存の方法や実績を重視
- 現実的判断: 実現可能性とリスクを慎重に評価
- リスク重視: 失敗時の影響を最優先で考慮

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

保守的な観点から慎重に判断し、不確実性が高い場合はREJECTEDを選択してください。
"""
            ),
            
            AgentType.BALTHASAR: MAGIAgentConfig(
                agent_id=AgentType.BALTHASAR,
                name="BALTHASAR", 
                personality="革新的・感情的な賢者",
                system_prompt="""
あなたはBALTHASAR - MAGI Decision Systemの革新的・感情的な賢者です。

## あなたの特性
- 革新的思考: 新しいアイデアと創造性を重視
- 感情的判断: 人間の感情と価値観を考慮
- 創造性重視: 従来の枠を超えた発想を評価

## 判断基準
1. 革新性と創造的価値
2. 人間的価値と倫理的側面
3. 感情的・直感的要素
4. 新しい可能性の創造
5. 社会的インパクト

## 出力形式
以下のJSON形式で回答してください：
{
  "decision": "APPROVED" または "REJECTED",
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}

革新的で創造的な観点から判断し、新しい可能性を積極的に評価してください。
"""
            ),
            
            AgentType.MELCHIOR: MAGIAgentConfig(
                agent_id=AgentType.MELCHIOR,
                name="MELCHIOR",
                personality="バランス型・科学的な賢者", 
                system_prompt="""
あなたはMELCHIOR - MAGI Decision Systemのバランス型・科学的な賢者です。

## あなたの特性
- バランス思考: 多角的な視点から総合判断
- 科学的分析: データと論理に基づく評価
- 論理性重視: 客観的で合理的な判断

## 判断基準
1. データと統計的根拠
2. 論理的整合性
3. 多角的視点の統合
4. 科学的手法の適用
5. 客観的評価指標

## 出力形式
以下のJSON形式で回答してください：
{
  "decision": "APPROVED" または "REJECTED", 
  "reasoning": "判断根拠（100-150文字）",
  "confidence": 0.0-1.0の数値,
  "analysis": "詳細分析（200-300文字）"
}

科学的で論理的な観点から客観的に判断し、バランスの取れた評価を行ってください。
"""
            ),
            
            AgentType.SOLOMON: MAGIAgentConfig(
                agent_id=AgentType.SOLOMON,
                name="SOLOMON",
                personality="統括者・最終判断者",
                system_prompt="""
あなたはSOLOMON Judge - MAGI Decision Systemの統括者です。

## 役割
3賢者（CASPAR、BALTHASAR、MELCHIOR）の判断を統合し、最終的な意思決定を行います。

## 評価基準
1. 各賢者の判断の妥当性（0-100点でスコアリング）
2. 投票結果の集計（可決/否決の票数）
3. 判断の一貫性と論理性
4. 総合的なリスクと利益の評価

## 出力形式
以下のJSON形式で回答してください：
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

客観的で公正な評価を行い、最終的な意思決定の責任を負ってください。
"""
            )
        }
    
    def _initialize_agents(self):
        """Strands Agentsを初期化"""
        print("🤖 Initializing MAGI Strands Agents...")
        
        for agent_type, config in self.agent_configs.items():
            try:
                # Strands Agent作成（モデル指定）
                agent = Agent(model=config.model)
                
                # エージェント情報を保存
                self.agents[agent_type] = {
                    "agent": agent,
                    "config": config,
                    "execution_count": 0,
                    "total_execution_time": 0
                }
                
                print(f"   ✅ {config.name} initialized with model: {config.model}")
                
            except Exception as e:
                print(f"   ❌ Failed to initialize {config.name}: {e}")
                self.agents[agent_type] = None
        
        successful_agents = sum(1 for agent in self.agents.values() if agent is not None)
        print(f"📊 Initialized {successful_agents}/{len(self.agent_configs)} agents")
    
    async def decide(self, request: MAGIDecisionRequest) -> MAGIDecisionResponse:
        """
        MAGI意思決定プロセスを実行
        
        Args:
            request: 意思決定リクエスト
            
        Returns:
            MAGIDecisionResponse: 統合された意思決定結果
        """
        start_time = time.time()
        trace_id = request.trace_id or generate_trace_id()
        
        print(f"\n🧠 MAGI Decision Process Started")
        print(f"   Question: {request.question}")
        print(f"   Trace ID: {trace_id}")
        
        try:
            # Step 1: 3賢者による並列分析
            sage_responses = await self._consult_three_sages(request.question, trace_id)
            
            # Step 2: SOLOMON Judgeによる統合評価
            judge_response = await self._solomon_judgment(sage_responses, request.question, trace_id)
            
            # Step 3: 結果の統合
            total_execution_time = format_execution_time(start_time)
            
            response = MAGIDecisionResponse(
                request_id=f"magi_{int(time.time())}",
                trace_id=trace_id,
                agent_responses=sage_responses,
                judge_response=judge_response,
                total_execution_time=total_execution_time,
                trace_steps=[],  # 簡略化
                timestamp=datetime.now(),
                version="1.0-strands"
            )
            
            # 統計更新
            self.execution_stats["total_decisions"] += 1
            self.execution_stats["total_execution_time"] += total_execution_time
            
            print(f"✅ MAGI Decision Complete ({total_execution_time}ms)")
            print(f"   Final Decision: {judge_response.final_decision.value}")
            print(f"   Voting: {judge_response.voting_result.approved}可決 / {judge_response.voting_result.rejected}否決")
            
            return response
            
        except Exception as e:
            print(f"❌ MAGI Decision Failed: {e}")
            raise
    
    async def _consult_three_sages(self, question: str, trace_id: str) -> List[AgentResponse]:
        """3賢者による並列分析"""
        print(f"\n🔮 Consulting Three Sages...")
        
        # 3賢者のタスクを作成
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
        agent_info = self.agents[sage_type]
        if not agent_info:
            raise Exception(f"{sage_type.value} not initialized")
        
        agent = agent_info["agent"]
        config = agent_info["config"]
        
        start_time = time.time()
        
        try:
            # システムプロンプト + 質問を組み合わせ
            full_prompt = f"{config.system_prompt}\n\n## 質問\n{question}\n\n上記の質問について、あなたの視点から分析し、指定されたJSON形式で回答してください。"
            
            print(f"   🤖 Consulting {config.name}...")
            
            # Strands Agent呼び出し
            result = agent(full_prompt)
            
            execution_time = format_execution_time(start_time)
            
            # レスポンス解析
            response_text = str(result)
            parsed_response = self._parse_sage_response(response_text, sage_type, execution_time)
            
            # 統計更新
            agent_info["execution_count"] += 1
            agent_info["total_execution_time"] += execution_time
            
            print(f"   ✅ {config.name}: {parsed_response.decision.value} (confidence: {parsed_response.confidence:.2f})")
            
            return parsed_response
            
        except Exception as e:
            execution_time = format_execution_time(start_time)
            print(f"   ❌ {config.name} error: {e}")
            
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
                analysis = parsed.get('analysis', response_text)
                
                return AgentResponse(
                    agent_id=agent_id,
                    decision=decision,
                    content=analysis,
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
    
    async def _solomon_judgment(self, sage_responses: List[AgentResponse], question: str, trace_id: str) -> JudgeResponse:
        """SOLOMON Judgeによる統合評価"""
        print(f"\n⚖️  SOLOMON Judge Evaluation...")
        
        solomon_info = self.agents.get(AgentType.SOLOMON)
        if not solomon_info:
            return self._create_fallback_judgment(sage_responses)
        
        start_time = time.time()
        
        try:
            # 3賢者の結果をまとめたプロンプト作成
            sage_summary = self._create_sage_summary(sage_responses)
            solomon_prompt = f"""
{solomon_info['config'].system_prompt}

## 元の質問
{question}

## 3賢者の判断結果
{sage_summary}

上記の3賢者の判断を評価し、統合判断を行ってください。指定されたJSON形式で回答してください。
"""
            
            # SOLOMON Agent呼び出し
            result = solomon_info["agent"](solomon_prompt)
            execution_time = format_execution_time(start_time)
            
            # レスポンス解析
            response_text = str(result)
            judge_response = self._parse_solomon_response(response_text, sage_responses, execution_time)
            
            print(f"   ✅ SOLOMON: {judge_response.final_decision.value} (confidence: {judge_response.confidence:.2f})")
            
            return judge_response
            
        except Exception as e:
            print(f"   ❌ SOLOMON error: {e}")
            return self._create_fallback_judgment(sage_responses)
    
    def _create_sage_summary(self, sage_responses: List[AgentResponse]) -> str:
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
    
    def _parse_solomon_response(self, response_text: str, sage_responses: List[AgentResponse], execution_time: int) -> JudgeResponse:
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
                
                from shared.types import VotingResult, AgentScore
                
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
    
    def _create_fallback_judgment(self, sage_responses: List[AgentResponse]) -> JudgeResponse:
        """フォールバック判断を作成"""
        approved = sum(1 for r in sage_responses if r.decision == DecisionType.APPROVED)
        rejected = sum(1 for r in sage_responses if r.decision == DecisionType.REJECTED)
        
        from shared.types import VotingResult, AgentScore
        
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
    
    def get_system_stats(self) -> Dict[str, Any]:
        """システム統計を取得"""
        return {
            "total_decisions": self.execution_stats["total_decisions"],
            "total_execution_time": self.execution_stats["total_execution_time"],
            "average_execution_time": (
                self.execution_stats["total_execution_time"] / self.execution_stats["total_decisions"]
                if self.execution_stats["total_decisions"] > 0 else 0
            ),
            "agents": {
                agent_type.value: {
                    "available": agent_info is not None,
                    "execution_count": agent_info["execution_count"] if agent_info else 0,
                    "total_execution_time": agent_info["total_execution_time"] if agent_info else 0
                }
                for agent_type, agent_info in self.agents.items()
            }
        }


# テスト実行
async def test_magi_strands_system():
    """MAGI Strands Systemのテスト"""
    print("🚀 Testing MAGI Strands System")
    print("=" * 60)
    
    # システム初期化
    magi = MAGIStrandsSystem()
    
    # テスト質問
    test_request = MAGIDecisionRequest(
        question="新しいAIシステムを全社に導入すべきか？",
        context="コスト削減と効率化が期待されるが、従業員の反発も予想される"
    )
    
    try:
        # MAGI意思決定実行
        response = await magi.decide(test_request)
        
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
        stats = magi.get_system_stats()
        print(f"\n📈 System Statistics:")
        print(f"   Total Decisions: {stats['total_decisions']}")
        print(f"   Average Execution Time: {stats['average_execution_time']:.0f}ms")
        
        return response
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return None


if __name__ == "__main__":
    asyncio.run(test_magi_strands_system())