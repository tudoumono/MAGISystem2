#!/usr/bin/env python3
"""
MAGI Decision System - データフロー検証

型定義とデータフローが正しく機能することを確認します。
"""

import json
from datetime import datetime
from shared.types import (
    AgentType, DecisionType, AgentResponse, 
    MAGIDecisionRequest, MAGIDecisionResponse,
    JudgeResponse, VotingResult, AgentScore,
    ExecutionError
)


def test_agent_response_serialization():
    """AgentResponseのシリアライゼーションテスト"""
    print("🧪 Testing AgentResponse serialization...")
    
    response = AgentResponse(
        agent_id=AgentType.CASPAR,
        decision=DecisionType.APPROVED,
        content="テスト内容",
        reasoning="テスト理由",
        confidence=0.85,
        execution_time=1000,
        timestamp=datetime.now()
    )
    
    # Pydanticのmodel_dump()でJSON変換
    response_dict = response.model_dump()
    
    assert response_dict['agent_id'] == 'caspar'
    assert response_dict['decision'] == 'APPROVED'
    assert response_dict['confidence'] == 0.85
    
    # JSON文字列化
    json_str = json.dumps(response_dict, default=str)
    assert 'caspar' in json_str
    
    print("   ✅ AgentResponse serialization works correctly")


def test_voting_result_calculations():
    """VotingResultの計算機能テスト"""
    print("🧪 Testing VotingResult calculations...")
    
    voting = VotingResult(
        approved=2,
        rejected=1,
        abstained=0
    )
    
    assert voting.total_votes == 3
    assert voting.approval_rate == 2/3
    
    # 全員棄権の場合
    voting_abstain = VotingResult(
        approved=0,
        rejected=0,
        abstained=3
    )
    
    assert voting_abstain.total_votes == 3
    assert voting_abstain.approval_rate == 0.0
    
    print("   ✅ VotingResult calculations work correctly")


def test_magi_decision_response_with_errors():
    """エラー情報を含むMAGIDecisionResponseのテスト"""
    print("🧪 Testing MAGIDecisionResponse with errors...")
    
    # エラー情報を作成
    errors = [
        ExecutionError(
            agent_id=AgentType.CASPAR,
            error_type="TimeoutError",
            error_message="Request timeout after 30s",
            retry_count=2,
            recovered=True
        )
    ]
    
    # 3賢者の応答
    sage_responses = [
        AgentResponse(
            agent_id=AgentType.CASPAR,
            decision=DecisionType.REJECTED,
            content="リトライ後の応答",
            reasoning="リトライで回復",
            confidence=0.70,
            execution_time=2000,
            timestamp=datetime.now()
        ),
        AgentResponse(
            agent_id=AgentType.BALTHASAR,
            decision=DecisionType.APPROVED,
            content="正常応答",
            reasoning="問題なし",
            confidence=0.85,
            execution_time=1000,
            timestamp=datetime.now()
        ),
        AgentResponse(
            agent_id=AgentType.MELCHIOR,
            decision=DecisionType.APPROVED,
            content="正常応答",
            reasoning="問題なし",
            confidence=0.80,
            execution_time=1100,
            timestamp=datetime.now()
        )
    ]
    
    # Judge応答
    judge_response = JudgeResponse(
        final_decision=DecisionType.APPROVED,
        voting_result=VotingResult(approved=2, rejected=1, abstained=0),
        scores=[
            AgentScore(agent_id=AgentType.CASPAR, score=70, reasoning="リトライで回復"),
            AgentScore(agent_id=AgentType.BALTHASAR, score=85, reasoning="優秀"),
            AgentScore(agent_id=AgentType.MELCHIOR, score=80, reasoning="良好")
        ],
        summary="2対1で可決",
        final_recommendation="実施推奨",
        reasoning="多数決",
        confidence=0.78,
        execution_time=500,
        timestamp=datetime.now()
    )
    
    # MAGIDecisionResponse作成
    response = MAGIDecisionResponse(
        request_id="test_001",
        trace_id="trace_001",
        agent_responses=sage_responses,
        judge_response=judge_response,
        total_execution_time=3600,
        trace_steps=[],
        errors=errors,
        has_errors=True,
        degraded_mode=False,
        timestamp=datetime.now(),
        version="1.0-test"
    )
    
    # 検証
    assert response.has_errors == True
    assert response.degraded_mode == False
    assert len(response.errors) == 1
    assert response.errors[0].recovered == True
    assert response.errors[0].retry_count == 2
    
    # シリアライゼーション
    response_dict = response.model_dump()
    assert response_dict['has_errors'] == True
    assert len(response_dict['errors']) == 1
    
    print("   ✅ MAGIDecisionResponse with errors works correctly")


def test_request_validation():
    """MAGIDecisionRequestのバリデーションテスト"""
    print("🧪 Testing MAGIDecisionRequest validation...")
    
    # 正常なリクエスト
    valid_request = MAGIDecisionRequest(
        question="テスト質問",
        context="テストコンテキスト"
    )
    
    assert valid_request.question == "テスト質問"
    assert valid_request.context == "テストコンテキスト"
    
    # 空白のみの質問は自動トリム
    trimmed_request = MAGIDecisionRequest(
        question="  テスト質問  "
    )
    
    assert trimmed_request.question == "テスト質問"
    
    # 空の質問はエラー
    try:
        invalid_request = MAGIDecisionRequest(
            question=""
        )
        assert False, "Empty question should raise ValueError"
    except ValueError:
        pass  # 期待通り
    
    print("   ✅ MAGIDecisionRequest validation works correctly")


def test_complete_data_flow():
    """完全なデータフローのテスト"""
    print("🧪 Testing complete data flow...")
    
    # 1. リクエスト作成
    request = MAGIDecisionRequest(
        question="データフローテスト",
        context="完全なフローを検証"
    )
    
    # 2. エージェント応答作成
    responses = []
    for agent_type in [AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR]:
        responses.append(AgentResponse(
            agent_id=agent_type,
            decision=DecisionType.APPROVED,
            content=f"{agent_type.value}の応答",
            reasoning=f"{agent_type.value}の理由",
            confidence=0.80,
            execution_time=1000,
            timestamp=datetime.now()
        ))
    
    # 3. Judge応答作成
    judge = JudgeResponse(
        final_decision=DecisionType.APPROVED,
        voting_result=VotingResult(approved=3, rejected=0, abstained=0),
        scores=[
            AgentScore(agent_id=r.agent_id, score=80, reasoning="良好")
            for r in responses
        ],
        summary="全員一致で可決",
        final_recommendation="実施を強く推奨",
        reasoning="全賢者が賛成",
        confidence=0.90,
        execution_time=500,
        timestamp=datetime.now()
    )
    
    # 4. 最終レスポンス作成
    final_response = MAGIDecisionResponse(
        request_id="flow_test_001",
        trace_id="trace_flow_001",
        agent_responses=responses,
        judge_response=judge,
        total_execution_time=3500,
        trace_steps=[],
        errors=[],
        has_errors=False,
        degraded_mode=False,
        timestamp=datetime.now(),
        version="1.0-flow-test"
    )
    
    # 5. JSON変換
    json_data = final_response.model_dump()
    json_str = json.dumps(json_data, default=str, ensure_ascii=False, indent=2)
    
    # 6. 検証
    assert len(json_data['agent_responses']) == 3
    assert json_data['judge_response']['final_decision'] == 'APPROVED'
    assert json_data['has_errors'] == False
    
    print("   ✅ Complete data flow works correctly")
    print(f"   📄 JSON size: {len(json_str)} bytes")


def main():
    """テストメイン関数"""
    print("=" * 60)
    print("🚀 MAGI Decision System - Data Flow Validation")
    print("=" * 60)
    print()
    
    try:
        test_agent_response_serialization()
        test_voting_result_calculations()
        test_magi_decision_response_with_errors()
        test_request_validation()
        test_complete_data_flow()
        
        print()
        print("=" * 60)
        print("✅ All data flow tests passed!")
        print("=" * 60)
        
        return 0
        
    except AssertionError as e:
        print()
        print("=" * 60)
        print(f"❌ Test failed: {e}")
        print("=" * 60)
        return 1
    
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ Unexpected error: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
