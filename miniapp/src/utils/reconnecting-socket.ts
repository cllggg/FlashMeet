// 仅在 H5/非 mp 端使用 socket.io-client
// 微信小程序没有原生 socket.io 兼容层，应使用 wx.connectSocket + 自建协议
import type { Socket } from 'socket.io-client';

export interface ReconnectOptions {
  /** 初始退避时间（ms） */
  baseDelayMs?: number;
  /** 退避时间上限（ms） */
  maxDelayMs?: number;
  /** 随机抖动比例（0~1） */
  jitter?: number;
  /** 最多重试次数，0 表示无限 */
  maxRetries?: number;
}

/**
 * 带指数退避的 socket.io 客户端封装（仅 H5）
 *
 * 断线时按 base * 2^n 退避，加上随机抖动避免雷击群。
 * 退避到 maxDelayMs 后稳定。
 */
export class ReconnectingSocket {
  private socket: Socket | null = null;
  private retryCount = 0;
  private explicitDisconnect = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private statusListeners: Array<(s: 'connecting' | 'open' | 'closed') => void> = [];
  private currentUrl = '';
  private currentQuery: Record<string, any> = {};

  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly jitter: number;
  private readonly maxRetries: number;

  constructor(opts: ReconnectOptions = {}) {
    this.baseDelayMs = opts.baseDelayMs ?? 500;
    this.maxDelayMs = opts.maxDelayMs ?? 30_000;
    this.jitter = opts.jitter ?? 0.3;
    this.maxRetries = opts.maxRetries ?? 0;
  }

  async connect(url: string, query: Record<string, any>): Promise<Socket | null> {
    this.explicitDisconnect = false;
    this.currentUrl = url;
    this.currentQuery = query;
    this.notifyStatus('connecting');

    // 微信小程序没有 socket.io-client
    // #ifdef MP-WEIXIN
    return null;
    // #endif

    // #ifndef MP-WEIXIN
    const { io } = await import('socket.io-client');
    const sock = io(url, {
      transports: ['websocket', 'polling'],
      query,
      reconnection: false,
      timeout: 10_000,
    });
    this.socket = sock;

    sock.on('connect', () => {
      this.retryCount = 0;
      this.notifyStatus('open');
    });

    sock.on('disconnect', () => {
      this.notifyStatus('closed');
      if (this.explicitDisconnect) return;
      if (this.maxRetries > 0 && this.retryCount >= this.maxRetries) return;
      this.scheduleReconnect();
    });

    sock.on('connect_error', () => {
      this.notifyStatus('closed');
      if (this.explicitDisconnect) return;
      if (this.maxRetries > 0 && this.retryCount >= this.maxRetries) return;
      this.scheduleReconnect();
    });

    return sock;
    // #endif
  }

  private scheduleReconnect() {
    if (this.retryTimer) return;
    const delay = ReconnectingSocket.computeBackoff(
      this.retryCount,
      this.baseDelayMs,
      this.maxDelayMs,
      this.jitter,
    );
    this.retryCount += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      try {
        this.socket?.disconnect();
      } catch {}
      this.connect(this.currentUrl, this.currentQuery);
    }, delay);
  }

  /**
   * 计算下次重连的延迟（毫秒）
   * - 指数退避：base * 2^n，上限 max
   * - 随机抖动：±jitter * delay，避免雷击群
   * 暴露为静态方法便于单测
   */
  static computeBackoff(
    retryCount: number,
    baseDelayMs: number,
    maxDelayMs: number,
    jitter: number,
  ): number {
    const exp = Math.min(
      maxDelayMs,
      baseDelayMs * Math.pow(2, Math.max(0, retryCount)),
    );
    const noise = exp * jitter * (Math.random() * 2 - 1);
    return Math.max(0, Math.floor(exp + noise));
  }

  on(event: string, handler: (...args: any[]) => void) {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void) {
    this.socket?.off(event, handler);
  }

  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }

  disconnect() {
    this.explicitDisconnect = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  onStatus(cb: (s: 'connecting' | 'open' | 'closed') => void) {
    this.statusListeners.push(cb);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== cb);
    };
  }

  private notifyStatus(s: 'connecting' | 'open' | 'closed') {
    for (const l of this.statusListeners) {
      try {
        l(s);
      } catch {}
    }
  }
}

