"""
Timeout Configuration Utility for Python MAGI Agent

環境変数からタイムアウト値を読み込み、デフォルト値でフォールバック
A2A設計の多層タイムアウト戦略に対応
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class TimeoutConfig:
    """タイムアウト設定"""

    sage_timeout_seconds: int
    """個別賢者（CASPAR/BALTHASAR/MELCHIOR）のタイムアウト（秒）"""

    solomon_timeout_seconds: int
    """SOLOMON Judgeのタイムアウト（秒）"""

    total_timeout_seconds: int
    """Python全体処理のタイムアウト（秒）"""

    event_queue_timeout_seconds: int
    """イベントキュー取得のタイムアウト（秒）"""


# デフォルトタイムアウト値（A2A設計における安全マージンを考慮）
DEFAULT_TIMEOUT_CONFIG = TimeoutConfig(
    sage_timeout_seconds=90,           # 90秒（1.5分）
    solomon_timeout_seconds=60,        # 60秒（1分）
    total_timeout_seconds=180,         # 180秒（3分）
    event_queue_timeout_seconds=120,   # 120秒（2分）
)


def _get_env_int(key: str, default: int) -> int:
    """
    環境変数から整数値を安全に取得

    Args:
        key: 環境変数名
        default: デフォルト値

    Returns:
        環境変数の値、または無効な場合はデフォルト値
    """
    value = os.environ.get(key)

    if value is None:
        return default

    try:
        parsed = int(value)
        if parsed <= 0:
            print(f"⚠️ Invalid timeout value for {key}: {value}. Using default: {default}")
            return default
        return parsed
    except ValueError:
        print(f"⚠️ Invalid timeout value for {key}: {value}. Using default: {default}")
        return default


def load_timeout_config() -> TimeoutConfig:
    """
    タイムアウト設定をロード

    環境変数から読み込み、無効な場合はデフォルト値を使用

    Returns:
        TimeoutConfig: タイムアウト設定
    """
    config = TimeoutConfig(
        sage_timeout_seconds=_get_env_int(
            'MAGI_SAGE_TIMEOUT_SECONDS',
            DEFAULT_TIMEOUT_CONFIG.sage_timeout_seconds
        ),
        solomon_timeout_seconds=_get_env_int(
            'MAGI_SOLOMON_TIMEOUT_SECONDS',
            DEFAULT_TIMEOUT_CONFIG.solomon_timeout_seconds
        ),
        total_timeout_seconds=_get_env_int(
            'MAGI_TOTAL_TIMEOUT_SECONDS',
            DEFAULT_TIMEOUT_CONFIG.total_timeout_seconds
        ),
        event_queue_timeout_seconds=_get_env_int(
            'MAGI_EVENT_QUEUE_TIMEOUT_SECONDS',
            DEFAULT_TIMEOUT_CONFIG.event_queue_timeout_seconds
        ),
    )

    # バリデーション
    _validate_timeout_hierarchy(config)

    return config


def _validate_timeout_hierarchy(config: TimeoutConfig) -> None:
    """
    タイムアウト階層のバリデーション

    各レイヤーが適切な順序になっているか確認

    Args:
        config: タイムアウト設定
    """
    warnings = []

    # Layer 4 (賢者) < Layer 3 (全体処理)
    if config.sage_timeout_seconds >= config.total_timeout_seconds:
        warnings.append(
            f"⚠️ MAGI_SAGE_TIMEOUT_SECONDS ({config.sage_timeout_seconds}s) "
            f"should be less than MAGI_TOTAL_TIMEOUT_SECONDS ({config.total_timeout_seconds}s)"
        )

    # Layer 5 (SOLOMON) < Layer 3 (全体処理)
    if config.solomon_timeout_seconds >= config.total_timeout_seconds:
        warnings.append(
            f"⚠️ MAGI_SOLOMON_TIMEOUT_SECONDS ({config.solomon_timeout_seconds}s) "
            f"should be less than MAGI_TOTAL_TIMEOUT_SECONDS ({config.total_timeout_seconds}s)"
        )

    # イベントキュー < 全体処理
    if config.event_queue_timeout_seconds >= config.total_timeout_seconds:
        warnings.append(
            f"⚠️ MAGI_EVENT_QUEUE_TIMEOUT_SECONDS ({config.event_queue_timeout_seconds}s) "
            f"should be less than MAGI_TOTAL_TIMEOUT_SECONDS ({config.total_timeout_seconds}s)"
        )

    # 警告を出力
    if warnings:
        print("⚠️ Timeout configuration warnings:")
        for warning in warnings:
            print(warning)
        print("These settings may cause unexpected timeout behavior.")


def log_timeout_config(config: TimeoutConfig) -> None:
    """
    タイムアウト設定をログ出力

    Args:
        config: タイムアウト設定
    """
    print("🕐 Python Timeout Configuration:")
    print(f"  Layer 3 (Total):        {config.total_timeout_seconds}s")
    print(f"  Layer 4 (Sage):         {config.sage_timeout_seconds}s")
    print(f"  Layer 5 (SOLOMON):      {config.solomon_timeout_seconds}s")
    print(f"  Event Queue:            {config.event_queue_timeout_seconds}s")


# グローバルなタイムアウト設定インスタンス
_global_timeout_config: Optional[TimeoutConfig] = None


def get_timeout_config() -> TimeoutConfig:
    """
    グローバルなタイムアウト設定を取得

    初回呼び出し時にロードし、以降はキャッシュを返す

    Returns:
        TimeoutConfig: タイムアウト設定
    """
    global _global_timeout_config

    if _global_timeout_config is None:
        _global_timeout_config = load_timeout_config()

        # デバッグモードで設定をログ出力
        debug_streaming = os.environ.get('DEBUG_STREAMING', 'false').lower() == 'true'
        if debug_streaming:
            log_timeout_config(_global_timeout_config)

    return _global_timeout_config


def reset_timeout_config() -> None:
    """
    タイムアウト設定をリセット（テスト用）
    """
    global _global_timeout_config
    _global_timeout_config = None


# 使用例
if __name__ == '__main__':
    # デフォルト設定で実行
    print("=== Default Configuration ===")
    config = get_timeout_config()
    log_timeout_config(config)

    # 環境変数を設定して実行
    print("\n=== Custom Configuration ===")
    os.environ['MAGI_SAGE_TIMEOUT_SECONDS'] = '120'
    os.environ['MAGI_SOLOMON_TIMEOUT_SECONDS'] = '90'
    reset_timeout_config()  # キャッシュをクリア

    config = get_timeout_config()
    log_timeout_config(config)
