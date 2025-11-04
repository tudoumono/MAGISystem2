#!/usr/bin/env python3
"""
MAGI Decision System - Python単体動作確認

AgentCore RuntimeとStrands Agentsの動作を確認します。
依存関係がない場合はモックモードで動作します。
"""

import asyncio
import sys
from datetime import datetime
from typing import Optional

# 共通型定義のインポート
from shared.types import (
    AgentType, DecisionType, AgentResponse, 
    MAGIDecisionRequest, MAGIDecisionResponse,
    JudgeResponse, VotingResult, AgentScore
)


class MockMAGISystem:
    """
    モックMAGIシステム
    
    Strands Agentsがインストールされていない環境でも
    動作確認できるモック実装
    """
    
    def __init__(self):
        print("🤖 Initializing Mock MAGI System...")
        print("   ⚠️  Running in MOCK mode (no actual LLM calls)")
        self.execution_count = 0
    
    async def process_decision(self, request: MAGIDecisionRequest) -> MAGIDecisionResponse:
        """モック意思決定プロセス"""
        start_time = datetime.now()
        self.execution_count += 1
        
        print(f"\n🧠 MAGI Decision Process Started (Mock Mode)")
        print(f"   Question: {request.question}")
        
        # モック応答を生成
        await asyncio.sleep(0.5)  # 処理時間をシミュレート
        
        # 3賢者のモック応答
        sage_responses = [
            AgentResponse(
                agent_id=AgentType.CASPAR,
                decision=DecisionType.REJECTED,
                content="保守的な観点から、リスクが高すぎると判断します。",
                reasoning="既存システムへの影響が大きく、従業員の反発も予想される",
                confidence=0.75,
                execution_time=500,
                timestamp=datetime.now()
            ),
            AgentResponse(
                agent_id=AgentType.BALTHASAR,
                decision=DecisionType.APPROVED,
                content="革新的な挑戦として、導入を推奨します。",
                reasoning="長期的な効率化とコスト削減が期待できる",
                confidence=0.80,
                execution_time=520,
                timestamp=datetime.now()
            ),
            AgentResponse(
                agent_id=AgentType.MELCHIOR,
                decision=DecisionType.APPROVED,
                content="データに基づき、段階的導入を推奨します。",
                reasoning="パイロット導入でリスクを軽減しながら効果を検証可能",
                confidence=0.85,
                execution_time=510,
                timestamp=datetime.now()
            )
        ]
        
        # SOLOMON Judgeのモック応答
        judge_response = JudgeResponse(
            final_decision=DecisionType.APPROVED,
            voting_result=VotingResult(
                approved=2,
                rejected=1,
                abstained=0
            ),
            scores=[
                AgentScore(agent_id=AgentType.CASPAR, score=75, reasoning="リスク分析は適切"),
                AgentScore(agent_id=AgentType.BALTHASAR, score=80, reasoning="革新性を評価"),
                AgentScore(agent_id=AgentType.MELCHIOR, score=85, reasoning="バランスの取れた提案")
            ],
            summary="2対1で可決。段階的導入により、リスクを管理しながら効率化を実現できる。",
            final_recommendation="パイロット導入から開始し、効果を検証しながら全社展開を検討すべき。",
            reasoning="多数決により可決。BALTHASARとMELCHIORの革新的・科学的視点を重視。",
            confidence=0.80,
            execution_time=100,
            timestamp=datetime.now()
        )
        
        end_time = datetime.now()
        total_execution_time = int((end_time - start_time).total_seconds() * 1000)
        
        response = MAGIDecisionResponse(
            request_id=f"mock_{int(start_time.timestamp())}",
            trace_id=f"trace_{self.execution_count}",
            agent_responses=sage_responses,
            judge_response=judge_response,
            total_execution_time=total_execution_time,
            trace_steps=[],
            errors=[],
            has_errors=False,
            degraded_mode=False,
            timestamp=start_time,
            version="1.0-mock"
        )
        
        return response


async def test_mock_system():
    """モックシステムのテスト"""
    print("=" * 60)
    print("🚀 MAGI Decision System - Python単体動作確認")
    print("=" * 60)
    print()
    
    # モックシステム初期化
    magi = MockMAGISystem()
    
    # テスト質問
    test_request = MAGIDecisionRequest(
        question="新しいAIシステムを全社に導入すべきか？",
        context="コスト削減と効率化が期待されるが、従業員の反発も予想される"
    )
    
    try:
        # MAGI意思決定実行
        response = await magi.process_decision(test_request)
        
        print(f"\n📊 MAGI Decision Results:")
        print(f"   Request ID: {response.request_id}")
        print(f"   Trace ID: {response.trace_id}")
        print(f"   Final Decision: {response.judge_response.final_decision.value}")
        print(f"   Execution Time: {response.total_execution_time}ms")
        print(f"   Voting: {response.judge_response.voting_result.approved}可決 / {response.judge_response.voting_result.rejected}否決")
        
        print(f"\n🧠 Individual Sage Results:")
        for agent_response in response.agent_responses:
            print(f"   {agent_response.agent_id.value.upper()}:")
            print(f"      Decision: {agent_response.decision.value}")
            print(f"      Confidence: {agent_response.confidence:.2f}")
            print(f"      Reasoning: {agent_response.reasoning}")
        
        print(f"\n⚖️  SOLOMON Judge Evaluation:")
        print(f"   Summary: {response.judge_response.summary}")
        print(f"   Recommendation: {response.judge_response.final_recommendation}")
        print(f"   Confidence: {response.judge_response.confidence:.2f}")
        
        print(f"\n📈 Scores:")
        for score in response.judge_response.scores:
            print(f"   {score.agent_id.value.upper()}: {score.score}/100 - {score.reasoning}")
        
        print(f"\n✅ Test completed successfully!")
        print(f"   Version: {response.version}")
        print(f"   Errors: {len(response.errors)}")
        print(f"   Degraded Mode: {response.degraded_mode}")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


async def test_real_system():
    """実際のMAGI Strands Systemのテスト"""
    print("=" * 60)
    print("🚀 MAGI Strands System - Real Implementation Test")
    print("=" * 60)
    print()
    
    try:
        from magi_strands_agents import MAGIStrandsSystem
        
        print("✅ Strands Agents available - using real implementation")
        
        # 実システム初期化
        magi = MAGIStrandsSystem()
        
        # テスト質問
        test_request = MAGIDecisionRequest(
            question="新しいAIシステムを全社に導入すべきか？",
            context="コスト削減と効率化が期待されるが、従業員の反発も予想される"
        )
        
        # MAGI意思決定実行
        response = await magi.decide(test_request)
        
        print(f"\n📊 MAGI Decision Results:")
        print(f"   Final Decision: {response.judge_response.final_decision.value}")
        print(f"   Execution Time: {response.total_execution_time}ms")
        print(f"   Voting: {response.judge_response.voting_result.approved}可決 / {response.judge_response.voting_result.rejected}否決")
        
        print(f"\n🧠 Individual Sage Results:")
        for agent_response in response.agent_responses:
            print(f"   {agent_response.agent_id.value}: {agent_response.decision.value} (confidence: {agent_response.confidence:.2f})")
        
        print(f"\n✅ Real system test completed successfully!")
        
        return 0
        
    except ImportError as e:
        print(f"⚠️  Strands Agents not available: {e}")
        print(f"   Falling back to mock mode...")
        return await test_mock_system()
    
    except Exception as e:
        print(f"\n❌ Real system test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


def main():
    """メイン関数"""
    # コマンドライン引数で実行モードを選択
    if len(sys.argv) > 1 and sys.argv[1] == "--real":
        return asyncio.run(test_real_system())
    else:
        return asyncio.run(test_mock_system())


if __name__ == "__main__":
    exit(main())
