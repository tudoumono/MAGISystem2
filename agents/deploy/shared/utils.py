"""
ユーティリティ関数 - MAGI Decision System

このファイルは全エージェントで共有されるユーティリティ関数を提供します。

学習ポイント:
- 共通機能の再利用パターン
- エラーハンドリングのベストプラクティス
- ログ記録と可観測性の実装
"""

import uuid
import time
import logging
from datetime import datetime
from typing import Optional, Dict, Any

# ロガーの設定
logger = logging.getLogger(__name__)

# OpenTelemetryの条件付きインポート（Phase 1-2では不要）
try:
    from opentelemetry import trace
    from opentelemetry.trace import Status, StatusCode
    tracer = trace.get_tracer(__name__)
    OTEL_AVAILABLE = True
except ImportError:
    # Phase 1-2: OpenTelemetryが利用できない場合のフォールバック
    tracer = None
    Status = None
    StatusCode = None
    OTEL_AVAILABLE = False


def generate_trace_id() -> str:
    """
    実行トレース用のユニークIDを生成
    
    OpenTelemetryのトレースIDと連携可能な形式で生成します。
    
    Returns:
        str: ユニークなトレースID
        
    学習ポイント:
    - UUIDによるユニークID生成
    - 分散トレーシングでの識別子管理
    """
    return str(uuid.uuid4())


def generate_request_id() -> str:
    """
    リクエスト用のユニークIDを生成
    
    Returns:
        str: ユニークなリクエストID
    """
    return str(uuid.uuid4())


def format_execution_time(start_time: float, end_time: Optional[float] = None) -> int:
    """
    実行時間をミリ秒単位でフォーマット
    
    Args:
        start_time: 開始時刻（time.time()の戻り値）
        end_time: 終了時刻（Noneの場合は現在時刻を使用）
        
    Returns:
        int: 実行時間（ミリ秒）
        
    学習ポイント:
    - 高精度時間計測の実装
    - パフォーマンス監視のためのメトリクス収集
    """
    if end_time is None:
        end_time = time.time()
    
    duration_seconds = end_time - start_time
    duration_ms = int(duration_seconds * 1000)
    
    return max(0, duration_ms)  # 負の値を防ぐ


def validate_decision_confidence(confidence: float) -> float:
    """
    判断確信度の値を検証・正規化
    
    Args:
        confidence: 確信度（0.0-1.0の範囲であるべき）
        
    Returns:
        float: 正規化された確信度
        
    Raises:
        ValueError: 範囲外の値の場合
        
    学習ポイント:
    - データ検証の実装パターン
    - エラーハンドリングのベストプラクティス
    """
    if not isinstance(confidence, (int, float)):
        raise ValueError(f"Confidence must be a number, got {type(confidence)}")
    
    if not 0.0 <= confidence <= 1.0:
        raise ValueError(f"Confidence must be between 0.0 and 1.0, got {confidence}")
    
    return float(confidence)


def create_trace_step(
    trace_id: str,
    step_number: int,
    agent_id: str,
    action: str,
    duration: int,
    tools_used: Optional[list] = None,
    citations: Optional[list] = None,
    error_count: int = 0,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    トレースステップのデータ構造を作成
    
    Args:
        trace_id: トレース識別子
        step_number: ステップ番号
        agent_id: 実行エージェント
        action: 実行アクション
        duration: 実行時間（ミリ秒）
        tools_used: 使用ツール一覧
        citations: 引用URL一覧
        error_count: エラー回数
        metadata: 追加メタデータ
        
    Returns:
        Dict[str, Any]: トレースステップデータ
        
    学習ポイント:
    - 構造化ログの作成パターン
    - 可観測性データの標準化
    """
    return {
        "id": str(uuid.uuid4()),
        "trace_id": trace_id,
        "step_number": step_number,
        "agent_id": agent_id,
        "action": action,
        "tools_used": tools_used or [],
        "citations": citations or [],
        "duration": duration,
        "error_count": error_count,
        "timestamp": datetime.now().isoformat(),
        "metadata": metadata or {}
    }


def log_agent_execution(
    agent_id: str,
    action: str,
    duration: int,
    success: bool = True,
    error_message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    エージェント実行のログを記録
    
    Args:
        agent_id: エージェント識別子
        action: 実行アクション
        duration: 実行時間（ミリ秒）
        success: 成功フラグ
        error_message: エラーメッセージ（失敗時）
        metadata: 追加メタデータ
        
    学習ポイント:
    - 構造化ログの実装
    - 運用監視のためのログ設計
    """
    log_data = {
        "agent_id": agent_id,
        "action": action,
        "duration_ms": duration,
        "success": success,
        "timestamp": datetime.now().isoformat()
    }
    
    if error_message:
        log_data["error_message"] = error_message
    
    if metadata:
        log_data["metadata"] = metadata
    
    if success:
        logger.info(f"Agent execution completed", extra=log_data)
    else:
        logger.error(f"Agent execution failed", extra=log_data)


def trace_agent_execution(agent_id: str, action: str):
    """
    エージェント実行のOpenTelemetryトレーシングデコレータ
    
    Args:
        agent_id: エージェント識別子
        action: 実行アクション
        
    Returns:
        デコレータ関数
        
    学習ポイント:
    - OpenTelemetryによる分散トレーシング
    - デコレータパターンの活用
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            if OTEL_AVAILABLE and tracer:
                # OpenTelemetryが利用可能な場合
                with tracer.start_as_current_span(f"{agent_id}.{action}") as span:
                    span.set_attribute("agent.id", agent_id)
                    span.set_attribute("agent.action", action)
                    
                    start_time = time.time()
                    
                    try:
                        result = func(*args, **kwargs)
                        span.set_status(Status(StatusCode.OK))
                        return result
                        
                    except Exception as e:
                        span.set_status(Status(StatusCode.ERROR, str(e)))
                        span.record_exception(e)
                        raise
                        
                    finally:
                        duration = format_execution_time(start_time)
                        span.set_attribute("agent.duration_ms", duration)
            else:
                # Phase 1-2: OpenTelemetryなしでの実行
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    logger.error(f"Agent execution failed: {agent_id}.{action} - {str(e)}")
                    raise
                finally:
                    duration = format_execution_time(start_time)
                    logger.info(f"Agent execution completed: {agent_id}.{action} - {duration}ms")
                    
        return wrapper
    return decorator


def sanitize_content(content: str, max_length: int = 10000) -> str:
    """
    コンテンツの安全化処理
    
    Args:
        content: 処理対象のコンテンツ
        max_length: 最大文字数
        
    Returns:
        str: 安全化されたコンテンツ
        
    学習ポイント:
    - セキュリティ考慮事項の実装
    - コンテンツフィルタリングの基本
    """
    if not isinstance(content, str):
        content = str(content)
    
    # 長すぎるコンテンツの切り詰め
    if len(content) > max_length:
        content = content[:max_length] + "... [truncated]"
    
    # 基本的な安全化（必要に応じて拡張）
    content = content.strip()
    
    return content


def calculate_consensus_score(responses: list) -> float:
    """
    複数の応答から合意度スコアを計算
    
    Args:
        responses: エージェント応答のリスト
        
    Returns:
        float: 合意度スコア（0.0-1.0）
        
    学習ポイント:
    - 多エージェント合意アルゴリズム
    - 統計的分析の実装
    """
    if not responses:
        return 0.0
    
    # 決定の一致度を計算
    decisions = [r.get('decision') for r in responses if 'decision' in r]
    if not decisions:
        return 0.0
    
    # 最頻値の出現率を計算
    decision_counts = {}
    for decision in decisions:
        decision_counts[decision] = decision_counts.get(decision, 0) + 1
    
    max_count = max(decision_counts.values())
    consensus_rate = max_count / len(decisions)
    
    return consensus_rate