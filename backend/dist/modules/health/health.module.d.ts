import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
interface HealthCheck {
    status: 'ok' | 'degraded' | 'down';
    uptime_s: number;
    db: {
        ok: boolean;
        latency_ms?: number;
        error?: string;
    };
    redis: {
        enabled: boolean;
        ok: boolean;
        latency_ms?: number;
        error?: string;
    };
    pid: number;
    ts: number;
}
export declare class HealthController {
    private readonly dataSource;
    private readonly redis;
    constructor(dataSource: DataSource, redis: Redis);
    check(): Promise<HealthCheck>;
    private checkDb;
    private checkRedis;
}
export declare class HealthModule {
}
export {};
