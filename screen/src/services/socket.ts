import type { Socket } from 'socket.io-client';
import { WsEvent, EventStatus } from '../types/enums';
import { ReconnectingSocket, SocketStatus } from '../utils/reconnecting-socket';

class SocketService {
  private rs: ReconnectingSocket = new ReconnectingSocket({
    baseDelayMs: 500,
    maxDelayMs: 30_000,
  });
  private socket: Socket | null = null;
  private eventId: string = '';

  /**
   * 连接到指定 event 的 socket.io 房间
   * 内部使用 ReconnectingSocket，断线自动指数退避
   */
  connect(eventId: string) {
    if (this.eventId === eventId && this.socket?.connected) {
      return this.socket;
    }
    this.eventId = eventId;

    // 用同源 path，Vite proxy 已配
    this.socket = this.rs.connect('/', {
      event_id: eventId,
      role: 'screen',
    });

    this.socket.on('connect', () => {
      console.log('Screen connected to event:', eventId);
      this.socket?.emit(WsEvent.JOIN_ROOM, { event_id: eventId, role: 'screen' });
    });

    this.socket.on('disconnect', () => {
      console.log('Screen disconnected');
    });

    return this.socket;
  }

  disconnect() {
    this.rs.disconnect();
    this.socket = null;
    this.eventId = '';
  }

  /**
   * 订阅连接状态（connecting / open / closed）
   * 返回取消订阅函数（调用以反订阅）
   */
  onStatusChange(fn: (s: SocketStatus, info?: any) => void): () => void {
    return this.rs.onStatusChange(fn);
  }

  getStatus(): SocketStatus {
    if (!this.socket) return 'closed';
    if (this.socket.connected) return 'open';
    return 'closed';
  }

  onSceneUpdated(callback: (data: { state: EventStatus; event_id: string }) => void) {
    this.socket?.on(WsEvent.SCENE_UPDATED, callback);
  }

  onUserCheckedIn(callback: (data: any) => void) {
    this.socket?.on(WsEvent.USER_CHECKED_IN, callback);
  }

  onShakeLeaderboard(callback: (data: any) => void) {
    this.socket?.on(WsEvent.SHAKE_LEADERBOARD_TICK, callback);
  }

  onShakeStarted(callback: (data: any) => void) {
    this.socket?.on(WsEvent.SHAKE_STARTED, callback);
  }

  onShakeEnded(callback: (data: any) => void) {
    this.socket?.on(WsEvent.SHAKE_ENDED, callback);
  }

  onLotteryWinner(callback: (data: any) => void) {
    this.socket?.on(WsEvent.LOTTERY_WINNER_ANNOUNCE, callback);
  }

  onIcebreakerQuestion(callback: (data: any) => void) {
    this.socket?.on(WsEvent.ICEBREAKER_QUESTION, callback);
  }

  onIcebreakerClosed(callback: (data: any) => void) {
    this.socket?.on(WsEvent.ICEBREAKER_CLOSED, callback);
  }

  onStarLitUp(callback: (data: any) => void) {
    this.socket?.on(WsEvent.STAR_LIT_UP, callback);
  }

  onHostChanged(callback: (data: any) => void) {
    this.socket?.on(WsEvent.HOST_CHANGED, callback);
  }

  onMatchLines(callback: (data: any) => void) {
    this.socket?.on(WsEvent.MATCH_LINES, callback);
  }

  onMatchResult(callback: (data: any) => void) {
    this.socket?.on(WsEvent.MATCH_RESULT, callback);
  }

  sendHeartbeat(userId: string) {
    this.socket?.emit(WsEvent.HOST_HEARTBEAT, { event_id: this.eventId, user_id: userId });
  }

  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
