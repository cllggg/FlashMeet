import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * 内存版 Redis 兼容缓存
 *
 * 设计目标：在无 Redis 的开发/测试环境下，让抽奖 Lua 脚本、摇一摇 Sorted Set
 * 等高阶操作仍然能跑通，保证单机体验与生产一致。
 *
 * 注意：仅用于本地降级。多实例部署必须用真实 Redis（横向扩展下数据不共享）。
 */
class MemoryCache {
  private stringStore = new Map<string, string>();
  private zsetStore = new Map<string, Map<string, number>>(); // key -> (member -> score)
  private ttlStore = new Map<string, number>();

  // ── 基础 ─────────────────────────────────

  async set(
    key: string,
    value: string,
    options?: { EX?: number },
  ): Promise<'OK'> {
    this.stringStore.set(key, value);
    if (options?.EX) {
      this.ttlStore.set(key, Date.now() + options.EX * 1000);
    } else {
      this.ttlStore.delete(key);
    }
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    this.expireIfNeeded(key);
    return this.stringStore.get(key) ?? null;
  }

  async del(key: string): Promise<number> {
    const existed =
      this.stringStore.delete(key) || this.zsetStore.delete(key);
    this.ttlStore.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    this.expireIfNeeded(key);
    return this.stringStore.has(key) || this.zsetStore.has(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.stringStore.has(key) && !this.zsetStore.has(key)) return 0;
    this.ttlStore.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  async incr(key: string): Promise<number> {
    this.expireIfNeeded(key);
    const current = parseInt(this.stringStore.get(key) || '0', 10);
    const next = current + 1;
    this.stringStore.set(key, String(next));
    return next;
  }

  async decr(key: string): Promise<number> {
    this.expireIfNeeded(key);
    const current = parseInt(this.stringStore.get(key) || '0', 10);
    const next = current - 1;
    this.stringStore.set(key, String(next));
    return next;
  }

  async incrby(key: string, increment: number): Promise<number> {
    this.expireIfNeeded(key);
    const current = parseInt(this.stringStore.get(key) || '0', 10);
    const next = current + increment;
    this.stringStore.set(key, String(next));
    return next;
  }

  async decrby(key: string, decrement: number): Promise<number> {
    return this.incrby(key, -decrement);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
    );
    const all = new Set<string>([
      ...this.stringStore.keys(),
      ...this.zsetStore.keys(),
    ]);
    return Array.from(all).filter((k) => regex.test(k));
  }

  async publish(_channel: string, _message: string): Promise<number> {
    // 单机模式无 Pub/Sub 语义
    return 0;
  }

  async lpush(key: string, value: string): Promise<number> {
    // 简化实现：补偿队列降级为 strings 追加
    this.expireIfNeeded(key);
    const current = this.stringStore.get(key) || '';
    const items = current ? current.split('\n') : [];
    items.unshift(value);
    this.stringStore.set(key, items.join('\n'));
    return items.length;
  }

  // ── Sorted Set（摇一摇排行榜） ──────────

  async zadd(key: string, score: number, member: string): Promise<number> {
    this.expireIfNeeded(key);
    if (!this.zsetStore.has(key)) this.zsetStore.set(key, new Map());
    const set = this.zsetStore.get(key)!;
    const existed = set.has(member) ? 0 : 1;
    set.set(member, score);
    return existed;
  }

  async zincrby(key: string, increment: number, member: string): Promise<number> {
    this.expireIfNeeded(key);
    if (!this.zsetStore.has(key)) this.zsetStore.set(key, new Map());
    const set = this.zsetStore.get(key)!;
    const next = (set.get(member) || 0) + increment;
    set.set(member, next);
    return next;
  }

  async zrevrange(
    key: string,
    start: number,
    stop: number,
    _withScores = false,
  ): Promise<string[]> {
    this.expireIfNeeded(key);
    const set = this.zsetStore.get(key);
    if (!set || set.size === 0) return [];
    const sorted = Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m);
    // Redis 语义：stop 是包含的索引
    return sorted.slice(start, stop + 1);
  }

  async zrevrangebyscore(
    key: string,
    max: number,
    min: number,
  ): Promise<string[]> {
    this.expireIfNeeded(key);
    const set = this.zsetStore.get(key);
    if (!set) return [];
    return Array.from(set.entries())
      .filter(([, score]) => score <= max && score >= min)
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m);
  }

  async zcard(key: string): Promise<number> {
    this.expireIfNeeded(key);
    return this.zsetStore.get(key)?.size ?? 0;
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    this.expireIfNeeded(key);
    const set = this.zsetStore.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const [member, score] of set.entries()) {
      if (score >= min && score <= max) {
        set.delete(member);
        removed++;
      }
    }
    return removed;
  }

  async zscore(key: string, member: string): Promise<string | null> {
    this.expireIfNeeded(key);
    const score = this.zsetStore.get(key)?.get(member);
    return score === undefined ? null : String(score);
  }

  // ── Lua 脚本（抽奖扣库存） ──────────────

  /**
   * 简化版 Lua 语义：执行 deduct-prize.lua 逻辑
   * 返回 -1 表示库存不足
   */
  async eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown> {
    if (numKeys < 1) {
      throw new Error('MemoryCache.eval: at least 1 key required');
    }
    const key = String(args[0]);

    // 匹配 deduct-prize.lua 模板
    if (script.includes("DECRBY") && script.includes("GET")) {
      this.expireIfNeeded(key);
      const stock = parseInt(this.stringStore.get(key) || '0', 10);
      if (stock <= 0) return -1;
      const next = stock - 1;
      this.stringStore.set(key, String(next));
      return next;
    }

    // 匹配原子锁释放模板
    if (script.includes("redis.call('get'") && script.includes("redis.call('del'")) {
      this.expireIfNeeded(key);
      const val = this.stringStore.get(key);
      const expectedVal = String(args[1] ?? '');
      if (val === expectedVal) {
        this.stringStore.delete(key);
        return 1;
      }
      return 0;
    }

    // 匹配库存回滚模板
    if (script.includes("tonumber(v)") && script.includes("+ 1")) {
      this.expireIfNeeded(key);
      const val = this.stringStore.get(key);
      if (val) {
        const next = parseInt(val, 10) + 1;
        this.stringStore.set(key, String(next));
      }
      return 1;
    }

    throw new Error('MemoryCache.eval: unsupported script');
  }

  // ── 工具 ────────────────────────────────

  private expireIfNeeded(key: string): void {
    const ttl = this.ttlStore.get(key);
    if (ttl && Date.now() > ttl) {
      this.stringStore.delete(key);
      this.zsetStore.delete(key);
      this.ttlStore.delete(key);
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const enabled = configService.get('REDIS_ENABLED', 'true') === 'true';
        if (!enabled) {
          console.warn('[Redis] REDIS_ENABLED=false, using in-memory cache');
          return new MemoryCache();
        }
        return new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
