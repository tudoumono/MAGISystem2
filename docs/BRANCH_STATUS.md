# ブランチ状態管理

最終更新: 2025-01-04

## ✅ マージ済み・削除済みブランチ

### `claude/fix-otel-build-errors-011CUn1gZ2YRw2NMhUX2YXJ8`
- **マージ日**: 2025-01-04
- **内容**: OpenTelemetryビルドエラーの解決とaws-xray-sdk-core削除
- **状態**: ✅ mainにマージ済み、リモートブランチ削除済み

### `claude/fix-bedrock-agent-export-011CUcSvGNCQ6qZKaRnqAmYa`
- **内容**: CDK Assembly Errorの修正
- **状態**: ✅ mainにマージ済み（既に削除済み）

---

## 🔄 未マージブランチ（レビュー待ち）

### `claude/improve-question-page-design-011CUavJDdjs7DBokvvkgxC8`
- **内容**: MAGI決定ページの追加とトレース表示デザインの改善
- **変更ファイル**:
  - `src/app/(protected)/dashboard/magi/page.tsx` (新規)
  - `src/app/(protected)/dashboard/page.tsx` (更新)
  - `tsconfig.tsbuildinfo` (削除)
- **コミット**:
  - `5284fd3`: tsconfig.tsbuildinfoをgit追跡から除外
  - `c0c9e0f`: MAGI決定ページの追加
- **推奨アクション**: UIの改善が含まれているため、レビュー後にマージを検討

### `claude/fix-data-sync-lambda-011CUbd6NN3znfH48xDfWy7q`
- **内容**: AgentCore Runtimeストリーミングサポートの実装
- **変更ファイル**:
  - `amplify/backend.ts` (更新)
  - `amplify/functions/bedrock-agent-gateway/handler.ts` (大幅更新)
- **コミット**:
  - `1f098b0`: AgentCore Runtimeストリーミングサポートの実装
- **推奨アクション**: ストリーミング機能の改善が含まれているため、テスト後にマージを検討

---

## 📋 ブランチ管理ガイドライン

### マージ基準
1. ビルドが成功すること
2. 既存機能を破壊しないこと
3. コードレビューが完了していること
4. テストが通ること（該当する場合）

### ブランチ削除基準
1. mainにマージ済みであること
2. 変更内容が不要になったこと
3. 他のブランチで同等の機能が実装されたこと

### 定期的な確認
- 月1回、未マージブランチの状態を確認
- 3ヶ月以上更新がないブランチは削除を検討
- 重要な変更は別途ドキュメント化

---

## 🔧 ブランチ操作コマンド

### リモートブランチの削除
```bash
git push origin --delete <branch-name>
```

### マージ済みブランチの確認
```bash
git branch -r --merged main
```

### 未マージブランチの確認
```bash
git branch -r --no-merged main
```

### ブランチの差分確認
```bash
git diff main...origin/<branch-name> --stat
```
