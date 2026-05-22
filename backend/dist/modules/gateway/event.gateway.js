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
const ioredis_1 = require("ioredis");
const event_service_1 = require("../event/event.service");
const event_status_enum_1 = require("../../common/enums/event-status.enum");
const ws_event_enum_1 = require("../../common/enums/ws-event.enum");
let EventGateway = class EventGateway {
    static { EventGateway_1 = this; }
    redis;
    eventService;
    server;
    shakeRateLimit = new Map();
    static SHAKE_COOLDOWN_MS = 100;
    static SHAKE_BROADCAST_MS = 500;
    shakeScores = new Map();
    leaderboardIntervals = new Map();
    constructor(redis, eventService) {
        this.redis = redis;
        this.eventService = eventService;
    }
    async handleConnection(client) {
        const eventId = client.handshake.query.event_id;
        const role = client.handshake.query.role;
        if (!eventId) {
            client.disconnect();
            return;
        }
        client.join(`event:${eventId}`);
        try {
            const { state } = await this.eventService.getCurrentState(eventId);
            client.emit(ws_event_enum_1.WsEvent.SCENE_UPDATED, { state, event_id: eventId });
        }
        catch {
        }
        console.log(`Client ${client.id} connected to event ${eventId} as ${role}`);
    }
    async handleDisconnect(client) {
        console.log(`Client ${client.id} disconnected`);
    }
    async handleJoinRoom(client, data) {
        client.join(`event:${data.event_id}`);
        client.data.eventId = data.event_id;
        client.data.role = data.role;
        const { state } = await this.eventService.getCurrentState(data.event_id);
        client.emit(ws_event_enum_1.WsEvent.SCENE_UPDATED, { state, event_id: data.event_id });
    }
    async handleChangeScene(client, data) {
        const { event_id, target_state, user_id } = data;
        const newState = await this.eventService.changeScene(event_id, target_state, user_id);
        this.server.to(`event:${event_id}`).emit(ws_event_enum_1.WsEvent.SCENE_UPDATED, {
            state: newState,
            event_id,
        });
        if (target_state === event_status_enum_1.EventStatus.GAME_SHAKE) {
            this.startShakeLeaderboard(event_id);
        }
        else {
            this.stopShakeLeaderboard(event_id);
        }
    }
    async handleShakeAction(client, data) {
        const { event_id, user_id, count } = data;
        const now = Date.now();
        const lastShake = this.shakeRateLimit.get(user_id) || 0;
        if (now - lastShake < EventGateway_1.SHAKE_COOLDOWN_MS) {
            return;
        }
        this.shakeRateLimit.set(user_id, now);
        const cappedCount = Math.min(count, 10);
        if (!this.shakeScores.has(event_id)) {
            this.shakeScores.set(event_id, new Map());
        }
        const eventScores = this.shakeScores.get(event_id);
        const currentScore = eventScores.get(user_id) || 0;
        eventScores.set(user_id, currentScore + cappedCount);
    }
    startShakeLeaderboard(eventId) {
        if (this.leaderboardIntervals.has(eventId))
            return;
        const interval = setInterval(() => {
            const scores = this.shakeScores.get(eventId);
            if (!scores)
                return;
            const leaderboard = Array.from(scores.entries())
                .map(([user_id, score]) => ({ user_id, score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 20);
            this.server
                .to(`event:${eventId}`)
                .emit(ws_event_enum_1.WsEvent.SHAKE_LEADERBOARD_TICK, {
                event_id: eventId,
                leaderboard,
            });
        }, EventGateway_1.SHAKE_BROADCAST_MS);
        this.leaderboardIntervals.set(eventId, interval);
    }
    stopShakeLeaderboard(eventId) {
        const interval = this.leaderboardIntervals.get(eventId);
        if (interval) {
            clearInterval(interval);
            this.leaderboardIntervals.delete(eventId);
        }
        this.shakeScores.delete(eventId);
    }
    notifyUserCheckedIn(eventId, user) {
        this.server.to(`event:${eventId}`).emit(ws_event_enum_1.WsEvent.USER_CHECKED_IN, {
            event_id: eventId,
            user,
        });
    }
    announceLotteryWinner(eventId, winner) {
        this.server
            .to(`event:${eventId}`)
            .emit(ws_event_enum_1.WsEvent.LOTTERY_WINNER_ANNOUNCE, {
            event_id: eventId,
            winner,
        });
    }
    broadcastSceneChange(eventId, newState) {
        this.server.to(`event:${eventId}`).emit(ws_event_enum_1.WsEvent.SCENE_UPDATED, {
            state: newState,
            event_id: eventId,
        });
        if (newState === event_status_enum_1.EventStatus.GAME_SHAKE) {
            this.startShakeLeaderboard(eventId);
        }
        else {
            this.stopShakeLeaderboard(eventId);
        }
    }
    handleShakeRest(eventId, userId, count) {
        const now = Date.now();
        const lastShake = this.shakeRateLimit.get(userId) || 0;
        if (now - lastShake < EventGateway_1.SHAKE_COOLDOWN_MS) {
            return;
        }
        this.shakeRateLimit.set(userId, now);
        const cappedCount = Math.min(count, 10);
        if (!this.shakeScores.has(eventId)) {
            this.shakeScores.set(eventId, new Map());
        }
        const eventScores = this.shakeScores.get(eventId);
        const currentScore = eventScores.get(userId) || 0;
        eventScores.set(userId, currentScore + cappedCount);
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
exports.EventGateway = EventGateway = EventGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', credentials: true },
        transports: ['polling', 'websocket'],
    }),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.Redis,
        event_service_1.EventService])
], EventGateway);
//# sourceMappingURL=event.gateway.js.map