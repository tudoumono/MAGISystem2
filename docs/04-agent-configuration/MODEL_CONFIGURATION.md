# MAGIシステム向けAWS Bedrockモデル推奨リスト

## 概要
3賢者（CASPAR、BALTHASAR、MELCHIOR）+ SOLOMON Judgeのマルチエージェントシステムに適したモデルを、各エージェントの特性とモデルの特徴を組み合わせて推奨します。

---

## 🎯 推奨モデル構成パターン

### パターン1: 最高品質・多様性重視
**目的**: 最も高度な推論と多様な視点を実現

| エージェント | モデル | 理由 |
|------------|--------|------|
| **CASPAR** (保守的) | `anthropic.claude-opus-4-1-20250805-v1:0` | 最高レベルの推論能力、慎重な分析に最適 |
| **BALTHASAR** (革新的) | `amazon.nova-premier-v1:0` | マルチモーダル対応、創造的な視点 |
| **MELCHIOR** (バランス型) | `anthropic.claude-sonnet-4-5-20250929-v1:0` | 高速かつバランスの取れた推論 |
| **SOLOMON** (Judge) | `anthropic.claude-opus-4-20250514-v1:0` | 最高レベルの評価・統合能力 |

**特徴**:
- ストリーミング対応: 全モデル ✅
- コスト: 高
- レイテンシ: 中〜高
- 品質: 最高

---

### パターン2: コストパフォーマンス重視
**目的**: 品質を保ちつつコストを抑える

| エージェント | モデル | 理由 |
|------------|--------|------|
| **CASPAR** (保守的) | `anthropic.claude-3-7-sonnet-20250219-v1:0` | 高品質で安定した推論 |
| **BALTHASAR** (革新的) | `amazon.nova-pro-v1:0` | マルチモーダル、コスパ良好 |
| **MELCHIOR** (バランス型) | `anthropic.claude-haiku-4-5-20251001-v1:0` | 高速・低コスト |
| **SOLOMON** (Judge) | `anthropic.claude-sonnet-4-20250514-v1:0` | バランスの取れた評価能力 |

**特徴**:
- ストリーミング対応: 全モデル ✅
- コスト: 中
- レイテンシ: 低〜中
- 品質: 高

---

### パターン3: 超高速・リアルタイム重視
**目的**: 2秒以内の初回応答を実現

| エージェント | モデル | 理由 |
|------------|--------|------|
| **CASPAR** (保守的) | `anthropic.claude-3-5-haiku-20241022-v1:0` | 最速クラス、テキスト専用 |
| **BALTHASAR** (革新的) | `amazon.nova-lite-v1:0` | 軽量マルチモーダル |
| **MELCHIOR** (バランス型) | `anthropic.claude-haiku-4-5-20251001-v1:0` | 高速・高品質 |
| **SOLOMON** (Judge) | `anthropic.claude-3-7-sonnet-20250219-v1:0` | 高速かつ正確な評価 |

**特徴**:
- ストリーミング対応: 全モデル ✅
- コスト: 低
- レイテンシ: 最低
- 品質: 中〜高

---

### パターン4: 特化型・実験的構成
**目的**: 各エージェントの個性を最大化

| エージェント | モデル | 理由 |
|------------|--------|------|
| **CASPAR** (保守的) | `cohere.command-r-plus-v1:0` | RAG・検索に強い、事実重視 |
| **BALTHASAR** (革新的) | `deepseek.r1-v1:0` | 推論特化、創造的思考 |
| **MELCHIOR** (バランス型) | `meta.llama3-3-70b-instruct-v1:0` | オープンソース系最高峰 |
| **SOLOMON** (Judge) | `anthropic.claude-opus-4-1-20250805-v1:0` | 最高レベルの統合判断 |

**特徴**:
- ストリーミング対応: 全モデル ✅
- コスト: 中〜高
- レイテンシ: 中
- 品質: 高（多様性最大）

---

## 📊 モデル詳細情報

### Anthropic Claude シリーズ

#### Claude Opus 4.1 (最高性能)
```
modelId: anthropic.claude-opus-4-1-20250805-v1:0
入力: TEXT, IMAGE
出力: TEXT
ストリーミング: ✅
用途: 最高レベルの推論・評価が必要な場面
```

#### Claude Sonnet 4.5 (バランス型)
```
modelId: anthropic.claude-sonnet-4-5-20250929-v1:0
入力: TEXT, IMAGE
出力: TEXT
ストリーミング: ✅
用途: 高品質かつ高速な推論
```

#### Claude Haiku 4.5 (高速)
```
modelId: anthropic.claude-haiku-4-5-20251001-v1:0
入力: TEXT, IMAGE
出力: TEXT
ストリーミング: ✅
用途: 低レイテンシが求められる場面
```

#### Claude 3.7 Sonnet (最新)
```
modelId: anthropic.claude-3-7-sonnet-20250219-v1:0
入力: TEXT, IMAGE
出力: TEXT
ストリーミング: ✅
用途: 最新の改善を活用したい場面
```

---

### Amazon Nova シリーズ

#### Nova Premier (最高性能)
```
modelId: amazon.nova-premier-v1:0
入力: TEXT, IMAGE, VIDEO
出力: TEXT
ストリーミング: ✅
用途: マルチモーダル対応が必要な最高品質推論
```

#### Nova Pro (バランス型)
```
modelId: amazon.nova-pro-v1:0
入力: TEXT, IMAGE, VIDEO
出力: TEXT
ストリーミング: ✅
用途: コスパの良いマルチモーダル推論
```

#### Nova Lite (軽量)
```
modelId: amazon.nova-lite-v1:0
入力: TEXT, IMAGE, VIDEO
出力: TEXT
ストリーミング: ✅
用途: 高速・低コストのマルチモーダル推論
```

#### Nova Micro (超軽量)
```
modelId: amazon.nova-micro-v1:0
入力: TEXT
出力: TEXT
ストリーミング: ✅
用途: 最小レイテンシ・最小コスト
```

---

### Meta Llama シリーズ

#### Llama 4 Scout 17B (最新)
```
modelId: meta.llama4-scout-17b-instruct-v1:0
入力: TEXT, IMAGE
出力: TEXT
ストリーミング: ✅
用途: 最新のLlama 4、マルチモーダル対応
```

#### Llama 3.3 70B (高性能)
```
modelId: meta.llama3-3-70b-instruct-v1:0
入力: TEXT
出力: TEXT
ストリーミング: ✅
用途: オープンソース系最高峰の推論能力
```

#### Llama 3.2 90B (マルチモーダル)
```
modelId: meta.llama3-2-90b-instruct-v1:0
入力: TEXT, IMAGE
出力: TEXT
ストリーミング: ✅
用途: 大規模マルチモーダル推論
```

---

### その他の注目モデル

#### DeepSeek R1 (推論特化)
```
modelId: deepseek.r1-v1:0
入力: TEXT
出力: TEXT
ストリーミング: ✅
用途: 複雑な推論・数学的思考が必要な場面
特徴: Chain-of-Thought推論に強い
```

#### Cohere Command R+ (RAG特化)
```
modelId: cohere.command-r-plus-v1:0
入力: TEXT
出力: TEXT
ストリーミング: ✅
用途: 検索拡張生成、事実ベースの回答
特徴: 引用・ソース追跡に優れる
```

#### Mistral Pixtral Large (マルチモーダル)
```
modelId: mistral.pixtral-large-2502-v1:0
入力: TEXT, IMAGE
出力: TEXT
ストリーミング: ✅
用途: 画像理解を含む推論
```

---

## 🔧 実装時の考慮事項

### 1. ストリーミング対応
全推奨モデルは`responseStreamingSupported: true`のため、リアルタイムUI更新が可能です。

### 2. コンテキストウィンドウ
- **Nova Premier**: 最大1000k tokens (超長文対応)
- **Claude Opus 4.1**: 200k tokens
- **Llama 3.3 70B**: 128k tokens

### 3. マルチモーダル対応
画像・動画分析が必要な場合:
- Amazon Nova シリーズ (Premier/Pro/Lite)
- Anthropic Claude シリーズ (Opus/Sonnet/Haiku)
- Meta Llama 4 Scout / Llama 3.2 90B
- Mistral Pixtral Large

### 4. 推論トレース
DeepSeek R1は推論過程を明示的に出力するため、トレース可視化に最適です。

### 5. コスト最適化
- **開発環境**: Nova Lite + Claude Haiku
- **本番環境**: Nova Pro + Claude Sonnet
- **プレミアム**: Nova Premier + Claude Opus

---

## 🎨 エージェント特性とモデルマッチング

### CASPAR (保守的・現実的)
**求められる特性**: 慎重な分析、リスク評価、実行可能性の検証

**推奨モデル**:
1. `anthropic.claude-opus-4-1-20250805-v1:0` - 最高の慎重さ
2. `cohere.command-r-plus-v1:0` - 事実ベース、引用重視
3. `anthropic.claude-3-7-sonnet-20250219-v1:0` - バランス型

### BALTHASAR (革新的・感情的)
**求められる特性**: 創造性、倫理的配慮、新しい視点

**推奨モデル**:
1. `amazon.nova-premier-v1:0` - マルチモーダル、創造的
2. `deepseek.r1-v1:0` - 独創的な推論
3. `meta.llama4-scout-17b-instruct-v1:0` - 最新技術

### MELCHIOR (バランス型・科学的)
**求められる特性**: データ重視、論理的思考、中立性

**推奨モデル**:
1. `anthropic.claude-sonnet-4-5-20250929-v1:0` - バランス最適
2. `amazon.nova-pro-v1:0` - 汎用性高い
3. `meta.llama3-3-70b-instruct-v1:0` - 論理的推論

### SOLOMON (Judge・統括)
**求められる特性**: 統合判断、スコアリング、最終決定

**推奨モデル**:
1. `anthropic.claude-opus-4-1-20250805-v1:0` - 最高の判断力
2. `anthropic.claude-opus-4-20250514-v1:0` - 評価特化
3. `anthropic.claude-sonnet-4-20250514-v1:0` - 高速評価

---

## 📈 パフォーマンス比較

### レイテンシ (初回トークンまでの時間)
```
超高速 (<500ms):
- Claude 3.5 Haiku
- Nova Micro
- Nova Lite

高速 (500ms-1s):
- Claude Haiku 4.5
- Claude 3.7 Sonnet
- Nova Pro

中速 (1s-2s):
- Claude Sonnet 4.5
- Llama 3.3 70B
- DeepSeek R1

低速 (>2s):
- Claude Opus 4.1
- Nova Premier
```

### コスト (相対的)
```
低コスト:
- Nova Micro
- Nova Lite
- Claude Haiku

中コスト:
- Nova Pro
- Claude Sonnet
- Llama 3.3 70B

高コスト:
- Nova Premier
- Claude Opus
```

---

## 🚀 推奨実装戦略

### フェーズ1: プロトタイプ
```typescript
const AGENT_MODELS = {
  caspar: 'anthropic.claude-haiku-4-5-20251001-v1:0',
  balthasar: 'amazon.nova-lite-v1:0',
  melchior: 'anthropic.claude-haiku-4-5-20251001-v1:0',
  solomon: 'anthropic.claude-3-7-sonnet-20250219-v1:0'
};
```

### フェーズ2: 本番環境
```typescript
const AGENT_MODELS = {
  caspar: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
  balthasar: 'amazon.nova-pro-v1:0',
  melchior: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
  solomon: 'anthropic.claude-opus-4-20250514-v1:0'
};
```

### フェーズ3: プレミアム
```typescript
const AGENT_MODELS = {
  caspar: 'anthropic.claude-opus-4-1-20250805-v1:0',
  balthasar: 'amazon.nova-premier-v1:0',
  melchior: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
  solomon: 'anthropic.claude-opus-4-1-20250805-v1:0'
};
```

---

## 🔄 動的モデル選択

ユーザーの要求に応じて動的にモデルを切り替える実装例:

```typescript
interface ModelSelectionCriteria {
  priority: 'speed' | 'quality' | 'cost';
  multimodal: boolean;
  contextLength: number;
}

function selectModels(criteria: ModelSelectionCriteria) {
  if (criteria.priority === 'speed') {
    return SPEED_OPTIMIZED_MODELS;
  } else if (criteria.priority === 'quality') {
    return QUALITY_OPTIMIZED_MODELS;
  } else {
    return COST_OPTIMIZED_MODELS;
  }
}
```

---

## 📝 まとめ

MAGIシステムに最適なモデル選択は、以下の要素のバランスで決定します:

1. **品質**: 推論の深さと正確性
2. **速度**: 初回応答時間とストリーミング性能
3. **コスト**: トークン単価と実行頻度
4. **多様性**: 3賢者の視点の違いを最大化
5. **特性**: 各エージェントの役割との適合性

**推奨開始構成**: パターン2（コストパフォーマンス重視）から始めて、ユーザーフィードバックに基づいて最適化することをお勧めします。
