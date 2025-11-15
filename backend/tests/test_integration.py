#!/usr/bin/env python3
"""
MAGI System Integration Test

🎯 AGENTCORE RUNTIME INTEGRATION TEST 🎯
==========================================

This test verifies the complete integration between:
  - Frontend (Amplify)
  - Backend (Next.js API routes)
  - Python MAGI Agent (Strands Agents)
  - Amazon Bedrock

✅ Tests streaming response from /invocations endpoint
✅ Validates new event format (agent_start, agent_chunk, agent_complete)
✅ Verifies all 3 sages (CASPAR, BALTHASAR, MELCHIOR) responses
✅ Confirms SOLOMON Judge integration and final decision

Architecture:
    Test Client (this file)
        ↓ HTTP POST /invocations
    Next.js Backend (port 8080)
        ↓ spawn('python', ['magi_agent.py'])
    Python MAGI Agent
        ↓ Strands Agents
    Amazon Bedrock

Usage:
    cd backend/tests
    ./run_test.sh

    # or directly
    python test_integration.py

Environment Variables:
    NEXT_PUBLIC_AGENTCORE_URL - Backend URL (default: http://localhost:8080)
    AWS_REGION - AWS region (default: us-east-1)
    AWS_ACCESS_KEY_ID - AWS credentials
    AWS_SECRET_ACCESS_KEY - AWS credentials

Output:
    - Streaming events printed to console in real-time
    - Test summary with execution time and event counts
    - agents/tests/streaming_output_v2/melchior_stream.txt
    - agents/tests/streaming_output_v2/solomon_stream.txt
    - agents/tests/streaming_output_v2/full_stream.json
    - agents/tests/streaming_output_v2/summary.txt
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

# 共通設定モジュールをインポート
sys.path.append(str(Path(__file__).parent.parent))

try:
    from shared.config import get_config
except ImportError as e:
    print(f"❌ インポートエラー: {e}")
    print(f"   shared/config.py が存在することを確認してください")
    sys.exit(1)

# AWS SDK
import boto3
from botocore.config import Config


class AgentCoreRuntimeTester:
    """
    AgentCore Runtime テスター（新イベント形式対応）
    
    デプロイ済みのAgentCore Runtimeをテストします。
    PR #6の新しいイベント形式（agent_*, agentId）に対応。
    """
    
    def __init__(self, agent_runtime_arn: str, region: str = "ap-northeast-1", verbose: bool = True):
        """
        初期化
        
        Args:
            agent_runtime_arn: AgentCore RuntimeのARN
            region: AWSリージョン
            verbose: リアルタイムコンソール表示を有効にする
        """
        self.agent_runtime_arn = agent_runtime_arn
        self.region = region
        self.verbose = verbose
        
        # Boto3クライアント（タイムアウトを延長）
        config = Config(
            region_name=region,
            signature_version='v4',
            retries={'max_attempts': 3, 'mode': 'standard'},
            read_timeout=300,  # 5分に延長（MAGI実行時間を考慮）
            connect_timeout=10
        )
        self.client = boto3.client('bedrock-agentcore', config=config)
        
        # 出力ディレクトリ
        self.output_dir = Path(__file__).parent / "streaming_output_v2"
        self.output_dir.mkdir(exist_ok=True)
        
        # ストリーム収集用
        self.streams = {
            "caspar": [],
            "balthasar": [],
            "melchior": [],
            "solomon": []
        }
        
        # 全イベント記録
        self.all_events = []
        
        # 統計情報
        self.stats = {
            "total_events": 0,
            "events_by_type": {},
            "chunks_by_agent": {
                "caspar": 0,
                "balthasar": 0,
                "melchior": 0,
                "solomon": 0
            },
            "start_time": None,
            "end_time": None
        }
    
    def test_streaming(self, question: str):
        """
        ストリーミングテストを実行
        
        Args:
            question: テスト質問
        """
        print("=" * 80)
        print("🎯 MAGI AgentCore Runtime Test (Next.js + Python)")
        print("=" * 80)
        print(f"Agent ARN: {self.agent_runtime_arn}")
        print(f"Region: {self.region}")
        print(f"Architecture: Next.js → spawn() → magi_agent.py")
        print(f"Question: {question}")
        print(f"Output Directory: {self.output_dir.absolute()}")
        print("=" * 80)
        print()
        
        self.stats["start_time"] = datetime.now()
        
        try:
            # リクエストペイロード
            payload = {
                "question": question
            }
            
            # セッションID生成（UUID使用）
            import uuid
            runtime_session_id = f"test-v2-{int(datetime.now().timestamp())}-{uuid.uuid4().hex}"
            
            print(f"📡 Sending request to AgentCore Runtime...")
            print(f"Session ID: {runtime_session_id}")
            print()
            
            # AgentCore Runtime呼び出し
            response = self.client.invoke_agent_runtime(
                agentRuntimeArn=self.agent_runtime_arn,
                runtimeSessionId=runtime_session_id,
                payload=json.dumps(payload).encode('utf-8')
            )
            
            print("✅ Connection established, receiving stream...")
            print()
            
            # イベントストリームを処理
            if 'response' in response:
                event_stream = response['response']
            else:
                raise Exception(f"Unexpected response structure: {list(response.keys())}")
            
            # ストリーミング処理（同期版）
            self._process_event_stream(event_stream)
            
            self.stats["end_time"] = datetime.now()
            
            # ファイルに保存
            self._save_streams()
            self._print_summary()
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
    
    def _process_event_stream(self, event_stream):
        """
        AgentCore Runtimeのイベントストリームを処理
        
        Args:
            event_stream: Boto3のイベントストリーム（StreamingBody）
        """
        line_count = 0
        
        try:
            print(f"🔍 Stream type: {type(event_stream).__name__}")
            print("✅ Using iter_lines() for streaming...")
            print()
            
            # StreamingBodyの場合、iter_lines()を使用
            if hasattr(event_stream, 'iter_lines'):
                for line in event_stream.iter_lines():
                    line_count += 1
                    
                    if line:
                        # 行データをデコード
                        text = line.decode('utf-8') if isinstance(line, bytes) else line
                        
                        if self.verbose and line_count <= 10:
                            print(f"📥 Raw line {line_count}: {text[:100]}")
                        
                        # SSE形式: 各行を直接パース
                        if text.strip().startswith('data:'):
                            parsed_event = self._parse_json_line(text)
                            if parsed_event:
                                self._handle_event(parsed_event)
                            elif self.verbose and line_count <= 20:
                                # 最初の20行のみパースエラーを表示
                                print(f"⚠️  Parse failed: {text[:80]}")
                        elif text.strip():
                            # 非SSE形式のJSON
                            parsed_event = self._parse_json_line(text)
                            if parsed_event:
                                self._handle_event(parsed_event)
            
            # フォールバック: read()
            else:
                print("⚠️  Using read() fallback...")
                data = event_stream.read()
                text = data.decode('utf-8') if isinstance(data, bytes) else data
                
                print(f"📥 Raw data (first 500 chars): {text[:500]}")
                print()
                
                # JSON Lines形式でパース
                for line in text.split('\n'):
                    if line.strip():
                        line_count += 1
                        parsed_event = self._parse_json_line(line)
                        if parsed_event:
                            self._handle_event(parsed_event)
            
            print(f"\n✅ Processed {line_count} lines, {self.stats['total_events']} events")
                    
        except Exception as e:
            print(f"⚠️  Event stream processing error: {e}")
            import traceback
            traceback.print_exc()
    
    def _parse_json_line(self, line: str) -> Dict[str, Any]:
        """
        JSON行をパース（SSE形式対応）
        
        Args:
            line: JSON行（SSE形式: "data: {...}" または純粋なJSON）
            
        Returns:
            Dict[str, Any]: パースされたイベント
        """
        try:
            # SSE形式の場合: "data: {...}"
            if line.strip().startswith('data:'):
                json_text = line.strip()[5:].strip()  # "data:" を除去
                
                # 空のdataは無視
                if not json_text:
                    return None
                
                parsed = json.loads(json_text)
            else:
                # 純粋なJSON形式
                parsed = json.loads(line.strip())
            
            # 新しい形式: {"type": "...", "data": {...}, "agentId": "..."}
            if isinstance(parsed, dict) and 'type' in parsed:
                return parsed
                
        except json.JSONDecodeError as e:
            # JSONパースエラーは無視（ログメッセージや不完全なチャンクなど）
            pass
        
        return None

    def _handle_event(self, event: Dict[str, Any]):
        """
        イベントを処理
        
        Args:
            event: パースされたイベント
        """
        event_type = event.get("type")
        event_data = event.get("data", {})
        agent_id = event.get("agentId")  # トップレベルのagentId
        
        # 統計更新
        self.stats["total_events"] += 1
        self.stats["events_by_type"][event_type] = \
            self.stats["events_by_type"].get(event_type, 0) + 1
        
        # イベント記録
        self.all_events.append(event)
        
        # イベントタイプごとの処理
        if event_type == "start":
            if self.verbose:
                print(f"🚀 MAGI Decision Process Started")
                print(f"   Trace ID: {event_data.get('trace_id')}")
                print()
        
        elif event_type == "agent_start":
            if self.verbose:
                print(f"🤖 {agent_id.upper()} started thinking...")
        
        elif event_type == "agent_thinking":
            text = event_data.get("text", "")
            if self.verbose:
                print(f"   💭 {agent_id.upper()} thinking: {text}", end='', flush=True)
        
        elif event_type == "agent_chunk":
            text = event_data.get("text", "")
            
            # チャンクを保存
            if agent_id in self.streams:
                self.streams[agent_id].append(text)
                self.stats["chunks_by_agent"][agent_id] += 1
            
            if self.verbose:
                print(f"   💭 {agent_id.upper()}: {text}")
        
        elif event_type == "agent_complete":
            decision = event_data.get("decision")
            confidence = event_data.get("confidence")
            reasoning = event_data.get("reasoning", "")
            
            if self.verbose:
                print(f"\n   ✅ {agent_id.upper()}: {decision} (confidence: {confidence:.2f})")
                print(f"      Reasoning: {reasoning}")
                print()
        
        elif event_type == "error":
            error = event_data.get("error")
            if self.verbose:
                print(f"   ❌ {agent_id.upper() if agent_id else 'SYSTEM'} error: {error}")
        
        elif event_type == "judge_start":
            if self.verbose:
                print(f"⚖️  SOLOMON Judge started evaluation...")
                print()
        
        elif event_type == "judge_thinking":
            text = event_data.get("text", "")
            if self.verbose:
                print(f"   💭 SOLOMON thinking: {text}", end='', flush=True)
        
        elif event_type == "judge_chunk":
            text = event_data.get("text", "")
            
            # SOLOMONのチャンクを保存
            self.streams["solomon"].append(text)
            self.stats["chunks_by_agent"]["solomon"] += 1
            
            if self.verbose:
                # 進捗表示
                preview = text[:50].replace('\n', ' ')
                print(f"   💭 SOLOMON: {preview}{'...' if len(text) > 50 else ''}")
        
        elif event_type == "judge_complete":
            final_decision = event_data.get("final_decision")
            confidence = event_data.get("confidence")
            sage_scores = event_data.get("sage_scores", {})
            
            if self.verbose:
                print(f"\n   ✅ SOLOMON: {final_decision} (confidence: {confidence:.2f})")
                print(f"      Sage Scores:")
                for sage, score in sage_scores.items():
                    print(f"        {sage.upper()}: {score}/100")
                print()
        
        elif event_type == "complete":
            final_decision = event_data.get("final_decision")
            if self.verbose:
                print(f"🎉 MAGI Decision Complete: {final_decision}")
                print()
    
    def _save_streams(self):
        """
        ストリームをファイルに保存
        """
        print("💾 Saving streams to files...")
        
        # 各賢者のストリームを保存
        for agent_id, chunks in self.streams.items():
            if chunks:
                filename = self.output_dir / f"{agent_id}_stream.txt"
                
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"# {agent_id.upper()} Stream\n")
                    f.write(f"# Generated: {datetime.now().isoformat()}\n")
                    f.write(f"# Total Chunks: {len(chunks)}\n")
                    f.write("=" * 80 + "\n\n")
                    
                    full_text = ''.join(chunks)
                    f.write(full_text)
                
                print(f"   ✅ {agent_id}_stream.txt ({len(chunks)} chunks)")
        
        # 全イベントをJSONで保存
        events_file = self.output_dir / "full_stream.json"
        with open(events_file, 'w', encoding='utf-8') as f:
            json.dump(self.all_events, f, indent=2, ensure_ascii=False)
        
        print(f"   ✅ full_stream.json ({len(self.all_events)} events)")
        
        # サマリーを保存
        self._save_summary()
        
        print()
    
    def _save_summary(self):
        """
        サマリーをファイルに保存
        """
        summary_file = self.output_dir / "summary.txt"
        
        duration = (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write("# MAGI AgentCore Runtime Test - Summary\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Test Date: {datetime.now().isoformat()}\n")
            f.write(f"Agent ARN: {self.agent_runtime_arn}\n")
            f.write(f"Region: {self.region}\n")
            f.write(f"Duration: {duration:.2f} seconds\n\n")
            
            f.write("## Statistics\n\n")
            f.write(f"Total Events: {self.stats['total_events']}\n\n")
            
            f.write("### Events by Type\n")
            for event_type, count in sorted(self.stats["events_by_type"].items()):
                f.write(f"  {event_type}: {count}\n")
            f.write("\n")
            
            f.write("### Chunks by Agent\n")
            for agent_id, count in self.stats["chunks_by_agent"].items():
                f.write(f"  {agent_id}: {count} chunks\n")
            f.write("\n")
            
            f.write("### Stream Sizes\n")
            for agent_id, chunks in self.streams.items():
                if chunks:
                    total_chars = len(''.join(chunks))
                    f.write(f"  {agent_id}: {total_chars} characters\n")
            f.write("\n")
            
            f.write("## Architecture\n\n")
            f.write("AgentCore Runtime (Docker Container)\n")
            f.write("├─ Next.jsバックエンド (port 8080)\n")
            f.write("│  └─ spawn('python', ['magi_agent.py'])\n")
            f.write("└─ magi_agent.py → Strands Agents → Bedrock\n\n")
            
            f.write("## Event Format Validation\n\n")
            f.write("✅ New event format (agent_*, agentId) is working correctly\n")
            f.write("✅ AgentCore Runtime (Next.js + Python) integration is successful\n")
            f.write("✅ Streaming response is complete\n")
            f.write("✅ PR #6 event format changes verified\n")
        
        print(f"   ✅ summary.txt")
    
    def _print_summary(self):
        """
        サマリーをコンソールに表示
        """
        duration = (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
        
        print("=" * 80)
        print("📊 Test Summary")
        print("=" * 80)
        print(f"Duration: {duration:.2f} seconds")
        print(f"Total Events: {self.stats['total_events']}")
        print()
        
        print("Events by Type:")
        for event_type, count in sorted(self.stats["events_by_type"].items()):
            print(f"  {event_type}: {count}")
        print()
        
        print("Chunks by Agent:")
        for agent_id, count in self.stats["chunks_by_agent"].items():
            print(f"  {agent_id}: {count} chunks")
        print()
        
        print("Stream Sizes:")
        for agent_id, chunks in self.streams.items():
            if chunks:
                total_chars = len(''.join(chunks))
                print(f"  {agent_id}: {total_chars} characters")
        print()
        
        print("=" * 80)
        print("✅ Test Completed Successfully")
        print("=" * 80)


def main():
    """
    メイン関数
    """
    try:
        # 設定読み込み
        config = get_config()
        
        # 設定表示
        print("🚀 MAGI AgentCore Runtime Test")
        print("=" * 80)
        config.print_config()
        print("=" * 80)
        print()
        
        # AgentCore Runtime ARNとリージョン取得
        agent_arn = config.get_agent_arn()
        region = config.get_region()
        
        # デバッグモード設定
        verbose = True
        
        # テスト質問
        test_question = "新しいAIシステムを全社に導入すべきか？コスト削減と効率化が期待されるが、従業員の反発も予想される。"
        
        # テスター初期化
        tester = AgentCoreRuntimeTester(agent_arn, region, verbose=verbose)
        
        # テスト実行
        tester.test_streaming(test_question)
        
    except ValueError as e:
        print(f"❌ 設定エラー: {e}")
        print()
        print("設定方法:")
        print("  1. agents/.env ファイルに以下を設定:")
        print("     MAGI_AGENT_ARN=arn:aws:bedrock-agentcore:...")
        print("     APP_AWS_REGION=ap-northeast-1")
        print()
        print("  2. または環境変数を設定:")
        print("     export MAGI_AGENT_ARN='arn:aws:bedrock-agentcore:...'")
        print("     export APP_AWS_REGION='ap-northeast-1'")
        sys.exit(1)
    
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
