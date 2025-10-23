"""
MELCHIOR Agent Implementation - バランス型・科学的な賢者

MELCHIORはバランス型で科学的な視点から判断を行います。
論理性とデータに基づく分析を最重要視します。

学習ポイント:
- 科学的な意思決定ロジックの実装
- データ分析手法の具体化
- バランスの取れたエージェント特性
"""

import time
from typing import Dict, Any, Optional
from datetime import datetime

from ..shared.types import AgentType, DecisionType, AgentResponse
from ..shared.prompts import MELCHIOR_SYSTEM_PROMPT
from ..shared.utils import format_execution_time, trace_agent_execution


class MelchiorAgent:
    """
    MELCHIOR Agent - バランス型・科学的な賢者
    
    特徴:
    - 論理性重視の客観的判断
    - データと証拠に基づく分析
    - 多角的視点からの総合評価
    - 科学的手法の重視
    
    学習ポイント:
    - 科学的エージェントの実装パターン
    - データ分析アルゴリズムの設計
    - バランスの取れた意思決定プロセス
    """
    
    def __init__(self, model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"):
        """
        MELCHIORエージェントを初期化
        
        Args:
            model_id: 使用するLLMモデルID
        """
        self.agent_id = AgentType.MELCHIOR
        self.model_id = model_id
        self.system_prompt = MELCHIOR_SYSTEM_PROMPT
        self.execution_count = 0
        
        # MELCHIOR固有の設定
        self.evidence_threshold = 0.6  # 証拠の十分性閾値
        self.logic_weight = 0.8  # 論理性重視度
        self.data_weight = 0.9  # データ重視度
        self.balance_factor = 0.7  # バランス調整係数
        
    @trace_agent_execution("melchior", "analyze")
    async def analyze(self, question: str, context: Optional[str] = None) -> AgentResponse:
        """
        バランス型・科学的な視点から質問を分析
        
        Args:
            question: 分析対象の質問
            context: 追加コンテキスト
            
        Returns:
            AgentResponse: MELCHIORの分析結果
            
        学習ポイント:
        - 科学的分析プロセスの実装
        - データ要因の体系的評価
        - バランスの取れた多角的検討
        """
        start_time = time.time()
        self.execution_count += 1
        
        try:
            # Phase 1-2: モックデータでの実装
            response = await self._perform_scientific_analysis(question, context)
            
            execution_time = format_execution_time(start_time)
            response.execution_time = execution_time
            
            return response
            
        except Exception as e:
            execution_time = format_execution_time(start_time)
            
            return AgentResponse(
                agent_id=self.agent_id,
                decision=DecisionType.REJECTED,
                content=f"分析エラー: {str(e)}。データ不足により適切な科学的判断ができません。",
                reasoning="システムエラーと情報不足により、科学的厳密性を保った分析が困難",
                confidence=0.3,
                execution_time=execution_time
            )
    
    async def _perform_scientific_analysis(
        self, question: str, context: Optional[str] = None
    ) -> AgentResponse:
        """
        科学的分析を実行
        
        Args:
            question: 分析対象の質問
            context: 追加コンテキスト
            
        Returns:
            AgentResponse: 分析結果
        """
        # データ・証拠の評価
        evidence_factors = self._evaluate_evidence_factors(question)
        
        # 論理性の評価
        logic_factors = self._evaluate_logic_factors(question)
        
        # 効率性の評価
        efficiency_factors = self._evaluate_efficiency_factors(question)
        
        # バランス評価
        balance_factors = self._evaluate_balance_factors(question)
        
        # 総合判断
        decision = self._make_scientific_decision(evidence_factors, logic_factors, efficiency_factors, balance_factors)
        
        # 詳細な分析内容の生成
        content = self._generate_analysis_content(evidence_factors, logic_factors, efficiency_factors, balance_factors)
        
        # 判断根拠の生成
        reasoning = self._generate_reasoning(evidence_factors, logic_factors, efficiency_factors, balance_factors, decision)
        
        # 確信度の計算
        confidence = self._calculate_confidence(evidence_factors, logic_factors, efficiency_factors, balance_factors)
        
        return AgentResponse(
            agent_id=self.agent_id,
            decision=decision,
            content=content,
            reasoning=reasoning,
            confidence=confidence,
            execution_time=0  # 後で設定される
        )
    
    def _evaluate_evidence_factors(self, question: str) -> Dict[str, float]:
        """
        データ・証拠要因を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: 証拠要因とそのスコア（0.0-1.0）
        """
        evidence_factors = {}
        
        # データの存在
        data_keywords = ["data", "statistics", "research", "study", "evidence"]
        data_score = sum(1 for keyword in data_keywords if keyword in question.lower())
        evidence_factors["data_availability"] = min(1.0, data_score / len(data_keywords))
        
        # 実証性
        empirical_keywords = ["proven", "tested", "verified", "validated", "confirmed"]
        empirical_score = sum(1 for keyword in empirical_keywords if keyword in question.lower())
        evidence_factors["empirical_support"] = min(1.0, empirical_score / len(empirical_keywords))
        
        # 測定可能性
        measurable_keywords = ["measure", "metric", "quantify", "assess", "evaluate"]
        measurable_score = sum(1 for keyword in measurable_keywords if keyword in question.lower())
        evidence_factors["measurability"] = min(1.0, measurable_score / len(measurable_keywords))
        
        # 再現性
        reproducible_keywords = ["reproducible", "repeatable", "consistent", "reliable"]
        reproducible_score = sum(1 for keyword in reproducible_keywords if keyword in question.lower())
        evidence_factors["reproducibility"] = min(1.0, reproducible_score / len(reproducible_keywords))
        
        return evidence_factors
    
    def _evaluate_logic_factors(self, question: str) -> Dict[str, float]:
        """
        論理性要因を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: 論理性要因とそのスコア（0.0-1.0）
        """
        logic_factors = {}
        
        # 論理的一貫性
        logical_keywords = ["logical", "rational", "systematic", "structured", "coherent"]
        logical_score = sum(1 for keyword in logical_keywords if keyword in question.lower())
        logic_factors["consistency"] = min(1.0, logical_score / len(logical_keywords))
        
        # 因果関係の明確性
        causal_keywords = ["cause", "effect", "result", "consequence", "impact"]
        causal_score = sum(1 for keyword in causal_keywords if keyword in question.lower())
        logic_factors["causality"] = min(1.0, causal_score / len(causal_keywords))
        
        # 仮説の検証可能性
        hypothesis_keywords = ["hypothesis", "theory", "assumption", "premise", "principle"]
        hypothesis_score = sum(1 for keyword in hypothesis_keywords if keyword in question.lower())
        logic_factors["testability"] = min(1.0, hypothesis_score / len(hypothesis_keywords))
        
        return logic_factors
    
    def _evaluate_efficiency_factors(self, question: str) -> Dict[str, float]:
        """
        効率性要因を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: 効率性要因とそのスコア（0.0-1.0）
        """
        efficiency_factors = {}
        
        # コスト効率性
        cost_keywords = ["cost", "efficient", "economical", "affordable", "budget"]
        cost_score = sum(1 for keyword in cost_keywords if keyword in question.lower())
        efficiency_factors["cost_efficiency"] = min(1.0, cost_score / len(cost_keywords))
        
        # 時間効率性
        time_keywords = ["fast", "quick", "rapid", "immediate", "timely"]
        time_score = sum(1 for keyword in time_keywords if keyword in question.lower())
        efficiency_factors["time_efficiency"] = min(1.0, time_score / len(time_keywords))
        
        # リソース効率性
        resource_keywords = ["resource", "optimize", "streamline", "minimize", "maximize"]
        resource_score = sum(1 for keyword in resource_keywords if keyword in question.lower())
        efficiency_factors["resource_efficiency"] = min(1.0, resource_score / len(resource_keywords))
        
        return efficiency_factors
    
    def _evaluate_balance_factors(self, question: str) -> Dict[str, float]:
        """
        バランス要因を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: バランス要因とそのスコア（0.0-1.0）
        """
        balance_factors = {}
        
        # リスクと機会のバランス
        risk_keywords = ["risk", "danger", "threat", "problem", "issue"]
        opportunity_keywords = ["opportunity", "benefit", "advantage", "gain", "value"]
        
        risk_score = sum(1 for keyword in risk_keywords if keyword in question.lower())
        opportunity_score = sum(1 for keyword in opportunity_keywords if keyword in question.lower())
        
        # バランススコア（リスクと機会が両方言及されている場合に高い）
        balance_factors["risk_opportunity"] = min(1.0, (risk_score + opportunity_score) / 10)
        
        # 短期と長期のバランス
        short_term_keywords = ["immediate", "short", "quick", "now", "current"]
        long_term_keywords = ["long", "future", "sustainable", "strategic", "permanent"]
        
        short_term_score = sum(1 for keyword in short_term_keywords if keyword in question.lower())
        long_term_score = sum(1 for keyword in long_term_keywords if keyword in question.lower())
        
        balance_factors["temporal_balance"] = min(1.0, (short_term_score + long_term_score) / 10)
        
        # 複数の視点
        perspective_keywords = ["perspective", "viewpoint", "angle", "aspect", "dimension"]
        perspective_score = sum(1 for keyword in perspective_keywords if keyword in question.lower())
        balance_factors["multi_perspective"] = min(1.0, perspective_score / len(perspective_keywords))
        
        return balance_factors
    
    def _make_scientific_decision(
        self, evidence_factors: Dict[str, float], 
        logic_factors: Dict[str, float], 
        efficiency_factors: Dict[str, float],
        balance_factors: Dict[str, float]
    ) -> DecisionType:
        """
        科学的な判断を下す
        
        Args:
            evidence_factors: 証拠要因
            logic_factors: 論理性要因
            efficiency_factors: 効率性要因
            balance_factors: バランス要因
            
        Returns:
            DecisionType: 判断結果
        """
        # 各要因の総合スコア計算
        total_evidence = sum(evidence_factors.values()) / len(evidence_factors)
        total_logic = sum(logic_factors.values()) / len(logic_factors)
        total_efficiency = sum(efficiency_factors.values()) / len(efficiency_factors)
        total_balance = sum(balance_factors.values()) / len(balance_factors)
        
        # 重み付き総合スコア
        weighted_score = (
            total_evidence * self.data_weight +
            total_logic * self.logic_weight +
            total_efficiency * 0.6 +
            total_balance * self.balance_factor
        ) / (self.data_weight + self.logic_weight + 0.6 + self.balance_factor)
        
        # 科学的判断ロジック
        # 証拠が十分で論理的一貫性があれば可決
        if total_evidence >= self.evidence_threshold and total_logic >= 0.5:
            return DecisionType.APPROVED
        
        # 総合スコアが高い場合も可決
        if weighted_score >= 0.6:
            return DecisionType.APPROVED
        
        # バランスが取れている場合は条件付き可決
        if total_balance >= 0.7:
            return DecisionType.APPROVED
        
        # その他の場合は否決（データ不足等）
        return DecisionType.REJECTED
    
    def _generate_analysis_content(
        self, evidence_factors: Dict[str, float], 
        logic_factors: Dict[str, float], 
        efficiency_factors: Dict[str, float],
        balance_factors: Dict[str, float]
    ) -> str:
        """
        分析内容を生成
        """
        content_parts = []
        
        # 証拠分析
        strong_evidence = [k for k, v in evidence_factors.items() if v > 0.5]
        if strong_evidence:
            content_parts.append(f"データ分析: {', '.join(strong_evidence)}の観点で十分な証拠があります。")
        else:
            content_parts.append("データ分析: 追加の証拠収集が推奨されます。")
        
        # 論理性分析
        strong_logic = [k for k, v in logic_factors.items() if v > 0.5]
        if strong_logic:
            content_parts.append(f"論理性評価: {', '.join(strong_logic)}の面で論理的一貫性が確認されます。")
        
        # 効率性分析
        high_efficiency = [k for k, v in efficiency_factors.items() if v > 0.5]
        if high_efficiency:
            content_parts.append(f"効率性分析: {', '.join(high_efficiency)}の観点で効率的です。")
        
        # バランス分析
        good_balance = [k for k, v in balance_factors.items() if v > 0.5]
        if good_balance:
            content_parts.append(f"バランス評価: {', '.join(good_balance)}の面でバランスが取れています。")
        
        # 科学的推奨
        content_parts.append("科学的手法に基づく継続的な検証と改善を推奨します。")
        
        return " ".join(content_parts)
    
    def _generate_reasoning(
        self, evidence_factors: Dict[str, float], 
        logic_factors: Dict[str, float], 
        efficiency_factors: Dict[str, float],
        balance_factors: Dict[str, float],
        decision: DecisionType
    ) -> str:
        """
        判断根拠を生成
        """
        total_evidence = sum(evidence_factors.values()) / len(evidence_factors)
        total_logic = sum(logic_factors.values()) / len(logic_factors)
        total_efficiency = sum(efficiency_factors.values()) / len(efficiency_factors)
        total_balance = sum(balance_factors.values()) / len(balance_factors)
        
        return f"証拠スコア{total_evidence:.2f}、論理性{total_logic:.2f}、" \
               f"効率性{total_efficiency:.2f}、バランス{total_balance:.2f}を" \
               f"科学的に分析した結果、{decision.value}と判断しました。" \
               f"データドリブンなアプローチと継続的な検証を重視します。"
    
    def _calculate_confidence(
        self, evidence_factors: Dict[str, float], 
        logic_factors: Dict[str, float], 
        efficiency_factors: Dict[str, float],
        balance_factors: Dict[str, float]
    ) -> float:
        """
        確信度を計算
        """
        # 科学的エージェントとして、証拠と論理性を重視
        total_evidence = sum(evidence_factors.values()) / len(evidence_factors)
        total_logic = sum(logic_factors.values()) / len(logic_factors)
        total_balance = sum(balance_factors.values()) / len(balance_factors)
        
        # 証拠と論理性に基づく確信度計算
        evidence_confidence = total_evidence * self.data_weight
        logic_confidence = total_logic * self.logic_weight
        balance_confidence = total_balance * self.balance_factor
        
        # 総合確信度
        total_confidence = (evidence_confidence + logic_confidence + balance_confidence) / \
                          (self.data_weight + self.logic_weight + self.balance_factor)
        
        # 科学的厳密性による調整（不確実性を正直に表現）
        if total_evidence < 0.5:  # データ不足の場合は確信度を下げる
            total_confidence *= 0.7
        
        return max(0.2, min(0.95, total_confidence))  # 0.2-0.95の範囲に制限
    
    def get_agent_stats(self) -> Dict[str, Any]:
        """エージェント統計を取得"""
        return {
            "agent_id": self.agent_id.value,
            "execution_count": self.execution_count,
            "evidence_threshold": self.evidence_threshold,
            "logic_weight": self.logic_weight,
            "data_weight": self.data_weight,
            "balance_factor": self.balance_factor,
            "model_id": self.model_id
        }