/**
 * User Settings Page
 * 
 * ユーザー設定画面 - APIキー管理とWeb検索設定
 * 
 * TODO: UserSettingsモデルの型生成後に有効化
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ユーザー設定
          </h1>
          <p className="text-gray-600">
            Web検索機能のAPIキーとその他の設定を管理します
          </p>
        </div>

        {/* 一時的なメッセージ */}
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  設定機能は一時的に無効化されています
                </h2>
                <p className="text-sm text-gray-600">
                  UserSettingsモデルの型生成後に再度有効化されます。
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
