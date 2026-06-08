import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 摇一摇防刷中间件
 * 设计文档 5.4：人类极限 10 次/秒，超过阈值丢弃并标记异常
 */
const MAX_SHAKES_PER_SECOND = 10;
const BAN_DURATION_MS = 30_000; // 异常用户封禁 30s

interface ShakeRecord {
  timestamps: number[];
  bannedUntil: number;
}

const shakeMap = new Map<string, ShakeRecord>();
const logger = new Logger('ShakeGuard');

// 每 10 秒清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of shakeMap) {
    if (record.bannedUntil < now && record.timestamps.length === 0) {
      shakeMap.delete(key);
    }
  }
}, 10_000);

@Injectable()
export class ShakeGuardMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user?.user_id || (req as any).user?.id;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = userId ? `shake:user:${userId}` : `shake:ip:${ip}`;
    const now = Date.now();

    let record = shakeMap.get(key);
    if (!record) {
      record = { timestamps: [], bannedUntil: 0 };
      shakeMap.set(key, record);
    }

    // 封禁检查
    if (record.bannedUntil > now) {
      logger.warn(`[ShakeGuard] Banned user/IP=${key}`);
      return res.status(429).json({ code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' });
    }

    // 保留最近 1 秒的时间戳
    record.timestamps = record.timestamps.filter((t) => now - t < 1000);
    record.timestamps.push(now);

    if (record.timestamps.length > MAX_SHAKES_PER_SECOND) {
      record.bannedUntil = now + BAN_DURATION_MS;
      logger.warn(`[ShakeGuard] Abnormal shake detected: user/IP=${key} count=${record.timestamps.length}/s`);
      return res.status(429).json({ code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' });
    }

    next();
  }
}