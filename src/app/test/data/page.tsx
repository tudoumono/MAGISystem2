/**
 * Data Tests Index Page
 * 
 * データ関連のテストページ一覧
 */

'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DataTestsPage() {
  const tests = [
    {
      title: 'Amplify Models',
      description: 'Amplify Data Modelの動作確認',
      href: '/test/data/amplify-models',
      category: 'Data'
    },
    {
      title: 'Conversation',
      description: '会話機能のテスト',
      href: '/test/data/conversation',
      category: 'Data'
    },
    {
      title: 'Models Check',
      description: 'データモデルの整合性チェック',
      href: '/test/data/models-check',
      category: 'Data'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Data Tests
        </h1>
        <p className="text-gray-600">
          データ関連機能のテストページ一覧
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.href} className="p-6">
            <div className="mb-4">
              <span className="inline-block px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded">
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
