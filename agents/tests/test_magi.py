#!/usr/bin/env python3
"""
MAGIストリーミング分類テスト

AgentCore Runtimeのストリーミングレスポンスを受信し、
各賢者とSOLOMON Judgeのストリームを個別のファイルに保存します。

実行方法:
    cd agents/tests
    python test_streaming_classification.py

出力ファイル:
    - streaming_output/caspar_stream.txt
    - streaming_output/balthasar_stream.txt
    - streaming_output/melchior_stream.txt
    - streaming_output/solomon_stream.txt
    - streaming_output/full_stream.json (全イベント)
    - streaming_output/summary.txt (サマリー)
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

# 親ディレクトリをパスに追加（shared モジュールをインポートするため）
sys.path.insert(0, str(Path(__file__).parent.parent))

# AWS SDK
import boto3
from botocore.config import Config
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

# HTTPストリーミング用
import requests


class StreamingClassificationTester:
    """
    ストリーミング分類テスター
    
    AgentCore Runtimeからのストリーミングレスポンスを受信し、
    各エージェントごとにファイルに分類して保存します。
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
        self.output_dir = Path("streaming_output")
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
    
    async def test_streaming(self, question: str):
        """
        ストリーミングテストを実行
        
        Args:
            question: テスト質問
        """
        print("=" * 80)
        print("MAGI Streaming Classification Test")
        print("=" * 80)
        print(f"Question: {question}")
        print(f"Agent ARN: {self.agent_runtime_arn}")
        print(f"Output Directory: {self.output_dir.absolute()}")
        print("=" * 80)
        print()
        
        self.stats["start_time"] = datetime.now()
        
        try:
            # AgentCore Runtimeを呼び出し
            print("📡 Invoking AgentCore Runtime...")
            
            payload = json.dumps({"question": question})
            
            # UUIDを使用してセッションIDを生成（最小33文字必要）
            import uuid
            session_id = str(uuid.uuid4())
            
            response = self.client.invoke_agent_runtime(
                agentRuntimeArn=self.agent_runtime_arn,
                runtimeSessionId=session_id,
                payload=payload.encode('utf-8')
            )
            
            print("✅ Connection established, receiving stream...")
            print()
            
            # ストリーミングレスポンスを処理（リアルタイム）
            if 'response' in response:
                event_stream = response['response']
                
                # イベントストリームをリアルタイムで処理
                async for parsed_event in self._process_event_stream(event_stream):
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
    
    async def _process_event_stream(self, event_stream):
        """
        イベントストリームを処理（リアルタイム）
        
        Args:
            event_stream: Boto3のEventStreamオブジェクト
            
        Yields:
            Dict[str, Any]: パースされたイベント
        """
        buffer = ""
        chunk_count = 0
        
        try:
            # EventStreamオブジェクトの実際の型を確認
            stream_type = type(event_stream).__name__
            
            if self.verbose:
                print(f"🔍 Processing stream type: {stream_type}")
                print(f"🔍 Stream methods: {[m for m in dir(event_stream) if not m.startswith('_')]}")
                print()
            
            # StreamingBodyの場合、iter_lines()を使用
            if hasattr(event_stream, 'iter_lines'):
                if self.verbose:
                    print("Using iter_lines() for streaming...")
                    print()
                
                loop = asyncio.get_event_loop()
                
                # iter_lines()を非同期で処理
                for line in event_stream.iter_lines():
                    # 非同期処理を挟む
                    await asyncio.sleep(0)
                    
                    chunk_count += 1
                    
                    if line:
                        # 行データをデコード
                        text = line.decode('utf-8') if isinstance(line, bytes) else line
                        buffer += text + '\n'
                    else:
                        # 空行はイベント区切り
                        if buffer.strip():
                            parsed_event = self._parse_sse_event(buffer)
                            if parsed_event:
                                yield parsed_event
                                await asyncio.sleep(0)
                            buffer = ""
            
            # iter_chunks()を使用（フォールバック）
            elif hasattr(event_stream, 'iter_chunks'):
                if self.verbose:
                    print("Using iter_chunks() for streaming...")
                    print()
                
                for chunk_data in event_stream.iter_chunks(chunk_size=1024):
                    # 非同期処理を挟む
                    await asyncio.sleep(0)
                    
                    chunk_count += 1
                    
                    # チャンクデータをデコード
                    text = chunk_data.decode('utf-8', errors='ignore') if isinstance(chunk_data, bytes) else chunk_data
                    buffer += text
                    
                    # SSEイベントをパース（即座に処理）
                    while '\n\n' in buffer:
                        event_text, buffer = buffer.split('\n\n', 1)
                        
                        parsed_event = self._parse_sse_event(event_text)
                        if parsed_event:
                            yield parsed_event
                            await asyncio.sleep(0)
            
            # イテレータとして処理（最終フォールバック）
            else:
                if self.verbose:
                    print("Using iterator for streaming...")
                    print()
                
                for chunk_data in event_stream:
                    # 非同期処理を挟む
                    await asyncio.sleep(0)
                    
                    chunk_count += 1
                    
                    # チャンクデータを処理
                    if isinstance(chunk_data, dict) and 'chunk' in chunk_data:
                        chunk = chunk_data['chunk']
                        
                        # バイナリデータをデコード
                        if 'bytes' in chunk:
                            text = chunk['bytes'].decode('utf-8', errors='ignore')
                            buffer += text
                            
                            # SSEイベントをパース（即座に処理）
                            while '\n\n' in buffer:
                                event_text, buffer = buffer.split('\n\n', 1)
                                
                                parsed_event = self._parse_sse_event(event_text)
                                if parsed_event:
                                    yield parsed_event
                                    await asyncio.sleep(0)
                    elif isinstance(chunk_data, bytes):
                        # 直接バイトデータの場合
                        text = chunk_data.decode('utf-8', errors='ignore')
                        buffer += text
                        
                        while '\n\n' in buffer:
                            event_text, buffer = buffer.split('\n\n', 1)
                            
                            parsed_event = self._parse_sse_event(event_text)
                            if parsed_event:
                                yield parsed_event
                                await asyncio.sleep(0)
            
            # 残りのバッファを処理
            if buffer.strip():
                parsed_event = self._parse_sse_event(buffer)
                if parsed_event:
                    yield parsed_event
            
            if self.verbose:
                print(f"\n📦 Total chunks processed: {chunk_count}")
                    
        except Exception as e:
            print(f"⚠️  Stream processing error: {e}")
            import traceback
            traceback.print_exc()
            
            # フォールバック: read()メソッドで一括読み込み
            try:
                if self.verbose:
                    print("⚠️  Falling back to read() method...")
                
                data = event_stream.read()
                text = data.decode('utf-8') if isinstance(data, bytes) else data
                
                # SSEイベントをパース
                for event_text in text.split('\n\n'):
                    if event_text.strip():
                        parsed_event = self._parse_sse_event(event_text)
                        if parsed_event:
                            yield parsed_event
                            await asyncio.sleep(0)
            except Exception as fallback_error:
                print(f"⚠️  Fallback also failed: {fallback_error}")
    
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
        
        elif event_type == "sage_start":
            agent_id = event_data.get("agent_id")
            if self.verbose:
                print(f"🤖 {agent_id.upper()} started thinking...")
        
        elif event_type == "sage_thinking":
            agent_id = event_data.get("agent_id")
            chunk = event_data.get("chunk", "")
            
            # 思考プロセスをリアルタイム表示
            if self.verbose:
                print(f"   💭 {agent_id.upper()} thinking: {chunk}", end='', flush=True)
        
        elif event_type == "sage_chunk":
            agent_id = event_data.get("agent_id")
            chunk = event_data.get("chunk", "")
            
            # チャンクを保存
            self.streams[agent_id].append(chunk)
            self.stats["chunks_by_agent"][agent_id] += 1
            
            if self.verbose:
                # リアルタイム表示（全文）
                print(f"   💭 {agent_id.upper()}: {chunk}")
        
        elif event_type == "sage_complete":
            agent_id = event_data.get("agent_id")
            decision = event_data.get("decision")
            confidence = event_data.get("confidence")
            reasoning = event_data.get("reasoning", "")
            
            if self.verbose:
                print(f"\n   ✅ {agent_id.upper()}: {decision} (confidence: {confidence:.2f})")
                print(f"      Reasoning: {reasoning}")
                print()
        
        elif event_type == "sage_error":
            agent_id = event_data.get("agent_id")
            error = event_data.get("error")
            if self.verbose:
                print(f"   ❌ {agent_id.upper()} error: {error}")
                print()
        
        elif event_type == "judge_start":
            if self.verbose:
                print(f"\n⚖️  SOLOMON Judge started evaluation...")
                print()
        
        elif event_type == "judge_thinking":
            chunk = event_data.get("chunk", "")
            
            # 思考プロセスをリアルタイム表示
            if self.verbose:
                print(f"   💭 SOLOMON thinking: {chunk}", end='', flush=True)
        
        elif event_type == "judge_chunk":
            chunk = event_data.get("chunk", "")
            
            # SOLOMONのチャンクを保存
            self.streams["solomon"].append(chunk)
            self.stats["chunks_by_agent"]["solomon"] += 1
            
            # 進捗表示
            preview = chunk[:50].replace('\n', ' ')
            print(f"   💭 SOLOMON: {preview}{'...' if len(chunk) > 50 else ''}")
        
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


async def main():
    """
    メイン関数
    """
    # AgentCore RuntimeのARN（環境変数または直接指定）
    agent_runtime_arn = os.environ.get(
        "MAGI_AGENT_ARN",
        "arn:aws:bedrock-agentcore:ap-northeast-1:262152767881:runtime/magi_agent-4ORNam2cHb"
    )
    
    # テスト質問
    test_question = "新しいAIシステムを全社に導入すべきか？コスト削減と効率化が期待されるが、従業員の反発も予想される。"
    
    # デバッグモード設定（環境変数で制御）
    # verbose=True で3賢者の並列ストリーミングをリアルタイム表示
    verbose = os.environ.get('DEBUG_STREAMING', 'true').lower() == 'true'
    
    # テスター初期化
    tester = StreamingClassificationTester(agent_runtime_arn, verbose=verbose)
    
    # テスト実行
    await tester.test_streaming(test_question)


if __name__ == "__main__":
    # 非同期実行
    asyncio.run(main())
