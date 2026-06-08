import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../../common/constants/app-events';

export const HOST_PRESENCE_KEY = (eventId: string) => `event:${eventId}:hosts:present`;
export const HOST_PRIMARY_KEY = (eventId: string) => `event:${eventId}:host:primary`;

export interface HostHeartbeatPayload {
  event_id: string;
  user_id: string;
  ts: number;
}

/**
 * 副场控心跳机制
 *
 * 思路：
 * - 每个 host/co-host 客户端每 3s 发送一次心跳
 * - 服务端记录：(eventId, userId) -> last_ts in Redis（TTL = 12s）
 * - 定时巡检：每 5s 检查主 host 是否仍在线
 * - 若主 host 离线：
 *   1. 选最近活跃的 co-host 提升为新主
 *   2. 抛 HOST_PROMOTED 事件 -> Gateway 广播 HOST_CHANGED
 *
 * 设计目标：
 * - 多副本：Redis 是唯一可信源，避免单点
 * - 内存降级：Redis 不可用时用本地 Map 兜底
 * - 防抖：每 userId 节流
 */
@Injectable()
export class HostPresenceService {
  private readonly logger = new Logger(HostPresenceService.name);

  // 内存降级
  private localPresence: Map<string, Map<string, number>> = new Map();
  private localPrimary: Map<string, string> = new Map();

  // 节流：每用户每 2s 最多处理一次心跳
  private lastHeartbeat: Map<string, number> = new Map();
  private static readonly HEARTBEAT_COOLDOWN_MS = 2000;
  private static readonly HEARTBEAT_TTL_S = 12;
  private static readonly SWEEP_INTERVAL_MS = 5000;

  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly emitter: EventEmitter2,
  ) {}

  /**
   * 启动巡检定时器
   */
  start() {
    if (this.sweepTimer) return;
    this.sweepTimer = setInterval(
      () => this.sweepAll(),
      HostPresenceService.SWEEP_INTERVAL_MS,
    );
    this.logger.log('HostPresenceService sweep started');
  }

  stop() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  /**
   * 记录一次心跳
   */
  async recordHeartbeat(eventId: string, userId: string) {
    // 节流
    const now = Date.now();
    const last = this.lastHeartbeat.get(`${eventId}:${userId}`) || 0;
    if (now - last < HostPresenceService.HEARTBEAT_COOLDOWN_MS) return;
    this.lastHeartbeat.set(`${eventId}:${userId}`, now);

    const key = HOST_PRESENCE_KEY(eventId);
    const score = now;

    try {
      // ZADD key score member
      if (typeof (this.redis as any).zadd === 'function') {
        await (this.redis as any).zadd(key, score, userId);
        // 过期清理：只保留最近 30s 内的
        if (typeof (this.redis as any).zremrangebyscore === 'function') {
          await (this.redis as any).zremrangebyscore(
            key,
            0,
            now - 30_000,
          );
        }
        // 续 TTL
        await this.redis.expire(key, 60);
      } else {
        throw new Error('zadd unavailable');
      }
    } catch {
      // 内存兜底
      if (!this.localPresence.has(eventId)) {
        this.localPresence.set(eventId, new Map());
      }
      this.localPresence.get(eventId)!.set(userId, score);
    }
  }

  /**
   * 标记主 host
   */
  async setPrimary(eventId: string, hostId: string) {
    try {
      await this.redis.set(HOST_PRIMARY_KEY(eventId), hostId, 'EX', 3600);
    } catch {
      this.localPrimary.set(eventId, hostId);
    }
  }

  /**
   * 列出当前在线的所有 host（含主）
   */
  async listActive(eventId: string): Promise<Array<{ user_id: string; ts: number }>> {
    const key = HOST_PRESENCE_KEY(eventId);
    try {
      if (typeof (this.redis as any).zrevrange === 'function') {
        const ids = (await (this.redis as any).zrevrange(key, 0, -1)) as string[];
        if (ids.length === 0) return [];
        const scores = await Promise.all(
          ids.map((uid) => (this.redis as any).zscore(key, uid)),
        );
        return ids.map((uid, i) => ({
          user_id: uid,
          ts: parseInt(scores[i] || '0', 10),
        }));
      }
    } catch {}
    const map = this.localPresence.get(eventId);
    if (!map) return [];
    return Array.from(map.entries())
      .map(([user_id, ts]) => ({ user_id, ts }))
      .sort((a, b) => b.ts - a.ts);
  }

  /**
   * 巡检：若主 host 离线，提升最近活跃的 co-host
   */
  private async sweepAll() {
    // 找出所有需要巡检的 eventId
    const allEventIds = new Set<string>();
    try {
      if (typeof (this.redis as any).keys === 'function') {
        const keys = (await (this.redis as any).keys(
          'event:*:host:primary',
        )) as string[];
        for (const k of keys) {
          const m = k.match(/^event:([^:]+):host:primary$/);
          if (m) allEventIds.add(m[1]);
        }
      }
    } catch {}
    for (const eid of this.localPrimary.keys()) allEventIds.add(eid);

    for (const eid of allEventIds) {
      await this.checkAndPromote(eid).catch((err) =>
        this.logger.warn(`Sweep error for ${eid}: ${err}`),
      );
    }
  }

  private async checkAndPromote(eventId: string) {
    const primary = await this.getPrimary(eventId);
    if (!primary) return;

    const active = await this.listActive(eventId);
    const primaryStillActive = active.some(
      (a) => a.user_id === primary && Date.now() - a.ts < HostPresenceService.HEARTBEAT_TTL_S * 1000,
    );

    if (primaryStillActive) {
      this.emitter.emit(APP_EVENTS.HOST_HEARTBEAT, {
        event_id: eventId,
        user_id: primary,
        ok: true,
      });
      return;
    }

    // 主 host 离线：从 co-host 中选最近活跃者
    const candidate = active
      .filter((a) => a.user_id !== primary && Date.now() - a.ts < HostPresenceService.HEARTBEAT_TTL_S * 1000)
      .sort((a, b) => b.ts - a.ts)[0];

    if (!candidate) {
      this.emitter.emit(APP_EVENTS.HOST_OFFLINE, {
        event_id: eventId,
        user_id: primary,
      });
      return;
    }

    await this.setPrimary(eventId, candidate.user_id);
    this.emitter.emit(APP_EVENTS.HOST_PROMOTED, {
      event_id: eventId,
      new_host_id: candidate.user_id,
      old_host_id: primary,
    });

    this.logger.log(
      `Promoted ${candidate.user_id} as new host of ${eventId} (old: ${primary})`,
    );
  }

  private async getPrimary(eventId: string): Promise<string | null> {
    try {
      const v = await this.redis.get(HOST_PRIMARY_KEY(eventId));
      if (v) return v;
    } catch {}
    return this.localPrimary.get(eventId) || null;
  }
}
