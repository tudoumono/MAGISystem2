#!/usr/bin/env python3
"""
MAGI Agent - Strands Agents統合版 (PARALLEL STREAMING)

🚀 PHASE 3 - TRUE PARALLEL EXECUTION ⚡
==========================================

✅ 真の並列実行: 3賢者が同時に思考・応答
✅ リアルタイムストリーミング: 各賢者の思考プロセスを即座に表示
✅ パフォーマンス向上: 実行時間を1/3に短縮（30秒 → 10秒目標）
✅ エラー処理: 1つの賢者が失敗しても他は継続

🔄 ROLLBACK AVAILABLE: magi_agent_sequential.py
問題が発生した場合は、逐次実行版に戻すことができます

アーキテクチャ:
  Next.js (agents/backend/app/api/invocations/route.ts)
      ↓ spawn('python', ['magi_agent.py'])
  Python magi_agent.py (このファイル) ← 並列実行版
      ├─ 標準入力: JSON リクエスト受信
      ├─ 標準出力: JSON Lines ストリーミング出力
      └─ 3賢者 TRUE PARALLEL + SOLOMON Judge

並列実行の特徴:
- asyncio.Queue による真の並列ストリーミング
- 各賢者が独立してLLM推論を実行
- リアルタイムイベント配信
- タイムアウト・エラーハンドリング

Strands Agentsフレームワークを使用した3賢者システムの実装。
Amazon Bedrockと統合し、実際のLLM推論を実行します。
"""

import errno
import json
import asyncio
import os
from typing import Dict, Any, Optional, AsyncGenerator
from datetime import datetime

# Strands Agents
from strands import Agent

# 設定管理（AgentCore Runtime対応）
try:
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).parent))
    from shared.config import MAGIConfig
    
    # AgentCore Runtime環境用の設定
    config = MAGIConfig.for_agentcore_runtime()
    DEBUG_STREAMING = config.is_debug_enabled()
    
    print("✅ MAGI Strands Agent initialized successfully")
    if DEBUG_STREAMING:
        print("🐛 DEBUG_STREAMING enabled - All streaming events will be logged to console")
        
except ImportError as e:
    # フォールバック: 環境変数のみ使用
    print(f"⚠️  Config module not available: {e}")
    DEBUG_STREAMING = os.getenv('DEBUG_STREAMING', 'false').lower() == 'true'
    print("✅ MAGI Strands Agent initialized (fallback mode)")
    if DEBUG_STREAMING:
        print("🐛 DEBUG_STREAMING enabled (fallback) - All streaming events will be logged to console")


# =============================================================================
# JSON出力形式（固定・変更不可）
# バックエンドのパース処理に必須のため、この部分は変更できません
# =============================================================================

def _get_sage_json_format(max_length: int = 1000) -> str:
    """
    3賢者用のJSON出力形式を生成

    Args:
        max_length: reasoning の最大文字数（デフォルト: 1000）

    Returns:
        JSON形式の文字列
    """
    return f"""
【出力形式】※この形式は厳守してください
以下のJSON形式で回答してください：
{{
  "decision": "APPROVED" | "REJECTED" | "ABSTAINED",
  "reasoning": "判断理由（{max_length}文字以内）",
  "confidence": 0.0-1.0
}}"""

def _get_solomon_json_format(max_length: int = 1500) -> str:
    """
    SOLOMON用のJSON出力形式を生成

    Args:
        max_length: reasoning の最大文字数（デフォルト: 1500）

    Returns:
        JSON形式の文字列
    """
    return f"""
【出力形式】※この形式は厳守してください
以下のJSON形式で回答してください：
{{
  "final_decision": "APPROVED" | "REJECTED",
  "reasoning": "統合判断の理由（{max_length}文字以内）",
  "confidence": 0.0-1.0,
  "sage_scores": {{
    "caspar": 0-100,
    "balthasar": 0-100,
    "melchior": 0-100
  }}
}}"""

# 後方互換性のため、デフォルト値で生成（環境変数が未設定の場合）
SAGE_JSON_FORMAT = _get_sage_json_format(1000)
SOLOMON_JSON_FORMAT = _get_solomon_json_format(1500)

# =============================================================================
# デフォルトのロール説明（カスタマイズ可能）
# 環境変数やリクエストパラメータで上書き可能
# =============================================================================

DEFAULT_CASPAR_ROLE = """あなたはCASPAR（カスパー）です。
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
5. 実装の複雑さ"""

DEFAULT_BALTHASAR_ROLE = """あなたはBALTHASAR（バルタザール）です。
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
5. 社会的意義"""

DEFAULT_MELCHIOR_ROLE = """あなたはMELCHIOR（メルキオール）です。
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
5. 総合的なバランス"""

DEFAULT_SOLOMON_ROLE = """あなたはSOLOMON（ソロモン）です。
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
{sage_responses}"""

# 後方互換性のため、デフォルトの完全なプロンプトを維持
CASPAR_PROMPT = DEFAULT_CASPAR_ROLE + SAGE_JSON_FORMAT
BALTHASAR_PROMPT = DEFAULT_BALTHASAR_ROLE + SAGE_JSON_FORMAT
MELCHIOR_PROMPT = DEFAULT_MELCHIOR_ROLE + SAGE_JSON_FORMAT
SOLOMON_PROMPT = DEFAULT_SOLOMON_ROLE + SOLOMON_JSON_FORMAT


class MAGIStrandsAgent:
    """MAGI Strands Agent - 3賢者システム"""

    def __init__(self, custom_prompts: Optional[Dict[str, str]] = None):
        """
        初期化

        Args:
            custom_prompts: カスタムプロンプト辞書（省略時は環境変数から読み込み）
                例: {
                    'caspar': 'あなたは保守的な賢者です...',
                    'balthasar': 'あなたは革新的な賢者です...',
                    'melchior': 'あなたはバランス型の賢者です...',
                    'solomon': 'あなたは統括AIです...'
                }
        """
        # タイムアウト設定をロード
        from config.timeout import get_timeout_config
        self.timeout_config = get_timeout_config()

        # カスタムプロンプトの読み込み（優先順位：引数 > 環境変数 > デフォルト）
        self.custom_prompts = custom_prompts or {}

        # 環境変数からカスタムプロンプトを読み込み（引数で指定されていない場合）
        if config:
            for agent_name in ['caspar', 'balthasar', 'melchior', 'solomon']:
                if agent_name not in self.custom_prompts:
                    env_prompt = config.get_custom_prompt(agent_name)
                    if env_prompt:
                        self.custom_prompts[agent_name] = env_prompt

        # 文字数制限を設定から読み込み
        sage_max_length = config.get('sage_reasoning_max_length', 1000) if config else 1000
        solomon_max_length = config.get('solomon_reasoning_max_length', 1500) if config else 1500

        # JSON形式を動的に生成
        sage_json_format = _get_sage_json_format(sage_max_length)
        solomon_json_format = _get_solomon_json_format(solomon_max_length)

        # 文字数制限を保存（後で使用）
        self.sage_max_length = sage_max_length
        self.solomon_max_length = solomon_max_length

        # プロンプトを構築（カスタム + JSON形式）
        caspar_prompt = self._build_prompt('caspar', DEFAULT_CASPAR_ROLE, sage_json_format)
        balthasar_prompt = self._build_prompt('balthasar', DEFAULT_BALTHASAR_ROLE, sage_json_format)
        melchior_prompt = self._build_prompt('melchior', DEFAULT_MELCHIOR_ROLE, sage_json_format)

        # 3賢者のエージェント作成
        self.caspar = Agent(
            name="CASPAR",
            model="anthropic.claude-3-5-sonnet-20240620-v1:0",
            system_prompt=caspar_prompt
        )

        self.balthasar = Agent(
            name="BALTHASAR",
            model="anthropic.claude-3-5-sonnet-20240620-v1:0",
            system_prompt=balthasar_prompt
        )

        self.melchior = Agent(
            name="MELCHIOR",
            model="anthropic.claude-3-5-sonnet-20240620-v1:0",
            system_prompt=melchior_prompt
        )

        # SOLOMON Judge（統括AI）
        # 注: system_promptは実行時に3賢者の結果を含めて動的に生成
        self.solomon = Agent(
            name="SOLOMON",
            model="anthropic.claude-3-5-sonnet-20240620-v1:0"
        )
        
        # 賢者ごとのステートマシン（並列イベント処理用）
        self.sage_states = {
            "caspar": {"buffer": "", "in_message": False, "completed": False, "decision": None},
            "balthasar": {"buffer": "", "in_message": False, "completed": False, "decision": None},
            "melchior": {"buffer": "", "in_message": False, "completed": False, "decision": None}
        }

        # カスタムプロンプトの使用状況を表示
        custom_count = len(self.custom_prompts)
        if custom_count > 0:
            print(f"✅ 3賢者 + SOLOMON Judge 初期化完了（{custom_count}個のカスタムプロンプト使用中）")
        else:
            print("✅ 3賢者 + SOLOMON Judge 初期化完了（デフォルトプロンプト使用）")

    def _build_prompt(self, agent_name: str, default_role: str, json_format: str) -> str:
        """
        プロンプトを構築（カスタムロール + 固定JSON形式）

        Args:
            agent_name: エージェント名
            default_role: デフォルトのロール説明
            json_format: JSON出力形式（固定）

        Returns:
            完全なプロンプト
        """
        # カスタムプロンプトが設定されている場合はそれを使用
        role = self.custom_prompts.get(agent_name, default_role)

        # ロール説明 + JSON形式（固定）
        return role + json_format
    

    async def process_decision_stream(self, request: Dict[str, Any]):
        """
        MAGI意思決定プロセス（ストリーミング版）

        SSE形式でイベントをストリーミングします。

        Args:
            request: リクエストデータ
                - question: 判断する質問
                - custom_prompts (optional): リクエスト固有のカスタムプロンプト
                    例: {
                        'caspar': 'あなたは...',
                        'balthasar': 'あなたは...',
                        'melchior': 'あなたは...',
                        'solomon': 'あなたは...'
                    }
        """
        start_time = datetime.now()
        trace_id = f"trace-{int(start_time.timestamp())}"
        question = request.get('question', 'デフォルト質問')

        # リクエストレベルのカスタムプロンプトを取得
        request_custom_prompts = request.get('custom_prompts', {})
        
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
            # リクエスト固有のカスタムプロンプトがある場合は使用
            tasks = [
                self._consult_sage_stream(
                    self.caspar, "caspar", question, trace_id,
                    custom_role=request_custom_prompts.get('caspar')
                ),
                self._consult_sage_stream(
                    self.balthasar, "balthasar", question, trace_id,
                    custom_role=request_custom_prompts.get('balthasar')
                ),
                self._consult_sage_stream(
                    self.melchior, "melchior", question, trace_id,
                    custom_role=request_custom_prompts.get('melchior')
                )
            ]
            
            agent_responses = []
            
            # 並列実行してストリーミング
            async for event in self._merge_streams(tasks):
                yield event
                
                # 完了イベントを収集
                if event.get('type') == 'sage_complete':
                    agent_responses.append(event.get('data', {}))
            
            # 結果を集計（ステートマシンから正確な判定を取得）
            final_decisions = []
            for agent_id in ["caspar", "balthasar", "melchior"]:
                if agent_id in self.sage_states and self.sage_states[agent_id]["decision"]:
                    decision_data = self.sage_states[agent_id]["decision"]
                    final_decisions.append(decision_data.get("decision", "ABSTAINED"))
                else:
                    final_decisions.append("ABSTAINED")
            
            approved = sum(1 for d in final_decisions if d == 'APPROVED')
            rejected = sum(1 for d in final_decisions if d == 'REJECTED')
            abstained = sum(1 for d in final_decisions if d == 'ABSTAINED')
            
            if DEBUG_STREAMING:
                print(f"\n📊 Final Sage Decisions:")
                for i, agent_id in enumerate(["caspar", "balthasar", "melchior"]):
                    print(f"   {agent_id.upper()}: {final_decisions[i]}")
                print(f"   Summary: {approved} approved, {rejected} rejected, {abstained} abstained\n")
            
            # SOLOMON Judge による統合評価（ストリーミング）
            yield self._create_sse_event("judge_start", {
                "trace_id": trace_id
            })
            
            print("⚖️  SOLOMON Judge evaluation...")
            
            solomon_result = None
            async for event in self._solomon_judgment_stream(
                agent_responses, question, trace_id,
                custom_role=request_custom_prompts.get('solomon')
            ):
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
    
    def _is_content_chunk(self, chunk: str) -> bool:
        """
        チャンクがコンテンツ（JSON）かログ行かを判定
        
        Args:
            chunk: チャンク文字列
            
        Returns:
            bool: コンテンツの場合True
        """
        # ログ行の特徴を除外
        log_indicators = [
            "{'init_event_loop':",
            "{'start':",
            "{'event':",
            "{'message':",
            "{'result':",
            "{'metadata':"
        ]
        
        return not any(indicator in chunk for indicator in log_indicators)
    
    def _parse_sage_decision(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        賢者のバッファからJSON判定を抽出
        
        Args:
            agent_id: 賢者ID
            
        Returns:
            dict: 判定データまたはNone
        """
        if agent_id not in self.sage_states:
            return None
            
        buffer = self.sage_states[agent_id]["buffer"]
        if not buffer:
            return None
        
        try:
            # 方法1: 完全なJSONとしてパース
            # 先頭の非JSON文字を除去
            json_start = buffer.find('{')
            if json_start == -1:
                return None
                
            # 末尾の非JSON文字を除去
            json_end = buffer.rfind('}') + 1
            if json_end <= json_start:
                return None
                
            json_text = buffer[json_start:json_end]
            result = json.loads(json_text)
            
            # 必要なキーが存在するかチェック
            if "decision" in result:
                if DEBUG_STREAMING:
                    print(f"   ✅ [{agent_id.upper()}] JSON parsed successfully")
                return result
                
        except json.JSONDecodeError:
            pass
        
        try:
            # 方法2: 正規表現でキーを抽出
            import re
            
            decision_match = re.search(r'"decision"\s*:\s*"([^"]+)"', buffer)
            confidence_match = re.search(r'"confidence"\s*:\s*([0-9.]+)', buffer)
            reasoning_match = re.search(r'"reasoning"\s*:\s*"([^"]+)"', buffer)
            
            if decision_match:
                result = {
                    "decision": decision_match.group(1),
                    "confidence": float(confidence_match.group(1)) if confidence_match else 0.5,
                    "reasoning": reasoning_match.group(1) if reasoning_match else "Extracted via regex"
                }
                
                if DEBUG_STREAMING:
                    print(f"   ⚠️  [{agent_id.upper()}] JSON extracted via regex")
                return result
                
        except Exception as e:
            if DEBUG_STREAMING:
                print(f"   ❌ [{agent_id.upper()}] Regex extraction failed: {e}")
        
        # 方法3: デフォルト値
        if DEBUG_STREAMING:
            print(f"   ❌ [{agent_id.upper()}] All parsing methods failed, using default")
            
        return {
            "decision": "ABSTAINED",
            "confidence": 0.0,
            "reasoning": f"Failed to parse response from {agent_id}"
        }

    def _extract_json_block(self, full_text: str, key_hint: str) -> Optional[str]:
        """
        JSON objectを抽出（堅牢版）
        
        Args:
            full_text: 抽出元テキスト
            key_hint: 検索するキー（例: "decision", "final_decision"）
            
        Returns:
            抽出されたJSON文字列、または None
        """
        if not full_text:
            return None

        # 1. key_hintを含むJSON objectを探す
        key_position = full_text.find(key_hint)
        if key_position == -1:
            return None

        start_index = full_text.rfind('{', 0, key_position)
        if start_index == -1:
            return None

        # 2. バランスの取れた括弧でJSON objectを抽出
        depth = 0
        for index in range(start_index, len(full_text)):
            char = full_text[index]
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    json_candidate = full_text[start_index:index + 1].strip()
                    
                    # 3. 抽出したJSONが有効かテスト
                    try:
                        json.loads(json_candidate)
                        return json_candidate
                    except json.JSONDecodeError:
                        # 無効な場合は次の候補を探す
                        continue
        
        return None
    
    def _robust_json_parse(self, text: str, expected_keys: list) -> Optional[Dict[str, Any]]:
        """
        堅牢なJSONパース
        
        Args:
            text: パース対象テキスト
            expected_keys: 期待されるキーのリスト
            
        Returns:
            パースされた辞書、または None
        """
        if not text:
            return None
        
        # 1. 標準的なJSONパース
        try:
            result = json.loads(text)
            if isinstance(result, dict) and all(key in result for key in expected_keys):
                return result
        except json.JSONDecodeError:
            pass
        
        # 2. 先頭・末尾のゴミを除去してリトライ
        try:
            # 最初の '{' から最後の '}' までを抽出
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and start < end:
                cleaned = text[start:end + 1]
                result = json.loads(cleaned)
                if isinstance(result, dict) and all(key in result for key in expected_keys):
                    return result
        except json.JSONDecodeError:
            pass
        
        # 3. json.JSONDecoder().raw_decode を試す
        try:
            import json.decoder
            decoder = json.decoder.JSONDecoder()
            result, _ = decoder.raw_decode(text.lstrip())
            if isinstance(result, dict) and all(key in result for key in expected_keys):
                return result
        except (json.JSONDecodeError, ValueError):
            pass
        
        # 4. 正規表現で各キーを個別抽出（最終手段）
        try:
            import re
            result = {}
            
            for key in expected_keys:
                # "key": "value" または "key": value のパターン
                pattern = rf'"{key}"\s*:\s*("([^"]*)"|([\d.]+)|(\w+))'
                match = re.search(pattern, text)
                if match:
                    if match.group(2):  # 文字列値
                        result[key] = match.group(2)
                    elif match.group(3):  # 数値
                        try:
                            result[key] = float(match.group(3))
                        except ValueError:
                            result[key] = match.group(3)
                    elif match.group(4):  # その他（true/false/null等）
                        result[key] = match.group(4)
            
            if len(result) >= len(expected_keys) // 2:  # 半分以上のキーが見つかれば成功
                print(f"  ⚠️  JSON extracted via regex (fallback method)")
                return result
        except Exception:
            pass
        
        return None
    
    async def _consult_sage_stream(
        self,
        agent: Agent,
        agent_id: str,
        question: str,
        trace_id: str,
        custom_role: Optional[str] = None
    ):
        """
        個別の賢者に相談（ストリーミング版）

        Strands Agentsのストリーミング機能を使用して、
        思考プロセスをリアルタイムで表示します。

        Args:
            agent: Strandsエージェントインスタンス
            agent_id: エージェントID
            question: 質問
            trace_id: トレースID
            custom_role: カスタムロール（省略時はエージェントのデフォルトを使用）
        """
        # 開始イベント
        yield self._create_sse_event("agent_start", {
            "trace_id": trace_id
        }, agent_id=agent_id)
        
        # ステートマシン初期化
        if agent_id in self.sage_states:
            self.sage_states[agent_id]["buffer"] = ""
            self.sage_states[agent_id]["in_message"] = True
            self.sage_states[agent_id]["completed"] = False
        
        print(f"  🤖 Consulting {agent_id.upper()}...")

        try:
            # タイムアウト値を取得（環境変数: MAGI_SAGE_TIMEOUT_SECONDS、デフォルト: 90秒）
            timeout_seconds = self.timeout_config.sage_timeout_seconds

            if DEBUG_STREAMING:
                print(f"  ⏱️  {agent_id.upper()} timeout: {timeout_seconds}s")

            # カスタムロールが指定されている場合は、動的にプロンプトを構築
            if custom_role:
                # カスタムロール + 動的JSON形式
                sage_json_format = _get_sage_json_format(self.sage_max_length)
                custom_prompt = custom_role + sage_json_format
                stream_kwargs = {'system_prompt': custom_prompt}
            else:
                # デフォルトのエージェントプロンプトを使用
                stream_kwargs = {}

            # Strands Agentsのストリーミング機能を使用
            # stream_async()メソッドは思考プロセスをリアルタイムで返す
            full_response = ""

            # ⭐ タイムアウト処理付きでLLM呼び出しを実行
            # タイムアウトトラッキング用の変数
            start_time = asyncio.get_event_loop().time()

            try:
                # stream_async()メソッドで非同期ストリーミング
                async for chunk in agent.stream_async(question, **stream_kwargs):
                    # ⭐ タイムアウトチェック
                    elapsed = asyncio.get_event_loop().time() - start_time
                    if elapsed > timeout_seconds:
                        raise asyncio.TimeoutError(f"Sage {agent_id} exceeded timeout of {timeout_seconds}s")

                    # デバッグ: チャンクの型と内容を出力
                    if DEBUG_STREAMING:
                        print(f"  🔍 {agent_id.upper()} chunk type: {type(chunk)}")
                        print(f"  🔍 {agent_id.upper()} chunk content: {chunk}")

                    # チャンクからテキストを抽出
                    # Strands Agentsは辞書形式でチャンクを返す
                    chunk_text = None

                    if isinstance(chunk, dict):
                        # Strands Agentsの内部イベントをフィルタリング
                        # 'event'キーがある場合のみ処理（LLM応答イベント）
                        if 'event' in chunk:
                            event_data = chunk['event']

                            # contentBlockDelta から実際のテキストを抽出
                            if isinstance(event_data, dict) and 'contentBlockDelta' in event_data:
                                delta = event_data['contentBlockDelta'].get('delta', {})
                                if isinstance(delta, dict) and 'text' in delta:
                                    chunk_text = delta['text']

                        # 'message'キーがある場合（最終メッセージ）
                        elif 'message' in chunk:
                            message = chunk['message']
                            if isinstance(message, dict) and 'content' in message:
                                content = message['content']
                                if isinstance(content, list) and len(content) > 0:
                                    if isinstance(content[0], dict) and 'text' in content[0]:
                                        # 最終メッセージは既にfull_responseに含まれているのでスキップ
                                        continue

                        # その他の内部イベント（init_event_loop, start, result等）はスキップ
                        else:
                            # デバッグ用にログ出力（JSONパースには含めない）
                            if DEBUG_STREAMING:
                                print(f"  🔍 [{agent_id.upper()}] Internal event: {list(chunk.keys())}")
                            continue

                    elif isinstance(chunk, str):
                        chunk_text = chunk

                    # 空のチャンクはスキップ
                    if not chunk_text:
                        continue

                    # 賢者ごとのバッファに蓄積（ログ行を除外）
                    if agent_id in self.sage_states and self._is_content_chunk(chunk_text):
                        self.sage_states[agent_id]["buffer"] += chunk_text

                    full_response += chunk_text

                    # チャンクイベント（思考プロセスの一部）
                    yield self._create_sse_event("agent_thinking", {
                        "text": chunk_text,
                        "trace_id": trace_id
                    }, agent_id=agent_id)

                # ⭐ 正常完了時の処理
                # 最終チャンクを処理してJSONパース
                if agent_id in self.sage_states:
                    # JSONパースを試行
                    decision_data = self._parse_sage_decision(agent_id)
                    if decision_data:
                        self.sage_states[agent_id]["decision"] = decision_data
                        self.sage_states[agent_id]["completed"] = True

                # 最終レスポンスイベント
                yield self._create_sse_event("agent_chunk", {
                    "text": full_response,
                    "trace_id": trace_id
                }, agent_id=agent_id)

                # ステートマシンから正しい判定を取得
                if agent_id in self.sage_states and self.sage_states[agent_id]["decision"]:
                    result = self.sage_states[agent_id]["decision"]

                    print(f"  ✅ {agent_id.upper()}: {result.get('decision')} (confidence: {result.get('confidence')})")

                    # 完了イベント
                    yield self._create_sse_event("agent_complete", result, agent_id=agent_id)
                else:
                    # フォールバック: 従来の方法でパース
                    print(f"  ⚠️ {agent_id.upper()}: Using fallback parsing")
                    result = {
                        "decision": "ABSTAINED",
                        "reasoning": full_response[:200],
                        "confidence": 0.5
                    }
                    yield self._create_sse_event("agent_complete", result, agent_id=agent_id)

            # ⭐⭐⭐ タイムアウト時のグレースフルデグラデーション ⭐⭐⭐
            except asyncio.TimeoutError:
                print(f"  ⚠️ {agent_id.upper()} TIMEOUT after {timeout_seconds}s")

                # グレースフルデグラデーション: 部分応答があればそれを使用
                if full_response:
                    print(f"  ℹ️  {agent_id.upper()} partial response: {len(full_response)} chars")
                    if DEBUG_STREAMING:
                        print(f"  🔍 Partial response preview: {full_response[:200]}...")

                # タイムアウト時のデフォルト結果（ABSTAINED）
                timeout_result = {
                    "decision": "ABSTAINED",
                    "reasoning": f"Timeout after {timeout_seconds}s. " + (
                        f"Partial response ({len(full_response)} chars): {full_response[:100]}..."
                        if full_response else "No response received."
                    ),
                    "confidence": 0.0
                }

                # タイムアウトイベントを送信
                yield self._create_sse_event("agent_timeout", {
                    "timeout": timeout_seconds,
                    "elapsed": asyncio.get_event_loop().time() - start_time,
                    "partial_response": full_response[:200] if full_response else None,
                    "trace_id": trace_id
                }, agent_id=agent_id)

                # 完了イベント（ABSTAINED判定）
                yield self._create_sse_event("agent_complete", timeout_result, agent_id=agent_id)

        except Exception as e:
            print(f"  ❌ {agent_id.upper()} failed: {e}")

            # エラー時もデフォルト結果を返す
            default_result = {
                "decision": "ABSTAINED",
                "reasoning": f"エラーが発生しました: {str(e)}",
                "confidence": 0.0
            }

            # エラーイベント
            yield self._create_sse_event("error", {
                "error": str(e),
                "trace_id": trace_id
            }, agent_id=agent_id)

            # 完了イベント（デフォルト結果）
            yield self._create_sse_event("agent_complete", default_result, agent_id=agent_id)
    
    async def _solomon_judgment_stream(
        self,
        sage_responses: list,
        question: str,
        trace_id: str,
        custom_role: Optional[str] = None
    ):
        """
        SOLOMON Judgeによる統合評価（ストリーミング版）

        Strands Agentsのストリーミング機能を使用して、
        評価プロセスをリアルタイムで表示します。

        Args:
            sage_responses: 3賢者の判断結果
            question: 質問
            trace_id: トレースID
            custom_role: カスタムロール（省略時はデフォルトを使用）
        """
        try:
            # 3賢者のデータが不足している場合の警告
            if len(sage_responses) < 3:
                print(f"  ⚠️ SOLOMON: Only {len(sage_responses)}/3 sages responded")
            
            # ステートマシンから正確な賢者データを取得
            sage_data = []
            for agent_id in ["caspar", "balthasar", "melchior"]:
                if agent_id in self.sage_states and self.sage_states[agent_id]["decision"]:
                    decision_data = self.sage_states[agent_id]["decision"]
                    sage_data.append({
                        "agent": agent_id,
                        "decision": decision_data.get("decision", "ABSTAINED"),
                        "reasoning": decision_data.get("reasoning", "No reasoning provided"),
                        "confidence": decision_data.get("confidence", 0.5)
                    })
                else:
                    # フォールバック: sage_responsesから取得
                    fallback_data = next((r for r in sage_responses if r.get('agent_id') == agent_id), None)
                    if fallback_data:
                        sage_data.append({
                            "agent": agent_id,
                            "decision": fallback_data.get("decision", "ABSTAINED"),
                            "reasoning": fallback_data.get("reasoning", "No reasoning provided"),
                            "confidence": fallback_data.get("confidence", 0.5)
                        })
                    else:
                        sage_data.append({
                            "agent": agent_id,
                            "decision": "ABSTAINED",
                            "reasoning": f"No response from {agent_id}",
                            "confidence": 0.0
                        })
            
            # 3賢者の結果をフォーマット
            sage_summary = json.dumps(sage_data, ensure_ascii=False, indent=2)
            
            if DEBUG_STREAMING:
                print(f"  🔍 SOLOMON input data:")
                print(f"    Sage responses count: {len(sage_responses)}")
                print(f"    State machine data: {len([s for s in self.sage_states.values() if s['decision']])}")
                print(f"    Final sage data: {sage_summary}")
            
            # SOLOMONプロンプトを構築
            if custom_role:
                # カスタムロール
                solomon_role = custom_role
            else:
                # デフォルトロール
                solomon_role = DEFAULT_SOLOMON_ROLE

            # {sage_responses}プレースホルダーの自動挿入
            # カスタムプロンプトに{sage_responses}が含まれていない場合、自動的に追加
            if '{sage_responses}' not in solomon_role:
                print("  ℹ️  SOLOMON: {sage_responses}プレースホルダーが見つかりません。自動的に末尾に追加します")
                solomon_role += "\n\n【入力】\n3賢者の判断結果：\n{sage_responses}"

            # 3賢者の結果を埋め込み
            solomon_role_with_data = solomon_role.format(sage_responses=sage_summary)

            # 動的JSON形式を追加
            solomon_json_format = _get_solomon_json_format(self.solomon_max_length)
            solomon_prompt = solomon_role_with_data + solomon_json_format

            # ⭐ タイムアウト値を取得（環境変数: MAGI_SOLOMON_TIMEOUT_SECONDS、デフォルト: 60秒）
            timeout_seconds = self.timeout_config.solomon_timeout_seconds

            if DEBUG_STREAMING:
                print(f"  ⏱️  SOLOMON timeout: {timeout_seconds}s")

            # Strands Agentsのストリーミング機能を使用
            # stream_async()メソッドで非同期ストリーミング
            full_response = ""
            chunk_count = 0

            if DEBUG_STREAMING:
                print(f"  🔍 DEBUG: Starting Solomon stream_async()...")
                print(f"  🔍 DEBUG: sage_responses count: {len(sage_responses)}")

            # ⭐ タイムアウト処理付きでLLM呼び出しを実行
            # タイムアウトトラッキング用の変数
            start_time = asyncio.get_event_loop().time()

            try:
                # stream_async()メソッドで非同期ストリーミング
                async for chunk in self.solomon.stream_async(question, system_prompt=solomon_prompt):
                    # ⭐ タイムアウトチェック
                    elapsed = asyncio.get_event_loop().time() - start_time
                    if elapsed > timeout_seconds:
                        raise asyncio.TimeoutError(f"SOLOMON exceeded timeout of {timeout_seconds}s")

                    chunk_count += 1

                    # チャンクからテキストを抽出
                    chunk_text = None

                    if isinstance(chunk, dict):
                        # Strands Agentsの内部イベントをフィルタリング
                        # 'event'キーがある場合のみ処理（LLM応答イベント）
                        if 'event' in chunk:
                            event_data = chunk['event']

                            # contentBlockDelta から実際のテキストを抽出
                            if isinstance(event_data, dict) and 'contentBlockDelta' in event_data:
                                delta = event_data['contentBlockDelta'].get('delta', {})
                                if isinstance(delta, dict) and 'text' in delta:
                                    chunk_text = delta['text']

                        # 'message'キーがある場合（最終メッセージ）
                        elif 'message' in chunk:
                            # 最終メッセージは既にfull_responseに含まれているのでスキップ
                            continue

                        # その他の内部イベント（init_event_loop, start, result等）はスキップ
                        else:
                            # デバッグ用にログ出力（JSONパースには含めない）
                            if DEBUG_STREAMING:
                                print(f"  🔍 [SOLOMON] Internal event: {list(chunk.keys())}")
                            continue

                    elif isinstance(chunk, str):
                        chunk_text = chunk

                    # 空のチャンクはスキップ
                    if not chunk_text:
                        continue

                    full_response += chunk_text

                    # チャンクイベント（思考プロセスの一部）
                    yield self._create_sse_event("judge_thinking", {
                        "text": chunk_text,
                        "trace_id": trace_id
                    })

                # ⭐ 正常完了時の処理
                if DEBUG_STREAMING:
                    print(f"  🔍 DEBUG: Solomon stream completed. Chunks: {chunk_count}, Response length: {len(full_response)}")

                # 最終レスポンスイベント
                yield self._create_sse_event("judge_chunk", {
                    "text": full_response,
                    "trace_id": trace_id
                })

                # JSON部分を抽出
                try:
                    if DEBUG_STREAMING:
                        print(f"  🔍 DEBUG: Attempting to parse JSON from response (length: {len(full_response)})")

                    if not full_response or len(full_response) < 10:
                        raise ValueError(f"Solomon response too short or empty: '{full_response}'")

                    json_text = self._extract_json_block(full_response, '"final_decision"')

                    if not json_text and '{' in full_response:
                        json_start = full_response.find('{')
                        json_end = full_response.rfind('}') + 1
                        json_text = full_response[json_start:json_end]

                    if not json_text:
                        json_text = full_response.strip()

                    if DEBUG_STREAMING:
                        print(f"  🔍 DEBUG: Extracted JSON text (length: {len(json_text)}): {json_text[:100]}...")

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

            # ⭐⭐⭐ タイムアウト時のグレースフルデグラデーション ⭐⭐⭐
            except asyncio.TimeoutError:
                print(f"  ⚠️ SOLOMON TIMEOUT after {timeout_seconds}s")

                # グレースフルデグラデーション: 部分応答があればそれを使用
                if full_response:
                    print(f"  ℹ️  SOLOMON partial response: {len(full_response)} chars")
                    if DEBUG_STREAMING:
                        print(f"  🔍 Partial response preview: {full_response[:200]}...")

                # タイムアウト時のデフォルト結果（REJECTED、confidence=0.5）
                timeout_result = {
                    "final_decision": "REJECTED",
                    "reasoning": f"SOLOMON evaluation timed out after {timeout_seconds}s. " + (
                        f"Partial response ({len(full_response)} chars): {full_response[:100]}..."
                        if full_response else "No response received."
                    ),
                    "confidence": 0.5,
                    "sage_scores": {
                        "caspar": 50,
                        "balthasar": 50,
                        "melchior": 50
                    }
                }

                # タイムアウトイベントを送信
                yield self._create_sse_event("judge_timeout", {
                    "timeout": timeout_seconds,
                    "elapsed": asyncio.get_event_loop().time() - start_time,
                    "partial_response": full_response[:200] if full_response else None,
                    "trace_id": trace_id
                })

                # 完了イベント（REJECTED判定）
                yield self._create_sse_event("judge_complete", timeout_result)

        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"  ❌ SOLOMON failed: {e}")
            print(f"  🔍 DEBUG: Full error trace:\n{error_detail}")
            
            # エラー時もデフォルト結果を返す（信頼度を0.5に設定）
            default_result = {
                "final_decision": "REJECTED",
                "reasoning": f"SOLOMON評価中にエラーが発生しました: {str(e)}",
                "confidence": 0.5,  # エラー時でも0.5の信頼度を設定
                "sage_scores": {
                    "caspar": 50,
                    "balthasar": 50,
                    "melchior": 50
                }
            }
            
            if DEBUG_STREAMING:
                print(f"  🔍 SOLOMON error details: {e}")
                print(f"  🔍 Sage responses received: {len(sage_responses)}")
                print(f"  🔍 State machine status: {[(k, v['completed']) for k, v in self.sage_states.items()]}")
            
            # エラーイベント
            yield self._create_sse_event("judge_error", {
                "error": str(e),
                "error_type": type(e).__name__,
                "trace_id": trace_id
            })
            
            # 完了イベント（デフォルト結果）
            yield self._create_sse_event("judge_complete", default_result)
    
    async def _merge_streams(self, tasks):
        """
        複数のストリームを真の並列実行でマージ
        
        3賢者が同時に思考・応答し、リアルタイムでイベントをストリーミングします。
        """
        import asyncio
        from asyncio import Queue
        
        # 各タスクの出力を収集するキュー
        event_queue = Queue()
        
        async def task_wrapper(task, task_id):
            """タスクをラップしてキューに出力"""
            try:
                async for event in task:
                    await event_queue.put((task_id, event))
            except Exception as e:
                await event_queue.put((task_id, {
                    'type': 'error',
                    'agentId': task_id,
                    'data': {
                        'error': str(e)
                    }
                }))
            finally:
                await event_queue.put((task_id, None))  # 終了マーカー
        
        # 並列実行開始
        async def run_parallel_tasks():
            tasks_to_run = []
            for i, task in enumerate(tasks):
                task_name = f"sage_{i}"
                tasks_to_run.append(asyncio.create_task(task_wrapper(task, task_name)))
            
            # 全タスクの完了を待機
            await asyncio.gather(*tasks_to_run, return_exceptions=True)
        
        # バックグラウンドでタスクを実行
        parallel_task = asyncio.create_task(run_parallel_tasks())
        
        # 完了カウンター
        completed_tasks = 0
        total_tasks = len(tasks)
        
        # イベントを順次処理
        while completed_tasks < total_tasks:
            try:
                # タイムアウト付きでイベントを取得
                task_id, event = await asyncio.wait_for(event_queue.get(), timeout=60.0)
                
                if event is None:  # 終了マーカー
                    completed_tasks += 1
                    print(f"  ✅ Task {task_id} completed ({completed_tasks}/{total_tasks})")
                else:
                    yield event
                    
            except asyncio.TimeoutError:
                print("  ⚠️ Timeout waiting for sage responses")
                break
        
        # 並列タスクの完了を確認
        if not parallel_task.done():
            parallel_task.cancel()
            try:
                await parallel_task
            except asyncio.CancelledError:
                pass
    
    def _create_sse_event(self, event_type: str, data: Dict[str, Any], agent_id: Optional[str] = None) -> Dict[str, Any]:
        """
        イベントを作成（AgentCore Runtimeが自動的にSSE形式に変換）

        フロントエンドとの互換性のため、agentIdをトップレベルに配置します。

        Args:
            event_type: イベントタイプ
            data: イベントデータ
            agent_id: エージェントID（省略可、指定時はトップレベルに"agentId"として追加）

        DEBUG_STREAMING=true の場合、コンソールにイベントを表示します。
        """
        event = {
            "type": event_type,
            "data": data
        }

        # agentIdをトップレベルに配置（フロントエンド互換性）
        if agent_id:
            event["agentId"] = agent_id

        # デバッグモード: ストリーミングイベントをコンソールに表示
        if DEBUG_STREAMING:
            self._log_streaming_event(event_type, data, agent_id)

        return event
    
    def _log_streaming_event(self, event_type: str, data: Dict[str, Any], agent_id: Optional[str] = None):
        """
        ストリーミングイベントをコンソールに表示（デバッグ用）

        Args:
            event_type: イベントタイプ
            data: イベントデータ
            agent_id: エージェントID（オプション）
        
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
        
        elif event_type == "agent_start":
            agent_name = (agent_id or 'unknown').upper()
            print(f"[{timestamp}] 🤖 AGENT_START: {agent_name}")

        elif event_type == "agent_thinking":
            agent_name = (agent_id or 'unknown').upper()
            text = data.get('text', '')
            # 思考プロセスをリアルタイム表示
            print(f"[{timestamp}] 💭 THINKING: {agent_name}")
            print(f"  {text}")

        elif event_type == "agent_chunk":
            agent_name = (agent_id or 'unknown').upper()
            text = data.get('text', '')
            # チャンクが長い場合は省略表示
            display_text = text[:100] + "..." if len(text) > 100 else text
            print(f"[{timestamp}] 💭 AGENT_CHUNK: {agent_name}")
            print(f"  {display_text}\n")

        elif event_type == "agent_complete":
            agent_name = (agent_id or 'unknown').upper()
            decision = data.get('decision', 'N/A')
            confidence = data.get('confidence', 0.0)
            reasoning = data.get('reasoning', 'N/A')
            print(f"[{timestamp}] ✅ AGENT_COMPLETE: {agent_name}")
            print(f"  Decision: {decision}")
            print(f"  Confidence: {confidence:.2f}")
            print(f"  Reasoning: {reasoning[:80]}...")
            print()
        
        elif event_type == "judge_start":
            print(f"[{timestamp}] ⚖️  JUDGE_START")
            print(f"  SOLOMON evaluating 3 sages' responses...\n")
        
        elif event_type == "judge_thinking":
            text = data.get('text', '')
            # 思考プロセスをリアルタイム表示
            print(f"[{timestamp}] 💭 JUDGE_THINKING")
            print(f"  {text}")

        elif event_type == "judge_chunk":
            text = data.get('text', '')
            display_text = text[:100] + "..." if len(text) > 100 else text
            print(f"[{timestamp}] 💭 JUDGE_CHUNK")
            print(f"  {display_text}\n")
        
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


# グローバルインスタンス（子プロセス実行用）
print("✅ 3賢者 + SOLOMON Judge 初期化完了")


async def main():
    """
    子プロセスとしてのメイン実行関数
    標準入力からJSONを受け取り、標準出力にストリーミング結果を出力
    """
    try:
        # 標準入力からリクエストデータを読み取り
        import sys
        input_data = sys.stdin.read()
        
        if not input_data.strip():
            print(json.dumps({
                "type": "error",
                "data": {"error": "No input data received", "code": "INPUT_ERROR"},
                "timestamp": datetime.now().isoformat()
            }), flush=True)
            return
        
        # JSONデータをパース
        try:
            payload = json.loads(input_data)
        except json.JSONDecodeError as e:
            print(json.dumps({
                "type": "error", 
                "data": {"error": f"Invalid JSON: {e}", "code": "JSON_PARSE_ERROR"},
                "timestamp": datetime.now().isoformat()
            }), flush=True)
            return
        
        # カスタムプロンプトの取得（リクエストレベルで指定可能）
        request_custom_prompts = payload.get('custom_prompts', {})

        # MAGI決定プロセスを実行
        # 環境変数のカスタムプロンプトは __init__ で自動的に読み込まれる
        # リクエストレベルのカスタムプロンプトは process_decision_stream で使用される
        magi_strands = MAGIStrandsAgent()

        async for event in magi_strands.process_decision_stream(payload):
            # 各イベントをJSON行として出力
            print(json.dumps(event), flush=True)
            
    except Exception as e:
        # 予期しないエラーの処理
        print(json.dumps({
            "type": "error",
            "data": {"error": f"Unexpected error: {str(e)}", "code": "SYSTEM_ERROR"},
            "timestamp": datetime.now().isoformat()
        }), flush=True)


if __name__ == "__main__":
    # 常に子プロセスとして実行（Next.jsから呼び出される）
    print(json.dumps({
        "type": "start",
        "data": {"message": "MAGI Strands Agent started as subprocess"},
        "timestamp": datetime.now().isoformat()
    }), flush=True)
    
    # 非同期メイン関数を実行
    asyncio.run(main())
