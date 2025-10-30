'use client';

/**
 * AgentPresetEditor - エージェントプリセット編集画面
 * 
 * 目的:
 * - プリセットの作成・編集
 * - 各エージェントの詳細設定
 * - バリデーションとプレビュー
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Save, X, AlertCircle } from 'lucide-react';
import { AgentConfigEditor } from '@/components/settings/AgentConfigEditor';
import type { AgentPresetConfig, AgentConfig } from '@/types/agent-preset';
import { DEFAULT_MAGI_PRESET } from '@/types/agent-preset';

interface AgentPresetEditorProps {
  preset: AgentPresetConfig | null;
  onSave: (preset: AgentPresetConfig) => Promise<void>;
  onCancel: () => void;
}

export const AgentPresetEditor: React.FC<AgentPresetEditorProps> = ({
  preset,
  onSave,
  onCancel,
}) => {
  // 編集中のプリセット
  const [editingPreset, setEditingPreset] = useState<AgentPresetConfig>(
    preset || {
      ...DEFAULT_MAGI_PRESET,
      name: '新しいプリセット',
      isDefault: false,
      isPublic: false,
    }
  );

  // 保存中フラグ
  const [isSaving, setIsSaving] = useState(false);

  // バリデーションエラー
  const [errors, setErrors] = useState<string[]>([]);

  /**
   * プリセット名の変更
   */
  const handleNameChange = (name: string) => {
    setEditingPreset(prev => ({ ...prev, name }));
  };

  /**
   * プリセット説明の変更
   */
  const handleDescriptionChange = (description: string) => {
    setEditingPreset(prev => ({ ...prev, description }));
  };

  /**
   * エージェント設定の変更
   */
  const handleAgentConfigChange = (agentId: string, config: AgentConfig) => {
    setEditingPreset(prev => ({
      ...prev,
      configs: {
        ...prev.configs,
        [agentId]: config,
      },
    }));
  };

  /**
   * バリデーション
   */
  const validate = (): boolean => {
    const newErrors: string[] = [];

    // プリセット名のチェック
    if (!editingPreset.name.trim()) {
      newErrors.push('プリセット名を入力してください');
    }

    // 有効なエージェントが1つ以上あるかチェック
    const enabledAgents = Object.values(editingPreset.configs).filter(c => c.enabled);
    if (enabledAgents.length === 0) {
      newErrors.push('少なくとも1つのエージェントを有効にしてください');
    }

    // 各エージェントの設定チェック
    Object.entries(editingPreset.configs).forEach(([key, config]) => {
      if (config.enabled) {
        if (!config.systemPrompt.trim()) {
          newErrors.push(`${config.name}のシステムプロンプトを入力してください`);
        }
        if (config.temperature < 0 || config.temperature > 1) {
          newErrors.push(`${config.name}のtemperatureは0-1の範囲で指定してください`);
        }
        if (config.maxTokens < 100 || config.maxTokens > 4096) {
          newErrors.push(`${config.name}のmaxTokensは100-4096の範囲で指定してください`);
        }
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  /**
   * 保存処理
   */
  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(editingPreset);
    } catch (error) {
      console.error('Failed to save preset:', error);
      setErrors(['保存に失敗しました。もう一度お試しください。']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {preset?.id ? 'プリセットを編集' : '新規プリセット作成'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="p-2"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* エラー表示 */}
      {errors.length > 0 && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-2">
                以下のエラーを修正してください
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* 基本情報 */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          基本情報
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プリセット名 <span className="text-red-500">*</span>
            </label>
            <Input
              value={editingPreset.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="例: 保守的なMAGI設定"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明（任意）
            </label>
            <textarea
              value={editingPreset.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="このプリセットの特徴や用途を説明してください"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* エージェント設定 */}
      <div className="space-y-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          エージェント設定
        </h3>

        {Object.entries(editingPreset.configs).map(([key, config]) => (
          <AgentConfigEditor
            key={key}
            config={config}
            onChange={(newConfig: AgentConfig) => handleAgentConfigChange(key, newConfig)}
          />
        ))}
      </div>

      {/* アクションボタン */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
