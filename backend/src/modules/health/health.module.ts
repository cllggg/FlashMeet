import { Module, Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  uptime_s: number;
  db: { ok: boolean; latency_ms?: number; error?: string };
  redis: { enabled: boolean; ok: boolean; latency_ms?: number; error?: string };
  pid: number;
  ts: number;
}

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  async check(): Promise<HealthCheck> {
    const db = await this.checkDb();
    const redis = await this.checkRedis();
    const ok = db.ok && redis.ok;
    return {
      status: ok ? 'ok' : redis.enabled ? 'degraded' : 'down',
      uptime_s: Math.floor(process.uptime()),
      db,
      redis,
      pid: process.pid,
      ts: Date.now(),
    };
  }

  private async checkDb(): Promise<HealthCheck['db']> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { ok: true, latency_ms: Date.now() - start };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  private async checkRedis(): Promise<HealthCheck['redis']> {
    const enabled =
      process.env.REDIS_ENABLED === undefined
        ? true
        : process.env.REDIS_ENABLED === 'true';
    if (!enabled) {
      return { enabled: false, ok: true };
    }
    const start = Date.now();
    try {
      await this.redis.ping();
      return { enabled: true, ok: true, latency_ms: Date.now() - start };
    } catch (err) {
      return { enabled: true, ok: false, error: (err as Error).message };
    }
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
