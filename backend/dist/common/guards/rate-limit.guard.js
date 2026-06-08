"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const RATE_LIMIT_KEY = 'rateLimit';
const BAN_WINDOW_MS = 60_000;
const BAN_THRESHOLD = 3;
const buckets = new Map();
const logger = new common_1.Logger('RateLimitGuard');
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
        if (now > entry.resetAt && now > entry.bannedUntil) {
            buckets.delete(key);
        }
    }
}, 30_000);
const RateLimit = (config = {}) => {
    return (_target, _key, descriptor) => {
        Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor?.value ?? _target);
        return descriptor;
    };
};
exports.RateLimit = RateLimit;
let RateLimitGuard = class RateLimitGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const config = this.reflector.get(RATE_LIMIT_KEY, context.getHandler());
        if (!config)
            return true;
        const request = context.switchToHttp().getRequest();
        const windowMs = config.windowMs ?? 1000;
        const max = config.max ?? 30;
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
        if (entry.bannedUntil > now) {
            logger.warn(`[RateLimit] Banned key=${key} until ${new Date(entry.bannedUntil).toISOString()}`);
            throw new common_1.HttpException({ code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        entry.count++;
        if (entry.count > max) {
            entry.violations++;
            if (entry.violations >= BAN_THRESHOLD) {
                entry.bannedUntil = now + BAN_WINDOW_MS;
                logger.warn(`[RateLimit] BANNED key=${key} for ${BAN_WINDOW_MS}ms`);
            }
            logger.warn(`[RateLimit] Exceeded key=${key} count=${entry.count} max=${max}`);
            throw new common_1.HttpException({ code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map