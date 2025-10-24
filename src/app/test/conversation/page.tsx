/**
 * Conversation Management Test Page
 * 
 * Task 8の実装をテストするためのページです。
 * ConversationSidebarとChatInterfaceの統合動作を確認します。
 */

'use client';

import React, { useState } from 'react';
import { ConversationSidebar } from '@/components/sidebar/ConversationSidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { TraceModal } from '@/components/chat/TraceModal';
import { useConversations } from '@/hooks/useConversations';
import type { Conversation } from '@/lib/amplify/types';

export default function ConversationTestPage() {
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  
  const {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    searchConversations
  } = useConversations();

  const handleCreateNew = async () => {
    const newConversation = await createConversation({
      title: `新しい会話 ${new Date().toLocaleTimeString()}`
    });
    setActiveConversationId(newConversation.id);
  };

  const handleTitleChange = async (conversationId: string, newTitle: string) => {
    await updateConversation({ id: conversationId, title: newTitle });
  };

  const handleSearch = (query: string) => {
    // 検索は useConversations フック内で処理される
    console.log('Search query:', query);
  };

  const handleTraceView = (traceId: string) => {
    // トレースモーダルを表示
    setSelectedTraceId(traceId);
    setShowTraceModal(true);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* サイドバー */}
      <div className="w-80 flex-shrink-0">
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

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <ChatInterface
            conversationId={activeConversationId}
            onTitleChange={handleTitleChange}
            onTraceView={handleTraceView}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                MAGI対話モード
              </h2>
              <p className="text-gray-600 mb-6">
                チャット形式でMAGIシステムと対話できます。
                左のサイドバーから過去の対話を選択するか、新しい対話を開始してください。
              </p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                新しい対話を始める
              </button>
            </div>
          </div>
        )}
      </div>

      {/* トレースモーダル */}
      <TraceModal
        isOpen={showTraceModal}
        traceId={selectedTraceId}
        onClose={() => setShowTraceModal(false)}
      />
    </div>
  );
}