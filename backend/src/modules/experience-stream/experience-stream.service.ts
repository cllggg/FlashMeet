/**
 * ExperienceStreamService · 体验流聚合（v2.0）
 * ------------------------------------------------------------
 * 职责：
 *   1. 维护每个活动的 stream 状态：current + queue + history + suggestions
 *   2. 监听 SCENE_CHANGED 事件自动更新 current（并把上一个挪到 history）
 *   3. 提供 getStream() 给 REST + WS 共享
 *   4. 提供 emitStreamUpdate() 由 Gateway 广播 STREAM_UPDATED
 *
 * 设计原则：
 *   - Stream 状态以 Redis Hash 缓存（重启不丢，可选 TTL）
 *   - queue 始终基于 STREAM_TIMELINE 推算（不在 Redis 持久化）
 *   - history 最多保留最近 8 条（FIFO）
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { EventStatus } from '../../common/enums/event-status.enum';
import { APP_EVENTS } from '../../common/constants/app-events';
import {
  ExperienceStream,
  StreamNode,
  STREAM_TIMELINE,
} from './experience-stream.types';
import { HostAssistantService } from '../host-assistant/host-assistant.service';
import { EventService } from '../event/event.service';

const HISTORY_MAX = 8;
const STREAM_TTL = 6 * 60 * 60; // 6h，活动结束后过期

@Injectable()
export class ExperienceStreamService {
  private readonly logger = new Logger(ExperienceStreamService.name);
  private listeners = new Set<(eventId: string, stream: ExperienceStream) => void>();

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly assistant: HostAssistantService,
    private readonly eventService: EventService,
  ) {}

  /** Redis Hash 主键 */
  private static key(eventId: string) {
    return `event:${eventId}:stream`;
  }

  /**
   * 监听 SCENE_CHANGED 事件 → 重建 stream 并通知监听者
   * 触发方：EventService.changeScene()
   */
  @OnEvent(APP_EVENTS.SCENE_CHANGED)
  async handleSceneChanged(payload: {
    event_id: string;
    state: EventStatus;
    previous_state?: EventStatus;
  }) {
    try {
      const stream = await this.rebuildStream(payload.event_id);
      // 通知订阅者（Gateway 监听 → STREAM_UPDATED 广播）
      this.listeners.forEach((fn) => {
        try {
          fn(payload.event_id, stream);
        } catch (e) {
          this.logger.warn(`listener error: ${e}`);
        }
      });
    } catch (e) {
      this.logger.error(`Failed to rebuild stream for ${payload.event_id}: ${e}`);
    }
  }

  /**
   * 监听 CHECKIN_CREATED → 自增签到计数 + 重建 stream
   * 让"签到节奏"实时反映在 stream.meta.checkinCount
   */
  @OnEvent(APP_EVENTS.CHECKIN_CREATED)
  async handleCheckinCreated(payload: { event_id: string }) {
    try {
      await this.bumpCheckinCount(payload.event_id, 1);
    } catch (e) {
      this.logger.warn(`Failed to bump checkin count: ${e}`);
    }
  }

  /** 订阅 stream 更新（Gateway 用） */
  subscribe(fn: (eventId: string, stream: ExperienceStream) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * 完整重建 stream（用于 changeScene 后 / 首次拉取 / 兜底）
   */
  async rebuildStream(eventId: string): Promise<ExperienceStream> {
    const { state } = await this.eventService.getCurrentState(eventId);
    const event = await this.eventService.findOne(eventId);

    // 从 Redis 读 history
    const historyRaw = await this.redis.get(
      `${ExperienceStreamService.key(eventId)}:history`,
    );
    const history: StreamNode[] = historyRaw
      ? (JSON.parse(historyRaw) as StreamNode[])
      : [];

    // 当前节点
    const now = Date.now();
    const current: StreamNode = {
      type: state as EventStatus,
      startedAt: now,
    };

    // queue = STREAM_TIMELINE 中 current 之后 + 当前未进入过的部分
    const curIdx = STREAM_TIMELINE.indexOf(state as EventStatus);
    const queue: StreamNode[] =
      curIdx >= 0 && curIdx < STREAM_TIMELINE.length - 1
        ? STREAM_TIMELINE.slice(curIdx + 1).map((t) => ({
            type: t,
            startedAt: 0, // 0 表示"未开始"
          }))
        : [];

    // 写 Redis（缓存 + history 持久化）
    const prev = history.find((h) => !h.endedAt);
    if (prev && prev.type !== current.type) {
      prev.endedAt = now;
      history.push({ type: current.type, startedAt: now });
      // FIFO
      const trimmed = history.slice(-HISTORY_MAX);
      await this.redis.set(
        `${ExperienceStreamService.key(eventId)}:history`,
        JSON.stringify(trimmed),
        'EX',
        STREAM_TTL,
      );
    } else if (!prev) {
      history.push({ type: current.type, startedAt: now });
      await this.redis.set(
        `${ExperienceStreamService.key(eventId)}:history`,
        JSON.stringify(history.slice(-HISTORY_MAX)),
        'EX',
        STREAM_TTL,
      );
    }

    // 签到 / 互动计数
    const checkinCount = await this.redis.get(
      `event:${eventId}:checkin:count`,
    );
    const interactionCount = await this.redis.get(
      `event:${eventId}:interaction:count`,
    );

    // 生成建议
    const elapsedMs = now - current.startedAt;
    const suggestions = this.assistant.generate({
      eventId,
      currentState: current.type,
      checkinCount: Number(checkinCount) || 0,
      interactionCount: Number(interactionCount) || 0,
      elapsedMs,
      recentChangeMs: 0,
    });

    const stream: ExperienceStream = {
      current,
      queue,
      history: history.slice(-HISTORY_MAX),
      suggestions,
      meta: {
        eventId,
        title: (event as any).title || '',
        state: current.type,
        checkinCount: Number(checkinCount) || 0,
        interactionCount: Number(interactionCount) || 0,
        lastUpdatedAt: now,
      },
    };

    // 缓存最新 stream（仅供 fetch 时用，权威源仍是上面聚合）
    await this.redis.set(
      ExperienceStreamService.key(eventId),
      JSON.stringify(stream),
      'EX',
      STREAM_TTL,
    );

    return stream;
  }

  /**
   * 读取 stream（缓存优先）
   */
  async getStream(eventId: string): Promise<ExperienceStream> {
    const cached = await this.redis.get(ExperienceStreamService.key(eventId));
    if (cached) {
      try {
        return JSON.parse(cached) as ExperienceStream;
      } catch {
        // 缓存损坏，fallback 到重建
      }
    }
    return this.rebuildStream(eventId);
  }

  /**
   * 让"签到 +1"事件能反映到 stream 计数（由 Checkin 模块调用）
   */
  async bumpCheckinCount(eventId: string, delta = 1): Promise<number> {
    const newCount = await this.redis.incrby(
      `event:${eventId}:checkin:count`,
      delta,
    );
    // 触发 stream 重建（异步，不阻塞调用方）
    setImmediate(() => this.rebuildStream(eventId).catch(() => {}));
    return newCount;
  }
}
