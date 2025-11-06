#!/usr/bin/env python3
"""
MAGI Agent - Strands Agents統合版

Strands Agentsフレームワークを使用した3賢者システムの実装。
Amazon Bedrockと統合し、実際のLLM推論を実行します。
"""

import errno
import json
import asyncio
import os
from typing import Dict, Any, Optional
from datetime import datetime

# AgentCore Runtime統合
from bedrock_agentcore import BedrockAgentCoreApp

# Strands Agents
from strands import Agent

# アプリケーション初期化
app = BedrockAgentCoreApp()

# デバッグモード設定（環境変数で制御）
DEBUG_STREAMING = os.getenv('DEBUG_STREAMING', 'false').lower() == 'true'

print("✅ MAGI Strands Agent initialized successfully")
if DEBUG_STREAMING:
    print("🐛 DEBUG_STREAMING enabled - All streaming events will be logged to console")


# 3賢者のシステムプロンプト
CASPAR_PROMPT = """あなたはCASPAR（カスパー）です。
保守的で現実的な視点を持つ賢者として、以下の特性で判断してください：

【人格特性】
- 実行可能性を最重視
- リスクを慎重に評価
- 既存の実績やデータを重視
- 段階的なアプローチを好む

【判断基準】
1. 技術的実現可能性
2. コスト対効果
3. リスクの大きさ
4. 既存システムとの互換性
5. 実装の複雑さ

【出力形式】
以下のJSON形式で回答してください：
{
  "decision": "APPROVED" | "REJECTED" | "ABSTAINED",
  "reasoning": "判断理由（200文字以内）",
  "confidence": 0.0-1.0
}"""

BALTHASAR_PROMPT = """あなたはBALTHASAR（バルタザール）です。
革新的で感情的な視点を持つ賢者として、以下の特性で判断してください：

【人格特性】
- 創造性と革新性を重視
- 倫理的・人道的側面を考慮
- 長期的なビジョンを持つ
- 変革を恐れない

【判断基準】
1. 革新性・創造性
2. 倫理的影響
3. 人々への影響
4. 長期的価値
5. 社会的意義

【出力形式】
以下のJSON形式で回答してください：
{
  "decision": "APPROVED" | "REJECTED" | "ABSTAINED",
  "reasoning": "判断理由（200文字以内）",
  "confidence": 0.0-1.0
}"""

MELCHIOR_PROMPT = """あなたはMELCHIOR（メルキオール）です。
バランス型で科学的な視点を持つ賢者として、以下の特性で判断してください：

【人格特性】
- データと論理を重視
- 客観的な分析
- 多角的な視点
- バランスの取れた判断

【判断基準】
1. データの信頼性
2. 論理的整合性
3. 多面的な影響
4. 持続可能性
5. 総合的なバランス

【出力形式】
以下のJSON形式で回答してください：
{
  "decision": "APPROVED" | "REJECTED" | "ABSTAINED",
  "reasoning": "判断理由（200文字以内）",
  "confidence": 0.0-1.0
}"""

SOLOMON_PROMPT = """あなたはSOLOMON（ソロモン）です。
3賢者（CASPAR、BALTHASAR、MELCHIOR）の判断を統合評価する統括AIとして、
最終的な意思決定を行います。

【役割】
- 3賢者の判断を公平に評価
- 各賢者の視点の強みと弱みを分析
- 総合的な判断を下す
- 0-100点でスコアリング

【評価基準】
1. 論理的整合性
2. 実現可能性
3. リスクとリターンのバランス
4. 倫理的配慮
5. 長期的影響

【入力】
3賢者の判断結果：
{sage_responses}

【出力形式】
以下のJSON形式で回答してください：
{
  "final_decision": "APPROVED" | "REJECTED",
  "reasoning": "統合判断の理由（300文字以内）",
  "confidence": 0.0-1.0,
  "sage_scores": {
    "caspar": 0-100,
    "balthasar": 0-100,
    "melchior": 0-100
  }
}"""


class MAGIStrandsAgent:
    """MAGI Strands Agent - 3賢者システム"""
    
    def __init__(self):
        """初期化"""
        # 3賢者のエージェント作成
        self.caspar = Agent(
            name="CASPAR",
            model="anthropic.claude-3-5-sonnet-20240620-v1:0",
            system_prompt=CASPAR_PROMPT
        )
        
        self.balthasar = Agent(
            name="BALTHASAR",
            model="anthropic.claude-3-5-sonnet-20240620-v1:0",
            system_prompt=BALTHASAR_PROMPT
        )
        
        self.melchior = Agent(
            name="MELCHIOR",
            model="anthropic.claude-3-5-sonnet-20240620-v1:0",
            system_prompt=MELCHIOR_PROMPT
        )
        
        # SOLOMON Judge（統括AI）
        # 注: system_promptは実行時に3賢者の結果を含めて動的に生成
        self.solomon = Agent(
            name="SOLOMON",
            model="anthropic.claude-3-5-sonnet-20240620-v1:0"
        )
        
        print("✅ 3賢者 + SOLOMON Judge 初期化完了")
    

    async def process_decision_stream(self, request: Dict[str, Any]):
        """
        MAGI意思決定プロセス（ストリーミング版）
        
        SSE形式でイベントをストリーミングします。
        """
        start_time = datetime.now()
        trace_id = f"trace-{int(start_time.timestamp())}"
        question = request.get('question', 'デフォルト質問')
        
        try:
            # 開始イベント
            yield self._create_sse_event("start", {
                "trace_id": trace_id,
                "question": question,
                "timestamp": start_time.isoformat()
            })
            
            print(f"📝 Question: {question}")
            
            # 3賢者の分析開始
            yield self._create_sse_event("sages_start", {
                "trace_id": trace_id,
                "sage_count": 3
            })
            
            print("🤖 Consulting 3 sages in parallel...")
            
            # 3賢者に並列で相談（ストリーミング）
            tasks = [
                self._consult_sage_stream(self.caspar, "caspar", question, trace_id),
                self._consult_sage_stream(self.balthasar, "balthasar", question, trace_id),
                self._consult_sage_stream(self.melchior, "melchior", question, trace_id)
            ]
            
            agent_responses = []
            
            # 並列実行してストリーミング
            async for event in self._merge_streams(tasks):
                yield event
                
                # 完了イベントを収集
                if event.get('type') == 'sage_complete':
                    agent_responses.append(event.get('data', {}))
            
            # 結果を集計
            approved = sum(1 for r in agent_responses if r.get('decision') == 'APPROVED')
            rejected = sum(1 for r in agent_responses if r.get('decision') == 'REJECTED')
            abstained = sum(1 for r in agent_responses if r.get('decision') == 'ABSTAINED')
            
            # SOLOMON Judge による統合評価（ストリーミング）
            yield self._create_sse_event("judge_start", {
                "trace_id": trace_id
            })
            
            print("⚖️  SOLOMON Judge evaluation...")
            
            solomon_result = None
            async for event in self._solomon_judgment_stream(agent_responses, question, trace_id):
                yield event
                
                # 完了イベントを収集
                if event.get('type') == 'judge_complete':
                    solomon_result = event.get('data', {})
            
            # SOLOMONの最終判断を使用
            final_decision = solomon_result.get('final_decision', 'REJECTED') if solomon_result else 'REJECTED'
            
            # 実行時間計算
            end_time = datetime.now()
            execution_time = int((end_time - start_time).total_seconds() * 1000)
            
            # 完了イベント
            yield self._create_sse_event("complete", {
                "trace_id": trace_id,
                "final_decision": final_decision,
                "voting_result": {
                    "approved": approved,
                    "rejected": rejected,
                    "abstained": abstained
                },
                "solomon_judgment": solomon_result,
                "summary": self._create_summary(agent_responses, final_decision),
                "recommendation": self._create_recommendation(agent_responses, final_decision),
                "confidence": solomon_result.get('confidence', 0.5) if solomon_result else 0.5,
                "execution_time": execution_time,
                "timestamp": end_time.isoformat()
            })
            
            print(f"✅ Decision: {final_decision} (execution time: {execution_time}ms)")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            yield self._create_sse_event("error", {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })

    def _create_summary(self, responses: list, final_decision: str) -> str:
        """サマリー作成"""
        approved = sum(1 for r in responses if r.get('decision') == 'APPROVED')
        rejected = sum(1 for r in responses if r.get('decision') == 'REJECTED')
        
        if approved == 3:
            return "3賢者全員が承認しました。"
        elif rejected == 3:
            return "3賢者全員が却下しました。"
        elif approved > rejected:
            return f"3賢者のうち{approved}名が承認し、最終判断は承認となりました。"
        else:
            return f"3賢者のうち{rejected}名が却下し、最終判断は却下となりました。"
    
    def _create_recommendation(self, responses: list, final_decision: str) -> str:
        """推奨事項作成"""
        if final_decision == 'APPROVED':
            return "提案を実行することを推奨します。"
        else:
            return "提案の再検討を推奨します。"
    
    def _calculate_confidence(self, responses: list) -> float:
        """信頼度計算"""
        if not responses:
            return 0.0

        confidences = [r.get('confidence', 0.5) for r in responses]
        return sum(confidences) / len(confidences)

    def _extract_json_block(self, full_text: str, key_hint: str) -> Optional[str]:
        """Extract a JSON object that contains a specific key."""
        if not full_text:
            return None

        key_position = full_text.find(key_hint)
        if key_position == -1:
            return None

        start_index = full_text.rfind('{', 0, key_position)
        if start_index == -1:
            return None

        depth = 0
        for index in range(start_index, len(full_text)):
            char = full_text[index]
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    return full_text[start_index:index + 1].strip()

        return None
    
    async def _consult_sage_stream(self, agent: Agent, agent_id: str, question: str, trace_id: str):
        """
        個別の賢者に相談（ストリーミング版）
        
        Strands Agentsのストリーミング機能を使用して、
        思考プロセスをリアルタイムで表示します。
        """
        # 開始イベント
        yield self._create_sse_event("sage_start", {
            "agent_id": agent_id,
            "trace_id": trace_id
        })
        
        print(f"  🤖 Consulting {agent_id.upper()}...")
        
        try:
            # Strands Agentsのストリーミング機能を使用
            # stream_async()メソッドは思考プロセスをリアルタイムで返す
            full_response = ""
            
            # stream_async()メソッドで非同期ストリーミング
            async for chunk in agent.stream_async(question):
                # デバッグ: チャンクの型と内容を出力
                print(f"  🔍 {agent_id.upper()} chunk type: {type(chunk)}")
                print(f"  🔍 {agent_id.upper()} chunk content: {chunk}")
                
                # チャンクからテキストを抽出
                # Strands Agentsは辞書形式でチャンクを返す
                if isinstance(chunk, dict):
                    # 'data'キーにテキストが含まれる場合
                    if 'data' in chunk:
                        chunk_text = chunk['data']
                    # 'delta'キーにテキストが含まれる場合
                    elif 'delta' in chunk and isinstance(chunk['delta'], dict):
                        chunk_text = chunk['delta'].get('text', '')
                    # その他の場合は文字列化
                    else:
                        chunk_text = str(chunk)
                else:
                    chunk_text = str(chunk)
                
                # 空のチャンクはスキップ
                if not chunk_text:
                    continue
                
                full_response += chunk_text
                
                # チャンクイベント（思考プロセスの一部）
                yield self._create_sse_event("sage_thinking", {
                    "agent_id": agent_id,
                    "chunk": chunk_text,
                    "trace_id": trace_id
                })
            
            # 最終レスポンスイベント
            yield self._create_sse_event("sage_chunk", {
                "agent_id": agent_id,
                "chunk": full_response,
                "trace_id": trace_id
            })
            
            # JSON部分を抽出
            try:
                json_text = self._extract_json_block(full_response, '"decision"')

                if not json_text and '{' in full_response:
                    json_start = full_response.find('{')
                    json_end = full_response.rfind('}') + 1
                    json_text = full_response[json_start:json_end]

                if not json_text:
                    json_text = full_response.strip()

                result = json.loads(json_text)
                result['agent_id'] = agent_id
                
                print(f"  ✅ {agent_id.upper()}: {result.get('decision')} (confidence: {result.get('confidence')})")
                
                # 完了イベント
                yield self._create_sse_event("sage_complete", result)
                
            except json.JSONDecodeError:
                print(f"  ⚠️ {agent_id.upper()}: JSON parse failed, using default")
                result = {
                    "agent_id": agent_id,
                    "decision": "ABSTAINED",
                    "reasoning": full_response[:200],
                    "confidence": 0.5
                }
                yield self._create_sse_event("sage_complete", result)
                
        except Exception as e:
            print(f"  ❌ {agent_id.upper()} failed: {e}")
            
            # エラー時もデフォルト結果を返す
            default_result = {
                "agent_id": agent_id,
                "decision": "ABSTAINED",
                "reasoning": f"エラーが発生しました: {str(e)}",
                "confidence": 0.0
            }
            
            # エラーイベント
            yield self._create_sse_event("sage_error", {
                "agent_id": agent_id,
                "error": str(e),
                "trace_id": trace_id
            })
            
            # 完了イベント（デフォルト結果）
            yield self._create_sse_event("sage_complete", default_result)
    
    async def _solomon_judgment_stream(self, sage_responses: list, question: str, trace_id: str):
        """
        SOLOMON Judgeによる統合評価（ストリーミング版）
        
        Strands Agentsのストリーミング機能を使用して、
        評価プロセスをリアルタイムで表示します。
        """
        try:
            # 3賢者のデータが不足している場合の警告
            if len(sage_responses) < 3:
                print(f"  ⚠️ SOLOMON: Only {len(sage_responses)}/3 sages responded")
            
            # 3賢者の結果をフォーマット
            sage_summary = json.dumps([
                {
                    "agent": r.get('agent_id'),
                    "decision": r.get('decision'),
                    "reasoning": r.get('reasoning'),
                    "confidence": r.get('confidence')
                }
                for r in sage_responses
            ], ensure_ascii=False, indent=2)
            
            # SOLOMONプロンプトに3賢者の結果を埋め込み
            solomon_prompt = SOLOMON_PROMPT.format(sage_responses=sage_summary)
            
            # Strands Agentsのストリーミング機能を使用
            # stream_async()メソッドで非同期ストリーミング
            full_response = ""
            
            # stream_async()メソッドで非同期ストリーミング
            async for chunk in self.solomon.stream_async(question, system_prompt=solomon_prompt):
                # チャンクからテキストを抽出
                if isinstance(chunk, dict):
                    if 'data' in chunk:
                        chunk_text = chunk['data']
                    elif 'delta' in chunk and isinstance(chunk['delta'], dict):
                        chunk_text = chunk['delta'].get('text', '')
                    else:
                        chunk_text = str(chunk)
                else:
                    chunk_text = str(chunk)
                
                # 空のチャンクはスキップ
                if not chunk_text:
                    continue
                
                full_response += chunk_text
                
                # チャンクイベント（思考プロセスの一部）
                yield self._create_sse_event("judge_thinking", {
                    "chunk": chunk_text,
                    "trace_id": trace_id
                })
            
            # 最終レスポンスイベント
            yield self._create_sse_event("judge_chunk", {
                "chunk": full_response,
                "trace_id": trace_id
            })
            
            # JSON部分を抽出
            try:
                json_text = self._extract_json_block(full_response, '"final_decision"')

                if not json_text and '{' in full_response:
                    json_start = full_response.find('{')
                    json_end = full_response.rfind('}') + 1
                    json_text = full_response[json_start:json_end]

                if not json_text:
                    json_text = full_response.strip()

                result = json.loads(json_text)
                
                print(f"  ✅ SOLOMON: {result.get('final_decision')} (confidence: {result.get('confidence')})")
                
                # 完了イベント
                yield self._create_sse_event("judge_complete", result)
                
            except json.JSONDecodeError:
                print(f"  ⚠️ SOLOMON: JSON parse failed, using default")
                result = {
                    "final_decision": "REJECTED",
                    "reasoning": full_response[:300],
                    "confidence": 0.5,
                    "sage_scores": {}
                }
                yield self._create_sse_event("judge_complete", result)
                
        except Exception as e:
            print(f"  ❌ SOLOMON failed: {e}")
            
            # エラー時もデフォルト結果を返す
            default_result = {
                "final_decision": "REJECTED",
                "reasoning": f"SOLOMON評価中にエラーが発生しました: {str(e)}",
                "confidence": 0.0,
                "sage_scores": {}
            }
            
            # エラーイベント
            yield self._create_sse_event("judge_error", {
                "error": str(e),
                "trace_id": trace_id
            })
            
            # 完了イベント（デフォルト結果）
            yield self._create_sse_event("judge_complete", default_result)
    
    async def _merge_streams(self, tasks):
        """
        複数のストリームをマージ
        """
        # 各タスクからイベントを収集
        for task in tasks:
            async for event in task:
                yield event
    
    def _create_sse_event(self, event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        イベントを作成（AgentCore Runtimeが自動的にSSE形式に変換）
        
        DEBUG_STREAMING=true の場合、コンソールにイベントを表示します。
        """
        event = {
            "type": event_type,
            "data": data
        }
        
        # デバッグモード: ストリーミングイベントをコンソールに表示
        if DEBUG_STREAMING:
            self._log_streaming_event(event_type, data)
        
        return event
    
    def _log_streaming_event(self, event_type: str, data: Dict[str, Any]):
        """
        ストリーミングイベントをコンソールに表示（デバッグ用）
        
        3賢者の並列処理により、イベントは到着順に表示されます。
        """
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        
        # イベントタイプ別の表示フォーマット
        if event_type == "start":
            print(f"\n{'='*80}")
            print(f"[{timestamp}] 🚀 START")
            print(f"  Question: {data.get('question', 'N/A')}")
            print(f"  Trace ID: {data.get('trace_id', 'N/A')}")
            print(f"{'='*80}\n")
        
        elif event_type == "sages_start":
            print(f"[{timestamp}] 👥 SAGES_START")
            print(f"  Consulting {data.get('sage_count', 3)} sages in parallel...\n")
        
        elif event_type == "sage_start":
            agent_id = data.get('agent_id', 'unknown').upper()
            print(f"[{timestamp}] 🤖 SAGE_START: {agent_id}")
        
        elif event_type == "sage_thinking":
            agent_id = data.get('agent_id', 'unknown').upper()
            chunk = data.get('chunk', '')
            # 思考プロセスをリアルタイム表示
            print(f"[{timestamp}] 💭 THINKING: {agent_id}")
            print(f"  {chunk}")
        
        elif event_type == "sage_chunk":
            agent_id = data.get('agent_id', 'unknown').upper()
            chunk = data.get('chunk', '')
            # チャンクが長い場合は省略表示
            display_chunk = chunk[:100] + "..." if len(chunk) > 100 else chunk
            print(f"[{timestamp}] 💭 SAGE_CHUNK: {agent_id}")
            print(f"  {display_chunk}\n")
        
        elif event_type == "sage_complete":
            agent_id = data.get('agent_id', 'unknown').upper()
            decision = data.get('decision', 'N/A')
            confidence = data.get('confidence', 0.0)
            reasoning = data.get('reasoning', 'N/A')
            print(f"[{timestamp}] ✅ SAGE_COMPLETE: {agent_id}")
            print(f"  Decision: {decision}")
            print(f"  Confidence: {confidence:.2f}")
            print(f"  Reasoning: {reasoning[:80]}...")
            print()
        
        elif event_type == "sage_error":
            agent_id = data.get('agent_id', 'unknown').upper()
            error = data.get('error', 'N/A')
            print(f"[{timestamp}] ❌ SAGE_ERROR: {agent_id}")
            print(f"  Error: {error}\n")
        
        elif event_type == "judge_start":
            print(f"[{timestamp}] ⚖️  JUDGE_START")
            print(f"  SOLOMON evaluating 3 sages' responses...\n")
        
        elif event_type == "judge_thinking":
            chunk = data.get('chunk', '')
            # 思考プロセスをリアルタイム表示
            print(f"[{timestamp}] 💭 JUDGE_THINKING")
            print(f"  {chunk}")
        
        elif event_type == "judge_chunk":
            chunk = data.get('chunk', '')
            display_chunk = chunk[:100] + "..." if len(chunk) > 100 else chunk
            print(f"[{timestamp}] 💭 JUDGE_CHUNK")
            print(f"  {display_chunk}\n")
        
        elif event_type == "judge_complete":
            final_decision = data.get('final_decision', 'N/A')
            confidence = data.get('confidence', 0.0)
            reasoning = data.get('reasoning', 'N/A')
            sage_scores = data.get('sage_scores', {})
            print(f"[{timestamp}] ✅ JUDGE_COMPLETE")
            print(f"  Final Decision: {final_decision}")
            print(f"  Confidence: {confidence:.2f}")
            print(f"  Reasoning: {reasoning[:80]}...")
            if sage_scores:
                print(f"  Sage Scores:")
                for sage, score in sage_scores.items():
                    print(f"    {sage.upper()}: {score}/100")
            print()
        
        elif event_type == "judge_error":
            error = data.get('error', 'N/A')
            print(f"[{timestamp}] ❌ JUDGE_ERROR")
            print(f"  Error: {error}\n")
        
        elif event_type == "complete":
            final_decision = data.get('final_decision', 'N/A')
            execution_time = data.get('execution_time', 0)
            voting_result = data.get('voting_result', {})
            print(f"\n{'='*80}")
            print(f"[{timestamp}] 🏁 COMPLETE")
            print(f"  Final Decision: {final_decision}")
            print(f"  Execution Time: {execution_time}ms")
            print(f"  Voting Result:")
            print(f"    Approved: {voting_result.get('approved', 0)}")
            print(f"    Rejected: {voting_result.get('rejected', 0)}")
            print(f"    Abstained: {voting_result.get('abstained', 0)}")
            print(f"{'='*80}\n")
        
        elif event_type == "error":
            error = data.get('error', 'N/A')
            print(f"\n{'='*80}")
            print(f"[{timestamp}] ❌ ERROR")
            print(f"  {error}")
            print(f"{'='*80}\n")
        
        else:
            # その他のイベント
            print(f"[{timestamp}] 📦 {event_type.upper()}")
            print(f"  Data: {json.dumps(data, ensure_ascii=False, indent=2)}\n")


# グローバルインスタンス
magi_strands = MAGIStrandsAgent()


@app.entrypoint
async def handler_strands(payload: Dict[str, Any]):
    """
    AgentCore Runtime エントリーポイント（ストリーミング専用）
    
    常にストリーミングレスポンスを返します。
    UXを考慮し、3賢者の思考プロセスをリアルタイムで表示します。
    """
    async for event in magi_strands.process_decision_stream(payload):
        yield event


if __name__ == "__main__":
    # AgentCore Runtime起動
    print("🚀 Starting MAGI Strands Agent...")

    port_env = os.getenv("AGENTCORE_RUNTIME_PORT") or os.getenv("PORT")
    host_env = os.getenv("AGENTCORE_RUNTIME_HOST")
    fallback_port_env = os.getenv("AGENTCORE_RUNTIME_FALLBACK_PORT")

    try:
        port_value = int(port_env) if port_env else 8080
    except ValueError:
        print(f"⚠️  Invalid port value '{port_env}', falling back to 8080")
        port_value = 8080

    run_kwargs = {}
    if host_env:
        run_kwargs["host"] = host_env

    try:
        app.run(port=port_value, **run_kwargs)
    except OSError as exc:
        if exc.errno == errno.EADDRINUSE and fallback_port_env:
            try:
                fallback_port = int(fallback_port_env)
            except ValueError:
                print(f"❌ Invalid fallback port '{fallback_port_env}'.")
                raise

            print(
                f"⚠️  Port {port_value} in use. Retrying on fallback port {fallback_port}."
            )
            app.run(port=fallback_port, **run_kwargs)
        else:
            raise
