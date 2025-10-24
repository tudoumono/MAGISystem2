/**
 * MAGI Decision Interface - MAGI意思決定インターフェース
 * 
 * このページはMAGI意思決定システムのメインインターフェースです。
 * 会話履歴管理とリアルタイムトレース可視化を統合し、
 * 過去の判断履歴を参照しながら新しい意思決定を行えます。
 * 
 * 機能:
 * - 会話履歴の管理と検索
 * - MAGI意思決定システムの実行
 * - リアルタイムトレース可視化
 * - 判断結果の保存と参照
 * 
 * 画面構成:
 * - 左側: 会話履歴サイドバー
 * - 右側: MAGI判断インターフェース
 */

'use client';

import React, { useState } from 'react';
import { ConversationSidebar } from '@/components/sidebar/ConversationSidebar';
import MAGIWithTrace from '@/components/agents/MAGIWithTrace';
import { useConversations } from '@/hooks/useConversations';

/**
 * MAGIDecisionPage - MAGI意思決定メインページ
 */
export default function MAGIDecisionPage() {
  const [activeConversationId, setActiveConversationId] = useState<string>();
  
  const {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation
  } = useConversations();

  const handleCreateNew = async () => {
    const newConversation = await createConversation({
      title: `MAGI判断 ${new Date().toLocaleTimeString()}`
    });
    setActiveConversationId(newConversation.id);
  };

  const handleSearch = (query: string) => {
    // 検索は useConversations フック内で処理される
    console.log('Search query:', query);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 左側: 会話履歴サイドバー */}
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

      {/* 右側: MAGI判断インターフェース */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <div className="h-full">
            <MAGIWithTrace
              conversationId={activeConversationId}
              defaultMode="both"
              showModeToggle={true}
              className="h-full"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                MAGI意思決定システム
              </h1>
              <p className="text-gray-600 mb-8">
                3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる
                多角的な意思決定支援システムです。
                <br />
                左のサイドバーから過去の判断を確認するか、新しい判断を開始してください。
              </p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                新しい判断を開始
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}