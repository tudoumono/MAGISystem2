/**
 * Rate Limiting Utility
 * 
 * シンプルなメモリベースのレート制限実装
 * 本番環境ではRedisやDynamoDBを使用することを推奨
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * レート制限チェック
 * 
 * @param identifier - ユーザーID、IPアドレスなどの識別子
 * @param limit - 制限回数（デフォルト: 10回）
 * @param windowMs - 時間窓（デフォルト: 60秒）
 * @returns 制限内かどうか
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // エントリが存在しない、または期限切れの場合
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }

  // 制限を超えている場合
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  // カウントを増やす
  entry.count++;
  rateLimitStore.set(identifier, entry);
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
}

/**
 * レート制限のクリーンアップ（定期実行推奨）
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 5分ごとにクリーンアップ
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
