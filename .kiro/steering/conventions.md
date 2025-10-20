# Development Conventions

## 命名規則

### ファイル・ディレクトリ
- **Components**: PascalCase (`AgentPanel.tsx`)
- **Pages**: kebab-case (`agent-dashboard/page.tsx`)
- **Utilities**: camelCase (`formatTraceStep.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`AGENT_TYPES.ts`)

## AI可読性ガイドライン

### コメント標準
```typescript
/**
 * [Component/Function Name] - [簡潔な説明]
 * 
 * 目的: [なぜこのコンポーネント/関数が必要か]
 * 設計理由: [なぜこの実装方法を選んだか]
 * 
 * @param {Type} param - [パラメータの説明と使用理由]
 * @returns {Type} [戻り値の説明と意味]
 * 
 * 使用例:
 * ```typescript
 * // 実際の使用例
 * ```
 * 
 * 関連: [関連ファイルや学習リソース]
 */
```

### ファイルヘッダー標準
```typescript
/**
 * [ファイル名] - [システムでの役割]
 * 
 * このファイルは[具体的な責務]を担当します。
 * [技術選択の理由や重要な設計判断]
 * 
 * 主要機能:
 * - [機能1]: [説明]
 * - [機能2]: [説明]
 * 
 * 学習ポイント:
 * - [重要な概念1]
 * - [重要な概念2]
 */
```

### 変数・関数
- **Variables**: camelCase (`traceId`, `agentResponse`)
- **Functions**: camelCase (`executeAgent`, `formatScore`)
- **Types/Interfaces**: PascalCase (`AgentResponse`, `TraceStep`)
- **Enums**: PascalCase (`AgentType`, `ExecutionStatus`)

## ディレクトリ構成
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証が必要なページ
│   ├── api/               # API Routes
│   └── globals.css        # グローバルスタイル
├── components/            # React Components
│   ├── ui/               # 基本UIコンポーネント
│   ├── agents/           # エージェント関連
│   └── trace/            # トレース表示
├── lib/                  # ユーティリティ
│   ├── auth/            # 認証関連
│   ├── agents/          # エージェント連携
│   └── trace/           # トレース処理
├── types/               # TypeScript型定義
└── hooks/               # カスタムフック

amplify/
├── auth/                # Amplify Auth設定
├── data/                # Data/AI Kit設定
│   └── types/          # 共有型定義
├── functions/           # カスタムハンドラー
└── backend.ts          # Amplify設定

agents/                  # Strands Agents
├── caspar/             # CASPAR エージェント
├── balthasar/          # BALTHASAR エージェント
├── melchior/           # MELCHIOR エージェント
├── solomon/            # SOLOMON Judge
└── shared/             # 共通ユーティリティ
```

## 型共有規約
- **共通型**: `amplify/data/types/` に定義
- **フロントエンド**: `src/types/` でAmplify型を拡張
- **エージェント**: `agents/shared/types.py` で型定義
- **API契約**: OpenAPI仕様書で管理

## PR・テスト規約

### Pull Request
1. **Branch命名**: `feature/agent-panel`, `fix/trace-display`
2. **Commit Message**: Conventional Commits形式
3. **Review**: 最低1名のレビュー必須
4. **CI**: 全テスト通過 + 型チェック + Lint

### テスト戦略
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Playwright
- **E2E Tests**: Cypress (主要フロー)
- **Agent Tests**: pytest (Python側)

## プロンプト管理

### Judge Prompt (単一ソース)
```typescript
// src/lib/prompts/solomon.ts
export const SOLOMON_JUDGE_PROMPT = `
あなたはSOLOMON Judgeです。
3賢者（CASPAR、BALTHASAR、MELCHIOR）の回答を評価し、
0-100点でスコアリングして統合判断を行ってください。
...
`;
```

### エージェント別プロンプト
- **CASPAR**: 保守的・現実的な視点
- **BALTHASAR**: 革新的・感情的な視点  
- **MELCHIOR**: バランス型・科学的な視点

## API契約管理

### 破壊的変更フロー
1. **Deprecation Notice**: 3ヶ月前に通知
2. **Version Management**: `/api/v1/`, `/api/v2/`
3. **Migration Guide**: 詳細な移行手順
4. **Backward Compatibility**: 可能な限り維持

### スキーマ管理
- **GraphQL**: Amplify Data schema
- **REST API**: OpenAPI 3.0仕様書
- **Type Generation**: 自動生成 + 手動調整

## コード品質

### Linting
- **ESLint**: Next.js推奨設定 + カスタムルール
- **Prettier**: 統一フォーマット
- **TypeScript**: strict mode有効

### Performance
- **Bundle Analysis**: `@next/bundle-analyzer`
- **Core Web Vitals**: 継続監視
- **Image Optimization**: Next.js Image component