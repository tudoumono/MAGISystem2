/**
 * Request Validation Utility
 * 
 * APIリクエストの検証とサニタイゼーション
 */

/**
 * 質問内容の検証
 */
export function validateQuestion(question: string): {
  valid: boolean;
  error?: string;
} {
  if (!question || typeof question !== 'string') {
    return { valid: false, error: '質問は必須です' };
  }

  const trimmed = question.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: '質問は空にできません' };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: '質問は3文字以上で入力してください' };
  }

  if (trimmed.length > 10000) {
    return { valid: false, error: '質問は10,000文字以内で入力してください' };
  }

  // 危険な文字列のチェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror= など
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: '不正な文字列が含まれています' };
    }
  }

  return { valid: true };
}

/**
 * セッションIDの検証
 */
export function validateSessionId(sessionId?: string): {
  valid: boolean;
  error?: string;
} {
  if (!sessionId) {
    return { valid: true }; // オプショナル
  }

  if (typeof sessionId !== 'string') {
    return { valid: false, error: 'セッションIDの形式が不正です' };
  }

  // UUIDまたは安全な文字列のみ許可
  const safePattern = /^[a-zA-Z0-9_-]+$/;
  if (!safePattern.test(sessionId)) {
    return { valid: false, error: 'セッションIDに不正な文字が含まれています' };
  }

  if (sessionId.length > 100) {
    return { valid: false, error: 'セッションIDが長すぎます' };
  }

  return { valid: true };
}

/**
 * リクエストボディ全体の検証
 */
export function validateRequestBody(body: any): {
  valid: boolean;
  error?: string;
} {
  // 質問の検証
  const questionValidation = validateQuestion(body.question);
  if (!questionValidation.valid) {
    return questionValidation;
  }

  // セッションIDの検証
  const sessionValidation = validateSessionId(body.sessionId);
  if (!sessionValidation.valid) {
    return sessionValidation;
  }

  return { valid: true };
}
