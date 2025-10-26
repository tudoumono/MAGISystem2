# MAGI Decision System - 統合移行計画

## 📋 移行概要

既存の`consolidated-magi-system`（Lambda版）から`magi-agentcore-system`（AgentCore Runtime版）への統合移行を実施します。

## 🔄 移行戦略

### **統合の理由**
1. **技術的優位性**: AgentCore Runtimeの8時間実行、専用マイクロVM、自動スケーリング
2. **AWS公式サポート**: bedrock-agentcore-starter-toolkitによる確実なデプロイ
3. **保守性向上**: 1つのスペックによるシンプルな管理
4. **学習効果**: 最新AWS AI/MLサービスの実践経験

### **移行対象コンポーネント**

| コンポーネント | 移行方法 | 備考 |
|---------------|----------|------|
| **フロントエンドUI** | 再利用 | MAGIデザインシステムをそのまま活用 |
| **型定義** | 再利用 | amplify/types/を活用 |
| **エージェントロジック** | 移植 | agents/magi_strands_agents.pyを参考に実装 |
| **Lambda関数** | 置き換え | AgentCore Runtimeに置き換え |
| **Amplify設定** | 更新 | AgentCore Runtime統合に更新 |

## 📂 ファイル移行マップ

### **再利用するファイル**
```
src/components/          → そのまま活用
src/app/                → そのまま活用  
amplify/types/          → そのまま活用
docs/architecture/      → 更新して活用
tailwind.config.ts      → そのまま活用
package.json           → そのまま活用
```

### **移植・参考にするファイル**
```
agents/magi_strands_agents.py     → magi_agent.py（AgentCore版）
agents/pyproject.toml            → requirements.txt
amplify/functions/*/handler.ts   → 不要（AgentCore Runtimeが代替）
amplify/functions/*/magi_executor.py → magi_agent.py（統合）
```

### **削除・置き換えするファイル**
```
amplify/functions/bedrock-agent-gateway/  → 削除（AgentCore Runtimeが代替）
amplify/functions/agent-gateway-disabled/ → 削除
.kiro/specs/consolidated-magi-system/     → 削除（統合後）
```

## 🚀 段階的移行手順

### **Phase 1: AgentCore Runtime実装**
1. 新しいAgentCore Runtime環境の構築
2. MAGI Decision Systemの移植・実装
3. 基本動作確認

### **Phase 2: フロントエンド統合**
1. 既存UIコンポーネントの活用
2. API呼び出し先の変更（Lambda → AgentCore Runtime）
3. エンドツーエンドテスト

### **Phase 3: 旧実装クリーンアップ**
1. Lambda関数の削除
2. 不要なファイルの削除
3. ドキュメントの更新

## 📊 移行による改善効果

| 項目 | Lambda版 | AgentCore Runtime版 | 改善効果 |
|------|----------|-------------------|----------|
| **実行時間制限** | 15分 | 8時間 | 32倍向上 |
| **Cold Start** | あり | なし | 応答時間改善 |
| **セッション管理** | 手動実装 | 自動管理 | 開発効率向上 |
| **デプロイ複雑性** | 高 | 低（公式ツール） | 運用効率向上 |
| **監視・観測** | 手動実装 | 自動提供 | 運用品質向上 |

## 🎯 成功基準

### **技術的成功基準**
- ✅ AgentCore Runtime上でMAGI Decision Systemが動作
- ✅ 既存フロントエンドUIが問題なく動作
- ✅ パフォーマンスが向上（応答時間、スケーラビリティ）
- ✅ 運用・監視機能が向上

### **学習効果基準**
- ✅ AWS公式ツールの実践的活用
- ✅ 最新AI/MLサービスの理解
- ✅ アーキテクチャ移行の実践経験
- ✅ 企業レベルのシステム構築経験

## 📝 移行後の管理

### **統合後のスペック構成**
```
.kiro/specs/magi-agentcore-system/
├── requirements.md     # 統合要件定義
├── design.md          # 統合設計書  
├── tasks.md           # 統合実装タスク
└── migration-plan.md  # この移行計画書
```

### **削除予定のファイル**
```
.kiro/specs/consolidated-magi-system/  # 移行完了後に削除
amplify/functions/bedrock-agent-gateway/  # AgentCore Runtimeが代替
amplify/functions/agent-gateway-disabled/  # 不要
```

この移行により、より高性能で保守しやすく、AWS公式サポートを受けられるMAGI Decision Systemが実現されます。