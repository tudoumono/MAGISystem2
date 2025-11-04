/**
 * User Settings Hook
 * 
 * ユーザー設定を管理するカスタムフック
 * 
 * TODO: UserSettingsモデルの型生成後に有効化
 */

import { useState } from 'react';

interface UserSettings {
  id?: string;
  userId: string;
  tavilyApiKey?: string;
  serperApiKey?: string;
  enableWebSearch: boolean;
  searchProvider: 'tavily' | 'serper';
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // TODO: 実装を有効化
  const loadSettings = async () => {
    console.warn('useUserSettings: loadSettings is temporarily disabled');
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    console.warn('useUserSettings: saveSettings is temporarily disabled');
  };

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
  };
}
