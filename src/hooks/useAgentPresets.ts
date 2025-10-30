'use client';

/**
 * useAgentPresets Hook - エージェントプリセット管理
 * 
 * 目的:
 * - プリセットのCRUD操作
 * - デフォルトプリセットの初期化
 * - リアルタイム更新
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AgentPresetConfig } from '@/types/agent-preset';
import { DEFAULT_MAGI_PRESET } from '@/types/agent-preset';

/**
 * フックの戻り値型定義
 */
interface UseAgentPresetsReturn {
  presets: AgentPresetConfig[];
  loading: boolean;
  error: Error | null;
  createPreset: (preset: AgentPresetConfig) => Promise<AgentPresetConfig>;
  updatePreset: (preset: AgentPresetConfig) => Promise<AgentPresetConfig>;
  deletePreset: (id: string) => Promise<void>;
  getPreset: (id: string) => AgentPresetConfig | undefined;
  refreshPresets: () => Promise<void>;
}

/**
 * useAgentPresets Hook Implementation
 */
export function useAgentPresets(): UseAgentPresetsReturn {
  const [presets, setPresets] = useState<AgentPresetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * プリセット一覧の取得
   * 
   * Phase 1: ローカルストレージから取得
   * Phase 2: Amplify Dataから取得
   */
  const fetchPresets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Phase 1: ローカルストレージから取得
      const storedPresets = localStorage.getItem('agentPresets');
      let loadedPresets: AgentPresetConfig[] = [];

      if (storedPresets) {
        loadedPresets = JSON.parse(storedPresets);
      }

      // デフォルトプリセットが存在しない場合は追加
      const hasDefaultPreset = loadedPresets.some(p => p.isDefault);
      if (!hasDefaultPreset) {
        const defaultPreset: AgentPresetConfig = {
          ...DEFAULT_MAGI_PRESET,
          id: 'default-magi',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        loadedPresets.unshift(defaultPreset);
      }

      setPresets(loadedPresets);

      // Phase 2: Amplify Dataから取得（将来実装）
      // const client = getAmplifyClient();
      // const result = await client.models.AgentPreset.list();
      // setPresets(result.data);

    } catch (err) {
      console.error('Failed to fetch presets:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch presets'));
      
      // フォールバック: デフォルトプリセットのみ表示
      setPresets([{
        ...DEFAULT_MAGI_PRESET,
        id: 'default-magi',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * プリセットの作成
   */
  const createPreset = useCallback(async (preset: AgentPresetConfig): Promise<AgentPresetConfig> => {
    try {
      const newPreset: AgentPresetConfig = {
        ...preset,
        id: `preset-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Phase 1: ローカルストレージに保存
      const updatedPresets = [...presets, newPreset];
      localStorage.setItem('agentPresets', JSON.stringify(updatedPresets));
      setPresets(updatedPresets);

      // Phase 2: Amplify Dataに保存（将来実装）
      // const client = getAmplifyClient();
      // const result = await client.models.AgentPreset.create({
      //   name: preset.name,
      //   description: preset.description,
      //   configs: preset.configs,
      //   isDefault: preset.isDefault,
      //   isPublic: preset.isPublic,
      // });

      return newPreset;
    } catch (err) {
      console.error('Failed to create preset:', err);
      throw err instanceof Error ? err : new Error('Failed to create preset');
    }
  }, [presets]);

  /**
   * プリセットの更新
   */
  const updatePreset = useCallback(async (preset: AgentPresetConfig): Promise<AgentPresetConfig> => {
    try {
      if (!preset.id) {
        throw new Error('Preset ID is required for update');
      }

      const updatedPreset: AgentPresetConfig = {
        ...preset,
        updatedAt: new Date().toISOString(),
      };

      // Phase 1: ローカルストレージを更新
      const updatedPresets = presets.map(p => 
        p.id === preset.id ? updatedPreset : p
      );
      localStorage.setItem('agentPresets', JSON.stringify(updatedPresets));
      setPresets(updatedPresets);

      // Phase 2: Amplify Dataを更新（将来実装）
      // const client = getAmplifyClient();
      // const result = await client.models.AgentPreset.update({
      //   id: preset.id,
      //   name: preset.name,
      //   description: preset.description,
      //   configs: preset.configs,
      // });

      return updatedPreset;
    } catch (err) {
      console.error('Failed to update preset:', err);
      throw err instanceof Error ? err : new Error('Failed to update preset');
    }
  }, [presets]);

  /**
   * プリセットの削除
   */
  const deletePreset = useCallback(async (id: string): Promise<void> => {
    try {
      // デフォルトプリセットは削除不可
      const preset = presets.find(p => p.id === id);
      if (preset?.isDefault) {
        throw new Error('Cannot delete default preset');
      }

      // Phase 1: ローカルストレージから削除
      const updatedPresets = presets.filter(p => p.id !== id);
      localStorage.setItem('agentPresets', JSON.stringify(updatedPresets));
      setPresets(updatedPresets);

      // Phase 2: Amplify Dataから削除（将来実装）
      // const client = getAmplifyClient();
      // await client.models.AgentPreset.delete({ id });

    } catch (err) {
      console.error('Failed to delete preset:', err);
      throw err instanceof Error ? err : new Error('Failed to delete preset');
    }
  }, [presets]);

  /**
   * 特定のプリセットを取得
   */
  const getPreset = useCallback((id: string): AgentPresetConfig | undefined => {
    return presets.find(p => p.id === id);
  }, [presets]);

  /**
   * プリセット一覧の手動更新
   */
  const refreshPresets = useCallback(async (): Promise<void> => {
    await fetchPresets();
  }, [fetchPresets]);

  /**
   * 初期データ取得
   */
  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  return useMemo(() => ({
    presets,
    loading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    getPreset,
    refreshPresets,
  }), [
    presets,
    loading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    getPreset,
    refreshPresets,
  ]);
}
