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
    store = new Map();
    ttlStore = new Map();
    set(key, value, options) {
        this.store.set(key, value);
        if (options?.EX) {
            this.ttlStore.set(key, Date.now() + options.EX * 1000);
        }
        return Promise.resolve('OK');
    }
    get(key) {
        const ttl = this.ttlStore.get(key);
        if (ttl && Date.now() > ttl) {
            this.store.delete(key);
            this.ttlStore.delete(key);
            return Promise.resolve(null);
        }
        return Promise.resolve(this.store.get(key) || null);
    }
    del(key) {
        const existed = this.store.has(key);
        this.store.delete(key);
        this.ttlStore.delete(key);
        return Promise.resolve(existed ? 1 : 0);
    }
    exists(key) {
        const ttl = this.ttlStore.get(key);
        if (ttl && Date.now() > ttl) {
            this.store.delete(key);
            this.ttlStore.delete(key);
            return Promise.resolve(0);
        }
        return Promise.resolve(this.store.has(key) ? 1 : 0);
    }
    incr(key) {
        const current = parseInt(this.store.get(key) || '0');
        this.store.set(key, (current + 1).toString());
        return Promise.resolve(current + 1);
    }
    decr(key) {
        const current = parseInt(this.store.get(key) || '0');
        this.store.set(key, (current - 1).toString());
        return Promise.resolve(current - 1);
    }
    keys(pattern) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return Promise.resolve(Array.from(this.store.keys()).filter(k => regex.test(k)));
    }
    publish(channel, message) {
        return Promise.resolve(0);
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