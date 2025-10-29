#!/usr/bin/env python3
"""
MAGI Decision System Demo

エヴァンゲリオンのMAGIシステムにインスパイアされた
多エージェント意思決定システムのデモンストレーションです。

学習ポイント:
- Strands Agentsの実際の動作確認
- 3賢者 + SOLOMON Judgeの協調動作
- A2A通信による意思決定プロセス

使用方法:
    python demo.py
"""

import asyncio
import sys
from datetime import datetime

# 相対インポートのためのパス設定
sys.path.append('.')

from shared.types import MAGIDecisionRequest
from solomon.agent import SolomonJudgeAgent


def print_header():
    """デモヘッダーを表示"""
    print("=" * 80)
    print("🤖 MAGI DECISION SYSTEM DEMO 🤖")
    print("Inspired by Neon Genesis Evangelion")
    print("=" * 80)
    print()
    print("System Components:")
    print("  🧠 SOLOMON Judge - Orchestrator and Final Decision Maker")
    print("  🛡️  CASPAR - Conservative & Realistic Sage (Risk-focused)")
    print("  🚀 BALTHASAR - Innovative & Emotional Sage (Creativity-focused)")
    print("  ⚖️  MELCHIOR - Balanced & Scientific Sage (Logic-focused)")
    print()
    print("Decision Process:")
    print("  1. SOLOMON receives question")
    print("  2. Delegates to 3 Sages via A2A protocol")
    print("  3. Each Sage provides decision + reasoning")
    print("  4. SOLOMON evaluates and integrates responses")
    print("  5. Final decision with voting results")
    print()


async def demonstrate_decision(solomon: SolomonJudgeAgent, scenario: dict):
    """個別の意思決定シナリオをデモ"""
    print(f"📋 SCENARIO: {scenario['name']}")
    print(f"❓ QUESTION: {scenario['question']}")
    if scenario.get('context'):
        print(f"📝 CONTEXT: {scenario['context']}")
    print()
    
    # 意思決定実行
    request = MAGIDecisionRequest(
        question=scenario['question'],
        context=scenario.get('context')
    )
    
    print("🔄 Processing decision...")
    start_time = datetime.now()
    
    response = await solomon.decide(request)
    
    end_time = datetime.now()
    processing_time = (end_time - start_time).total_seconds() * 1000
    
    # 結果表示
    print(f"⏱️  Processing completed in {processing_time:.0f}ms")
    print()
    
    # 各賢者の判断
    print("🧙‍♂️ SAGE RESPONSES:")
    sage_icons = {"caspar": "🛡️", "balthasar": "🚀", "melchior": "⚖️"}
    
    for agent_response in response.agent_responses:
        icon = sage_icons.get(agent_response.agent_id.value, "🤖")
        decision_icon = "✅" if agent_response.decision.value == "APPROVED" else "❌"
        
        print(f"  {icon} {agent_response.agent_id.value.upper()}: "
              f"{decision_icon} {agent_response.decision.value} "
              f"(confidence: {agent_response.confidence:.2f})")
        print(f"     💭 {agent_response.reasoning[:80]}...")
        print()
    
    # SOLOMON の最終判断
    judge = response.judge_response
    final_icon = "✅" if judge.final_decision.value == "APPROVED" else "❌"
    
    print("🧠 SOLOMON JUDGE FINAL DECISION:")
    print(f"  {final_icon} {judge.final_decision.value}")
    print(f"  📊 Voting: Approved={judge.voting_result.approved}, "
          f"Rejected={judge.voting_result.rejected}, "
          f"Abstained={judge.voting_result.abstained}")
    print(f"  🎯 Confidence: {judge.confidence:.2f}")
    print(f"  📋 Summary: {judge.summary}")
    print(f"  💡 Recommendation: {judge.final_recommendation}")
    print()
    
    # スコアリング
    print("📊 SAGE PERFORMANCE SCORES:")
    for score in judge.scores:
        print(f"  {sage_icons.get(score.agent_id.value, '🤖')} "
              f"{score.agent_id.value.upper()}: {score.score}/100 - {score.reasoning}")
    
    print("-" * 80)
    print()


async def main():
    """メインデモ実行"""
    print_header()
    
    # SOLOMON Judge エージェントの初期化
    solomon = SolomonJudgeAgent()
    
    # デモシナリオ
    scenarios = [
        {
            "name": "AI Implementation Decision",
            "question": "Should our company implement artificial intelligence for automated customer service?",
            "context": "We want to improve response times and reduce costs, but maintain service quality and human touch."
        },
        {
            "name": "Innovation Investment",
            "question": "Should we invest 50% of our R&D budget in developing a revolutionary new product?",
            "context": "The technology is unproven but could be a game-changer in our industry."
        },
        {
            "name": "Market Expansion",
            "question": "Should we expand into the international market next quarter?",
            "context": "Market research shows potential, but economic conditions are uncertain."
        },
        {
            "name": "Remote Work Policy",
            "question": "Should we implement a permanent remote-first work policy?",
            "context": "Employees prefer flexibility, but collaboration and company culture may be affected."
        }
    ]
    
    try:
        for i, scenario in enumerate(scenarios, 1):
            print(f"🎬 DEMO {i}/{len(scenarios)}")
            await demonstrate_decision(solomon, scenario)
            
            if i < len(scenarios):
                print("⏳ Preparing next scenario...\n")
                await asyncio.sleep(1)  # 短い休憩
        
        # システム統計
        stats = solomon.get_execution_stats()
        print("📈 SYSTEM STATISTICS:")
        print(f"  Total Decisions: {stats['execution_count']}")
        print(f"  Total Execution Time: {stats['total_execution_time']}ms")
        print(f"  Average Decision Time: {stats['average_execution_time']:.0f}ms")
        print(f"  Model: {stats['model_id']}")
        print()
        
        print("🎉 DEMO COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        print("The MAGI Decision System demonstrates:")
        print("✨ Multi-perspective analysis from 3 specialized agents")
        print("🤝 Collaborative decision-making through A2A communication")
        print("🎯 Balanced final decisions with transparent reasoning")
        print("📊 Quantified confidence and performance metrics")
        print("⚡ Efficient parallel processing of agent consultations")
        print()
        print("Ready for integration with AWS Bedrock AgentCore in Phase 4-6!")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    # イベントループでデモを実行
    asyncio.run(main())