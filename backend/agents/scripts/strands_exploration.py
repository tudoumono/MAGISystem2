#!/usr/bin/env python3
"""
Strands Agents SDK Exploration

Strands Agents SDKの基本機能を調査・学習するためのスクリプト。
MAGI Decision Systemへの統合前に、フレームワークの理解を深めます。

学習ポイント:
- Strands Agents SDKの基本的な使用方法
- エージェントの作成と設定
- A2A通信プロトコルの理解
- ツールとの統合方法
"""

import asyncio
import sys
import os
from datetime import datetime

def explore_strands_imports():
    """Strands Agentsのインポート可能なモジュールを調査"""
    print("🔍 Exploring Strands Agents SDK imports...")
    
    try:
        # 基本インポートテスト
        from strands import Agent
        print("✅ Successfully imported: strands.Agent")
        
        # その他のインポートを試行
        import_tests = [
            ("strands.Agent", "from strands import Agent"),
            ("strands.Tool", "from strands import Tool"),
            ("strands.protocols", "from strands import protocols"),
            ("strands.A2AProtocol", "from strands.protocols import A2AProtocol"),
            ("strands.runtime", "from strands import runtime"),
            ("strands.bedrock", "from strands import bedrock"),
        ]
        
        successful_imports = []
        failed_imports = []
        
        for name, import_statement in import_tests:
            try:
                exec(import_statement)
                successful_imports.append(name)
                print(f"✅ {name}")
            except ImportError as e:
                failed_imports.append((name, str(e)))
                print(f"❌ {name}: {e}")
        
        print(f"\n📊 Import Results:")
        print(f"   ✅ Successful: {len(successful_imports)}")
        print(f"   ❌ Failed: {len(failed_imports)}")
        
        return successful_imports, failed_imports
        
    except ImportError as e:
        print(f"❌ Failed to import basic Strands Agent: {e}")
        return [], [("strands.Agent", str(e))]

def explore_agent_creation():
    """基本的なエージェント作成を試行"""
    print("\n🤖 Exploring Agent creation...")
    
    try:
        from strands import Agent
        
        # デフォルト設定でエージェント作成
        print("Creating agent with default settings...")
        agent = Agent()
        
        print(f"✅ Agent created successfully!")
        print(f"   Type: {type(agent)}")
        print(f"   Dir: {[attr for attr in dir(agent) if not attr.startswith('_')][:10]}...")
        
        return agent
        
    except Exception as e:
        print(f"❌ Agent creation failed: {e}")
        return None

def explore_agent_attributes(agent):
    """エージェントの属性とメソッドを調査"""
    print("\n🔍 Exploring Agent attributes and methods...")
    
    if not agent:
        print("❌ No agent to explore")
        return
    
    try:
        # 公開属性とメソッドを取得
        public_attrs = [attr for attr in dir(agent) if not attr.startswith('_')]
        
        print(f"📋 Public attributes and methods ({len(public_attrs)}):")
        for i, attr in enumerate(public_attrs[:20]):  # 最初の20個を表示
            attr_value = getattr(agent, attr)
            attr_type = type(attr_value).__name__
            print(f"   {i+1:2d}. {attr}: {attr_type}")
        
        if len(public_attrs) > 20:
            print(f"   ... and {len(public_attrs) - 20} more")
        
        # 重要そうなメソッドの詳細調査
        important_methods = ['__call__', 'run', 'execute', 'ask', 'query', 'invoke']
        
        print(f"\n🔧 Important methods check:")
        for method_name in important_methods:
            if hasattr(agent, method_name):
                method = getattr(agent, method_name)
                print(f"   ✅ {method_name}: {type(method).__name__}")
                
                # メソッドのdocstringがあれば表示
                if hasattr(method, '__doc__') and method.__doc__:
                    doc = method.__doc__.strip().split('\n')[0]  # 最初の行のみ
                    print(f"      Doc: {doc[:80]}...")
            else:
                print(f"   ❌ {method_name}: Not found")
        
        return public_attrs
        
    except Exception as e:
        print(f"❌ Attribute exploration failed: {e}")
        return []

async def test_basic_agent_call(agent):
    """基本的なエージェント呼び出しをテスト"""
    print("\n🚀 Testing basic agent call...")
    
    if not agent:
        print("❌ No agent to test")
        return None
    
    try:
        # 基本的な質問をテスト
        test_question = "Hello, can you tell me about yourself?"
        
        print(f"Question: {test_question}")
        print("Calling agent...")
        
        # エージェントが呼び出し可能かチェック
        if callable(agent):
            start_time = datetime.now()
            response = agent(test_question)
            end_time = datetime.now()
            
            execution_time = (end_time - start_time).total_seconds() * 1000
            
            print(f"✅ Agent call successful!")
            print(f"   Response type: {type(response)}")
            print(f"   Execution time: {execution_time:.0f}ms")
            print(f"   Response: {str(response)[:200]}...")
            
            return response
        else:
            print("❌ Agent is not callable")
            
            # 他の実行方法を試行
            for method_name in ['run', 'execute', 'ask', 'query']:
                if hasattr(agent, method_name):
                    method = getattr(agent, method_name)
                    if callable(method):
                        print(f"Trying {method_name} method...")
                        try:
                            response = method(test_question)
                            print(f"✅ {method_name} successful: {str(response)[:100]}...")
                            return response
                        except Exception as e:
                            print(f"❌ {method_name} failed: {e}")
            
            return None
        
    except Exception as e:
        print(f"❌ Agent call failed: {e}")
        print(f"   Error type: {type(e)}")
        return None

def explore_strands_configuration():
    """Strands Agentsの設定オプションを調査"""
    print("\n⚙️  Exploring Strands configuration options...")
    
    try:
        from strands import Agent
        
        # 設定パラメータを試行
        config_tests = [
            ("model", "gpt-4"),
            ("temperature", 0.7),
            ("max_tokens", 1000),
            ("provider", "openai"),
            ("bedrock_region", "ap-northeast-1"),
        ]
        
        print("Testing configuration parameters:")
        for param_name, param_value in config_tests:
            try:
                kwargs = {param_name: param_value}
                agent = Agent(**kwargs)
                print(f"   ✅ {param_name}={param_value}: Success")
            except Exception as e:
                print(f"   ❌ {param_name}={param_value}: {e}")
        
        # Bedrock固有の設定を試行
        print("\nTesting Bedrock-specific configurations:")
        bedrock_configs = [
            {"provider": "bedrock", "model": "anthropic.claude-3-5-sonnet-20240620-v1:0"},
            {"provider": "aws", "model": "claude-3-sonnet"},
            {"bedrock_region": "ap-northeast-1"},
        ]
        
        for config in bedrock_configs:
            try:
                agent = Agent(**config)
                print(f"   ✅ {config}: Success")
            except Exception as e:
                print(f"   ❌ {config}: {e}")
        
    except Exception as e:
        print(f"❌ Configuration exploration failed: {e}")

def explore_mcp_integration():
    """MCP (Model Context Protocol) 統合を調査"""
    print("\n🔗 Exploring MCP integration...")
    
    try:
        # MCPモジュールのインポートテスト
        import mcp
        print(f"✅ MCP module available: {mcp.__version__}")
        
        # MCP関連の機能を調査
        mcp_attrs = [attr for attr in dir(mcp) if not attr.startswith('_')]
        print(f"📋 MCP attributes: {mcp_attrs[:10]}...")
        
        # Strands AgentsでのMCP統合を調査
        from strands import Agent
        
        # MCP関連の設定を試行
        mcp_tests = [
            {"mcp_enabled": True},
            {"mcp_server": "localhost:8080"},
        ]
        
        for config in mcp_tests:
            try:
                agent = Agent(**config)
                print(f"   ✅ MCP config {config}: Success")
            except Exception as e:
                print(f"   ❌ MCP config {config}: {e}")
        
    except ImportError as e:
        print(f"❌ MCP not available: {e}")
    except Exception as e:
        print(f"❌ MCP exploration failed: {e}")

async def main():
    """メイン探索実行"""
    print("🚀 Strands Agents SDK Exploration")
    print("=" * 60)
    print(f"Exploration Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python Version: {sys.version}")
    print()
    
    # 1. インポート調査
    successful_imports, failed_imports = explore_strands_imports()
    
    # 2. エージェント作成
    agent = explore_agent_creation()
    
    # 3. エージェント属性調査
    if agent:
        attributes = explore_agent_attributes(agent)
    
    # 4. 基本的な呼び出しテスト
    if agent:
        response = await test_basic_agent_call(agent)
    
    # 5. 設定オプション調査
    explore_strands_configuration()
    
    # 6. MCP統合調査
    explore_mcp_integration()
    
    # 7. 結果サマリー
    print("\n" + "=" * 60)
    print("📊 Exploration Results Summary")
    print("=" * 60)
    
    print(f"✅ Successful imports: {len(successful_imports)}")
    print(f"❌ Failed imports: {len(failed_imports)}")
    print(f"🤖 Agent creation: {'Success' if agent else 'Failed'}")
    print(f"🚀 Agent call: {'Success' if agent and 'response' in locals() else 'Failed'}")
    
    if successful_imports:
        print(f"\n🎉 Strands Agents SDK is functional!")
        print(f"🚀 Next steps:")
        print(f"  1. Implement MAGI agents using Strands framework")
        print(f"  2. Configure Bedrock integration")
        print(f"  3. Implement A2A communication")
        print(f"  4. Create SOLOMON orchestrator")
    else:
        print(f"\n⚠️  Strands Agents SDK needs further investigation")
    
    print(f"\nExploration completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    asyncio.run(main())