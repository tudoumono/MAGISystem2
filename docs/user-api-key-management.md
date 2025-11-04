# ユーザーAPIキー管理機能

## 概要

MAGIシステムでは、各ユーザーが自分のTavily/Serper APIキーを管理し、Web検索機能を利用できます。
APIキーが設定されていない場合でも、エージェントはエラーで停止せず、既存の知識で回答を続けます。

## アーキテクチャ

```
User Settings (DynamoDB)
    ↓
User API Key (暗号化推奨)
    ↓
Lambda Handler
    ↓
Strands Agent (tools=['tavily_search'])
    ↓
Tavily API
    ↓
Search Results or Graceful Fallback
```

## 実装内容

### 1. データモデル

#### UserSettings Model
```typescript
{
  id: string;
  userId: string;
  tavilyApiKey?: string;  // 暗号化推奨
  serperApiKey?: string;  // フォールバック用
  enableWebSearch: boolean;
  searchProvider: 'tavily' | 'serper';
  createdAt: datetime;
  updatedAt: datetime;
}
```

### 2. ユーザー設定画面

**場所**: `/settings`

**機能**:
- Tavily APIキーの入力・保存
- Serper APIキー（オプション）
- Web検索の有効/無効切り替え
- 検索プロバイダーの選択
- APIキーの表示/非表示切り替え
- APIキーのテスト機能（TODO）

### 3. エラーハンドリング

#### APIキー未設定時の動作

```python
# agents/magi_strands_agents.py

# APIキーがない場合
if not tavily_api_key:
    print("⚠️  Web search disabled (no API key)")
    # Web検索ツールなしでエージェント初期化
    agent = Agent(
        model=model,
        tools=[],  # 空のツールリスト
        system_prompt=prompt + "\n注意: Web検索は利用できません"
    )
```

#### Web検索失敗時の動作

```python
try:
    result = agent(full_prompt)
except Exception as tool_error:
    if 'TAVILY_API_KEY' in str(tool_error):
        print("⚠️  Web search failed, continuing without it")
        # Web検索なしで再試行
        result = agent(prompt_without_web_search)
    else:
        raise tool_error
```

### 4. セキュリティ考慮事項

#### APIキーの保護

**現在の実装**:
- DynamoDBに平文で保存（開発環境）

**推奨される本番環境対応**:
```typescript
// AWS KMSによる暗号化
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

async function encryptApiKey(apiKey: string): Promise<string> {
  const kms = new KMSClient({ region: 'ap-northeast-1' });
  
  const command = new EncryptCommand({
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: Buffer.from(apiKey)
  });
  
  const response = await kms.send(command);
  return Buffer.from(response.CiphertextBlob!).toString('base64');
}

async function decryptApiKey(encryptedKey: string): Promise<string> {
  const kms = new KMSClient({ region: 'ap-northeast-1' });
  
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(encryptedKey, 'base64')
  });
  
  const response = await kms.send(command);
  return Buffer.from(response.Plaintext!).toString('utf-8');
}
```

#### アクセス制御

- ユーザーは自分の設定のみアクセス可能（`allow.owner()`）
- APIキーは他のユーザーと共有されない
- Lambda関数は必要最小限の権限のみ

### 5. フロントエンド統合

#### useUserSettings Hook

```typescript
import { useUserSettings } from '@/hooks/useUserSettings';

function ChatComponent() {
  const { settings, loading } = useUserSettings();
  
  const handleSendMessage = async (content: string) => {
    // APIキーを取得
    const tavilyApiKey = settings?.enableWebSearch 
      ? settings.tavilyApiKey 
      : undefined;
    
    // Lambda関数に渡す
    await invokeAgent(content, tavilyApiKey);
  };
}
```

#### 設定画面へのリンク

```typescript
// Navigation Component
<Link href="/settings">
  <Settings className="w-5 h-5" />
  設定
</Link>
```

## 使用方法

### 1. ユーザー設定

1. `/settings`ページにアクセス
2. Tavily APIキーを入力
3. 「Web検索を有効化」をチェック
4. 「設定を保存」をクリック

### 2. チャットでの利用

- APIキーが設定されている場合:
  - 3賢者がWeb検索を使用して最新情報を収集
  - 検索結果を基に判断

- APIキーが未設定の場合:
  - エラーで停止せず、既存の知識で回答
  - 「Web検索は利用できません」という注記付き

### 3. エラー発生時

- Web検索APIエラー:
  - 自動的にフォールバック
  - 既存の知識で回答を継続
  - ログに警告を記録

## トラブルシューティング

### APIキーが保存されない

**原因**: 認証エラーまたはネットワークエラー

**解決策**:
```bash
# ログを確認
aws logs tail /aws/lambda/amplify-magi-python-agents --follow

# DynamoDBテーブルを確認
aws dynamodb scan --table-name UserSettings-dev
```

### Web検索が動作しない

**原因**: APIキーが無効または期限切れ

**解決策**:
1. 設定画面で「テスト」ボタンをクリック
2. Tavilyダッシュボードでキーを確認
3. 新しいキーを生成して再設定

### エージェントがエラーで停止する

**原因**: エラーハンドリングの不具合

**解決策**:
```python
# agents/magi_strands_agents.py を確認
# try-except ブロックが正しく実装されているか確認
```

## 今後の改善案

### 1. APIキーの暗号化

```typescript
// KMS統合
const encryptedKey = await encryptApiKey(settings.tavilyApiKey);
await saveSettings({ ...settings, tavilyApiKey: encryptedKey });
```

### 2. APIキーのテスト機能

```typescript
async function testTavilyApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: 'test',
        max_results: 1
      })
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
```

### 3. 使用量の追跡

```typescript
interface ApiUsage {
  userId: string;
  provider: 'tavily' | 'serper';
  requestCount: number;
  lastUsed: Date;
  monthlyLimit: number;
}
```

### 4. APIキーのローテーション

```typescript
// 定期的なローテーション通知
if (daysSinceCreated > 90) {
  showNotification('APIキーのローテーションを推奨します');
}
```

## セキュリティチェックリスト

- [ ] APIキーをKMSで暗号化
- [ ] APIキーをログに出力しない
- [ ] APIキーをクライアント側に送信しない
- [ ] レート制限を実装
- [ ] 使用量の監視
- [ ] 定期的なキーローテーション
- [ ] 不正アクセスの検知
- [ ] 監査ログの記録

## 参考資料

- [Tavily API Documentation](https://docs.tavily.com/)
- [AWS KMS Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)
- [Amplify Data Authorization](https://docs.amplify.aws/react/build-a-backend/data/customize-authz/)
- [Strands Agents Tools](https://strandsagents.com/latest/tools/)