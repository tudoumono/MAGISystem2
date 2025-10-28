/**
 * Agent Orchestration and Configuration Management
 * 
 * このファイルはMAGI Decision Systemのエージェントオーケストレーションと
 * 設定管理を行います。
 * 
 * 主要機能:
 * - エージェント実行の調整と管理
 * - 設定プリセットの管理
 * - エラーハンドリングとフォールバック
 * - パフォーマンス監視と最適化
 * 
 * 学習ポイント:
 * - オーケストレーションパターンの実装
 * - 設定管理のベストプラクティス
 * - 非同期処理の調整
 */

import { 
  AgentConfig, 
  AgentPreset, 
  AgentType, 
  AgentResponse, 
  JudgeResponse,
  DecisionType 
} from '@/types/domain';
import { 
  AskAgentRequest, 
  AskAgentResponse, 
  APIError 
} from '@/types/api';
import { bedrockAgentClient } from './bedrock-client';

/**
 * Agent Orchestrator Class
 * 
 * 設計理由:
 * - 中央集権的なエージェント管理
 * - 設定とプリセットの統合管理
 * - 実行フローの標準化
 * 
 * 学習ポイント:
 * - オーケストレーターパターンの実装
 * - 状態管理とライフサイクル管理
 * - エラー回復とフォールバック戦略
 */
export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private currentPreset: AgentPreset | null = null;
  private executionHistory: ExecutionRecord[] = [];
  private readonly maxHistorySize = 100;

  /**
   * シングルトンインスタンスの取得
   */
  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  /**
   * プリセットの設定
   * 
   * 設計理由:
   * - 設定の一元管理
   * - 設定変更の追跡
   * - 検証とエラーハンドリング
   */
  public setPreset(preset: AgentPreset): void {
    // プリセットの検証
    this.validatePreset(preset);
    
    this.currentPreset = preset;
    
    console.log('Agent Orchestrator: Preset applied', {
      presetId: preset.id,
      presetName: preset.name,
      agentCount: preset.configs.length,
    });
  }

  /**
   * 現在のプリセットの取得
   */
  public getCurrentPreset(): AgentPreset | null {
    return this.currentPreset;
  }

  /**
   * MAGI Decision Systemの実行
   * 
   * 設計理由:
   * - 統一されたエントリーポイント
   * - 実行前後の処理の標準化
   * - エラーハンドリングとログ記録
   * 
   * 学習ポイント:
   * - オーケストレーション実行フロー
   * - 実行時間とパフォーマンス監視
   * - エラー分類と回復処理
   */
  public async executeMAGIDecision(
    message: string,
    conversationId?: string,
    customConfig?: AgentConfig[]
  ): Promise<AskAgentResponse> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log('Agent Orchestrator: Starting MAGI execution', {
      executionId,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      conversationId,
      hasCustomConfig: !!customConfig,
      currentPreset: this.currentPreset?.name || 'none',
    });

    try {
      // 1. 設定の準備
      const agentConfig = this.prepareAgentConfig(customConfig);
      
      // 2. リクエストの構築
      const request: AskAgentRequest = {
        message,
        conversationId: conversationId || `conv_${Date.now()}`,
        agentConfig,
      };

      // 3. 実行前の検証
      this.validateExecutionRequest(request);

      // 4. Bedrock Multi-Agent Collaborationの実行
      const response = await bedrockAgentClient.executeMAGIDecision(request, {
        useCache: true,
        timeout: 60000, // 1分
        retryCount: 2,
      });

      // 5. 実行後の処理
      const executionTime = Date.now() - startTime;
      this.recordExecution(executionId, request, response, executionTime, null);

      console.log('Agent Orchestrator: MAGI execution completed', {
        executionId,
        executionTime,
        finalDecision: response.judgeResponse.finalDecision,
        traceId: response.traceId,
      });

      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordExecution(executionId, null, null, executionTime, error as Error);

      console.error('Agent Orchestrator: MAGI execution failed', {
        executionId,
        executionTime,
        error: (error as Error).message,
      });

      // エラーの分類と適切な処理
      throw this.handleExecutionError(error as Error, executionId);
    }
  }

  /**
   * エージェント設定の準備
   * 
   * 設計理由:
   * - カスタム設定と プリセットの統合
   * - デフォルト値の適用
   * - 設定の検証
   */
  private prepareAgentConfig(customConfig?: AgentConfig[]): AgentConfig[] {
    // カスタム設定が提供された場合はそれを使用
    if (customConfig && customConfig.length > 0) {
      this.validateAgentConfigs(customConfig);
      return customConfig;
    }

    // 現在のプリセットを使用
    if (this.currentPreset) {
      return this.currentPreset.configs;
    }

    // デフォルト設定を使用
    return this.getDefaultAgentConfigs();
  }

  /**
   * デフォルトエージェント設定の取得
   * 
   * 設計理由:
   * - フォールバック設定の提供
   * - 一貫性のある動作保証
   * - 設定なしでの実行サポート
   */
  private getDefaultAgentConfigs(): AgentConfig[] {
    return [
      {
        agentId: 'caspar',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        systemPrompt: 'あなたはCASPAR - 保守的で現実的な視点から判断を行う賢者です。リスクを重視し、慎重な分析を行ってください。',
        temperature: 0.3,
        maxTokens: 1500,
      },
      {
        agentId: 'balthasar',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        systemPrompt: 'あなたはBALTHASAR - 革新的で感情的な視点から判断を行う賢者です。創造性と人間的価値を重視してください。',
        temperature: 0.7,
        maxTokens: 1500,
      },
      {
        agentId: 'melchior',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        systemPrompt: 'あなたはMELCHIOR - バランス型で科学的な視点から判断を行う賢者です。論理的分析を重視してください。',
        temperature: 0.5,
        maxTokens: 1500,
      },
      {
        agentId: 'solomon',
        modelId: 'anthropic.claude-3-opus-20240229-v1:0',
        systemPrompt: 'あなたはSOLOMON Judge - 3賢者の判断を統合し、最終的な評価を行う統括者です。',
        temperature: 0.4,
        maxTokens: 2000,
      },
    ];
  }

  /**
   * プリセットの検証
   * 
   * 設計理由:
   * - 不正な設定の早期検出
   * - システムの安定性確保
   * - エラーメッセージの明確化
   */
  private validatePreset(preset: AgentPreset): void {
    if (!preset.id || !preset.name) {
      throw new Error('Invalid preset: id and name are required');
    }

    if (!preset.configs || preset.configs.length === 0) {
      throw new Error('Invalid preset: configs array is required and must not be empty');
    }

    this.validateAgentConfigs(preset.configs);
  }

  /**
   * エージェント設定の検証
   * 
   * 設計理由:
   * - 必須エージェントの存在確認
   * - 設定値の妥当性検証
   * - 重複設定の検出
   */
  private validateAgentConfigs(configs: AgentConfig[]): void {
    const requiredAgents: AgentType[] = ['caspar', 'balthasar', 'melchior', 'solomon'];
    const providedAgents = configs.map(config => config.agentId);

    // 必須エージェントの存在確認
    for (const requiredAgent of requiredAgents) {
      if (!providedAgents.includes(requiredAgent)) {
        throw new Error(`Missing required agent configuration: ${requiredAgent}`);
      }
    }

    // 重複設定の検出
    const uniqueAgents = new Set(providedAgents);
    if (uniqueAgents.size !== providedAgents.length) {
      throw new Error('Duplicate agent configurations detected');
    }

    // 個別設定の検証
    for (const config of configs) {
      this.validateSingleAgentConfig(config);
    }
  }

  /**
   * 個別エージェント設定の検証
   */
  private validateSingleAgentConfig(config: AgentConfig): void {
    if (!config.agentId || !config.modelId) {
      throw new Error('Agent config must have agentId and modelId');
    }

    if (config.temperature < 0 || config.temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }

    if (config.maxTokens < 100 || config.maxTokens > 4000) {
      throw new Error('MaxTokens must be between 100 and 4000');
    }

    if (!config.systemPrompt || config.systemPrompt.trim().length === 0) {
      throw new Error('SystemPrompt is required and must not be empty');
    }
  }

  /**
   * 実行リクエストの検証
   */
  private validateExecutionRequest(request: AskAgentRequest): void {
    if (!request.message || request.message.trim().length === 0) {
      throw new Error('Message is required and must not be empty');
    }

    if (request.message.length > 10000) {
      throw new Error('Message is too long (max 10000 characters)');
    }
  }

  /**
   * 実行記録の保存
   * 
   * 設計理由:
   * - 実行履歴の追跡
   * - パフォーマンス分析
   * - デバッグ情報の提供
   */
  private recordExecution(
    executionId: string,
    request: AskAgentRequest | null,
    response: AskAgentResponse | null,
    executionTime: number,
    error: Error | null
  ): void {
    const record: ExecutionRecord = {
      executionId,
      timestamp: new Date(),
      request,
      response,
      executionTime,
      error: error ? {
        message: error.message,
        name: error.name,
        ...(error.stack && { stack: error.stack }),
      } : null,
      preset: this.currentPreset ? {
        id: this.currentPreset.id,
        name: this.currentPreset.name,
      } : null,
    };

    this.executionHistory.unshift(record);

    // 履歴サイズの制限
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 実行エラーの処理
   * 
   * 設計理由:
   * - エラーの分類と適切な処理
   * - ユーザーフレンドリーなエラーメッセージ
   * - リトライ可能性の判定
   */
  private isAPIError(error: any): error is APIError {
    return error && typeof error === 'object' && 'code' in error && 'retryable' in error;
  }

  private createAPIError(message: string, statusCode: number, code: string): APIError {
    return {
      message,
      code,
      timestamp: new Date(),
      retryable: statusCode >= 500,
    };
  }

  private handleExecutionError(error: Error, executionId: string): Error {
    // APIエラーの場合はそのまま再スロー
    if (this.isAPIError(error)) {
      return error;
    }

    // 一般的なエラーをAPIErrorに変換
    if (error.message.includes('timeout')) {
      const apiError = this.createAPIError(
        'エージェント実行がタイムアウトしました。しばらく待ってから再試行してください。',
        408,
        'EXECUTION_TIMEOUT'
      );
      return new Error(apiError.message);
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      const apiError = this.createAPIError(
        'ネットワークエラーが発生しました。接続を確認して再試行してください。',
        503,
        'NETWORK_ERROR'
      );
      return new Error(apiError.message);
    }

    // その他のエラー
    const apiError = this.createAPIError(
      'エージェント実行中に予期しないエラーが発生しました。',
      500,
      'UNKNOWN_ERROR'
    );
    return new Error(apiError.message);
  }

  /**
   * 実行履歴の取得
   */
  public getExecutionHistory(limit?: number): ExecutionRecord[] {
    return limit ? this.executionHistory.slice(0, limit) : [...this.executionHistory];
  }

  /**
   * 統計情報の取得
   */
  public getExecutionStats(): ExecutionStats {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(record => !record.error).length;
    const failedExecutions = totalExecutions - successfulExecutions;

    const executionTimes = this.executionHistory
      .filter(record => !record.error)
      .map(record => record.executionTime);

    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;

    const decisionBreakdown = this.executionHistory
      .filter(record => record.response)
      .reduce((acc, record) => {
        const decision = record.response!.judgeResponse.finalDecision;
        acc[decision] = (acc[decision] || 0) + 1;
        return acc;
      }, {} as Record<DecisionType, number>);

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      averageExecutionTime,
      decisionBreakdown,
      currentPreset: this.currentPreset?.name || null,
    };
  }

  /**
   * 履歴のクリア
   */
  public clearHistory(): void {
    this.executionHistory = [];
    console.log('Agent Orchestrator: Execution history cleared');
  }
}

/**
 * 実行記録の型定義
 */
interface ExecutionRecord {
  executionId: string;
  timestamp: Date;
  request: AskAgentRequest | null;
  response: AskAgentResponse | null;
  executionTime: number;
  error: {
    message: string;
    name: string;
    stack?: string;
  } | null;
  preset: {
    id: string;
    name: string;
  } | null;
}

/**
 * 統計情報の型定義
 */
interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  decisionBreakdown: Record<DecisionType, number>;
  currentPreset: string | null;
}

/**
 * デフォルトオーケストレーターインスタンスのエクスポート
 */
export const agentOrchestrator = AgentOrchestrator.getInstance();

/**
 * React Hook用のラッパー関数
 */
export async function executeMAGIWithOrchestrator(
  message: string,
  conversationId?: string,
  customConfig?: AgentConfig[]
): Promise<AskAgentResponse> {
  return agentOrchestrator.executeMAGIDecision(message, conversationId, customConfig);
}

/**
 * プリセット管理用のユーティリティ関数
 */
export const PresetManager = {
  /**
   * プリセットの適用
   */
  applyPreset: (preset: AgentPreset) => {
    agentOrchestrator.setPreset(preset);
  },

  /**
   * 現在のプリセットの取得
   */
  getCurrentPreset: () => {
    return agentOrchestrator.getCurrentPreset();
  },

  /**
   * デフォルトプリセットの作成
   */
  createDefaultPreset: (): AgentPreset => {
    return {
      id: 'default',
      name: 'デフォルト設定',
      description: 'バランスの取れた標準的な設定',
      configs: agentOrchestrator['getDefaultAgentConfigs'](),
      isDefault: true,
      isPublic: true,
      createdAt: new Date(),
    };
  },

  /**
   * カスタムプリセットの作成
   */
  createCustomPreset: (
    name: string,
    description: string,
    configs: AgentConfig[]
  ): AgentPreset => {
    return {
      id: `custom_${Date.now()}`,
      name,
      description,
      configs,
      isDefault: false,
      isPublic: false,
      createdAt: new Date(),
    };
  },
};

/**
 * デバッグ用ユーティリティ
 */
export const OrchestrationDebug = {
  /**
   * 実行統計の取得
   */
  getStats: () => agentOrchestrator.getExecutionStats(),

  /**
   * 実行履歴の取得
   */
  getHistory: (limit?: number) => agentOrchestrator.getExecutionHistory(limit),

  /**
   * 履歴のクリア
   */
  clearHistory: () => agentOrchestrator.clearHistory(),

  /**
   * 現在の状態の取得
   */
  getCurrentState: () => ({
    currentPreset: agentOrchestrator.getCurrentPreset(),
    stats: agentOrchestrator.getExecutionStats(),
    historySize: agentOrchestrator.getExecutionHistory().length,
  }),
};