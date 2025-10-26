#!/usr/bin/env python3
"""
MAGI Agent Local Server

ローカル開発・テスト用のHTTPサーバー実装。
AgentCore Runtimeデプロイ前の動作確認に使用します。

学習ポイント:
- ローカル開発環境でのAPI テスト
- HTTP サーバーの基本実装
- JSON API の設計パターン
- エラーハンドリングとレスポンス形式
"""

import json
import asyncio
from datetime import datetime
from typing import Dict, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

# MAGI Agent のインポート
from magi_agent import magi_core
from shared.types import MAGIDecisionRequest


class MAGIRequestHandler(BaseHTTPRequestHandler):
    """MAGI Agent用HTTPリクエストハンドラー"""
    
    def do_GET(self):
        """GETリクエストの処理"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/':
            self._send_welcome_response()
        elif parsed_path.path == '/health':
            self._send_health_response()
        elif parsed_path.path == '/stats':
            self._send_stats_response()
        else:
            self._send_error_response(404, "Not Found")
    
    def do_POST(self):
        """POSTリクエストの処理"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/magi/decide':
            self._handle_magi_decision()
        else:
            self._send_error_response(404, "Not Found")
    
    def _handle_magi_decision(self):
        """MAGI意思決定リクエストの処理"""
        try:
            # リクエストボディの読み取り
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error_response(400, "Empty request body")
                return
            
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # リクエスト検証
            if 'question' not in request_data:
                self._send_error_response(400, "Missing 'question' field")
                return
            
            # MAGI Decision Request作成
            magi_request = MAGIDecisionRequest(
                question=request_data['question'],
                context=request_data.get('context')
            )
            
            print(f"📥 Received MAGI request: {magi_request.question}")
            
            # 非同期処理を同期的に実行
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                response = loop.run_until_complete(
                    magi_core.process_decision(magi_request)
                )
                
                # レスポンス作成
                response_data = {
                    "status": "success",
                    "request_id": response.request_id,
                    "trace_id": response.trace_id,
                    "result": {
                        "final_decision": response.judge_response.final_decision.value,
                        "voting_result": {
                            "approved": response.judge_response.voting_result.approved,
                            "rejected": response.judge_response.voting_result.rejected,
                            "abstained": response.judge_response.voting_result.abstained
                        },
                        "summary": response.judge_response.summary,
                        "recommendation": response.judge_response.final_recommendation,
                        "confidence": response.judge_response.confidence,
                        "execution_time": response.total_execution_time,
                        "agent_responses": [
                            {
                                "agent_id": ar.agent_id.value,
                                "decision": ar.decision.value,
                                "reasoning": ar.reasoning,
                                "confidence": ar.confidence,
                                "execution_time": ar.execution_time
                            }
                            for ar in response.agent_responses
                        ]
                    },
                    "timestamp": response.timestamp.isoformat(),
                    "version": response.version
                }
                
                self._send_json_response(200, response_data)
                print(f"✅ MAGI response sent: {response.judge_response.final_decision.value}")
                
            finally:
                loop.close()
                
        except json.JSONDecodeError:
            self._send_error_response(400, "Invalid JSON")
        except Exception as e:
            print(f"❌ Error processing MAGI request: {e}")
            self._send_error_response(500, f"Internal server error: {str(e)}")
    
    def _send_welcome_response(self):
        """ウェルカムレスポンスの送信"""
        welcome_data = {
            "service": "MAGI Decision System",
            "version": "1.0-agentcore",
            "description": "Multi-Agent Decision Making inspired by Evangelion",
            "endpoints": {
                "POST /magi/decide": "Execute MAGI decision process",
                "GET /health": "Health check",
                "GET /stats": "System statistics"
            },
            "agents": ["CASPAR", "BALTHASAR", "MELCHIOR", "SOLOMON"],
            "timestamp": datetime.now().isoformat()
        }
        
        self._send_json_response(200, welcome_data)
    
    def _send_health_response(self):
        """ヘルスチェックレスポンスの送信"""
        health_data = {
            "status": "healthy",
            "service": "MAGI Decision System",
            "agents_available": len([a for a in magi_core.agents.values() if a is not None]),
            "total_agents": len(magi_core.agents),
            "timestamp": datetime.now().isoformat()
        }
        
        self._send_json_response(200, health_data)
    
    def _send_stats_response(self):
        """統計レスポンスの送信"""
        stats_data = {
            "statistics": magi_core.get_stats(),
            "timestamp": datetime.now().isoformat()
        }
        
        self._send_json_response(200, stats_data)
    
    def _send_json_response(self, status_code: int, data: Dict[str, Any]):
        """JSON レスポンスの送信"""
        response_json = json.dumps(data, indent=2, ensure_ascii=False)
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_json.encode('utf-8'))))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        self.wfile.write(response_json.encode('utf-8'))
    
    def _send_error_response(self, status_code: int, message: str):
        """エラーレスポンスの送信"""
        error_data = {
            "status": "error",
            "error": {
                "code": status_code,
                "message": message
            },
            "timestamp": datetime.now().isoformat()
        }
        
        self._send_json_response(status_code, error_data)
    
    def do_OPTIONS(self):
        """CORS プリフライトリクエストの処理"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """ログメッセージのカスタマイズ"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")


class MAGILocalServer:
    """MAGI Agent ローカルサーバー"""
    
    def __init__(self, host: str = 'localhost', port: int = 8080):
        self.host = host
        self.port = port
        self.server = None
        self.server_thread = None
    
    def start(self):
        """サーバーを開始"""
        try:
            self.server = HTTPServer((self.host, self.port), MAGIRequestHandler)
            
            print(f"🚀 MAGI Local Server Starting...")
            print(f"   Host: {self.host}")
            print(f"   Port: {self.port}")
            print(f"   URL: http://{self.host}:{self.port}")
            print(f"   Endpoints:")
            print(f"     GET  /           - Welcome message")
            print(f"     GET  /health     - Health check")
            print(f"     GET  /stats      - System statistics")
            print(f"     POST /magi/decide - MAGI decision process")
            print()
            
            # サーバーを別スレッドで実行
            self.server_thread = threading.Thread(
                target=self.server.serve_forever,
                daemon=True
            )
            self.server_thread.start()
            
            print(f"✅ MAGI Local Server started successfully!")
            print(f"🔗 Access: http://{self.host}:{self.port}")
            print(f"⏹️  Press Ctrl+C to stop the server")
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to start server: {e}")
            return False
    
    def stop(self):
        """サーバーを停止"""
        if self.server:
            print(f"\n🛑 Stopping MAGI Local Server...")
            self.server.shutdown()
            self.server.server_close()
            
            if self.server_thread:
                self.server_thread.join(timeout=5)
            
            print(f"✅ MAGI Local Server stopped")
    
    def run_forever(self):
        """サーバーを永続実行"""
        if self.start():
            try:
                # メインスレッドで待機
                while True:
                    import time
                    time.sleep(1)
            except KeyboardInterrupt:
                self.stop()


def main():
    """メイン実行関数"""
    print("🤖 MAGI Decision System - Local Server")
    print("=" * 60)
    
    # サーバー作成・開始
    server = MAGILocalServer(host='localhost', port=8080)
    server.run_forever()


if __name__ == "__main__":
    main()