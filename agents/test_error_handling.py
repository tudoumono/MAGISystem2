#!/usr/bin/env python3
"""
エラーハンドリング機能のテスト

リトライ機構と段階的機能縮退のテストを行います。
"""

import asyncio
from datetime import datetime
from shared.types import (
    AgentType, DecisionType, AgentResponse, 
    MAGIDecisionRequest, ExecutionError
)


def test_execution_error_type():
    """ExecutionError型のテスト"""
    print("🧪 Testing ExecutionError type...")
    
    error = ExecutionError(
        agent_id=AgentType.CASPAR,
        error_type="TestError",
        error_message="Test error message",
        retry_count=2,
        recovered=True
    )
    
    assert error.agent_id == AgentType.CASPAR
    assert error.error_type == "TestError"
    assert error.retry_count == 2
    assert error.recovered == True
    
    print("   ✅ ExecutionError type works correctly")


def test_agent_response_with_error():
    """エラー時のAgentResponse作成テスト"""
    print("🧪 Testing AgentResponse with error...")
    
    response = AgentResponse(
        agent_id=AgentType.BALTHASAR,
        decision=DecisionType.REJECTED,
        content="エラーが発生しました",
        reasoning="システムエラーによる自動否決",
        confidence=0.0,
        execution_time=0,
        timestamp=datetime.now()
    )
    
    assert response.agent_id == AgentType.BALTHASAR
    assert response.decision == DecisionType.REJECTED
    assert response.confidence == 0.0
    
    print("   ✅ Error AgentResponse works correctly")


def test_magi_decision_request():
    """MAGIDecisionRequestのテスト"""
    print("🧪 Testing MAGIDecisionRequest...")
    
    request = MAGIDecisionRequest(
        question="テスト質問",
        context="テストコンテキスト"
    )
    
    assert request.question == "テスト質問"
    assert request.context == "テストコンテキスト"
    
    print("   ✅ MAGIDecisionRequest works correctly")


def test_error_list_handling():
    """エラーリストの処理テスト"""
    print("🧪 Testing error list handling...")
    
    errors = [
        ExecutionError(
            agent_id=AgentType.CASPAR,
            error_type="TimeoutError",
            error_message="Request timeout",
            retry_count=1,
            recovered=True
        ),
        ExecutionError(
            agent_id=AgentType.SOLOMON,
            error_type="ModelError",
            error_message="Model unavailable",
            retry_count=2,
            recovered=False
        )
    ]
    
    assert len(errors) == 2
    assert errors[0].recovered == True
    assert errors[1].recovered == False
    
    # リトライで回復したエラーの数
    recovered_count = sum(1 for e in errors if e.recovered)
    assert recovered_count == 1
    
    # 回復しなかったエラーの数
    failed_count = sum(1 for e in errors if not e.recovered)
    assert failed_count == 1
    
    print("   ✅ Error list handling works correctly")


def main():
    """テストメイン関数"""
    print("=" * 60)
    print("🚀 Error Handling Feature Tests")
    print("=" * 60)
    print()
    
    try:
        test_execution_error_type()
        test_agent_response_with_error()
        test_magi_decision_request()
        test_error_list_handling()
        
        print()
        print("=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        
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
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
