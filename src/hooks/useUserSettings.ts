/**
 * useUserSettings Hook
 * 
 * ユーザー設定の取得と管理
 */

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export interface UserSettings {
  id?: string;
  userId: string;
  tavilyApiKey?: string;
  serperApiKey?: string;
  enableWebSearch: boolean;
  searchProvider: 'tavily' | 'serper';
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

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
          tavilyApiKey: existingSettings.tavilyApiKey || undefined,
          serperApiKey: existingSettings.serperApiKey || undefined,
          enableWebSearch: existingSettings.enableWebSearch || false,
          searchProvider: (existingSettings.searchProvider as 'tavily' | 'serper') || 'tavily'
        });
      } else {
        // デフォルト設定
        setSettings({
          userId: user.userId,
          enableWebSearch: false,
          searchProvider: 'tavily'
        });
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to load settings'));
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };

      if (settings.id) {
        // 既存設定の更新
        await client.models.UserSettings.update({
          id: settings.id,
          ...newSettings,
          updatedAt: new Date().toISOString()
        });
      } else {
        // 新規設定の作成
        const { data } = await client.models.UserSettings.create({
          userId: settings.userId,
          ...newSettings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (data) {
          updatedSettings.id = data.id;
        }
      }

      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings
  };
}