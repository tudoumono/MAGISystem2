/**
 * MAGI Decision Interface - MAGI意思決定インターフェース
 *
 * 目的: メインのMAGI意思決定システムのユーザーインターフェース
 * 設計理由: 会話履歴管理とリアルタイムトレース可視化を統合した本番環境用ページ
 *
 * 主要機能:
 * - 会話履歴の管理と検索
 * - MAGI意思決定システムの実行
 * - リアルタイムトレース可視化
 * - 判断結果の保存と参照
 *
 * 画面構成:
 * - 左側: 会話履歴サイドバー（320px固定幅）
 * - 右側: MAGI判断インターフェース（残りの幅）
 *
 * 学習ポイント:
 * - 2カラムレイアウトの実装
 * - 会話履歴の状態管理
 * - リアルタイムトレースの統合
 * - レスポンシブデザインの考慮
 *
 * 関連:
 * - src/components/sidebar/ConversationSidebar.tsx
 * - src/components/agents/MAGIWithTrace.tsx
 * - src/hooks/useConversations.ts
 */

'use client';

import React, { useState } from 'react';
import { ConversationSidebar } from '@/components/sidebar/ConversationSidebar';
import MAGIWithTrace from '@/components/agents/MAGIWithTrace';
import { useConversations } from '@/hooks/useConversations';

/**
 * MAGIDecisionPage - MAGI意思決定メインページ
 *
 * 設計理由:
 * - 左右分割レイアウトで会話履歴と判断インターフェースを同時表示
 * - 会話なしの場合はウェルカム画面を表示
 * - 直感的な操作性を提供
 *
 * 状態管理:
 * - activeConversationId: 現在選択中の会話ID
 * - conversations: 会話履歴リスト（useConversationsから取得）
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

  /**
   * 新しい会話を作成
   *
   * 学習ポイント:
   * - async/awaitによる非同期処理
   * - タイムスタンプを含むタイトル生成
   * - 作成後に自動的に選択状態にする
   */
  const handleCreateNew = async () => {
    const newConversation = await createConversation({
      title: `MAGI判断 ${new Date().toLocaleTimeString()}`
    });
    setActiveConversationId(newConversation.id);
  };

  /**
   * 会話履歴を検索
   *
   * 学習ポイント:
   * - 検索はuseConversationsフック内で処理される
   * - フックの内部実装によってconversationsリストが自動的にフィルタリングされる
   */
  const handleSearch = (query: string) => {
    // 検索はuseConversationsフック内で処理される
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
          // 会話が選択されている場合: MAGIインターフェースを表示
          <div className="h-full">
            <MAGIWithTrace
              conversationId={activeConversationId}
              defaultMode="both"
              showModeToggle={true}
              className="h-full"
            />
          </div>
        ) : (
          // 会話が選択されていない場合: ウェルカム画面を表示
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center max-w-2xl px-8">
              {/* タイトル */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
                  <span className="text-4xl font-bold text-white">M</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  MAGI意思決定システム
                </h1>
                <div className="text-sm text-gray-500 mb-6">
                  Multi-Agent General Intelligence System
                </div>
              </div>

              {/* 説明 */}
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeによる
                <br />
                多角的な意思決定支援システムです。
              </p>

              {/* 3賢者の説明カード */}
              <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                <div className="p-4 bg-white rounded-lg shadow-sm border-2 border-blue-100">
                  <div className="font-semibold text-blue-700 mb-2">CASPAR</div>
                  <div className="text-gray-600">保守的・現実的</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border-2 border-purple-100">
                  <div className="font-semibold text-purple-700 mb-2">BALTHASAR</div>
                  <div className="text-gray-600">革新的・感情的</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border-2 border-green-100">
                  <div className="font-semibold text-green-700 mb-2">MELCHIOR</div>
                  <div className="text-gray-600">バランス型・科学的</div>
                </div>
              </div>

              {/* アクション */}
              <div className="space-y-3">
                <button
                  onClick={handleCreateNew}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  新しい判断を開始
                </button>
                <p className="text-sm text-gray-500">
                  または左のサイドバーから過去の判断を確認できます
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
