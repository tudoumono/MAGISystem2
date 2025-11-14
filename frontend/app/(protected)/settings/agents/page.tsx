'use client';

/**
 * Agent Settings Page - エージェント設定画面
 * 
 * 目的:
 * - 3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMONの設定管理
 * - デフォルトプリセットの表示（変更不可）
 * - カスタムプリセットの作成・編集・削除
 * - プリセットのコピー機能
 * 
 * 設計理由:
 * - デフォルトプリセットは変更不可で一貫性を保証
 * - カスタムプリセットで柔軟なカスタマイズを実現
 * - 各エージェントの役割とモデルを明確に定義
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Copy, Edit, Trash2, Lock, Save, X } from 'lucide-react';
import { AgentPresetCard } from '@/components/settings/AgentPresetCard';
import { AgentPresetEditor } from '@/components/settings/AgentPresetEditor';
import { useAgentPresets } from '@/hooks/useAgentPresets';
import type { AgentPresetConfig } from '@/types/agent-preset';

export default function AgentSettingsPage() {
  const router = useRouter();
  const { presets, loading, createPreset, updatePreset, deletePreset } = useAgentPresets();
  
  // UI状態管理
  const [showEditor, setShowEditor] = useState(false);
  const [editingPreset, setEditingPreset] = useState<AgentPresetConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  /**
   * 新規プリセット作成
   */
  const handleCreateNew = () => {
    setEditingPreset(null);
    setShowEditor(true);
    setIsCreating(true);
  };

  /**
   * プリセットのコピー
   */
  const handleCopy = (preset: AgentPresetConfig) => {
    // idを除外して新規作成として扱う
    const { id, ...presetWithoutId } = preset;
    const copiedPreset: AgentPresetConfig = {
      ...presetWithoutId,
      name: `${preset.name}のコピー`,
      isDefault: false,
      isPublic: false,
    };
    setEditingPreset(copiedPreset);
    setShowEditor(true);
    setIsCreating(true);
  };

  /**
   * プリセットの編集
   */
  const handleEdit = (preset: AgentPresetConfig) => {
    if (preset.isDefault) {
      // デフォルトプリセットは編集不可、コピーを提案
      if (confirm('デフォルトプリセットは編集できません。コピーして編集しますか？')) {
        handleCopy(preset);
      }
      return;
    }
    setEditingPreset(preset);
    setShowEditor(true);
    setIsCreating(false);
  };

  /**
   * プリセットの削除
   */
  const handleDelete = async (presetId: string) => {
    if (!confirm('このプリセットを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      await deletePreset(presetId);
    } catch (error) {
      console.error('Failed to delete preset:', error);
      alert('プリセットの削除に失敗しました');
    }
  };

  /**
   * プリセットの保存
   */
  const handleSave = async (preset: AgentPresetConfig) => {
    try {
      if (isCreating || !preset.id) {
        await createPreset(preset);
      } else {
        await updatePreset(preset);
      }
      setShowEditor(false);
      setEditingPreset(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('プリセットの保存に失敗しました');
    }
  };

  /**
   * エディタのキャンセル
   */
  const handleCancel = () => {
    setShowEditor(false);
    setEditingPreset(null);
    setIsCreating(false);
  };

  // デフォルトプリセットとカスタムプリセットを分離
  const defaultPresets = presets.filter((p: AgentPresetConfig) => p.isDefault);
  const customPresets = presets.filter((p: AgentPresetConfig) => !p.isDefault);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                ← ダッシュボード
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                エージェント設定
              </h1>
            </div>
            
            <Button
              onClick={handleCreateNew}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新規プリセット作成
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* エディタモーダル */}
        {showEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
              <AgentPresetEditor
                preset={editingPreset}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        )}

        {/* デフォルトプリセット */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              デフォルトプリセット
            </h2>
            <p className="text-gray-600">
              システムが提供する標準設定です。変更はできませんが、コピーしてカスタマイズできます。
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : defaultPresets.length === 0 ? (
            <Card className="p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">
                デフォルトプリセットが見つかりません
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {defaultPresets.map((preset: AgentPresetConfig) => (
                <AgentPresetCard
                  key={preset.id}
                  preset={preset}
                  onCopy={() => handleCopy(preset)}
                  onEdit={() => handleEdit(preset)}
                  onDelete={() => {}}
                  readOnly={true}
                />
              ))}
            </div>
          )}
        </section>

        {/* カスタムプリセット */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              カスタムプリセット
            </h2>
            <p className="text-gray-600">
              あなたが作成したカスタム設定です。自由に編集・削除できます。
            </p>
          </div>

          {customPresets.length === 0 ? (
            <Card className="p-12 text-center">
              <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                カスタムプリセットがありません
              </h3>
              <p className="text-gray-600 mb-6">
                新規作成するか、デフォルトプリセットをコピーして始めましょう
              </p>
              <Button onClick={handleCreateNew}>
                最初のプリセットを作成
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customPresets.map((preset: AgentPresetConfig) => (
                <AgentPresetCard
                  key={preset.id}
                  preset={preset}
                  onCopy={() => handleCopy(preset)}
                  onEdit={() => handleEdit(preset)}
                  onDelete={() => handleDelete(preset.id!)}
                  readOnly={false}
                />
              ))}
            </div>
          )}
        </section>

        {/* ヘルプセクション */}
        <section className="mt-12">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 エージェント設定のヒント
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• <strong>CASPAR</strong>: 保守的・現実的な視点。リスク回避を重視</li>
              <li>• <strong>BALTHASAR</strong>: 革新的・感情的な視点。創造性と倫理を重視</li>
              <li>• <strong>MELCHIOR</strong>: バランス型・科学的な視点。データと論理を重視</li>
              <li>• <strong>SOLOMON</strong>: 統括者。3賢者の回答を評価・統合</li>
              <li>• デフォルトプリセットは変更できませんが、コピーしてカスタマイズできます</li>
              <li>• カスタムプリセットは会話作成時に選択できます</li>
            </ul>
          </Card>
        </section>
      </main>
    </div>
  );
}
