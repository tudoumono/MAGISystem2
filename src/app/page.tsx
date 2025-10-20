/**
 * Home Page Component
 * 
 * MAGI Decision Systemのホームページコンポーネントです。
 * 現在はPhase 1の開発段階のため、システムの概要と開発状況を表示します。
 * 
 * 学習ポイント:
 * - Next.js 15のPage Component
 * - React Server Componentsの使用
 * - Tailwind CSSによるスタイリング
 * - 段階的開発アプローチの説明
 */

import Link from 'next/link';

/**
 * ホームページコンポーネント
 * 
 * 設計理由:
 * - システムの概要説明
 * - 開発フェーズの説明
 * - 各機能へのナビゲーション
 * - 学習用の詳細情報提供
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-magi-solomon-50 via-white to-magi-caspar-50">
      {/* ヘッダーセクション */}
      <header className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-magi-caspar-500/10 via-magi-balthasar-500/10 to-magi-melchior-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-magi-caspar-600 via-magi-balthasar-600 to-magi-melchior-600 bg-clip-text text-transparent">
                MAGI
              </span>{' '}
              Decision System
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              エヴァンゲリオンのMAGIシステムにインスパイアされた<br />
              3賢者による多視点分析システム
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-magi-caspar-100 text-magi-caspar-800 px-4 py-2 rounded-full text-sm font-medium">
                CASPAR - 保守的視点
              </div>
              <div className="bg-magi-balthasar-100 text-magi-balthasar-800 px-4 py-2 rounded-full text-sm font-medium">
                BALTHASAR - 革新的視点
              </div>
              <div className="bg-magi-melchior-100 text-magi-melchior-800 px-4 py-2 rounded-full text-sm font-medium">
                MELCHIOR - バランス型視点
              </div>
              <div className="bg-magi-solomon-100 text-magi-solomon-800 px-4 py-2 rounded-full text-sm font-medium">
                SOLOMON - 統括判断
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 開発フェーズ説明 */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              段階的開発アプローチ
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              フロントエンドファースト開発により、学習効果を最大化しながら段階的にシステムを構築
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Phase 1-2 */}
            <div className="magi-panel">
              <div className="magi-panel-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">
                    Phase 1-2
                  </h3>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    進行中
                  </span>
                </div>
              </div>
              <div className="magi-panel-content">
                <h4 className="font-semibold text-foreground mb-3">
                  モックデータ開発
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• UI/UXの完成</li>
                  <li>• モックデータでの動作確認</li>
                  <li>• デザインシステムの構築</li>
                  <li>• 認証システムの実装</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    学習効果: 視覚的フィードバックでモチベーション維持
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="magi-panel opacity-60">
              <div className="magi-panel-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">
                    Phase 3
                  </h3>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    予定
                  </span>
                </div>
              </div>
              <div className="magi-panel-content">
                <h4 className="font-semibold text-foreground mb-3">
                  部分統合
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Amplify Data統合</li>
                  <li>• 認証・会話履歴は実データ</li>
                  <li>• エージェントはモック継続</li>
                  <li>• リアルタイム機能の確認</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    学習効果: データ永続化の理解
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 4-6 */}
            <div className="magi-panel opacity-40">
              <div className="magi-panel-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">
                    Phase 4-6
                  </h3>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    将来
                  </span>
                </div>
              </div>
              <div className="magi-panel-content">
                <h4 className="font-semibold text-foreground mb-3">
                  完全統合
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Bedrock AgentCore統合</li>
                  <li>• Strands Agents実装</li>
                  <li>• OpenTelemetryトレーシング</li>
                  <li>• 本格的MAGIシステム</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    学習効果: 本格的なAIシステム構築
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 技術スタック */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              技術スタック
            </h2>
            <p className="text-lg text-muted-foreground">
              最新技術を活用した学習効果の高い構成
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="magi-panel text-center">
              <div className="magi-panel-content">
                <div className="text-2xl mb-3">⚛️</div>
                <h3 className="font-semibold text-foreground mb-2">Frontend</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Next.js 15</div>
                  <div>TypeScript</div>
                  <div>Tailwind CSS</div>
                  <div>React 19</div>
                </div>
              </div>
            </div>

            <div className="magi-panel text-center">
              <div className="magi-panel-content">
                <div className="text-2xl mb-3">☁️</div>
                <h3 className="font-semibold text-foreground mb-2">Backend</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>AWS Amplify</div>
                  <div>Amazon Bedrock</div>
                  <div>Strands Agents</div>
                  <div>Lambda Functions</div>
                </div>
              </div>
            </div>

            <div className="magi-panel text-center">
              <div className="magi-panel-content">
                <div className="text-2xl mb-3">🗄️</div>
                <h3 className="font-semibold text-foreground mb-2">Data</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>DynamoDB</div>
                  <div>AppSync GraphQL</div>
                  <div>Cognito Auth</div>
                  <div>Real-time Sync</div>
                </div>
              </div>
            </div>

            <div className="magi-panel text-center">
              <div className="magi-panel-content">
                <div className="text-2xl mb-3">📊</div>
                <h3 className="font-semibold text-foreground mb-2">Observability</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>OpenTelemetry</div>
                  <div>CloudWatch</div>
                  <div>X-Ray Tracing</div>
                  <div>Custom Metrics</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 機能紹介 */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              主要機能
            </h2>
            <p className="text-lg text-muted-foreground">
              3賢者による多視点分析で最適な意思決定をサポート
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="magi-panel">
              <div className="magi-panel-header">
                <h3 className="text-xl font-semibold text-foreground">
                  🤖 多エージェント分析
                </h3>
              </div>
              <div className="magi-panel-content">
                <p className="text-muted-foreground mb-4">
                  3賢者（CASPAR、BALTHASAR、MELCHIOR）がそれぞれ異なる視点から分析を実行。
                  SOLOMON Judgeが統合評価を行い、最終的な可決/否決を判断します。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-magi-caspar-500 rounded-full mr-3"></div>
                    <span>CASPAR: 保守的・リスク重視の分析</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-magi-balthasar-500 rounded-full mr-3"></div>
                    <span>BALTHASAR: 革新的・創造性重視の分析</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-magi-melchior-500 rounded-full mr-3"></div>
                    <span>MELCHIOR: バランス型・論理性重視の分析</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="magi-panel">
              <div className="magi-panel-header">
                <h3 className="text-xl font-semibold text-foreground">
                  📊 リアルタイムトレーシング
                </h3>
              </div>
              <div className="magi-panel-content">
                <p className="text-muted-foreground mb-4">
                  エージェントの推論過程をリアルタイムで可視化。
                  OpenTelemetryによる詳細なトレーシングで透明性を確保します。
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 実行ステップの詳細表示</li>
                  <li>• 使用ツールと引用の記録</li>
                  <li>• パフォーマンス監視</li>
                  <li>• エラー追跡と分析</li>
                </ul>
              </div>
            </div>

            <div className="magi-panel">
              <div className="magi-panel-header">
                <h3 className="text-xl font-semibold text-foreground">
                  💬 会話履歴管理
                </h3>
              </div>
              <div className="magi-panel-content">
                <p className="text-muted-foreground mb-4">
                  過去の質問と判断結果を整理して保存。
                  検索機能により必要な情報を素早く参照できます。
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 会話スレッドの管理</li>
                  <li>• 全文検索機能</li>
                  <li>• 判断履歴の分析</li>
                  <li>• エクスポート機能</li>
                </ul>
              </div>
            </div>

            <div className="magi-panel">
              <div className="magi-panel-header">
                <h3 className="text-xl font-semibold text-foreground">
                  ⚙️ 柔軟な設定管理
                </h3>
              </div>
              <div className="magi-panel-content">
                <p className="text-muted-foreground mb-4">
                  エージェントの設定をカスタマイズ可能。
                  プリセット機能により異なるシナリオに対応します。
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• エージェント個別設定</li>
                  <li>• プリセット管理</li>
                  <li>• モデル選択</li>
                  <li>• パラメータ調整</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* アクションボタン */}
        <section className="text-center">
          <div className="magi-panel max-w-2xl mx-auto">
            <div className="magi-panel-content py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                開発を始めましょう
              </h2>
              <p className="text-muted-foreground mb-8">
                Phase 1の実装が完了しました。次のステップに進んで、
                実際のエージェント機能を体験してみましょう。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors focus-visible-ring"
                >
                  ダッシュボードを開く
                </Link>
                <Link
                  href="/demo"
                  className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors focus-visible-ring"
                >
                  デモを試す
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t border-border bg-muted/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              MAGI Decision System - Phase 1 Implementation
            </p>
            <p className="mt-2">
              Built with Next.js 15, TypeScript, Tailwind CSS, and AWS Amplify
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}