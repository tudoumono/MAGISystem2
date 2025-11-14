'use client';

/**
 * PresetSelector - プリセット選択コンポーネント
 * 
 * 目的:
 * - エージェントプリセットの選択
 * - 現在のプリセット表示
 * - プリセット設定画面へのリンク
 */

import React from 'react';
import { Settings } from 'lucide-react';
import type { AgentPresetConfig } from '@/types/agent-preset';

interface PresetSelectorProps {
  presets: AgentPresetConfig[];
  currentPresetId: string;
  onPresetChange: (presetId: string) => void;
  onSettingsClick?: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  currentPresetId,
  onPresetChange,
  onSettingsClick,
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200">
      <label className="text-sm font-medium text-gray-700">
        プリセット:
      </label>
      
      <select
        value={currentPresetId}
        onChange={(e) => onPresetChange(e.target.value)}
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
            {preset.isDefault && ' (デフォルト)'}
          </option>
        ))}
      </select>

      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="プリセット設定"
        >
          <Settings className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
