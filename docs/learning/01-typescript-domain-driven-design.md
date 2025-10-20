# TypeScript設計パターン（ドメイン駆動設計）学習ガイド

## 📚 学習目標

このドキュメントでは、MAGI Decision Systemの実装を通じて、TypeScriptを使ったドメイン駆動設計（DDD）の実践的な手法を学習します。

## 🎯 ドメイン駆動設計とは？

ドメイン駆動設計（Domain-Driven Design, DDD）は、**ビジネスロジック（ドメイン）を中心**に据えたソフトウェア設計手法です。技術的な実装詳細よりも、**問題領域の本質**を重視し、ビジネス専門家と開発者が共通の言語で対話できるモデルを構築します。

### 核心概念
- **ドメイン**: 問題領域（MAGIシステムの場合：意思決定支援）
- **エンティティ**: 一意性を持つオブジェクト
- **バリューオブジェクト**: 値そのものが重要なオブジェクト
- **ドメインサービス**: 複数のオブジェクトにまたがるビジネスロジック

## 📁 関連ソースコード

### 主要ファイル
- **`src/types/domain.ts`** - ドメインモデルの中核定義
- **`src/types/api.ts`** - API層との境界定義
- **`src/lib/mock/data.ts`** - ドメインロジックの実装例

## 🏗️ 実装パターン解説

### 1. ドメインの明確化

**ファイル**: `src/types/domain.ts` (行 15-25)

```typescript
/**
 * エージェントの種類を定義
 * 
 * 設計理由:
 * - 'solomon': 統括者として3賢者の判断を集約・評価
 * - 'caspar': 保守的・現実的な視点（リスク重視）
 * - 'balthasar': 革新的・感情的な視点（創造性重視）
 * - 'melchior': バランス型・科学的な視点（論理性重視）
 */
export type AgentType = 'solomon' | 'caspar' | 'balthasar' | 'melchior';

/**
 * 意思決定の結果を表す型
 * 
 * 設計理由:
 * - MAGIシステムの核心である可決/否決の二択判断
 * - 'APPROVED': 可決（実行推奨）
 * - 'REJECTED': 否決（実行非推奨）
 */
export type DecisionType = 'APPROVED' | 'REJECTED';
```

**学習ポイント**:
- Union Typesでビジネス概念を正確に表現
- 不正な値の混入を型レベルで防止
- 自己文書化による設計意図の明確化

### 2. エンティティの設計

**ファイル**: `src/types/domain.ts` (行 200-215)

```typescript
/**
 * 会話スレッド
 * 
 * 設計理由:
 * - id: 一意識別子（UUID）
 * - userId: オーナーベースアクセス制御用
 * - title: ユーザーが識別しやすい会話タイトル
 * - agentPresetId: 使用したエージェント設定の記録
 * - メタデータによる会話の分類・検索を可能にする
 */
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  agentPresetId?: string;          // 使用したプリセット設定
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}
```

**学習ポイント**:
- 一意識別子（id）による同一性の確保
- 関連オブジェクトとの関係性の表現
- オプショナルプロパティによる柔軟性の確保

### 3. バリューオブジェクトの設計

**ファイル**: `src/types/domain.ts` (行 85-100)

```typescript
/**
 * 個別エージェントの応答
 * 
 * 設計理由:
 * - decision: MAGI機能の核心である可決/否決判断
 * - content: 従来のチャット機能としての詳細回答
 * - reasoning: 判断に至った論理的根拠（透明性確保）
 * - confidence: 判断の確信度（不確実性の可視化）
 * - executionTime: パフォーマンス監視用
 */
export interface AgentResponse {
  agentId: AgentType;
  decision: DecisionType;          // 可決/否決の判断（MAGI機能）
  content: string;                 // 詳細な回答内容（従来機能）
  reasoning: string;               // 判断に至った論理的根拠
  confidence: number;              // 判断の確信度 (0.0-1.0)
  executionTime: number;           // 実行時間（ミリ秒）
  timestamp: Date;                 // 応答生成時刻
}
```

**学習ポイント**:
- 値そのものが重要な概念の表現
- 不変性を前提とした設計
- ビジネスルールの型による表現（confidence: 0.0-1.0）

### 4. ドメインサービスの設計

**ファイル**: `src/types/domain.ts` (行 110-135)

```typescript
/**
 * SOLOMON Judgeによる統合評価
 * 
 * 設計理由:
 * - finalDecision: SOLOMONの最終判断（MAGI投票システム）
 * - votingResult: 3賢者の投票結果の集計
 * - scores: 従来のスコアリングシステム（0-100点評価）
 * - 新旧システムの機能を両方サポートし、段階的移行を可能にする
 */
export interface JudgeResponse {
  // MAGI投票システム（新機能）
  finalDecision: DecisionType;     // SOLOMONの最終判断
  votingResult: {
    approved: number;              // 可決票数
    rejected: number;              // 否決票数
    abstained: number;             // 棄権票数（エラー等）
  };
  
  // 従来のスコアリングシステム
  scores: AgentScore[];            // 各賢者への0-100点評価
  summary: string;                 // 判断の要約
  finalRecommendation: string;     // 最終推奨（従来機能）
  reasoning: string;               // 最終判断の根拠
  confidence: number;              // 最終判断の確信度
  executionTime: number;           // 評価実行時間
  timestamp: Date;                 // 評価生成時刻
}
```

**学習ポイント**:
- 複数エンティティにまたがるビジネスロジック
- 段階的移行をサポートする設計
- 新旧機能の共存による互換性確保

### 5. 定数オブジェクトによるドメイン知識の集約

**ファイル**: `src/types/domain.ts` (行 45-60)

```typescript
/**
 * 各エージェントの特性と説明
 * 
 * 設計理由:
 * - UI表示用の説明文を一元管理
 * - 各エージェントの役割をユーザーに明確に伝える
 */
export const AGENT_DESCRIPTIONS = {
  solomon: 'SOLOMON Judge - 統括者として3賢者の投票を集計し、最終的な可決/否決を決定',
  caspar: 'CASPAR - 保守的・現実的な視点で可決/否決を判断（リスク重視）',
  balthasar: 'BALTHASAR - 革新的・感情的な視点で可決/否決を判断（創造性重視）',
  melchior: 'MELCHIOR - バランス型・科学的な視点で可決/否決を判断（論理性重視）'
} as const;
```

**学習ポイント**:
- `as const`による型の厳密化
- ドメイン知識の一元管理
- UI層での一貫した表示の確保

### 6. 実装例：モックデータでのドメインロジック

**ファイル**: `src/lib/mock/data.ts` (行 100-150)

```typescript
/**
 * 個別エージェントの応答を生成
 */
function generateAgentResponse(
  agentId: AgentType,
  decision: DecisionType,
  executionTime?: number
): AgentResponse {
  if (agentId === 'solomon') {
    throw new Error('SOLOMON is not a regular agent');
  }

  const responses = {
    caspar: CASPAR_RESPONSES,
    balthasar: BALTHASAR_RESPONSES,
    melchior: MELCHIOR_RESPONSES,
  };

  const agentResponses = responses[agentId][decision];
  const selectedResponse = randomChoice(agentResponses);

  return {
    agentId,
    decision,
    content: selectedResponse.content,
    reasoning: selectedResponse.reasoning,
    confidence: randomBetween(0.7, 0.95),
    executionTime: executionTime || Math.floor(randomBetween(800, 2000)),
    timestamp: new Date(),
  };
}
```

**学習ポイント**:
- ドメインルールの実装（SOLOMONは通常エージェントではない）
- 型安全性による実行時エラーの防止
- ビジネスロジックの具体的な実装

## 🎨 設計パターンの活用

### 1. Strategy Pattern

**ファイル**: `src/types/domain.ts` (行 290-305)

```typescript
/**
 * エージェント設定
 * 
 * 設計理由:
 * - agentId: 設定対象のエージェント
 * - modelId: 使用するLLMモデル
 * - systemPrompt: エージェントの人格・役割定義
 * - temperature: 創造性パラメータ
 * - maxTokens: 応答長制限
 * - 柔軟なエージェントカスタマイズを可能にする
 */
export interface AgentConfig {
  agentId: AgentType;
  modelId: string;                 // 使用LLMモデル
  systemPrompt: string;            // システムプロンプト
  temperature: number;             // 0.0-1.0
  maxTokens: number;               // 最大トークン数
}
```

### 2. Interface Segregation

**ファイル**: `src/types/api.ts` (行 85-100)

```typescript
/**
 * 会話サマリー（一覧表示用）
 * 
 * 設計理由:
 * - 一覧表示では詳細なメッセージ内容は不要
 * - パフォーマンス最適化のための軽量データ
 */
export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: Date;
  lastDecision?: {
    finalDecision: 'APPROVED' | 'REJECTED';
    confidence: number;
  } | undefined;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔍 実践的な使用例

### 型安全なエージェント実行

```typescript
// 使用例：型安全なエージェント実行
function executeAgent(
  agentType: AgentType,  // 不正な値は型エラー
  config: AgentConfig
): Promise<AgentResponse> {
  // 実装
}

// コンパイル時にエラーを検出
executeAgent('invalid-agent', config); // ❌ 型エラー
executeAgent('caspar', config);         // ✅ OK
```

### ドメインルールの実装

```typescript
// ビジネスルールの実装例
function validateDecision(responses: AgentResponse[]): boolean {
  // 3賢者すべての応答が必要
  const requiredAgents: AgentType[] = ['caspar', 'balthasar', 'melchior'];
  const responseAgents = responses.map(r => r.agentId);
  
  return requiredAgents.every(agent => responseAgents.includes(agent));
}
```

## 📈 学習の進め方

### Phase 1: 基本概念の理解
1. `src/types/domain.ts`を読み、各型定義の設計理由を理解
2. Union TypesとInterface設計の違いを把握
3. ドメイン概念の型表現方法を学習

### Phase 2: 実装パターンの習得
1. `src/lib/mock/data.ts`でドメインロジックの実装を確認
2. 型安全性がどのように実行時エラーを防ぐかを体験
3. ビジネスルールの実装方法を学習

### Phase 3: 設計原則の適用
1. 単一責任の原則に従ったインターフェース設計
2. 開放閉鎖の原則による拡張性の確保
3. 依存性逆転の原則によるテスタビリティの向上

## 🎯 学習成果の確認

以下の質問に答えられるようになったら、基本的な理解ができています：

1. **ドメインモデル**: MAGIシステムの核心概念は何ですか？
2. **型安全性**: Union Typesはどのような問題を解決しますか？
3. **設計原則**: エンティティとバリューオブジェクトの違いは？
4. **実装**: ドメインルールをTypeScriptでどう表現しますか？
5. **拡張性**: 新しいエージェントタイプを追加するには？

## 🔗 関連学習リソース

- **Next.js App Router**: `docs/learning/02-nextjs-app-router.md`
- **AWS Amplify Gen2**: `docs/learning/03-aws-amplify-gen2.md`
- **Tailwind CSS Design System**: `docs/learning/04-tailwind-design-system.md`

## 📝 実習課題

1. **新しいエージェントタイプの追加**
   - `AgentType`に新しい値を追加
   - 対応する設定とモックデータを実装

2. **カスタムバリューオブジェクトの作成**
   - 信頼度スコア（0-100）の型を作成
   - バリデーション関数を実装

3. **ドメインサービスの拡張**
   - 複数の判断履歴から傾向を分析する機能
   - 型安全な実装を心がける

---

**次のステップ**: [Next.js App Router学習ガイド](./02-nextjs-app-router.md)で、フロントエンド実装の詳細を学習しましょう。