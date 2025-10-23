# Agent Components

このディレクトリには、Task 7「エージェント応答インターフェースの構築（モックデータ使用）」で実装されたコンポーネントが含まれています。

## 実装完了コンポーネント

### Task 7.1: エージェント応答パネルの作成

#### `AgentResponsePanel.tsx`
- 3賢者（CASPAR、BALTHASAR、MELCHIOR）の個別応答表示
- 可決/否決判断の視覚的強調表示（色分け、アイコン）
- 詳細な回答内容の表示（従来機能）
- 判断理由と根拠の詳細表示機能
- スケルトンローディング状態
- アクセシビリティ対応（ARIA属性、キーボードナビゲーション）

#### `AgentResponseComparison.tsx`
- 3賢者の応答をサイドバイサイドで比較表示
- 投票結果サマリー（可決X票、否決Y票）
- 意見の一致・分裂の可視化
- レスポンシブデザイン（モバイル対応）
- 全体展開/折りたたみ制御

### Task 7.2: SOLOMON Judge統合の実装

#### `JudgeResponsePanel.tsx`
- SOLOMON Judgeによる統合評価表示
- CSS-basedスコア可視化チャート
- MAGI投票結果の集計表示（可決X票、否決Y票）
- SOLOMONの最終判断表示（可決/否決 + 根拠）
- エヴァンゲリオン風MAGIシステムUIデザイン
- 信頼度指標付き最終推奨表示

#### `MAGISystemInterface.tsx`
- 完全なMAGIシステム統合インターフェース
- 3賢者とSOLOMON Judgeの統合表示
- リアルタイム実行進行状況表示
- エヴァンゲリオン風デザインシステム
- Multi-Agent Collaborationパターン対応
- 段階的ローディングアニメーション

## 使用方法

```typescript
import { 
  AgentResponsePanel,
  AgentResponseComparison,
  JudgeResponsePanel,
  MAGISystemInterface 
} from '@/components/agents';

// 個別エージェント表示
<AgentResponsePanel 
  response={agentResponse} 
  loading={false}
/>

// 3賢者比較表示
<AgentResponseComparison 
  responses={agentResponses}
  comparisonMode={true}
/>

// SOLOMON Judge表示
<JudgeResponsePanel 
  judgeResponse={judgeResponse}
  agentResponses={agentResponses}
/>

// 完全なMAGIシステム
<MAGISystemInterface
  question="質問内容"
  response={askAgentResponse}
  loading={false}
/>
```

## テストページ

`/test/agents` でコンポーネントの動作確認が可能です。

## デザイン特徴

- **エヴァンゲリオン風UI**: MAGIシステムにインスパイアされたデザイン
- **アクセシビリティ対応**: WCAG 2.1 AA準拠
- **色覚特性対応**: 色以外の視覚的手がかり併用
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **アニメーション効果**: 没入感のあるUX

## モックデータ対応

Phase 1-2の開発戦略に従い、全コンポーネントがモックデータで動作します：

- 全員一致可決/否決シナリオ
- 意見分裂シナリオ（2:1）
- エラーシナリオ
- ローディング状態
- 様々な確信度・実行時間パターン

## 次のステップ

Task 8以降で会話管理インターフェースと統合され、完全なMAGI意思決定システムが完成します。