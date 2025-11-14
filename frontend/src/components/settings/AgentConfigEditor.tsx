'use client';

/**
 * AgentConfigEditor - 個別エージェント設定エディタ
 * 
 * 目的:
 * - 個別エージェントの詳細設定
 * - モデル選択、パラメータ調整
 * - システムプロンプト編集
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AgentConfig, BedrockModel } from '@/types/agent-preset';
import { AVAILABLE_MODELS } from '@/types/agent-preset';

interface AgentConfigEditorProps {
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
}

export const AgentConfigEditor: React.FC<AgentConfigEditorProps> = ({
  config,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * エージェントカラーの取得
   */
  const getAgentColor = () => {
    switch (config.agentId) {
      case 'caspar': return 'blue';
      case 'balthasar': return 'purple';
      case 'melchior': return 'green';
      case 'solomon': return 'amber';
      default: return 'gray';
    }
  };

  const color = getAgentColor();

  return (
    <Card className={`border-l-4 border-${color}-500`}>
      {/* ヘッダー */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* アイコン */}
            <div className={`w-10 h-10 bg-${color}-500 rounded-full flex items-center justify-center text-white font-bold`}>
              {config.name.charAt(0)}
            </div>
            
            {/* 名前と説明 */}
            <div>
              <h4 className="font-semibold text-gray-900">
                {config.name}
              </h4>
              <p className="text-sm text-gray-600">
                {config.description}
              </p>
            </div>
          </div>

          {/* 展開ボタン */}
          <div className="flex items-center gap-3">
            {/* 有効/無効トグル */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => {
                  e.stopPropagation();
                  onChange({ ...config, enabled: e.target.checked });
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">有効</span>
            </label>

            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 詳細設定 */}
      {isExpanded && (
        <div className="p-6 pt-0 space-y-6">
          {/* モデル選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              モデル
            </label>
            <select
              value={config.model}
              onChange={(e) => onChange({ ...config, model: e.target.value as BedrockModel })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!config.enabled}
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* パラメータ設定 */}
          <div className="grid grid-cols-3 gap-4">
            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => onChange({ ...config, temperature: parseFloat(e.target.value) })}
                disabled={!config.enabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                0.0-1.0 (低: 保守的, 高: 創造的)
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <Input
                type="number"
                min="100"
                max="4096"
                step="100"
                value={config.maxTokens}
                onChange={(e) => onChange({ ...config, maxTokens: parseInt(e.target.value) })}
                disabled={!config.enabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                100-4096
              </p>
            </div>

            {/* Top P */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top P
              </label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={config.topP}
                onChange={(e) => onChange({ ...config, topP: parseFloat(e.target.value) })}
                disabled={!config.enabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                0.0-1.0
              </p>
            </div>
          </div>

          {/* システムプロンプト */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              システムプロンプト
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={12}
              disabled={!config.enabled}
              placeholder="エージェントの役割、判断基準、回答形式を定義してください"
            />
            <p className="text-xs text-gray-500 mt-1">
              このプロンプトがエージェントの性格と動作を決定します
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
