// 小程序 H5 端 socket 连接服务
import type { Socket } from 'socket.io-client';
import { WsEvent } from './ws-events';
import { onNetStateChange, getNetState } from './request';

const API_BASE = import.meta.env?.VITE_API_BASE || '';

// 监听器类型
type Listener = (data: any) => void;

interface SceneChangeHandler {
  (payload: { state: string; event_id?: string; previous_state?: string }): void;
}

class SocketService {
  socket: Socket | null = null;
  private eventId = '';
  private listeners = new Map<string, Set<Listener>>();
  private currentQuestionListener: Listener | null = null;
  private currentBlindChatListener: Listener | null = null;
  private connectListeners = new Set<(connected: boolean) => void>();
  private _connected = false;
  /** 简易消息去重：保留最近 N 个事件 ID，避免后端重发造成的 UI 闪烁 */
  private readonly seenEventIds = new Set<string>();
  private readonly SEEN_LIMIT = 200;
  private seenOrder: string[] = [];
  /** 网络状态订阅句柄：网络恢复时主动尝试重连 */
  private _unsubNet: (() => void) | null = null;
  /** socket 错误累计次数（用于重连退避） */
  private _socketErrorStreak = 0;

  /** 当前连接状态 */
  get connected() {
    return this._connected;
  }

  /** 监听连接状态变化 */
  onConnectChange(fn: (connected: boolean) => void): () => void {
    this.connectListeners.add(fn);
    return () => this.connectListeners.delete(fn);
  }

  private setConnected(v: boolean) {
    if (this._connected === v) return;
    this._connected = v;
    this.connectListeners.forEach((fn) => fn(v));
  }

  /** 标记一个事件 ID 已处理；返回 true 表示新事件，false 表示重复 */
  private markSeen(eventId: string | number | undefined | null): boolean {
    if (eventId === undefined || eventId === null) return true;
    const id = String(eventId);
    if (this.seenEventIds.has(id)) return false;
    this.seenEventIds.add(id);
    this.seenOrder.push(id);
    if (this.seenOrder.length > this.SEEN_LIMIT) {
      const old = this.seenOrder.shift();
      if (old !== undefined) this.seenEventIds.delete(old);
    }
    return true;
  }

  /** 包裹一个 listener：若 payload 携带 id 且重复则跳过派发 */
  private dedupeWrap(_event: string, fn: Listener): Listener {
    return (data: any) => {
      const id =
        data?.id ??
        data?.event_id ??
        data?.message_id ??
        data?.request_id ??
        data?.pair_id ??
        data?.pool_id;
      if (id !== undefined && !this.markSeen(id)) return;
      fn(data);
    };
  }

  /**
   * 建立连接到指定活动
   * 同 eventId 重复调用会复用现有连接
   */
  connect(eventId: string, opts?: { role?: 'user' | 'host' }) {
    if (!eventId) return;
    if (this.socket && this.eventId === eventId && this._connected) {
      this.ensureRoomJoined();
      return;
    }
    if (this.socket && this.eventId !== eventId) {
      this.disconnect();
    }
    this.eventId = eventId;

    // 订阅全局网络状态：网络从 offline 回到 online 时立即主动重连一次
    this._unsubNet?.();
    this._unsubNet = onNetStateChange((state) => {
      if (state === 'online' && this.eventId && !this._connected && this.socket) {
        try {
          this.socket.connect();
        } catch {}
      }
    });

    const userInfo = (() => {
      try {
        return JSON.parse(uni.getStorageSync('flashmeet_user') || '{}');
      } catch {
        return {};
      }
    })();

    import('socket.io-client').then(({ io }) => {
      this.socket = io(API_BASE, {
        transports: ['websocket', 'polling'],
        query: {
          event_id: eventId,
          role: opts?.role || 'user',
          user_id: userInfo?.user_id || '',
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        timeout: 10_000,
      }) as Socket;

      this.socket.on('connect', () => {
        this._socketErrorStreak = 0;
        this.setConnected(true);
        this.socket?.emit(WsEvent.JOIN_ROOM, { event_id: eventId });
      });

      this.socket.on('disconnect', () => {
        this.setConnected(false);
      });

      this.socket.on('connect_error', () => {
        this._socketErrorStreak += 1;
        this.setConnected(false);
      });

      // 把内置监听器转接到 socket
      this.replayListeners();
    }).catch((err) => {
      console.warn('[socket] Failed to load socket.io-client', err);
    });
  }

  private ensureRoomJoined() {
    if (this.socket && this._connected) {
      this.socket.emit(WsEvent.JOIN_ROOM, { event_id: this.eventId });
    }
  }

  /** 重新绑定所有内部监听器（断线重连后） */
  private replayListeners() {
    if (!this.socket) return;
    this.listeners.forEach((set, event) => {
      set.forEach((fn) => {
        this.socket?.on(event, fn as any);
      });
    });
    if (this.currentQuestionListener) {
      this.socket.on(WsEvent.ICEBREAKER_QUESTION, this.currentQuestionListener as any);
    }
    if (this.currentBlindChatListener) {
      this.socket.on('blind_chat_message', this.currentBlindChatListener as any);
    }
  }

  /** 注册通用事件监听（带去重） */
  on(event: string, fn: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    const wrapped = this.dedupeWrap(event, fn);
    this.listeners.get(event)!.add(wrapped);
    this.socket?.on(event, wrapped as any);
    return () => this.off(event, wrapped);
  }

  /** 取消通用事件监听 */
  off(event: string, fn?: Listener) {
    if (!fn) {
      this.listeners.get(event)?.forEach((f) => this.socket?.off(event, f as any));
      this.listeners.delete(event);
      return;
    }
    this.listeners.get(event)?.delete(fn);
    this.socket?.off(event, fn as any);
  }

  /** 监听场景切换 */
  onSceneChange(fn: SceneChangeHandler): () => void {
    return this.on(WsEvent.SCENE_UPDATED, fn as Listener);
  }

  /** 监听破冰问题 */
  onIcebreakerQuestion(fn: Listener): () => void {
    const wrapped = this.dedupeWrap(WsEvent.ICEBREAKER_QUESTION, fn);
    this.currentQuestionListener = wrapped;
    this.socket?.on(WsEvent.ICEBREAKER_QUESTION, wrapped as any);
    return () => {
      this.currentQuestionListener = null;
      this.socket?.off(WsEvent.ICEBREAKER_QUESTION, wrapped as any);
    };
  }

  /** 监听盲聊消息 */
  onBlindChatMessage(fn: Listener): () => void {
    const wrapped = this.dedupeWrap('blind_chat_message', fn);
    this.currentBlindChatListener = wrapped;
    this.socket?.on('blind_chat_message', wrapped as any);
    return () => {
      this.currentBlindChatListener = null;
      this.socket?.off('blind_chat_message', wrapped as any);
    };
  }

  /** 监听摇一摇状态 */
  onShakeState(
    onStart: (data: { ends_at: number; duration_ms: number }) => void,
    onEnd: (data: { final_leaderboard?: any[] }) => void,
    onTick: (data: { leaderboard: any[] }) => void,
  ): () => void {
    const offStart = this.on(WsEvent.SHAKE_STARTED, onStart as Listener);
    const offEnd = this.on(WsEvent.SHAKE_ENDED, onEnd as Listener);
    const offTick = this.on(WsEvent.SHAKE_LEADERBOARD_TICK, onTick as Listener);
    return () => {
      offStart();
      offEnd();
      offTick();
    };
  }

  /** 监听开奖 */
  onLotteryAnnounce(fn: Listener): () => void {
    return this.on(WsEvent.LOTTERY_WINNER_ANNOUNCE, fn);
  }

  /** 监听匹配结果 */
  onMatchResult(fn: Listener): () => void {
    return this.on(WsEvent.MATCH_RESULT, fn);
  }

  /** 发送事件 */
  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  /** 关闭连接 */
  disconnect() {
    this._unsubNet?.();
    this._unsubNet = null;
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch {}
      this.socket = null;
    }
    this.eventId = '';
    this.listeners.clear();
    this.currentQuestionListener = null;
    this.currentBlindChatListener = null;
    this.seenEventIds.clear();
    this.seenOrder = [];
    this._socketErrorStreak = 0;
    this.setConnected(false);
  }
}

export const socketService = new SocketService();

// 同时挂载到 uni 全局变量，兼容老代码（如 lottery/shake 页）
// 使用 getter 实时返回单例，避免时序问题
try {
  (uni as any).$socket = socketService;
} catch {}

// 首次启动时如果有缓存的 eventId，则按当前网络状态决定是否立即尝试连接
try {
  const cachedEventId = uni.getStorageSync('flashmeet_last_event_id');
  if (cachedEventId && getNetState() !== 'offline') {
    const cachedRole = (uni.getStorageSync('flashmeet_last_role') as 'user' | 'host') || 'user';
    socketService.connect(cachedEventId, { role: cachedRole });
  }
} catch {}
