/**
 * WebSocket Service - トレース用WebSocket接続管理
 * 
 * このサービスはトレース更新用のWebSocket接続を管理します。
 * 接続の確立、メッセージの送受信、エラーハンドリング、
 * 自動再接続機能を提供します。
 * 
 * 設計理由:
 * - WebSocket接続の一元管理
 * - 複数コンポーネント間での接続共有
 * - エラーハンドリングと再接続の自動化
 * - 型安全なメッセージ処理
 * 
 * 学習ポイント:
 * - Singleton パターンによるサービス管理
 * - EventEmitter パターンによるイベント通知
 * - WebSocket ライフサイクル管理
 * - TypeScript での型安全な実装
 */

import { TraceStep } from '@/types/domain';
import { 
  WebSocketMessageType,
  TraceStepUpdateMessage,
  AgentStatusUpdateMessage,
  ExecutionCompleteMessage,
  ErrorMessage,
  isTraceStepUpdateMessage,
  isAgentStatusUpdateMessage,
  isExecutionCompleteMessage,
  isErrorMessage
} from '@/types/api';

/**
 * WebSocket接続状態
 */
export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * イベントタイプの定義
 */
interface WebSocketEvents {
  'status-change': WebSocketStatus;
  'trace-step': TraceStepUpdateMessage;
  'agent-status': AgentStatusUpdateMessage;
  'execution-complete': ExecutionCompleteMessage;
  'error': ErrorMessage;
  'connection-error': string;
}

/**
 * イベントリスナーの型定義
 */
type EventListener<T = any> = (data: T) => void;

/**
 * WebSocket設定
 */
interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001/trace',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
};

/**
 * TraceWebSocketService - トレース用WebSocket接続サービス
 * 
 * 機能:
 * - WebSocket接続の確立と管理
 * - メッセージの送受信
 * - 自動再接続
 * - イベントベースの通知
 * - 接続状態の管理
 * 
 * 使用例:
 * ```typescript
 * const service = TraceWebSocketService.getInstance();
 * service.on('trace-step', (message) => {
 *   console.log('New trace step:', message.step);
 * });
 * service.connect();
 * service.startTrace('trace-123');
 * ```
 */
export class TraceWebSocketService {
  private static instance: TraceWebSocketService | null = null;
  
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private status: WebSocketStatus = 'disconnected';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private listeners: Map<keyof WebSocketEvents, EventListener[]> = new Map();

  /**
   * プライベートコンストラクタ（Singleton パターン）
   */
  private constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * インスタンスの取得（Singleton パターン）
   */
  public static getInstance(config?: Partial<WebSocketConfig>): TraceWebSocketService {
    if (!TraceWebSocketService.instance) {
      TraceWebSocketService.instance = new TraceWebSocketService(config);
    }
    return TraceWebSocketService.instance;
  }

  /**
   * イベントリスナーの追加
   */
  public on<K extends keyof WebSocketEvents>(
    event: K,
    listener: EventListener<WebSocketEvents[K]>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  /**
   * イベントリスナーの削除
   */
  public off<K extends keyof WebSocketEvents>(
    event: K,
    listener: EventListener<WebSocketEvents[K]>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * イベントの発火
   */
  private emit<K extends keyof WebSocketEvents>(
    event: K,
    data: WebSocketEvents[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 接続状態の取得
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * WebSocket接続の確立
   */
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.setStatus('error');
      this.emit('connection-error', 'WebSocket接続の作成に失敗しました');
    }
  }

  /**
   * WebSocket接続の切断
   */
  public disconnect(): void {
    this.clearReconnectTimeout();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * トレース開始メッセージの送信
   */
  public startTrace(traceId: string): void {
    this.sendMessage({
      type: 'start_trace',
      traceId,
      timestamp: new Date()
    });
  }

  /**
   * トレース停止メッセージの送信
   */
  public stopTrace(traceId: string): void {
    this.sendMessage({
      type: 'stop_trace',
      traceId,
      timestamp: new Date()
    });
  }

  /**
   * メッセージの送信
   */
  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  /**
   * 接続状態の設定
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('status-change', status);
    }
  }

  /**
   * WebSocket接続開始時の処理
   */
  private handleOpen(): void {
    console.log('WebSocket connected to:', this.config.url);
    this.setStatus('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }

  /**
   * WebSocketメッセージ受信時の処理
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // pongメッセージの処理
      if (data.type === 'pong') {
        return;
      }

      // メッセージタイプの検証
      if (!data.type || !data.timestamp) {
        console.warn('Invalid WebSocket message format:', data);
        return;
      }

      const message = data as WebSocketMessageType;

      // メッセージタイプに応じた処理
      if (isTraceStepUpdateMessage(message)) {
        this.emit('trace-step', message);
      } else if (isAgentStatusUpdateMessage(message)) {
        this.emit('agent-status', message);
      } else if (isExecutionCompleteMessage(message)) {
        this.emit('execution-complete', message);
      } else if (isErrorMessage(message)) {
        this.emit('error', message);
      } else {
        console.warn('Unknown message type:', (message as any).type);
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit('connection-error', 'メッセージの解析に失敗しました');
    }
  }

  /**
   * WebSocket接続終了時の処理
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.setStatus('disconnected');
    this.stopHeartbeat();

    // 自動再接続（意図的な切断でない場合）
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * WebSocketエラー時の処理
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.setStatus('error');
    this.emit('connection-error', 'WebSocket接続エラーが発生しました');
  }

  /**
   * 再接続のスケジュール
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimeout();
    this.reconnectAttempts++;

    console.log(
      `Reconnecting in ${this.config.reconnectInterval}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * 再接続タイムアウトのクリア
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * ハートビートの開始
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping', timestamp: new Date() });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * ハートビートの停止
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * サービスの破棄
   */
  public destroy(): void {
    this.disconnect();
    this.listeners.clear();
    TraceWebSocketService.instance = null;
  }
}

/**
 * デフォルトインスタンスのエクスポート
 */
export const traceWebSocketService = TraceWebSocketService.getInstance();