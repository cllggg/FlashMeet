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
var EventGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ioredis_1 = require("ioredis");
const event_service_1 = require("../event/event.service");
const host_presence_service_1 = require("../event/host-presence.service");
const global_user_entity_1 = require("../global-user/entities/global-user.entity");
const icebreaker_service_1 = require("../icebreaker/icebreaker.service");
const match_service_1 = require("../match/match.service");
const event_status_enum_1 = require("../../common/enums/event-status.enum");
const ws_event_enum_1 = require("../../common/enums/ws-event.enum");
const app_events_1 = require("../../common/constants/app-events");
let EventGateway = class EventGateway {
    static { EventGateway_1 = this; }
    redis;
    eventService;
    hostPresence;
    icebreakerService;
    matchService;
    userRepo;
    server;
    logger = new common_1.Logger(EventGateway_1.name);
    localShakeScores = new Map();
    shakeBuckets = new Map();
    leaderboardIntervals = new Map();
    static SHAKE_BUCKET_MS = 200;
    static SHAKE_MAX_PER_BUCKET = 50;
    static SHAKE_BROADCAST_MS = 500;
    static SHAKE_KEY = (eventId) => `event:${eventId}:shake:scores`;
    shakeActiveEvents = new Set();
    static SHAKE_ACTIVE_KEY = (eventId) => `event:${eventId}:shake:active`;
    async setShakeActive(eventId, active) {
        if (active) {
            this.shakeActiveEvents.add(eventId);
            try {
                await this.redis.set(EventGateway_1.SHAKE_ACTIVE_KEY(eventId), '1', 'EX', 3600);
            }
            catch { }
        }
        else {
            this.shakeActiveEvents.delete(eventId);
            try {
                await this.redis.del(EventGateway_1.SHAKE_ACTIVE_KEY(eventId));
            }
            catch { }
        }
    }
    async isShakeActive(eventId) {
        if (this.shakeActiveEvents.has(eventId))
            return true;
        try {
            const exists = await this.redis.exists(EventGateway_1.SHAKE_ACTIVE_KEY(eventId));
            if (exists) {
                this.shakeActiveEvents.add(eventId);
                return true;
            }
        }
        catch { }
        return false;
    }
    userInfoCache = new Map();
    static USER_CACHE_TTL_MS = 60 * 60 * 1000;
    constructor(redis, eventService, hostPresence, icebreakerService, matchService, userRepo) {
        this.redis = redis;
        this.eventService = eventService;
        this.hostPresence = hostPresence;
        this.icebreakerService = icebreakerService;
        this.matchService = matchService;
        this.userRepo = userRepo;
    }
    afterInit() {
        this.logger.log('EventGateway initialized');
        this.hostPresence.start();
        setInterval(() => this.gcShakeBuckets(), 30_000).unref();
    }
    gcShakeBuckets() {
        const now = Date.now();
        for (const [uid, b] of this.shakeBuckets.entries()) {
            if (now > b.flushAt + 5000) {
                this.shakeBuckets.delete(uid);
            }
        }
    }
    onModuleDestroy() {
        this.hostPresence.stop();
    }
    async handleConnection(client) {
        const eventId = client.handshake.query.event_id;
        const role = client.handshake.query.role;
        const userId = client.handshake.query.user_id;
        if (!eventId) {
            client.disconnect();
            return;
        }
        client.join(`event:${eventId}`);
        client.data.eventId = eventId;
        client.data.role = role;
        client.data.userId = userId;
        try {
            const { state } = await this.eventService.getCurrentState(eventId);
            client.emit(ws_event_enum_1.WsEvent.SCENE_UPDATED, { state, event_id: eventId });
            if (state === event_status_enum_1.EventStatus.ICEBREAKER) {
                const q = await this.icebreakerService.getCurrentQuestion(eventId);
                if (q) {
                    client.emit(ws_event_enum_1.WsEvent.ICEBREAKER_QUESTION, {
                        event_id: eventId,
                        question: q,
                    });
                }
            }
        }
        catch (err) {
            this.logger.warn(`Sync state failed for event ${eventId}: ${err}`);
        }
        this.logger.log(`Client ${client.id} connected to event ${eventId} as ${role}`);
    }
    async handleDisconnect(client) {
        this.logger.log(`Client ${client.id} disconnected`);
    }
    async handleJoinRoom(client, data) {
        client.join(`event:${data.event_id}`);
        client.data.eventId = data.event_id;
        client.data.role = data.role;
        const { state } = await this.eventService.getCurrentState(data.event_id);
        client.emit(ws_event_enum_1.WsEvent.SCENE_UPDATED, { state, event_id: data.event_id });
    }
    async handleChangeScene(client, data) {
        try {
            const newState = await this.eventService.changeScene(data.event_id, data.target_state, data.user_id);
            this.broadcastSceneChange(data.event_id, newState);
        }
        catch (err) {
            client.emit('error', { message: err.message });
        }
    }
    async handleShakeAction(_client, data) {
        this.accumulateShake(data.event_id, data.user_id, data.count || 1);
    }
    async handleHostHeartbeat(_client, data) {
        if (!data?.event_id || !data?.user_id)
            return;
        await this.hostPresence.recordHeartbeat(data.event_id, data.user_id);
    }
    async handleJoinMatchRoom(client, data) {
        if (!data?.match_id || !data?.user_id)
            return;
        const pair = await this.matchService
            .getMatchesByUser(data.match_id, data.user_id)
            .catch(() => null);
        if (!pair) {
            client.emit('error', { message: 'Match not found or not authorized' });
            return;
        }
        const room = `match:${data.match_id}`;
        client.join(room);
        this.logger.log(`Client ${client.id} joined match room ${room} as user ${data.user_id}`);
    }
    async handleMatchAccept(_client, data) {
        if (!data?.event_id || !data?.user_id)
            return;
        await this.matchService.acceptMatch(data.event_id, data.user_id);
    }
    async handleMatchReject(_client, data) {
        if (!data?.event_id || !data?.user_id)
            return;
        await this.matchService.rejectMatch(data.event_id, data.user_id);
    }
    handleCheckinCreated(payload) {
        this.server.to(`event:${payload.event_id}`).emit(ws_event_enum_1.WsEvent.USER_CHECKED_IN, {
            event_id: payload.event_id,
            user: payload.user,
        });
    }
    handleLotteryDrawn(payload) {
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.LOTTERY_WINNER_ANNOUNCE, {
            event_id: payload.event_id,
            winner: payload.winner,
        });
        const winnerUserId = payload.winner?.user_id;
        if (winnerUserId) {
            const sockets = this.server.sockets.sockets;
            sockets.forEach((s) => {
                if (s.data.userId === winnerUserId) {
                    s.emit(ws_event_enum_1.WsEvent.LOTTERY_WON, {
                        event_id: payload.event_id,
                        ...payload.winner,
                    });
                }
            });
        }
    }
    async handleSceneChanged(payload) {
        this.broadcastSceneChange(payload.event_id, payload.new_state);
        if (payload.new_state === event_status_enum_1.EventStatus.GAME_SHAKE) {
            await this.setShakeActive(payload.event_id, true);
            this.startShakeSession(payload.event_id);
        }
        else {
            await this.setShakeActive(payload.event_id, false);
            this.endShakeSession(payload.event_id);
        }
    }
    handleShakeUpdated(payload) {
        this.accumulateShake(payload.event_id, payload.user_id, payload.count);
    }
    handleIcebreakerPublished(payload) {
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.ICEBREAKER_QUESTION, {
            event_id: payload.event_id,
            question: payload.question,
        });
    }
    handleIcebreakerAnswered(payload) {
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.STAR_LIT_UP, {
            event_id: payload.event_id,
            user_id: payload.user_id,
            display_id: payload.display_id || null,
            name: payload.name || null,
            tag: payload.tag,
            color: payload.color,
            option_key: payload.option_key,
        });
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.ICEBREAKER_ANSWERED, {
            event_id: payload.event_id,
            user_id: payload.user_id,
            display_id: payload.display_id || null,
            name: payload.name || null,
            option_key: payload.option_key,
            tag: payload.tag,
            color: payload.color,
        });
    }
    handleIcebreakerClosed(payload) {
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.ICEBREAKER_CLOSED, {
            event_id: payload.event_id,
        });
    }
    handleHostPromoted(payload) {
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.HOST_CHANGED, {
            event_id: payload.event_id,
            new_host_id: payload.new_host_id,
            old_host_id: payload.old_host_id,
            reason: 'promoted',
        });
    }
    handleHostOffline(payload) {
        this.server.to(`event:${payload.event_id}`).emit(ws_event_enum_1.WsEvent.HOST_CHANGED, {
            event_id: payload.event_id,
            new_host_id: null,
            old_host_id: payload.user_id,
            reason: 'offline',
        });
    }
    async accumulateShake(eventId, userId, count) {
        if (!(await this.isShakeActive(eventId)))
            return;
        const safeCount = Math.max(0, Math.min(count, 10));
        if (safeCount === 0)
            return;
        const now = Date.now();
        const bucket = this.shakeBuckets.get(userId);
        if (bucket && now < bucket.flushAt) {
            bucket.count = Math.min(bucket.count + safeCount, EventGateway_1.SHAKE_MAX_PER_BUCKET);
            return;
        }
        if (bucket) {
            await this.flushShakeBucket(eventId, userId, bucket.count);
        }
        this.shakeBuckets.set(userId, {
            count: safeCount,
            flushAt: now + EventGateway_1.SHAKE_BUCKET_MS,
        });
        setTimeout(() => {
            const b = this.shakeBuckets.get(userId);
            if (b && Date.now() >= b.flushAt) {
                this.shakeBuckets.delete(userId);
                this.flushShakeBucket(eventId, userId, b.count).catch((err) => this.logger.warn(`flushShakeBucket err: ${err}`));
            }
        }, EventGateway_1.SHAKE_BUCKET_MS + 5);
    }
    async flushShakeBucket(eventId, userId, total) {
        if (total <= 0)
            return;
        const key = EventGateway_1.SHAKE_KEY(eventId);
        try {
            if (typeof this.redis.zincrby === 'function') {
                await this.redis.zincrby(key, total, userId);
                return;
            }
            throw new Error('zincrby unavailable');
        }
        catch {
            if (!this.localShakeScores.has(eventId)) {
                this.localShakeScores.set(eventId, new Map());
            }
            const map = this.localShakeScores.get(eventId);
            map.set(userId, (map.get(userId) || 0) + total);
        }
    }
    startShakeLeaderboard(eventId) {
        if (this.leaderboardIntervals.has(eventId))
            return;
        const tick = async () => {
            const top = await this.getShakeTopN(eventId, 20);
            if (top.length === 0)
                return;
            const enriched = await this.enrichUsers(top.map((p) => p.user_id));
            const payload = top.map((p) => ({
                user_id: p.user_id,
                score: p.score,
                ...(enriched[p.user_id] || {}),
            }));
            this.server
                .to(`event:${eventId}`)
                .emit(ws_event_enum_1.WsEvent.SHAKE_LEADERBOARD_TICK, {
                event_id: eventId,
                leaderboard: payload,
            });
        };
        const interval = setInterval(tick, EventGateway_1.SHAKE_BROADCAST_MS);
        this.leaderboardIntervals.set(eventId, interval);
    }
    static SHAKE_DEFAULT_DURATION_MS = 30_000;
    static SHAKE_SESSION_KEY = (eventId) => `event:${eventId}:shake:session`;
    shakeSessionTimers = new Map();
    shakeSessionEnds = new Map();
    startShakeSession(eventId, durationMs = EventGateway_1.SHAKE_DEFAULT_DURATION_MS) {
        this.endShakeSession(eventId, true);
        const endsAt = Date.now() + durationMs;
        this.shakeSessionEnds.set(eventId, endsAt);
        this.startShakeLeaderboard(eventId);
        try {
            this.redis.set(EventGateway_1.SHAKE_SESSION_KEY(eventId), JSON.stringify({ ends_at: endsAt, duration_ms: durationMs, started_at: Date.now() }), 'EX', Math.ceil(durationMs / 1000) + 10);
        }
        catch { }
        this.server.to(`event:${eventId}`).emit(ws_event_enum_1.WsEvent.SHAKE_STARTED, {
            event_id: eventId,
            started_at: Date.now(),
            ends_at: endsAt,
            duration_ms: durationMs,
        });
        const timer = setTimeout(() => this.endShakeSession(eventId), durationMs);
        this.shakeSessionTimers.set(eventId, timer);
    }
    async endShakeSession(eventId, silent = false) {
        const timer = this.shakeSessionTimers.get(eventId);
        if (timer) {
            clearTimeout(timer);
            this.shakeSessionTimers.delete(eventId);
        }
        this.shakeSessionEnds.delete(eventId);
        this.stopShakeLeaderboard(eventId);
        try {
            this.redis.del(EventGateway_1.SHAKE_SESSION_KEY(eventId));
        }
        catch { }
        if (silent)
            return;
        try {
            const top = await this.getShakeTopN(eventId, 5);
            const enriched = await this.enrichUsers(top.map((p) => p.user_id));
            const finalLeaderboard = top.map((p) => ({
                user_id: p.user_id,
                score: p.score,
                ...(enriched[p.user_id] || {}),
            }));
            this.server
                .to(`event:${eventId}`)
                .emit(ws_event_enum_1.WsEvent.SHAKE_ENDED, {
                event_id: eventId,
                final_leaderboard: finalLeaderboard,
            });
        }
        catch (err) {
            this.logger.warn(`endShakeSession failed: ${err}`);
        }
    }
    getShakeSessionEndsAt(eventId) {
        return this.shakeSessionEnds.get(eventId) ?? null;
    }
    async getShakeSessionRedis(eventId) {
        try {
            const raw = await this.redis.get(EventGateway_1.SHAKE_SESSION_KEY(eventId));
            if (raw)
                return JSON.parse(raw);
        }
        catch { }
        return null;
    }
    stopShakeLeaderboard(eventId) {
        const interval = this.leaderboardIntervals.get(eventId);
        if (interval) {
            clearInterval(interval);
            this.leaderboardIntervals.delete(eventId);
        }
        this.localShakeScores.delete(eventId);
        try {
            this.redis.del(EventGateway_1.SHAKE_KEY(eventId));
        }
        catch { }
    }
    async getShakeTopN(eventId, n) {
        const key = EventGateway_1.SHAKE_KEY(eventId);
        try {
            if (typeof this.redis.zrevrange === 'function') {
                const ids = (await this.redis.zrevrange(key, 0, n - 1));
                if (ids.length === 0)
                    return [];
                const scores = await Promise.all(ids.map((uid) => this.redis.zscore(key, uid)));
                return ids.map((uid, i) => ({
                    user_id: uid,
                    score: parseInt(scores[i] || '0', 10),
                }));
            }
        }
        catch { }
        const map = this.localShakeScores.get(eventId);
        if (!map)
            return [];
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([user_id, score]) => ({ user_id, score }));
    }
    broadcastSceneChange(eventId, newState) {
        this.server.to(`event:${eventId}`).emit(ws_event_enum_1.WsEvent.SCENE_UPDATED, {
            state: newState,
            event_id: eventId,
        });
        if (newState === event_status_enum_1.EventStatus.GAME_SHAKE) {
            this.startShakeLeaderboard(eventId);
        }
    }
    async enrichUsers(userIds) {
        const result = {};
        const toFetch = [];
        const now = Date.now();
        for (const uid of userIds) {
            const cached = this.userInfoCache.get(uid);
            if (cached && now - cached.ts < EventGateway_1.USER_CACHE_TTL_MS) {
                result[uid] = {
                    nickname: cached.nickname,
                    avatar_url: cached.avatar_url,
                };
            }
            else {
                toFetch.push(uid);
            }
        }
        if (toFetch.length === 0)
            return result;
        try {
            const users = await this.userRepo.find({
                where: toFetch.map((id) => ({ user_id: id })),
                select: ['user_id', 'nickname', 'avatar_url'],
            });
            for (const u of users) {
                result[u.user_id] = {
                    nickname: u.nickname || undefined,
                    avatar_url: u.avatar_url || undefined,
                };
                this.userInfoCache.set(u.user_id, {
                    nickname: u.nickname,
                    avatar_url: u.avatar_url,
                    ts: now,
                });
            }
        }
        catch (err) {
            this.logger.warn(`enrichUsers failed: ${err}`);
        }
        return result;
    }
    handleMatchGenerated(payload) {
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.MATCH_LINES, {
            event_id: payload.event_id,
            pairs: payload.pairs,
            total: payload.total,
        });
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.MATCH_RESULT, {
            event_id: payload.event_id,
            pairs: payload.pairs,
        });
    }
    handleMatchAccepted(payload) {
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.MATCH_ACCEPT, { event_id: payload.event_id, pair: payload.pair });
    }
    handleMatchRejected(payload) {
        this.server
            .to(`event:${payload.event_id}`)
            .emit(ws_event_enum_1.WsEvent.MATCH_REJECT, { event_id: payload.event_id, pair: payload.pair });
    }
    handleBlindChat(payload) {
        this.server
            .to(`match:${payload.match_id}`)
            .emit('blind_chat_message', { match_id: payload.match_id, message: payload.message });
    }
};
exports.EventGateway = EventGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(ws_event_enum_1.WsEvent.JOIN_ROOM),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ws_event_enum_1.WsEvent.HOST_CHANGE_SCENE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventGateway.prototype, "handleChangeScene", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ws_event_enum_1.WsEvent.USER_SHAKE_ACTION),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventGateway.prototype, "handleShakeAction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ws_event_enum_1.WsEvent.HOST_HEARTBEAT),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventGateway.prototype, "handleHostHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ws_event_enum_1.WsEvent.JOIN_MATCH_ROOM),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventGateway.prototype, "handleJoinMatchRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ws_event_enum_1.WsEvent.MATCH_ACCEPT),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventGateway.prototype, "handleMatchAccept", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(ws_event_enum_1.WsEvent.MATCH_REJECT),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventGateway.prototype, "handleMatchReject", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.CHECKIN_CREATED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleCheckinCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.LOTTERY_DRAWN, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleLotteryDrawn", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.SCENE_CHANGED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventGateway.prototype, "handleSceneChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.SHAKE_UPDATED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleShakeUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.ICEBREAKER_PUBLISHED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleIcebreakerPublished", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.ICEBREAKER_ANSWERED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleIcebreakerAnswered", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.ICEBREAKER_CLOSED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleIcebreakerClosed", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.HOST_PROMOTED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleHostPromoted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.HOST_OFFLINE, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleHostOffline", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.MATCH_GENERATED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleMatchGenerated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.MATCH_ACCEPTED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleMatchAccepted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.MATCH_REJECTED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleMatchRejected", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.MATCH_BLIND_CHAT, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventGateway.prototype, "handleBlindChat", null);
exports.EventGateway = EventGateway = EventGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', credentials: true },
        transports: ['polling', 'websocket'],
    }),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __param(5, (0, typeorm_1.InjectRepository)(global_user_entity_1.GlobalUser)),
    __metadata("design:paramtypes", [ioredis_1.Redis,
        event_service_1.EventService,
        host_presence_service_1.HostPresenceService,
        icebreaker_service_1.IcebreakerService,
        match_service_1.MatchService,
        typeorm_2.Repository])
], EventGateway);
//# sourceMappingURL=event.gateway.js.map