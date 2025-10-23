/**
 * MAGI with Trace Test Page - MAGI統合トレースのテストページ
 * 
 * このページはMAGI意思決定システムとリアルタイムトレース可視化の
 * 統合コンポーネントをテストするためのページです。
 * 
 * 機能:
 * - MAGI意思決定システムの実行
 * - リアルタイムトレース可視化
 * - 表示モードの切り替え
 * - 様々なシナリオでのテスト
 * 
 * 学習ポイント:
 * - 統合コンポーネントの使用方法
 * - リアルタイム更新の動作確認
 * - ユーザーインタラクションのテスト
 */

'use client';

import React from 'react';
import MAGIWithTrace from '@/components/agents/MAGIWithTrace';

/**
 * MAGITraceTestPage - MAGI統合トレースのテストページ
 */
export default function MAGITraceTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            MAGI統合トレーステスト
          </h1>
          <p className="mt-2 text-gray-600">
            MAGI意思決定システムとリアルタイムトレース可視化の統合テスト
          </p>
        </div>

        {/* メインコンポーネント */}
        <MAGIWithTrace
          defaultMode="both"
          showModeToggle={true}
          className="mb-8"
        />

        {/* テスト用の質問例 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            テスト用質問例
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">ビジネス判断</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 新しいAIシステムを導入すべきでしょうか？</li>
                <li>• リモートワーク制度を拡充すべきですか？</li>
                <li>• 新製品の開発プロジェクトを承認すべきか？</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">技術判断</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• マイクロサービスアーキテクチャに移行すべきか？</li>
                <li>• セキュリティ対策を強化する必要がありますか？</li>
                <li>• クラウドネイティブ技術を採用すべきでしょうか？</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 機能説明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            統合機能の特徴
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                リアルタイム可視化
              </h3>
              <p className="text-sm text-blue-700">
                MAGI実行中の推論過程をリアルタイムで可視化し、
                各エージェントの思考プロセスを段階的に表示します。
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                統合インターフェース
              </h3>
              <p className="text-sm text-blue-700">
                意思決定結果とトレース情報を統合表示し、
                判断の根拠と過程を同時に確認できます。
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                柔軟な表示モード
              </h3>
              <p className="text-sm text-blue-700">
                MAGI結果のみ、トレースのみ、両方表示の
                3つのモードを切り替えて最適な表示を選択できます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}