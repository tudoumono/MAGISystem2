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
import type { AgentPresetConfig, BedrockModel } from '@/types/agent-preset';
import { AVAILABLE_MODELS } from '@/types/agent-preset';

interface PresetSelectorModalProps {
  isOpen: boolean;
  presets: AgentPresetConfig[];
  selectedPreset: AgentPresetConfig | null;
  onSelect: (preset: AgentPresetConfig) => void;
  onClose: () => void;
}

interface ModelOverride {
  [key: string]: string;
}

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  presets,
  selectedPreset,
  onSelect,
  onClose,
}) => {
  const [tempSelectedPreset, setTempSelectedPreset] = React.useState<AgentPresetConfig | null>(selectedPreset);
  const [modelOverrides, setModelOverrides] = React.useState<ModelOverride>({});
  const [showModelSelector, setShowModelSelector] = React.useState(false);

  if (!isOpen) return null;

  // デフォルトプリセットとカスタムプリセットを分離
  const defaultPresets = presets.filter(p => p.isDefault);
  const customPresets = presets.filter(p => !p.isDefault);

  /**
   * プリセット選択（一時的）
   */
  const handleTempSelect = (preset: AgentPresetConfig) => {
    setTempSelectedPreset(preset);
    setModelOverrides({}); // モデルオーバーライドをリセット
  };

  /**
   * モデルオーバーライド
   */
  const handleModelOverride = (agentId: string, model: string) => {
    setModelOverrides(prev => ({
      ...prev,
      [agentId]: model
    }));
  };

  /**
   * 確定して選択
   */
  const handleConfirm = () => {
    if (!tempSelectedPreset) return;

    // モデルオーバーライドを適用
    if (Object.keys(modelOverrides).length > 0) {
      const modifiedPreset: AgentPresetConfig = {
        ...tempSelectedPreset,
        configs: {
          ...tempSelectedPreset.configs,
          ...(Object.fromEntries(
            Object.entries(tempSelectedPreset.configs).map(([key, config]) => [
              key,
              modelOverrides[key] ? { ...config, model: modelOverrides[key] as any } : config
            ])
          ))
        }
      };
      onSelect(modifiedPreset);
    } else {
      onSelect(tempSelectedPreset);
    }
    
    onClose();
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
        <div className="p-6 space-y-6">
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
                    isSelected={tempSelectedPreset?.id === preset.id}
                    onSelect={() => handleTempSelect(preset)}
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
                    isSelected={tempSelectedPreset?.id === preset.id}
                    onSelect={() => handleTempSelect(preset)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* モデル変更セクション */}
          {tempSelectedPreset && (
            <section className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-gray-900">
                  モデルを変更（オプション）
                </span>
                <span className="text-sm text-gray-600">
                  {showModelSelector ? '▲' : '▼'}
                </span>
              </button>

              {showModelSelector && (
                <div className="mt-4 space-y-3">
                  {Object.entries(tempSelectedPreset.configs).map(([key, config]) => {
                    if (!config.enabled) return null;
                    
                    return (
                      <ModelSelector
                        key={key}
                        agentId={key}
                        agentName={config.name}
                        currentModel={modelOverrides[key] || config.model}
                        onModelChange={(model) => handleModelOverride(key, model)}
                      />
                    );
                  })}
                </div>
              )}
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

        {/* フッター */}
        {tempSelectedPreset && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              選択中: <span className="font-semibold">{tempSelectedPreset.name}</span>
              {Object.keys(modelOverrides).length > 0 && (
                <span className="ml-2 text-blue-600">
                  ({Object.keys(modelOverrides).length}個のモデルを変更)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button onClick={handleConfirm}>
                この設定で開始
              </Button>
            </div>
          </div>
        )}
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
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // 有効なエージェント数をカウント
  const enabledAgents = Object.values(preset.configs).filter(c => c.enabled).length;

  return (
    <Card
      className={`p-4 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      {/* ヘッダー（クリック可能） */}
      <div 
        className="cursor-pointer"
        onClick={onSelect}
      >
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
      </div>

      {/* 詳細表示トグル */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="w-full mt-3 pt-3 border-t border-gray-200 text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
      >
        {isExpanded ? '詳細を閉じる ▲' : '詳細を表示 ▼'}
      </button>

      {/* 詳細情報（展開時） */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {Object.entries(preset.configs).map(([key, config]) => {
            if (!config.enabled) return null;
            
            const color = 
              key === 'caspar' ? 'text-blue-700 bg-blue-50' :
              key === 'balthasar' ? 'text-purple-700 bg-purple-50' :
              key === 'melchior' ? 'text-green-700 bg-green-50' :
              'text-amber-700 bg-amber-50';

            return (
              <div key={key} className={`p-2 rounded ${color}`}>
                <div className="font-semibold text-xs mb-1">{config.name}</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="opacity-75">モデル:</span>
                    <span className="font-mono text-[10px]">
                      {config.model.split('/').pop()?.split('-').slice(0, 3).join(' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Temperature:</span>
                    <span>{config.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Max Tokens:</span>
                    <span>{config.maxTokens}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

/**
 * モデル選択コンポーネント
 */
interface ModelSelectorProps {
  agentId: string;
  agentName: string;
  currentModel: string;
  onModelChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  agentId,
  agentName,
  currentModel,
  onModelChange,
}) => {
  const color = 
    agentId === 'caspar' ? 'border-blue-200 bg-blue-50' :
    agentId === 'balthasar' ? 'border-purple-200 bg-purple-50' :
    agentId === 'melchior' ? 'border-green-200 bg-green-50' :
    'border-amber-200 bg-amber-50';

  return (
    <div className={`p-3 rounded-lg border ${color}`}>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {agentName}
      </label>
      <select
        value={currentModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {AVAILABLE_MODELS.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-600 mt-1">
        {AVAILABLE_MODELS.find(m => m.value === currentModel)?.description}
      </p>
    </div>
  );
};
