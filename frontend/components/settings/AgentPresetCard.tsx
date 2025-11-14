'use client';

/**
 * AgentPresetCard - エージェントプリセットカード
 * 
 * 目的:
 * - プリセットの概要表示
 * - アクション（コピー、編集、削除）
 * - デフォルト/カスタムの視覚的区別
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Lock, Copy, Edit, Trash2, Check } from 'lucide-react';
import type { AgentPresetConfig } from '@/types/agent-preset';

interface AgentPresetCardProps {
  preset: AgentPresetConfig;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  readOnly: boolean;
}

export const AgentPresetCard: React.FC<AgentPresetCardProps> = ({
  preset,
  onCopy,
  onEdit,
  onDelete,
  readOnly,
}) => {
  // 有効なエージェント数をカウント
  const enabledAgents = Object.values(preset.configs).filter(c => c.enabled).length;
  const totalAgents = Object.keys(preset.configs).length;

  return (
    <Card className={`p-6 ${readOnly ? 'bg-gray-50 border-gray-300' : 'bg-white'}`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {preset.name}
            </h3>
            {readOnly && (
              <span title="変更不可">
                <Lock className="w-4 h-4 text-gray-400" />
              </span>
            )}
          </div>
          {preset.description && (
            <p className="text-sm text-gray-600">
              {preset.description}
            </p>
          )}
        </div>
      </div>

      {/* エージェント一覧 */}
      <div className="space-y-3 mb-4">
        {Object.entries(preset.configs).map(([key, config]) => (
          <div
            key={key}
            className={`flex items-center justify-between p-3 rounded-lg ${
              config.enabled ? 'bg-white border border-gray-200' : 'bg-gray-100 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* エージェントアイコン */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                key === 'caspar' ? 'bg-blue-500' :
                key === 'balthasar' ? 'bg-purple-500' :
                key === 'melchior' ? 'bg-green-500' :
                'bg-amber-500'
              }`}>
                {config.name.charAt(0)}
              </div>
              
              {/* エージェント情報 */}
              <div>
                <div className="font-medium text-sm text-gray-900">
                  {config.name}
                </div>
                <div className="text-xs text-gray-500">
                  {config.model.split('/').pop()?.split('-').slice(0, 3).join(' ')}
                </div>
              </div>
            </div>

            {/* 有効/無効 */}
            {config.enabled && (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>
        ))}
      </div>

      {/* 統計情報 */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
        <span>有効なエージェント</span>
        <span className="font-medium">{enabledAgents} / {totalAgents}</span>
      </div>

      {/* アクションボタン */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          コピー
        </Button>
        
        {!readOnly && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              編集
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
