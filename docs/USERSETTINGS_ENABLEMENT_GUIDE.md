# UserSettings機能の有効化ガイド

## ✅ 現在の状態

### 完了した作業

1. **Amplify Sandboxのデプロイ** ✅
   - UserSettingsモデルがデプロイされました
   - `amplify_outputs.json`に正しく反映されています
   - モデル数: 6 (User, UserSettings, Conversation, Message, TraceStep, AgentPreset)

2. **スキーマの修正** ✅
   - enum型から string型に変更
   - デフォルト値 `'tavily'` を設定

3. **型定義とバリデーション** ✅
   - `src/types/userSettings.ts` - TypeScript型定義
   - `src/lib/validation/userSettings.ts` - バリデーション関数

4. **ビルド成功** ✅
   - 型エラーなし
   - 全ページが正常にビルド

### 一時的に無効化されている機能

以下のファイルは一時的に無効化されています：

1. **`src/app/settings/page.tsx`**
   - 現在: プレースホルダーページ
   - 本来: UserSettings管理UI

2. **`src/hooks/useUserSettings.ts`**
   - 現在: スタブ実装
   - 本来: UserSettings CRUD操作

## 🚀 有効化手順

### ステップ1: TypeScript Language Serverの再起動

IDEでTypeScript Language Serverを再起動して、最新の型定義を読み込みます。

**VS Code:**
1. `Ctrl+Shift+P` (Windows) または `Cmd+Shift+P` (Mac)
2. "TypeScript: Restart TS Server" を選択

**Kiro IDE:**
- IDEを再起動するか、プロジェクトを再読み込み

### ステップ2: 型の確認

簡単なテストコードで型が認識されているか確認：

```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../../amplify/data/resource';

const client = generateClient<Schema>();

// この行で型エラーが出なければOK
const test = client.models.UserSettings;
```

### ステップ3: useUserSettingsフックの実装

`src/hooks/useUserSettings.ts`を以下の内容に置き換え：

```typescript
/**
 * User Settings Hook
 * 
 * ユーザー設定を管理するカスタムフック
 */

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { validateSearchProvider } from '@/lib/validation/userSettings';
import type { UserSettings, SearchProvider } from '@/types/userSettings';

const client = generateClient<Schema>();

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      
      const { data, errors } = await client.models.UserSettings.list({
        filter: {
          userId: { eq: user.userId }
        }
      });

      if (errors) {
        throw new Error(JSON.stringify(errors));
      }

      if (data && data.length > 0) {
        const dbSettings = data[0];
        setSettings({
          id: dbSettings.id,
          userId: user.userId,
          tavilyApiKey: dbSettings.tavilyApiKey || undefined,
          serperApiKey: dbSettings.serperApiKey || undefined,
          enableWebSearch: dbSettings.enableWebSearch || false,
          searchProvider: validateSearchProvider(dbSettings.searchProvider),
          createdAt: dbSettings.createdAt,
          updatedAt: dbSettings.updatedAt,
        });
      } else {
        // デフォルト設定
        setSettings({
          userId: user.userId,
          enableWebSearch: false,
          searchProvider: 'tavily',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      const settingsToSave = {
        ...newSettings,
        userId: user.userId,
        searchProvider: validateSearchProvider(newSettings.searchProvider),
        updatedAt: new Date().toISOString(),
      };

      if (settings?.id) {
        // 更新
        const { data, errors } = await client.models.UserSettings.update({
          id: settings.id,
          ...settingsToSave,
        });

        if (errors) {
          throw new Error(JSON.stringify(errors));
        }

        if (data) {
          setSettings({
            ...settings,
            ...settingsToSave,
            id: data.id,
          });
        }
      } else {
        // 新規作成
        const { data, errors } = await client.models.UserSettings.create({
          ...settingsToSave,
          createdAt: new Date().toISOString(),
        });

        if (errors) {
          throw new Error(JSON.stringify(errors));
        }

        if (data) {
          setSettings({
            id: data.id,
            userId: user.userId,
            tavilyApiKey: data.tavilyApiKey || undefined,
            serperApiKey: data.serperApiKey || undefined,
            enableWebSearch: data.enableWebSearch || false,
            searchProvider: validateSearchProvider(data.searchProvider),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
  };
}
```

### ステップ4: 設定ページの実装

`src/app/settings/page.tsx`を完全な実装に置き換えます。
（実装内容は長いため、別途提供します）

### ステップ5: ビルドとテスト

```bash
# ビルド
npm run build

# 開発サーバー起動
npm run dev
```

ブラウザで `/settings` にアクセスして動作確認。

## 🔍 トラブルシューティング

### 型エラーが解消されない場合

1. **TypeScript Language Serverを再起動**
   ```
   VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
   ```

2. **ビルドキャッシュをクリア**
   ```bash
   Remove-Item -Recurse -Force .next
   npm run build
   ```

3. **node_modulesを再インストール**
   ```bash
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

### Amplify Sandboxが停止している場合

```bash
npx ampx sandbox
```

### amplify_outputs.jsonが古い場合

Sandboxが実行中であれば、自動的に更新されます。
手動で確認：

```bash
cat amplify_outputs.json | Select-String -Pattern "UserSettings"
```

## 📋 チェックリスト

- [ ] Amplify Sandboxが実行中
- [ ] `amplify_outputs.json`にUserSettingsが含まれている
- [ ] TypeScript Language Serverを再起動
- [ ] `client.models.UserSettings`が型エラーなく使用できる
- [ ] `useUserSettings`フックを実装
- [ ] 設定ページを実装
- [ ] ビルドが成功する
- [ ] ブラウザで動作確認

## 🎯 期待される動作

1. **設定ページ (`/settings`)**
   - APIキーの入力フィールド
   - Web検索の有効/無効切り替え
   - 検索プロバイダーの選択（Tavily/Serper）
   - 保存ボタン

2. **データの永続化**
   - ユーザーごとに設定が保存される
   - ページをリロードしても設定が保持される
   - デフォルト値が正しく適用される

3. **バリデーション**
   - 無効な検索プロバイダーは自動的に'tavily'にフォールバック
   - 型安全性が保証される

## 📚 関連ドキュメント

- [AMPLIFY_GEN2_ENUM_SOLUTION.md](./AMPLIFY_GEN2_ENUM_SOLUTION.md) - Enum型問題の解決方法
- [AMPLIFY_GEN2_ENUM_INVESTIGATION.md](./AMPLIFY_GEN2_ENUM_INVESTIGATION.md) - 詳細な調査結果
