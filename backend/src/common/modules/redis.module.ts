import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

class MemoryCache {
  private store = new Map<string, string>();
  private ttlStore = new Map<string, number>();

  set(key: string, value: string, options?: { EX?: number }) {
    this.store.set(key, value);
    if (options?.EX) {
      this.ttlStore.set(key, Date.now() + options.EX * 1000);
    }
    return Promise.resolve('OK');
  }

  get(key: string): Promise<string | null> {
    const ttl = this.ttlStore.get(key);
    if (ttl && Date.now() > ttl) {
      this.store.delete(key);
      this.ttlStore.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(this.store.get(key) || null);
  }

  del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    this.ttlStore.delete(key);
    return Promise.resolve(existed ? 1 : 0);
  }

  exists(key: string): Promise<number> {
    const ttl = this.ttlStore.get(key);
    if (ttl && Date.now() > ttl) {
      this.store.delete(key);
      this.ttlStore.delete(key);
      return Promise.resolve(0);
    }
    return Promise.resolve(this.store.has(key) ? 1 : 0);
  }

  incr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0');
    this.store.set(key, (current + 1).toString());
    return Promise.resolve(current + 1);
  }

  decr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0');
    this.store.set(key, (current - 1).toString());
    return Promise.resolve(current - 1);
  }

  keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Promise.resolve(Array.from(this.store.keys()).filter(k => regex.test(k)));
  }

  publish(channel: string, message: string): Promise<number> {
    return Promise.resolve(0);
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