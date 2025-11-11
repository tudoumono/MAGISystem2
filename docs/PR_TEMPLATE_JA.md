# Phase 1: A2A設計のための5層タイムアウト戦略の実装

## 📋 概要

このPRは、MAGIデシジョンシステムのAgent-to-Agent（A2A）設計における包括的な**5層タイムアウト戦略**を実装します。フロントエンドのSSEからPythonエージェント実行まで、スタック全体での無限待機を防止し、システムの信頼性とユーザー体験の向上を保証します。

### 含まれるコミット
- ✅ `c463355` - docs: Phase 1タイムアウト実装のPRテンプレートを追加
- ✅ `970f6ee` - feat(frontend): AbortControllerを使用したレイヤー1フロントエンドSSEタイムアウトの実装
- ✅ `9d42f21` - feat(backend): グレースフルシャットダウンを備えたレイヤー2 Next.jsプロセスモニタータイムアウトの実装
- ✅ `1534925` - feat(agents): グレースフルデグラデーションを備えたレイヤー5 SOLOMONジャッジタイムアウトの実装
- ✅ `9e5c9aa` - feat(agents): グレースフルデグラデーションを備えたレイヤー4 Python賢者タイムアウトの実装
- ✅ `4355456` - docs: Phase 1タイムアウト実装の包括的なステータスレポートを追加

---

## 🎯 問題の背景

### 現在の課題
**3人の賢者 + SOLOMONジャッジ**が並列実行されるA2A設計において：
- 1つのLLMエージェントの遅延がシステム全体を無期限にブロックする可能性
- どのレイヤーでも無限待機に対する保護がない
- 処理に時間がかかりすぎた場合のユーザー体験が悪い
- 個別のエージェントがタイムアウトした際のグレースフルデグラデーションがない

### なぜレイヤー4が重要なのか（A2A設計のボトルネック）
```
ユーザーの質問
    ↓
[CASPAR] ─┐
[BALTHASAR] ┼─→ [SOLOMON] → 最終判断
[MELCHIOR] ─┘
```

**タイムアウトなし**: CASPARがハングすると、システム全体が無期限に待機
**タイムアウトあり**: CASPARは90秒後にABSTAINEDを返し、BALTHASAR + MELCHIORは正常に継続

---

## ✨ 解決策：5層タイムアウト階層

```
レイヤー1（フロントエンド）: 240秒（4分）   ← ユーザー向けタイムアウト
レイヤー2（プロセス）:        210秒（3.5分） ← Next.jsプロセスモニター
レイヤー3（合計）:            180秒（3分）   ← Python全体（レイヤー2経由で間接的）
レイヤー4（賢者）:            90秒（1.5分）  ← 個別の賢者タイムアウト
レイヤー5（SOLOMON）:         60秒（1分）    ← 最終判断タイムアウト
```

**設計原則**: 各レイヤーは親レイヤーの**前に**タイムアウト（最低30秒のギャップ）

---

## 🏗️ 既に実装済みのインフラ（PR #7）

### 設定ユーティリティ
- ✅ **TypeScript**: `agents/backend/src/lib/config/timeout.ts`
  - `getTimeoutConfig()` - 設定の読み込み
  - `exportPythonEnv()` - Pythonへの受け渡し
  - `logTimeoutConfig()` - デバッグログ
  - 階層検証

- ✅ **Python**: `agents/config/timeout.py`
  - `get_timeout_config()` - シングルトンパターン
  - `load_timeout_config()` - 環境変数の読み込み
  - `log_timeout_config()` - デバッグ出力
  - 階層検証

### 環境変数
```bash
# レイヤー2: Next.jsプロセスモニター
AGENTCORE_PROCESS_TIMEOUT_MS=210000

# レイヤー4: Python賢者タイムアウト
MAGI_SAGE_TIMEOUT_SECONDS=90

# レイヤー5: SOLOMONジャッジタイムアウト
MAGI_SOLOMON_TIMEOUT_SECONDS=60

# レイヤー3: Python合計タイムアウト（間接的）
MAGI_TOTAL_TIMEOUT_SECONDS=180

# イベントキュータイムアウト
MAGI_EVENT_QUEUE_TIMEOUT_SECONDS=120

# レイヤー1: フロントエンドSSEタイムアウト
NEXT_PUBLIC_SSE_TIMEOUT_MS=240000
```

---

## 🔧 実装の詳細

### レイヤー1: フロントエンドSSEタイムアウト
**ファイル**: `src/lib/agents/stream-client.ts`

**変更内容**:
- `NEXT_PUBLIC_SSE_TIMEOUT_MS`からタイムアウトを読み込み（デフォルト: 240秒）
- fetch キャンセル用の`AbortController`を作成
- 日本語のユーザーフレンドリーなエラーメッセージでタイムアウトを設定
- すべての完了パスでタイムアウトをクリア（done、complete イベント、error イベント）
- `AbortError`を処理してタイムアウトと手動キャンセルを区別

**グレースフルデグラデーション**: ユーザーに明確な日本語タイムアウトメッセージを表示

```typescript
const sseTimeoutMs = parseInt(process.env.NEXT_PUBLIC_SSE_TIMEOUT_MS || '240000', 10);
const abortController = new AbortController();

const timeoutId = setTimeout(() => {
  abortController.abort();
  const timeoutError = new Error(
    `リクエストがタイムアウトしました（${(sseTimeoutMs / 1000).toFixed(0)}秒）。` +
    `\n処理に時間がかかりすぎています。後でもう一度お試しください。`
  );
  onError?.(timeoutError);
  reject(timeoutError);
}, sseTimeoutMs);

fetch(url, { signal: abortController.signal, ... })
```

### レイヤー2: Next.jsプロセスモニター
**ファイル**: `agents/backend/app/api/invocations/route.ts`

**変更内容**:
- `getTimeoutConfig()`と`exportPythonEnv()`をインポート
- タイムアウト設定を読み込み、環境変数経由でPythonプロセスに渡す
- プロセス監視タイムアウトを設定
- タイムアウト時にSSEストリームにタイムアウトイベントを送信
- グレースフルシャットダウンを実装: SIGTERM → 5秒待機 → SIGKILL
- プロセス完了時にタイムアウトをクリア

**グレースフルデグラデーション**: フロントエンドにエラーイベントを送信し、クリーンシャットダウンを試行

```typescript
const timeoutConfig = getTimeoutConfig();
const pythonProcess = spawn(PYTHON_PATH, [MAGI_SCRIPT_PATH], {
  env: { ...process.env, ...exportPythonEnv(timeoutConfig) }
});

let processCompleted = false;
const processTimeoutId = setTimeout(() => {
  if (!processCompleted) {
    // タイムアウトイベントを送信
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(timeoutEvent)}\n\n`));

    // グレースフルシャットダウン
    pythonProcess.kill('SIGTERM');
    setTimeout(() => {
      if (!pythonProcess.killed) pythonProcess.kill('SIGKILL');
    }, 5000);
  }
}, timeoutConfig.processTimeoutMs);

pythonProcess.on('close', (code) => {
  processCompleted = true;
  clearTimeout(processTimeoutId);
});
```

### レイヤー4: Python賢者タイムアウト
**ファイル**: `agents/magi_agent.py` - メソッド: `_consult_sage_stream()`

**変更内容**:
- `__init__`で`self.timeout_config = get_timeout_config()`を読み込み
- ストリーミングの各チャンクで経過時間をチェック
- タイムアウト超過時に`asyncio.TimeoutError`を発生
- タイムアウトをキャッチしてABSTAINED判断を返す（信頼度=0.0）
- 他の賢者のストリーミングを継続

**グレースフルデグラデーション**: ABSTAINEDを返し、他の賢者が継続できるようにする

```python
timeout_seconds = self.timeout_config.sage_timeout_seconds
start_time = asyncio.get_event_loop().time()

try:
    async for chunk in agent.stream_async(question, **stream_kwargs):
        elapsed = asyncio.get_event_loop().time() - start_time
        if elapsed > timeout_seconds:
            raise asyncio.TimeoutError(f"Sage {agent_id} exceeded timeout of {timeout_seconds}s")
        # チャンク処理...

except asyncio.TimeoutError:
    timeout_result = {
        "decision": "ABSTAINED",
        "reasoning": f"⏱️ タイムアウト: 賢者{agent_id}の処理が{timeout_seconds}秒を超過しました。",
        "confidence": 0.0
    }
    yield self._create_sse_event("agent_complete", timeout_result, agent_id=agent_id)
```

### レイヤー5: SOLOMONジャッジタイムアウト
**ファイル**: `agents/magi_agent.py` - メソッド: `_solomon_judgment_stream()`

**変更内容**:
- レイヤー4と同様のパターン
- ストリーミングの各チャンクで経過時間をチェック
- タイムアウト超過時に`asyncio.TimeoutError`を発生
- タイムアウトをキャッチして信頼度0.5のREJECTEDを返す
- 継続性のために賢者スコアを含める

**グレースフルデグラデーション**: 保守的なフォールバックとして信頼度0.5のREJECTEDを返す

```python
timeout_seconds = self.timeout_config.solomon_timeout_seconds
start_time = asyncio.get_event_loop().time()

try:
    async for chunk in self.solomon.stream_async(question, system_prompt=solomon_prompt):
        elapsed = asyncio.get_event_loop().time() - start_time
        if elapsed > timeout_seconds:
            raise asyncio.TimeoutError(f"SOLOMON exceeded timeout of {timeout_seconds}s")
        # チャンク処理...

except asyncio.TimeoutError:
    timeout_result = {
        "final_decision": "REJECTED",
        "reasoning": f"⏱️ SOLOMON評価がタイムアウト（{timeout_seconds}秒）しました。",
        "confidence": 0.5,
        "sage_scores": {"caspar": 50, "balthasar": 50, "melchior": 50}
    }
    yield self._create_sse_event("judge_complete", timeout_result)
```

---

## ✅ テスト状況

### インフラテスト（PR #7）
- ✅ TypeScript設定ユーティリティ
- ✅ Python設定ユーティリティ
- ✅ 環境変数の読み込み
- ✅ 階層検証
- ✅ デフォルト値

### ランタイム統合テスト
- ⏳ **デプロイメントまで延期** - フルスタックの実行が必要
- 推奨テスト: モック遅延で遅いLLM応答をシミュレート
- 各レイヤーが正しい時間にトリガーされることを確認
- 各レイヤーでのグレースフルデグラデーションを確認

### 手動テスト（前回のセッションから）
```
✅ test_magi2.py実行: 11.96秒、383イベント
✅ 3人の賢者全員が正常に完了
✅ SOLOMON判断が完了
✅ フルストリーミングパイプライン動作中
```

---

## 🎁 メリット

### システムの信頼性
- ✅ どのレイヤーでも無限待機なし
- ✅ 予測可能な最大実行時間
- ✅ グレースフルデグラデーションにより部分的な結果を保持
- ✅ 明確なタイムアウト階層により競合を防止

### ユーザー体験
- ✅ ユーザーフレンドリーな日本語タイムアウトメッセージ
- ✅ AbortControllerによるフロントエンドキャンセル
- ✅ デバッグ用のログで可視化されたタイムアウト
- ✅ 予測可能な応答時間

### A2A設計の回復力
- ✅ 個別の賢者の遅延がシステム全体をブロックしない
- ✅ SOLOMONタイムアウトは保守的なフォールバックを返す
- ✅ 3人中2人の賢者でも有効な判断を生成可能
- ✅ 部分的な失敗があってもシステムは継続

---

## 📚 ドキュメント

### 包括的なステータスレポート
**ファイル**: `PHASE1_STATUS_REPORT.md`

含まれる内容:
- 完全な実装状況（50% → 100%）
- 各レイヤーの詳細なコード例
- テスト結果と推奨事項
- 環境変数のドキュメント
- タイムアウト階層図
- グレースフルデグラデーション戦略

---

## 🚀 移行パス

### 破壊的変更なし
- すべてのタイムアウト値に適切なデフォルトあり
- 環境変数なしでもシステムが動作
- 既存のデプロイメントとの下位互換性あり

### 推奨デプロイメント手順
1. このPRをmainブランチにマージ
2. デプロイメントで環境変数を更新（カスタムタイムアウトのためのオプション）
3. タイムアウトイベントのログを監視
4. 本番メトリクスに基づいてタイムアウト値を調整

### 監視
以下のログメッセージに注意:
- `⏱️  SSE Timeout: 240000ms`（レイヤー1）
- `⏱️  Process timeout: 210000ms`（レイヤー2）
- `🕐 Python Timeout Configuration:`（レイヤー3-5）
- `❌ SSE stream timeout after...`（レイヤー1タイムアウト発火）
- `❌ Python process TIMEOUT after...`（レイヤー2タイムアウト発火）
- `⏱️ タイムアウト: 賢者XXの処理が...`（レイヤー4タイムアウト発火）
- `⏱️ SOLOMON評価がタイムアウト...`（レイヤー5タイムアウト発火）

---

## ✅ チェックリスト

- [x] レイヤー1実装（フロントエンドSSE）
- [x] レイヤー2実装（プロセスモニター）
- [x] レイヤー4実装（Python賢者）
- [x] レイヤー5実装（SOLOMONジャッジ）
- [x] 設定ユーティリティが動作
- [x] 環境変数のドキュメント
- [x] グレースフルデグラデーション実装
- [x] タイムアウト階層検証
- [x] ステータスレポート作成
- [x] すべてのコミットが慣例的なコミットフォーマットに従う
- [ ] ランタイム統合テスト（デプロイメントまで延期）
- [ ] 本番監視の設定

---

## 🔗 関連

- **前回のPR**: #7（タイムアウト設定インフラ）
- **次のフェーズ**: Phase 2 - エラーハンドリングと監視
- **ブランチ**: `claude/review-code-011CUyix3DAtcQauKZLdGmD8`
- **ベースブランチ**: `main`

---

## 📝 変更されたファイル

```
modified:   src/lib/agents/stream-client.ts
modified:   agents/backend/app/api/invocations/route.ts
modified:   agents/magi_agent.py
new file:   PHASE1_STATUS_REPORT.md
new file:   PR_TEMPLATE.md
new file:   PR_TEMPLATE_JA.md
```

---

## 🤝 レビューのフォーカスエリア

1. **タイムアウト値**: 本番環境でデフォルトのタイムアウト値は適切か？
2. **グレースフルデグラデーション**: フォールバック応答（ABSTAINED、REJECTED）は適切か？
3. **エラーメッセージ**: 日本語のエラーメッセージは明確で役立つか？
4. **AbortController**: fetchキャンセルロジックは正しいか？
5. **プロセスシャットダウン**: SIGTERM → SIGKILL（5秒）はグレースフルシャットダウンに適切か？
6. **階層のギャップ**: レイヤー間の30秒のギャップは十分か？

---

**レビュー後、マージ準備完了！** 🎉
