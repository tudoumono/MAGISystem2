"""
CASPAR Bedrock Agent Implementation - 保守的・現実的な賢者

実際のAmazon Bedrock Claude APIを使用したCASPARエージェントの実装。
保守的で現実的な視点から意思決定を行います。

学習ポイント:
- Bedrock Runtime APIの実際の使用
- 保守的な意思決定ロジックの実装
- エラーハンドリングとリトライ機構
"""

import json
import time
import asyncio
import boto3
from typing import Dict, Any, Optional
from datetime import datetime

# 共通型定義のインポート
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.types import AgentType, DecisionType, AgentResponse
from shared.prompts import CASPAR_SYSTEM_PROMPT
from shared.utils import format_execution_time, validate_decision_confidence


class CasparBedrockAgent:
    """
    CASPAR Bedrock Agent - 保守的・現実的な賢者
    
    実際のAmazon Bedrock Claude APIを使用して、
    保守的で現実的な視点から意思決定を行います。
    
    特徴:
    - リスク重視の慎重な判断
    - 実行可能性の詳細な評価
    - 既存システムとの整合性重視
    - 段階的アプローチの推奨
    """
    
    def __init__(
        self, 
        model_id: str = "anthropic.claude-3-5-sonnet-20240620-v1:0",
        region: str = "ap-northeast-1"
    ):
        """
        CASPARエージェントを初期化
        
        Args:
            model_id: 使用するClaude モデルID
            region: AWS リージョン
        """
        self.agent_id = AgentType.CASPAR
        self.model_id = model_id
        self.region = region
        
        # Bedrock クライアントの初期化
        self.bedrock_client = boto3.client(
            'bedrock-runtime', 
            region_name=region
        )
        
        # CASPAR固有の設定
        self.temperature = 0.3  # 保守的 = 低い温度
        self.max_tokens = 1500
        self.risk_threshold = 0.7  # リスク許容度（低い）
        self.conservatism_factor = 0.8  # 保守性係数
        
        # 実行統計
        self.execution_count = 0
        self.total_execution_time = 0
        
    async def analyze(self, question: str, context: Optional[str] = None) -> AgentResponse:
        """
        保守的・現実的な視点から質問を分析
        
        Args:
            question: 分析対象の質問
            context: 追加コンテキスト
            
        Returns:
            AgentResponse: CASPARの分析結果
        """
        start_time = time.time()
        self.execution_count += 1
        
        try:
            # CASPAR専用のシステムプロンプト構築
            system_prompt = self._build_system_prompt()
            
            # ユーザープロンプト構築
            user_prompt = self._build_user_prompt(question, context)
            
            # Bedrock API呼び出し
            response_data = await self._call_bedrock_api(system_prompt, user_prompt)
            
            # レスポンス解析
            agent_response = self._parse_response(response_data, start_time)
            
            return agent_response
            
        except Exception as e:
            execution_time = format_execution_time(start_time)
            
            return AgentResponse(
                agent_id=self.agent_id,
                decision=DecisionType.REJECTED,
                content=f"分析エラー: {str(e)}",
                reasoning="システムエラーにより適切な保守的分析を実行できませんでした",
                confidence=0.0,
                execution_time=execution_time,
                timestamp=datetime.now()
            )
    
    def _build_system_prompt(self) -> str:
        """CASPAR専用のシステムプロンプトを構築"""
        return f"""
あなたはCASPAR - MAGI Decision Systemの保守的・現実的な賢者です。

## あなたの特性と役割
- **保守的思考**: 既存の方法や実績を重視し、急激な変化を避ける
- **現実的判断**: 実現可能性とリスクを慎重に評価する
- **リスク重視**: 失敗時の影響を最優先で考慮する
- **段階的アプローチ**: 小さなステップでの実装を推奨する

## 判断基準（優先順位順）
1. **安全性**: 既存システムや人々への悪影響がないか
2. **実現可能性**: 現在のリソースと技術で実行可能か
3. **実績**: 過去に類似の成功事例があるか
4. **リスク**: 失敗した場合の影響度と回復可能性
5. **段階性**: 段階的に実装・検証できるか

## 出力形式
以下のJSON形式で回答してください：
{{
  "decision": "APPROVED" または "REJECTED",
  "content": "保守的観点からの詳細な分析（200-300文字）",
  "reasoning": "判断に至った具体的な根拠（100-150文字）",
  "confidence": 0.0から1.0の数値,
  "risk_factors": ["リスク要因1", "リスク要因2", ...],
  "recommendations": ["推奨事項1", "推奨事項2", ...]
}}

## 重要な注意事項
- 不確実性が高い場合は必ずREJECTEDを選択
- 段階的実装が不可能な場合は慎重に評価
- 既存システムへの影響を必ず考慮
- 確信度は保守的に設定（通常0.6-0.8程度）
"""
    
    def _build_user_prompt(self, question: str, context: Optional[str] = None) -> str:
        """ユーザープロンプトを構築"""
        prompt = f"""
以下の質問について、あなたの保守的・現実的な視点から分析し、判断してください。

## 質問
{question}
"""
        
        if context:
            prompt += f"""
## 追加コンテキスト
{context}
"""
        
        prompt += """
## 分析要求
1. リスク要因を特定してください
2. 実現可能性を評価してください  
3. 既存システムへの影響を考慮してください
4. 段階的実装の可能性を検討してください
5. 最終的な判断（APPROVED/REJECTED）を決定してください

保守的な観点から慎重に分析し、指定されたJSON形式で回答してください。
"""
        
        return prompt
    
    async def _call_bedrock_api(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """
        Bedrock APIを呼び出し
        
        Args:
            system_prompt: システムプロンプト
            user_prompt: ユーザープロンプト
            
        Returns:
            Dict[str, Any]: APIレスポンス
        """
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        }
        
        # 非同期でBedrock API呼び出し（実際にはsyncだが、将来の拡張のため）
        loop = asyncio.get_event_loop()
        
        response = await loop.run_in_executor(
            None,
            lambda: self.bedrock_client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body),
                contentType='application/json',
                accept='application/json'
            )
        )
        
        response_body = json.loads(response['body'].read())
        return response_body
    
    def _parse_response(self, response_data: Dict[str, Any], start_time: float) -> AgentResponse:
        """
        Bedrock APIレスポンスを解析してAgentResponseに変換
        
        Args:
            response_data: Bedrock APIレスポンス
            start_time: 実行開始時刻
            
        Returns:
            AgentResponse: 解析済みレスポンス
        """
        execution_time = format_execution_time(start_time)
        
        try:
            # Claude レスポンスからテキストを取得
            content_text = response_data['content'][0]['text']
            
            # JSON部分を抽出（```json ブロックがある場合）
            if '```json' in content_text:
                json_start = content_text.find('```json') + 7
                json_end = content_text.find('```', json_start)
                json_text = content_text[json_start:json_end].strip()
            elif '{' in content_text and '}' in content_text:
                # JSON部分を直接抽出
                json_start = content_text.find('{')
                json_end = content_text.rfind('}') + 1
                json_text = content_text[json_start:json_end]
            else:
                # JSONが見つからない場合はテキスト解析
                return self._parse_text_response(content_text, execution_time)
            
            # JSON解析
            parsed_data = json.loads(json_text)
            
            # 必須フィールドの検証
            decision = parsed_data.get('decision', 'REJECTED')
            if decision not in ['APPROVED', 'REJECTED']:
                decision = 'REJECTED'
            
            content = parsed_data.get('content', content_text)
            reasoning = parsed_data.get('reasoning', '解析エラー')
            confidence = float(parsed_data.get('confidence', 0.5))
            
            # 確信度の検証
            confidence = validate_decision_confidence(confidence)
            
            # 保守性係数を適用
            confidence = confidence * self.conservatism_factor
            
            return AgentResponse(
                agent_id=self.agent_id,
                decision=DecisionType(decision),
                content=content,
                reasoning=reasoning,
                confidence=confidence,
                execution_time=execution_time,
                timestamp=datetime.now(),
                toolsUsed=['bedrock-claude-api'],
                citations=[]
            )
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # JSON解析失敗時はテキスト解析にフォールバック
            content_text = response_data['content'][0]['text']
            return self._parse_text_response(content_text, execution_time)
    
    def _parse_text_response(self, content_text: str, execution_time: int) -> AgentResponse:
        """
        テキストレスポンスを解析（JSONパース失敗時のフォールバック）
        
        Args:
            content_text: レスポンステキスト
            execution_time: 実行時間
            
        Returns:
            AgentResponse: 解析済みレスポンス
        """
        # キーワードベースの判断抽出
        text_lower = content_text.lower()
        
        if 'approved' in text_lower or '可決' in text_lower or '承認' in text_lower:
            decision = DecisionType.APPROVED
        else:
            decision = DecisionType.REJECTED  # 保守的にデフォルトは否決
        
        # 確信度の推定（保守的に低めに設定）
        confidence = 0.6 * self.conservatism_factor
        
        return AgentResponse(
            agent_id=self.agent_id,
            decision=decision,
            content=content_text,
            reasoning="テキスト解析による判断（JSON解析失敗のため）",
            confidence=confidence,
            execution_time=execution_time,
            timestamp=datetime.now(),
            toolsUsed=['bedrock-claude-api', 'text-parser'],
            citations=[]
        )
    
    def get_agent_stats(self) -> Dict[str, Any]:
        """エージェント統計を取得"""
        avg_execution_time = (
            self.total_execution_time / self.execution_count 
            if self.execution_count > 0 else 0
        )
        
        return {
            "agent_id": self.agent_id.value,
            "execution_count": self.execution_count,
            "total_execution_time": self.total_execution_time,
            "average_execution_time": avg_execution_time,
            "model_id": self.model_id,
            "region": self.region,
            "temperature": self.temperature,
            "risk_threshold": self.risk_threshold,
            "conservatism_factor": self.conservatism_factor
        }


# テスト用の実行関数
async def test_caspar_agent():
    """CASPARエージェントのテスト"""
    print("🤖 Testing CASPAR Bedrock Agent...")
    
    agent = CasparBedrockAgent()
    
    test_question = "新しいクラウドサービスに全社のデータを移行すべきか？"
    
    try:
        response = await agent.analyze(test_question)
        
        print(f"✅ CASPAR Analysis Complete!")
        print(f"   Decision: {response.decision.value}")
        print(f"   Content: {response.content[:100]}...")
        print(f"   Reasoning: {response.reasoning}")
        print(f"   Confidence: {response.confidence:.2f}")
        print(f"   Execution Time: {response.execution_time}ms")
        
        return response
        
    except Exception as e:
        print(f"❌ CASPAR Test Failed: {e}")
        return None


if __name__ == "__main__":
    # 直接実行時のテスト
    asyncio.run(test_caspar_agent())