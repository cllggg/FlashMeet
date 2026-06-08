"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
class MemoryCache {
    stringStore = new Map();
    zsetStore = new Map();
    ttlStore = new Map();
    async set(key, value, options) {
        this.stringStore.set(key, value);
        if (options?.EX) {
            this.ttlStore.set(key, Date.now() + options.EX * 1000);
        }
        else {
            this.ttlStore.delete(key);
        }
        return 'OK';
    }
    async get(key) {
        this.expireIfNeeded(key);
        return this.stringStore.get(key) ?? null;
    }
    async del(key) {
        const existed = this.stringStore.delete(key) || this.zsetStore.delete(key);
        this.ttlStore.delete(key);
        return existed ? 1 : 0;
    }
    async exists(key) {
        this.expireIfNeeded(key);
        return this.stringStore.has(key) || this.zsetStore.has(key) ? 1 : 0;
    }
    async expire(key, seconds) {
        if (!this.stringStore.has(key) && !this.zsetStore.has(key))
            return 0;
        this.ttlStore.set(key, Date.now() + seconds * 1000);
        return 1;
    }
    async incr(key) {
        this.expireIfNeeded(key);
        const current = parseInt(this.stringStore.get(key) || '0', 10);
        const next = current + 1;
        this.stringStore.set(key, String(next));
        return next;
    }
    async decr(key) {
        this.expireIfNeeded(key);
        const current = parseInt(this.stringStore.get(key) || '0', 10);
        const next = current - 1;
        this.stringStore.set(key, String(next));
        return next;
    }
    async incrby(key, increment) {
        this.expireIfNeeded(key);
        const current = parseInt(this.stringStore.get(key) || '0', 10);
        const next = current + increment;
        this.stringStore.set(key, String(next));
        return next;
    }
    async decrby(key, decrement) {
        return this.incrby(key, -decrement);
    }
    async keys(pattern) {
        const regex = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
        const all = new Set([
            ...this.stringStore.keys(),
            ...this.zsetStore.keys(),
        ]);
        return Array.from(all).filter((k) => regex.test(k));
    }
    async publish(_channel, _message) {
        return 0;
    }
    async lpush(key, value) {
        this.expireIfNeeded(key);
        const current = this.stringStore.get(key) || '';
        const items = current ? current.split('\n') : [];
        items.unshift(value);
        this.stringStore.set(key, items.join('\n'));
        return items.length;
    }
    async zadd(key, score, member) {
        this.expireIfNeeded(key);
        if (!this.zsetStore.has(key))
            this.zsetStore.set(key, new Map());
        const set = this.zsetStore.get(key);
        const existed = set.has(member) ? 0 : 1;
        set.set(member, score);
        return existed;
    }
    async zincrby(key, increment, member) {
        this.expireIfNeeded(key);
        if (!this.zsetStore.has(key))
            this.zsetStore.set(key, new Map());
        const set = this.zsetStore.get(key);
        const next = (set.get(member) || 0) + increment;
        set.set(member, next);
        return next;
    }
    async zrevrange(key, start, stop, _withScores = false) {
        this.expireIfNeeded(key);
        const set = this.zsetStore.get(key);
        if (!set || set.size === 0)
            return [];
        const sorted = Array.from(set.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([m]) => m);
        return sorted.slice(start, stop + 1);
    }
    async zrevrangebyscore(key, max, min) {
        this.expireIfNeeded(key);
        const set = this.zsetStore.get(key);
        if (!set)
            return [];
        return Array.from(set.entries())
            .filter(([, score]) => score <= max && score >= min)
            .sort((a, b) => b[1] - a[1])
            .map(([m]) => m);
    }
    async zcard(key) {
        this.expireIfNeeded(key);
        return this.zsetStore.get(key)?.size ?? 0;
    }
    async zremrangebyscore(key, min, max) {
        this.expireIfNeeded(key);
        const set = this.zsetStore.get(key);
        if (!set)
            return 0;
        let removed = 0;
        for (const [member, score] of set.entries()) {
            if (score >= min && score <= max) {
                set.delete(member);
                removed++;
            }
        }
        return removed;
    }
    async zscore(key, member) {
        this.expireIfNeeded(key);
        const score = this.zsetStore.get(key)?.get(member);
        return score === undefined ? null : String(score);
    }
    async eval(script, numKeys, ...args) {
        if (numKeys < 1) {
            throw new Error('MemoryCache.eval: at least 1 key required');
        }
        const key = String(args[0]);
        if (script.includes("DECRBY") && script.includes("GET")) {
            this.expireIfNeeded(key);
            const stock = parseInt(this.stringStore.get(key) || '0', 10);
            if (stock <= 0)
                return -1;
            const next = stock - 1;
            this.stringStore.set(key, String(next));
            return next;
        }
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
    expireIfNeeded(key) {
        const ttl = this.ttlStore.get(key);
        if (ttl && Date.now() > ttl) {
            this.stringStore.delete(key);
            this.zsetStore.delete(key);
            this.ttlStore.delete(key);
        }
    }
}
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: 'REDIS_CLIENT',
                useFactory: (configService) => {
                    const enabled = configService.get('REDIS_ENABLED', 'true') === 'true';
                    if (!enabled) {
                        console.warn('[Redis] REDIS_ENABLED=false, using in-memory cache');
                        return new MemoryCache();
                    }
                    return new ioredis_1.default({
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6379),
                    });
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: ['REDIS_CLIENT'],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map