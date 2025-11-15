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
 * - 推論トレースを常時表示することでMAGIシステムの特徴を強調
 * - 折りたたみ可能なトレースパネルで画面を広く使える
 * - レスポンシブ対応（タブレット・モバイル）
 * - 会話履歴の永続化と管理
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
import { PageTransition } from '@/components/layout/PageTransition';

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
    <PageTransition variant="scale" duration={0.4}>
      <div className="h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* 背景エフェクト - ネオングリッド */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d9ff08_1px,transparent_1px),linear-gradient(to_bottom,#00d9ff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* プリセット選択モーダル */}
      <PresetSelectorModal
        isOpen={showPresetSelector}
        presets={presets}
        selectedPreset={selectedPreset}
        onSelect={handlePresetSelect}
        onClose={() => setShowPresetSelector(false)}
      />

      {/* 左サイドバー: 会話履歴 */}
      <div className="w-80 flex-shrink-0 border-r border-white/10 glass-dark relative z-10">
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
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {activeConversationId ? (
          <ChatInterface
            conversationId={activeConversationId}
            onTitleChange={handleTitleChange}
            onTraceView={handleTraceView}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center px-8 py-12">
            <div className="text-center max-w-4xl animate-fade-in-up">
              {/* MAGIロゴ - グローイングエフェクト */}
              <div className="relative mb-12">
                <div className="w-32 h-32 mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-magi-caspar-neon via-magi-melchior-neon to-magi-balthasar-neon rounded-full blur-2xl opacity-50 animate-pulse-slow" />
                  <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center border-2 border-white/20 shadow-elevation-xl">
                    <Bot className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                  </div>
                </div>
              </div>

              <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight">
                MAGI Decision System
              </h2>
              <p className="text-xl text-gray-300 mb-16 max-w-2xl mx-auto leading-relaxed">
                3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる<br />
                多角的な意思決定支援システムへようこそ
              </p>

              {/* 3賢者の説明 - ネオンカード */}
              <div className="grid grid-cols-3 gap-6 mb-16 max-w-3xl mx-auto">
                {/* CASPAR */}
                <div className="group magi-card-glass glass-caspar border-2 neon-border-caspar hover:scale-105 transition-smooth">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-magi-caspar-500 to-magi-caspar-700 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-neon-caspar group-hover:shadow-neon-caspar group-hover:animate-pulse-glow">
                      C
                    </div>
                    <h3 className="font-bold text-lg neon-caspar mb-2">CASPAR</h3>
                    <p className="text-sm text-magi-caspar-200">保守的・現実的</p>
                  </div>
                </div>

                {/* BALTHASAR */}
                <div className="group magi-card-glass glass-balthasar border-2 neon-border-balthasar hover:scale-105 transition-smooth">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-magi-balthasar-500 to-magi-balthasar-700 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-neon-balthasar group-hover:shadow-neon-balthasar group-hover:animate-pulse-glow">
                      B
                    </div>
                    <h3 className="font-bold text-lg neon-balthasar mb-2">BALTHASAR</h3>
                    <p className="text-sm text-magi-balthasar-200">革新的・感情的</p>
                  </div>
                </div>

                {/* MELCHIOR */}
                <div className="group magi-card-glass glass-melchior border-2 neon-border-melchior hover:scale-105 transition-smooth">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-magi-melchior-500 to-magi-melchior-700 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-neon-melchior group-hover:shadow-neon-melchior group-hover:animate-pulse-glow">
                      M
                    </div>
                    <h3 className="font-bold text-lg neon-melchior mb-2">MELCHIOR</h3>
                    <p className="text-sm text-magi-melchior-200">バランス型・科学的</p>
                  </div>
                </div>
              </div>

              {/* プリセット選択 */}
              <div className="mb-8">
                <button
                  onClick={() => setShowPresetSelector(true)}
                  className="btn-magi-glass group inline-flex items-center gap-3"
                >
                  <Settings className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:rotate-90 transition-smooth" />
                  <span className="text-gray-200 group-hover:text-white">
                    {selectedPreset ? selectedPreset.name : 'プリセットを選択'}
                  </span>
                </button>
                {selectedPreset && (
                  <p className="text-sm text-gray-400 mt-4 animate-fade-in">
                    {selectedPreset.description}
                  </p>
                )}
              </div>

              <button
                onClick={handleCreateNew}
                className="btn-magi-primary text-lg px-10 py-5 shadow-elevation-xl hover:shadow-elevation-xl hover:scale-105 transition-smooth"
              >
                新しい対話を始める
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 右パネル: 推論トレース（折りたたみ可能） */}
      {showTracePanel && selectedTraceId && (
        <div className="w-96 flex-shrink-0 border-l border-white/10 glass-dark flex flex-col relative z-10">
          <TracePanel
            traceId={selectedTraceId}
            onClose={() => setShowTracePanel(false)}
          />
        </div>
      )}

      {/* トレースパネル切り替えボタン */}
      {selectedTraceId && (
        <button
          onClick={toggleTracePanel}
          className="btn-magi-glass fixed right-6 top-6 z-20 !px-4 !py-2 shadow-elevation-lg hover:shadow-elevation-xl"
          aria-label={showTracePanel ? 'トレースパネルを閉じる' : 'トレースパネルを開く'}
        >
          {showTracePanel ? (
            <>
              <ChevronRight className="w-4 h-4 mr-2" />
              <span className="text-sm">トレースを閉じる</span>
            </>
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">トレースを表示</span>
            </>
          )}
        </button>
      )}
      </div>
    </PageTransition>
  );
}
