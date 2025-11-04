# Amplify Gen 2 Enum型とデフォルト値の問題解決

## 🔍 問題の詳細

### 重要な確認事項

**Amplify Gen 2はenum型自体はサポートしています。**

```typescript
// ✅ これは動作する
role: a.enum(['user', 'assistant']),

// ❌ これはエラー: Property 'default' does not exist on type 'EnumType'
searchProvider: a.enum(['tavily', 'serper']).default('tavily'),
```

### 1. Enum型の`.default()`メソッド非対応

Amplify Gen 2のenum型は**`.default()`メソッドをサポートしていません**。

- enum型自体は使用可能
- しかし、デフォルト値を設定する`.default()`メソッドは存在しない
- これが今回のビルドエラーの原因

### 2. UserSettingsモデルの型生成問題
- `UserSettings`モデルは定義されているが、TypeScript型として認識されない
- `client.models.UserSettings`が型システムに存在しない

## ✅ 解決策

### 方法1: String型 + バリデーション（推奨）

enum型の代わりにstring型を使用し、アプリケーション層でバリデーションを行います。

```typescript
UserSettings: a
  .model({
    id: a.id().required(),
    userId: a.id().required(),
    tavilyApiKey: a.string(),
    serperApiKey: a.string(),
    enableWebSearch: a.boolean().default(false),
    // enum型の代わりにstring型を使用
    searchProvider: a.string().default('tavily'),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    user: a.belongsTo('User', 'userId'),
  })
  .authorization((allow) => [allow.owner()]),
```

**アプリケーション層でのバリデーション:**

```typescript
// src/lib/validation/userSettings.ts
export const SEARCH_PROVIDERS = ['tavily', 'serper'] as const;
export type SearchProvider = typeof SEARCH_PROVIDERS[number];

export function validateSearchProvider(value: string): SearchProvider {
  if (!SEARCH_PROVIDERS.includes(value as SearchProvider)) {
    throw new Error(`Invalid search provider: ${value}`);
  }
  return value as SearchProvider;
}

export function getDefaultSearchProvider(): SearchProvider {
  return 'tavily';
}
```

**使用例:**

```typescript
// 保存時
const settings = {
  searchProvider: validateSearchProvider(userInput) || getDefaultSearchProvider(),
  // ...
};

await client.models.UserSettings.create(settings);

// 読み込み時
const { data } = await client.models.UserSettings.get({ id });
const provider = validateSearchProvider(data.searchProvider || 'tavily');
```

### 方法2: Enum型 + アプリケーション層でのデフォルト値設定

enum型を維持し、デフォルト値はアプリケーション層で設定します。

```typescript
UserSettings: a
  .model({
    id: a.id().required(),
    userId: a.id().required(),
    tavilyApiKey: a.string(),
    serperApiKey: a.string(),
    enableWebSearch: a.boolean().default(false),
    // enum型を使用（デフォルト値なし）
    searchProvider: a.enum(['tavily', 'serper']),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    user: a.belongsTo('User', 'userId'),
  })
  .authorization((allow) => [allow.owner()]),
```

**カスタムフックでデフォルト値を管理:**

```typescript
// src/hooks/useUserSettings.ts
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const loadSettings = async () => {
    const { data } = await client.models.UserSettings.list({
      filter: { userId: { eq: currentUserId } }
    });

    if (data && data.length > 0) {
      setSettings(data[0]);
    } else {
      // デフォルト値を設定
      setSettings({
        userId: currentUserId,
        enableWebSearch: false,
        searchProvider: 'tavily', // デフォルト値
      });
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    const settingsToSave = {
      ...newSettings,
      searchProvider: newSettings.searchProvider || 'tavily', // デフォルト値の保証
    };

    if (settings?.id) {
      await client.models.UserSettings.update({
        id: settings.id,
        ...settingsToSave,
      });
    } else {
      await client.models.UserSettings.create(settingsToSave);
    }
  };

  return { settings, loadSettings, saveSettings };
}
```

### 方法3: カスタムミューテーション（高度）

AppSync Resolverを使用してデフォルト値を設定します。

```typescript
// amplify/data/resource.ts
const schema = a.schema({
  UserSettings: a
    .model({
      // ... fields
      searchProvider: a.enum(['tavily', 'serper']),
    })
    .authorization((allow) => [allow.owner()]),

  // カスタムミューテーション
  createUserSettingsWithDefaults: a
    .mutation()
    .arguments({
      userId: a.id().required(),
      tavilyApiKey: a.string(),
      serperApiKey: a.string(),
      enableWebSearch: a.boolean(),
      searchProvider: a.string(),
    })
    .returns(a.ref('UserSettings'))
    .authorization((allow) => [allow.owner()])
    .handler(
      a.handler.custom({
        entry: './createUserSettingsWithDefaults.ts',
      })
    ),
});
```

```typescript
// amplify/data/createUserSettingsWithDefaults.ts
export const handler = async (event: any) => {
  const { userId, searchProvider, enableWebSearch, ...rest } = event.arguments;

  return {
    id: generateId(),
    userId,
    searchProvider: searchProvider || 'tavily', // デフォルト値
    enableWebSearch: enableWebSearch ?? false,
    ...rest,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
```

## 🔧 型生成問題の解決

### Amplify Sandboxの再起動

```bash
# 1. 現在のサンドボックスを停止
npx ampx sandbox delete

# 2. 新しいサンドボックスを起動
npx ampx sandbox

# 3. 型生成を確認
npx ampx generate graphql-client-code --format modelgen --model-target typescript
```

### ビルドキャッシュのクリア

```bash
# Next.jsのビルドキャッシュをクリア
rm -rf .next
rm -rf node_modules/.cache

# 再ビルド
npm run build
```

### amplify_outputs.jsonの確認

```bash
# amplify_outputs.jsonが最新であることを確認
cat amplify_outputs.json | grep -A 5 "data"
```

## 📋 推奨アプローチ

**本プロジェクトでは「方法1: String型 + バリデーション」を推奨します。**

理由:
1. ✅ シンプルで理解しやすい
2. ✅ Amplify Gen 2の制限を回避
3. ✅ 型安全性を維持（TypeScript型定義で保証）
4. ✅ デフォルト値を簡単に設定可能
5. ✅ 将来的にenum型がサポートされた場合も移行が容易

## 🚀 実装手順

### 1. スキーマの修正

```typescript
// amplify/data/resource.ts
UserSettings: a
  .model({
    id: a.id().required(),
    userId: a.id().required(),
    tavilyApiKey: a.string(),
    serperApiKey: a.string(),
    enableWebSearch: a.boolean().default(false),
    searchProvider: a.string().default('tavily'), // string型に変更
    createdAt: a.datetime().required(),
    updatedAt: a.datetime().required(),
    user: a.belongsTo('User', 'userId'),
  })
  .authorization((allow) => [allow.owner()]),
```

### 2. 型定義の作成

```typescript
// src/types/userSettings.ts
export const SEARCH_PROVIDERS = ['tavily', 'serper'] as const;
export type SearchProvider = typeof SEARCH_PROVIDERS[number];

export interface UserSettings {
  id?: string;
  userId: string;
  tavilyApiKey?: string;
  serperApiKey?: string;
  enableWebSearch: boolean;
  searchProvider: SearchProvider;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_USER_SETTINGS: Partial<UserSettings> = {
  enableWebSearch: false,
  searchProvider: 'tavily',
};
```

### 3. バリデーション関数の作成

```typescript
// src/lib/validation/userSettings.ts
import { SEARCH_PROVIDERS, SearchProvider } from '@/types/userSettings';

export function isValidSearchProvider(value: unknown): value is SearchProvider {
  return typeof value === 'string' && SEARCH_PROVIDERS.includes(value as SearchProvider);
}

export function validateSearchProvider(value: unknown): SearchProvider {
  if (isValidSearchProvider(value)) {
    return value;
  }
  console.warn(`Invalid search provider: ${value}, using default 'tavily'`);
  return 'tavily';
}
```

### 4. Amplify Sandboxの再起動

```bash
npx ampx sandbox delete
npx ampx sandbox
```

### 5. 設定ページとフックの有効化

型生成が正常に完了したら、一時的に無効化した以下のファイルを有効化します:
- `src/app/settings/page.tsx`
- `src/hooks/useUserSettings.ts`

## 📚 参考情報

- Amplify Gen 2では、enum型の`.default()`メソッドは現在サポートされていません
- デフォルト値が必要な場合は、string型を使用するか、アプリケーション層で設定します
- 型安全性はTypeScriptの型定義とバリデーション関数で保証します
- 将来的にAmplify Gen 2がenum型のデフォルト値をサポートする可能性があります

## 🔄 今後の対応

Amplify Gen 2のアップデートを監視し、enum型の`.default()`メソッドがサポートされた場合は、スキーマを更新することを検討します。

```typescript
// 将来的にサポートされた場合
searchProvider: a.enum(['tavily', 'serper']).default('tavily'),
```
