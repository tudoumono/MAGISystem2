"""
Integration Tests - MAGI Decision System

エージェント間の統合動作とA2A通信をテストします。

学習ポイント:
- マルチエージェント統合テストの実装
- A2A通信の検証手法
- システム全体の動作確認
"""

import pytest
import asyncio
from typing import List

from ..shared.types import (
    AgentType, DecisionType, MAGIDecisionRequest, MAGIDecisionResponse,
    AgentResponse, JudgeResponse
)
from ..solomon.agent import SolomonJudgeAgent


class TestMAGISystemIntegration:
    """
    MAGIシステム全体の統合テスト
    
    3賢者 + SOLOMON Judgeの協調動作を検証します。
    """
    
    @pytest.fixture
    def solomon_agent(self):
        """SOLOMON Judgeエージェントのフィクスチャ"""
        return SolomonJudgeAgent()
    
    @pytest.mark.asyncio
    async def test_complete_decision_flow(self, solomon_agent):
        """
        完全な意思決定フローをテスト
        
        質問 → 3賢者分析 → SOLOMON統合 → 最終判断
        """
        # テストケース: 技術導入の意思決定
        request = MAGIDecisionRequest(
            question="Should our organization adopt artificial intelligence for customer service?",
            context="We are considering implementing AI chatbots to improve customer support efficiency."
        )
        
        response = await solomon_agent.decide(request)
        
        # 基本構造の検証
        assert isinstance(response, MAGIDecisionResponse)
        assert response.request_id is not None
        assert response.trace_id is not None
        
        # 3賢者の応答検証
        self._verify_sage_responses(response.agent_responses)
        
        # SOLOMON Judge応答検証
        self._verify_judge_response(response.judge_response, response.agent_responses)
        
        # トレース情報の検証
        self._verify_trace_steps(response.trace_steps)
        
        # 実行時間の検証
        assert response.total_execution_time > 0
        
        print(f"\n=== Complete Decision Flow Test ===")
        print(f"Question: {request.question}")
        print(f"Final Decision: {response.judge_response.final_decision.value}")
        print(f"Voting: Approved={response.judge_response.voting_result.approved}, "
              f"Rejected={response.judge_response.voting_result.rejected}")
        print(f"Total Execution Time: {response.total_execution_time}ms")
    
    @pytest.mark.asyncio
    async def test_multiple_decision_scenarios(self, solomon_agent):
        """
        複数の意思決定シナリオをテスト
        
        異なる種類の質問に対する一貫した動作を検証します。
        """
        scenarios = [
            {
                "name": "Conservative Scenario",
                "question": "Should we maintain our current stable system without any changes?",
                "expected_caspar_tendency": DecisionType.APPROVED
            },
            {
                "name": "Innovative Scenario", 
                "question": "Should we pursue a revolutionary new creative approach?",
                "expected_balthasar_tendency": DecisionType.APPROVED
            },
            {
                "name": "Data-Driven Scenario",
                "question": "Based on research data and statistical analysis, what should we do?",
                "expected_melchior_tendency": DecisionType.APPROVED
            },
            {
                "name": "Risky Scenario",
                "question": "Should we implement an untested experimental solution immediately?",
                "expected_caspar_tendency": DecisionType.REJECTED
            }
        ]
        
        results = []
        
        for scenario in scenarios:
            request = MAGIDecisionRequest(question=scenario["question"])
            response = await solomon_agent.decide(request)
            
            results.append({
                "scenario": scenario["name"],
                "question": scenario["question"],
                "final_decision": response.judge_response.final_decision,
                "voting_result": response.judge_response.voting_result,
                "agent_responses": response.agent_responses
            })
        
        # 結果の表示と基本検証
        print(f"\n=== Multiple Decision Scenarios Test ===")
        for result in results:
            print(f"\nScenario: {result['scenario']}")
            print(f"Final Decision: {result['final_decision'].value}")
            print(f"Voting: A={result['voting_result'].approved}, R={result['voting_result'].rejected}")
            
            # 各賢者の応答を表示
            for agent_response in result['agent_responses']:
                print(f"  {agent_response.agent_id.value}: {agent_response.decision.value} "
                      f"(confidence: {agent_response.confidence:.2f})")
        
        # 全てのシナリオで適切な応答が得られることを検証
        for result in results:
            assert result['final_decision'] in [DecisionType.APPROVED, DecisionType.REJECTED]
            assert result['voting_result'].total_votes == 3
            assert len(result['agent_responses']) == 3
    
    @pytest.mark.asyncio
    async def test_concurrent_decisions(self, solomon_agent):
        """
        並行意思決定処理をテスト
        
        複数の質問を同時に処理する能力を検証します。
        """
        questions = [
            "Should we expand our team?",
            "Should we upgrade our infrastructure?", 
            "Should we launch a new product?",
            "Should we enter a new market?"
        ]
        
        # 並行実行
        tasks = [
            solomon_agent.decide(MAGIDecisionRequest(question=q))
            for q in questions
        ]
        
        responses = await asyncio.gather(*tasks)
        
        # 全ての応答が適切に処理されることを検証
        assert len(responses) == len(questions)
        
        for i, response in enumerate(responses):
            assert isinstance(response, MAGIDecisionResponse)
            assert len(response.agent_responses) == 3
            assert response.judge_response is not None
            
            print(f"\nConcurrent Decision {i+1}: {questions[i]}")
            print(f"Result: {response.judge_response.final_decision.value}")
    
    @pytest.mark.asyncio
    async def test_error_recovery(self, solomon_agent):
        """
        エラー回復機能をテスト
        
        部分的な失敗からの回復能力を検証します。
        """
        # 正常なケース
        normal_request = MAGIDecisionRequest(
            question="Should we proceed with this normal proposal?"
        )
        
        normal_response = await solomon_agent.decide(normal_request)
        assert isinstance(normal_response, MAGIDecisionResponse)
        
        # エラーケース（空の質問）
        with pytest.raises(Exception):
            error_request = MAGIDecisionRequest(question="")
            await solomon_agent.decide(error_request)
        
        # エラー後の正常動作確認
        recovery_request = MAGIDecisionRequest(
            question="Should we test error recovery?"
        )
        
        recovery_response = await solomon_agent.decide(recovery_request)
        assert isinstance(recovery_response, MAGIDecisionResponse)
        
        print(f"\n=== Error Recovery Test ===")
        print(f"Normal operation: {normal_response.judge_response.final_decision.value}")
        print(f"Recovery operation: {recovery_response.judge_response.final_decision.value}")
    
    def _verify_sage_responses(self, agent_responses: List[AgentResponse]):
        """3賢者の応答を検証"""
        assert len(agent_responses) == 3
        
        agent_ids = {r.agent_id for r in agent_responses}
        expected_agents = {AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR}
        assert agent_ids == expected_agents
        
        for response in agent_responses:
            assert response.decision in [DecisionType.APPROVED, DecisionType.REJECTED]
            assert isinstance(response.content, str)
            assert len(response.content) > 0
            assert isinstance(response.reasoning, str)
            assert len(response.reasoning) > 0
            assert 0.0 <= response.confidence <= 1.0
            assert response.execution_time >= 0
    
    def _verify_judge_response(self, judge_response: JudgeResponse, agent_responses: List[AgentResponse]):
        """SOLOMON Judge応答を検証"""
        assert judge_response.final_decision in [DecisionType.APPROVED, DecisionType.REJECTED]
        
        # 投票結果の整合性確認
        voting = judge_response.voting_result
        assert voting.total_votes == 3
        assert voting.approved + voting.rejected + voting.abstained == 3
        
        # スコアの検証
        assert len(judge_response.scores) == 3
        for score in judge_response.scores:
            assert 0 <= score.score <= 100
            assert isinstance(score.reasoning, str)
        
        # その他のフィールド検証
        assert isinstance(judge_response.summary, str)
        assert isinstance(judge_response.final_recommendation, str)
        assert isinstance(judge_response.reasoning, str)
        assert 0.0 <= judge_response.confidence <= 1.0
        assert judge_response.execution_time >= 0
    
    def _verify_trace_steps(self, trace_steps: List):
        """トレースステップを検証"""
        assert len(trace_steps) > 0
        
        for step in trace_steps:
            assert "id" in step
            assert "trace_id" in step
            assert "step_number" in step
            assert "agent_id" in step
            assert "action" in step
            assert "duration" in step
            assert step["duration"] >= 0


class TestA2ACommunication:
    """
    A2A (Agent-to-Agent) 通信のテスト
    
    エージェント間の通信プロトコルを検証します。
    """
    
    @pytest.mark.asyncio
    async def test_tool_communication(self):
        """
        ツール通信をテスト
        
        SOLOMON → 3賢者ツール呼び出しの動作を検証します。
        """
        solomon = SolomonJudgeAgent()
        
        # ツールとしての3賢者の動作確認
        question = "Test question for tool communication"
        trace_id = "test-trace-123"
        
        # 各ツールの個別テスト
        caspar_response = await solomon.caspar_tool.execute(question, trace_id)
        balthasar_response = await solomon.balthasar_tool.execute(question, trace_id)
        melchior_response = await solomon.melchior_tool.execute(question, trace_id)
        
        responses = [caspar_response, balthasar_response, melchior_response]
        
        # 全ての応答が適切な構造を持つことを検証
        for response in responses:
            assert isinstance(response, AgentResponse)
            assert response.agent_id in [AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR]
            assert response.decision in [DecisionType.APPROVED, DecisionType.REJECTED]
            assert response.execution_time >= 0
        
        print(f"\n=== A2A Tool Communication Test ===")
        for response in responses:
            print(f"{response.agent_id.value}: {response.decision.value} "
                  f"(time: {response.execution_time}ms)")


if __name__ == "__main__":
    # テストの実行例
    pytest.main([__file__, "-v", "-s"])