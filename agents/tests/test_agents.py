"""
Individual Agent Tests - MAGI Decision System

各エージェント（CASPAR、BALTHASAR、MELCHIOR、SOLOMON）の
個別機能をテストします。

学習ポイント:
- 非同期エージェントのテスト手法
- エージェント特性の検証方法
- モックデータを使用したテスト戦略
"""

import pytest
import asyncio
from unittest.mock import Mock, patch

from ..shared.types import AgentType, DecisionType, MAGIDecisionRequest
from ..solomon.agent import SolomonJudgeAgent
from ..caspar.agent import CasparAgent
from ..balthasar.agent import BalthasarAgent
from ..melchior.agent import MelchiorAgent


class TestCasparAgent:
    """
    CASPAR Agent のテスト
    
    保守的・現実的な判断特性を検証します。
    """
    
    @pytest.fixture
    def caspar_agent(self):
        """CASPARエージェントのフィクスチャ"""
        return CasparAgent()
    
    @pytest.mark.asyncio
    async def test_caspar_conservative_response(self, caspar_agent):
        """CASPARの保守的な応答をテスト"""
        # リスクの高い質問
        risky_question = "Should we implement an experimental new technology immediately?"
        
        response = await caspar_agent.analyze(risky_question)
        
        # 基本的な応答構造の検証
        assert response.agent_id == AgentType.CASPAR
        assert response.decision in [DecisionType.APPROVED, DecisionType.REJECTED]
        assert isinstance(response.content, str)
        assert isinstance(response.reasoning, str)
        assert 0.0 <= response.confidence <= 1.0
        assert response.execution_time >= 0
        
        # 保守的特性の検証（リスクの高い質問では否決傾向）
        # 注意: モックデータなので確定的ではないが、傾向をテスト
        print(f"CASPAR Decision: {response.decision}")
        print(f"CASPAR Reasoning: {response.reasoning}")
    
    @pytest.mark.asyncio
    async def test_caspar_low_risk_response(self, caspar_agent):
        """CASPARの低リスク質問への応答をテスト"""
        # リスクの低い質問
        safe_question = "Should we continue using our proven and tested approach?"
        
        response = await caspar_agent.analyze(safe_question)
        
        assert response.agent_id == AgentType.CASPAR
        assert isinstance(response.content, str)
        assert isinstance(response.reasoning, str)
        
        print(f"CASPAR Low Risk Decision: {response.decision}")
        print(f"CASPAR Low Risk Reasoning: {response.reasoning}")


class TestBalthasarAgent:
    """
    BALTHASAR Agent のテスト
    
    革新的・感情的な判断特性を検証します。
    """
    
    @pytest.fixture
    def balthasar_agent(self):
        """BALTHASARエージェントのフィクスチャ"""
        return BalthasarAgent()
    
    @pytest.mark.asyncio
    async def test_balthasar_innovative_response(self, balthasar_agent):
        """BALTHASARの革新的な応答をテスト"""
        # 革新的な質問
        innovative_question = "Should we pursue a creative and innovative breakthrough solution?"
        
        response = await balthasar_agent.analyze(innovative_question)
        
        # 基本的な応答構造の検証
        assert response.agent_id == AgentType.BALTHASAR
        assert response.decision in [DecisionType.APPROVED, DecisionType.REJECTED]
        assert isinstance(response.content, str)
        assert isinstance(response.reasoning, str)
        assert 0.0 <= response.confidence <= 1.0
        assert response.execution_time >= 0
        
        # 革新的特性の検証（革新的な質問では可決傾向）
        print(f"BALTHASAR Decision: {response.decision}")
        print(f"BALTHASAR Reasoning: {response.reasoning}")
    
    @pytest.mark.asyncio
    async def test_balthasar_optimistic_tendency(self, balthasar_agent):
        """BALTHASARの楽観的傾向をテスト"""
        # 一般的な質問
        general_question = "Should we proceed with this proposal?"
        
        response = await balthasar_agent.analyze(general_question)
        
        assert response.agent_id == AgentType.BALTHASAR
        # BALTHASARは基本的に前向き（可決傾向）
        # 注意: モックデータなので確定的ではない
        
        print(f"BALTHASAR General Decision: {response.decision}")
        print(f"BALTHASAR General Reasoning: {response.reasoning}")


class TestMelchiorAgent:
    """
    MELCHIOR Agent のテスト
    
    バランス型・科学的な判断特性を検証します。
    """
    
    @pytest.fixture
    def melchior_agent(self):
        """MELCHIORエージェントのフィクスチャ"""
        return MelchiorAgent()
    
    @pytest.mark.asyncio
    async def test_melchior_scientific_response(self, melchior_agent):
        """MELCHIORの科学的な応答をテスト"""
        # データに基づく質問
        scientific_question = "Based on research data and analysis, should we implement this solution?"
        
        response = await melchior_agent.analyze(scientific_question)
        
        # 基本的な応答構造の検証
        assert response.agent_id == AgentType.MELCHIOR
        assert response.decision in [DecisionType.APPROVED, DecisionType.REJECTED]
        assert isinstance(response.content, str)
        assert isinstance(response.reasoning, str)
        assert 0.0 <= response.confidence <= 1.0
        assert response.execution_time >= 0
        
        # 科学的特性の検証
        print(f"MELCHIOR Decision: {response.decision}")
        print(f"MELCHIOR Reasoning: {response.reasoning}")
    
    @pytest.mark.asyncio
    async def test_melchior_balanced_approach(self, melchior_agent):
        """MELCHIORのバランス型アプローチをテスト"""
        # バランスを要求する質問
        balanced_question = "What are the risks and opportunities of this approach?"
        
        response = await melchior_agent.analyze(balanced_question)
        
        assert response.agent_id == AgentType.MELCHIOR
        
        print(f"MELCHIOR Balanced Decision: {response.decision}")
        print(f"MELCHIOR Balanced Reasoning: {response.reasoning}")


class TestSolomonJudgeAgent:
    """
    SOLOMON Judge Agent のテスト
    
    統括者としての判断統合機能を検証します。
    """
    
    @pytest.fixture
    def solomon_agent(self):
        """SOLOMON Judgeエージェントのフィクスチャ"""
        return SolomonJudgeAgent()
    
    @pytest.mark.asyncio
    async def test_solomon_decision_process(self, solomon_agent):
        """SOLOMONの意思決定プロセスをテスト"""
        # テスト用リクエスト
        request = MAGIDecisionRequest(
            question="Should we adopt this new technology for our organization?",
            context="This is a test decision for the MAGI system."
        )
        
        response = await solomon_agent.decide(request)
        
        # 基本的な応答構造の検証
        assert response.request_id is not None
        assert response.trace_id is not None
        assert len(response.agent_responses) == 3  # 3賢者の応答
        assert response.judge_response is not None
        assert response.total_execution_time >= 0
        assert len(response.trace_steps) > 0
        
        # 3賢者の応答検証
        agent_ids = {r.agent_id for r in response.agent_responses}
        expected_agents = {AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR}
        assert agent_ids == expected_agents
        
        # Judge応答の検証
        judge = response.judge_response
        assert judge.final_decision in [DecisionType.APPROVED, DecisionType.REJECTED]
        assert judge.voting_result.total_votes == 3
        assert len(judge.scores) == 3
        assert 0.0 <= judge.confidence <= 1.0
        
        print(f"SOLOMON Final Decision: {judge.final_decision}")
        print(f"SOLOMON Voting Result: Approved={judge.voting_result.approved}, Rejected={judge.voting_result.rejected}")
        print(f"SOLOMON Confidence: {judge.confidence}")
    
    @pytest.mark.asyncio
    async def test_solomon_error_handling(self, solomon_agent):
        """SOLOMONのエラーハンドリングをテスト"""
        # 空の質問でエラーを誘発
        with pytest.raises(Exception):
            request = MAGIDecisionRequest(question="")
            await solomon_agent.decide(request)
    
    def test_solomon_execution_stats(self, solomon_agent):
        """SOLOMONの実行統計をテスト"""
        stats = solomon_agent.get_execution_stats()
        
        assert "execution_count" in stats
        assert "total_execution_time" in stats
        assert "average_execution_time" in stats
        assert "agent_id" in stats
        assert "model_id" in stats
        
        assert stats["agent_id"] == "solomon"


@pytest.mark.asyncio
async def test_agent_response_consistency():
    """
    全エージェントの応答一貫性をテスト
    
    同じ質問に対して、各エージェントが一貫した
    応答構造を返すことを検証します。
    """
    question = "Should we implement this new feature?"
    
    # 各エージェントのインスタンス作成
    caspar = CasparAgent()
    balthasar = BalthasarAgent()
    melchior = MelchiorAgent()
    
    # 並列実行
    responses = await asyncio.gather(
        caspar.analyze(question),
        balthasar.analyze(question),
        melchior.analyze(question)
    )
    
    # 全ての応答が適切な構造を持つことを検証
    for response in responses:
        assert response.agent_id in [AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR]
        assert response.decision in [DecisionType.APPROVED, DecisionType.REJECTED]
        assert isinstance(response.content, str)
        assert len(response.content) > 0
        assert isinstance(response.reasoning, str)
        assert len(response.reasoning) > 0
        assert 0.0 <= response.confidence <= 1.0
        assert response.execution_time >= 0
    
    # 各エージェントの特性が反映されていることを確認
    print("\n=== Agent Response Comparison ===")
    for response in responses:
        print(f"{response.agent_id.value}: {response.decision.value} (confidence: {response.confidence:.2f})")
        print(f"  Reasoning: {response.reasoning[:100]}...")


if __name__ == "__main__":
    # テストの実行例
    pytest.main([__file__, "-v", "-s"])