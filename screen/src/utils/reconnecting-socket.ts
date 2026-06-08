/**
 * ReconnectingSocket — 大屏专用版
 *
 * 与 miniapp 版的差异：
 *  - 大屏永远跑在 H5/浏览器环境，无 #ifdef 分支
 *  - 暴露状态：connecting / open / closed（用于 UI 提示）
 *  - connect() 是幂等的：已连接时直接返回现有 socket
 *
 * 退避策略：base * 2^n，到 maxDelayMs 封顶，加 jitter
 */
import { io, Socket } from 'socket.io-client';

export interface ReconnectOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
  maxRetries?: number;
}

export type SocketStatus = 'connecting' | 'open' | 'closed';

export class ReconnectingSocket {
  private socket: Socket | null = null;
  private retryCount = 0;
  private explicitDisconnect = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private statusListeners: Array<(s: SocketStatus, info?: any) => void> = [];
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

  /** 公开：当前退避时间（含 jitter） */
  computeBackoff(retry: number): number {
    const exp = Math.min(this.baseDelayMs * 2 ** retry, this.maxDelayMs);
    const j = exp * this.jitter;
    return Math.floor(exp - j + Math.random() * 2 * j);
  }

  private notifyStatus(s: SocketStatus, info?: any) {
    this.statusListeners.forEach((fn) => fn(s, info));
  }

  onStatusChange(fn: (s: SocketStatus, info?: any) => void): () => void {
    this.statusListeners.push(fn);
    return () => {
      this.statusListeners = this.statusListeners.filter((x) => x !== fn);
    };
  }

  /** 获取当前 socket（可能为 null） */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * 连接到一个 endpoint
   * - 幂等：重复调用不会重建
   * - 显式 disconnect 后再 connect 会重建
   */
  connect(url: string, query: Record<string, any>): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }
    this.explicitDisconnect = false;
    this.currentUrl = url;
    this.currentQuery = query;
    this.retryCount = 0;
    return this.openSocket();
  }

  private openSocket(): Socket {
    if (this.explicitDisconnect) return this.socket!;
    this.notifyStatus('connecting');
    this.socket = io(this.currentUrl, {
      transports: ['websocket', 'polling'],
      query: this.currentQuery,
      reconnection: false, // 我们自己做指数退避
    });

    this.socket.on('connect', () => {
      console.log('[ReconnectingSocket] connected');
      this.retryCount = 0;
      this.notifyStatus('open');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[ReconnectingSocket] disconnected:', reason);
      this.notifyStatus('closed', { reason });
      if (!this.explicitDisconnect) this.scheduleReconnect();
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[ReconnectingSocket] connect_error:', err?.message);
      this.notifyStatus('closed', { reason: 'connect_error' });
      if (!this.explicitDisconnect) this.scheduleReconnect();
    });

    return this.socket;
  }

  private scheduleReconnect() {
    if (this.explicitDisconnect) return;
    if (this.maxRetries > 0 && this.retryCount >= this.maxRetries) {
      console.error('[ReconnectingSocket] giving up');
      return;
    }
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const delay = this.computeBackoff(this.retryCount);
    this.retryCount += 1;
    console.log(
      `[ReconnectingSocket] retry #${this.retryCount} in ${delay}ms`,
    );
    this.retryTimer = setTimeout(() => this.openSocket(), delay);
  }

  disconnect() {
    this.explicitDisconnect = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.notifyStatus('closed', { reason: 'explicit' });
  }
}
