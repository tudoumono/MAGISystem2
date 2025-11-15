/**
 * Bedrock Multi-Agent Collaboration Client
 * 
 * このファイルはフロントエンドからAmazon Bedrock Multi-Agent Collaborationとの
 * 統合を行うクライアントライブラリです。
 * 
 * 主要機能:
 * - Bedrock Agent Gateway APIとの通信
 * - リアルタイムトレース更新の処理
 * - エラーハンドリングとリトライロジック
 * - レスポンスキャッシュとパフォーマンス最適化
 * 
 * 学習ポイント:
 * - AWS Amplify Gen2でのカスタムAPI統合
 * - TypeScript型安全性の確保
 * - 非同期処理とエラーハンドリング
 */

import { generateClient } from 'aws-amplify/api';
import { AskAgentRequest, AskAgentResponse, APIError } from '@/types/api';
import { AgentConfig } from '@/types/domain';

/**
 * Amplify APIクライアントの初期化
 * 
 * 学習ポイント:
 * - Amplify Gen2のAPI統合方法
 * - 型安全なAPIクライアントの作成
 * - 認証情報の自動管理
 */
const apiClient = generateClient();

/**
 * Bedrock Multi-Agent Collaboration Client Class
 * 
 * 設計理由:
 * - シングルトンパターンによるクライアント管理
 * - メソッドチェーンによる使いやすいAPI
 * - 内部状態管理とキャッシュ機能
 * 
 * 学習ポイント:
 * - クラスベースのAPI設計
 * - 非同期処理の管理
 * - エラーハンドリング戦略
 */
export class BedrockAgentClient {
  private static instance: BedrockAgentClient;
  private requestCache = new Map<string, AskAgentResponse>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5分

  /**
   * シングルトンインスタンスの取得
   */
  public static getInstance(): BedrockAgentClient {
    if (!BedrockAgentClient.instance) {
      BedrockAgentClient.instance = new BedrockAgentClient();
    }
    return BedrockAgentClient.instance;
  }

  /**
   * MAGI Decision Systemの実行
   * 
   * 設計理由:
   * - 統一されたAPIインターフェース
   * - 自動リトライとエラーハンドリング
   * - レスポンスキャッシュによるパフォーマンス最適化
   * 
   * 学習ポイント:
   * - REST API呼び出しの実装
   * - エラーレスポンスの処理
   * - キャッシュ戦略の実装
   */
  public async executeMAGIDecision(
    request: AskAgentRequest,
    options?: {
      useCache?: boolean;
      timeout?: number;
      retryCount?: number;
    }
  ): Promise<AskAgentResponse> {
    const {
      useCache = true,
      timeout = 30000, // 30秒
      retryCount = 2
    } = options || {};

    // キャッシュチェック
    if (useCache) {
      const cacheKey = this.generateCacheKey(request);
      const cachedResponse = this.requestCache.get(cacheKey);
      
      if (cachedResponse) {
        console.log('Bedrock Agent Client: Using cached response');
        return cachedResponse;
      }
    }

    // リトライロジック付きでAPI呼び出し
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        console.log(`Bedrock Agent Client: Attempt ${attempt + 1}/${retryCount + 1}`);
        
        const response = await this.callBedrockAPI(request, timeout);
        
        // 成功時のキャッシュ保存
        if (useCache) {
          const cacheKey = this.generateCacheKey(request);
          this.requestCache.set(cacheKey, response);
          
          // キャッシュの自動削除
          setTimeout(() => {
            this.requestCache.delete(cacheKey);
          }, this.cacheTimeout);
        }
        
        return response;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Bedrock Agent Client: Attempt ${attempt + 1} failed:`, error);
        
        // 最後の試行でない場合は待機
        if (attempt < retryCount) {
          const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ
          console.log(`Bedrock Agent Client: Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // 全ての試行が失敗した場合
    throw new Error(`Bedrock Agent execution failed after ${retryCount + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Bedrock API の直接呼び出し
   * 
   * 設計理由:
   * - タイムアウト制御
   * - レスポンス検証
   * - エラー分類と適切な例外処理
   * 
   * 学習ポイント:
   * - fetch APIの使用方法
   * - AbortControllerによるタイムアウト制御
   * - HTTPステータスコードの処理
   */
  private async callBedrockAPI(
    request: AskAgentRequest,
    timeout: number
  ): Promise<AskAgentResponse> {
    // タイムアウト制御
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Backend APIのベースURLを環境変数から取得
      const backendUrl = process.env.NEXT_PUBLIC_AGENTCORE_URL || 'http://localhost:8080';

      // API呼び出し
      const response = await fetch(`${backendUrl}/api/bedrock-agents/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // レスポンス検証
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw createAPIError(
          errorData.message || 'Bedrock Agent execution failed',
          response.status,
          errorData.code || 'BEDROCK_API_ERROR'
        );
      }

      const data: AskAgentResponse = await response.json();
      
      // レスポンス構造の検証
      this.validateResponse(data);
      
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw createAPIError(
          'Bedrock Agent execution timed out',
          408,
          'BEDROCK_TIMEOUT'
        );
      }
      
      throw error;
    }
  }

  /**
   * レスポンス構造の検証
   * 
   * 設計理由:
   * - 型安全性の確保
   * - 不正なレスポンスの早期検出
   * - デバッグ情報の提供
   */
  private validateResponse(response: any): asserts response is AskAgentResponse {
    const requiredFields = [
      'conversationId',
      'messageId', 
      'agentResponses',
      'judgeResponse',
      'traceId',
      'executionTime',
      'timestamp'
    ];

    for (const field of requiredFields) {
      if (!(field in response)) {
        throw createAPIError(
          `Invalid response: missing field '${field}'`,
          500,
          'INVALID_RESPONSE_STRUCTURE'
        );
      }
    }

    // エージェント応答の検証
    if (!Array.isArray(response.agentResponses) || response.agentResponses.length !== 3) {
      throw createAPIError(
        'Invalid response: agentResponses must be an array of 3 elements',
        500,
        'INVALID_AGENT_RESPONSES'
      );
    }

    // Judge応答の検証
    if (!response.judgeResponse || typeof response.judgeResponse !== 'object') {
      throw createAPIError(
        'Invalid response: judgeResponse must be an object',
        500,
        'INVALID_JUDGE_RESPONSE'
      );
    }
  }

  /**
   * キャッシュキーの生成
   * 
   * 設計理由:
   * - 一意性の確保
   * - 設定変更の反映
   * - セキュリティ考慮（機密情報の除外）
   */
  private generateCacheKey(request: AskAgentRequest): string {
    const keyData = {
      message: request.message,
      agentConfig: request.agentConfig?.map(config => ({
        agentId: config.agentId,
        modelId: config.modelId,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      })) || 'default',
    };
    
    return btoa(JSON.stringify(keyData));
  }

  /**
   * キャッシュのクリア
   * 
   * 使用例:
   * - 設定変更時
   * - メモリ使用量制限時
   * - デバッグ時
   */
  public clearCache(): void {
    this.requestCache.clear();
    console.log('Bedrock Agent Client: Cache cleared');
  }

  /**
   * キャッシュ統計の取得
   * 
   * 使用例:
   * - パフォーマンス監視
   * - デバッグ情報
   * - 使用状況分析
   */
  public getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
    };
  }
}

/**
 * APIError作成ヘルパー関数
 */
function createAPIError(
  message: string,
  statusCode: number,
  code: string,
  retryable?: boolean
): APIError {
  // リトライ可能性の判定
  const isRetryable = retryable ?? (() => {
    // 5xx系エラーは一般的にリトライ可能
    if (statusCode >= 500) return true;
    
    // 特定のエラーコードはリトライ可能
    const retryableCodes = [
      'BEDROCK_TIMEOUT',
      'RATE_LIMIT_EXCEEDED',
      'SERVICE_UNAVAILABLE',
    ];
    
    return retryableCodes.includes(code);
  })();

  return {
    message,
    code,
    timestamp: new Date(),
    retryable: isRetryable,
  };
}

/**
 * デフォルトクライアントインスタンスのエクスポート
 * 
 * 使用例:
 * ```typescript
 * import { bedrockAgentClient } from '@/lib/agents/bedrock-client';
 * 
 * const response = await bedrockAgentClient.executeMAGIDecision({
 *   message: 'AIシステムを導入すべきでしょうか？',
 * });
 * ```
 */
export const bedrockAgentClient = BedrockAgentClient.getInstance();

/**
 * React Hook用のラッパー関数
 * 
 * 設計理由:
 * - React Hooksとの統合
 * - 状態管理の簡素化
 * - エラーハンドリングの統一
 */
export async function executeMAGIDecisionWithBedrock(
  request: AskAgentRequest,
  options?: {
    useCache?: boolean;
    timeout?: number;
    retryCount?: number;
  }
): Promise<AskAgentResponse> {
  return bedrockAgentClient.executeMAGIDecision(request, options);
}

/**
 * 設定プリセットの適用
 * 
 * 設計理由:
 * - プリセット管理の統合
 * - 設定変更の簡素化
 * - 一貫性の確保
 */
export function applyAgentPreset(
  request: AskAgentRequest,
  presetConfigs: AgentConfig[]
): AskAgentRequest {
  return {
    ...request,
    agentConfig: presetConfigs,
  };
}

/**
 * デバッグ用ユーティリティ
 * 
 * 使用例:
 * - 開発時のデバッグ
 * - パフォーマンス分析
 * - エラー調査
 */
export const BedrockAgentDebug = {
  /**
   * クライアント状態の取得
   */
  getClientState: () => ({
    cacheStats: bedrockAgentClient.getCacheStats(),
    timestamp: new Date().toISOString(),
  }),

  /**
   * キャッシュのクリア
   */
  clearCache: () => bedrockAgentClient.clearCache(),

  /**
   * テスト用のモック実行
   */
  mockExecution: async (request: AskAgentRequest): Promise<AskAgentResponse> => {
    console.log('Bedrock Agent Debug: Mock execution', request);
    
    // モックレスポンスの生成
    return {
      conversationId: `mock_conv_${Date.now()}`,
      messageId: `mock_msg_${Date.now()}`,
      agentResponses: [
        {
          agentId: 'caspar',
          decision: 'REJECTED',
          content: 'モック応答: 慎重な検討が必要です。',
          reasoning: 'モック応答: リスク分析の結果',
          confidence: 0.85,
          executionTime: 1200,
        },
        {
          agentId: 'balthasar',
          decision: 'APPROVED',
          content: 'モック応答: 革新的なアイデアです！',
          reasoning: 'モック応答: 創造性の観点から評価',
          confidence: 0.92,
          executionTime: 980,
        },
        {
          agentId: 'melchior',
          decision: 'APPROVED',
          content: 'モック応答: データ分析の結果、実行可能です。',
          reasoning: 'モック応答: 科学的分析による結論',
          confidence: 0.78,
          executionTime: 1450,
        },
      ],
      judgeResponse: {
        finalDecision: 'APPROVED',
        votingResult: { approved: 2, rejected: 1, abstained: 0 },
        scores: [
          { agentId: 'caspar', score: 75, reasoning: 'モック評価: 慎重で現実的' },
          { agentId: 'balthasar', score: 88, reasoning: 'モック評価: 創造的で前向き' },
          { agentId: 'melchior', score: 82, reasoning: 'モック評価: バランス良好' },
        ],
        summary: 'モック応答: 3賢者の判断を総合評価',
        finalRecommendation: 'モック応答: 段階的実装を推奨',
        reasoning: 'モック応答: 多数決により可決',
        confidence: 0.85,
      },
      traceId: `mock_trace_${Date.now()}`,
      executionTime: 1450,
      timestamp: new Date(),
    };
  },
};