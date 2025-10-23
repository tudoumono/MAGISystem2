"""
SOLOMON Judge Agent - MAGI Decision System

SOLOMON Judgeは3賢者（CASPAR、BALTHASAR、MELCHIOR）を統括し、
最終的な意思決定を行う統括エージェントです。

学習ポイント:
- Strands Agentsでのオーケストレーターパターン
- ツールとしての他エージェント活用
- 多エージェント合意形成アルゴリズム
"""

from .agent import SolomonJudgeAgent
from .tools import CasparTool, BalthasarTool, MelchiorTool

__all__ = [
    "SolomonJudgeAgent",
    "CasparTool", 
    "BalthasarTool",
    "MelchiorTool"
]