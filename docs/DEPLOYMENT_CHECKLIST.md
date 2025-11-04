# デプロイチェックリスト - モデル選択機能

## Git Push完了 ✅

```
Commit: e843194
Branch: main
Message: feat: 動的モデル選択機能の実装
```

---

## デプロイ確認手順

### 1. AWS Amplify コンソール確認

**URL**: https://console.aws.amazon.com/amplify/

**確認項目**:
- [ ] ビルドが自動的に開始されたか
- [ ] ビルドステータスが「進行中」→「成功」になるか
- [ ] デプロイ完了時刻を記録

**予想ビルド時間**: 5-10分

---

### 2. Lambda関数の更新確認

**確認方法**:
```bash
# Lambda関数のバージョンを確認
aws lambda get-function --function-name magi-python-agents --region ap-northeast-1
```

**確認項目**:
- [ ] 関数コードが更新されているか
- [ ] 環境変数が正しく設定されているか
- [ ] 最終更新日時が最新か

---

### 3. 本番環境での動作確認

#### 3.1 プリセット設定画面

**URL**: `https://main.d34f7t08qc7jiy.amplifyapp.com/settings/agents`

**確認項目**:
- [ ] ページが正常に表示される
- [ ] デフォルトプリセットが表示される
- [ ] 「新規プリセット作成」をクリック
- [ ] モデル選択ドロップダウンに最新27モデルが表示される
  - [ ] Claude Opus 4.1 ⭐
  - [ ] Claude Sonnet 4.5 🔥
  - [ ] Claude Haiku 4.5 ⚡
  - [ ] Nova Premier 🎬
  - [ ] Nova Pro 📸
  - [ ] DeepSeek R1 🧠
  - [ ] Command R+ 📚
  - [ ] その他のモデル

**スクリーンショット**: 撮影して記録

#### 3.2 チャット画面

**URL**: `https://main.d34f7t08qc7jiy.amplifyapp.com/chat`

**確認項目**:
- [ ] プリセット選択ドロップダウンが表示される
- [ ] デフォルトプリセットが選択されている
- [ ] プリセットを切り替えられる

#### 3.3 メッセージ送信テスト

**手順**:
1. チャット画面でプリセットを選択
2. テストメッセージを送信: 「こんにちは」
3. ブラウザの開発者ツールを開く（F12）
4. Networkタブを確認

**確認項目**:
- [ ] POSTリクエストが`/api/bedrock-agents/stream`に送信される
- [ ] リクエストボディに`agentConfigs`が含まれる
- [ ] `agentConfigs.caspar.model`が選択したモデルになっている
- [ ] ストリーミングレスポンスが返ってくる
- [ ] エージェント応答が表示される

**リクエストボディ例**:
```json
{
  "question": "こんにちは",
  "conversationId": "...",
  "agentConfigs": {
    "caspar": {
      "model": "anthropic.claude-3-7-sonnet-20250219-v1:0",
      "temperature": 0.3,
      "maxTokens": 2000,
      "topP": 0.9,
      "systemPrompt": "...",
      "enabled": true
    },
    "balthasar": { ... },
    "melchior": { ... },
    "solomon": { ... }
  }
}
```

---

### 4. Lambda関数ログの確認

**CloudWatch Logs URL**:
```
https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fmagi-python-agents
```

**確認項目**:
- [ ] 最新のログストリームを開く
- [ ] 以下のログが出力されているか確認:

```
Processing question: こんにちは
Agent configs received: ['caspar', 'balthasar', 'melchior', 'solomon']
Consulting CASPAR...
Using model: anthropic.claude-3-7-sonnet-20250219-v1:0 for CASPAR
Consulting BALTHASAR...
Using model: amazon.nova-pro-v1:0 for BALTHASAR
Consulting MELCHIOR...
Using model: anthropic.claude-sonnet-4-5-20250929-v1:0 for MELCHIOR
All agents completed
Executing SOLOMON Judge...
```

**エラーがある場合**:
- エラーメッセージを記録
- スタックトレースを確認
- 原因を特定

---

### 5. モデルアクセス権限の確認

**AWS Bedrock コンソール**:
```
https://console.aws.amazon.com/bedrock/home?region=ap-northeast-1#/modelaccess
```

**確認項目**:
- [ ] 使用するモデルのアクセスが「Available」になっているか

**必要なモデル**:
- [ ] anthropic.claude-opus-4-1-20250805-v1:0
- [ ] anthropic.claude-sonnet-4-5-20250929-v1:0
- [ ] anthropic.claude-haiku-4-5-20251001-v1:0
- [ ] anthropic.claude-3-7-sonnet-20250219-v1:0
- [ ] amazon.nova-premier-v1:0
- [ ] amazon.nova-pro-v1:0
- [ ] amazon.nova-lite-v1:0
- [ ] amazon.nova-micro-v1:0

**アクセスが無い場合**:
1. 「Request access」をクリック
2. フォームを送信
3. 承認を待つ（通常は即座）

---

### 6. エラーハンドリングのテスト

#### 6.1 利用不可モデルのテスト

**手順**:
1. プリセット設定で利用不可のモデルを選択
2. メッセージを送信
3. フォールバック処理が動作するか確認

**期待される動作**:
- エラーメッセージが表示される
- または、デフォルトモデル（Haiku）にフォールバック
- ログに警告が出力される

#### 6.2 無効化エージェントのテスト

**手順**:
1. プリセット設定でCASPARを無効化
2. メッセージを送信
3. CASPARがスキップされるか確認

**期待される動作**:
- CASPARの応答が「ABSTAINED」になる
- 他のエージェントは正常に動作
- Judge評価で棄権として扱われる

---

### 7. パフォーマンステスト

**テストケース**:
1. 高速モデル（Haiku 4.5）で応答時間を測定
2. 高性能モデル（Opus 4.1）で応答時間を測定
3. マルチモーダルモデル（Nova Pro）で応答時間を測定

**記録項目**:
- 初回トークンまでの時間
- 完全な応答までの時間
- トークン数
- 推定コスト

**目標値**:
- 初回トークン: < 2秒
- 完全な応答: < 30秒
- ユーザー体験: スムーズ

---

### 8. コスト監視の設定

**CloudWatch Billing Alerts**:
```
https://console.aws.amazon.com/billing/home#/budgets
```

**設定項目**:
- [ ] 日次予算アラート: $10
- [ ] 月次予算アラート: $100
- [ ] Bedrock使用量アラート: 1M tokens

---

## トラブルシューティング

### ビルドが失敗する

**確認項目**:
1. Amplifyコンソールでビルドログを確認
2. TypeScriptエラーがないか確認
3. 依存関係の問題がないか確認

**解決策**:
```bash
# ローカルで型チェック
npm run type-check

# ビルドテスト
npm run build
```

### Lambda関数が更新されない

**確認項目**:
1. Amplifyのビルドが成功しているか
2. Lambda関数のデプロイが完了しているか
3. 関数のバージョンが最新か

**解決策**:
```bash
# 手動でLambda関数を更新
npx ampx sandbox
```

### モデルが選択できない

**確認項目**:
1. 型定義が正しいか
2. AVAILABLE_MODELSに含まれているか
3. ブラウザのキャッシュをクリア

**解決策**:
```bash
# 型チェック
npm run type-check

# キャッシュクリア
Ctrl + Shift + R (ブラウザ)
```

### agentConfigsが送信されない

**確認項目**:
1. ChatInterfaceでcurrentPresetが取得されているか
2. startStreamingにagentConfigsが渡されているか
3. ネットワークタブでリクエストボディを確認

**解決策**:
- ブラウザのコンソールでログを確認
- `console.log('Agent configs:', agentConfigs)`を追加

---

## デプロイ完了チェック

すべての項目が✅になったら、デプロイ完了です！

- [ ] Amplifyビルド成功
- [ ] Lambda関数更新確認
- [ ] プリセット設定画面動作確認
- [ ] チャット画面動作確認
- [ ] メッセージ送信テスト成功
- [ ] Lambda関数ログ確認
- [ ] モデルアクセス権限確認
- [ ] エラーハンドリング動作確認
- [ ] パフォーマンステスト完了
- [ ] コスト監視設定完了

---

## 次のステップ

1. ユーザーフィードバックの収集
2. パフォーマンスデータの分析
3. コスト最適化の検討
4. 追加機能の実装
   - プリセットのインポート/エクスポート
   - モデルパフォーマンス統計
   - A/Bテスト機能

---

## 連絡先

問題が発生した場合:
1. GitHubでIssueを作成
2. CloudWatch Logsを確認
3. ドキュメントを参照: `docs/MODEL_SELECTION_IMPLEMENTATION_COMPLETE.md`
