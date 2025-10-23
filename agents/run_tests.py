#!/usr/bin/env python3
"""
Test Runner for MAGI Decision System

Strands Agentsの実装をテストするためのシンプルなテストランナーです。
Phase 1-2のモックデータ実装をテストします。

学習ポイント:
- Pythonテストの実行方法
- 非同期エージェントのテスト
- システム統合テストの実装

使用方法:
    python run_tests.py
"""

import asyncio
import sys
import traceback
from datetime import datetime

# 相対インポートのためのパス設定
sys.path.append('.')

from shared.types import MAGIDecisionRequest, AgentType, DecisionType
from solomon.agent import SolomonJudgeAgent
from caspar.agent import CasparAgent
from balthasar.agent import BalthasarAgent
from melchior.agent import MelchiorAgent


async def test_individual_agents():
    """個別エージェントのテスト"""
    print("=" * 60)
    print("Individual Agent Tests")
    print("=" * 60)
    
    # テスト質問
    questions = [
        "Should we implement a new experimental technology?",
        "Should we pursue a creative and innovative solution?",
        "Should we analyze this proposal based on data and research?"
    ]
    
    # 各エージェントのテスト
    agents = [
        ("CASPAR", CasparAgent()),
        ("BALTHASAR", BalthasarAgent()),
        ("MELCHIOR", MelchiorAgent())
    ]
    
    for agent_name, agent in agents:
        print(f"\n--- {agent_name} Agent Test ---")
        
        for i, question in enumerate(questions, 1):
            try:
                print(f"\nQuestion {i}: {question}")
                response = await agent.analyze(question)
                
                print(f"Decision: {response.decision.value}")
                print(f"Confidence: {response.confidence:.2f}")
                print(f"Execution Time: {response.execution_time}ms")
                print(f"Reasoning: {response.reasoning[:100]}...")
                
            except Exception as e:
                print(f"Error in {agent_name} test: {e}")
                traceback.print_exc()


async def test_solomon_integration():
    """SOLOMON統合テスト"""
    print("\n" + "=" * 60)
    print("SOLOMON Integration Test")
    print("=" * 60)
    
    solomon = SolomonJudgeAgent()
    
    # テストシナリオ
    scenarios = [
        {
            "name": "Technology Adoption",
            "question": "Should our company adopt artificial intelligence for customer service?",
            "context": "We want to improve efficiency while maintaining quality."
        },
        {
            "name": "Risk Assessment",
            "question": "Should we invest in a high-risk, high-reward new market?",
            "context": "The market has potential but is highly volatile."
        },
        {
            "name": "Innovation Decision",
            "question": "Should we develop a revolutionary new product feature?",
            "context": "It would be innovative but requires significant resources."
        }
    ]
    
    for scenario in scenarios:
        print(f"\n--- {scenario['name']} ---")
        print(f"Question: {scenario['question']}")
        
        try:
            request = MAGIDecisionRequest(
                question=scenario['question'],
                context=scenario['context']
            )
            
            response = await solomon.decide(request)
            
            print(f"\nFinal Decision: {response.judge_response.final_decision.value}")
            print(f"Voting Result: Approved={response.judge_response.voting_result.approved}, "
                  f"Rejected={response.judge_response.voting_result.rejected}")
            print(f"Confidence: {response.judge_response.confidence:.2f}")
            print(f"Total Execution Time: {response.total_execution_time}ms")
            
            print(f"\nIndividual Agent Responses:")
            for agent_response in response.agent_responses:
                print(f"  {agent_response.agent_id.value}: {agent_response.decision.value} "
                      f"(confidence: {agent_response.confidence:.2f})")
            
            print(f"\nSOLOMON Summary: {response.judge_response.summary}")
            print(f"Recommendation: {response.judge_response.final_recommendation}")
            
        except Exception as e:
            print(f"Error in SOLOMON test: {e}")
            traceback.print_exc()


async def test_concurrent_processing():
    """並行処理テスト"""
    print("\n" + "=" * 60)
    print("Concurrent Processing Test")
    print("=" * 60)
    
    solomon = SolomonJudgeAgent()
    
    # 複数の質問を並行処理
    questions = [
        "Should we expand our development team?",
        "Should we upgrade our server infrastructure?",
        "Should we launch a new marketing campaign?",
        "Should we enter the international market?"
    ]
    
    print(f"Processing {len(questions)} decisions concurrently...")
    
    try:
        start_time = datetime.now()
        
        # 並行実行
        tasks = [
            solomon.decide(MAGIDecisionRequest(question=q))
            for q in questions
        ]
        
        responses = await asyncio.gather(*tasks)
        
        end_time = datetime.now()
        total_time = (end_time - start_time).total_seconds() * 1000
        
        print(f"\nConcurrent processing completed in {total_time:.0f}ms")
        print(f"Average time per decision: {total_time / len(questions):.0f}ms")
        
        for i, (question, response) in enumerate(zip(questions, responses), 1):
            print(f"\nDecision {i}: {question}")
            print(f"Result: {response.judge_response.final_decision.value}")
            print(f"Execution Time: {response.total_execution_time}ms")
        
    except Exception as e:
        print(f"Error in concurrent processing test: {e}")
        traceback.print_exc()


async def test_agent_characteristics():
    """エージェント特性テスト"""
    print("\n" + "=" * 60)
    print("Agent Characteristics Test")
    print("=" * 60)
    
    # 特性を引き出すための質問
    test_cases = [
        {
            "name": "Conservative Test",
            "question": "Should we implement an untested experimental system immediately?",
            "expected_caspar": "Conservative (likely REJECTED)"
        },
        {
            "name": "Innovation Test", 
            "question": "Should we pursue a creative breakthrough innovation?",
            "expected_balthasar": "Innovative (likely APPROVED)"
        },
        {
            "name": "Data-Driven Test",
            "question": "Based on statistical analysis and research data, what should we do?",
            "expected_melchior": "Scientific (data-based decision)"
        }
    ]
    
    agents = [
        ("CASPAR", CasparAgent()),
        ("BALTHASAR", BalthasarAgent()),
        ("MELCHIOR", MelchiorAgent())
    ]
    
    for test_case in test_cases:
        print(f"\n--- {test_case['name']} ---")
        print(f"Question: {test_case['question']}")
        
        for agent_name, agent in agents:
            try:
                response = await agent.analyze(test_case['question'])
                print(f"{agent_name}: {response.decision.value} "
                      f"(confidence: {response.confidence:.2f})")
                
            except Exception as e:
                print(f"Error testing {agent_name}: {e}")


def print_system_info():
    """システム情報を表示"""
    print("MAGI Decision System - Strands Agents Test Runner")
    print("=" * 60)
    print(f"Test Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python Version: {sys.version}")
    print(f"Phase: 1-2 (Mock Data Implementation)")
    print()


async def main():
    """メインテスト実行"""
    print_system_info()
    
    try:
        # 個別エージェントテスト
        await test_individual_agents()
        
        # SOLOMON統合テスト
        await test_solomon_integration()
        
        # 並行処理テスト
        await test_concurrent_processing()
        
        # エージェント特性テスト
        await test_agent_characteristics()
        
        print("\n" + "=" * 60)
        print("All Tests Completed Successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nTest execution failed: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    # イベントループでテストを実行
    asyncio.run(main())