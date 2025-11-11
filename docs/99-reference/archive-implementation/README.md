# アーカイブ実装 - 非推奨コード

このディレクトリには、学習・参考目的で保存された非推奨の実装が含まれています。

## ⚠️ 重要な注意事項

**これらのファイルは実行可能コードとして使用しないでください。**

- アーカイブファイルは教育目的のみ
- 実際のプロジェクトでは使用されていません
- アーキテクチャの進化を理解するための参考資料です

## 📂 ファイル一覧

### `deprecated-bedrock-client-approach.ts`

**元の場所**: `src/app/api/magi/stream/route.ts`
**アーカイブ日**: 2025-11-10
**理由**: 参考記事のコンセプトと異なるアーキテクチャ

#### 概要

PR #5で実装されたBedrockAgentCoreClient方式のAPI Route。

**アーキテクチャ（誤った実装）**:
```
Amplify Hosting (Next.js)
  ↓ BedrockAgentCoreClient.send()
  ↓ AWS SigV4認証
Amazon Bedrock AgentCore Runtime (独立デプロイ)
  └─ magi_agent.py
```

**問題点**:
- AWS SDKを使用した直接呼び出しは、参考記事のコンセプトと異なる
- MAGIシステムは既存のPythonエージェント（Strands Agents）を活用する方針
- AgentCore Runtimeは独立デプロイではなく、Next.jsバックエンドから子プロセスとして実行

**正しいアーキテクチャ（PR #6以降）**:
```
Amplify Hosting (Next.js Frontend)
  ↓ HTTP POST /invocations
AgentCore Runtime (Docker Container)
  ├─ Next.jsバックエンド (ポート8080)
  │   └─ spawn('python', ['magi_agent.py'])
  └─ Python magi_agent.py (Strands Agents使用)
```

#### 学習ポイント

1. **AWS SDKの使用タイミング**:
   - ❌ AgentCore Runtimeへの直接呼び出し
   - ✅ Lambda関数内でのAWSサービス操作

2. **参考記事の重要性**:
   - アーキテクチャ設計は参考記事のコンセプトに基づくべき
   - 独自解釈ではなく、実証済みパターンを採用

3. **子プロセス vs AWS SDK**:
   - Next.jsから子プロセス実行: シンプルで直接的
   - AWS SDK経由: オーバーヘッドが大きく、複雑

#### 参考リンク

- **正しい実装**: `agents/backend/app/api/invocations/route.ts`
- **Pythonエージェント**: `agents/magi_agent.py`
- **アーキテクチャ詳細**: [../../02-architecture/OVERVIEW.md](../../02-architecture/OVERVIEW.md)
- **設計判断**: [../../02-architecture/DESIGN_DECISIONS.md](../../02-architecture/DESIGN_DECISIONS.md)

## 🔍 他のアーカイブファイル（将来追加予定）

今後、プロジェクトの進化に伴い、以下のようなファイルが追加される可能性があります：

- 試験的な実装
- パフォーマンステストコード
- 代替アプローチの検証コード

## 📝 アーカイブポリシー

### アーカイブ対象

- 非推奨になった実装
- 学習価値のある試験的コード
- アーキテクチャ判断の根拠となるコード

### アーカイブしないもの

- 単なるバグ修正前のコード
- 学習価値のない不完全なコード
- セキュリティリスクのあるコード

## 🤝 貢献

アーカイブファイルに関する質問や追加の説明が必要な場合は、[GitHub Issues](https://github.com/tudoumono/MAGISystem2/issues)でお知らせください。
