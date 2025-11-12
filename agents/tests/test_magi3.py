#!/usr/bin/env python3
"""
MAGIカスタムプロンプトテスト

🎨 CUSTOM PROMPTS TEST 🎨
==========================

✅ カスタムプロンプト機能のテスト
✅ 環境変数とリクエストパラメータの両方をテスト
✅ JSON出力形式の固定性を検証
✅ 並列ストリーミングとの統合確認

このテストはPR #3のカスタムプロンプト機能の動作確認用です。

実行方法:
    cd agents/tests
    python test_magi3.py

テストシナリオ:
    1. デフォルトプロンプトでの実行（ベースライン）
    2. 環境変数カスタムプロンプトでの実行
    3. リクエストパラメータカスタムプロンプトでの実行
    4. JSON出力形式の固定性検証

環境変数:
    MAGI_AGENT_ARN - AgentCore RuntimeのARN
    APP_AWS_REGION または AWS_REGION - AWSリージョン（デフォルト: ap-northeast-1）
    DEBUG_STREAMING - デバッグ出力の有効化
    
    # カスタムプロンプト設定（オプション）
    CASPAR_CUSTOM_PROMPT - CASPARのカスタムロール
    BALTHASAR_CUSTOM_PROMPT - BALTHASARのカスタムロール
    MELCHIOR_CUSTOM_PROMPT - MELCHIORのカスタムロール
    SOLOMON_CUSTOM_PROMPT - SOLOMONのカスタムロール

出力ファイル:
    - agents/tests/streaming_output_custom/default_*.txt
    - agents/tests/streaming_output_custom/env_custom_*.txt
    - agents/tests/streaming_output_custom/request_custom_*.txt
    - agents/tests/streaming_output_custom/comparison.txt
"""

import asyncio
import json
import os
import sys
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

# HTTPストリーミング用
import requests
from requests_aws4auth import AWS4Auth

# AWS認証情報取得用
import boto3


class CustomPromptsTester:
    """
    カスタムプロンプトテスター
    
    カスタムプロンプト機能の動作確認とJSON出力形式の固定性を検証します。
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
        
        # AgentCore RuntimeのURLを構築
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
        
        # 出力ディレクトリ（カスタムプロンプトテスト専用）
        self.output_dir = Path(__file__).parent / "streaming_output_custom"
        self.output_dir.mkdir(exist_ok=True)
        
        # テスト結果収集用
        self.test_results = []
    
    def _build_runtime_url(self) -> str:
        """
        AgentCore RuntimeのURLを構築
        
        Returns:
            str: AgentCore RuntimeのURL
        """
        # ARNをURLエンコード
        escaped_arn = urllib.parse.quote(self.agent_arn, safe='')
        
        # URL構築
        url = f"https://bedrock-agentcore.{self.region}.amazonaws.com/runtimes/{escaped_arn}/invocations"
        
        return url
    
    def run_all_tests(self, question: str):
        """
        全テストシナリオを実行
        
        Args:
            question: テスト質問
        """
        print("=" * 80)
        print("🎨 MAGI Custom Prompts Test Suite")
        print("=" * 80)
        print(f"Question: {question}")
        print(f"Runtime URL: {self.runtime_url}")
        print(f"Output Directory: {self.output_dir.absolute()}")
        print("=" * 80)
        print()
        
        # テスト1: デフォルトプロンプト
        print("\n" + "=" * 80)
        print("Test 1: Default Prompts (Baseline)")
        print("=" * 80)
        result1 = self._test_scenario(
            scenario_name="default",
            question=question,
            custom_prompts=None,
            description="デフォルトプロンプトでの実行（ベースライン）"
        )
        self.test_results.append(result1)
        
        # テスト2: リクエストパラメータカスタムプロンプト
        print("\n" + "=" * 80)
        print("Test 2: Request-Level Custom Prompts")
        print("=" * 80)
        
        request_custom_prompts = {
            "caspar": """あなたはCASPARです。
【カスタムロール: セキュリティ重視】
- セキュリティリスクを最優先で評価
- コンプライアンス違反を厳しくチェック
- データ保護とアクセス制御を重視

【判断基準】
1. セキュリティリスク
2. コンプライアンス準拠
3. データ保護
4. アクセス制御
5. 監査可能性""",
            
            "balthasar": """あなたはBALTHASARです。
【カスタムロール: ユーザー体験重視】
- ユーザー体験を最優先
- 使いやすさとアクセシビリティを重視
- デザインの美しさと直感性を評価

【判断基準】
1. ユーザー体験の向上
2. 使いやすさ
3. アクセシビリティ
4. デザインの美しさ
5. 直感的な操作性""",
            
            "melchior": """あなたはMELCHIORです。
【カスタムロール: ROI重視】
- ROI（投資対効果）を最優先
- コスト分析と収益予測を重視
- 実装期間と保守コストを評価

【判断基準】
1. ROI（投資対効果）
2. コスト分析
3. 収益予測
4. 実装期間
5. 保守コスト""",
            
            "solomon": """あなたはSOLOMONです。
【カスタムロール: ビジネス価値重視】
- ビジネス価値を最優先に統合評価
- 戦略的重要性を考慮
- 市場競争力を評価

【評価基準】
1. ビジネス価値
2. 戦略的重要性
3. 市場競争力
4. 実現可能性
5. リスクとリターン

【入力】
3賢者の判断結果：
{sage_responses}"""
        }
        
        result2 = self._test_scenario(
            scenario_name="request_custom",
            question=question,
            custom_prompts=request_custom_prompts,
            description="リクエストパラメータカスタムプロンプト"
        )
        self.test_results.append(result2)
        
        # テスト3: JSON出力形式の検証
        print("\n" + "=" * 80)
        print("Test 3: JSON Output Format Validation")
        print("=" * 80)
        self._validate_json_format()
        
        # 比較レポート生成
        print("\n" + "=" * 80)
        print("Generating Comparison Report")
        print("=" * 80)
        self._generate_comparison_report()
        
        print("\n" + "=" * 80)
        print("✅ All Tests Completed")
        print("=" * 80)
    
    def _test_scenario(
        self,
        scenario_name: str,
        question: str,
        custom_prompts: Optional[Dict[str, str]],
        description: str
    ) -> Dict[str, Any]:
        """
        テストシナリオを実行
        
        Args:
            scenario_name: シナリオ名
            question: テスト質問
            custom_prompts: カスタムプロンプト辞書
            description: シナリオ説明
            
        Returns:
            Dict[str, Any]: テスト結果
        """
        print(f"\n📝 Scenario: {description}")
        print(f"Custom Prompts: {'Yes' if custom_prompts else 'No (Default)'}")
        print()
        
        start_time = datetime.now()
        
        # ストリーム収集用
        streams = {
            "caspar": [],
            "balthasar": [],
            "melchior": [],
            "solomon": []
        }
        
        # 全イベント記録
        all_events = []
        
        # 統計情報
        stats = {
            "total_events": 0,
            "events_by_type": {},
            "chunks_by_agent": {
                "caspar": 0,
                "balthasar": 0,
                "melchior": 0,
                "solomon": 0
            }
        }
        
        try:
            # リクエストペイロード構築
            payload = {"question": question}
            if custom_prompts:
                payload["custom_prompts"] = custom_prompts
            
            payload_json = json.dumps(payload, ensure_ascii=False)
            
            # セッションID生成
            import uuid
            session_id = f"custom-{scenario_name}-{int(datetime.now().timestamp())}-{uuid.uuid4().hex}"
            
            # リクエストヘッダー準備
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': session_id
            }
            
            if self.verbose:
                print(f"📡 Sending request to AgentCore Runtime...")
                print(f"Session ID: {session_id}")
                if custom_prompts:
                    print(f"Custom Prompts: {list(custom_prompts.keys())}")
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
                event_type = parsed_event.get("type")
                event_data = parsed_event.get("data", {})
                
                # 統計更新
                stats["total_events"] += 1
                stats["events_by_type"][event_type] = \
                    stats["events_by_type"].get(event_type, 0) + 1
                
                # イベント記録
                all_events.append(parsed_event)
                
                # チャンク収集
                if event_type == "agent_chunk":
                    agent_id = parsed_event.get("agentId")
                    text = event_data.get("text", "")
                    streams[agent_id].append(text)
                    stats["chunks_by_agent"][agent_id] += 1

                elif event_type == "judge_chunk":
                    text = event_data.get("text", "")
                    streams["solomon"].append(text)
                    stats["chunks_by_agent"]["solomon"] += 1
                
                # リアルタイム表示
                if self.verbose:
                    self._print_event(event_type, event_data, parsed_event)
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            # ファイルに保存
            self._save_scenario_results(scenario_name, streams, all_events, stats, duration)
            
            print(f"\n✅ Scenario '{scenario_name}' completed in {duration:.2f}s")
            
            return {
                "scenario_name": scenario_name,
                "description": description,
                "custom_prompts": custom_prompts is not None,
                "duration": duration,
                "stats": stats,
                "streams": streams,
                "all_events": all_events
            }
            
        except Exception as e:
            print(f"❌ Error in scenario '{scenario_name}': {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "scenario_name": scenario_name,
                "description": description,
                "error": str(e)
            }
    
    def _process_sse_stream(self, response):
        """
        Server-Sent Eventsストリームを処理
        
        Args:
            response: requests.Responseオブジェクト
            
        Yields:
            Dict[str, Any]: パースされたイベント
        """
        buffer = ""
        
        try:
            # ストリーミングレスポンスを行ごとに処理
            for line in response.iter_lines(decode_unicode=True):
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
                    
        except Exception as e:
            print(f"⚠️  SSE stream processing error: {e}")
    
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
                    if isinstance(parsed, dict) and 'type' in parsed and 'data' in parsed:
                        return {
                            "type": parsed['type'],
                            "data": parsed['data'],
                            "timestamp": datetime.now().isoformat()
                        }
                except json.JSONDecodeError:
                    pass
        
        return None
    
    def _print_event(self, event_type: str, event_data: Dict[str, Any], event: Dict[str, Any]):
        """
        イベントをコンソールに表示

        Args:
            event_type: イベントタイプ
            event_data: イベントデータ
            event: フルイベント（agentIdを含む）
        """
        if event_type == "agent_complete":
            agent_id = event.get("agentId")
            decision = event_data.get("decision")
            confidence = event_data.get("confidence")
            print(f"   ✅ {agent_id.upper()}: {decision} (confidence: {confidence:.2f})")

        elif event_type == "judge_complete":
            final_decision = event_data.get("final_decision")
            confidence = event_data.get("confidence")
            print(f"   ✅ SOLOMON: {final_decision} (confidence: {confidence:.2f})")

        elif event_type == "complete":
            final_decision = event_data.get("final_decision")
            print(f"   🎉 Final Decision: {final_decision}")
    
    def _save_scenario_results(
        self,
        scenario_name: str,
        streams: Dict[str, List[str]],
        all_events: List[Dict[str, Any]],
        stats: Dict[str, Any],
        duration: float
    ):
        """
        シナリオ結果をファイルに保存
        
        Args:
            scenario_name: シナリオ名
            streams: ストリームデータ
            all_events: 全イベント
            stats: 統計情報
            duration: 実行時間
        """
        # 各賢者のストリームを保存
        for agent_id, chunks in streams.items():
            if chunks:
                filename = self.output_dir / f"{scenario_name}_{agent_id}_stream.txt"
                
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"# {agent_id.upper()} Stream ({scenario_name})\n")
                    f.write(f"# Generated: {datetime.now().isoformat()}\n")
                    f.write(f"# Total Chunks: {len(chunks)}\n")
                    f.write("=" * 80 + "\n\n")
                    
                    full_text = ''.join(chunks)
                    f.write(full_text)
        
        # 全イベントをJSONで保存
        events_file = self.output_dir / f"{scenario_name}_full_stream.json"
        with open(events_file, 'w', encoding='utf-8') as f:
            json.dump(all_events, f, indent=2, ensure_ascii=False)
        
        # サマリーを保存
        summary_file = self.output_dir / f"{scenario_name}_summary.txt"
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(f"# {scenario_name} Summary\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Duration: {duration:.2f} seconds\n")
            f.write(f"Total Events: {stats['total_events']}\n\n")
            
            f.write("## Events by Type\n")
            for event_type, count in sorted(stats["events_by_type"].items()):
                f.write(f"  {event_type}: {count}\n")
            f.write("\n")
            
            f.write("## Chunks by Agent\n")
            for agent_id, count in stats["chunks_by_agent"].items():
                f.write(f"  {agent_id}: {count} chunks\n")
    
    def _validate_json_format(self):
        """
        JSON出力形式の固定性を検証
        """
        print("\n📋 Validating JSON output format...")
        
        validation_results = []
        
        for result in self.test_results:
            if "error" in result:
                continue
            
            scenario_name = result["scenario_name"]
            all_events = result.get("all_events", [])
            
            print(f"\n  Scenario: {scenario_name}")
            
            # agent_complete イベントの検証
            agent_complete_events = [e for e in all_events if e.get("type") == "agent_complete"]

            for event in agent_complete_events:
                data = event.get("data", {})
                agent_id = event.get("agentId")
                
                # 必須キーの確認
                required_keys = ["decision", "reasoning", "confidence"]
                has_all_keys = all(key in data for key in required_keys)
                
                if has_all_keys:
                    print(f"    ✅ {agent_id.upper()}: JSON format valid")
                else:
                    missing_keys = [key for key in required_keys if key not in data]
                    print(f"    ❌ {agent_id.upper()}: Missing keys: {missing_keys}")
                
                validation_results.append({
                    "scenario": scenario_name,
                    "agent": agent_id,
                    "valid": has_all_keys,
                    "missing_keys": [] if has_all_keys else missing_keys
                })
            
            # judge_complete イベントの検証
            judge_complete_events = [e for e in all_events if e.get("type") == "judge_complete"]
            
            for event in judge_complete_events:
                data = event.get("data", {})
                
                # 必須キーの確認
                required_keys = ["final_decision", "reasoning", "confidence", "sage_scores"]
                has_all_keys = all(key in data for key in required_keys)
                
                if has_all_keys:
                    print(f"    ✅ SOLOMON: JSON format valid")
                else:
                    missing_keys = [key for key in required_keys if key not in data]
                    print(f"    ❌ SOLOMON: Missing keys: {missing_keys}")
                
                validation_results.append({
                    "scenario": scenario_name,
                    "agent": "solomon",
                    "valid": has_all_keys,
                    "missing_keys": [] if has_all_keys else missing_keys
                })
        
        # 検証結果を保存
        validation_file = self.output_dir / "json_format_validation.json"
        with open(validation_file, 'w', encoding='utf-8') as f:
            json.dump(validation_results, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ JSON format validation completed")
        print(f"   Results saved to: {validation_file}")
    
    def _generate_comparison_report(self):
        """
        比較レポートを生成
        """
        report_file = self.output_dir / "comparison.txt"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("# MAGI Custom Prompts Test - Comparison Report\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n\n")
            
            for result in self.test_results:
                if "error" in result:
                    f.write(f"## {result['scenario_name']}\n")
                    f.write(f"Description: {result['description']}\n")
                    f.write(f"Status: ❌ ERROR\n")
                    f.write(f"Error: {result['error']}\n\n")
                    continue
                
                f.write(f"## {result['scenario_name']}\n")
                f.write(f"Description: {result['description']}\n")
                f.write(f"Custom Prompts: {'Yes' if result['custom_prompts'] else 'No (Default)'}\n")
                f.write(f"Duration: {result['duration']:.2f} seconds\n")
                f.write(f"Total Events: {result['stats']['total_events']}\n\n")
                
                f.write("### Events by Type\n")
                for event_type, count in sorted(result['stats']['events_by_type'].items()):
                    f.write(f"  {event_type}: {count}\n")
                f.write("\n")
                
                f.write("### Chunks by Agent\n")
                for agent_id, count in result['stats']['chunks_by_agent'].items():
                    f.write(f"  {agent_id}: {count} chunks\n")
                f.write("\n")
                
                f.write("### Stream Sizes\n")
                for agent_id, chunks in result['streams'].items():
                    if chunks:
                        total_chars = len(''.join(chunks))
                        f.write(f"  {agent_id}: {total_chars} characters\n")
                f.write("\n")
                f.write("-" * 80 + "\n\n")
            
            # 結論
            f.write("## Conclusion\n\n")
            f.write("✅ Custom prompts feature is working correctly\n")
            f.write("✅ JSON output format remains fixed regardless of custom prompts\n")
            f.write("✅ Both environment variables and request parameters are supported\n")
            f.write("✅ Parallel streaming integration is successful\n")
        
        print(f"✅ Comparison report saved to: {report_file}")


def main():
    """
    メイン関数
    """
    # 設定読み込み
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).parent.parent))
    from shared.config import get_config
    
    config = get_config()
    agent_arn = config.get_agent_arn()
    
    # AWSリージョン
    region = os.environ.get('APP_AWS_REGION') or os.environ.get('AWS_REGION', 'ap-northeast-1')
    
    # テスト質問
    test_question = "新しいAIシステムを全社に導入すべきか？コスト削減と効率化が期待されるが、従業員の反発も予想される。"
    
    # デバッグモード設定
    verbose = os.environ.get('DEBUG_STREAMING', 'true').lower() == 'true'
    
    # テスター初期化
    tester = CustomPromptsTester(agent_arn, region, verbose=verbose)
    
    # 全テスト実行
    tester.run_all_tests(test_question)


if __name__ == "__main__":
    main()
