"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShakeGuardMiddleware = void 0;
const common_1 = require("@nestjs/common");
const MAX_SHAKES_PER_SECOND = 10;
const BAN_DURATION_MS = 30_000;
const shakeMap = new Map();
const logger = new common_1.Logger('ShakeGuard');
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of shakeMap) {
        if (record.bannedUntil < now && record.timestamps.length === 0) {
            shakeMap.delete(key);
        }
    }
}, 10_000);
let ShakeGuardMiddleware = class ShakeGuardMiddleware {
    use(req, res, next) {
        const userId = req.user?.user_id || req.user?.id;
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const key = userId ? `shake:user:${userId}` : `shake:ip:${ip}`;
        const now = Date.now();
        let record = shakeMap.get(key);
        if (!record) {
            record = { timestamps: [], bannedUntil: 0 };
            shakeMap.set(key, record);
        }
        if (record.bannedUntil > now) {
            logger.warn(`[ShakeGuard] Banned user/IP=${key}`);
            return res.status(429).json({ code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' });
        }
        record.timestamps = record.timestamps.filter((t) => now - t < 1000);
        record.timestamps.push(now);
        if (record.timestamps.length > MAX_SHAKES_PER_SECOND) {
            record.bannedUntil = now + BAN_DURATION_MS;
            logger.warn(`[ShakeGuard] Abnormal shake detected: user/IP=${key} count=${record.timestamps.length}/s`);
            return res.status(429).json({ code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' });
        }
        next();
    }
};
exports.ShakeGuardMiddleware = ShakeGuardMiddleware;
exports.ShakeGuardMiddleware = ShakeGuardMiddleware = __decorate([
    (0, common_1.Injectable)()
], ShakeGuardMiddleware);
//# sourceMappingURL=shake-guard.middleware.js.map