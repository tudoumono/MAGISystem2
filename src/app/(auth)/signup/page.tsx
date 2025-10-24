/**
 * Sign Up Page - サインアップページ
 * 
 * 目的: 新規ユーザー登録のためのインターフェースを提供
 * 設計理由: 実際のAmplify認証との統合とユーザーフレンドリーなUX
 * 
 * 主要機能:
 * - SignUpFormコンポーネントの表示
 * - 登録成功後のメール確認案内
 * - サインインページへのリンク
 * - エラーハンドリング
 * 
 * 学習ポイント:
 * - Next.js 15 App Router のページコンポーネント
 * - 認証フローのUXパターン
 * - メタデータAPIの使用
 * 
 * 関連: src/components/auth/SignUpForm.tsx, src/components/auth/AuthProvider.tsx
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * サインアップ成功画面
 */
function SignUpSuccess({ email }: { email: string }) {
  const router = useRouter();
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <CardTitle className="text-2xl text-green-600">登録完了</CardTitle>
        <CardDescription>
          アカウントの作成が完了しました
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>{email}</strong> に確認メールを送信しました。
          </p>
          <p className="text-sm text-muted-foreground">
            メール内のリンクをクリックしてアカウントを有効化してください。
          </p>
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={() => router.push('/signin')}
            className="w-full"
          >
            サインインページへ
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            別のアカウントで登録
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            確認メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * サインアップページコンポーネント
 */
export default function SignUpPage() {
  const router = useRouter();
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  
  /**
   * サインアップ成功時の処理
   */
  const handleSignUpSuccess = () => {
    // 実際の実装では、サインアップ時のメールアドレスを取得
    setSignUpSuccess('user@example.com'); // 仮のメールアドレス
  };
  
  /**
   * サインインページへの遷移
   */
  const handleSignInClick = () => {
    router.push('/signin');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {signUpSuccess ? (
          <SignUpSuccess email={signUpSuccess} />
        ) : (
          <div className="space-y-6">
            {/* MAGIシステムロゴ */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-magi-caspar-500 via-magi-balthasar-500 to-magi-melchior-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
                <span className="text-xl font-bold text-white">M</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">MAGI Decision System</h1>
              <p className="text-sm text-muted-foreground">3賢者による多視点分析システム</p>
            </div>
            
            {/* サインアップフォーム */}
            <SignUpForm
              onSuccess={handleSignUpSuccess}
              showSignInLink={false}
            />
            
            {/* サインインリンク */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                すでにアカウントをお持ちの方は{' '}
                <button
                  type="button"
                  onClick={handleSignInClick}
                  className="text-primary hover:underline focus:outline-none focus:underline font-medium"
                >
                  サインイン
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}