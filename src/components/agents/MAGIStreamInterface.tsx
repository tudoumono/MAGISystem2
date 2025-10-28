/**
 * MAGIStreamInterface - ストリーミング対応MAGIシステムインターフェース
 * 
 * このコンポーネントは既存のMAGISystemInterfaceをベースに、
 * リアルタイムストリーミング機能を追加したバージョンです。
 * 
 * 主要機能:
 * - リアルタイムストリーミング表示
 * - 段階的レスポンス表示
 * - エヴァンゲリオン風UIデザイン
 * - ストリーミング進行状況の可視化
 * 
 * 学習ポイント:
 * - ストリーミングUIパターン
 * - リアルタイム状態管理
 * - 段階的コンテンツ表示
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useMAGIStream } from '@/hooks/useMAGIStream';
import { StreamMessage } from '@/lib/agents/stream-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// =============================================================================
// Component Props Interface
// =============================================================================

interface MAGIStreamInterfaceProps {
  /** 初期質問 */
  initialQuestion?: string;
  /** クラス名の追加 */
  className?: string;
}

// =============================================================================
// Streaming Progress Component
// =============================================================================

/**
 * ストリーミング進行状況表示コンポーネント
 */
const StreamingProgress: React.FC<{
  isStreaming: boolean;
  messages: StreamMessage[];
  currentMessage: string;
}> = ({ isStreaming, messages, currentMessage }) => {
  const [systemPulse, setSystemPulse] = useState(false);
  
  React.useEffect(() => {
    const pulseTimer = setInterval(() => {
      setSystemPulse(prev => !prev);
    }, 1500);
    
    return () => clearInterval(pulseTimer);
  }, []);

  if (!isStreaming && messages.length === 0) {
    return null;
  }

  return (
    <Card className={`p-6 bg-gradient-to-br from-blue-900 to-purple-900 text-white transition-all duration-500 ${
      systemPulse ? 'shadow-2xl shadow-blue-500/20' : 'shadow-xl'
    }`}>
      {/* システムヘッダー */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            isStreaming ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          }`}></div>
          <h2 className="text-2xl font-bold">
            {isStreaming ? 'MAGI SYSTEM ACTIVE' : 'MAGI SYSTEM COMPLETE'}
          </h2>
          <div className={`w-3 h-3 rounded-full ${
            isStreaming ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          }`}></div>
        </div>
      </div>

      {/* ストリーミングメッセージ表示 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
            {/* フェーズ表示 */}
            {message.type === 'phase' && (
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-orange-200 font-medium text-sm">{message.content}</span>
                </div>
              </div>
            )}
            
            {/* システムメッセージ */}
            {message.type === 'system' && (
              <div className="text-center text-blue-200 text-sm">
                <div className="inline-flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  {message.content}
                </div>
              </div>
            )}
            
            {/* エージェント開始 */}
            {message.type === 'agent_start' && (
              <div className="p-3 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {message.agentId?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-blue-200 text-sm">{message.content}</div>
                </div>
              </div>
            )}
            
            {/* エージェント思考中 */}
            {message.type === 'agent_thinking' && (
              <div className="p-2 bg-black/20 rounded border border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  {message.content}
                </div>
              </div>
            )}
            
            {/* エージェント応答チャンク */}
            {message.type === 'agent_chunk' && message.content && (
              <div className="p-3 bg-black/30 rounded border border-white/10">
                <div className="text-blue-100 text-sm whitespace-pre-line leading-relaxed">
                  {message.content}
                </div>
              </div>
            )}
            
            {/* エージェント完了 */}
            {message.type === 'agent_complete' && (
              <div className="p-3 bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded border border-green-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                  <div className="text-green-200 text-sm">{message.content}</div>
                </div>
              </div>
            )}
            
            {/* Judge思考中 */}
            {message.type === 'judge_thinking' && (
              <div className="p-3 bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded border border-orange-500/30">
                <div className="flex items-center gap-3">
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 border-2 border-orange-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="text-orange-200 text-sm">{message.content}</div>
                </div>
              </div>
            )}
            
            {/* Judge応答チャンク */}
            {message.type === 'judge_chunk' && message.content && (
              <div className="p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg border border-orange-500/30">
                <div className="text-orange-100 text-sm whitespace-pre-line leading-relaxed">
                  {message.content}
                </div>
              </div>
            )}
            
            {/* 注記 */}
            {message.type === 'note' && (
              <div className="p-3 bg-yellow-900/30 rounded border border-yellow-500/30">
                <div className="text-yellow-200 text-xs">{message.content}</div>
              </div>
            )}
            
            {/* 完了 */}
            {message.type === 'complete' && (
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 text-green-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">{message.content}</span>
                </div>
              </div>
            )}
            
            {/* エラー */}
            {message.type === 'error' && (
              <div className="text-center text-red-200 text-sm">
                <div className="inline-flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  エラー: {message.error}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* 現在のストリーミング内容 */}
        {isStreaming && currentMessage && (
          <div className="p-4 bg-black/30 rounded-lg border border-orange-500/30">
            <div className="flex items-start gap-3">
              <div className="flex gap-1 mt-2">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <div className="flex-1 whitespace-pre-line text-orange-100 leading-relaxed">
                {currentMessage}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// =============================================================================
// Question Input Component
// =============================================================================

/**
 * 質問入力コンポーネント
 */
const QuestionInput: React.FC<{
  onSubmit: (question: string) => void;
  disabled: boolean;
  initialValue?: string;
}> = ({ onSubmit, disabled, initialValue = '' }) => {
  const [question, setQuestion] = useState(initialValue);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !disabled) {
      onSubmit(question.trim());
    }
  }, [question, disabled, onSubmit]);

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            MAGIシステムへの質問
          </label>
          <Input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="AIの倫理的課題について教えてください"
            disabled={disabled}
            className="w-full"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            3賢者（CASPAR、BALTHASAR、MELCHIOR）とSOLOMON Judgeが分析します
          </div>
          <Button
            type="submit"
            disabled={disabled || !question.trim()}
            className="min-w-[120px]"
          >
            {disabled ? '分析中...' : 'MAGI実行'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

// =============================================================================
// Response Display Component
// =============================================================================

/**
 * レスポンス表示コンポーネント
 */
const ResponseDisplay: React.FC<{
  messages: StreamMessage[];
  isComplete: boolean;
}> = ({ messages, isComplete }) => {
  const mockMessage = messages.find(msg => msg.type === 'mock');
  
  if (!mockMessage?.content && !isComplete) {
    return null;
  }

  const content = mockMessage?.content || '';
  
  // コンテンツを各エージェントのセクションに分割
  const sections = content.split(/【([^】]+)】/).filter(Boolean);
  const parsedSections: { title: string; content: string }[] = [];
  
  for (let i = 0; i < sections.length; i += 2) {
    if (sections[i] && sections[i + 1]) {
      parsedSections.push({
        title: sections[i],
        content: sections[i + 1].trim()
      });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">MAGI分析結果</h2>
      
      {parsedSections.map((section, index) => {
        const isSOLOMON = section.title.includes('SOLOMON');
        const isCASPAR = section.title.includes('CASPAR');
        const isBALTHASAR = section.title.includes('BALTHASAR');
        const isMELCHIOR = section.title.includes('MELCHIOR');
        
        let bgColor = 'bg-gray-50';
        let borderColor = 'border-gray-200';
        let titleColor = 'text-gray-800';
        
        if (isSOLOMON) {
          bgColor = 'bg-gradient-to-br from-orange-50 to-red-50';
          borderColor = 'border-orange-200';
          titleColor = 'text-orange-800';
        } else if (isCASPAR) {
          bgColor = 'bg-blue-50';
          borderColor = 'border-blue-200';
          titleColor = 'text-blue-800';
        } else if (isBALTHASAR) {
          bgColor = 'bg-purple-50';
          borderColor = 'border-purple-200';
          titleColor = 'text-purple-800';
        } else if (isMELCHIOR) {
          bgColor = 'bg-green-50';
          borderColor = 'border-green-200';
          titleColor = 'text-green-800';
        }
        
        return (
          <Card 
            key={index} 
            className={`p-6 ${bgColor} ${borderColor} animate-fadeIn`}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <h3 className={`text-lg font-semibold ${titleColor} mb-3`}>
              {section.title}
            </h3>
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {section.content}
            </div>
          </Card>
        );
      })}
      
      {isComplete && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">MAGI分析完了</span>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * MAGIStreamInterface メインコンポーネント
 */
export const MAGIStreamInterface: React.FC<MAGIStreamInterfaceProps> = ({
  initialQuestion = '',
  className = '',
}) => {
  // ストリーミングフック
  const {
    streamState,
    messages,
    startStream,
    abortStream,
    clearMessages,
  } = useMAGIStream({
    onComplete: (response) => {
      console.log('MAGI分析完了:', response);
    },
    onError: (error) => {
      console.error('MAGIエラー:', error);
    },
  });

  // 質問送信ハンドラー
  const handleQuestionSubmit = useCallback(async (question: string) => {
    clearMessages();
    await startStream(question);
  }, [startStream, clearMessages]);

  // 新しい質問ハンドラー
  const handleNewQuestion = useCallback(() => {
    if (streamState.isStreaming) {
      abortStream();
    }
    clearMessages();
  }, [streamState.isStreaming, abortStream, clearMessages]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 質問入力 */}
      <QuestionInput
        onSubmit={handleQuestionSubmit}
        disabled={streamState.isStreaming}
        initialValue={initialQuestion}
      />

      {/* エラー表示 */}
      {streamState.error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">!</span>
            </div>
            <div>
              <h3 className="font-semibold text-red-800">エラーが発生しました</h3>
              <p className="text-red-600 text-sm">{streamState.error.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ストリーミング進行状況 */}
      <StreamingProgress
        isStreaming={streamState.isStreaming}
        messages={messages}
        currentMessage={streamState.currentMessage}
      />

      {/* レスポンス表示 */}
      {(messages.length > 0 || streamState.isComplete) && (
        <ResponseDisplay
          messages={messages}
          isComplete={streamState.isComplete}
        />
      )}

      {/* アクションボタン */}
      {(streamState.isStreaming || streamState.isComplete) && (
        <Card className="p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {streamState.isStreaming ? 'MAGI分析実行中...' : 'MAGI分析完了'}
            </div>
            <div className="flex gap-2">
              {streamState.isStreaming && (
                <Button variant="secondary" size="sm" onClick={abortStream}>
                  中断
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleNewQuestion}>
                新しい質問
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// =============================================================================
// Export
// =============================================================================

export default MAGIStreamInterface;