"""
MAGI Agents Configuration Management

.envファイルと環境変数からの設定読み込みを管理
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any
import yaml

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False
    print("[WARN] python-dotenv not installed. Using environment variables only.")


class MAGIConfig:
    """MAGI Agents設定管理クラス"""
    
    def __init__(self, env_file: Optional[str] = None):
        """
        設定を初期化
        
        Args:
            env_file: .envファイルのパス（省略時は自動検出）
        """
        self.base_dir = Path(__file__).parent.parent
        self._load_env_file(env_file)
        self._config = self._load_config()
    
    def _load_env_file(self, env_file: Optional[str] = None):
        """
        .envファイルを読み込み
        
        優先順位:
        1. 指定されたenv_file
        2. agents/.env
        3. プロジェクトルート/.env.local
        
        Note: AgentCore Runtime環境では.envファイルが利用できない場合があります
        """
        if not DOTENV_AVAILABLE:
            return
            
        env_paths = []
        
        if env_file:
            env_paths.append(Path(env_file))
        
        # agents/.env
        agents_env = self.base_dir / '.env'
        if agents_env.exists():
            env_paths.append(agents_env)
        
        # プロジェクトルート/.env.local
        root_env = self.base_dir.parent / '.env.local'
        if root_env.exists():
            env_paths.append(root_env)
        
        # 見つかった.envファイルを読み込み（後のものが優先）
        loaded_count = 0
        for env_path in env_paths:
            if env_path.exists():
                try:
                    load_dotenv(env_path, override=True)
                    print(f"[OK] Loaded config from: {env_path}")
                    loaded_count += 1
                except Exception as e:
                    print(f"[WARN] Failed to load {env_path}: {e}")
        
        # AgentCore Runtime環境での警告
        if loaded_count == 0 and self._is_agentcore_runtime():
            print("ℹ️  AgentCore Runtime環境: .envファイルが見つかりません")
            print("   環境変数または.bedrock_agentcore.yamlから設定を読み込みます")
    
    def _is_agentcore_runtime(self) -> bool:
        """AgentCore Runtime環境かどうかを判定"""
        # AgentCore Runtime特有の環境変数をチェック
        agentcore_indicators = [
            'BEDROCK_AGENTCORE_RUNTIME',
            'AWS_LAMBDA_FUNCTION_NAME',
            'AWS_EXECUTION_ENV'
        ]
        return any(os.getenv(indicator) for indicator in agentcore_indicators)
    
    def _load_config(self) -> Dict[str, Any]:
        """設定値を読み込み"""

        # 1. 環境変数から基本設定を取得
        config = {
            'aws_region': os.getenv('AWS_REGION', 'ap-northeast-1'),
            'magi_agent_arn': os.getenv('MAGI_AGENT_ARN'),
            'magi_agent_id': os.getenv('MAGI_AGENT_ID'),
            'debug_streaming': os.getenv('DEBUG_STREAMING', 'false').lower() == 'true',
            'verbose_output': os.getenv('VERBOSE_OUTPUT', 'false').lower() == 'true',
            'test_output_dir': os.getenv('TEST_OUTPUT_DIR', 'tests/streaming_output'),
            'request_timeout': int(os.getenv('REQUEST_TIMEOUT', '300')),
            'connect_timeout': int(os.getenv('CONNECT_TIMEOUT', '10')),
            'max_retries': int(os.getenv('MAX_RETRIES', '3')),
            # カスタムプロンプト設定
            'caspar_custom_prompt': os.getenv('CASPAR_CUSTOM_PROMPT'),
            'balthasar_custom_prompt': os.getenv('BALTHASAR_CUSTOM_PROMPT'),
            'melchior_custom_prompt': os.getenv('MELCHIOR_CUSTOM_PROMPT'),
            'solomon_custom_prompt': os.getenv('SOLOMON_CUSTOM_PROMPT'),
            # 文字数制限設定（カスタマイズ可能）
            'sage_reasoning_max_length': int(os.getenv('SAGE_REASONING_MAX_LENGTH', '1000')),
            'solomon_reasoning_max_length': int(os.getenv('SOLOMON_REASONING_MAX_LENGTH', '1500')),
        }

        # 2. .bedrock_agentcore.yamlから補完（ARNが未設定の場合）
        if not config['magi_agent_arn']:
            bedrock_config = self._load_bedrock_config()
            if bedrock_config:
                config.update(bedrock_config)

        return config
    
    def _load_bedrock_config(self) -> Optional[Dict[str, Any]]:
        """
        .bedrock_agentcore.yamlから設定を読み込み
        
        Returns:
            設定辞書またはNone
        """
        config_path = self.base_dir / '.bedrock_agentcore.yaml'
        
        if not config_path.exists():
            return None
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                bedrock_config = yaml.safe_load(f)
            
            default_agent = bedrock_config.get('default_agent', 'magi_agent')
            agent_config = bedrock_config.get('agents', {}).get(default_agent, {})
            
            result = {}
            
            # AgentCore Runtime ARN
            bedrock_agentcore = agent_config.get('bedrock_agentcore', {})
            if bedrock_agentcore.get('agent_arn'):
                result['magi_agent_arn'] = bedrock_agentcore['agent_arn']
            
            if bedrock_agentcore.get('agent_id'):
                result['magi_agent_id'] = bedrock_agentcore['agent_id']
            
            # AWS設定
            aws_config = agent_config.get('aws', {})
            if aws_config.get('region'):
                result['aws_region'] = aws_config['region']
            
            return result if result else None
            
        except Exception as e:
            print(f"[WARN] .bedrock_agentcore.yaml読み込みエラー: {e}")
            return None
    
    def get(self, key: str, default: Any = None) -> Any:
        """設定値を取得"""
        return self._config.get(key, default)
    
    def get_agent_arn(self) -> str:
        """MAGI Agent ARNを取得"""
        arn = self.get('magi_agent_arn')
        if not arn:
            raise ValueError(
                "MAGI_AGENT_ARN が設定されていません。以下のいずれかを設定してください:\n"
                "  1. agents/.env ファイル\n"
                "  2. 環境変数 MAGI_AGENT_ARN\n"
                "  3. .bedrock_agentcore.yaml ファイル\n"
                "\n例:\n"
                "  MAGI_AGENT_ARN=arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/magi_agent-xxxxx"
            )
        return arn
    
    def get_region(self) -> str:
        """AWSリージョンを取得"""
        return self.get('aws_region', 'ap-northeast-1')
    
    def is_debug_enabled(self) -> bool:
        """デバッグモードが有効かチェック"""
        return self.get('debug_streaming', False)
    
    def is_verbose_enabled(self) -> bool:
        """詳細出力モードが有効かチェック"""
        return self.get('verbose_output', False)
    
    def get_output_dir(self) -> Path:
        """テスト出力ディレクトリを取得"""
        output_dir = self.base_dir / self.get('test_output_dir', 'tests/streaming_output')
        output_dir.mkdir(parents=True, exist_ok=True)
        return output_dir
    
    def get_custom_prompt(self, agent_name: str) -> Optional[str]:
        """
        カスタムプロンプトを取得

        Args:
            agent_name: エージェント名（caspar, balthasar, melchior, solomon）

        Returns:
            カスタムプロンプト、または None（デフォルト使用）
        """
        key = f'{agent_name.lower()}_custom_prompt'
        return self.get(key)

    def has_custom_prompts(self) -> bool:
        """カスタムプロンプトが設定されているかチェック"""
        return any([
            self.get_custom_prompt('caspar'),
            self.get_custom_prompt('balthasar'),
            self.get_custom_prompt('melchior'),
            self.get_custom_prompt('solomon')
        ])

    def print_config(self):
        """現在の設定を表示"""
        print("🔧 MAGI Configuration")
        print("=" * 50)
        print(f"Environment: {'AgentCore Runtime' if self._is_agentcore_runtime() else 'Local Development'}")
        print(f"AWS Region: {self.get_region()}")
        print(f"Agent ARN: {self.get('magi_agent_arn', 'Not set')}")
        print(f"Agent ID: {self.get('magi_agent_id', 'Not set')}")
        print(f"Debug Mode: {self.is_debug_enabled()}")
        print(f"Verbose Mode: {self.is_verbose_enabled()}")
        print(f"Output Dir: {self.get_output_dir()}")
        print(f"Custom Prompts: {'Enabled' if self.has_custom_prompts() else 'Disabled (using defaults)'}")
        print("=" * 50)
    
    def setup_agentcore_env(self):
        """
        AgentCore Runtime環境用の設定セットアップ
        
        .bedrock_agentcore.yamlから環境変数を設定
        """
        if not self._is_agentcore_runtime():
            return
        
        bedrock_config = self._load_bedrock_config()
        if not bedrock_config:
            return
        
        # 環境変数として設定（AgentCore Runtime内で利用）
        for key, value in bedrock_config.items():
            env_key = key.upper()
            if not os.getenv(env_key):
                os.environ[env_key] = str(value)
                print(f"🔧 Set {env_key}={value}")
    
    @classmethod
    def for_agentcore_runtime(cls) -> 'MAGIConfig':
        """
        AgentCore Runtime専用の設定インスタンスを作成
        
        Returns:
            AgentCore Runtime用に最適化された設定インスタンス
        """
        config = cls()
        config.setup_agentcore_env()
        return config


# グローバル設定インスタンス
config = MAGIConfig()


def get_config() -> MAGIConfig:
    """グローバル設定インスタンスを取得"""
    return config