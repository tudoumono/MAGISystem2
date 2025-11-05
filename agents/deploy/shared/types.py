"""
共通型定義 - MAGI Decision System

このファイルは全エージェントで使用される型定義を含みます。
Pydanticを使用してデータ検証とシリアライゼーションを行います。

学習ポイント:
- Pydanticによる型安全性の確保
- エージェント間通信のデータ契約
- JSON シリアライゼーション対応
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class AgentType(str, Enum):
    """
    エージェント種別の定義
    
    MAGIシステムの4つのエージェント:
    - solomon: 統括者（Judge）
    - caspar: 保守的・現実的視点
    - balthasar: 革新的・感情的視点  
    - melchior: バランス型・科学的視点
    """
    SOLOMON = "solomon"
    CASPAR = "caspar"
    BALTHASAR = "balthasar"
    MELCHIOR = "melchior"


class DecisionType(str, Enum):
    """
    意思決定結果の種別
    
    MAGIシステムの投票結果:
    - APPROVED: 可決
    - REJECTED: 否決
    """
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class AgentResponse(BaseModel):
    """
    個別エージェントの応答データ
    
    各賢者（CASPAR、BALTHASAR、MELCHIOR）からの回答を表現します。
    従来の詳細回答に加えて、MAGI投票機能を追加。
    """
    agent_id: AgentType = Field(..., description="エージェント識別子")
    decision: DecisionType = Field(..., description="可決/否決の判断")
    content: str = Field(..., description="詳細な回答内容")
    reasoning: str = Field(..., description="判断に至った論理的根拠")
    confidence: float = Field(..., ge=0.0, le=1.0, description="判断の確信度")
    execution_time: int = Field(..., ge=0, description="実行時間（ミリ秒）")
    timestamp: datetime = Field(default_factory=datetime.now, description="応答生成時刻")
    
    @validator('confidence')
    def validate_confidence(cls, v):
        """確信度は0.0-1.0の範囲で検証"""
        if not 0.0 <= v <= 1.0:
            raise ValueError('Confidence must be between 0.0 and 1.0')
        return v


class AgentScore(BaseModel):
    """
    SOLOMON Judgeによる各エージェントへのスコア評価
    """
    agent_id: AgentType = Field(..., description="評価対象エージェント")
    score: int = Field(..., ge=0, le=100, description="0-100点のスコア")
    reasoning: str = Field(..., description="スコアの根拠")


class VotingResult(BaseModel):
    """
    MAGI投票システムの結果集計
    """
    approved: int = Field(default=0, ge=0, description="可決票数")
    rejected: int = Field(default=0, ge=0, description="否決票数")
    abstained: int = Field(default=0, ge=0, description="棄権票数（エラー等）")
    
    @property
    def total_votes(self) -> int:
        """総投票数を計算"""
        return self.approved + self.rejected + self.abstained
    
    @property
    def approval_rate(self) -> float:
        """可決率を計算（棄権を除く）"""
        valid_votes = self.approved + self.rejected
        if valid_votes == 0:
            return 0.0
        return self.approved / valid_votes


class JudgeResponse(BaseModel):
    """
    SOLOMON Judgeの統合評価結果
    
    MAGI投票システムと従来のスコアリングシステムを統合した
    最終判断結果を表現します。
    """
    # MAGI投票システム
    final_decision: DecisionType = Field(..., description="SOLOMONの最終判断")
    voting_result: VotingResult = Field(..., description="投票結果集計")
    
    # 従来のスコアリングシステム
    scores: List[AgentScore] = Field(..., description="各賢者への0-100点評価")
    summary: str = Field(..., description="判断の要約")
    final_recommendation: str = Field(..., description="最終推奨")
    reasoning: str = Field(..., description="最終判断の根拠")
    confidence: float = Field(..., ge=0.0, le=1.0, description="最終判断の確信度")
    
    execution_time: int = Field(..., ge=0, description="実行時間（ミリ秒）")
    timestamp: datetime = Field(default_factory=datetime.now, description="評価生成時刻")


class TraceStep(BaseModel):
    """
    実行トレースの個別ステップ
    
    エージェント実行の各段階を記録し、可観測性を提供します。
    """
    id: str = Field(..., description="ステップ識別子")
    trace_id: str = Field(..., description="実行トレース識別子")
    step_number: int = Field(..., ge=1, description="ステップ番号")
    agent_id: str = Field(..., description="実行エージェント")
    action: str = Field(..., description="実行アクション要約")
    tools_used: List[str] = Field(default_factory=list, description="使用ツール一覧")
    citations: List[str] = Field(default_factory=list, description="引用URL")
    duration: int = Field(..., ge=0, description="実行時間（ミリ秒）")
    error_count: int = Field(default=0, ge=0, description="エラー・リトライ回数")
    timestamp: datetime = Field(default_factory=datetime.now, description="実行時刻")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="追加メタデータ")


class MAGIDecisionRequest(BaseModel):
    """
    MAGI意思決定システムへのリクエスト
    """
    question: str = Field(..., min_length=1, description="意思決定を求める質問")
    context: Optional[str] = Field(None, description="追加コンテキスト情報")
    trace_id: Optional[str] = Field(None, description="トレース識別子")
    agent_configs: Optional[Dict[AgentType, Dict[str, Any]]] = Field(
        None, description="エージェント個別設定"
    )
    
    @validator('question')
    def validate_question(cls, v):
        """質問の基本検証"""
        if not v or not v.strip():
            raise ValueError('Question cannot be empty')
        return v.strip()


class ExecutionError(BaseModel):
    """
    実行エラー情報
    """
    agent_id: Optional[AgentType] = Field(None, description="エラーが発生したエージェント")
    error_type: str = Field(..., description="エラータイプ")
    error_message: str = Field(..., description="エラーメッセージ")
    retry_count: int = Field(default=0, ge=0, description="リトライ回数")
    timestamp: datetime = Field(default_factory=datetime.now, description="エラー発生時刻")
    recovered: bool = Field(default=False, description="リトライで回復したか")


class MAGIDecisionResponse(BaseModel):
    """
    MAGI意思決定システムからの応答
    """
    request_id: str = Field(..., description="リクエスト識別子")
    trace_id: str = Field(..., description="実行トレース識別子")
    
    # エージェント応答
    agent_responses: List[AgentResponse] = Field(..., description="3賢者の応答")
    judge_response: JudgeResponse = Field(..., description="SOLOMON評価")
    
    # 実行情報
    total_execution_time: int = Field(..., ge=0, description="総実行時間（ミリ秒）")
    trace_steps: List[TraceStep] = Field(default_factory=list, description="実行トレース")
    
    # エラー情報（新規追加）
    errors: List[ExecutionError] = Field(default_factory=list, description="実行中のエラー情報")
    has_errors: bool = Field(default=False, description="エラーが発生したか")
    degraded_mode: bool = Field(default=False, description="段階的機能縮退モードか")
    
    # メタデータ
    timestamp: datetime = Field(default_factory=datetime.now, description="応答生成時刻")
    version: str = Field(default="1.0", description="システムバージョン")
    
    @validator('agent_responses')
    def validate_agent_responses(cls, v):
        """3賢者の応答が全て含まれているか検証"""
        expected_agents = {AgentType.CASPAR, AgentType.BALTHASAR, AgentType.MELCHIOR}
        actual_agents = {response.agent_id for response in v}
        
        if actual_agents != expected_agents:
            missing = expected_agents - actual_agents
            extra = actual_agents - expected_agents
            error_msg = []
            if missing:
                error_msg.append(f"Missing agents: {missing}")
            if extra:
                error_msg.append(f"Unexpected agents: {extra}")
            raise ValueError("; ".join(error_msg))
        
        return v


# エージェント説明の定数定義
AGENT_DESCRIPTIONS = {
    AgentType.SOLOMON: "SOLOMON Judge - 統括者として3賢者の投票を集計し、最終的な可決/否決を決定",
    AgentType.CASPAR: "CASPAR - 保守的・現実的な視点で可決/否決を判断（リスク重視）",
    AgentType.BALTHASAR: "BALTHASAR - 革新的・感情的な視点で可決/否決を判断（創造性重視）",
    AgentType.MELCHIOR: "MELCHIOR - バランス型・科学的な視点で可決/否決を判断（論理性重視）"
}

# 判断結果の表示用設定
DECISION_STYLES = {
    DecisionType.APPROVED: {
        "color": "green",
        "icon": "✓",
        "label": "可決",
        "description": "提案は承認されました"
    },
    DecisionType.REJECTED: {
        "color": "red", 
        "icon": "✗",
        "label": "否決",
        "description": "提案は却下されました"
    }
}