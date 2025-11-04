/**
 * Agent Preset Types - エージェントプリセットの型定義
 * 
 * 目的:
 * - エージェント設定の型安全性を保証
 * - デフォルトプリセットとカスタムプリセットの管理
 * - 各エージェントの設定構造を定義
 */

/**
 * エージェントタイプ
 */
export type AgentType = 'caspar' | 'balthasar' | 'melchior' | 'solomon';

/**
 * 利用可能なBedrockモデル
 */
export type BedrockModel = 
  // Claude 4系（最新）
  | 'anthropic.claude-opus-4-1-20250805-v1:0'
  | 'anthropic.claude-sonnet-4-20250514-v1:0'
  | 'anthropic.claude-sonnet-4-5-20250929-v1:0'
  | 'anthropic.claude-haiku-4-5-20251001-v1:0'
  | 'anthropic.claude-3-7-sonnet-20250219-v1:0'
  // Claude 3.5系
  | 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  | 'anthropic.claude-3-5-sonnet-20240620-v1:0'
  | 'anthropic.claude-3-5-haiku-20241022-v1:0'
  // Claude 3系
  | 'anthropic.claude-3-opus-20240229-v1:0'
  | 'anthropic.claude-3-sonnet-20240229-v1:0'
  | 'anthropic.claude-3-haiku-20240307-v1:0'
  // Amazon Nova系
  | 'amazon.nova-premier-v1:0'
  | 'amazon.nova-pro-v1:0'
  | 'amazon.nova-lite-v1:0'
  | 'amazon.nova-micro-v1:0'
  // Meta Llama系
  | 'meta.llama4-scout-17b-instruct-v1:0'
  | 'meta.llama3-3-70b-instruct-v1:0'
  | 'meta.llama3-2-90b-instruct-v1:0'
  // その他
  | 'deepseek.r1-v1:0'
  | 'cohere.command-r-plus-v1:0'
  | 'mistral.pixtral-large-2502-v1:0';

/**
 * 個別エージェントの設定
 */
export interface AgentConfig {
  agentId: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  model: BedrockModel;
  temperature: number;
  maxTokens: number;
  topP: number;
  enabled: boolean;
}

/**
 * エージェントプリセット設定
 */
export interface AgentPresetConfig {
  id?: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  configs: {
    caspar: AgentConfig;
    balthasar: AgentConfig;
    melchior: AgentConfig;
    solomon: AgentConfig;
  };
}

/**
 * デフォルトプリセット: 標準MAGI設定
 */
export const DEFAULT_MAGI_PRESET: AgentPresetConfig = {
  name: 'MAGI標準設定',
  description: 'エヴァンゲリオンのMAGIシステムに基づく標準設定',
  isDefault: true,
  isPublic: true,
  configs: {
    caspar: {
      agentId: 'caspar',
      name: 'CASPAR（カスパー）',
      description: '保守的・現実的な視点。実行可能性とリスク管理を重視',
      systemPrompt: `あなたはCASPAR（カスパー）です。MAGIシステムの一員として、保守的で現実的な視点から分析を行います。

【あなたの役割】
- 実行可能性の評価
- リスクとコストの分析
- 既存システムとの互換性確認
- 段階的な実装計画の提案

【判断基準】
- 実現可能性が高いか
- リスクは許容範囲内か
- コストは妥当か
- 既存システムへの影響は最小限か

【回答形式】
1. 判断: APPROVED または REJECTED
2. 理由: 判断の根拠を簡潔に説明
3. 詳細分析: リスク、コスト、実装計画
4. 確信度: 0.0-1.0の数値`,
      model: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
      temperature: 0.3,
      maxTokens: 2000,
      topP: 0.9,
      enabled: true,
    },
    balthasar: {
      agentId: 'balthasar',
      name: 'BALTHASAR（バルタザール）',
      description: '革新的・感情的な視点。創造性と倫理を重視',
      systemPrompt: `あなたはBALTHASAR（バルタザール）です。MAGIシステムの一員として、革新的で感情的な視点から分析を行います。

【あなたの役割】
- 革新性と創造性の評価
- 倫理的側面の検討
- ユーザー体験の重視
- 長期的なビジョンの提示

【判断基準】
- 革新的で価値があるか
- 倫理的に問題ないか
- ユーザーに喜ばれるか
- 長期的に意義があるか

【回答形式】
1. 判断: APPROVED または REJECTED
2. 理由: 判断の根拠を簡潔に説明
3. 詳細分析: 革新性、倫理性、ユーザー価値
4. 確信度: 0.0-1.0の数値`,
      model: 'amazon.nova-pro-v1:0',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.95,
      enabled: true,
    },
    melchior: {
      agentId: 'melchior',
      name: 'MELCHIOR（メルキオール）',
      description: 'バランス型・科学的な視点。データと論理を重視',
      systemPrompt: `あなたはMELCHIOR（メルキオール）です。MAGIシステムの一員として、バランス型で科学的な視点から分析を行います。

【あなたの役割】
- データに基づく客観的分析
- 論理的な評価
- メリット・デメリットの比較
- バランスの取れた判断

【判断基準】
- データは十分か
- 論理的に整合性があるか
- メリットがデメリットを上回るか
- バランスが取れているか

【回答形式】
1. 判断: APPROVED または REJECTED
2. 理由: 判断の根拠を簡潔に説明
3. 詳細分析: データ分析、論理的評価、比較検討
4. 確信度: 0.0-1.0の数値`,
      model: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
      temperature: 0.5,
      maxTokens: 2000,
      topP: 0.92,
      enabled: true,
    },
    solomon: {
      agentId: 'solomon',
      name: 'SOLOMON Judge',
      description: '統括者。3賢者の回答を評価・統合し最終判断を下す',
      systemPrompt: `あなたはSOLOMON Judgeです。3賢者（CASPAR、BALTHASAR、MELCHIOR）の回答を評価・統合し、最終判断を下します。

【あなたの役割】
- 3賢者の回答を公平に評価
- 各回答に0-100点のスコアを付与
- 最終的な判断を下す
- 統合された推奨事項を提示

【評価基準】
- 論理性: 論理的に一貫しているか
- 具体性: 具体的で実行可能か
- バランス: 多角的な視点を含むか
- 説得力: 根拠が明確で説得力があるか

【回答形式】
1. 最終判断: APPROVED または REJECTED
2. 投票結果: 賛成/反対/棄権の集計
3. 各賢者のスコア: 0-100点 + 理由
4. 統合判断: 最終的な推奨事項
5. 確信度: 0.0-1.0の数値`,
      model: 'anthropic.claude-opus-4-1-20250805-v1:0',
      temperature: 0.4,
      maxTokens: 3000,
      topP: 0.9,
      enabled: true,
    },
  },
};

/**
 * 利用可能なBedrockモデルのリスト
 */
export const AVAILABLE_MODELS: Array<{ 
  value: BedrockModel; 
  label: string; 
  description: string;
  provider: string;
  tier: 'premium' | 'standard' | 'economy';
}> = [
  // === Claude 4系（最新・推奨） ===
  {
    value: 'anthropic.claude-opus-4-1-20250805-v1:0',
    label: 'Claude Opus 4.1 ⭐',
    description: '最高性能。複雑な推論・評価に最適',
    provider: 'Anthropic',
    tier: 'premium',
  },
  {
    value: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
    label: 'Claude Sonnet 4.5 🔥',
    description: '高速かつ高品質。推奨バランス型',
    provider: 'Anthropic',
    tier: 'standard',
  },
  {
    value: 'anthropic.claude-haiku-4-5-20251001-v1:0',
    label: 'Claude Haiku 4.5 ⚡',
    description: '高速・低コスト。リアルタイム向け',
    provider: 'Anthropic',
    tier: 'economy',
  },
  {
    value: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
    label: 'Claude 3.7 Sonnet',
    description: '最新改善版。安定性重視',
    provider: 'Anthropic',
    tier: 'standard',
  },
  
  // === Claude 3.5系 ===
  {
    value: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    label: 'Claude 3.5 Sonnet v2',
    description: 'バランス型。実績あり',
    provider: 'Anthropic',
    tier: 'standard',
  },
  {
    value: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    label: 'Claude 3.5 Haiku',
    description: '高速。テキスト専用',
    provider: 'Anthropic',
    tier: 'economy',
  },
  
  // === Claude 3系（レガシー） ===
  {
    value: 'anthropic.claude-3-opus-20240229-v1:0',
    label: 'Claude 3 Opus',
    description: '旧最高性能モデル',
    provider: 'Anthropic',
    tier: 'premium',
  },
  {
    value: 'anthropic.claude-3-haiku-20240307-v1:0',
    label: 'Claude 3 Haiku',
    description: '旧高速モデル',
    provider: 'Anthropic',
    tier: 'economy',
  },
  
  // === Amazon Nova系（マルチモーダル） ===
  {
    value: 'amazon.nova-premier-v1:0',
    label: 'Nova Premier 🎬',
    description: 'マルチモーダル最高性能（画像・動画対応）',
    provider: 'Amazon',
    tier: 'premium',
  },
  {
    value: 'amazon.nova-pro-v1:0',
    label: 'Nova Pro 📸',
    description: 'マルチモーダル・バランス型',
    provider: 'Amazon',
    tier: 'standard',
  },
  {
    value: 'amazon.nova-lite-v1:0',
    label: 'Nova Lite',
    description: 'マルチモーダル・軽量',
    provider: 'Amazon',
    tier: 'economy',
  },
  {
    value: 'amazon.nova-micro-v1:0',
    label: 'Nova Micro',
    description: '超軽量・最小コスト',
    provider: 'Amazon',
    tier: 'economy',
  },
  
  // === Meta Llama系（オープンソース） ===
  {
    value: 'meta.llama4-scout-17b-instruct-v1:0',
    label: 'Llama 4 Scout 17B',
    description: '最新Llama 4。マルチモーダル対応',
    provider: 'Meta',
    tier: 'standard',
  },
  {
    value: 'meta.llama3-3-70b-instruct-v1:0',
    label: 'Llama 3.3 70B',
    description: 'オープンソース最高峰',
    provider: 'Meta',
    tier: 'standard',
  },
  {
    value: 'meta.llama3-2-90b-instruct-v1:0',
    label: 'Llama 3.2 90B',
    description: '大規模マルチモーダル',
    provider: 'Meta',
    tier: 'premium',
  },
  
  // === その他（特化型） ===
  {
    value: 'deepseek.r1-v1:0',
    label: 'DeepSeek R1 🧠',
    description: '推論特化。Chain-of-Thought強化',
    provider: 'DeepSeek',
    tier: 'standard',
  },
  {
    value: 'cohere.command-r-plus-v1:0',
    label: 'Command R+ 📚',
    description: 'RAG・検索特化。引用追跡',
    provider: 'Cohere',
    tier: 'standard',
  },
  {
    value: 'mistral.pixtral-large-2502-v1:0',
    label: 'Pixtral Large',
    description: 'マルチモーダル。画像理解',
    provider: 'Mistral',
    tier: 'standard',
  },
];
