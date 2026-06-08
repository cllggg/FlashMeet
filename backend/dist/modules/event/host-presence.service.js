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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HostPresenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostPresenceService = exports.HOST_PRIMARY_KEY = exports.HOST_PRESENCE_KEY = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const event_emitter_1 = require("@nestjs/event-emitter");
const app_events_1 = require("../../common/constants/app-events");
const HOST_PRESENCE_KEY = (eventId) => `event:${eventId}:hosts:present`;
exports.HOST_PRESENCE_KEY = HOST_PRESENCE_KEY;
const HOST_PRIMARY_KEY = (eventId) => `event:${eventId}:host:primary`;
exports.HOST_PRIMARY_KEY = HOST_PRIMARY_KEY;
let HostPresenceService = class HostPresenceService {
    static { HostPresenceService_1 = this; }
    redis;
    emitter;
    logger = new common_1.Logger(HostPresenceService_1.name);
    localPresence = new Map();
    localPrimary = new Map();
    lastHeartbeat = new Map();
    static HEARTBEAT_COOLDOWN_MS = 2000;
    static HEARTBEAT_TTL_S = 12;
    static SWEEP_INTERVAL_MS = 5000;
    sweepTimer = null;
    constructor(redis, emitter) {
        this.redis = redis;
        this.emitter = emitter;
    }
    start() {
        if (this.sweepTimer)
            return;
        this.sweepTimer = setInterval(() => this.sweepAll(), HostPresenceService_1.SWEEP_INTERVAL_MS);
        this.logger.log('HostPresenceService sweep started');
    }
    stop() {
        if (this.sweepTimer) {
            clearInterval(this.sweepTimer);
            this.sweepTimer = null;
        }
    }
    async recordHeartbeat(eventId, userId) {
        const now = Date.now();
        const last = this.lastHeartbeat.get(`${eventId}:${userId}`) || 0;
        if (now - last < HostPresenceService_1.HEARTBEAT_COOLDOWN_MS)
            return;
        this.lastHeartbeat.set(`${eventId}:${userId}`, now);
        const key = (0, exports.HOST_PRESENCE_KEY)(eventId);
        const score = now;
        try {
            if (typeof this.redis.zadd === 'function') {
                await this.redis.zadd(key, score, userId);
                if (typeof this.redis.zremrangebyscore === 'function') {
                    await this.redis.zremrangebyscore(key, 0, now - 30_000);
                }
                await this.redis.expire(key, 60);
            }
            else {
                throw new Error('zadd unavailable');
            }
        }
        catch {
            if (!this.localPresence.has(eventId)) {
                this.localPresence.set(eventId, new Map());
            }
            this.localPresence.get(eventId).set(userId, score);
        }
    }
    async setPrimary(eventId, hostId) {
        try {
            await this.redis.set((0, exports.HOST_PRIMARY_KEY)(eventId), hostId, 'EX', 3600);
        }
        catch {
            this.localPrimary.set(eventId, hostId);
        }
    }
    async listActive(eventId) {
        const key = (0, exports.HOST_PRESENCE_KEY)(eventId);
        try {
            if (typeof this.redis.zrevrange === 'function') {
                const ids = (await this.redis.zrevrange(key, 0, -1));
                if (ids.length === 0)
                    return [];
                const scores = await Promise.all(ids.map((uid) => this.redis.zscore(key, uid)));
                return ids.map((uid, i) => ({
                    user_id: uid,
                    ts: parseInt(scores[i] || '0', 10),
                }));
            }
        }
        catch { }
        const map = this.localPresence.get(eventId);
        if (!map)
            return [];
        return Array.from(map.entries())
            .map(([user_id, ts]) => ({ user_id, ts }))
            .sort((a, b) => b.ts - a.ts);
    }
    async sweepAll() {
        const allEventIds = new Set();
        try {
            if (typeof this.redis.keys === 'function') {
                const keys = (await this.redis.keys('event:*:host:primary'));
                for (const k of keys) {
                    const m = k.match(/^event:([^:]+):host:primary$/);
                    if (m)
                        allEventIds.add(m[1]);
                }
            }
        }
        catch { }
        for (const eid of this.localPrimary.keys())
            allEventIds.add(eid);
        for (const eid of allEventIds) {
            await this.checkAndPromote(eid).catch((err) => this.logger.warn(`Sweep error for ${eid}: ${err}`));
        }
    }
    async checkAndPromote(eventId) {
        const primary = await this.getPrimary(eventId);
        if (!primary)
            return;
        const active = await this.listActive(eventId);
        const primaryStillActive = active.some((a) => a.user_id === primary && Date.now() - a.ts < HostPresenceService_1.HEARTBEAT_TTL_S * 1000);
        if (primaryStillActive) {
            this.emitter.emit(app_events_1.APP_EVENTS.HOST_HEARTBEAT, {
                event_id: eventId,
                user_id: primary,
                ok: true,
            });
            return;
        }
        const candidate = active
            .filter((a) => a.user_id !== primary && Date.now() - a.ts < HostPresenceService_1.HEARTBEAT_TTL_S * 1000)
            .sort((a, b) => b.ts - a.ts)[0];
        if (!candidate) {
            this.emitter.emit(app_events_1.APP_EVENTS.HOST_OFFLINE, {
                event_id: eventId,
                user_id: primary,
            });
            return;
        }
        await this.setPrimary(eventId, candidate.user_id);
        this.emitter.emit(app_events_1.APP_EVENTS.HOST_PROMOTED, {
            event_id: eventId,
            new_host_id: candidate.user_id,
            old_host_id: primary,
        });
        this.logger.log(`Promoted ${candidate.user_id} as new host of ${eventId} (old: ${primary})`);
    }
    async getPrimary(eventId) {
        try {
            const v = await this.redis.get((0, exports.HOST_PRIMARY_KEY)(eventId));
            if (v)
                return v;
        }
        catch { }
        return this.localPrimary.get(eventId) || null;
    }
};
exports.HostPresenceService = HostPresenceService;
exports.HostPresenceService = HostPresenceService = HostPresenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.Redis,
        event_emitter_1.EventEmitter2])
], HostPresenceService);
//# sourceMappingURL=host-presence.service.js.map