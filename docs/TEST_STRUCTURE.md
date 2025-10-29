# テスト構造ドキュメント

## 概要

MAGIシステムのテストページは、機能別に整理されたカテゴリ構造になっています。

## ディレクトリ構造

```
src/app/test/
├── agents/              # エージェント関連テスト
│   ├── page.tsx        # エージェントテスト一覧
│   └── magi/           # MAGIエージェント固有のテスト
│
├── data/               # データ関連テスト
│   ├── page.tsx        # データテスト一覧
│   ├── amplify-models/ # Amplifyモデルテスト
│   ├── conversation/   # 会話機能テスト
│   └── models-check/   # モデル整合性チェック
│
├── integration/        # 統合テスト
│   ├── page.tsx        # 統合テスト一覧
│   ├── magi-production/# 本番環境MAGIテスト
│   ├── magi-stream/    # MAGIストリーミングテスト
│   ├── magi-trace/     # MAGIトレーステスト
│   └── production/     # 本番環境総合テスト
│
├── trace/              # トレース機能テスト
│   └── page.tsx
│
├── page.tsx            # メインテストページ（既存）
└── index-new.tsx       # 新しいカテゴリ別インデックス
```

## テストカテゴリ

### 1. Agent Tests (`/test/agents`)
- **目的**: エージェント機能の基本動作確認
- **テスト内容**:
  - Bedrock Agentsの基本的な動作
  - エージェント応答の検証
  - エラーハンドリング

### 2. Data Tests (`/test/data`)
- **目的**: データ関連機能のテスト
- **テスト内容**:
  - Amplifyデータモデルの動作確認
  - 会話機能（CRUD操作）
  - データ整合性チェック
  - 楽観的更新の動作確認

### 3. Integration Tests (`/test/integration`)
- **目的**: システム全体の統合テスト
- **テスト内容**:
  - MAGI本番環境テスト
  - ストリーミングAPI統合
  - トレース機能統合
  - エンドツーエンドテスト

### 4. Trace Tests (`/test/trace`)
- **目的**: トレース・観測可能性機能のテスト
- **テスト内容**:
  - OpenTelemetryトレーシング
  - リアルタイムトレース更新
  - トレース可視化

## アクセス方法

### ローカル開発環境
```bash
npm run dev
```

- メインテストページ: http://localhost:3000/test
- カテゴリ別インデックス: http://localhost:3000/test/index-new
- エージェントテスト: http://localhost:3000/test/agents
- データテスト: http://localhost:3000/test/data
- 統合テスト: http://localhost:3000/test/integration
- トレーステスト: http://localhost:3000/test/trace

### 本番環境
- https://main.d34f7t08qc7jy.amplifyapp.com/test

## テストの追加方法

### 新しいテストページの追加

1. 適切なカテゴリディレクトリに新しいページを作成
2. カテゴリのインデックスページ（`page.tsx`）にリンクを追加
3. 必要に応じてこのドキュメントを更新

例：
```typescript
// src/app/test/agents/new-test/page.tsx
export default function NewTestPage() {
  return (
    <div>
      {/* テスト内容 */}
    </div>
  );
}
```

### 新しいカテゴリの追加

1. `src/app/test/`配下に新しいディレクトリを作成
2. `page.tsx`でカテゴリインデックスを作成
3. `index-new.tsx`に新しいカテゴリを追加
4. このドキュメントを更新

## ベストプラクティス

1. **テストの独立性**: 各テストページは独立して動作すること
2. **明確な目的**: 各テストページは明確な目的を持つこと
3. **ドキュメント**: テストページには目的と使用方法を記載すること
4. **エラーハンドリング**: 適切なエラーハンドリングを実装すること
5. **クリーンアップ**: テスト後のクリーンアップ処理を実装すること

## トラブルシューティング

### テストページが表示されない
- Next.jsの開発サーバーが起動しているか確認
- ブラウザのキャッシュをクリア
- `npm run build`でビルドエラーがないか確認

### データが保存されない
- ブラウザのローカルストレージを確認
- Amplifyの設定が正しいか確認
- ネットワークタブでAPIリクエストを確認

## 関連ドキュメント

- [開発環境セットアップ](../ENVIRONMENT_SETUP.md)
- [Amplify Gen2ガイド](./learning/03-aws-amplify-gen2.md)
- [テストパターン](./learning/05-mock-data-patterns.md)
