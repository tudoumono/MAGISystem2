/**
 * MAGI Stream Test Page - ストリーミング対応MAGIシステムテストページ
 * 
 * このページはストリーミング対応MAGIシステムの動作確認用です。
 * 開発中の機能テストとデモンストレーションに使用します。
 * 
 * 主要機能:
 * - ストリーミングMAGIシステムのテスト
 * - リアルタイム応答の確認
 * - エラーハンドリングの検証
 * 
 * 学習ポイント:
 * - ストリーミングUIの実装
 * - リアルタイム状態管理
 * - エラーハンドリング
 */

'use client';

import React from 'react';
import { MAGIStreamInterface } from '@/components/agents/MAGIStreamInterface';
import { Card } from '@/components/ui/Card';

export default function MAGIStreamTestPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* ページヘッダー */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        MAGI Decision System
                    </h1>
                    <p className="text-gray-600">
                        ストリーミング対応 - 3賢者による多視点分析システム
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                        エヴァンゲリオンのMAGIシステムにインスパイアされた意思決定支援AI
                    </div>
                </div>

                {/* システム説明 */}
                <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        MAGIシステムについて
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="p-3 bg-white rounded border border-blue-100">
                            <h3 className="font-medium text-blue-800 mb-2">CASPAR（カスパー）</h3>
                            <p className="text-gray-600">保守的・現実的な視点で実行可能性を重視した分析を行います</p>
                        </div>
                        <div className="p-3 bg-white rounded border border-purple-100">
                            <h3 className="font-medium text-purple-800 mb-2">BALTHASAR（バルタザール）</h3>
                            <p className="text-gray-600">革新的・感情的な視点で倫理と創造性を考慮した分析を行います</p>
                        </div>
                        <div className="p-3 bg-white rounded border border-green-100">
                            <h3 className="font-medium text-green-800 mb-2">MELCHIOR（メルキオール）</h3>
                            <p className="text-gray-600">バランス型・科学的な視点でデータと論理に基づいた分析を行います</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded border border-orange-200">
                        <h3 className="font-medium text-orange-800 mb-2">SOLOMON Judge（ソロモン審判）</h3>
                        <p className="text-gray-600">3賢者の判断を統合し、最終的な意思決定支援を行います</p>
                    </div>
                </Card>

                {/* ストリーミングMAGIインターフェース */}
                <MAGIStreamInterface
                    initialQuestion="AIの倫理的課題について教えてください"
                    className="mb-8"
                />

                {/* 技術情報 */}
                <Card className="p-6 bg-gray-50 border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        技術仕様
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h3 className="font-medium text-gray-800 mb-2">フロントエンド</h3>
                            <ul className="space-y-1 text-gray-600">
                                <li>• Next.js 15 + TypeScript</li>
                                <li>• Server-Sent Events (SSE)</li>
                                <li>• React Hooks (useMAGIStream)</li>
                                <li>• Tailwind CSS</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-800 mb-2">バックエンド</h3>
                            <ul className="space-y-1 text-gray-600">
                                <li>• Next.js API Routes</li>
                                <li>• AWS Bedrock Agent Runtime</li>
                                <li>• AgentCore Runtime</li>
                                <li>• Strands Agents Framework</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <h4 className="font-medium text-yellow-800 mb-1">開発モード</h4>
                        <p className="text-yellow-700 text-sm">
                            現在はモックモードで動作しています。実際のAWS Bedrock Agent Runtimeに接続するには、
                            環境変数でAWS認証情報を設定してください。
                        </p>
                    </div>
                </Card>

                {/* フッター */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>
                        MAGI Decision System - Inspired by Neon Genesis Evangelion
                    </p>
                    <p className="mt-1">
                        Built with Next.js, AWS Bedrock, and AgentCore Runtime
                    </p>
                </div>
            </div>
        </div>
    );
}