/**
 * Agent Tests Index Page
 * 
 * エージェント関連のテストページ一覧
 */

'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AgentTestsPage() {
  const tests = [
    {
      title: 'Bedrock Agents',
      description: 'Amazon Bedrock Agentsの基本的な動作テスト',
      href: '/test/agents',
      category: 'Basic'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ナビゲーションリンク */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            ダッシュボード
          </Link>
          <span>/</span>
          <Link href="/test" className="hover:text-blue-600 transition-colors">
            テスト一覧
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">エージェントテスト</span>
        </div>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Agent Tests
        </h1>
        <p className="text-gray-600">
          エージェント機能のテストページ一覧
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.href} className="p-6">
            <div className="mb-4">
              <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded">
                {test.category}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {test.title}
            </h2>
            <p className="text-gray-600 mb-4">
              {test.description}
            </p>
            <Link href={test.href}>
              <Button variant="outline" className="w-full">
                テストを開く
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/test">
          <Button variant="outline">
            ← テスト一覧に戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
