/**
 * MAGI Boot Sequence - エヴァンゲリオン風起動シーケンス
 *
 * このコンポーネントはMAGIシステムの起動プロセスを視覚化します。
 * エヴァンゲリオンのMAGI起動シーンにインスパイアされた演出を提供します。
 *
 * 主要機能:
 * - 段階的な起動アニメーション
 * - 3賢者の順次起動表示
 * - ネオンエフェクトとグローイング
 * - Framer Motionによる滑らかなアニメーション
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 起動フェーズの定義
 */
type BootPhase =
  | 'initializing'      // システム初期化
  | 'loading_caspar'    // CASPAR起動
  | 'loading_balthasar' // BALTHASAR起動
  | 'loading_melchior'  // MELCHIOR起動
  | 'loading_solomon'   // SOLOMON起動
  | 'synchronizing'     // システム同期
  | 'ready';            // 起動完了

interface MAGIBootSequenceProps {
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
}

/**
 * 起動ログメッセージの型
 */
interface BootLog {
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'warning';
}

export const MAGIBootSequence: React.FC<MAGIBootSequenceProps> = ({
  onComplete,
  autoStart = true,
  className = ''
}) => {
  const [phase, setPhase] = useState<BootPhase>('initializing');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<BootLog[]>([]);
  const [casparStatus, setCasparStatus] = useState<'idle' | 'booting' | 'ready'>('idle');
  const [balthasarStatus, setBalthasarStatus] = useState<'idle' | 'booting' | 'ready'>('idle');
  const [melchiorStatus, setMelchiorStatus] = useState<'idle' | 'booting' | 'ready'>('idle');
  const [solomonStatus, setSolomonStatus] = useState<'idle' | 'booting' | 'ready'>('idle');

  /**
   * ログを追加するヘルパー関数
   */
  const addLog = (message: string, level: BootLog['level'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString('ja-JP', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    } as any);
    setLogs(prev => [...prev, { timestamp, message, level }]);
  };

  /**
   * 起動シーケンスの実行
   */
  useEffect(() => {
    if (!autoStart) return;

    const runBootSequence = async () => {
      // Phase 1: システム初期化
      setPhase('initializing');
      setProgress(0);
      addLog('MAGI SYSTEM INITIALIZATION...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('Core systems: OK', 'success');
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog('Memory allocation: OK', 'success');
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog('Network connection: OK', 'success');
      setProgress(15);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Phase 2: CASPAR起動
      setPhase('loading_caspar');
      setCasparStatus('booting');
      addLog('CASPAR INITIALIZATION...', 'info');
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog('CASPAR: Scientific database loaded', 'success');
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog('CASPAR: Logic engine activated', 'success');
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog('CASPAR: READY', 'success');
      setCasparStatus('ready');
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 3: BALTHASAR起動
      setPhase('loading_balthasar');
      setBalthasarStatus('booting');
      addLog('BALTHASAR INITIALIZATION...', 'info');
      setProgress(45);
      await new Promise(resolve => setTimeout(resolve, 1100));
      addLog('BALTHASAR: Emotional matrix loaded', 'success');
      await new Promise(resolve => setTimeout(resolve, 700));
      addLog('BALTHASAR: Creative engine activated', 'success');
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog('BALTHASAR: READY', 'success');
      setBalthasarStatus('ready');
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 4: MELCHIOR起動
      setPhase('loading_melchior');
      setMelchiorStatus('booting');
      addLog('MELCHIOR INITIALIZATION...', 'info');
      setProgress(65);
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('MELCHIOR: Balanced reasoning loaded', 'success');
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog('MELCHIOR: Synthesis engine activated', 'success');
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog('MELCHIOR: READY', 'success');
      setMelchiorStatus('ready');
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 5: SOLOMON起動
      setPhase('loading_solomon');
      setSolomonStatus('booting');
      addLog('SOLOMON JUDGE INITIALIZATION...', 'info');
      setProgress(85);
      await new Promise(resolve => setTimeout(resolve, 1200));
      addLog('SOLOMON: Voting system loaded', 'success');
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog('SOLOMON: Decision engine activated', 'success');
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog('SOLOMON: READY', 'success');
      setSolomonStatus('ready');
      setProgress(95);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 6: システム同期
      setPhase('synchronizing');
      addLog('SYSTEM SYNCHRONIZATION...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('Agents synchronized', 'success');
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog('Communication protocols established', 'success');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 800));

      // 起動完了
      setPhase('ready');
      addLog('MAGI SYSTEM READY', 'success');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onComplete) {
        onComplete();
      }
    };

    runBootSequence();
  }, [autoStart, onComplete]);

  /**
   * エージェントステータスインジケーター
   */
  const AgentStatus: React.FC<{
    name: string;
    status: 'idle' | 'booting' | 'ready';
    color: string;
    neonColor: string;
    delay: number;
  }> = ({ name, status, color, neonColor, delay }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-center gap-4 p-4 glass-dark rounded-xl border border-white/10"
    >
      <div className="relative">
        <motion.div
          className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-2xl`}
          style={{
            boxShadow: status === 'ready'
              ? `0 0 20px ${neonColor}, 0 0 40px ${neonColor}`
              : 'none'
          }}
          animate={status === 'booting' ? {
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          } : {}}
          transition={{ duration: 1.5, repeat: status === 'booting' ? Infinity : 0 }}
        >
          {name[0]}
        </motion.div>
        {status === 'booting' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/50"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <div className="flex-1">
        <div className="font-bold text-white text-lg">{name}</div>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          {status === 'idle' && (
            <span className="text-gray-500">待機中...</span>
          )}
          {status === 'booting' && (
            <>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-yellow-400"
              >
                起動中...
              </motion.span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"
              />
            </>
          )}
          {status === 'ready' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-green-400 flex items-center gap-1"
            >
              <span className="text-xl">✓</span> READY
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-8 ${className}`}>
      {/* 背景グリッド */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d9ff08_1px,transparent_1px),linear-gradient(to_bottom,#00d9ff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-6xl"
      >
        {/* ヘッダー */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-magi-caspar-neon via-magi-melchior-neon to-magi-balthasar-neon bg-clip-text text-transparent">
            MAGI SYSTEM
          </h1>
          <p className="text-xl text-gray-400">Multi-Agent General Intelligence</p>
        </motion.div>

        {/* プログレスバー */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>起動進捗</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-magi-caspar-neon via-magi-melchior-neon to-magi-balthasar-neon"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* エージェントステータス */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">システムステータス</h2>
            <AgentStatus
              name="CASPAR"
              status={casparStatus}
              color="from-magi-caspar-500 to-magi-caspar-700"
              neonColor="rgba(0, 217, 255, 0.5)"
              delay={0.5}
            />
            <AgentStatus
              name="BALTHASAR"
              status={balthasarStatus}
              color="from-magi-balthasar-500 to-magi-balthasar-700"
              neonColor="rgba(255, 0, 128, 0.5)"
              delay={0.6}
            />
            <AgentStatus
              name="MELCHIOR"
              status={melchiorStatus}
              color="from-magi-melchior-500 to-magi-melchior-700"
              neonColor="rgba(0, 255, 159, 0.5)"
              delay={0.7}
            />
            <AgentStatus
              name="SOLOMON"
              status={solomonStatus}
              color="from-magi-solomon-500 to-magi-solomon-700"
              neonColor="rgba(191, 64, 255, 0.5)"
              delay={0.8}
            />
          </div>

          {/* ブートログ */}
          <div className="glass-dark rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">System Log</h2>
            <div className="h-96 overflow-y-auto space-y-1 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${
                      log.level === 'success' ? 'text-green-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}
                  >
                    <span className="text-gray-600">[{log.timestamp}]</span>
                    <span>{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 完了メッセージ */}
        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-3 glass-dark px-8 py-4 rounded-full border-2 neon-border-solomon">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-3xl"
              >
                ✓
              </motion.span>
              <span className="text-2xl font-bold neon-solomon">SYSTEM READY</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MAGIBootSequence;
