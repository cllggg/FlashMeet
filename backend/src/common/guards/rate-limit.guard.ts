import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * 速率限制守卫 — 防止接口被高频调用
 *
 * 设计文档 4.2 防超卖 & 5.4 防刷：
 * - 摇一摇接口每人每秒最多 10 次（人类极限）
 * - 抽奖接口每人每秒最多 1 次
 * - 其他接口默认每 IP 每秒 30 次
 *
 * 使用内存 Map 实现，生产环境应替换为 Redis
 */

const RATE_LIMIT_KEY = 'rateLimit';
const BAN_WINDOW_MS = 60_000; // 封禁 1 分钟
const BAN_THRESHOLD = 3; // 超限 3 次封禁

interface RateLimitConfig {
  /** 窗口大小（ms） */
  windowMs?: number;
  /** 窗口内最大请求数 */
  max?: number;
  /** 是否按用户 ID 限流（否则按 IP） */
  keyByUser?: boolean;
}

interface BucketEntry {
  count: number;
  resetAt: number;
  violations: number;
  bannedUntil: number;
}

// 内存存储：key -> bucket
const buckets = new Map<string, BucketEntry>();
const logger = new Logger('RateLimitGuard');

// 每 30 秒清理一次过期桶
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt && now > entry.bannedUntil) {
      buckets.delete(key);
    }
  }
}, 30_000);

export const RateLimit = (config: RateLimitConfig = {}) => {
  return (_target: any, _key?: string, descriptor?: any) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor?.value ?? _target);
    return descriptor;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!config) return true; // 无配置则放行

    const request = context.switchToHttp().getRequest();
    const windowMs = config.windowMs ?? 1000;
    const max = config.max ?? 30;

    // 构造 key
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const userId = request.user?.user_id || request.user?.id;
    const key = config.keyByUser && userId
      ? `rate:user:${userId}:${context.getHandler().name}`
      : `rate:ip:${ip}:${context.getHandler().name}`;

    const now = Date.now();
    let entry = buckets.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs, violations: 0, bannedUntil: 0 };
      buckets.set(key, entry);
    }

    // 封禁检查
    if (entry.bannedUntil > now) {
      logger.warn(`[RateLimit] Banned key=${key} until ${new Date(entry.bannedUntil).toISOString()}`);
      throw new HttpException(
        { code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count++;

    if (entry.count > max) {
      entry.violations++;
      if (entry.violations >= BAN_THRESHOLD) {
        entry.bannedUntil = now + BAN_WINDOW_MS;
        logger.warn(`[RateLimit] BANNED key=${key} for ${BAN_WINDOW_MS}ms`);
      }
      logger.warn(`[RateLimit] Exceeded key=${key} count=${entry.count} max=${max}`);
      throw new HttpException(
        { code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}