/**
 * Integration Tests Index Page
 * 
 * 統合テストページ一覧
 */

'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function IntegrationTestsPage() {
  const tests = [
    {
      title: 'MAGI Production',
      description: '本番環境でのMAGIシステム統合テスト',
      href: '/test/integration/magi-production',
      category: 'Production',
      status: 'Active'
    },
    {
      title: 'MAGI Stream',
      description: 'MAGIストリーミングAPIのテスト',
      href: '/test/integration/magi-stream',
      category: 'Streaming',
      status: 'Active'
    },
    {
      title: 'MAGI Trace',
      description: 'MAGIトレース機能の統合テスト',
      href: '/test/integration/magi-trace',
      category: 'Tracing',
      status: 'Active'
    },
    {
      title: 'Production Test',
      description: '本番環境の総合テスト',
      href: '/test/integration/production',
      category: 'Production',
      status: 'Active'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Integration Tests
        </h1>
        <p className="text-gray-600">
          システム統合テストページ一覧
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.href} className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-block px-2 py-1 text-xs font-semibold text-purple-600 bg-purple-100 rounded">
                {test.category}
              </span>
              <span className="inline-block px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded">
                {test.status}
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
