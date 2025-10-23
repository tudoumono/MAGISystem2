"""
CASPAR Agent Implementation - 保守的・現実的な賢者

CASPARは保守的で現実的な視点から判断を行います。
リスク分析と実行可能性を最重要視します。

学習ポイント:
- 保守的な意思決定ロジックの実装
- リスク評価手法の具体化
- 安定性重視のエージェント特性
"""

import time
from typing import Dict, Any, Optional
from datetime import datetime

from ..shared.types import AgentType, DecisionType, AgentResponse
from ..shared.prompts import CASPAR_SYSTEM_PROMPT
from ..shared.utils import format_execution_time, trace_agent_execution


class CasparAgent:
    """
    CASPAR Agent - 保守的・現実的な賢者
    
    特徴:
    - リスク重視の慎重な判断
    - 実行可能性の詳細な評価
    - 既存システムとの整合性重視
    - 段階的アプローチの推奨
    
    学習ポイント:
    - 保守的エージェントの実装パターン
    - リスク分析アルゴリズムの設計
    - 安定性を重視した意思決定プロセス
    """
    
    def __init__(self, model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"):
        """
        CASPARエージェントを初期化
        
        Args:
            model_id: 使用するLLMモデルID
        """
        self.agent_id = AgentType.CASPAR
        self.model_id = model_id
        self.system_prompt = CASPAR_SYSTEM_PROMPT
        self.execution_count = 0
        
        # CASPAR固有の設定
        self.risk_threshold = 0.7  # リスク許容度（低い）
        self.conservatism_factor = 0.8  # 保守性係数
        
    @trace_agent_execution("caspar", "analyze")
    async def analyze(self, question: str, context: Optional[str] = None) -> AgentResponse:
        """
        保守的・現実的な視点から質問を分析
        
        Args:
            question: 分析対象の質問
            context: 追加コンテキスト
            
        Returns:
            AgentResponse: CASPARの分析結果
            
        学習ポイント:
        - 保守的分析プロセスの実装
        - リスク要因の体系的評価
        - 実行可能性の多角的検討
        """
        start_time = time.time()
        self.execution_count += 1
        
        try:
            # Phase 1-2: モックデータでの実装
            response = await self._perform_conservative_analysis(question, context)
            
            execution_time = format_execution_time(start_time)
            response.execution_time = execution_time
            
            return response
            
        except Exception as e:
            execution_time = format_execution_time(start_time)
            
            return AgentResponse(
                agent_id=self.agent_id,
                decision=DecisionType.REJECTED,
                content=f"分析エラー: {str(e)}",
                reasoning="システムエラーにより適切な保守的分析を実行できませんでした",
                confidence=0.0,
                execution_time=execution_time
            )
    
    async def _perform_conservative_analysis(
        self, question: str, context: Optional[str] = None
    ) -> AgentResponse:
        """
        保守的分析を実行
        
        Args:
            question: 分析対象の質問
            context: 追加コンテキスト
            
        Returns:
            AgentResponse: 分析結果
        """
        # リスク要因の評価
        risk_factors = self._evaluate_risk_factors(question)
        
        # 実行可能性の評価
        feasibility = self._evaluate_feasibility(question)
        
        # 安定性への影響評価
        stability_impact = self._evaluate_stability_impact(question)
        
        # 総合判断
        decision = self._make_conservative_decision(risk_factors, feasibility, stability_impact)
        
        # 詳細な分析内容の生成
        content = self._generate_analysis_content(risk_factors, feasibility, stability_impact)
        
        # 判断根拠の生成
        reasoning = self._generate_reasoning(risk_factors, feasibility, stability_impact, decision)
        
        # 確信度の計算
        confidence = self._calculate_confidence(risk_factors, feasibility, stability_impact)
        
        return AgentResponse(
            agent_id=self.agent_id,
            decision=decision,
            content=content,
            reasoning=reasoning,
            confidence=confidence,
            execution_time=0  # 後で設定される
        )
    
    def _evaluate_risk_factors(self, question: str) -> Dict[str, float]:
        """
        リスク要因を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: リスク要因とそのスコア（0.0-1.0）
        """
        risk_factors = {}
        
        # 技術的リスク
        tech_risk_keywords = ["new", "experimental", "untested", "beta", "prototype"]
        tech_risk = sum(1 for keyword in tech_risk_keywords if keyword in question.lower())
        risk_factors["technical"] = min(1.0, tech_risk / len(tech_risk_keywords))
        
        # 運用リスク
        ops_risk_keywords = ["change", "migration", "replacement", "overhaul"]
        ops_risk = sum(1 for keyword in ops_risk_keywords if keyword in question.lower())
        risk_factors["operational"] = min(1.0, ops_risk / len(ops_risk_keywords))
        
        # 財務リスク
        financial_risk_keywords = ["expensive", "cost", "budget", "investment"]
        financial_risk = sum(1 for keyword in financial_risk_keywords if keyword in question.lower())
        risk_factors["financial"] = min(1.0, financial_risk / len(financial_risk_keywords))
        
        # 時間リスク
        time_risk_keywords = ["urgent", "immediate", "rush", "deadline"]
        time_risk = sum(1 for keyword in time_risk_keywords if keyword in question.lower())
        risk_factors["timeline"] = min(1.0, time_risk / len(time_risk_keywords))
        
        return risk_factors
    
    def _evaluate_feasibility(self, question: str) -> Dict[str, float]:
        """
        実行可能性を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: 実行可能性の各側面とスコア（0.0-1.0）
        """
        feasibility = {}
        
        # 技術的実行可能性
        tech_feasibility_keywords = ["proven", "established", "standard", "tested"]
        tech_feasibility = sum(1 for keyword in tech_feasibility_keywords if keyword in question.lower())
        feasibility["technical"] = min(1.0, tech_feasibility / len(tech_feasibility_keywords))
        
        # リソース実行可能性
        resource_keywords = ["available", "existing", "current", "ready"]
        resource_feasibility = sum(1 for keyword in resource_keywords if keyword in question.lower())
        feasibility["resources"] = min(1.0, resource_feasibility / len(resource_keywords))
        
        # 時間的実行可能性
        time_feasibility_keywords = ["gradual", "phased", "step-by-step", "incremental"]
        time_feasibility = sum(1 for keyword in time_feasibility_keywords if keyword in question.lower())
        feasibility["timeline"] = min(1.0, time_feasibility / len(time_feasibility_keywords))
        
        return feasibility
    
    def _evaluate_stability_impact(self, question: str) -> Dict[str, float]:
        """
        安定性への影響を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: 安定性への影響度（0.0-1.0、高いほど悪影響）
        """
        stability_impact = {}
        
        # システム安定性への影響
        system_impact_keywords = ["disruptive", "breaking", "incompatible", "major"]
        system_impact = sum(1 for keyword in system_impact_keywords if keyword in question.lower())
        stability_impact["system"] = min(1.0, system_impact / len(system_impact_keywords))
        
        # 運用安定性への影響
        ops_impact_keywords = ["downtime", "outage", "interruption", "maintenance"]
        ops_impact = sum(1 for keyword in ops_impact_keywords if keyword in question.lower())
        stability_impact["operations"] = min(1.0, ops_impact / len(ops_impact_keywords))
        
        # ユーザー体験への影響
        ux_impact_keywords = ["confusing", "complex", "difficult", "learning"]
        ux_impact = sum(1 for keyword in ux_impact_keywords if keyword in question.lower())
        stability_impact["user_experience"] = min(1.0, ux_impact / len(ux_impact_keywords))
        
        return stability_impact
    
    def _make_conservative_decision(
        self, risk_factors: Dict[str, float], 
        feasibility: Dict[str, float], 
        stability_impact: Dict[str, float]
    ) -> DecisionType:
        """
        保守的な判断を下す
        
        Args:
            risk_factors: リスク要因
            feasibility: 実行可能性
            stability_impact: 安定性への影響
            
        Returns:
            DecisionType: 判断結果
        """
        # 総合リスクスコアの計算
        total_risk = sum(risk_factors.values()) / len(risk_factors)
        
        # 総合実行可能性スコアの計算
        total_feasibility = sum(feasibility.values()) / len(feasibility)
        
        # 総合安定性影響スコアの計算
        total_stability_impact = sum(stability_impact.values()) / len(stability_impact)
        
        # 保守的判断ロジック
        # リスクが高い、実行可能性が低い、安定性への悪影響が大きい場合は否決
        if (total_risk > self.risk_threshold or 
            total_feasibility < 0.5 or 
            total_stability_impact > 0.6):
            return DecisionType.REJECTED
        
        # 条件を満たす場合は可決（ただし慎重に）
        return DecisionType.APPROVED
    
    def _generate_analysis_content(
        self, risk_factors: Dict[str, float], 
        feasibility: Dict[str, float], 
        stability_impact: Dict[str, float]
    ) -> str:
        """
        分析内容を生成
        """
        content_parts = []
        
        # リスク分析
        high_risks = [k for k, v in risk_factors.items() if v > 0.5]
        if high_risks:
            content_parts.append(f"リスク分析: {', '.join(high_risks)}の観点で高いリスクが確認されました。")
        
        # 実行可能性分析
        low_feasibility = [k for k, v in feasibility.items() if v < 0.5]
        if low_feasibility:
            content_parts.append(f"実行可能性: {', '.join(low_feasibility)}の面で課題があります。")
        
        # 安定性影響分析
        high_impact = [k for k, v in stability_impact.items() if v > 0.5]
        if high_impact:
            content_parts.append(f"安定性への影響: {', '.join(high_impact)}に悪影響の可能性があります。")
        
        # 推奨事項
        content_parts.append("段階的な実装と十分なテストを推奨します。")
        
        return " ".join(content_parts)
    
    def _generate_reasoning(
        self, risk_factors: Dict[str, float], 
        feasibility: Dict[str, float], 
        stability_impact: Dict[str, float],
        decision: DecisionType
    ) -> str:
        """
        判断根拠を生成
        """
        total_risk = sum(risk_factors.values()) / len(risk_factors)
        total_feasibility = sum(feasibility.values()) / len(feasibility)
        total_stability_impact = sum(stability_impact.values()) / len(stability_impact)
        
        if decision == DecisionType.REJECTED:
            return f"総合リスクスコア{total_risk:.2f}、実行可能性{total_feasibility:.2f}、" \
                   f"安定性影響{total_stability_impact:.2f}を総合的に評価し、" \
                   f"保守的観点から慎重な検討が必要と判断しました。"
        else:
            return f"リスクは管理可能な範囲内（{total_risk:.2f}）であり、" \
                   f"適切な準備により実行可能（{total_feasibility:.2f}）と判断しました。" \
                   f"ただし、段階的な実装を強く推奨します。"
    
    def _calculate_confidence(
        self, risk_factors: Dict[str, float], 
        feasibility: Dict[str, float], 
        stability_impact: Dict[str, float]
    ) -> float:
        """
        確信度を計算
        """
        # 保守的エージェントとして、不確実性を重視
        total_risk = sum(risk_factors.values()) / len(risk_factors)
        total_feasibility = sum(feasibility.values()) / len(feasibility)
        
        # リスクが高いほど確信度は低く、実行可能性が高いほど確信度は高く
        base_confidence = (1.0 - total_risk + total_feasibility) / 2
        
        # 保守性係数を適用
        confidence = base_confidence * self.conservatism_factor
        
        return max(0.1, min(0.95, confidence))  # 0.1-0.95の範囲に制限
    
    def get_agent_stats(self) -> Dict[str, Any]:
        """エージェント統計を取得"""
        return {
            "agent_id": self.agent_id.value,
            "execution_count": self.execution_count,
            "risk_threshold": self.risk_threshold,
            "conservatism_factor": self.conservatism_factor,
            "model_id": self.model_id
        }