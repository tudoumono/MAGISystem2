'use client';

/**
 * Chat Page - 本番用MAGIチャット画面
 * 
 * 推奨デザイン（分割ビュー）を採用:
 * - 左: 会話履歴サイドバー (280px)
 * - 中央: チャットインターフェース (flex-1)
 * - 右: 推論トレースパネル (380px, 折りたたみ可能)
 * 
 * 目的:
 * - MAGIシステムの本番用チャット画面
 * - 3賢者の応答をカラーコーディングで表示
 * - リアルタイム推論トレースの可視化
 * - 会話履歴の管理
 * 
 * 設計理由:
 * - 既存のテストページ(/test/data/conversation)をベースに本番化
 * - 推論トレースを常時表示することでMAGIシステムの特徴を強調
 * - 折りたたみ可能なトレースパネルで画面を広く使える
 * - レスポンシブ対応（タブレット・モバイル）
 */

import React, { useState } from 'react';
import { ConversationSidebar } from '@/components/sidebar/ConversationSidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { TracePanel } from '@/components/trace/TracePanel';
import { PresetSelectorModal } from '@/components/chat/PresetSelectorModal';
import { useConversations } from '@/hooks/useConversations';
import { useAgentPresets } from '@/hooks/useAgentPresets';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Bot, Settings } from 'lucide-react';
import type { AgentPresetConfig } from '@/types/agent-preset';

export default function ChatPage() {
  // 会話管理
  const {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    searchConversations
  } = useConversations();

  // プリセット管理
  const { presets } = useAgentPresets();

  // UI状態管理
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [showTracePanel, setShowTracePanel] = useState(true);
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AgentPresetConfig | null>(null);

  /**
   * 新規会話の作成
   */
  const handleCreateNew = async () => {
    const params: any = {
      title: `新しい会話 ${new Date().toLocaleTimeString()}`
    };
    
    if (selectedPreset?.id) {
      params.agentPresetId = selectedPreset.id;
    }
    
    const newConversation = await createConversation(params);
    setActiveConversationId(newConversation.id);
  };

  /**
   * プリセット選択
   */
  const handlePresetSelect = (preset: AgentPresetConfig) => {
    setSelectedPreset(preset);
    setShowPresetSelector(false);
  };

  /**
   * 会話タイトルの変更
   */
  const handleTitleChange = async (conversationId: string, newTitle: string) => {
    await updateConversation({ id: conversationId, title: newTitle });
  };

  /**
   * 検索処理
   */
  const handleSearch = (query: string) => {
    // 検索は useConversations フック内で処理される
    console.log('Search query:', query);
  };

  /**
   * トレース表示
   */
  const handleTraceView = (traceId: string) => {
    setSelectedTraceId(traceId);
    setShowTracePanel(true);
  };

  /**
   * トレースパネルの切り替え
   */
  const toggleTracePanel = () => {
    setShowTracePanel(!showTracePanel);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* プリセット選択モーダル */}
      <PresetSelectorModal
        isOpen={showPresetSelector}
        presets={presets}
        selectedPreset={selectedPreset}
        onSelect={handlePresetSelect}
        onClose={() => setShowPresetSelector(false)}
      />

      {/* 左サイドバー: 会話履歴 */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          loading={loading}
          onSelect={setActiveConversationId}
          onDelete={deleteConversation}
          onSearch={handleSearch}
          onCreateNew={handleCreateNew}
        />
      </div>

      {/* 中央エリア: チャットインターフェース */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversationId ? (
          <ChatInterface
            conversationId={activeConversationId}
            onTitleChange={handleTitleChange}
            onTraceView={handleTraceView}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-2xl px-6">
              <Bot className="w-20 h-20 mx-auto mb-6 text-gray-300" />
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                MAGI Decision System
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる
                多角的な意思決定支援システムへようこそ
              </p>
              
              {/* 3賢者の説明 */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                    C
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-1">CASPAR</h3>
                  <p className="text-xs text-blue-700">保守的・現実的</p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                    B
                  </div>
                  <h3 className="font-semibold text-purple-900 mb-1">BALTHASAR</h3>
                  <p className="text-xs text-purple-700">革新的・感情的</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <h3 className="font-semibold text-green-900 mb-1">MELCHIOR</h3>
                  <p className="text-xs text-green-700">バランス型・科学的</p>
                </div>
              </div>

              {/* プリセット選択 */}
              <div className="mb-6">
                <Button
                  onClick={() => setShowPresetSelector(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {selectedPreset ? selectedPreset.name : 'プリセットを選択'}
                </Button>
                {selectedPreset && (
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedPreset.description}
                  </p>
                )}
              </div>

              <Button
                onClick={handleCreateNew}
                size="lg"
                className="px-8 py-4 text-lg"
              >
                新しい対話を始める
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 右パネル: 推論トレース（折りたたみ可能） */}
      {showTracePanel && selectedTraceId && (
        <div className="w-96 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
          <TracePanel
            traceId={selectedTraceId}
            onClose={() => setShowTracePanel(false)}
          />
        </div>
      )}

      {/* トレースパネル切り替えボタン */}
      {selectedTraceId && (
        <Button
          onClick={toggleTracePanel}
          variant="outline"
          size="sm"
          className="fixed right-4 top-4 z-10 shadow-lg"
          aria-label={showTracePanel ? 'トレースパネルを閉じる' : 'トレースパネルを開く'}
        >
          {showTracePanel ? (
            <>
              <ChevronRight className="w-4 h-4 mr-1" />
              <span>トレースを閉じる</span>
            </>
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>トレースを表示</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
