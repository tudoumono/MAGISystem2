/**
 * User Settings Page
 * 
 * ユーザー設定画面 - APIキー管理とWeb検索設定
 */

'use client';

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Eye, EyeOff, AlertCircle, CheckCircle, Key, Globe } from 'lucide-react';

const client = generateClient<Schema>();

interface UserSettings {
  id?: string;
  userId: string;
  tavilyApiKey?: string;
  serperApiKey?: string;
  enableWebSearch: boolean;
  searchProvider: 'tavily' | 'serper';
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    userId: '',
    enableWebSearch: false,
    searchProvider: 'tavily'
  });
  
  const [showTavilyKey, setShowTavilyKey] = useState(false);
  const [showSerperKey, setShowSerperKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 設定の読み込み
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // 現在のユーザーを取得
      const user = await getCurrentUser();
      
      // ユーザー設定を取得
      const { data: userSettings } = await client.models.UserSettings.list({
        filter: {
          userId: { eq: user.userId }
        }
      });

      if (userSettings && userSettings.length > 0) {
        const existingSettings = userSettings[0];
        setSettings({
          id: existingSettings.id,
          userId: user.userId,
          tavilyApiKey: existingSettings.tavilyApiKey || '',
          serperApiKey: existingSettings.serperApiKey || '',
          enableWebSearch: existingSettings.enableWebSearch || false,
          searchProvider: (existingSettings.searchProvider as 'tavily' | 'serper') || 'tavily'
        });
      } else {
        // 新規設定
        setSettings(prev => ({
          ...prev,
          userId: user.userId
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({
        type: 'error',
        text: '設定の読み込みに失敗しました'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      if (settings.id) {
        // 既存設定の更新
        await client.models.UserSettings.update({
          id: settings.id,
          tavilyApiKey: settings.tavilyApiKey || null,
          serperApiKey: settings.serperApiKey || null,
          enableWebSearch: settings.enableWebSearch,
          searchProvider: settings.searchProvider,
          updatedAt: new Date().toISOString()
        });
      } else {
        // 新規設定の作成
        await client.models.UserSettings.create({
          userId: settings.userId,
          tavilyApiKey: settings.tavilyApiKey || null,
          serperApiKey: settings.serperApiKey || null,
          enableWebSearch: settings.enableWebSearch,
          searchProvider: settings.searchProvider,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      setMessage({
        type: 'success',
        text: '設定を保存しました'
      });

      // 設定を再読み込み
      await loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({
        type: 'error',
        text: '設定の保存に失敗しました'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestApiKey = async (provider: 'tavily' | 'serper') => {
    // TODO: APIキーのテスト実装
    setMessage({
      type: 'success',
      text: `${provider === 'tavily' ? 'Tavily' : 'Serper'} APIキーのテストは未実装です`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">設定を読み込み中...</p>
        </div>
      </div>
    );
  }

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

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Web検索設定 */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Web検索設定
              </h2>
            </div>

            {/* Web検索の有効化 */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableWebSearch}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    enableWebSearch: e.target.checked
                  }))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Web検索を有効化
                  </span>
                  <p className="text-sm text-gray-500">
                    3賢者が最新情報を検索できるようになります
                  </p>
                </div>
              </label>
            </div>

            {/* 検索プロバイダー選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索プロバイダー
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="searchProvider"
                    value="tavily"
                    checked={settings.searchProvider === 'tavily'}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      searchProvider: 'tavily'
                    }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Tavily（推奨）
                    </span>
                    <p className="text-xs text-gray-500">
                      高品質な検索結果と高速なレスポンス
                    </p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="searchProvider"
                    value="serper"
                    checked={settings.searchProvider === 'serper'}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      searchProvider: 'serper'
                    }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Serper
                    </span>
                    <p className="text-xs text-gray-500">
                      Google検索ベースの結果
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* APIキー設定 */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Key className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                APIキー管理
              </h2>
            </div>

            {/* Tavily API Key */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tavily API Key
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Input
                    type={showTavilyKey ? 'text' : 'password'}
                    value={settings.tavilyApiKey || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      tavilyApiKey: e.target.value
                    }))}
                    placeholder="tvly-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTavilyKey(!showTavilyKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showTavilyKey ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleTestApiKey('tavily')}
                  disabled={!settings.tavilyApiKey}
                >
                  テスト
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                <a
                  href="https://tavily.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Tavily
                </a>
                でAPIキーを取得してください（無料プランあり）
              </p>
            </div>

            {/* Serper API Key */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serper API Key（オプション）
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Input
                    type={showSerperKey ? 'text' : 'password'}
                    value={settings.serperApiKey || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      serperApiKey: e.target.value
                    }))}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSerperKey(!showSerperKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSerperKey ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleTestApiKey('serper')}
                  disabled={!settings.serperApiKey}
                >
                  テスト
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                <a
                  href="https://serper.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Serper
                </a>
                でAPIキーを取得してください（フォールバック用）
              </p>
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">セキュリティに関する注意</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>APIキーは暗号化されて保存されます</li>
                    <li>APIキーは他のユーザーと共有されません</li>
                    <li>定期的にAPIキーをローテーションすることを推奨します</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={saving}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>設定を保存</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}