#!/usr/bin/env python3
"""
Simple Test for MAGI Decision System

Phase 1-2のモックデータ実装をテストするシンプルなスクリプトです。
相対インポートの問題を回避して基本動作を確認します。

学習ポイント:
- Pythonパッケージ構造の理解
- 相対インポートの問題と解決方法
- モックデータでの基本動作確認
"""

import asyncio
import sys
import os
from datetime import datetime

# パッケージルートを追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 基本型のテスト
def test_basic_types():
    """基本型定義のテスト"""
    print("🧪 Testing basic types...")
    
    try:
        from shared.types import AgentType, DecisionType, AgentResponse, MAGIDecisionRequest
        
        # AgentType のテスト
        assert AgentType.SOLOMON == "solomon"
        assert AgentType.CASPAR == "caspar"
        assert AgentType.BALTHASAR == "balthasar"
        assert AgentType.MELCHIOR == "melchior"
        
        # DecisionType のテスト
        assert DecisionType.APPROVED == "APPROVED"
        assert DecisionType.REJECTED == "REJECTED"
        
        # MAGIDecisionRequest のテスト
        request = MAGIDecisionRequest(question="Test question")
        assert request.question == "Test question"
        
        print("✅ Basic types test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Basic types test failed: {e}")
        return False


def test_prompts():
    """プロンプト管理のテスト"""
    print("🧪 Testing prompts...")
    
    try:
        from shared.prompts import (
            SOLOMON_SYSTEM_PROMPT, CASPAR_SYSTEM_PROMPT, 
            BALTHASAR_SYSTEM_PROMPT, MELCHIOR_SYSTEM_PROMPT,
            get_agent_prompt
        )
        
        # プロンプトが存在することを確認
        assert len(SOLOMON_SYSTEM_PROMPT) > 100
        assert len(CASPAR_SYSTEM_PROMPT) > 100
        assert len(BALTHASAR_SYSTEM_PROMPT) > 100
        assert len(MELCHIOR_SYSTEM_PROMPT) > 100
        
        # get_agent_prompt 関数のテスト
        solomon_prompt = get_agent_prompt("solomon")
        assert solomon_prompt == SOLOMON_SYSTEM_PROMPT
        
        print("✅ Prompts test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Prompts test failed: {e}")
        return False


def test_utils():
    """ユーティリティ関数のテスト"""
    print("🧪 Testing utilities...")
    
    try:
        from shared.utils import (
            generate_trace_id, generate_request_id,
            format_execution_time, validate_decision_confidence
        )
        
        # ID生成のテスト
        trace_id = generate_trace_id()
        request_id = generate_request_id()
        assert len(trace_id) > 0
        assert len(request_id) > 0
        assert trace_id != request_id
        
        # 実行時間フォーマットのテスト
        import time
        start = time.time()
        time.sleep(0.01)  # 10ms待機
        duration = format_execution_time(start)
        assert duration >= 10
        
        # 確信度検証のテスト
        assert validate_decision_confidence(0.5) == 0.5
        assert validate_decision_confidence(1.0) == 1.0
        
        try:
            validate_decision_confidence(1.5)  # 範囲外
            assert False, "Should have raised ValueError"
        except ValueError:
            pass  # 期待される例外
        
        print("✅ Utilities test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Utilities test failed: {e}")
        return False


async def test_mock_agent_response():
    """モックエージェント応答のテスト"""
    print("🧪 Testing mock agent responses...")
    
    try:
        from shared.types import AgentType, DecisionType, AgentResponse
        from datetime import datetime
        
        # モックエージェント応答の作成
        mock_response = AgentResponse(
            agent_id=AgentType.CASPAR,
            decision=DecisionType.APPROVED,
            content="This is a test response from CASPAR",
            reasoning="Test reasoning for the decision",
            confidence=0.85,
            execution_time=1200
        )
        
        # 基本検証
        assert mock_response.agent_id == AgentType.CASPAR
        assert mock_response.decision == DecisionType.APPROVED
        assert mock_response.confidence == 0.85
        assert mock_response.execution_time == 1200
        assert isinstance(mock_response.timestamp, datetime)
        
        print("✅ Mock agent response test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Mock agent response test failed: {e}")
        return False


async def test_basic_functionality():
    """基本機能の統合テスト"""
    print("🧪 Testing basic functionality integration...")
    
    try:
        from shared.types import MAGIDecisionRequest, AgentType, DecisionType
        
        # リクエスト作成
        request = MAGIDecisionRequest(
            question="Should we test the MAGI system?",
            context="This is a basic functionality test"
        )
        
        # 基本検証
        assert request.question == "Should we test the MAGI system?"
        assert request.context == "This is a basic functionality test"
        
        print("✅ Basic functionality test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Basic functionality test failed: {e}")
        return False


async def main():
    """メインテスト実行"""
    print("🤖 MAGI Decision System - Simple Test")
    print("=" * 50)
    print(f"Test Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python Version: {sys.version}")
    print(f"Phase: 1-2 (Mock Data Implementation)")
    print()
    
    tests = [
        ("Basic Types", test_basic_types),
        ("Prompts", test_prompts),
        ("Utilities", test_utils),
        ("Mock Agent Response", test_mock_agent_response),
        ("Basic Functionality", test_basic_functionality)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"Running {test_name} test...")
        
        if asyncio.iscoroutinefunction(test_func):
            result = await test_func()
        else:
            result = test_func()
        
        if result:
            passed += 1
        
        print()
    
    print("=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Basic MAGI system structure is working.")
        print()
        print("✨ Ready for Phase 1-2 implementation:")
        print("  - ✅ Type definitions working")
        print("  - ✅ Prompt management working")
        print("  - ✅ Utility functions working")
        print("  - ✅ Mock data structures working")
        print()
        print("🚀 Next steps:")
        print("  1. Implement individual agent logic")
        print("  2. Implement SOLOMON orchestration")
        print("  3. Add A2A communication")
        print("  4. Integration with frontend")
    else:
        print(f"❌ {total - passed} tests failed. Please fix issues before proceeding.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())