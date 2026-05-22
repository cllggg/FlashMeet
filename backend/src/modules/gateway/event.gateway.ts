import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { EventService, EVENT_STATE_KEY } from '../event/event.service';
import { EventStatus } from '../../common/enums/event-status.enum';
import { WsEvent } from '../../common/enums/ws-event.enum';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['polling', 'websocket'],
})
export class EventGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Rate limiter: userId -> last shake timestamp
  private shakeRateLimit: Map<string, number> = new Map();
  private static readonly SHAKE_COOLDOWN_MS = 100; // 10 times per second max
  private static readonly SHAKE_BROADCAST_MS = 500;

  // Shake scores: eventId -> Map<userId, score>
  private shakeScores: Map<string, Map<string, number>> = new Map();

  // Leaderboard broadcast intervals
  private leaderboardIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly eventService: EventService,
  ) {}

  async handleConnection(client: Socket) {
    const eventId = client.handshake.query.event_id as string;
    const role = client.handshake.query.role as string; // 'screen' | 'host' | 'user'

    if (!eventId) {
      client.disconnect();
      return;
    }

    // Join the event room
    client.join(`event:${eventId}`);

    // Late-joiner sync: send current state immediately
    try {
      const { state } = await this.eventService.getCurrentState(eventId);
      client.emit(WsEvent.SCENE_UPDATED, { state, event_id: eventId });
    } catch {
      // Event might not exist yet
    }

    console.log(`Client ${client.id} connected to event ${eventId} as ${role}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage(WsEvent.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { event_id: string; role: string },
  ) {
    client.join(`event:${data.event_id}`);
    client.data.eventId = data.event_id;
    client.data.role = data.role;

    // Late-joiner sync
    const { state } = await this.eventService.getCurrentState(data.event_id);
    client.emit(WsEvent.SCENE_UPDATED, { state, event_id: data.event_id });
  }

  @SubscribeMessage(WsEvent.HOST_CHANGE_SCENE)
  async handleChangeScene(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { event_id: string; target_state: EventStatus; user_id: string },
  ) {
    const { event_id, target_state, user_id } = data;

    // Validate and change scene
    const newState = await this.eventService.changeScene(
      event_id,
      target_state,
      user_id,
    );

    // Broadcast to all clients in the event room
    this.server.to(`event:${event_id}`).emit(WsEvent.SCENE_UPDATED, {
      state: newState,
      event_id,
    });

    // Start/stop shake leaderboard based on state
    if (target_state === EventStatus.GAME_SHAKE) {
      this.startShakeLeaderboard(event_id);
    } else {
      this.stopShakeLeaderboard(event_id);
    }
  }

  @SubscribeMessage(WsEvent.USER_SHAKE_ACTION)
  async handleShakeAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { event_id: string; user_id: string; count: number },
  ) {
    const { event_id, user_id, count } = data;

    // Anti-cheat: rate limiting
    const now = Date.now();
    const lastShake = this.shakeRateLimit.get(user_id) || 0;
    if (now - lastShake < EventGateway.SHAKE_COOLDOWN_MS) {
      return; // Drop the request
    }
    this.shakeRateLimit.set(user_id, now);

    // Anti-cheat: cap per-request count to human limit
    const cappedCount = Math.min(count, 10);

    // Accumulate score
    if (!this.shakeScores.has(event_id)) {
      this.shakeScores.set(event_id, new Map());
    }
    const eventScores = this.shakeScores.get(event_id)!;
    const currentScore = eventScores.get(user_id) || 0;
    eventScores.set(user_id, currentScore + cappedCount);
  }

  /**
   * Broadcast shake leaderboard every 500ms
   */
  private startShakeLeaderboard(eventId: string) {
    if (this.leaderboardIntervals.has(eventId)) return;

    const interval = setInterval(() => {
      const scores = this.shakeScores.get(eventId);
      if (!scores) return;

      const leaderboard = Array.from(scores.entries())
        .map(([user_id, score]) => ({ user_id, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      this.server
        .to(`event:${eventId}`)
        .emit(WsEvent.SHAKE_LEADERBOARD_TICK, {
          event_id: eventId,
          leaderboard,
        });
    }, EventGateway.SHAKE_BROADCAST_MS);

    this.leaderboardIntervals.set(eventId, interval);
  }

  private stopShakeLeaderboard(eventId: string) {
    const interval = this.leaderboardIntervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.leaderboardIntervals.delete(eventId);
    }
    this.shakeScores.delete(eventId);
  }

  /**
   * Notify big screen about new check-in
   */
  notifyUserCheckedIn(eventId: string, user: any) {
    this.server.to(`event:${eventId}`).emit(WsEvent.USER_CHECKED_IN, {
      event_id: eventId,
      user,
    });
  }

  /**
   * Announce lottery winner
   */
  announceLotteryWinner(eventId: string, winner: any) {
    this.server
      .to(`event:${eventId}`)
      .emit(WsEvent.LOTTERY_WINNER_ANNOUNCE, {
        event_id: eventId,
        winner,
      });
  }

  /**
   * Public method for REST-based scene change (called from EventController)
   */
  broadcastSceneChange(eventId: string, newState: EventStatus) {
    this.server.to(`event:${eventId}`).emit(WsEvent.SCENE_UPDATED, {
      state: newState,
      event_id: eventId,
    });

    if (newState === EventStatus.GAME_SHAKE) {
      this.startShakeLeaderboard(eventId);
    } else {
      this.stopShakeLeaderboard(eventId);
    }
  }

  /**
   * Public method for REST-based shake action (called from EventController)
   */
  handleShakeRest(eventId: string, userId: string, count: number) {
    const now = Date.now();
    const lastShake = this.shakeRateLimit.get(userId) || 0;
    if (now - lastShake < EventGateway.SHAKE_COOLDOWN_MS) {
      return;
    }
    this.shakeRateLimit.set(userId, now);

    const cappedCount = Math.min(count, 10);

    if (!this.shakeScores.has(eventId)) {
      this.shakeScores.set(eventId, new Map());
    }
    const eventScores = this.shakeScores.get(eventId)!;
    const currentScore = eventScores.get(userId) || 0;
    eventScores.set(userId, currentScore + cappedCount);
  }
}
