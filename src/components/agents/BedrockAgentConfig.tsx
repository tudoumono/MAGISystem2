/**
 * Bedrock Agent Configuration Component
 * 
 * このコンポーネントはBedrock Multi-Agent Collaborationの
 * エージェント設定管理UIを提供します。
 * 
 * 主要機能:
 * - 4エージェント（SOLOMON + 3賢者）の個別設定
 * - プリセット管理（作成、編集、削除、複製）
 * - 設定のインポート/エクスポート
 * - リアルタイムプレビュー
 * 
 * 学習ポイント:
 * - 複雑なフォーム管理
 * - 設定の検証とエラーハンドリング
 * - ユーザビリティの向上
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  AgentConfig, 
  AgentPreset, 
  AgentType, 
  AGENT_DESCRIPTIONS 
} from '@/types/domain';
import { PresetManager } from '@/lib/agents/orchestration';

/**
 * コンポーネントのProps型定義
 */
interface BedrockAgentConfigProps {
  // 現在の設定
  currentConfigs?: AgentConfig[] | undefined;
  currentPreset?: AgentPreset | null;
  
  // コールバック関数
  onConfigChange?: (configs: AgentConfig[]) => void;
  onPresetChange?: (preset: AgentPreset) => void;
  onPresetSave?: (preset: AgentPreset) => void;
  onPresetDelete?: (presetId: string) => void;
  
  // UI制御
  disabled?: boolean;
  showAdvanced?: boolean;
  
  // クラス名
  className?: string;
}

/**
 * Bedrock Agent Configuration Component
 * 
 * 設計理由:
 * - タブベースのUI設計による使いやすさ
 * - リアルタイム検証とフィードバック
 * - プリセット管理の統合
 * 
 * 学習ポイント:
 * - 複雑な状態管理の実装
 * - フォームバリデーション
 * - ユーザビリティの考慮
 */
export function BedrockAgentConfig({
  currentConfigs,
  currentPreset,
  onConfigChange,
  onPresetChange,
  onPresetSave,
  onPresetDelete,
  disabled = false,
  showAdvanced = false,
  className = '',
}: BedrockAgentConfigProps) {
  // 状態管理
  const [activeTab, setActiveTab] = useState<AgentType>('solomon');
  const [configs, setConfigs] = useState<AgentConfig[]>(() => 
    currentConfigs || getDefaultConfigs()
  );
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * デフォルト設定の取得
   */
  function getDefaultConfigs(): AgentConfig[] {
    return [
      {
        agentId: 'solomon',
        modelId: 'anthropic.claude-3-opus-20240229-v1:0',
        systemPrompt: 'あなたはSOLOMON Judge - MAGI Decision Systemの統括者です。3賢者の判断を統合し、最終的な評価を行ってください。',
        temperature: 0.4,
        maxTokens: 2000,
      },
      {
        agentId: 'caspar',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        systemPrompt: 'あなたはCASPAR - 保守的で現実的な視点から判断を行う賢者です。リスクを重視し、慎重な分析を行ってください。',
        temperature: 0.3,
        maxTokens: 1500,
      },
      {
        agentId: 'balthasar',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        systemPrompt: 'あなたはBALTHASAR - 革新的で感情的な視点から判断を行う賢者です。創造性と人間的価値を重視してください。',
        temperature: 0.7,
        maxTokens: 1500,
      },
      {
        agentId: 'melchior',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        systemPrompt: 'あなたはMELCHIOR - バランス型で科学的な視点から判断を行う賢者です。論理的分析を重視してください。',
        temperature: 0.5,
        maxTokens: 1500,
      },
    ];
  }

  /**
   * 設定の更新
   */
  const updateConfig = useCallback((agentId: AgentType, updates: Partial<AgentConfig>) => {
    const newConfigs = configs.map(config => 
      config.agentId === agentId 
        ? { ...config, ...updates }
        : config
    );
    
    setConfigs(newConfigs);
    onConfigChange?.(newConfigs);
    
    // バリデーション
    validateConfig(agentId, { ...configs.find(c => c.agentId === agentId)!, ...updates });
  }, [configs, onConfigChange]);

  /**
   * 設定の検証
   */
  const validateConfig = useCallback((agentId: AgentType, config: AgentConfig) => {
    const errors: Record<string, string> = {};

    if (!config.modelId) {
      errors[`${agentId}_modelId`] = 'モデルIDは必須です';
    }

    if (config.temperature < 0 || config.temperature > 1) {
      errors[`${agentId}_temperature`] = 'Temperatureは0-1の範囲で設定してください';
    }

    if (config.maxTokens < 100 || config.maxTokens > 4000) {
      errors[`${agentId}_maxTokens`] = 'Max Tokensは100-4000の範囲で設定してください';
    }

    if (!config.systemPrompt || config.systemPrompt.trim().length === 0) {
      errors[`${agentId}_systemPrompt`] = 'システムプロンプトは必須です';
    } else if (config.systemPrompt.length > 2000) {
      errors[`${agentId}_systemPrompt`] = 'システムプロンプトは2000文字以内で設定してください';
    }

    setValidationErrors(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.keys(prev)
          .filter(key => !key.startsWith(`${agentId}_`))
          .map(key => [key, prev[key]])
          .filter(([, value]) => value !== undefined)
      ),
      ...errors,
    }));
  }, []);

  /**
   * プリセットの保存
   */
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      alert('プリセット名を入力してください');
      return;
    }

    const preset: AgentPreset = {
      id: `custom_${Date.now()}`,
      name: presetName.trim(),
      description: presetDescription.trim(),
      configs: [...configs],
      isDefault: false,
      isPublic: false,
      createdAt: new Date(),
    };

    onPresetSave?.(preset);
    setPresetName('');
    setPresetDescription('');
    setIsCreatingPreset(false);
  }, [presetName, presetDescription, configs, onPresetSave]);

  /**
   * 設定のリセット
   */
  const handleResetToDefault = useCallback(() => {
    if (confirm('設定をデフォルトに戻しますか？')) {
      const defaultConfigs = getDefaultConfigs();
      setConfigs(defaultConfigs);
      onConfigChange?.(defaultConfigs);
      setValidationErrors({});
    }
  }, [onConfigChange]);

  /**
   * 現在の設定を取得
   */
  const getCurrentConfig = useCallback((agentId: AgentType): AgentConfig => {
    const found = configs.find(config => config.agentId === agentId);
    if (found) return found;
    
    const defaults = getDefaultConfigs();
    const defaultForAgent = defaults.find(config => config.agentId === agentId);
    return defaultForAgent || defaults[0]!; // defaults[0]は常に存在する
  }, [configs]);

  /**
   * 利用可能なモデル一覧
   */
  const availableModels = [
    { id: 'anthropic.claude-3-opus-20240229-v1:0', name: 'Claude 3 Opus', description: '最高性能モデル' },
    { id: 'anthropic.claude-3-sonnet-20240229-v1:0', name: 'Claude 3 Sonnet', description: 'バランス型モデル' },
    { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku', description: '高速モデル' },
  ];

  /**
   * エージェントタブの描画
   */
  const renderAgentTabs = () => {
    const agents: AgentType[] = ['solomon', 'caspar', 'balthasar', 'melchior'];
    
    return (
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {agents.map((agentId) => {
            const hasError = Object.keys(validationErrors).some(key => key.startsWith(`${agentId}_`));
            
            return (
              <button
                key={agentId}
                onClick={() => setActiveTab(agentId)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === agentId
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${hasError ? 'text-red-600' : ''}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={disabled}
              >
                {agentId.toUpperCase()}
                {hasError && <span className="ml-1 text-red-500">⚠</span>}
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  /**
   * エージェント設定フォームの描画
   */
  const renderAgentConfigForm = (agentId: AgentType) => {
    const config = getCurrentConfig(agentId);
    
    return (
      <div className="space-y-6">
        {/* エージェント説明 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            {agentId.toUpperCase()} - {AGENT_DESCRIPTIONS[agentId].split(' - ')[1]}
          </h3>
          <p className="text-blue-700 text-sm">
            {AGENT_DESCRIPTIONS[agentId]}
          </p>
        </div>

        {/* モデル選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            使用モデル
          </label>
          <select
            value={config.modelId}
            onChange={(e) => updateConfig(agentId, { modelId: e.target.value })}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-blue-500 focus:border-blue-500
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              ${validationErrors[`${agentId}_modelId`] ? 'border-red-500' : ''}
            `}
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
          {validationErrors[`${agentId}_modelId`] && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors[`${agentId}_modelId`]}
            </p>
          )}
        </div>

        {/* Temperature設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature: {config.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature}
            onChange={(e) => updateConfig(agentId, { temperature: parseFloat(e.target.value) })}
            disabled={disabled}
            className={`
              w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>保守的 (0.0)</span>
            <span>創造的 (1.0)</span>
          </div>
          {validationErrors[`${agentId}_temperature`] && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors[`${agentId}_temperature`]}
            </p>
          )}
        </div>

        {/* Max Tokens設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            最大トークン数
          </label>
          <input
            type="number"
            min="100"
            max="4000"
            step="100"
            value={config.maxTokens}
            onChange={(e) => updateConfig(agentId, { maxTokens: parseInt(e.target.value) })}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-blue-500 focus:border-blue-500
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              ${validationErrors[`${agentId}_maxTokens`] ? 'border-red-500' : ''}
            `}
          />
          {validationErrors[`${agentId}_maxTokens`] && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors[`${agentId}_maxTokens`]}
            </p>
          )}
        </div>

        {/* システムプロンプト */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            システムプロンプト
          </label>
          <textarea
            value={config.systemPrompt}
            onChange={(e) => updateConfig(agentId, { systemPrompt: e.target.value })}
            disabled={disabled}
            rows={8}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-blue-500 focus:border-blue-500
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              ${validationErrors[`${agentId}_systemPrompt`] ? 'border-red-500' : ''}
            `}
            placeholder={`${agentId.toUpperCase()}エージェントの役割と動作を定義してください...`}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {config.systemPrompt.length}/2000文字
            </span>
            {validationErrors[`${agentId}_systemPrompt`] && (
              <span className="text-xs text-red-600">
                {validationErrors[`${agentId}_systemPrompt`]}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * プリセット管理セクションの描画
   */
  const renderPresetManagement = () => {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">プリセット管理</h3>
        
        {/* 現在のプリセット表示 */}
        {currentPreset && (
          <div className="mb-4 p-3 bg-white rounded border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{currentPreset.name}</h4>
                <p className="text-sm text-gray-600">{currentPreset.description}</p>
              </div>
              <button
                onClick={() => onPresetDelete?.(currentPreset.id)}
                disabled={disabled || currentPreset.isDefault}
                className={`
                  px-3 py-1 text-sm rounded
                  ${currentPreset.isDefault
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                削除
              </button>
            </div>
          </div>
        )}

        {/* 新規プリセット作成 */}
        {isCreatingPreset ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="プリセット名"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              disabled={disabled}
              className={`
                w-full px-3 py-2 border border-gray-300 rounded-md
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            />
            <textarea
              placeholder="プリセットの説明（オプション）"
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              disabled={disabled}
              rows={2}
              className={`
                w-full px-3 py-2 border border-gray-300 rounded-md
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSavePreset}
                disabled={disabled || !presetName.trim()}
                className={`
                  px-4 py-2 bg-blue-600 text-white rounded-md text-sm
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${disabled || !presetName.trim() ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsCreatingPreset(false);
                  setPresetName('');
                  setPresetDescription('');
                }}
                disabled={disabled}
                className={`
                  px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm
                  hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsCreatingPreset(true)}
              disabled={disabled}
              className={`
                px-4 py-2 bg-green-600 text-white rounded-md text-sm
                hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              新規プリセット作成
            </button>
            <button
              onClick={handleResetToDefault}
              disabled={disabled}
              className={`
                px-4 py-2 bg-gray-600 text-white rounded-md text-sm
                hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              デフォルトに戻す
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Bedrock Multi-Agent Configuration
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          SOLOMON Judge と 3賢者（CASPAR、BALTHASAR、MELCHIOR）の設定を管理します
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="px-6">
        {renderAgentTabs()}
      </div>

      {/* 設定フォーム */}
      <div className="px-6 py-6">
        {renderAgentConfigForm(activeTab)}
      </div>

      {/* プリセット管理 */}
      <div className="px-6 pb-6">
        {renderPresetManagement()}
      </div>

      {/* バリデーションエラーサマリー */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              設定エラーがあります
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(validationErrors).map(([key, error]) => (
                <li key={key}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default BedrockAgentConfig;