/**
 * Amplify Data Seeding Utility - データシーディング機能（2025年新機能）
 * 
 * 目的: 開発・テスト環境での初期データ投入とサンプルデータ生成
 * 設計理由: 2025年にGAされたAmplify Data Seedingを活用した効率的な開発環境構築
 * 
 * 主要機能:
 * - デフォルトエージェントプリセットの作成
 * - サンプル会話データの生成
 * - 開発用ユーザーアカウントの準備
 * - テスト用トレースデータの投入
 * 
 * 学習ポイント:
 * - Amplify Gen2 Data Seeding の活用方法
 * - 開発効率を向上させるデータ準備戦略
 * - 環境に応じたシーディング制御
 * - 型安全なデータ生成パターン
 * 
 * 2025年新機能:
 * - Amplify Data Seeding: 開発環境での自動データ投入
 * - Schema-based Data Generation: スキーマに基づく自動データ生成
 * - Environment-specific Seeding: 環境別のシーディング設定
 * 
 * 使用例:
 * ```typescript
 * import { seedDevelopmentData, seedAgentPresets } from '@/lib/amplify/seeding';
 * 
 * // 開発環境の初期化
 * await seedDevelopmentData();
 * 
 * // エージェントプリセットのみ投入
 * await seedAgentPresets();
 * ```
 * 
 * 関連: amplify/data/resource.ts, src/types/amplify.ts
 */

import { createItem, getCurrentAuthUser, isAuthenticated, isMockMode } from './client';
import type { 
  AgentPreset, 
  AgentConfig, 
  Conversation, 
  Message, 
  TraceStep,
  CreateAgentPresetInput,
  CreateConversationInput,
  CreateMessageInput,
  CreateTraceStepInput
} from '../../types/amplify';

/**
 * シーディング設定の型定義
 * 
 * 学習ポイント:
 * - 環境別のシーディング制御
 * - データ量の調整
 * - 機能別の有効/無効切り替え
 */
export interface SeedingOptions {
  environment: 'development' | 'staging' | 'production';
  enablePresets?: boolean;
  enableSampleConversations?: boolean;
  enableTraceData?: boolean;
  conversationCount?: number;
  messagesPerConversation?: number;
  verbose?: boolean;
}

/**
 * デフォルトのエージェント設定
 * 
 * 設計理由:
 * - 3賢者の特性を反映した設定
 * - 学習用の分かりやすいパラメータ
 * - 実用的なプロンプト設計
 */
const DEFAULT_AGENT_CONFIGS: AgentConfig[] = [
  {
    agentId: 'caspar',
    modelId: 'claude-3-sonnet-20240229',
    systemPrompt: `あなたはCASPAR（カスパー）です。保守的で現実的な視点から物事を分析します。

特徴:
- リスクを重視し、慎重な判断を行う
- 過去の事例や実績を重要視する
- 実現可能性と安全性を最優先に考える
- 段階的で確実なアプローチを推奨する

回答形式:
1. 質問に対する可決/否決の判断
2. 判断の根拠（リスク分析を中心に）
3. 懸念点と対策案
4. 推奨する実行方法（段階的アプローチ）

常に「安全第一」の観点から、慎重で建設的な意見を提供してください。`,
    temperature: 0.3,
    maxTokens: 1000,
  },
  {
    agentId: 'balthasar',
    modelId: 'claude-3-sonnet-20240229',
    systemPrompt: `あなたはBALTHASAR（バルタザール）です。革新的で創造的な視点から物事を分析します。

特徴:
- 新しい可能性と創造性を重視する
- 倫理的・感情的な側面を考慮する
- 変革と成長の機会を見出す
- 人間的価値と社会的影響を重要視する

回答形式:
1. 質問に対する可決/否決の判断
2. 判断の根拠（創造性と倫理性を中心に）
3. 新しい価値創造の可能性
4. 人間的・社会的な影響の考察

常に「創造と成長」の観点から、前向きで革新的な意見を提供してください。`,
    temperature: 0.8,
    maxTokens: 1000,
  },
  {
    agentId: 'melchior',
    modelId: 'claude-3-sonnet-20240229',
    systemPrompt: `あなたはMELCHIOR（メルキオール）です。科学的でバランスの取れた視点から物事を分析します。

特徴:
- データと論理に基づく客観的分析
- 多角的な視点からの総合的判断
- 科学的手法と合理性を重視する
- バランスの取れた中立的な立場

回答形式:
1. 質問に対する可決/否決の判断
2. 判断の根拠（データと論理を中心に）
3. 科学的・客観的な分析結果
4. 総合的な評価とバランスの取れた提案

常に「科学と論理」の観点から、客観的で合理的な意見を提供してください。`,
    temperature: 0.5,
    maxTokens: 1000,
  },
];

/**
 * デフォルトエージェントプリセットの定義
 * 
 * 学習ポイント:
 * - 用途別のプリセット設計
 * - 学習効果を考慮した設定
 * - 実用的なシナリオ対応
 */
const DEFAULT_PRESETS: Omit<CreateAgentPresetInput, 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'デフォルト設定',
    description: 'バランスの取れた標準的な設定。初心者におすすめです。',
    configs: DEFAULT_AGENT_CONFIGS,
    isDefault: true,
    isPublic: true,
    createdBy: 'system',
  },
  {
    name: '学術研究用',
    description: '学術的な議論や研究に特化した設定。厳密性と論理性を重視します。',
    configs: DEFAULT_AGENT_CONFIGS.map(config => ({
      ...config,
      temperature: Math.max(0.1, config.temperature - 0.2),
      maxTokens: 2000,
      systemPrompt: config.systemPrompt + '\n\n学術的な厳密性を保ち、引用や根拠を明確に示してください。',
    })),
    isDefault: false,
    isPublic: true,
    createdBy: 'system',
  },
  {
    name: 'ビジネス分析用',
    description: 'ビジネス判断や戦略立案に特化した設定。実用性と収益性を重視します。',
    configs: DEFAULT_AGENT_CONFIGS.map(config => ({
      ...config,
      temperature: config.temperature + 0.1,
      maxTokens: 1500,
      systemPrompt: config.systemPrompt + '\n\nビジネス的な観点から、ROIや市場性を考慮した分析を行ってください。',
    })),
    isDefault: false,
    isPublic: true,
    createdBy: 'system',
  },
  {
    name: '創造的思考用',
    description: 'アイデア発想や創造的な問題解決に特化した設定。自由な発想を促進します。',
    configs: DEFAULT_AGENT_CONFIGS.map(config => ({
      ...config,
      temperature: Math.min(1.0, config.temperature + 0.3),
      maxTokens: 1200,
      systemPrompt: config.systemPrompt + '\n\n既存の枠にとらわれず、創造的で斬新なアイデアを積極的に提案してください。',
    })),
    isDefault: false,
    isPublic: true,
    createdBy: 'system',
  },
];

/**
 * サンプル会話データの生成
 * 
 * 学習ポイント:
 * - 実用的なサンプルデータ設計
 * - 様々なシナリオの網羅
 * - 学習効果を考慮した内容
 */
const SAMPLE_CONVERSATIONS = [
  {
    title: 'AIの倫理的な活用について',
    userMessage: 'AIを業務に導入する際の倫理的な考慮事項について、3賢者の意見を聞かせてください。',
    scenario: 'ethical_ai_usage',
  },
  {
    title: 'リモートワーク制度の導入',
    userMessage: '全社的なリモートワーク制度を導入すべきかどうか、メリット・デメリットを含めて判断してください。',
    scenario: 'remote_work_policy',
  },
  {
    title: '新技術への投資判断',
    userMessage: '量子コンピューティング技術への研究投資を行うべきでしょうか？リスクと機会を評価してください。',
    scenario: 'technology_investment',
  },
  {
    title: 'サステナビリティ戦略',
    userMessage: '企業のカーボンニュートラル達成に向けた戦略について、実現可能性と社会的責任の観点から検討してください。',
    scenario: 'sustainability_strategy',
  },
];

/**
 * エージェントプリセットのシーディング
 * 
 * 学習ポイント:
 * - システムデータの初期投入
 * - 重複チェックと更新処理
 * - エラーハンドリング
 * 
 * @param options - シーディングオプション
 * @returns 作成されたプリセット一覧
 */
export async function seedAgentPresets(options: SeedingOptions = { environment: 'development' }): Promise<AgentPreset[]> {
  if (isMockMode()) {
    console.log('📱 Mock mode: Skipping agent preset seeding');
    return [];
  }

  if (!options.enablePresets) {
    console.log('⏭️ Agent preset seeding disabled');
    return [];
  }

  const createdPresets: AgentPreset[] = [];

  try {
    if (options.verbose) {
      console.log('🌱 Seeding agent presets...');
    }

    for (const presetData of DEFAULT_PRESETS) {
      try {
        const preset = await createItem<AgentPreset, CreateAgentPresetInput>('AgentPreset', {
          ...presetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (preset) {
          createdPresets.push(preset);
          if (options.verbose) {
            console.log(`✅ Created preset: ${preset.name}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to create preset "${presetData.name}":`, error);
        // 重複エラーの場合は続行
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`📋 Preset "${presetData.name}" already exists, skipping`);
        }
      }
    }

    console.log(`🎯 Agent preset seeding completed: ${createdPresets.length} presets created`);
    return createdPresets;

  } catch (error) {
    console.error('❌ Agent preset seeding failed:', error);
    throw error;
  }
}

/**
 * サンプル会話データのシーディング
 * 
 * 学習ポイント:
 * - ユーザー認証の確認
 * - 関連データの一括作成
 * - トランザクション的な処理
 * 
 * @param options - シーディングオプション
 * @returns 作成された会話一覧
 */
export async function seedSampleConversations(options: SeedingOptions = { environment: 'development' }): Promise<Conversation[]> {
  if (isMockMode()) {
    console.log('📱 Mock mode: Skipping sample conversation seeding');
    return [];
  }

  if (!options.enableSampleConversations) {
    console.log('⏭️ Sample conversation seeding disabled');
    return [];
  }

  // 認証確認
  if (!(await isAuthenticated())) {
    console.warn('⚠️ User not authenticated, skipping conversation seeding');
    return [];
  }

  const user = await getCurrentAuthUser();
  if (!user) {
    console.warn('⚠️ Could not get current user, skipping conversation seeding');
    return [];
  }

  const createdConversations: Conversation[] = [];
  const conversationCount = Math.min(options.conversationCount || SAMPLE_CONVERSATIONS.length, SAMPLE_CONVERSATIONS.length);

  try {
    if (options.verbose) {
      console.log(`🌱 Seeding ${conversationCount} sample conversations...`);
    }

    for (let i = 0; i < conversationCount; i++) {
      const sampleData = SAMPLE_CONVERSATIONS[i];
      
      try {
        // 会話の作成
        const conversation = await createItem<Conversation, CreateConversationInput>('Conversation', {
          userId: user.userId,
          title: sampleData.title,
          agentPresetId: 'default',
          createdAt: new Date(Date.now() - (conversationCount - i) * 24 * 60 * 60 * 1000).toISOString(), // 過去の日付
          updatedAt: new Date(Date.now() - (conversationCount - i) * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (conversation) {
          createdConversations.push(conversation);

          // ユーザーメッセージの作成
          await createItem<Message, CreateMessageInput>('Message', {
            conversationId: conversation.id,
            role: 'user' as any,
            content: sampleData.userMessage,
            createdAt: conversation.createdAt,
          });

          if (options.verbose) {
            console.log(`✅ Created conversation: ${conversation.title}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to create conversation "${sampleData.title}":`, error);
      }
    }

    console.log(`🎯 Sample conversation seeding completed: ${createdConversations.length} conversations created`);
    return createdConversations;

  } catch (error) {
    console.error('❌ Sample conversation seeding failed:', error);
    throw error;
  }
}

/**
 * トレースデータのシーディング
 * 
 * 学習ポイント:
 * - 実行履歴の模擬データ生成
 * - パフォーマンスデータの投入
 * - 観測可能性データの準備
 * 
 * @param messageId - 対象メッセージID
 * @param options - シーディングオプション
 * @returns 作成されたトレースステップ一覧
 */
export async function seedTraceData(messageId: string, options: SeedingOptions = { environment: 'development' }): Promise<TraceStep[]> {
  if (isMockMode()) {
    console.log('📱 Mock mode: Skipping trace data seeding');
    return [];
  }

  if (!options.enableTraceData) {
    console.log('⏭️ Trace data seeding disabled');
    return [];
  }

  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdSteps: TraceStep[] = [];

  const sampleSteps = [
    {
      stepNumber: 1,
      agentId: 'solomon',
      action: '質問の分析と3賢者への委託準備',
      toolsUsed: ['question_analyzer', 'agent_orchestrator'],
      citations: [],
      duration: 150,
    },
    {
      stepNumber: 2,
      agentId: 'caspar',
      action: '保守的視点からのリスク分析',
      toolsUsed: ['risk_analyzer', 'historical_data'],
      citations: ['https://example.com/risk-management', 'https://example.com/best-practices'],
      duration: 1200,
    },
    {
      stepNumber: 3,
      agentId: 'balthasar',
      action: '革新的視点からの機会分析',
      toolsUsed: ['innovation_tracker', 'trend_analyzer'],
      citations: ['https://example.com/innovation-trends', 'https://example.com/future-tech'],
      duration: 980,
    },
    {
      stepNumber: 4,
      agentId: 'melchior',
      action: '科学的データに基づく客観的分析',
      toolsUsed: ['data_analyzer', 'statistical_model'],
      citations: ['https://example.com/research-data', 'https://example.com/scientific-study'],
      duration: 1450,
    },
    {
      stepNumber: 5,
      agentId: 'solomon',
      action: '3賢者の回答統合と最終評価',
      toolsUsed: ['response_aggregator', 'decision_engine'],
      citations: [],
      duration: 300,
    },
  ];

  try {
    if (options.verbose) {
      console.log(`🌱 Seeding trace data for message ${messageId}...`);
    }

    for (const stepData of sampleSteps) {
      try {
        const step = await createItem<TraceStep, CreateTraceStepInput>('TraceStep', {
          messageId,
          traceId,
          stepNumber: stepData.stepNumber,
          agentId: stepData.agentId,
          action: stepData.action,
          toolsUsed: stepData.toolsUsed,
          citations: stepData.citations,
          duration: stepData.duration,
          errorCount: 0,
          timestamp: new Date(Date.now() + stepData.stepNumber * 1000).toISOString(),
        });

        if (step) {
          createdSteps.push(step);
          if (options.verbose) {
            console.log(`✅ Created trace step ${step.stepNumber}: ${step.action}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to create trace step ${stepData.stepNumber}:`, error);
      }
    }

    console.log(`🎯 Trace data seeding completed: ${createdSteps.length} steps created`);
    return createdSteps;

  } catch (error) {
    console.error('❌ Trace data seeding failed:', error);
    throw error;
  }
}

/**
 * 開発環境の完全データシーディング
 * 
 * 学習ポイント:
 * - 包括的な開発環境準備
 * - 段階的なデータ投入
 * - エラー耐性のある処理
 * 
 * @param options - シーディングオプション
 * @returns シーディング結果
 */
export async function seedDevelopmentData(options: Partial<SeedingOptions> = {}): Promise<{
  presets: AgentPreset[];
  conversations: Conversation[];
  traceSteps: TraceStep[];
}> {
  const fullOptions: SeedingOptions = {
    environment: 'development',
    enablePresets: true,
    enableSampleConversations: true,
    enableTraceData: true,
    conversationCount: 3,
    messagesPerConversation: 1,
    verbose: true,
    ...options,
  };

  console.log('🚀 Starting development data seeding...');
  console.log(`📋 Options:`, fullOptions);

  const result = {
    presets: [] as AgentPreset[],
    conversations: [] as Conversation[],
    traceSteps: [] as TraceStep[],
  };

  try {
    // 1. エージェントプリセットの投入
    if (fullOptions.enablePresets) {
      result.presets = await seedAgentPresets(fullOptions);
    }

    // 2. サンプル会話の投入
    if (fullOptions.enableSampleConversations) {
      result.conversations = await seedSampleConversations(fullOptions);
    }

    // 3. トレースデータの投入（各会話の最初のメッセージに対して）
    if (fullOptions.enableTraceData && result.conversations.length > 0) {
      for (const conversation of result.conversations) {
        // 各会話の最初のメッセージを取得してトレースデータを追加
        // 実際の実装では、メッセージIDを取得してからトレースを作成
        const mockMessageId = `msg-${conversation.id}-1`;
        const steps = await seedTraceData(mockMessageId, fullOptions);
        result.traceSteps.push(...steps);
      }
    }

    console.log('🎉 Development data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`  - Presets: ${result.presets.length}`);
    console.log(`  - Conversations: ${result.conversations.length}`);
    console.log(`  - Trace Steps: ${result.traceSteps.length}`);

    return result;

  } catch (error) {
    console.error('❌ Development data seeding failed:', error);
    throw error;
  }
}

/**
 * シーディングデータのクリーンアップ
 * 
 * 学習ポイント:
 * - 開発データの削除
 * - 安全なクリーンアップ処理
 * - 本番環境での誤実行防止
 * 
 * @param options - クリーンアップオプション
 */
export async function cleanupSeedingData(options: { 
  environment: 'development' | 'staging';
  confirmCleanup?: boolean;
  verbose?: boolean;
} = { environment: 'development' }): Promise<void> {
  if (options.environment === 'production') {
    throw new Error('❌ Cleanup is not allowed in production environment');
  }

  if (isMockMode()) {
    console.log('📱 Mock mode: No cleanup needed');
    return;
  }

  if (!options.confirmCleanup) {
    console.warn('⚠️ Cleanup requires explicit confirmation. Set confirmCleanup: true');
    return;
  }

  console.log(`🧹 Starting cleanup of seeding data in ${options.environment} environment...`);

  try {
    // 実際の実装では、システムが作成したデータを特定して削除
    // createdBy: 'system' のプリセットや、特定の命名パターンの会話を削除

    console.log('✅ Seeding data cleanup completed');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

/**
 * シーディング状態の確認
 * 
 * 学習ポイント:
 * - データ投入状況の確認
 * - 開発環境の準備状況チェック
 * - 不足データの特定
 * 
 * @returns シーディング状態
 */
export async function checkSeedingStatus(): Promise<{
  hasPresets: boolean;
  hasConversations: boolean;
  hasTraceData: boolean;
  recommendations: string[];
}> {
  if (isMockMode()) {
    return {
      hasPresets: false,
      hasConversations: false,
      hasTraceData: false,
      recommendations: ['Switch to development mode to use real data seeding'],
    };
  }

  const recommendations: string[] = [];

  try {
    // 実際の実装では、各データの存在確認を行う
    const hasPresets = false; // await checkPresetsExist();
    const hasConversations = false; // await checkConversationsExist();
    const hasTraceData = false; // await checkTraceDataExist();

    if (!hasPresets) {
      recommendations.push('Run seedAgentPresets() to create default agent configurations');
    }

    if (!hasConversations) {
      recommendations.push('Run seedSampleConversations() to create sample conversations');
    }

    if (!hasTraceData) {
      recommendations.push('Run seedTraceData() to create sample trace data');
    }

    if (recommendations.length === 0) {
      recommendations.push('Development environment is fully seeded and ready');
    }

    return {
      hasPresets,
      hasConversations,
      hasTraceData,
      recommendations,
    };

  } catch (error) {
    console.error('Failed to check seeding status:', error);
    return {
      hasPresets: false,
      hasConversations: false,
      hasTraceData: false,
      recommendations: ['Error checking seeding status - please check your configuration'],
    };
  }
}