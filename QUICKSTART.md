# 🚀 MAGI Decision System - クイックスタート

## 📋 前提条件

- Node.js 18+ がインストールされている
- AWS アカウントを持っている
- AWS CLI がインストールされている

## ⚡ 5分でセットアップ

### 1. AWS認証情報の設定

```bash
aws configure
```

### 2. Amplifyリソースのデプロイ

```bash
# プロファイル設定
npx ampx configure profile

# リソースデプロイ（5-10分）
npx ampx push
```

### 3. 環境変数の自動設定

```bash
# 環境変数を自動設定
npm run setup-env
```

### 4. アプリケーション起動

```bash
# 開発サーバー起動
npm run dev
```

### 5. 動作確認

- ブラウザで http://localhost:3000 にアクセス
- 認証機能をテスト
- メッセージ送信をテスト

## 🔧 トラブルシューティング

### よくある問題

1. **AWS認証エラー**
   ```bash
   aws sts get-caller-identity  # 認証確認
   aws configure                # 再設定
   ```

2. **環境変数エラー**
   ```bash
   npm run validate-env         # 設定確認
   npm run setup-env            # 再設定
   ```

3. **デプロイエラー**
   ```bash
   npx ampx status              # 状況確認
   npx ampx push --force        # 強制再デプロイ
   ```

## 📚 詳細ドキュメント

- [完全な手順書](docs/deployment/user-action-guide.md)
- [実装ドキュメント](docs/implementation/task-2-2-typescript-types-and-hooks.md)
- [技術仕様](docs/learning/)

## 🆘 サポート

問題が発生した場合は、以下を確認してください：

1. [トラブルシューティングガイド](docs/deployment/user-action-guide.md#トラブルシューティング)
2. ログの確認: `npx ampx logs`
3. 設定の確認: `npm run validate-env`

---

**🎉 セットアップ完了！** 
MAGI Decision System の基盤が構築されました。