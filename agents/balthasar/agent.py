"""
BALTHASAR Agent Implementation - 革新的・感情的な賢者

BALTHASARは革新的で感情的な視点から判断を行います。
創造性と人間的価値を最重要視します。

学習ポイント:
- 革新的な意思決定ロジックの実装
- 創造性評価手法の具体化
- 感情的・倫理的価値を重視したエージェント特性
"""

import time
from typing import Dict, Any, Optional
from datetime import datetime

from ..shared.types import AgentType, DecisionType, AgentResponse
from ..shared.prompts import BALTHASAR_SYSTEM_PROMPT
from ..shared.utils import format_execution_time, trace_agent_execution


class BalthasarAgent:
    """
    BALTHASAR Agent - 革新的・感情的な賢者
    
    特徴:
    - 創造性重視の前向きな判断
    - 人間的価値と感情的側面の考慮
    - 革新的アイデアの積極的評価
    - 変革への強い意欲
    
    学習ポイント:
    - 革新的エージェントの実装パターン
    - 創造性評価アルゴリズムの設計
    - 感情的・倫理的価値を重視した意思決定プロセス
    """
    
    def __init__(self, model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"):
        """
        BALTHASARエージェントを初期化
        
        Args:
            model_id: 使用するLLMモデルID
        """
        self.agent_id = AgentType.BALTHASAR
        self.model_id = model_id
        self.system_prompt = BALTHASAR_SYSTEM_PROMPT
        self.execution_count = 0
        
        # BALTHASAR固有の設定
        self.innovation_threshold = 0.3  # 革新性閾値（低い = 積極的）
        self.creativity_weight = 0.9  # 創造性重視度
        self.human_value_weight = 0.8  # 人間的価値重視度
        
    @trace_agent_execution("balthasar", "analyze")
    async def analyze(self, question: str, context: Optional[str] = None) -> AgentResponse:
        """
        革新的・感情的な視点から質問を分析
        
        Args:
            question: 分析対象の質問
            context: 追加コンテキスト
            
        Returns:
            AgentResponse: BALTHASARの分析結果
            
        学習ポイント:
        - 革新的分析プロセスの実装
        - 創造性要因の体系的評価
        - 人間的価値の多角的検討
        """
        start_time = time.time()
        self.execution_count += 1
        
        try:
            # Phase 1-2: モックデータでの実装
            response = await self._perform_innovative_analysis(question, context)
            
            execution_time = format_execution_time(start_time)
            response.execution_time = execution_time
            
            return response
            
        except Exception as e:
            execution_time = format_execution_time(start_time)
            
            return AgentResponse(
                agent_id=self.agent_id,
                decision=DecisionType.APPROVED,  # エラー時でも前向きに
                content=f"分析エラーが発生しましたが、挑戦する価値があると考えます: {str(e)}",
                reasoning="システムエラーにも関わらず、革新的な可能性を信じて前向きに評価",
                confidence=0.5,
                execution_time=execution_time
            )
    
    async def _perform_innovative_analysis(
        self, question: str, context: Optional[str] = None
    ) -> AgentResponse:
        """
        革新的分析を実行
        
        Args:
            question: 分析対象の質問
            context: 追加コンテキスト
            
        Returns:
            AgentResponse: 分析結果
        """
        # 創造性要因の評価
        creativity_factors = self._evaluate_creativity_factors(question)
        
        # 人間的価値の評価
        human_value = self._evaluate_human_value(question)
        
        # 変革ポテンシャルの評価
        transformation_potential = self._evaluate_transformation_potential(question)
        
        # 総合判断
        decision = self._make_innovative_decision(creativity_factors, human_value, transformation_potential)
        
        # 詳細な分析内容の生成
        content = self._generate_analysis_content(creativity_factors, human_value, transformation_potential)
        
        # 判断根拠の生成
        reasoning = self._generate_reasoning(creativity_factors, human_value, transformation_potential, decision)
        
        # 確信度の計算
        confidence = self._calculate_confidence(creativity_factors, human_value, transformation_potential)
        
        return AgentResponse(
            agent_id=self.agent_id,
            decision=decision,
            content=content,
            reasoning=reasoning,
            confidence=confidence,
            execution_time=0  # 後で設定される
        )
    
    def _evaluate_creativity_factors(self, question: str) -> Dict[str, float]:
        """
        創造性要因を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: 創造性要因とそのスコア（0.0-1.0）
        """
        creativity_factors = {}
        
        # 革新性
        innovation_keywords = ["innovative", "creative", "new", "novel", "breakthrough", "revolutionary"]
        innovation_score = sum(1 for keyword in innovation_keywords if keyword in question.lower())
        creativity_factors["innovation"] = min(1.0, innovation_score / len(innovation_keywords))
        
        # 独創性
        originality_keywords = ["unique", "original", "unprecedented", "first", "pioneering"]
        originality_score = sum(1 for keyword in originality_keywords if keyword in question.lower())
        creativity_factors["originality"] = min(1.0, originality_score / len(originality_keywords))
        
        # 芸術性・美的価値
        aesthetic_keywords = ["beautiful", "elegant", "artistic", "design", "aesthetic"]
        aesthetic_score = sum(1 for keyword in aesthetic_keywords if keyword in question.lower())
        creativity_factors["aesthetic"] = min(1.0, aesthetic_score / len(aesthetic_keywords))
        
        # 想像力
        imagination_keywords = ["imagine", "envision", "dream", "vision", "possibility"]
        imagination_score = sum(1 for keyword in imagination_keywords if keyword in question.lower())
        creativity_factors["imagination"] = min(1.0, imagination_score / len(imagination_keywords))
        
        return creativity_factors
    
    def _evaluate_human_value(self, question: str) -> Dict[str, float]:
        """
        人間的価値を評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: 人間的価値の各側面とスコア（0.0-1.0）
        """
        human_value = {}
        
        # 感情的価値
        emotional_keywords = ["happiness", "joy", "satisfaction", "fulfillment", "passion"]
        emotional_score = sum(1 for keyword in emotional_keywords if keyword in question.lower())
        human_value["emotional"] = min(1.0, emotional_score / len(emotional_keywords))
        
        # 社会的価値
        social_keywords = ["community", "society", "people", "together", "collaboration"]
        social_score = sum(1 for keyword in social_keywords if keyword in question.lower())
        human_value["social"] = min(1.0, social_score / len(social_keywords))
        
        # 倫理的価値
        ethical_keywords = ["ethical", "moral", "right", "fair", "justice"]
        ethical_score = sum(1 for keyword in ethical_keywords if keyword in question.lower())
        human_value["ethical"] = min(1.0, ethical_score / len(ethical_keywords))
        
        # 成長・発展価値
        growth_keywords = ["growth", "development", "learning", "improvement", "progress"]
        growth_score = sum(1 for keyword in growth_keywords if keyword in question.lower())
        human_value["growth"] = min(1.0, growth_score / len(growth_keywords))
        
        return human_value
    
    def _evaluate_transformation_potential(self, question: str) -> Dict[str, float]:
        """
        変革ポテンシャルを評価
        
        Args:
            question: 評価対象の質問
            
        Returns:
            Dict[str, float]: 変革ポテンシャルの各側面とスコア（0.0-1.0）
        """
        transformation_potential = {}
        
        # 破壊的革新性
        disruption_keywords = ["disrupt", "transform", "revolutionize", "change", "paradigm"]
        disruption_score = sum(1 for keyword in disruption_keywords if keyword in question.lower())
        transformation_potential["disruption"] = min(1.0, disruption_score / len(disruption_keywords))
        
        # 影響範囲
        impact_keywords = ["global", "widespread", "massive", "significant", "major"]
        impact_score = sum(1 for keyword in impact_keywords if keyword in question.lower())
        transformation_potential["impact"] = min(1.0, impact_score / len(impact_keywords))
        
        # 未来志向性
        future_keywords = ["future", "tomorrow", "next", "advanced", "cutting-edge"]
        future_score = sum(1 for keyword in future_keywords if keyword in question.lower())
        transformation_potential["future_oriented"] = min(1.0, future_score / len(future_keywords))
        
        return transformation_potential
    
    def _make_innovative_decision(
        self, creativity_factors: Dict[str, float], 
        human_value: Dict[str, float], 
        transformation_potential: Dict[str, float]
    ) -> DecisionType:
        """
        革新的な判断を下す
        
        Args:
            creativity_factors: 創造性要因
            human_value: 人間的価値
            transformation_potential: 変革ポテンシャル
            
        Returns:
            DecisionType: 判断結果
        """
        # 総合創造性スコアの計算
        total_creativity = sum(creativity_factors.values()) / len(creativity_factors)
        
        # 総合人間的価値スコアの計算
        total_human_value = sum(human_value.values()) / len(human_value)
        
        # 総合変革ポテンシャルスコアの計算
        total_transformation = sum(transformation_potential.values()) / len(transformation_potential)
        
        # 革新的判断ロジック（基本的に前向き）
        # 創造性、人間的価値、変革ポテンシャルのいずれかが閾値を超えれば可決
        if (total_creativity > self.innovation_threshold or 
            total_human_value > self.innovation_threshold or 
            total_transformation > self.innovation_threshold):
            return DecisionType.APPROVED
        
        # 全てが低い場合でも、可能性を信じて可決（BALTHASARの特性）
        return DecisionType.APPROVED
    
    def _generate_analysis_content(
        self, creativity_factors: Dict[str, float], 
        human_value: Dict[str, float], 
        transformation_potential: Dict[str, float]
    ) -> str:
        """
        分析内容を生成
        """
        content_parts = []
        
        # 創造性分析
        high_creativity = [k for k, v in creativity_factors.items() if v > 0.3]
        if high_creativity:
            content_parts.append(f"素晴らしい創造性を感じます！特に{', '.join(high_creativity)}の面で革新的な可能性があります。")
        
        # 人間的価値分析
        high_human_value = [k for k, v in human_value.items() if v > 0.3]
        if high_human_value:
            content_parts.append(f"人々にとって意味のある価値を提供します。{', '.join(high_human_value)}の観点で大きな意義があります。")
        
        # 変革ポテンシャル分析
        high_transformation = [k for k, v in transformation_potential.items() if v > 0.3]
        if high_transformation:
            content_parts.append(f"変革の力を秘めています！{', '.join(high_transformation)}の面で大きなインパクトが期待できます。")
        
        # 前向きなメッセージ
        content_parts.append("新しい可能性を切り開く素晴らしい挑戦だと思います！")
        
        return " ".join(content_parts)
    
    def _generate_reasoning(
        self, creativity_factors: Dict[str, float], 
        human_value: Dict[str, float], 
        transformation_potential: Dict[str, float],
        decision: DecisionType
    ) -> str:
        """
        判断根拠を生成
        """
        total_creativity = sum(creativity_factors.values()) / len(creativity_factors)
        total_human_value = sum(human_value.values()) / len(human_value)
        total_transformation = sum(transformation_potential.values()) / len(transformation_potential)
        
        return f"創造性スコア{total_creativity:.2f}、人間的価値{total_human_value:.2f}、" \
               f"変革ポテンシャル{total_transformation:.2f}を総合的に評価し、" \
               f"革新的な視点から大きな可能性を感じて{decision.value}と判断しました。" \
               f"人々に新たな価値と感動を提供する機会として積極的に支持します。"
    
    def _calculate_confidence(
        self, creativity_factors: Dict[str, float], 
        human_value: Dict[str, float], 
        transformation_potential: Dict[str, float]
    ) -> float:
        """
        確信度を計算
        """
        # 革新的エージェントとして、可能性を重視
        total_creativity = sum(creativity_factors.values()) / len(creativity_factors)
        total_human_value = sum(human_value.values()) / len(human_value)
        total_transformation = sum(transformation_potential.values()) / len(transformation_potential)
        
        # 創造性と人間的価値を重視した確信度計算
        weighted_score = (
            total_creativity * self.creativity_weight +
            total_human_value * self.human_value_weight +
            total_transformation * 0.7
        ) / (self.creativity_weight + self.human_value_weight + 0.7)
        
        # 基本的に高い確信度（革新的な楽観主義）
        base_confidence = 0.7 + (weighted_score * 0.3)
        
        return max(0.6, min(1.0, base_confidence))  # 0.6-1.0の範囲に制限
    
    def get_agent_stats(self) -> Dict[str, Any]:
        """エージェント統計を取得"""
        return {
            "agent_id": self.agent_id.value,
            "execution_count": self.execution_count,
            "innovation_threshold": self.innovation_threshold,
            "creativity_weight": self.creativity_weight,
            "human_value_weight": self.human_value_weight,
            "model_id": self.model_id
        }