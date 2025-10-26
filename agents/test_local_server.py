#!/usr/bin/env python3
"""
MAGI Local Server Test Script

ローカルサーバーの動作確認用テストスクリプト。
curlコマンドとPythonリクエストの両方でテストを実行します。

学習ポイント:
- HTTP API テストの実装
- JSON レスポンスの検証
- エラーハンドリングのテスト
- パフォーマンス測定
"""

import json
import time
import subprocess
import requests
from datetime import datetime
from typing import Dict, Any, Optional


class MAGIServerTester:
    """MAGI ローカルサーバーテスター"""
    
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.test_results = []
    
    def run_all_tests(self) -> bool:
        """全てのテストを実行"""
        print("🧪 MAGI Local Server Test Suite")
        print("=" * 60)
        print(f"Target URL: {self.base_url}")
        print(f"Test Start: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        tests = [
            ("Welcome Endpoint", self.test_welcome_endpoint),
            ("Health Check", self.test_health_endpoint),
            ("Statistics", self.test_stats_endpoint),
            ("MAGI Decision (Python)", self.test_magi_decision_python),
            ("MAGI Decision (curl)", self.test_magi_decision_curl),
            ("Error Handling", self.test_error_handling),
            ("Performance", self.test_performance)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"🔍 Running: {test_name}")
            
            try:
                result = test_func()
                if result:
                    print(f"   ✅ PASSED")
                    passed += 1
                else:
                    print(f"   ❌ FAILED")
                
                self.test_results.append({
                    "name": test_name,
                    "passed": result,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                print(f"   ❌ ERROR: {e}")
                self.test_results.append({
                    "name": test_name,
                    "passed": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
            
            print()
        
        # 結果サマリー
        self._print_summary(passed, total)
        
        return passed == total
    
    def test_welcome_endpoint(self) -> bool:
        """ウェルカムエンドポイントのテスト"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            if response.status_code != 200:
                print(f"   Status code: {response.status_code} (expected 200)")
                return False
            
            data = response.json()
            
            # 必須フィールドの確認
            required_fields = ["service", "version", "endpoints", "agents"]
            for field in required_fields:
                if field not in data:
                    print(f"   Missing field: {field}")
                    return False
            
            if data["service"] != "MAGI Decision System":
                print(f"   Unexpected service name: {data['service']}")
                return False
            
            print(f"   Service: {data['service']}")
            print(f"   Version: {data['version']}")
            print(f"   Agents: {data['agents']}")
            
            return True
            
        except Exception as e:
            print(f"   Exception: {e}")
            return False
    
    def test_health_endpoint(self) -> bool:
        """ヘルスチェックエンドポイントのテスト"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code != 200:
                print(f"   Status code: {response.status_code} (expected 200)")
                return False
            
            data = response.json()
            
            if data.get("status") != "healthy":
                print(f"   Health status: {data.get('status')} (expected healthy)")
                return False
            
            print(f"   Status: {data['status']}")
            print(f"   Agents Available: {data.get('agents_available', 0)}/{data.get('total_agents', 0)}")
            
            return True
            
        except Exception as e:
            print(f"   Exception: {e}")
            return False
    
    def test_stats_endpoint(self) -> bool:
        """統計エンドポイントのテスト"""
        try:
            response = requests.get(f"{self.base_url}/stats", timeout=10)
            
            if response.status_code != 200:
                print(f"   Status code: {response.status_code} (expected 200)")
                return False
            
            data = response.json()
            
            if "statistics" not in data:
                print(f"   Missing statistics field")
                return False
            
            stats = data["statistics"]
            print(f"   Total Requests: {stats.get('total_requests', 0)}")
            print(f"   Success Rate: {stats.get('success_rate', 0):.2%}")
            
            return True
            
        except Exception as e:
            print(f"   Exception: {e}")
            return False
    
    def test_magi_decision_python(self) -> bool:
        """MAGI意思決定エンドポイント（Python requests）のテスト"""
        try:
            request_data = {
                "question": "リモートワークを導入すべきか？",
                "context": "コロナ後の働き方改革として検討中"
            }
            
            print(f"   Question: {request_data['question']}")
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/magi/decide",
                json=request_data,
                timeout=300  # 5分タイムアウト
            )
            execution_time = int((time.time() - start_time) * 1000)
            
            if response.status_code != 200:
                print(f"   Status code: {response.status_code} (expected 200)")
                print(f"   Response: {response.text}")
                return False
            
            data = response.json()
            
            # レスポンス構造の確認
            if data.get("status") != "success":
                print(f"   Status: {data.get('status')} (expected success)")
                return False
            
            result = data.get("result", {})
            
            print(f"   Final Decision: {result.get('final_decision')}")
            print(f"   Voting: {result.get('voting_result', {})}")
            print(f"   Confidence: {result.get('confidence', 0):.2f}")
            print(f"   Execution Time: {execution_time}ms")
            print(f"   Agent Responses: {len(result.get('agent_responses', []))}")
            
            # 必須フィールドの確認
            required_fields = ["final_decision", "voting_result", "summary", "agent_responses"]
            for field in required_fields:
                if field not in result:
                    print(f"   Missing result field: {field}")
                    return False
            
            return True
            
        except Exception as e:
            print(f"   Exception: {e}")
            return False
    
    def test_magi_decision_curl(self) -> bool:
        """MAGI意思決定エンドポイント（curl）のテスト"""
        try:
            request_data = {
                "question": "新しい技術を導入すべきか？",
                "context": "競合他社が先行している状況"
            }
            
            print(f"   Question: {request_data['question']}")
            
            # curlコマンドの構築
            curl_command = [
                "curl",
                "-X", "POST",
                "-H", "Content-Type: application/json",
                "-d", json.dumps(request_data),
                "--max-time", "300",
                "--silent",
                f"{self.base_url}/magi/decide"
            ]
            
            start_time = time.time()
            result = subprocess.run(
                curl_command,
                capture_output=True,
                text=True,
                encoding='utf-8',  # UTF-8エンコーディングを明示指定
                timeout=300
            )
            execution_time = int((time.time() - start_time) * 1000)
            
            if result.returncode != 0:
                print(f"   curl failed with return code: {result.returncode}")
                print(f"   stderr: {result.stderr}")
                return False
            
            try:
                data = json.loads(result.stdout)
            except json.JSONDecodeError:
                print(f"   Invalid JSON response: {result.stdout}")
                return False
            
            if data.get("status") != "success":
                print(f"   Status: {data.get('status')} (expected success)")
                return False
            
            result_data = data.get("result", {})
            
            print(f"   Final Decision: {result_data.get('final_decision')}")
            print(f"   Execution Time: {execution_time}ms")
            print(f"   curl command executed successfully")
            
            return True
            
        except subprocess.TimeoutExpired:
            print(f"   curl command timed out")
            return False
        except Exception as e:
            print(f"   Exception: {e}")
            return False
    
    def test_error_handling(self) -> bool:
        """エラーハンドリングのテスト"""
        try:
            # 不正なJSONのテスト
            response = requests.post(
                f"{self.base_url}/magi/decide",
                data="invalid json",
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code != 400:
                print(f"   Invalid JSON status: {response.status_code} (expected 400)")
                return False
            
            # 空のリクエストのテスト
            response = requests.post(
                f"{self.base_url}/magi/decide",
                json={},
                timeout=10
            )
            
            if response.status_code != 400:
                print(f"   Empty request status: {response.status_code} (expected 400)")
                return False
            
            # 存在しないエンドポイントのテスト
            response = requests.get(f"{self.base_url}/nonexistent", timeout=10)
            
            if response.status_code != 404:
                print(f"   Nonexistent endpoint status: {response.status_code} (expected 404)")
                return False
            
            print(f"   Error handling working correctly")
            return True
            
        except Exception as e:
            print(f"   Exception: {e}")
            return False
    
    def test_performance(self) -> bool:
        """パフォーマンステスト"""
        try:
            request_data = {
                "question": "パフォーマンステスト用の質問です"
            }
            
            # 複数回実行してパフォーマンスを測定
            execution_times = []
            
            for i in range(3):
                start_time = time.time()
                response = requests.post(
                    f"{self.base_url}/magi/decide",
                    json=request_data,
                    timeout=300
                )
                execution_time = int((time.time() - start_time) * 1000)
                
                if response.status_code == 200:
                    execution_times.append(execution_time)
                    print(f"   Run {i+1}: {execution_time}ms")
                else:
                    print(f"   Run {i+1}: Failed (status {response.status_code})")
                    return False
            
            if execution_times:
                avg_time = sum(execution_times) / len(execution_times)
                min_time = min(execution_times)
                max_time = max(execution_times)
                
                print(f"   Average: {avg_time:.0f}ms")
                print(f"   Min: {min_time}ms, Max: {max_time}ms")
                
                # パフォーマンス基準（5分以内）
                if avg_time < 300000:  # 5分 = 300,000ms
                    return True
                else:
                    print(f"   Performance too slow: {avg_time:.0f}ms > 300,000ms")
                    return False
            
            return False
            
        except Exception as e:
            print(f"   Exception: {e}")
            return False
    
    def _print_summary(self, passed: int, total: int):
        """テスト結果サマリーの表示"""
        print("=" * 60)
        print("📊 Test Results Summary")
        print("=" * 60)
        
        success_rate = (passed / total) * 100 if total > 0 else 0
        
        print(f"✅ Passed: {passed}/{total} ({success_rate:.1f}%)")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if passed == total:
            print("\n🎉 All tests passed! MAGI Local Server is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Please check the server configuration.")
        
        print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


def main():
    """メインテスト実行"""
    tester = MAGIServerTester()
    success = tester.run_all_tests()
    
    if success:
        exit(0)
    else:
        exit(1)


if __name__ == "__main__":
    main()