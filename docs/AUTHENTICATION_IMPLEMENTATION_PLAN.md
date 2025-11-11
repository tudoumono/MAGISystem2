# AgentCore Runtime 認証実装プラン

## 🎯 目標

Amplify CognitoとAgentCore Runtimeを統合し、認証されたユーザーのみがMAGI意思決定システムを利用できるようにする。

## 📚 参考資料

- **参考記事**: [Amplify HostingでBedrock AgentCoreを使う](https://qiita.com/moritalous/items/ea695f8a328585e1313b)
- **既存実装**: `src/lib/auth/server-actions.ts`, `src/lib/amplify/client.ts`
- **AgentCore Runtime**: `agents/backend/app/api/invocations/route.ts`

## 🏗️ アーキテクチャ

### 認証フロー

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Amplify Hosting)                                   │
│  1. User signs in via Amplify Auth (Cognito)                │
│  2. fetchAuthSession() → JWT Access Token                   │
│  3. POST /invocations with Authorization: Bearer {token}    │
└─────────────────────────────────────────────────────────────┘
                         │ HTTP + JWT
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ AgentCore Runtime (Docker Container)                         │
│  4. Next.js Backend: JWT検証                                 │
│     - Authorization headerからトークン抽出                    │
│     - Cognito公開鍵でJWT署名検証                             │
│     - クレーム検証（exp, aud, iss等）                        │
│  5. 検証成功 → Python子プロセス実行                          │
│  6. 検証失敗 → 401 Unauthorized                             │
└─────────────────────────────────────────────────────────────┘
                         │ spawn('python')
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Python MAGI Agent                                            │
│  7. magi_agent.py が実行される（認証済みユーザーのみ）       │
└─────────────────────────────────────────────────────────────┘
```

## 📝 実装手順

### Step 1: フロントエンド - JWTトークン取得と送信

**ファイル**: `src/hooks/useMAGIStream.ts` (新規作成または既存修正)

```typescript
import { fetchAuthSession } from 'aws-amplify/auth';

export function useMAGIStream() {
  const invokeMAGI = async (question: string) => {
    // 1. Cognitoからアクセストークン取得
    let accessToken: string | undefined;

    try {
      const session = await fetchAuthSession();
      accessToken = session.tokens?.accessToken?.toString();

      if (!accessToken) {
        throw new Error('認証トークンが取得できませんでした。ログインしてください。');
      }
    } catch (authError) {
      console.error('Authentication failed:', authError);
      throw new Error('認証に失敗しました。再ログインしてください。');
    }

    // 2. AgentCore RuntimeにJWTトークン付きでリクエスト
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AGENTCORE_URL}/api/invocations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // ⭐ JWTトークン
        },
        body: JSON.stringify({ question }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('認証が必要です。ログインしてください。');
      }
      throw new Error(`AgentCore Runtime error: ${response.status}`);
    }

    // 3. Server-Sent Eventsストリーミング処理
    return response.body;
  };

  return { invokeMAGI };
}
```

**環境変数** (`.env.local`):
```bash
NEXT_PUBLIC_AGENTCORE_URL=https://your-agentcore-url.amplifyapp.com
```

---

### Step 2: バックエンド - JWT検証実装

**ファイル**: `agents/backend/app/api/invocations/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt-verifier'; // 新規作成

export async function POST(request: NextRequest) {
  console.log('🔥 /invocations endpoint called');

  try {
    // ==========================================
    // 🔐 STEP 1: JWT認証チェック
    // ==========================================
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証トークンが必要です' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " を削除

    // JWT検証
    let decodedToken;
    try {
      decodedToken = await verifyJWT(token);
      console.log('✅ JWT verified successfully:', decodedToken.sub);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'トークンが無効または期限切れです',
          details: process.env.NODE_ENV === 'development' ? jwtError : undefined
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 🚀 STEP 2: Python MAGI Agent実行
    // ==========================================
    const body = await request.json();
    console.log('📥 Request payload:', JSON.stringify(body, null, 2));
    console.log('👤 Authenticated user:', decodedToken.sub);

    // ストリーミングレスポンスを作成
    const stream = new ReadableStream({
      start(controller) {
        // ... 既存のPython子プロセス実行ロジック
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ /invocations endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Step 3: JWT検証ユーティリティ

**ファイル**: `agents/backend/src/lib/auth/jwt-verifier.ts` (新規作成)

```typescript
/**
 * JWT検証ユーティリティ
 *
 * Cognito JWTトークンの検証を実行します。
 * 参考記事のパターンに準拠した実装。
 */

import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

// Cognito公開鍵のエンドポイント
const COGNITO_JWKS_URL = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

// 公開鍵セット（キャッシュ）
const JWKS = createRemoteJWKSet(new URL(COGNITO_JWKS_URL));

/**
 * Cognito JWT トークンを検証
 *
 * @param token - JWTアクセストークン
 * @returns デコードされたトークンペイロード
 * @throws 検証失敗時はエラー
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    // JWT検証（署名、有効期限、発行者等）
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      audience: process.env.COGNITO_CLIENT_ID, // オプション: クライアントIDチェック
    });

    console.log('✅ JWT verification successful');
    console.log('   User ID:', payload.sub);
    console.log('   Username:', payload['cognito:username']);
    console.log('   Token expiry:', new Date((payload.exp || 0) * 1000).toISOString());

    return payload;
  } catch (error) {
    console.error('❌ JWT verification failed:', error);

    if (error instanceof Error) {
      // エラータイプに応じた詳細メッセージ
      if (error.message.includes('expired')) {
        throw new Error('トークンの有効期限が切れています');
      } else if (error.message.includes('signature')) {
        throw new Error('トークンの署名が無効です');
      }
    }

    throw new Error('トークンの検証に失敗しました');
  }
}

/**
 * トークンからユーザー情報を抽出
 */
export function extractUserInfo(payload: JWTPayload) {
  return {
    userId: payload.sub,
    username: payload['cognito:username'],
    email: payload['email'],
    groups: payload['cognito:groups'] || [],
  };
}
```

**必要なパッケージ**:
```bash
cd agents/backend
npm install jose
```

---

### Step 4: 環境変数設定

**ファイル**: `agents/backend/.env.local` (新規作成)

```bash
# AWS設定
AWS_REGION=ap-northeast-1

# Cognito設定（amplify_outputs.jsonから取得）
COGNITO_USER_POOL_ID=ap-northeast-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX

# Python設定
MAGI_SCRIPT_PATH=/app/magi_agent.py
PYTHON_PATH=python

# デバッグ
DEBUG_STREAMING=false
NODE_ENV=production
```

**設定値の取得方法**:
```bash
# フロントエンドのamplify_outputs.jsonから取得
cat amplify_outputs.json | grep -A 10 "auth"
```

---

### Step 5: Dockerfile更新（joseパッケージ追加）

**ファイル**: `agents/Dockerfile`

```dockerfile
# ... 既存の内容 ...

# Node.js依存関係のインストール
WORKDIR /app/backend
COPY agents/backend/package*.json ./
RUN npm ci --only=production && \
    npm install jose  # ⭐ JWT検証ライブラリ追加

# ... 残りの内容 ...
```

---

## ✅ 動作確認手順

### 1. ローカル開発環境

```bash
# 1. 環境変数設定
cd agents/backend
cp .env.local.template .env.local
# COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID を設定

# 2. joseパッケージインストール
npm install jose

# 3. バックエンド起動
npm run dev

# 4. フロントエンドから認証付きリクエスト
# → Cognitoログイン → MAGIシステム使用
```

### 2. デプロイ環境

```bash
# 1. Amplify環境変数設定
npx ampx env add --name COGNITO_USER_POOL_ID --value "YOUR_POOL_ID"
npx ampx env add --name COGNITO_CLIENT_ID --value "YOUR_CLIENT_ID"

# 2. Dockerイメージビルド
docker build -t magi-agentcore -f agents/Dockerfile .

# 3. デプロイ（Amplify Hosting）
npx ampx push
```

---

## 🔒 セキュリティ考慮事項

### 実装済み

✅ **JWT署名検証**: Cognito公開鍵による検証
✅ **有効期限チェック**: joseライブラリが自動実行
✅ **発行者検証**: Cognito User Poolの確認
✅ **HTTPSのみ**: 本番環境ではHTTPSを強制

### 追加推奨事項

⚠️ **Rate Limiting**: 1ユーザーあたりのリクエスト制限
⚠️ **CORS設定**: 許可するオリジンを制限
⚠️ **ログ監視**: 認証失敗の監視とアラート
⚠️ **トークンリフレッシュ**: 長時間セッションの自動更新

---

## 📊 参考記事との比較

| 項目 | 参考記事 | MAGIシステム |
|------|---------|-------------|
| **認証方式** | Cognito JWT | ✅ 同じ |
| **トークン送信** | Authorization: Bearer | ✅ 同じ |
| **検証方法** | インバウンドID設定 | 🔄 **カスタム実装** (joseライブラリ) |
| **バックエンド** | Next.js | ✅ 同じ |
| **Python統合** | 子プロセス | ✅ 同じ |

**なぜカスタム実装？**

参考記事の「インバウンドID設定」はAWS Bedrock AgentCoreの機能ですが、MAGIシステムではPython統合のため、Next.jsバックエンド側で明示的にJWT検証を実装します。これにより：

- ✅ より細かい認証制御が可能
- ✅ ユーザー情報をPythonに渡せる（将来的に個人化対応）
- ✅ デバッグが容易

---

## 🚀 段階的実装プラン

### Phase 1: 基本認証（即座に実施可能）
- [ ] `jwt-verifier.ts`作成
- [ ] `route.ts`にJWT検証追加
- [ ] `useMAGIStream.ts`にトークン送信追加
- [ ] 環境変数設定

### Phase 2: エラーハンドリング強化
- [ ] 認証エラーのユーザーフレンドリーなメッセージ
- [ ] トークンリフレッシュ自動化
- [ ] セッション期限切れ時の自動再ログイン

### Phase 3: セキュリティ強化
- [ ] Rate Limiting実装
- [ ] 監査ログ追加
- [ ] ユーザーごとの使用量制限

---

## 📝 テストケース

```typescript
// テスト: JWT検証
describe('JWT Verification', () => {
  it('有効なトークンを受け入れる', async () => {
    const token = await getValidToken();
    const payload = await verifyJWT(token);
    expect(payload.sub).toBeDefined();
  });

  it('期限切れトークンを拒否する', async () => {
    const expiredToken = getExpiredToken();
    await expect(verifyJWT(expiredToken)).rejects.toThrow('有効期限');
  });

  it('不正な署名を拒否する', async () => {
    const invalidToken = 'invalid.jwt.token';
    await expect(verifyJWT(invalidToken)).rejects.toThrow();
  });
});
```

---

## 🎯 まとめ

この実装により：

✅ **Amplify Cognito統合**: 既存のAuth基盤を活用
✅ **AgentCore Runtime認証**: 参考記事のパターンに準拠
✅ **セキュアなAPI**: 認証されたユーザーのみアクセス可能
✅ **段階的実装**: Phase 1から順次展開可能

**次のアクション**: Phase 1の実装を開始しますか？
