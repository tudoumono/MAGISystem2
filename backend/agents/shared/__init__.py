"""
Shared utilities for MAGI Decision System

このモジュールは全エージェントで共有される型定義、プロンプト、
ユーティリティ関数を提供します。

学習ポイント:
- Python パッケージの構造化
- 型安全性の確保（Pydantic使用）
- 共通機能の再利用パターン
"""

from .types import (
    AgentType,
    DecisionType,
    AgentResponse,
    JudgeResponse,
    MAGIDecisionRequest,
    MAGIDecisionResponse,
    TraceStep,
)

from .prompts import (
    SOLOMON_SYSTEM_PROMPT,
    CASPAR_SYSTEM_PROMPT,
    BALTHASAR_SYSTEM_PROMPT,
    MELCHIOR_SYSTEM_PROMPT,
)

from .utils import (
    generate_trace_id,
    format_execution_time,
    validate_decision_confidence,
)

__all__ = [
    # Types
    "AgentType",
    "DecisionType", 
    "AgentResponse",
    "JudgeResponse",
    "MAGIDecisionRequest",
    "MAGIDecisionResponse",
    "TraceStep",
    # Prompts
    "SOLOMON_SYSTEM_PROMPT",
    "CASPAR_SYSTEM_PROMPT",
    "BALTHASAR_SYSTEM_PROMPT",
    "MELCHIOR_SYSTEM_PROMPT",
    # Utils
    "generate_trace_id",
    "format_execution_time",
    "validate_decision_confidence",
]