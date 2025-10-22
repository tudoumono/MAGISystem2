/**
 * AWS Amplify Auth Configuration
 * 
 * このファイルはAmazon Cognitoを使用した認証システムを設定します。
 * MAGI Decision Systemのユーザー認証とセッション管理を担当します。
 * 
 * 学習ポイント:
 * - Amplify Gen2のauth設定方式
 * - Cognitoユーザープールとアイデンティティプールの設定
 * - セキュリティ設定とMFA（多要素認証）の考慮
 */

import { defineAuth } from '@aws-amplify/backend';

/**
 * 認証リソースの定義
 * 
 * 設計理由:
 * - loginWith.email: メールアドレスでのログインを有効化
 * - userAttributes: ユーザーに必要な属性を定義
 * - multifactor: セキュリティ強化のためのMFA設定
 */
export const auth = defineAuth({
  /**
   * ログイン方法の設定
   * 
   * 学習ポイント:
   * - email: メールアドレスでのログインを有効化
   * - 将来的にはOAuthプロバイダー（Google、GitHub等）も追加可能
   */
  loginWith: {
    email: true,
  },

  /**
   * ユーザー属性の設定
   * 
   * 設計理由:
   * - email: 必須属性として設定（ログインに使用）
   * - givenName: ユーザーの名前（UI表示用）
   * - familyName: ユーザーの姓（UI表示用）
   * - preferredUsername: 表示名（オプション）
   */
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: false,
      mutable: true,
    },
    familyName: {
      required: false,
      mutable: true,
    },
    preferredUsername: {
      required: false,
      mutable: true,
    },
  },

  /**
   * 多要素認証（MFA）の設定
   * 
   * 学習ポイント:
   * - mode: 'OPTIONAL' - ユーザーが選択可能
   * - sms: SMS認証を有効化
   * - totp: TOTP（Time-based One-Time Password）を有効化
   * 
   * セキュリティ考慮:
   * - 企業環境では 'REQUIRED' に変更することを推奨
   * - TOTPアプリ（Google Authenticator等）の使用を推奨
   */
  multifactor: {
    mode: 'OPTIONAL',
    sms: true,
    totp: true,
  },

  /**
   * アカウント回復設定
   * 
   * 学習ポイント:
   * - EMAIL_ONLY: メールでのパスワードリセットを有効化
   * - ユーザビリティとセキュリティのバランスを考慮
   */
  accountRecovery: 'EMAIL_ONLY',

  /**
   * パスワードポリシー
   * 
   * セキュリティ考慮:
   * - 最小長: 8文字
   * - 複雑性要件: 大文字、小文字、数字、記号を含む
   * - 一般的なパスワードの使用を禁止
   */
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },

  /**
   * ユーザー検証設定
   * 
   * 学習ポイント:
   * - autoVerifiedAttributes: 自動検証する属性
   * - verificationEmailSubject: 検証メールの件名
   * - verificationEmailBody: 検証メールの本文
   */
  verificationEmailSubject: 'MAGI Decision System - メールアドレスの確認',
  verificationEmailBody: (createConfirmAccountLink: () => string) =>
    `MAGI Decision Systemへようこそ！以下のリンクをクリックしてアカウントを確認してください: ${createConfirmAccountLink()}`,

  /**
   * サインアップ設定
   * 
   * 学習ポイント:
   * - allowUnauthenticatedIdentities: 未認証ユーザーのアクセス制御
   * - セキュリティ重視のため false に設定
   */
  allowUnauthenticatedIdentities: false,
});