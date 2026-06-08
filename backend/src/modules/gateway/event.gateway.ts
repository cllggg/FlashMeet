import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { EventService } from '../event/event.service';
import { HostPresenceService } from '../event/host-presence.service';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { IcebreakerService } from '../icebreaker/icebreaker.service';
import { MatchService } from '../match/match.service';
import { EventStatus } from '../../common/enums/event-status.enum';
import { WsEvent } from '../../common/enums/ws-event.enum';
import { APP_EVENTS } from '../../common/constants/app-events';

/**
 * 活动 WebSocket 网关
 *
 * 职责：
 * 1. 维护客户端连接，房间管理（event:{event_id}）
 * 2. 晚入场状态同步：连接建立时立即下发当前状态
 * 3. 监听业务事件（checkin.created、lottery.drawn 等）并广播给大屏/用户
 * 4. 聚合摇一摇排行榜（Redis Sorted Set）
 */
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['polling', 'websocket'],
})
export class EventGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventGateway.name);

  // 单机降级：Redis 不可用时的内存兜底
  private localShakeScores: Map<string, Map<string, number>> = new Map();
  // 累加桶：每用户 200ms 内合并一次
  private shakeBuckets: Map<string, { count: number; flushAt: number }> = new Map();
  private leaderboardIntervals: Map<string, NodeJS.Timeout> = new Map();

  // 摇一摇节流配置
  private static readonly SHAKE_BUCKET_MS = 200; // 每 200ms flush 一次
  private static readonly SHAKE_MAX_PER_BUCKET = 50; // 异常值上限
  private static readonly SHAKE_BROADCAST_MS = 500; // 大屏每 500ms 拉一次
  private static readonly SHAKE_KEY = (eventId: string) =>
    `event:${eventId}:shake:scores`;

  // 摇一摇活跃标志：本地缓存 + Redis 同步，支持多实例部署
  private shakeActiveEvents: Set<string> = new Set();
  private static readonly SHAKE_ACTIVE_KEY = (eventId: string) =>
    `event:${eventId}:shake:active`;

  private async setShakeActive(eventId: string, active: boolean) {
    if (active) {
      this.shakeActiveEvents.add(eventId);
      try {
        await this.redis.set(
          EventGateway.SHAKE_ACTIVE_KEY(eventId),
          '1',
          'EX',
          3600,
        );
      } catch {}
    } else {
      this.shakeActiveEvents.delete(eventId);
      try {
        await this.redis.del(EventGateway.SHAKE_ACTIVE_KEY(eventId));
      } catch {}
    }
  }

  private async isShakeActive(eventId: string): Promise<boolean> {
    if (this.shakeActiveEvents.has(eventId)) return true;
    // 多实例兜底：检查 Redis 中是否有活跃标志
    try {
      const exists = await this.redis.exists(EventGateway.SHAKE_ACTIVE_KEY(eventId));
      if (exists) {
        this.shakeActiveEvents.add(eventId);
        return true;
      }
    } catch {}
    return false;
  }

  // 用户信息缓存 (userId -> { nickname, avatar_url })
  // TTL 1h，避免每次 join users 表
  private userInfoCache: Map<string, { nickname?: string; avatar_url?: string; ts: number }> = new Map();
  private static readonly USER_CACHE_TTL_MS = 60 * 60 * 1000;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly eventService: EventService,
    private readonly hostPresence: HostPresenceService,
    private readonly icebreakerService: IcebreakerService,
    private readonly matchService: MatchService,
    @InjectRepository(GlobalUser)
    private readonly userRepo: Repository<GlobalUser>,
  ) {}

  afterInit() {
    this.logger.log('EventGateway initialized');
    this.hostPresence.start();
    // 清理过期的摇一摇桶（防止长时间无 flush 累积）
    setInterval(() => this.gcShakeBuckets(), 30_000).unref();
  }

  private gcShakeBuckets() {
    const now = Date.now();
    for (const [uid, b] of this.shakeBuckets.entries()) {
      if (now > b.flushAt + 5000) {
        this.shakeBuckets.delete(uid);
      }
    }
  }

  onModuleDestroy() {
    this.hostPresence.stop();
  }

  // ── 连接管理 ─────────────────────────────

  async handleConnection(client: Socket) {
    const eventId = client.handshake.query.event_id as string;
    const role = client.handshake.query.role as string;
    const userId = client.handshake.query.user_id as string;

    if (!eventId) {
      client.disconnect();
      return;
    }

    client.join(`event:${eventId}`);
    client.data.eventId = eventId;
    client.data.role = role;
    client.data.userId = userId;

    // 晚入场状态同步
    try {
      const { state } = await this.eventService.getCurrentState(eventId);
      client.emit(WsEvent.SCENE_UPDATED, { state, event_id: eventId });

      // 若当前在破冰环节，推送问题快照（晚入场/重连恢复）
      if (state === EventStatus.ICEBREAKER) {
        const q = await this.icebreakerService.getCurrentQuestion(eventId);
        if (q) {
          client.emit(WsEvent.ICEBREAKER_QUESTION, {
            event_id: eventId,
            question: q,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`Sync state failed for event ${eventId}: ${err}`);
    }

    this.logger.log(
      `Client ${client.id} connected to event ${eventId} as ${role}`,
    );
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  // ── 客户端 → 服务端 ──────────────────────

  @SubscribeMessage(WsEvent.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { event_id: string; role: string },
  ) {
    client.join(`event:${data.event_id}`);
    client.data.eventId = data.event_id;
    client.data.role = data.role;

    const { state } = await this.eventService.getCurrentState(data.event_id);
    client.emit(WsEvent.SCENE_UPDATED, { state, event_id: data.event_id });
  }

  @SubscribeMessage(WsEvent.HOST_CHANGE_SCENE)
  async handleChangeScene(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      event_id: string;
      target_state: EventStatus;
      user_id: string;
    },
  ) {
    try {
      const newState = await this.eventService.changeScene(
        data.event_id,
        data.target_state,
        data.user_id,
      );
      // 状态变更后由 service 抛 SCENE_CHANGED 事件，Gateway 监听后广播
      // 此处显式 emit 也可以，但统一走事件更可观测
      this.broadcastSceneChange(data.event_id, newState);
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage(WsEvent.USER_SHAKE_ACTION)
  async handleShakeAction(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { event_id: string; user_id: string; count: number },
  ) {
    this.accumulateShake(data.event_id, data.user_id, data.count || 1);
  }

  @SubscribeMessage(WsEvent.HOST_HEARTBEAT)
  async handleHostHeartbeat(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { event_id: string; user_id: string },
  ) {
    if (!data?.event_id || !data?.user_id) return;
    await this.hostPresence.recordHeartbeat(data.event_id, data.user_id);
  }

  /**
   * 用户加入盲聊房间（隐私：仅匹配的双方能加入）
   * - 校验 user_id 必须是 match 的 user_a_id 或 user_b_id
   * - 通过后将该 socket 加入 `match:${match_id}` 房间，盲聊消息才能被推送给双方
   */
  @SubscribeMessage(WsEvent.JOIN_MATCH_ROOM)
  async handleJoinMatchRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { match_id: string; user_id: string },
  ) {
    if (!data?.match_id || !data?.user_id) return;
    const pair = await this.matchService
      .getMatchesByUser(data.match_id, data.user_id)
      .catch(() => null);
    if (!pair) {
      client.emit('error', { message: 'Match not found or not authorized' });
      return;
    }
    const room = `match:${data.match_id}`;
    client.join(room);
    this.logger.log(
      `Client ${client.id} joined match room ${room} as user ${data.user_id}`,
    );
  }

  @SubscribeMessage(WsEvent.MATCH_ACCEPT)
  async handleMatchAccept(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { event_id: string; user_id: string },
  ) {
    if (!data?.event_id || !data?.user_id) return;
    await this.matchService.acceptMatch(data.event_id, data.user_id);
  }

  @SubscribeMessage(WsEvent.MATCH_REJECT)
  async handleMatchReject(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { event_id: string; user_id: string },
  ) {
    if (!data?.event_id || !data?.user_id) return;
    await this.matchService.rejectMatch(data.event_id, data.user_id);
  }

  // ── 业务事件监听（消除循环依赖） ──────────

  @OnEvent(APP_EVENTS.CHECKIN_CREATED, { async: true })
  handleCheckinCreated(payload: { event_id: string; user: any }) {
    this.server.to(`event:${payload.event_id}`).emit(WsEvent.USER_CHECKED_IN, {
      event_id: payload.event_id,
      user: payload.user,
    });
  }

  @OnEvent(APP_EVENTS.LOTTERY_DRAWN, { async: true })
  handleLotteryDrawn(payload: { event_id: string; winner: any }) {
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.LOTTERY_WINNER_ANNOUNCE, {
        event_id: payload.event_id,
        winner: payload.winner,
      });

    // 中奖者专属事件：仅发送给中奖者本人
    const winnerUserId = payload.winner?.user_id;
    if (winnerUserId) {
      const sockets = this.server.sockets.sockets;
      sockets.forEach((s) => {
        if (s.data.userId === winnerUserId) {
          s.emit(WsEvent.LOTTERY_WON, {
            event_id: payload.event_id,
            ...payload.winner,
          });
        }
      });
    }
  }

  @OnEvent(APP_EVENTS.SCENE_CHANGED, { async: true })
  async handleSceneChanged(payload: { event_id: string; new_state: EventStatus }) {
    this.broadcastSceneChange(payload.event_id, payload.new_state);

    // 摇一摇会话：进入 GAME_SHAKE 时启动；离开时结束
    if (payload.new_state === EventStatus.GAME_SHAKE) {
      await this.setShakeActive(payload.event_id, true);
      this.startShakeSession(payload.event_id);
    } else {
      await this.setShakeActive(payload.event_id, false);
      this.endShakeSession(payload.event_id);
    }
  }

  @OnEvent(APP_EVENTS.SHAKE_UPDATED, { async: true })
  handleShakeUpdated(payload: {
    event_id: string;
    user_id: string;
    count: number;
  }) {
    this.accumulateShake(payload.event_id, payload.user_id, payload.count);
  }

  // ── 破冰/渐进式画像 ──────────────────────

  @OnEvent(APP_EVENTS.ICEBREAKER_PUBLISHED, { async: true })
  handleIcebreakerPublished(payload: {
    event_id: string;
    question: { question_id: string; prompt: string; options: any[] };
  }) {
    // 大屏展示问题（用于投影显示），用户端弹出答题面板
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.ICEBREAKER_QUESTION, {
        event_id: payload.event_id,
        question: payload.question,
      });
  }

  @OnEvent(APP_EVENTS.ICEBREAKER_ANSWERED, { async: true })
  handleIcebreakerAnswered(payload: {
    event_id: string;
    user_id: string;
    display_id?: string | null;
    name?: string | null;
    option_key?: string;
    tag: string;
    color: string;
  }) {
    // 大屏：暗星点亮专属颜色（仅大屏订阅的 socket 会用到 tag/color）
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.STAR_LIT_UP, {
        event_id: payload.event_id,
        user_id: payload.user_id,
        display_id: payload.display_id || null,
        name: payload.name || null,
        tag: payload.tag,
        color: payload.color,
        option_key: payload.option_key,
      });

    // 用户端：用于实时累计各选项人数 + 本人作答的视觉反馈
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.ICEBREAKER_ANSWERED, {
        event_id: payload.event_id,
        user_id: payload.user_id,
        display_id: payload.display_id || null,
        name: payload.name || null,
        option_key: payload.option_key,
        tag: payload.tag,
        color: payload.color,
      });
  }

  @OnEvent(APP_EVENTS.ICEBREAKER_CLOSED, { async: true })
  handleIcebreakerClosed(payload: { event_id: string }) {
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.ICEBREAKER_CLOSED, {
        event_id: payload.event_id,
      });
  }

  // ── 副场控心跳 → 主 host 切换 ────────────

  @OnEvent(APP_EVENTS.HOST_PROMOTED, { async: true })
  handleHostPromoted(payload: {
    event_id: string;
    new_host_id: string;
    old_host_id: string;
  }) {
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.HOST_CHANGED, {
        event_id: payload.event_id,
        new_host_id: payload.new_host_id,
        old_host_id: payload.old_host_id,
        reason: 'promoted',
      });
  }

  @OnEvent(APP_EVENTS.HOST_OFFLINE, { async: true })
  handleHostOffline(payload: { event_id: string; user_id: string }) {
    this.server.to(`event:${payload.event_id}`).emit(WsEvent.HOST_CHANGED, {
      event_id: payload.event_id,
      new_host_id: null,
      old_host_id: payload.user_id,
      reason: 'offline',
    });
  }

  // ── 摇一摇聚合 ──────────────────────────

  /**
   * 累加单个用户的摇一摇分数（带状态校验与桶合并）
   * - 仅在 GAME_SHAKE 状态接受
   * - 每 200ms 合并一次：用户在窗口内多次 shake 会被合并写入
   * - 优先使用 Redis Sorted Set（多实例可用），降级到内存
   */
  async accumulateShake(eventId: string, userId: string, count: number) {
    // 1. 本地快速校验 + Redis 多实例兜底
    if (!(await this.isShakeActive(eventId))) return;

    // 2. 输入防护：单次最多 10 抖，桶内最多 50 抖
    const safeCount = Math.max(0, Math.min(count, 10));
    if (safeCount === 0) return;

    // 3. 桶合并：200ms 内累计写一次 ZSet
    const now = Date.now();
    const bucket = this.shakeBuckets.get(userId);
    if (bucket && now < bucket.flushAt) {
      bucket.count = Math.min(
        bucket.count + safeCount,
        EventGateway.SHAKE_MAX_PER_BUCKET,
      );
      return;
    }
    if (bucket) {
      // 旧桶到期，写入 Redis 后重建
      await this.flushShakeBucket(eventId, userId, bucket.count);
    }
    this.shakeBuckets.set(userId, {
      count: safeCount,
      flushAt: now + EventGateway.SHAKE_BUCKET_MS,
    });
    // 异步定时 flush
    setTimeout(() => {
      const b = this.shakeBuckets.get(userId);
      if (b && Date.now() >= b.flushAt) {
        this.shakeBuckets.delete(userId);
        this.flushShakeBucket(eventId, userId, b.count).catch((err) =>
          this.logger.warn(`flushShakeBucket err: ${err}`),
        );
      }
    }, EventGateway.SHAKE_BUCKET_MS + 5);
  }

  private async flushShakeBucket(eventId: string, userId: string, total: number) {
    if (total <= 0) return;
    const key = EventGateway.SHAKE_KEY(eventId);
    try {
      if (typeof (this.redis as any).zincrby === 'function') {
        await (this.redis as any).zincrby(key, total, userId);
        return;
      }
      throw new Error('zincrby unavailable');
    } catch {
      // 内存兜底
      if (!this.localShakeScores.has(eventId)) {
        this.localShakeScores.set(eventId, new Map());
      }
      const map = this.localShakeScores.get(eventId)!;
      map.set(userId, (map.get(userId) || 0) + total);
    }
  }

  /**
   * 启动排行榜定时广播
   * 仅在进入 GAME_SHAKE 时调用
   */
  startShakeLeaderboard(eventId: string) {
    if (this.leaderboardIntervals.has(eventId)) return;

    const tick = async () => {
      const top = await this.getShakeTopN(eventId, 20);
      if (top.length === 0) return;
      const enriched = await this.enrichUsers(top.map((p) => p.user_id));
      const payload = top.map((p) => ({
        user_id: p.user_id,
        score: p.score,
        ...(enriched[p.user_id] || {}),
      }));
      this.server
        .to(`event:${eventId}`)
        .emit(WsEvent.SHAKE_LEADERBOARD_TICK, {
          event_id: eventId,
          leaderboard: payload,
        });
    };

    const interval = setInterval(tick, EventGateway.SHAKE_BROADCAST_MS);
    this.leaderboardIntervals.set(eventId, interval);
  }

  /**
   * 摇一摇会话：包含倒计时
   *  - durationMs: 默认 30s，host 可通过 SCENE_CHANGED 重入重启
   *  - 启动时广播 SHAKE_STARTED，全场可见倒计时
   *  - 结束时广播 SHAKE_ENDED + 终榜
   *  - 状态持久化到 Redis，防止服务重启后定时器丢失
   */
  private static readonly SHAKE_DEFAULT_DURATION_MS = 30_000;
  private static readonly SHAKE_SESSION_KEY = (eventId: string) =>
    `event:${eventId}:shake:session`;
  private shakeSessionTimers: Map<string, NodeJS.Timeout> = new Map();
  private shakeSessionEnds: Map<string, number> = new Map();

  startShakeSession(eventId: string, durationMs: number = EventGateway.SHAKE_DEFAULT_DURATION_MS) {
    // 清理上一个 session
    this.endShakeSession(eventId, /*silent*/ true);

    const endsAt = Date.now() + durationMs;
    this.shakeSessionEnds.set(eventId, endsAt);
    this.startShakeLeaderboard(eventId);

    // 持久化到 Redis（防止服务重启丢失）
    try {
      this.redis.set(
        EventGateway.SHAKE_SESSION_KEY(eventId),
        JSON.stringify({ ends_at: endsAt, duration_ms: durationMs, started_at: Date.now() }),
        'EX',
        Math.ceil(durationMs / 1000) + 10, // 多留 10s 缓冲
      );
    } catch {}

    this.server.to(`event:${eventId}`).emit(WsEvent.SHAKE_STARTED, {
      event_id: eventId,
      started_at: Date.now(),
      ends_at: endsAt,
      duration_ms: durationMs,
    });

    const timer = setTimeout(() => this.endShakeSession(eventId), durationMs);
    this.shakeSessionTimers.set(eventId, timer);
  }

  async endShakeSession(eventId: string, silent = false) {
    const timer = this.shakeSessionTimers.get(eventId);
    if (timer) {
      clearTimeout(timer);
      this.shakeSessionTimers.delete(eventId);
    }
    this.shakeSessionEnds.delete(eventId);
    this.stopShakeLeaderboard(eventId);

    // 清理 Redis
    try {
      this.redis.del(EventGateway.SHAKE_SESSION_KEY(eventId));
    } catch {}

    if (silent) return;

    // 终榜：取一次 top 5
    try {
      const top = await this.getShakeTopN(eventId, 5);
      const enriched = await this.enrichUsers(top.map((p) => p.user_id));
      const finalLeaderboard = top.map((p) => ({
        user_id: p.user_id,
        score: p.score,
        ...(enriched[p.user_id] || {}),
      }));
      this.server
        .to(`event:${eventId}`)
        .emit(WsEvent.SHAKE_ENDED, {
          event_id: eventId,
          final_leaderboard: finalLeaderboard,
        });
    } catch (err) {
      this.logger.warn(`endShakeSession failed: ${err}`);
    }
  }

  /** 同步查询 shake session 结束时间（内存优先，Redis 兜底）
   *  注意：Redis 查询是异步的，同步方法仅返回内存值。
   *  需要 Redis 兜底时请使用 async 方法 getShakeSessionRedis */
  getShakeSessionEndsAt(eventId: string): number | null {
    return this.shakeSessionEnds.get(eventId) ?? null;
  }

  /**
   * 异步查询 Redis 中的 shake session 状态
   * 用于 ScreenController 的同步接口回退
   */
  async getShakeSessionRedis(eventId: string): Promise<{ ends_at: number; duration_ms: number; started_at: number } | null> {
    try {
      const raw = await this.redis.get(EventGateway.SHAKE_SESSION_KEY(eventId));
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  stopShakeLeaderboard(eventId: string) {
    const interval = this.leaderboardIntervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.leaderboardIntervals.delete(eventId);
    }
    // 清理内存与 Redis 分数
    this.localShakeScores.delete(eventId);
    try {
      this.redis.del(EventGateway.SHAKE_KEY(eventId));
    } catch {}
  }

  private async getShakeTopN(
    eventId: string,
    n: number,
  ): Promise<Array<{ user_id: string; score: number }>> {
    const key = EventGateway.SHAKE_KEY(eventId);

    // 优先 Redis
    try {
      if (typeof (this.redis as any).zrevrange === 'function') {
        const ids = (await (this.redis as any).zrevrange(
          key,
          0,
          n - 1,
        )) as string[];
        if (ids.length === 0) return [];
        // 批量取分数
        const scores = await Promise.all(
          ids.map((uid) => (this.redis as any).zscore(key, uid)),
        );
        return ids.map((uid, i) => ({
          user_id: uid,
          score: parseInt(scores[i] || '0', 10),
        }));
      }
    } catch {}

    // 内存兜底
    const map = this.localShakeScores.get(eventId);
    if (!map) return [];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([user_id, score]) => ({ user_id, score }));
  }

  // ── 场景广播（暴露给 REST 路径使用） ────

  broadcastSceneChange(eventId: string, newState: EventStatus) {
    this.server.to(`event:${eventId}`).emit(WsEvent.SCENE_UPDATED, {
      state: newState,
      event_id: eventId,
    });

    if (newState === EventStatus.GAME_SHAKE) {
      this.startShakeLeaderboard(eventId);
    }
    // 离开 GAME_SHAKE 时不在 broadcastSceneChange 中清理分数，
    // 由 endShakeSession 负责：先广播终榜，再清理 Redis/内存
  }

  /**
   * 批量丰富用户信息（昵称、头像）
   * 优先用内存缓存，缓存未命中再查 DB
   */
  private async enrichUsers(
    userIds: string[],
  ): Promise<Record<string, { nickname?: string; avatar_url?: string }>> {
    const result: Record<string, { nickname?: string; avatar_url?: string }> = {};
    const toFetch: string[] = [];
    const now = Date.now();

    for (const uid of userIds) {
      const cached = this.userInfoCache.get(uid);
      if (cached && now - cached.ts < EventGateway.USER_CACHE_TTL_MS) {
        result[uid] = {
          nickname: cached.nickname,
          avatar_url: cached.avatar_url,
        };
      } else {
        toFetch.push(uid);
      }
    }

    if (toFetch.length === 0) return result;

    try {
      const users = await this.userRepo.find({
        where: toFetch.map((id) => ({ user_id: id })),
        select: ['user_id', 'nickname', 'avatar_url'],
      });
      for (const u of users) {
        result[u.user_id] = {
          nickname: u.nickname || undefined,
          avatar_url: u.avatar_url || undefined,
        };
        this.userInfoCache.set(u.user_id, {
          nickname: u.nickname,
          avatar_url: u.avatar_url,
          ts: now,
        });
      }
    } catch (err) {
      this.logger.warn(`enrichUsers failed: ${err}`);
    }
    return result;
  }

  // ── CP盲盒匹配 ────────────────────────────

  @OnEvent(APP_EVENTS.MATCH_GENERATED, { async: true })
  handleMatchGenerated(payload: { event_id: string; pairs: any[]; total: number }) {
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.MATCH_LINES, {
        event_id: payload.event_id,
        pairs: payload.pairs,
        total: payload.total,
      });
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.MATCH_RESULT, {
        event_id: payload.event_id,
        pairs: payload.pairs,
      });
  }

  @OnEvent(APP_EVENTS.MATCH_ACCEPTED, { async: true })
  handleMatchAccepted(payload: { event_id: string; pair: any }) {
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.MATCH_ACCEPT, { event_id: payload.event_id, pair: payload.pair });
  }

  @OnEvent(APP_EVENTS.MATCH_REJECTED, { async: true })
  handleMatchRejected(payload: { event_id: string; pair: any }) {
    this.server
      .to(`event:${payload.event_id}`)
      .emit(WsEvent.MATCH_REJECT, { event_id: payload.event_id, pair: payload.pair });
  }

  @OnEvent(APP_EVENTS.MATCH_BLIND_CHAT, { async: true })
  handleBlindChat(payload: { match_id: string; message: any }) {
    this.server
      .to(`match:${payload.match_id}`)
      .emit('blind_chat_message', { match_id: payload.match_id, message: payload.message });
  }
}
