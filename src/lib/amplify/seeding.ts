/**
 * Data Seeding Utilities - 初期データ投入機能
 * 
 * このファイルはAmplify Data環境への初期データ投入機能を提供します。
 * 開発環境での便利機能として、サンプルデータやデフォルト設定を自動投入します。
 * 
 * 目的:
 * - 開発環境での初期データ投入
 * - デフォルトプリセットの作成
 * - サンプル会話とメッセージの生成
 * - テスト用データの準備
 * 
 * 設計理由:
 * - 開発効率の向上
 * - 一貫したテストデータの提供
 * - 新規環境の迅速なセットアップ
 * - データ構造の理解促進
 * 
 * 学習ポイント:
 * - Amplify Dataへのデータ投入パターン
 * - リレーショナルデータの作成順序
 * - エラーハンドリングとロールバック
 * - 冪等性の確保（重複実行対応）
 * 
 * 使用例:
 * ```typescript
 * import { seedAllData, seedDefaultPresets } from '@/lib/amplify/seeding';
 * 
 * // 全データの投入
 * await seedAllData();
 * 
 * // プリセットのみ投入
 * await seedDefaultPresets();
 * ```
 * 
 * 関連: src/lib/amplify/client.ts, amplify/data/resource.ts
 */

import { getAmplifyClient, getRealAmplifyClient } from './client';
import { isMockMode, getCurrentEnvironmentMode } from './config';
import type { 
  AgentPreset, 
  AgentConfig, 
  Conversation, 
  Message,
  AgentResponse,
  JudgeResponse,
  AgentType,
  DecisionType
} from './types';

/**
 * シーディング設定の型定義
 */
interface SeedingOptions {
  /** 既存データがある場合も強制実行 */
  force?: boolean;
  /** 詳細ログの出力 */
  verbose?: boolean;
  /** 特定のデータタイプのみ投入 */
  only?: ('presets' | 'conversations' | 'messages')[];
  /** サンプルデータの数 */
  sampleCount?: {
    conversations?: number;
    messagesPerConversation?: number;
  };
}

/**
 * シーディング結果の型定義
 */
interface SeedingResult {
  success: boolean;
  mode: string;
  created: {
    presets: number;
    conversations: number;
    messages: number;
  };
  errors: string[];
  duration: number;
}

/**
 * デフォルトエージェントプリセットの定義
 * 
 * 学習ポイント:
 * - 3賢者それぞれの特性を反映した設定
 * - 温度パラメータによる創造性の調整
 * - システムプロンプトによる人格設定
 * - 実用的なトークン数制限
 */
const DEFAULT_PRESETS: Omit<AgentPreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'デフォルト設定',
    description: 'バランスの取れた標準設定。一般的な質問に適しています。',
    configs: [
      {
        agentId: 'caspar' as AgentType,
        modelId: 'claude-3-sonnet',
        systemPrompt: `あなたはCASPAR（カスパー）です。

【役割】
保守的で現実的な視点から物事を分析する賢者です。

【特徴】
- 実用性と安全性を重視
- 過去の事例や実績を基に判断
- リスクを慎重に評価
- 段階的で確実なアプローチを好む

【回答スタイル】
- 具体的で実行可能な提案
- 潜在的なリスクの指摘
- 実証済みの方法論の推奨
- 慎重で建設的な意見

質問に対して可決/否決の判断と、その理由を明確に示してください。`,
        temperature: 0.3,
        maxTokens: 1000
      },
      {
        agentId: 'balthasar',
        modelId: 'claude-3-sonnet',
        systemPrompt: `あなたはBALTHASAR（バルタザール）です。

【役割】
革新的で創造的な視点から物事を分析する賢者です。

【特徴】
- 創造性と革新性を重視
- 新しい可能性を積極的に探求
- 人間の感情や価値観を考慮
- 大胆で前向きなアプローチを好む

【回答スタイル】
- 創造的で斬新な提案
- 新しい視点や可能性の提示
- 人間中心の価値観重視
- 情熱的で鼓舞する意見

質問に対して可決/否決の判断と、その理由を明確に示してください。`,
        temperature: 0.8,
        maxTokens: 1000
      },
      {
        agentId: 'melchior',
        modelId: 'claude-3-sonnet',
        systemPrompt: `あなたはMELCHIOR（メルキオール）です。

【役割】
科学的でバランスの取れた視点から物事を分析する賢者です。

【特徴】
- データと論理を重視
- 客観的で中立的な分析
- 多角的な視点から検討
- 合理的で体系的なアプローチを好む

【回答スタイル】
- データに基づく客観的分析
- 論理的で体系的な説明
- 複数の視点からの検討
- 冷静で公正な判断

質問に対して可決/否決の判断と、その理由を明確に示してください。`,
        temperature: 0.5,
        maxTokens: 1000
      }
    ],
    isDefault: true,
    isPublic: true,
    createdBy: 'system'
  },
  {
    name: '学術研究用',
    description: '学術的な議論や研究に適した厳密な設定。論理性と客観性を重視します。',
    configs: [
      {
        agentId: 'caspar',
        modelId: 'claude-3-opus',
        systemPrompt: `あなたは学術研究におけるCASPARです。

【研究アプローチ】
- 実証主義的な方法論を重視
- 既存研究との整合性を検証
- 再現可能性を重要視
- 段階的な仮説検証を推奨

【評価基準】
- 科学的妥当性
- 実証可能性
- 研究倫理への適合
- 学術的貢献度

厳密な学術基準で可決/否決を判断してください。`,
        temperature: 0.1,
        maxTokens: 2000
      },
      {
        agentId: 'balthasar',
        modelId: 'claude-3-sonnet',
        systemPrompt: `あなたは学術研究におけるBALTHASARです。

【研究アプローチ】
- 学際的な視点を重視
- 創造的な研究手法を探求
- 社会的インパクトを考慮
- パラダイムシフトの可能性を評価

【評価基準】
- 独創性と新規性
- 学際的な価値
- 社会的意義
- 将来的な発展性

革新的な学術価値で可決/否決を判断してください。`,
        temperature: 0.4,
        maxTokens: 2000
      },
      {
        agentId: 'melchior',
        modelId: 'claude-3-opus',
        systemPrompt: `あなたは学術研究におけるMELCHIORです。

【研究アプローチ】
- 定量的・定性的分析の統合
- メタ分析による総合評価
- 統計的有意性の検証
- 系統的レビューの実施

【評価基準】
- 統計的妥当性
- 方法論の適切性
- データの信頼性
- 結論の論理性

科学的厳密性で可決/否決を判断してください。`,
        temperature: 0.2,
        maxTokens: 2000
      }
    ],
    isDefault: false,
    isPublic: true,
    createdBy: 'system'
  },
  {
    name: 'ビジネス分析用',
    description: 'ビジネス判断や戦略立案に適した実践的な設定。ROIと実行可能性を重視します。',
    configs: [
      {
        agentId: 'caspar',
        modelId: 'claude-3-sonnet',
        systemPrompt: `あなたはビジネス分析におけるCASPARです。

【ビジネス視点】
- ROI（投資収益率）を重視
- リスク管理を最優先
- 既存ビジネスモデルとの整合性
- 段階的な実装計画を推奨

【評価基準】
- 財務的実現可能性
- 市場リスクの評価
- 競合優位性
- 実装コスト

ビジネス的実現可能性で可決/否決を判断してください。`,
        temperature: 0.2,
        maxTokens: 1500
      },
      {
        agentId: 'balthasar',
        modelId: 'claude-3-sonnet',
        systemPrompt: `あなたはビジネス分析におけるBALTHASARです。

【ビジネス視点】
- 市場機会の創出を重視
- 顧客価値の最大化
- ブランド価値の向上
- 革新的なビジネスモデル

【評価基準】
- 市場ポテンシャル
- 顧客満足度向上
- ブランド差別化
- 長期的成長性

市場価値創造の観点で可決/否決を判断してください。`,
        temperature: 0.6,
        maxTokens: 1500
      },
      {
        agentId: 'melchior',
        modelId: 'claude-3-sonnet',
        systemPrompt: `あなたはビジネス分析におけるMELCHIORです。

【ビジネス視点】
- データドリブンな意思決定
- KPIによる定量評価
- 市場分析と競合調査
- 最適化とスケーラビリティ

【評価基準】
- データ裏付けの強さ
- 測定可能な成果
- 市場適合性
- スケール可能性

データと分析に基づいて可決/否決を判断してください。`,
        temperature: 0.4,
        maxTokens: 1500
      }
    ],
    isDefault: false,
    isPublic: true,
    createdBy: 'system'
  }
];

/**
 * サンプル会話データの生成
 * 
 * 学習ポイント:
 * - 実際の使用例を想定したサンプル
 * - 多様なシナリオ（全員一致、意見分裂、エラー）
 * - エージェント応答の構造理解
 * - MAGI投票システムの動作例
 */
function generateSampleConversations(presetId: string, count: number = 2): Array<{
  conversation: Omit<Conversation, 'id' | 'user' | 'messages'>;
  messages: Array<Omit<Message, 'id' | 'conversation' | 'traceSteps'>>;
}> {
  const samples = [
    {
      conversation: {
        userId: 'demo-user',
        title: 'AIの倫理ガイドライン策定について',
        agentPresetId: presetId,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1日前
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      messages: [
        {
          conversationId: '', // 後で設定
          role: 'user' as const,
          content: '我が社でAI開発の倫理ガイドラインを策定したいと考えています。どのような点に注意すべきでしょうか？',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          conversationId: '', // 後で設定
          role: 'assistant' as const,
          content: '3賢者による分析結果をお示しします。',
          agentResponses: [
            {
              agentId: 'caspar' as AgentType,
              decision: 'APPROVED' as DecisionType,
              content: '既存の法的フレームワークとの整合性を最優先に考えるべきです。GDPR、AI法案などの規制要件を満たし、段階的な導入計画を策定することを推奨します。',
              reasoning: '法的リスクの回避と実装可能性を重視した判断',
              confidence: 0.92,
              executionTime: 1200
            },
            {
              agentId: 'balthasar' as AgentType,
              decision: 'APPROVED' as DecisionType,
              content: '人間の尊厳と創造性を最大限に尊重するガイドラインを！AIは人間の能力を拡張し、より良い社会を創造するツールであるべきです。',
              reasoning: '人間中心の価値観と社会的責任を重視',
              confidence: 0.95,
              executionTime: 980
            },
            {
              agentId: 'melchior' as AgentType,
              decision: 'APPROVED' as DecisionType,
              content: 'データの公平性、アルゴリズムの透明性、バイアス除去の3つを科学的に検証できる仕組みが必要です。定量的な評価指標の設定を推奨します。',
              reasoning: '科学的根拠に基づく客観的な評価システムの必要性',
              confidence: 0.89,
              executionTime: 1350
            }
          ],
          judgeResponse: {
            finalDecision: 'APPROVED' as DecisionType,
            votingResult: { approved: 3, rejected: 0, abstained: 0 },
            scores: [
              { agentId: 'caspar' as AgentType, score: 92, reasoning: '実用的で法的に堅実なアプローチ' },
              { agentId: 'balthasar' as AgentType, score: 95, reasoning: '人間中心の価値観を明確に提示' },
              { agentId: 'melchior' as AgentType, score: 89, reasoning: '科学的で測定可能な基準を提案' }
            ],
            summary: '3賢者全員が倫理ガイドライン策定に賛成。法的整合性、人間の尊厳、科学的検証の3つの柱で構築することを推奨。',
            finalRecommendation: '多角的なアプローチによる包括的な倫理ガイドラインの策定を強く推奨',
            reasoning: '全員一致で可決。各視点が相互補完し、バランスの取れた倫理フレームワークを形成',
            confidence: 0.92
          },
          traceId: `trace-${crypto.randomUUID()}`,
          createdAt: new Date(Date.now() - 86300000).toISOString()
        }
      ]
    },
    {
      conversation: {
        userId: 'demo-user',
        title: '新製品の市場投入戦略',
        agentPresetId: presetId,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1時間前
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      messages: [
        {
          conversationId: '', // 後で設定
          role: 'user' as const,
          content: '革新的な新製品を開発しましたが、市場が未成熟です。今すぐ投入すべきか、市場の成熟を待つべきか判断に迷っています。',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          conversationId: '', // 後で設定
          role: 'assistant' as const,
          content: '3賢者の意見が分かれました。慎重な検討が必要です。',
          agentResponses: [
            {
              agentId: 'caspar' as AgentType,
              decision: 'REJECTED' as DecisionType,
              content: '市場が未成熟な状況での投入はリスクが高すぎます。競合他社の動向を見極め、市場教育が進んでから参入することを強く推奨します。',
              reasoning: 'リスク分析の結果、失敗確率が高く投資回収が困難と判断',
              confidence: 0.87,
              executionTime: 1400
            },
            {
              agentId: 'balthasar' as AgentType,
              decision: 'APPROVED' as DecisionType,
              content: 'ファーストムーバーアドバンテージを活かすチャンスです！市場を創造し、顧客を教育することで圧倒的な優位性を築けます。',
              reasoning: '市場創造による先行者利益と競合優位性を重視',
              confidence: 0.91,
              executionTime: 1100
            },
            {
              agentId: 'melchior' as AgentType,
              decision: 'APPROVED' as DecisionType,
              content: '段階的な市場投入戦略を推奨します。限定的なテスト市場から開始し、データを収集しながら徐々に拡大する方法が最適です。',
              reasoning: 'データドリブンなアプローチによりリスクを管理しながら機会を活用',
              confidence: 0.83,
              executionTime: 1250
            }
          ],
          judgeResponse: {
            finalDecision: 'APPROVED' as DecisionType,
            votingResult: { approved: 2, rejected: 1, abstained: 0 },
            scores: [
              { agentId: 'caspar' as AgentType, score: 78, reasoning: '慎重で現実的なリスク評価' },
              { agentId: 'balthasar' as AgentType, score: 85, reasoning: '積極的で戦略的な市場アプローチ' },
              { agentId: 'melchior' as AgentType, score: 88, reasoning: 'バランスの取れた段階的戦略' }
            ],
            summary: '2対1で可決。CASPARの慎重論も考慮し、MELCHIORの段階的アプローチを採用することを推奨。',
            finalRecommendation: '限定的なテスト市場での段階的投入により、リスクを管理しながら市場機会を活用',
            reasoning: '多数決により可決。ただし、CASPARの懸念を考慮した慎重な実行計画が必要',
            confidence: 0.85
          },
          traceId: `trace-${crypto.randomUUID()}`,
          createdAt: new Date(Date.now() - 3500000).toISOString()
        }
      ]
    }
  ];

  return samples.slice(0, count);
}

/**
 * デフォルトプリセットの投入
 * 
 * 学習ポイント:
 * - 冪等性の確保（重複チェック）
 * - エラーハンドリングとロールバック
 * - 作成順序の管理
 */
export async function seedDefaultPresets(options: SeedingOptions = {}): Promise<{
  success: boolean;
  created: number;
  errors: string[];
}> {
  if (isMockMode()) {
    if (options.verbose) {
      console.log('📝 Mock mode: Preset seeding handled by mock client');
    }
    return { success: true, created: 0, errors: [] };
  }

  const client = getRealAmplifyClient() as any; // Type assertion for Phase 3 compatibility
  const created: string[] = [];
  const errors: string[] = [];

  try {
    // 既存プリセットの確認
    if (!options.force) {
      const existing = await client.models.AgentPreset.list({ limit: 1 });
      if (existing.data && existing.data.length > 0) {
        if (options.verbose) {
          console.log('📊 Default presets already exist, skipping');
        }
        return { success: true, created: 0, errors: [] };
      }
    }

    if (options.verbose) {
      console.log('🌱 Creating default presets...');
    }

    // プリセットの作成
    for (const presetData of DEFAULT_PRESETS) {
      try {
        const result = await client.models.AgentPreset.create({
          ...presetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (result.data) {
          created.push(result.data.id);
          if (options.verbose) {
            console.log(`✅ Created preset: ${result.data.name} (${result.data.id})`);
          }
        } else {
          errors.push(`Failed to create preset: ${presetData.name}`);
        }
      } catch (error) {
        const errorMsg = `Error creating preset ${presetData.name}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      created: created.length,
      errors
    };
  } catch (error) {
    const errorMsg = `Failed to seed presets: ${error}`;
    errors.push(errorMsg);
    console.error(errorMsg);
    
    return {
      success: false,
      created: created.length,
      errors
    };
  }
}

/**
 * サンプル会話の投入
 * 
 * 学習ポイント:
 * - リレーショナルデータの作成順序
 * - 外部キー制約の考慮
 * - トランザクション的な処理
 */
export async function seedSampleConversations(options: SeedingOptions = {}): Promise<{
  success: boolean;
  created: { conversations: number; messages: number };
  errors: string[];
}> {
  if (isMockMode()) {
    if (options.verbose) {
      console.log('📝 Mock mode: Conversation seeding handled by mock client');
    }
    return { success: true, created: { conversations: 0, messages: 0 }, errors: [] };
  }

  const client = getRealAmplifyClient() as any; // Type assertion for Phase 3 compatibility
  const created = { conversations: 0, messages: 0 };
  const errors: string[] = [];

  try {
    // デフォルトプリセットの取得
    const presets = await client.models.AgentPreset.list({
      filter: { isDefault: { eq: true } }
    });

    if (!presets.data || presets.data.length === 0) {
      errors.push('No default preset found. Please seed presets first.');
      return { success: false, created, errors };
    }

    const defaultPreset = presets.data[0];
    const sampleCount = options.sampleCount?.conversations || 2;

    if (options.verbose) {
      console.log(`🌱 Creating ${sampleCount} sample conversations...`);
    }

    // サンプルデータの生成
    const samples = generateSampleConversations(defaultPreset.id, sampleCount);

    // 会話とメッセージの作成
    for (const sample of samples) {
      try {
        // 会話の作成
        const conversationResult = await client.models.Conversation.create(sample.conversation);
        
        if (!conversationResult.data) {
          errors.push(`Failed to create conversation: ${sample.conversation.title}`);
          continue;
        }

        created.conversations++;
        const conversationId = conversationResult.data.id;

        if (options.verbose) {
          console.log(`✅ Created conversation: ${sample.conversation.title} (${conversationId})`);
        }

        // メッセージの作成
        for (const messageData of sample.messages) {
          try {
            const messageResult = await client.models.Message.create({
              ...messageData,
              conversationId
            });

            if (messageResult.data) {
              created.messages++;
              if (options.verbose) {
                console.log(`  ✅ Created message: ${messageData.role} (${messageResult.data.id})`);
              }
            } else {
              errors.push(`Failed to create message in conversation ${conversationId}`);
            }
          } catch (error) {
            const errorMsg = `Error creating message: ${error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `Error creating conversation ${sample.conversation.title}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      created,
      errors
    };
  } catch (error) {
    const errorMsg = `Failed to seed conversations: ${error}`;
    errors.push(errorMsg);
    console.error(errorMsg);
    
    return {
      success: false,
      created,
      errors
    };
  }
}

/**
 * 全データの投入
 * 
 * 学習ポイント:
 * - 依存関係を考慮した実行順序
 * - 部分的な失敗への対応
 * - 実行時間の測定
 */
export async function seedAllData(options: SeedingOptions = {}): Promise<SeedingResult> {
  const startTime = Date.now();
  const mode = getCurrentEnvironmentMode();
  const result: SeedingResult = {
    success: false,
    mode,
    created: {
      presets: 0,
      conversations: 0,
      messages: 0
    },
    errors: [],
    duration: 0
  };

  try {
    if (options.verbose) {
      console.log(`🌱 Starting data seeding in ${mode} mode...`);
    }

    // 1. プリセットの投入
    if (!options.only || options.only.includes('presets')) {
      const presetResult = await seedDefaultPresets(options);
      result.created.presets = presetResult.created;
      result.errors.push(...presetResult.errors);
      
      if (options.verbose) {
        console.log(`📋 Presets: ${presetResult.created} created, ${presetResult.errors.length} errors`);
      }
    }

    // 2. サンプル会話の投入
    if (!options.only || options.only.includes('conversations')) {
      const conversationResult = await seedSampleConversations(options);
      result.created.conversations = conversationResult.created.conversations;
      result.created.messages = conversationResult.created.messages;
      result.errors.push(...conversationResult.errors);
      
      if (options.verbose) {
        console.log(`💬 Conversations: ${conversationResult.created.conversations} created`);
        console.log(`📝 Messages: ${conversationResult.created.messages} created`);
        console.log(`❌ Errors: ${conversationResult.errors.length}`);
      }
    }

    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;

    if (options.verbose) {
      console.log(`🌱 Data seeding completed in ${result.duration}ms`);
      console.log(`📊 Summary: ${result.created.presets} presets, ${result.created.conversations} conversations, ${result.created.messages} messages`);
      
      if (result.errors.length > 0) {
        console.log(`❌ Errors (${result.errors.length}):`);
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Seeding failed: ${error}`);
    result.duration = Date.now() - startTime;
    console.error('❌ Data seeding failed:', error);
    
    return result;
  }
}

/**
 * データのクリア（開発用）
 * 
 * 注意: 本番環境では使用しないでください
 */
export async function clearAllData(options: { confirm?: boolean } = {}): Promise<{
  success: boolean;
  cleared: { presets: number; conversations: number; messages: number };
  errors: string[];
}> {
  if (!options.confirm) {
    throw new Error('Data clearing requires explicit confirmation. Set confirm: true');
  }

  if (getCurrentEnvironmentMode() === 'PRODUCTION') {
    throw new Error('Data clearing is not allowed in production mode');
  }

  if (isMockMode()) {
    console.log('📝 Mock mode: Data clearing handled by mock client');
    return { success: true, cleared: { presets: 0, conversations: 0, messages: 0 }, errors: [] };
  }

  const client = getRealAmplifyClient() as any; // Type assertion for Phase 3 compatibility
  const cleared = { presets: 0, conversations: 0, messages: 0 };
  const errors: string[] = [];

  try {
    console.log('🗑️ Clearing all data...');

    // メッセージの削除
    const messages = await client.models.Message.list();
    if (messages.data) {
      for (const message of messages.data) {
        try {
          await client.models.Message.delete({ id: message.id });
          cleared.messages++;
        } catch (error) {
          errors.push(`Failed to delete message ${message.id}: ${error}`);
        }
      }
    }

    // 会話の削除
    const conversations = await client.models.Conversation.list();
    if (conversations.data) {
      for (const conversation of conversations.data) {
        try {
          await client.models.Conversation.delete({ id: conversation.id });
          cleared.conversations++;
        } catch (error) {
          errors.push(`Failed to delete conversation ${conversation.id}: ${error}`);
        }
      }
    }

    // プリセットの削除
    const presets = await client.models.AgentPreset.list();
    if (presets.data) {
      for (const preset of presets.data) {
        try {
          await client.models.AgentPreset.delete({ id: preset.id });
          cleared.presets++;
        } catch (error) {
          errors.push(`Failed to delete preset ${preset.id}: ${error}`);
        }
      }
    }

    console.log(`🗑️ Cleared: ${cleared.messages} messages, ${cleared.conversations} conversations, ${cleared.presets} presets`);

    return {
      success: errors.length === 0,
      cleared,
      errors
    };
  } catch (error) {
    errors.push(`Failed to clear data: ${error}`);
    console.error('❌ Data clearing failed:', error);
    
    return {
      success: false,
      cleared,
      errors
    };
  }
}

/**
 * 使用例とベストプラクティス
 * 
 * 1. 基本的なデータ投入:
 * ```typescript
 * import { seedAllData } from '@/lib/amplify/seeding';
 * 
 * // 全データの投入
 * const result = await seedAllData({ verbose: true });
 * console.log('Seeding result:', result);
 * ```
 * 
 * 2. 特定データのみ投入:
 * ```typescript
 * // プリセットのみ
 * await seedAllData({ only: ['presets'], verbose: true });
 * 
 * // 会話とメッセージのみ
 * await seedAllData({ only: ['conversations'], verbose: true });
 * ```
 * 
 * 3. 開発環境のリセット:
 * ```typescript
 * // データクリア後に再投入
 * await clearAllData({ confirm: true });
 * await seedAllData({ force: true, verbose: true });
 * ```
 * 
 * 4. カスタムサンプル数:
 * ```typescript
 * await seedAllData({
 *   sampleCount: {
 *     conversations: 5,
 *     messagesPerConversation: 3
 *   },
 *   verbose: true
 * });
 * ```
 */