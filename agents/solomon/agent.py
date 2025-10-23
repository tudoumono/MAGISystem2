"""
SOLOMON Judge Agent Implementation

SOLOMON Judgeは3賢者の判断を統合し、最終的な意思決定を行います。
Strands Agentsフレームワークを使用してA2A通信を実装します。

学習ポイント:
- Strands Agentsでのエージェント実装パターン
- ツールオーケストレーションの実装
- JSON構造化出力の処理
"""

import json
import time
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

# Strands Agents imports (実際の実装では適切なimportに置き換え)
# from strands_agents import Agent, Tool
# from strands_agents.protocols import A2AProtocol

from ..shared.types import (
    AgentType, DecisionType, AgentResponse, JudgeResponse, 
    MAGIDecisionRequest, MAGIDecisionResponse, TraceStep,
    AgentScore, VotingResult
)
from ..shared.prompts import SOLOMON_SYSTEM_PROMPT
from ..shared.utils import (
    generate_trace_id, generate_request_id, format_execution_time,
    create_trace_step, log_agent_execution, trace_agent_execution
)
from .tools import CasparTool, BalthasarTool, MelchiorTool


class SolomonJudgeAgent:
    """
    SOLOMON Judge Agent - 統括意思決定エージェント
    
    3賢者（CASPAR、BALTHASAR、MELCHIOR）をツールとして活用し、
    最終的な意思決定を行います。
    
    学習ポイント:
    - エージェントオーケストレーションパターン
    - 非同期処理による並列実行
    - 構造化された意思決定プロセス
    """
    
    def __init__(self, model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"):
        """
        SOLOMON Judgeエージェントを初期化
        
        Args:
            model_id: 使用するLLMモデルID
        """
        self.agent_id = AgentType.SOLOMON
        self.model_id = model_id
        self.system_prompt = SOLOMON_SYSTEM_PROMPT
        
        # 3賢者ツールの初期化
        self.caspar_tool = CasparTool()
        self.balthasar_tool = BalthasarTool()
        self.melchior_tool = MelchiorTool()
        
        # 実行統計
        self.execution_count = 0
        self.total_execution_time = 0
        
    @trace_agent_execution("solomon", "decide")
    async def decide(self, request: MAGIDecisionRequest) -> MAGIDecisionResponse:
        """
        MAGI意思決定プロセスを実行
        
        Args:
            request: 意思決定リクエスト
            
        Returns:
            MAGIDecisionResponse: 統合された意思決定結果
            
        学習ポイント:
        - 非同期処理による並列エージェント実行
        - エラーハンドリングと回復処理
        - 構造化されたレスポンス生成
        """
        start_time = time.time()
        request_id = generate_request_id()
        trace_id = request.trace_id or generate_trace_id()
        
        trace_steps = []
        
        try:
            # Step 1: 質問分析
            analysis_step = await self._analyze_question(
                request.question, trace_id, 1
            )
            trace_steps.append(analysis_step)
            
            # Step 2: 3賢者への並列委託
            sage_responses = await self._consult_sages(
                request.question, trace_id, 2
            )
            
            # 各賢者の実行をトレースステップとして記録
            for i, response in enumerate(sage_responses):
                step = create_trace_step(
                    trace_id=trace_id,
                    step_number=3 + i,
                    agent_id=response.agent_id.value,
                    action=f"Sage consultation: {response.decision.value}",
                    duration=response.execution_time,
                    tools_used=[f"{response.agent_id.value}_tool"],
                    metadata={"confidence": response.confidence}
                )
                trace_steps.append(step)
            
            # Step 3: 統合評価
            judge_response = await self._evaluate_responses(
                sage_responses, trace_id, 6
            )
            
            evaluation_step = create_trace_step(
                trace_id=trace_id,
                step_number=6,
                agent_id="solomon",
                action=f"Final evaluation: {judge_response.final_decision.value}",
                duration=judge_response.execution_time,
                tools_used=["evaluation_engine"],
                metadata={"confidence": judge_response.confidence}
            )
            trace_steps.append(evaluation_step)
            
            # 実行統計の更新
            total_time = format_execution_time(start_time)
            self.execution_count += 1
            self.total_execution_time += total_time
            
            # 成功ログ
            log_agent_execution(
                agent_id="solomon",
                action="decide",
                duration=total_time,
                success=True,
                metadata={
                    "request_id": request_id,
                    "trace_id": trace_id,
                    "final_decision": judge_response.final_decision.value
                }
            )
            
            return MAGIDecisionResponse(
                request_id=request_id,
                trace_id=trace_id,
                agent_responses=sage_responses,
                judge_response=judge_response,
                total_execution_time=total_time,
                trace_steps=trace_steps,
                timestamp=datetime.now(),
                version="1.0"
            )
            
        except Exception as e:
            # エラーログ
            error_time = format_execution_time(start_time)
            log_agent_execution(
                agent_id="solomon",
                action="decide",
                duration=error_time,
                success=False,
                error_message=str(e),
                metadata={"request_id": request_id, "trace_id": trace_id}
            )
            raise
    
    async def _analyze_question(
        self, question: str, trace_id: str, step_number: int
    ) -> Dict[str, Any]:
        """
        質問を分析し、適切な委託戦略を決定
        
        Args:
            question: 分析対象の質問
            trace_id: トレース識別子
            step_number: ステップ番号
            
        Returns:
            Dict[str, Any]: 分析結果のトレースステップ
        """
        start_time = time.time()
        
        # 質問の複雑性と種別を分析（簡易実装）
        analysis = {
            "complexity": "medium",
            "domain": "general",
            "requires_risk_analysis": "risk" in question.lower(),
            "requires_innovation": "new" in question.lower() or "innovative" in question.lower(),
            "requires_data_analysis": "data" in question.lower() or "analysis" in question.lower()
        }
        
        duration = format_execution_time(start_time)
        
        return create_trace_step(
            trace_id=trace_id,
            step_number=step_number,
            agent_id="solomon",
            action="Question analysis completed",
            duration=duration,
            tools_used=["question_analyzer"],
            metadata=analysis
        )
    
    async def _consult_sages(
        self, question: str, trace_id: str, base_step_number: int
    ) -> List[AgentResponse]:
        """
        3賢者に並列で質問を委託
        
        Args:
            question: 委託する質問
            trace_id: トレース識別子
            base_step_number: ベースステップ番号
            
        Returns:
            List[AgentResponse]: 3賢者からの応答
            
        学習ポイント:
        - asyncio.gatherによる並列実行
        - エラーハンドリングと部分失敗対応
        """
        # 3賢者への並列委託
        tasks = [
            self.caspar_tool.execute(question, trace_id),
            self.balthasar_tool.execute(question, trace_id),
            self.melchior_tool.execute(question, trace_id)
        ]
        
        try:
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 成功した応答のみを収集
            valid_responses = []
            for i, response in enumerate(responses):
                if isinstance(response, Exception):
                    # エラーの場合は棄権として処理
                    agent_names = ["caspar", "balthasar", "melchior"]
                    error_response = AgentResponse(
                        agent_id=AgentType(agent_names[i]),
                        decision=DecisionType.REJECTED,  # エラー時は否決扱い
                        content=f"エージェント実行エラー: {str(response)}",
                        reasoning="システムエラーにより判断を実行できませんでした",
                        confidence=0.0,
                        execution_time=0
                    )
                    valid_responses.append(error_response)
                else:
                    valid_responses.append(response)
            
            return valid_responses
            
        except Exception as e:
            # 全体的な失敗の場合、デフォルト応答を生成
            return self._generate_fallback_responses(str(e))
    
    async def _evaluate_responses(
        self, sage_responses: List[AgentResponse], trace_id: str, step_number: int
    ) -> JudgeResponse:
        """
        3賢者の応答を評価し、最終判断を生成
        
        Args:
            sage_responses: 3賢者からの応答
            trace_id: トレース識別子
            step_number: ステップ番号
            
        Returns:
            JudgeResponse: SOLOMON Judgeの最終評価
        """
        start_time = time.time()
        
        # 投票結果の集計
        voting_result = self._calculate_voting_result(sage_responses)
        
        # 各賢者のスコアリング
        scores = self._score_responses(sage_responses)
        
        # 最終判断の決定
        final_decision = self._determine_final_decision(voting_result, scores)
        
        # 統合要約の生成
        summary = self._generate_summary(sage_responses, voting_result)
        final_recommendation = self._generate_recommendation(sage_responses, final_decision)
        reasoning = self._generate_reasoning(voting_result, scores, final_decision)
        
        # 確信度の計算
        confidence = self._calculate_confidence(sage_responses, voting_result)
        
        execution_time = format_execution_time(start_time)
        
        return JudgeResponse(
            final_decision=final_decision,
            voting_result=voting_result,
            scores=scores,
            summary=summary,
            final_recommendation=final_recommendation,
            reasoning=reasoning,
            confidence=confidence,
            execution_time=execution_time,
            timestamp=datetime.now()
        )
    
    def _calculate_voting_result(self, responses: List[AgentResponse]) -> VotingResult:
        """投票結果を集計"""
        approved = sum(1 for r in responses if r.decision == DecisionType.APPROVED)
        rejected = sum(1 for r in responses if r.decision == DecisionType.REJECTED)
        abstained = len(responses) - approved - rejected
        
        return VotingResult(
            approved=approved,
            rejected=rejected,
            abstained=abstained
        )
    
    def _score_responses(self, responses: List[AgentResponse]) -> List[AgentScore]:
        """各賢者の応答をスコアリング"""
        scores = []
        
        for response in responses:
            # 基本スコア（確信度ベース）
            base_score = int(response.confidence * 100)
            
            # 内容の質による調整（簡易実装）
            content_quality = min(20, len(response.reasoning) // 10)  # 根拠の詳細度
            
            # 最終スコア
            final_score = min(100, base_score + content_quality)
            
            scores.append(AgentScore(
                agent_id=response.agent_id,
                score=final_score,
                reasoning=f"確信度: {response.confidence:.2f}, 根拠の詳細度: {content_quality}/20"
            ))
        
        return scores
    
    def _determine_final_decision(
        self, voting_result: VotingResult, scores: List[AgentScore]
    ) -> DecisionType:
        """最終判断を決定"""
        # 基本は多数決
        if voting_result.approved > voting_result.rejected:
            return DecisionType.APPROVED
        elif voting_result.rejected > voting_result.approved:
            return DecisionType.REJECTED
        else:
            # 同数の場合はスコアの高い方を採用
            avg_approved_score = sum(
                s.score for s in scores 
                if any(r.agent_id == s.agent_id and r.decision == DecisionType.APPROVED 
                      for r in [])  # 実際の実装では適切な参照を使用
            ) / max(1, voting_result.approved)
            
            avg_rejected_score = sum(
                s.score for s in scores 
                if any(r.agent_id == s.agent_id and r.decision == DecisionType.REJECTED 
                      for r in [])  # 実際の実装では適切な参照を使用
            ) / max(1, voting_result.rejected)
            
            return DecisionType.APPROVED if avg_approved_score >= avg_rejected_score else DecisionType.REJECTED
    
    def _generate_summary(
        self, responses: List[AgentResponse], voting_result: VotingResult
    ) -> str:
        """統合要約を生成"""
        return f"3賢者による投票結果: 可決{voting_result.approved}票、否決{voting_result.rejected}票。" \
               f"各賢者の多様な視点を総合的に評価しました。"
    
    def _generate_recommendation(
        self, responses: List[AgentResponse], final_decision: DecisionType
    ) -> str:
        """最終推奨を生成"""
        if final_decision == DecisionType.APPROVED:
            return "提案の実行を推奨します。ただし、指摘されたリスクへの対策を講じることを条件とします。"
        else:
            return "提案の見直しを推奨します。代替案の検討や追加の準備が必要です。"
    
    def _generate_reasoning(
        self, voting_result: VotingResult, scores: List[AgentScore], final_decision: DecisionType
    ) -> str:
        """最終判断の根拠を生成"""
        avg_score = sum(s.score for s in scores) / len(scores) if scores else 0
        
        return f"投票結果（可決{voting_result.approved}票、否決{voting_result.rejected}票）と" \
               f"平均スコア（{avg_score:.1f}点）を総合的に評価し、{final_decision.value}と判断しました。"
    
    def _calculate_confidence(
        self, responses: List[AgentResponse], voting_result: VotingResult
    ) -> float:
        """最終判断の確信度を計算"""
        # 合意度による確信度計算
        total_votes = voting_result.total_votes
        if total_votes == 0:
            return 0.0
        
        max_votes = max(voting_result.approved, voting_result.rejected)
        consensus_rate = max_votes / total_votes
        
        # 個別確信度の平均
        avg_individual_confidence = sum(r.confidence for r in responses) / len(responses)
        
        # 総合確信度
        return (consensus_rate + avg_individual_confidence) / 2
    
    def _generate_fallback_responses(self, error_message: str) -> List[AgentResponse]:
        """エラー時のフォールバック応答を生成"""
        fallback_responses = []
        agents = [AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR]
        
        for agent in agents:
            response = AgentResponse(
                agent_id=agent,
                decision=DecisionType.REJECTED,
                content=f"システムエラーにより判断を実行できませんでした: {error_message}",
                reasoning="技術的な問題により、適切な分析を行うことができませんでした",
                confidence=0.0,
                execution_time=0
            )
            fallback_responses.append(response)
        
        return fallback_responses
    
    def get_execution_stats(self) -> Dict[str, Any]:
        """実行統計を取得"""
        avg_execution_time = (
            self.total_execution_time / self.execution_count 
            if self.execution_count > 0 else 0
        )
        
        return {
            "execution_count": self.execution_count,
            "total_execution_time": self.total_execution_time,
            "average_execution_time": avg_execution_time,
            "agent_id": self.agent_id.value,
            "model_id": self.model_id
        }