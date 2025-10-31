'use client';

/**
 * PresetSelectorModal - プリセット選択モーダル
 * 
 * 目的:
 * - チャット画面でエージェントプリセットを選択
 * - デフォルトプリセットとカスタムプリセットの表示
 * - プリセットの詳細情報表示
 */

import React from 'react';
import { X, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { AgentPresetConfig } from '@/types/agent-preset';

interface PresetSelectorModalProps {
  isOpen: boolean;
  presets: AgentPresetConfig[];
  selectedPreset: AgentPresetConfig | null;
  onSelect: (preset: AgentPresetConfig) => void;
  onClose: () => void;
}

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  presets,
  selectedPreset,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  // デフォルトプリセットとカスタムプリセットを分離
  const defaultPresets = presets.filter(p => p.isDefault);
  const customPresets = presets.filter(p => !p.isDefault);

  /**
   * プリセット選択
   */
  const handleSelect = (preset: AgentPresetConfig) => {
    onSelect(preset);
  };

  /**
   * モーダル外クリックで閉じる
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              エージェントプリセットを選択
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              会話で使用する3賢者の設定を選択してください
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-8">
          {/* デフォルトプリセット */}
          {defaultPresets.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                デフォルトプリセット
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {defaultPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedPreset?.id === preset.id}
                    onSelect={() => handleSelect(preset)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* カスタムプリセット */}
          {customPresets.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                カスタムプリセット
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedPreset?.id === preset.id}
                    onSelect={() => handleSelect(preset)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* プリセットがない場合 */}
          {presets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                利用可能なプリセットがありません
              </p>
              <Button variant="outline" onClick={onClose}>
                閉じる
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * プリセットカードコンポーネント
 */
interface PresetCardProps {
  preset: AgentPresetConfig;
  isSelected: boolean;
  onSelect: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isSelected,
  onSelect,
}) => {
  // 有効なエージェント数をカウント
  const enabledAgents = Object.values(preset.configs).filter(c => c.enabled).length;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">
              {preset.name}
            </h4>
            {preset.isDefault && (
              <span title="デフォルトプリセット">
                <Lock className="w-3 h-3 text-gray-400" />
              </span>
            )}
          </div>
          {preset.description && (
            <p className="text-xs text-gray-600">
              {preset.description}
            </p>
          )}
        </div>
        {isSelected && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* エージェント情報 */}
      <div className="flex items-center gap-2 mb-3">
        {Object.entries(preset.configs).map(([key, config]) => {
          if (!config.enabled) return null;
          
          const color = 
            key === 'caspar' ? 'bg-blue-500' :
            key === 'balthasar' ? 'bg-purple-500' :
            key === 'melchior' ? 'bg-green-500' :
            'bg-amber-500';

          return (
            <div
              key={key}
              className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold`}
              title={config.name}
            >
              {config.name.charAt(0)}
            </div>
          );
        })}
      </div>

      {/* 統計 */}
      <div className="text-xs text-gray-500">
        {enabledAgents}個のエージェントが有効
      </div>
    </Card>
  );
};
