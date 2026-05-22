import { io, Socket } from 'socket.io-client';
import { WsEvent, EventStatus } from '../types/enums';

class SocketService {
  private socket: Socket | null = null;
  private eventId: string = '';

  connect(eventId: string) {
    this.eventId = eventId;
    this.socket = io('/', {
      transports: ['polling', 'websocket'],
      query: {
        event_id: eventId,
        role: 'screen',
      },
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
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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

  onLotteryWinner(callback: (data: any) => void) {
    this.socket?.on(WsEvent.LOTTERY_WINNER_ANNOUNCE, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
