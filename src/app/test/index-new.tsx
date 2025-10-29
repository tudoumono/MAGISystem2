/**
 * Test Index Page - テストカテゴリ一覧
 * 
 * 整理されたテストページへのナビゲーション
 */

'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TestIndexPage() {
  const testCategories = [
    {
      title: 'Agent Tests',
      description: 'エージェント機能のテスト',
      href: '/test/agents',
      icon: '🤖',
      count: 1,
      color: 'blue'
    },
    {
      title: 'Data Tests',
      description: 'データ関連機能のテスト',
      href: '/test/data',
      icon: '💾',
      count: 3,
      color: 'green'
    },
    {
      title: 'Integration Tests',
      description: 'システム統合テスト',
      href: '/test/integration',
      icon: '🔗',
      count: 4,
      color: 'purple'
    },
    {
      title: 'Trace Tests',
      description: 'トレース機能のテスト',
      href: '/test/trace',
      icon: '📊',
      count: 1,
      color: 'orange'
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            MAGI System Test Suite
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            開発・テスト用ページ一覧
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testCategories.map((category) => (
            <Link key={category.href} href={category.href}>
              <Card className={`p-6 h-full hover:shadow-lg transition-shadow cursor-pointer border-2 ${getColorClasses(category.color)}`}>
                <div className="text-4xl mb-4">{category.icon}</div>
                <h2 className="text-xl font-semibold mb-2">
                  {category.title}
                </h2>
                <p className="text-sm mb-4 opacity-80">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {category.count} テスト
                  </span>
                  <span className="text-xs">→</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📋 テスト環境について
            </h3>
            <div className="text-blue-800 text-sm space-y-2">
              <p>
                このテストスイートは、MAGIシステムの各機能を個別にテストするためのページ集です。
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Agent Tests</strong>: Bedrock Agentsの基本動作</li>
                <li><strong>Data Tests</strong>: Amplifyデータモデルと会話機能</li>
                <li><strong>Integration Tests</strong>: MAGIシステム全体の統合テスト</li>
                <li><strong>Trace Tests</strong>: トレース・観測可能性機能</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
