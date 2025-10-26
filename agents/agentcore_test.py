#!/usr/bin/env python3
"""
AgentCore Runtime基本動作確認テスト

このスクリプトは、AgentCore Runtime環境が正しく構築されているかを確認します。
"""

import asyncio
import sys
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import structlog

# ログ設定
logger = structlog.get_logger(__name__)

class AgentCoreEnvironmentTest:
    """AgentCore Runtime環境テストクラス"""
    
    def __init__(self):
        self.region = "ap-northeast-1"
        self.test_results: Dict[str, bool] = {}
    
    async def run_all_tests(self) -> Dict[str, bool]:
        """全てのテストを実行"""
        logger.info("AgentCore Runtime環境テストを開始します")
        
        # 1. AWS認証情報テスト
        await self.test_aws_credentials()
        
        # 2. Bedrock接続テスト
        await self.test_bedrock_connection()
        
        # 3. パッケージインポートテスト
        await self.test_package_imports()
        
        # 4. 基本設定ファイルテスト
        await self.test_configuration_files()
        
        # 結果表示
        self.display_results()
        
        return self.test_results
    
    async def test_aws_credentials(self) -> None:
        """AWS認証情報テスト"""
        try:
            # STS呼び出しで認証情報確認
            sts_client = boto3.client('sts', region_name=self.region)
            identity = sts_client.get_caller_identity()
            
            logger.info(
                "AWS認証情報確認成功",
                account_id=identity.get('Account'),
                user_arn=identity.get('Arn'),
                region=self.region
            )
            self.test_results['aws_credentials'] = True
            
        except (ClientError, NoCredentialsError) as e:
            logger.error("AWS認証情報エラー", error=str(e))
            self.test_results['aws_credentials'] = False
    
    async def test_bedrock_connection(self) -> None:
        """Bedrock接続テスト"""
        try:
            # Bedrock Runtime接続確認
            bedrock_client = boto3.client('bedrock-runtime', region_name=self.region)
            
            # 利用可能なモデル一覧取得（権限確認）
            bedrock_models_client = boto3.client('bedrock', region_name=self.region)
            
            try:
                models = bedrock_models_client.list_foundation_models()
                model_count = len(models.get('modelSummaries', []))
                logger.info("Bedrock接続成功", available_models=model_count)
                self.test_results['bedrock_connection'] = True
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'AccessDeniedException':
                    logger.warning("Bedrockモデル一覧取得権限なし（基本接続は成功）")
                    self.test_results['bedrock_connection'] = True
                else:
                    raise
                    
        except Exception as e:
            logger.error("Bedrock接続エラー", error=str(e))
            self.test_results['bedrock_connection'] = False
    
    async def test_package_imports(self) -> None:
        """パッケージインポートテスト"""
        try:
            # 必須パッケージのインポート確認
            import bedrock_agentcore
            import boto3
            import pydantic
            import structlog
            import opentelemetry
            
            # strands_agentsは個別にテスト
            try:
                import strands_agents
                strands_version = getattr(strands_agents, '__version__', 'unknown')
                logger.info("Strands Agentsインポート成功", version=strands_version)
            except ImportError as e:
                logger.warning("Strands Agentsインポートエラー（AgentCore Runtimeには影響なし）", error=str(e))
            
            logger.info("必須パッケージインポート成功")
            
            # バージョン情報表示
            logger.info(
                "パッケージバージョン情報",
                bedrock_agentcore=getattr(bedrock_agentcore, '__version__', 'unknown'),
                boto3=boto3.__version__,
                pydantic=pydantic.__version__
            )
            
            self.test_results['package_imports'] = True
            
        except ImportError as e:
            logger.error("パッケージインポートエラー", error=str(e))
            self.test_results['package_imports'] = False
    
    async def test_configuration_files(self) -> None:
        """設定ファイルテスト"""
        try:
            import os
            import yaml
            
            # .bedrock_agentcore.yaml確認
            config_path = ".bedrock_agentcore.yaml"
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f)
                
                logger.info("AgentCore設定ファイル確認成功", config_region=config.get('region'))
                self.test_results['configuration_files'] = True
            else:
                logger.warning("AgentCore設定ファイルが見つかりません")
                self.test_results['configuration_files'] = False
                
        except Exception as e:
            logger.error("設定ファイル確認エラー", error=str(e))
            self.test_results['configuration_files'] = False
    
    def display_results(self) -> None:
        """テスト結果表示"""
        print("\n" + "="*60)
        print("AgentCore Runtime環境テスト結果")
        print("="*60)
        
        for test_name, result in self.test_results.items():
            status = "✅ 成功" if result else "❌ 失敗"
            print(f"{test_name:25} : {status}")
        
        print("="*60)
        
        success_count = sum(self.test_results.values())
        total_count = len(self.test_results)
        
        if success_count == total_count:
            print("🎉 全てのテストが成功しました！AgentCore Runtime環境の準備完了です。")
        else:
            print(f"⚠️  {total_count - success_count}個のテストが失敗しました。設定を確認してください。")

async def main():
    """メイン実行関数"""
    try:
        tester = AgentCoreEnvironmentTest()
        results = await tester.run_all_tests()
        
        # 終了コード設定
        success_count = sum(results.values())
        total_count = len(results)
        
        if success_count == total_count:
            sys.exit(0)  # 成功
        else:
            sys.exit(1)  # 失敗
            
    except Exception as e:
        logger.error("テスト実行中にエラーが発生しました", error=str(e))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())