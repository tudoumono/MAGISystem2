#!/usr/bin/env python3
"""
AgentCore Runtime セットアップ確認

AgentCore Runtimeの依存関係とセットアップ状況を確認します。
"""

import sys
import subprocess


def check_python_version():
    """Pythonバージョン確認"""
    print("🐍 Checking Python version...")
    version = sys.version_info
    print(f"   Python {version.major}.{version.minor}.{version.micro}")
    
    if version.major == 3 and version.minor >= 11:
        print("   ✅ Python version is compatible (3.11+)")
        return True
    else:
        print(f"   ⚠️  Python 3.11+ recommended (current: {version.major}.{version.minor})")
        return True  # 警告のみ


def check_package(package_name):
    """パッケージのインストール確認"""
    try:
        __import__(package_name.replace('-', '_'))
        return True
    except ImportError:
        return False


def check_dependencies():
    """依存関係の確認"""
    print("\n📦 Checking dependencies...")
    
    dependencies = {
        "strands-agents": "strands",
        "bedrock-agentcore": "bedrock_agentcore",
        "boto3": "boto3",
        "pydantic": "pydantic",
        "aiohttp": "aiohttp",
    }
    
    all_installed = True
    for package_name, import_name in dependencies.items():
        if check_package(import_name):
            print(f"   ✅ {package_name}")
        else:
            print(f"   ❌ {package_name} - NOT INSTALLED")
            all_installed = False
    
    return all_installed


def check_aws_credentials():
    """AWS認証情報の確認"""
    print("\n🔐 Checking AWS credentials...")
    
    try:
        import boto3
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        
        print(f"   ✅ AWS credentials configured")
        print(f"   Account: {identity['Account']}")
        print(f"   User/Role: {identity['Arn'].split('/')[-1]}")
        return True
        
    except Exception as e:
        print(f"   ❌ AWS credentials not configured: {e}")
        return False


def check_bedrock_access():
    """Bedrock アクセス確認"""
    print("\n🤖 Checking Bedrock access...")
    
    try:
        import boto3
        bedrock = boto3.client('bedrock', region_name='ap-northeast-1')
        
        # モデル一覧を取得（権限確認）
        response = bedrock.list_foundation_models()
        
        print(f"   ✅ Bedrock access confirmed")
        print(f"   Available models: {len(response.get('modelSummaries', []))}")
        return True
        
    except Exception as e:
        print(f"   ⚠️  Bedrock access check failed: {e}")
        print(f"   Note: This is expected if Bedrock is not configured yet")
        return False


def check_agentcore_config():
    """AgentCore設定の確認"""
    print("\n⚙️  Checking AgentCore configuration...")
    
    import os
    config_file = os.path.join(os.path.dirname(__file__), '.bedrock_agentcore.yaml')
    
    if os.path.exists(config_file):
        print(f"   ✅ AgentCore config found: {config_file}")
        return True
    else:
        print(f"   ⚠️  AgentCore config not found")
        print(f"   Run: agentcore configure")
        return False


def check_magi_implementation():
    """MAGI実装の確認"""
    print("\n🧠 Checking MAGI implementation...")
    
    import os
    
    files_to_check = [
        'magi_agent.py',
        'magi_strands_agents.py',
        'shared/types.py',
        'shared/prompts.py',
        'shared/utils.py'
    ]
    
    all_exist = True
    for file in files_to_check:
        file_path = os.path.join(os.path.dirname(__file__), file)
        if os.path.exists(file_path):
            print(f"   ✅ {file}")
        else:
            print(f"   ❌ {file} - NOT FOUND")
            all_exist = False
    
    return all_exist


def print_next_steps(results):
    """次のステップを表示"""
    print("\n" + "=" * 60)
    print("📋 Next Steps:")
    print("=" * 60)
    
    if not results['dependencies']:
        print("\n1. Install dependencies:")
        print("   cd agents")
        print("   pip install -r requirements.txt")
    
    if not results['aws_credentials']:
        print("\n2. Configure AWS credentials:")
        print("   aws configure")
        print("   # または")
        print("   aws sso login")
    
    if not results['agentcore_config']:
        print("\n3. Configure AgentCore:")
        print("   cd agents")
        print("   agentcore configure")
    
    if results['dependencies'] and results['magi_implementation']:
        print("\n✅ Ready to test MAGI system:")
        print("   python agents/test_magi_system.py")
        print("   python agents/test_magi_system.py --real  # With Strands Agents")
    
    if results['agentcore_config']:
        print("\n✅ Ready to deploy to AgentCore Runtime:")
        print("   cd agents")
        print("   agentcore launch")


def main():
    """メイン関数"""
    print("=" * 60)
    print("🚀 AgentCore Runtime Setup Check")
    print("=" * 60)
    
    results = {
        'python_version': check_python_version(),
        'dependencies': check_dependencies(),
        'aws_credentials': check_aws_credentials(),
        'bedrock_access': check_bedrock_access(),
        'agentcore_config': check_agentcore_config(),
        'magi_implementation': check_magi_implementation()
    }
    
    print_next_steps(results)
    
    # 全て成功した場合
    if all(results.values()):
        print("\n" + "=" * 60)
        print("✅ All checks passed! System is ready.")
        print("=" * 60)
        return 0
    else:
        print("\n" + "=" * 60)
        print("⚠️  Some checks failed. Please follow the next steps above.")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    exit(main())
