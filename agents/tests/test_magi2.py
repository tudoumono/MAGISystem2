#!/usr/bin/env python3
"""
MAGIストリーミング分類テスト - Phase 2版（HTTP POST / 参考記事準拠）

🎯 PHASE 2 COMPLETE - WORKING BASELINE ✅
===========================================

✅ 動作確認済み (2025-11-06): 参考記事準拠のNext.js + Python統合パターンが完全動作
✅ テスト結果: 11.96秒、383イベント、3賢者完全動作を確認
✅ 出力ファイル: streaming_output_phase2/ に完全な実行記録を保存

🔄 ROLLBACK POINT: このテストファイルは動作確認済みベースライン
問題が発生した場合は、このテストを実行して動作確認すること

実行方法:
    cd agents/tests
    python test_magi2.py

AgentCore Runtime（Next.js + Python統合版）に直接HTTP POSTリクエストを送信し、
ストリーミングレスポンスを受信して各賢者とSOLOMON Judgeのストリームを保存します。

参考記事準拠のアーキテクチャ:
  Amplify Hosting (Next.js Frontend)
      ↓ useChat() → HTTP POST /invocations
  AgentCore Runtime (Docker Container)
      ├─ Next.jsバックエンド (ポート8080)
      │   ├─ POST /invocations
      │   └─ GET /ping
      └─ Python magi_agent.py (子プロセス)

このテストはフロントエンド統合前の検証用で、出力は streaming_output_phase2/ に保存されます。

実行方法:
    cd agents/tests
    python test_magi2.py

環境変数:
    AGENTCORE_RUNTIME_URL - AgentCore RuntimeのURL（デフォルト: 自動取得）
    DEBUG_STREAMING - デバッグ出力の有効化

出力ファイル:
    - agents/tests/streaming_output_phase2/caspar_stream.txt
    - agents/tests/streaming_output_phase2/balthasar_stream.txt
    - agents/tests/streaming_output_phase2/melchior_stream.txt
    - agents/tests/streaming_output_phase2/solomon_stream.txt
    - agents/tests/streaming_output_phase2/full_stream.json (全イベント)
    - agents/tests/streaming_output_phase2/full_response_ordered.txt (順序付き全レスポンス)
    - agents/tests/streaming_output_phase2/summary.txt (サマリー)
"""

import asyncio
import json
import os
import sys
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

# HTTPストリーミング用
import requests
from requests_aws4auth import AWS4Auth

# AWS認証情報取得用
import boto3


class StreamingClassificationTester:
    """
    ストリーミング分類テスター - HTTP POST版
    
    AgentCore RuntimeにHTTP POSTリクエストを送信し、
    ストリーミングレスポンスを受信して各エージェントごとにファイルに分類して保存します。
    """
    
    def __init__(self, agent_arn: str = None, region: str = "ap-northeast-1", verbose: bool = True):
        """
        初期化
        
        Args:
            agent_arn: AgentCore RuntimeのARN（環境変数から自動取得可能）
            region: AWSリージョン
            verbose: リアルタイムコンソール表示を有効にする
        """
        self.agent_arn = agent_arn or os.environ.get('MAGI_AGENT_ARN')
        self.region = region
        self.verbose = verbose
        
        if not self.agent_arn:
            raise ValueError("MAGI_AGENT_ARN environment variable is required")
        
        # AgentCore RuntimeのURLを構築（参考記事準拠）
        self.runtime_url = self._build_runtime_url()
        
        # AWS認証情報取得
        session = boto3.Session()
        credentials = session.get_credentials()
        
        # AWS4Auth設定
        self.auth = AWS4Auth(
            credentials.access_key,
            credentials.secret_key,
            self.region,
            'bedrock-agentcore',
            session_token=credentials.token
        )
        
        # 出力ディレクトリ（Phase 2専用）
        self.output_dir = Path(__file__).parent / "streaming_output_phase2"
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
    
    def _build_runtime_url(self) -> str:
        """
        AgentCore RuntimeのURLを構築（参考記事準拠）
        
        Returns:
            str: AgentCore RuntimeのURL
        """
        # ARNをURLエンコード
        escaped_arn = urllib.parse.quote(self.agent_arn, safe='')
        
        # 参考記事準拠のURL構築
        url = f"https://bedrock-agentcore.{self.region}.amazonaws.com/runtimes/{escaped_arn}/invocations"
        
        if self.verbose:
            print(f"🔗 Runtime URL: {url}")
        
        return url
    

    
    def test_streaming(self, question: str):
        """
        ストリーミングテストを実行（HTTP POST版）
        
        Args:
            question: テスト質問
        """
        print("=" * 80)
        print("MAGI Streaming Classification Test - HTTP POST版")
        print("=" * 80)
        print(f"Question: {question}")
        print(f"Runtime URL: {self.runtime_url}")
        print(f"Output Directory: {self.output_dir.absolute()}")
        print("=" * 80)
        print()
        
        self.stats["start_time"] = datetime.now()
        
        try:
            # AgentCore RuntimeにHTTP POSTリクエストを送信
            print("📡 Sending HTTP POST to AgentCore Runtime...")
            
            payload = {"question": question}
            payload_json = json.dumps(payload)
            
            # セッションID生成（33文字以上必要）
            import uuid
            session_id = f"session-{int(datetime.now().timestamp())}-{uuid.uuid4().hex}"
            
            # リクエストヘッダー準備
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': session_id,
                'X-Amzn-Trace-Id': f"trace-{int(datetime.now().timestamp())}"
            }
            
            if self.verbose:
                print(f"📝 Session ID: {session_id}")
                print(f"🔐 Using AWS4Auth for SigV4 signing")
                print()
            
            # requestsライブラリでストリーミングリクエスト
            response = requests.post(
                self.runtime_url,
                data=payload_json,
                headers=headers,
                auth=self.auth,
                stream=True,
                timeout=300
            )
            
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
            
            print("✅ Connection established, receiving stream...")
            print()
            
            # Server-Sent Eventsストリームを処理
            for parsed_event in self._process_sse_stream(response):
                self._handle_event(parsed_event)
            
            self.stats["end_time"] = datetime.now()
            
            # ファイルに保存
            self._save_streams()
            
            # サマリーを表示
            self._print_summary()
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
    
    def _process_sse_stream(self, response):
        """
        Server-Sent Eventsストリームを処理（HTTP版）
        
        Args:
            response: requests.Responseオブジェクト
            
        Yields:
            Dict[str, Any]: パースされたイベント
        """
        buffer = ""
        chunk_count = 0
        
        try:
            if self.verbose:
                print("🔍 Processing Server-Sent Events stream...")
                print()
            
            # ストリーミングレスポンスを行ごとに処理
            for line in response.iter_lines(decode_unicode=True):
                chunk_count += 1
                
                if line:
                    buffer += line + '\n'
                else:
                    # 空行はイベント区切り
                    if buffer.strip():
                        parsed_event = self._parse_sse_event(buffer)
                        if parsed_event:
                            yield parsed_event
                        buffer = ""
            
            # 残りのバッファを処理
            if buffer.strip():
                parsed_event = self._parse_sse_event(buffer)
                if parsed_event:
                    yield parsed_event
            
            if self.verbose:
                print(f"\n📦 Total chunks processed: {chunk_count}")
                    
        except Exception as e:
            print(f"⚠️  SSE stream processing error: {e}")
            import traceback
            traceback.print_exc()
    
    def _parse_sse_event(self, event_text: str) -> Dict[str, Any]:
        """
        SSEイベントをパース
        
        Args:
            event_text: SSEイベントテキスト
            
        Returns:
            Dict[str, Any]: パースされたイベント
        """
        lines = event_text.strip().split('\n')
        
        for line in lines:
            if line.startswith('data:'):
                data_text = line[5:].strip()
                try:
                    parsed = json.loads(data_text)
                    # 新しい形式: {"type": "...", "data": {...}}
                    if isinstance(parsed, dict) and 'type' in parsed and 'data' in parsed:
                        return {
                            "type": parsed['type'],
                            "data": parsed['data'],
                            "timestamp": datetime.now().isoformat()
                        }
                    # 古い形式（互換性のため）
                    return {
                        "type": "unknown",
                        "data": parsed,
                        "timestamp": datetime.now().isoformat()
                    }
                except json.JSONDecodeError:
                    pass
        
        return None
    
    def _handle_event(self, event: Dict[str, Any]):
        """
        イベントを処理
        
        Args:
            event: イベントデータ
        """
        self.stats["total_events"] += 1
        
        event_type = event.get("type")
        event_data = event.get("data", {})
        
        # イベントタイプ統計
        self.stats["events_by_type"][event_type] = \
            self.stats["events_by_type"].get(event_type, 0) + 1
        
        # 全イベントを記録
        self.all_events.append(event)
        
        # イベントタイプごとの処理
        if event_type == "start":
            if self.verbose:
                print(f"🚀 MAGI Decision Process Started")
                print(f"   Trace ID: {event_data.get('trace_id')}")
                print()
        
        elif event_type == "agent_start":
            agent_id = event.get("agentId")
            if self.verbose:
                print(f"🤖 {agent_id.upper()} started thinking...")

        elif event_type == "agent_thinking":
            agent_id = event.get("agentId")
            text = event_data.get("text", "")

            # 思考プロセスをリアルタイム表示
            if self.verbose:
                print(f"   💭 {agent_id.upper()} thinking: {text}", end='', flush=True)

        elif event_type == "agent_chunk":
            agent_id = event.get("agentId")
            text = event_data.get("text", "")

            # チャンクを保存
            self.streams[agent_id].append(text)
            self.stats["chunks_by_agent"][agent_id] += 1

            if self.verbose:
                # リアルタイム表示（全文）
                print(f"   💭 {agent_id.upper()}: {text}")

        elif event_type == "agent_complete":
            agent_id = event.get("agentId")
            decision = event_data.get("decision")
            confidence = event_data.get("confidence")
            reasoning = event_data.get("reasoning", "")

            if self.verbose:
                print(f"\n   ✅ {agent_id.upper()}: {decision} (confidence: {confidence:.2f})")
                print(f"      Reasoning: {reasoning}")
                print()

        elif event_type == "error":
            agent_id = event.get("agentId")
            error = event_data.get("error")
            if self.verbose:
                print(f"   ❌ {agent_id.upper()} error: {error}")
                print()
        
        elif event_type == "judge_start":
            if self.verbose:
                print(f"\n⚖️  SOLOMON Judge started evaluation...")
                print()
        
        elif event_type == "judge_thinking":
            text = event_data.get("text", "")

            # 思考プロセスをリアルタイム表示
            if self.verbose:
                print(f"   💭 SOLOMON thinking: {text}", end='', flush=True)

        elif event_type == "judge_chunk":
            text = event_data.get("text", "")

            # SOLOMONのチャンクを保存
            self.streams["solomon"].append(text)
            self.stats["chunks_by_agent"]["solomon"] += 1

            # 進捗表示
            preview = text[:50].replace('\n', ' ')
            print(f"   💭 SOLOMON: {preview}{'...' if len(text) > 50 else ''}")
        
        elif event_type == "judge_complete":
            final_decision = event_data.get("final_decision")
            confidence = event_data.get("confidence")
            execution_time = event_data.get("execution_time")
            
            print(f"   ✅ SOLOMON: {final_decision} (confidence: {confidence:.2f}, {execution_time}ms)")
            print()
        
        elif event_type == "complete":
            final_decision = event_data.get("final_decision")
            voting_result = event_data.get("voting_result", {})
            total_time = event_data.get("total_execution_time")
            
            print(f"🎉 MAGI Decision Complete!")
            print(f"   Final Decision: {final_decision}")
            print(f"   Voting: {voting_result.get('approved')}可決 / {voting_result.get('rejected')}否決")
            print(f"   Total Time: {total_time}ms")
            print()
        
        elif event_type == "error":
            error = event_data.get("error")
            print(f"❌ Error: {error}")
            print()
    
    def _save_streams(self):
        """
        ストリームをファイルに保存
        """
        print("=" * 80)
        print("💾 Saving streams to files...")
        print("=" * 80)
        
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
                
                print(f"✅ Saved {agent_id}_stream.txt ({len(chunks)} chunks, {len(full_text)} chars)")
        
        # 全イベントをJSONで保存
        events_file = self.output_dir / "full_stream.json"
        with open(events_file, 'w', encoding='utf-8') as f:
            json.dump(self.all_events, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved full_stream.json ({len(self.all_events)} events)")
        
        # 帰ってきた順番でのフルレスポンスをテキスト形式で保存
        full_response_file = self.output_dir / "full_response_ordered.txt"
        with open(full_response_file, 'w', encoding='utf-8') as f:
            f.write("# Full Response (Ordered by Arrival Time)\n")
            f.write(f"# Generated: {datetime.now().isoformat()}\n")
            f.write("=" * 80 + "\n\n")
            
            for i, event in enumerate(self.all_events, 1):
                f.write(f"[Event {i}] {event.get('timestamp')}\n")
                f.write(f"Type: {event.get('type')}\n")
                f.write(f"Data: {json.dumps(event.get('data', {}), ensure_ascii=False, indent=2)}\n")
                f.write("-" * 80 + "\n\n")
        
        print(f"✅ Saved full_response_ordered.txt ({len(self.all_events)} events)")
        
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
            f.write("# MAGI Streaming Classification Test Summary\n")
            f.write("=" * 80 + "\n\n")
            
            f.write(f"Test Time: {self.stats['start_time'].isoformat()}\n")
            f.write(f"Duration: {duration:.2f} seconds\n")
            f.write(f"Total Events: {self.stats['total_events']}\n\n")
            
            f.write("## Events by Type\n")
            for event_type, count in sorted(self.stats["events_by_type"].items()):
                f.write(f"  {event_type}: {count}\n")
            f.write("\n")
            
            f.write("## Chunks by Agent\n")
            for agent_id, count in self.stats["chunks_by_agent"].items():
                f.write(f"  {agent_id}: {count} chunks\n")
            f.write("\n")
            
            f.write("## Stream Sizes\n")
            for agent_id, chunks in self.streams.items():
                if chunks:
                    total_chars = len(''.join(chunks))
                    f.write(f"  {agent_id}: {total_chars} characters\n")
            f.write("\n")
            
            f.write("## Files Generated\n")
            for agent_id in self.streams.keys():
                if self.streams[agent_id]:
                    f.write(f"  - {agent_id}_stream.txt\n")
            f.write(f"  - full_stream.json\n")
            f.write(f"  - summary.txt\n")
        
        print(f"✅ Saved summary.txt")
    
    def _print_summary(self):
        """
        サマリーを表示
        """
        print("=" * 80)
        print("📊 Test Summary")
        print("=" * 80)
        
        duration = (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
        
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
        
        print(f"Output Directory: {self.output_dir.absolute()}")
        print("=" * 80)


def main():
    """
    メイン関数
    """
    # AgentCore RuntimeのARN（環境変数から取得）
    # 設定読み込み
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).parent.parent))
    from shared.config import get_config
    
    config = get_config()
    agent_arn = config.get_agent_arn()
    
    # AWSリージョン
    region = os.environ.get('AWS_REGION', 'ap-northeast-1')
    
    # テスト質問
    test_question = "新しいAIシステムを全社に導入すべきか？コスト削減と効率化が期待されるが、従業員の反発も予想される。"
    
    # デバッグモード設定（環境変数で制御）
    # verbose=True で3賢者の並列ストリーミングをリアルタイム表示
    verbose = os.environ.get('DEBUG_STREAMING', 'true').lower() == 'true'
    
    # テスター初期化
    tester = StreamingClassificationTester(agent_arn, region, verbose=verbose)
    
    # テスト実行
    tester.test_streaming(test_question)


if __name__ == "__main__":
    main()
