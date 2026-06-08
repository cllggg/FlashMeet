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
var ExperienceStreamService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceStreamService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const ioredis_1 = require("ioredis");
const app_events_1 = require("../../common/constants/app-events");
const experience_stream_types_1 = require("./experience-stream.types");
const host_assistant_service_1 = require("../host-assistant/host-assistant.service");
const event_service_1 = require("../event/event.service");
const HISTORY_MAX = 8;
const STREAM_TTL = 6 * 60 * 60;
let ExperienceStreamService = ExperienceStreamService_1 = class ExperienceStreamService {
    redis;
    assistant;
    eventService;
    logger = new common_1.Logger(ExperienceStreamService_1.name);
    listeners = new Set();
    constructor(redis, assistant, eventService) {
        this.redis = redis;
        this.assistant = assistant;
        this.eventService = eventService;
    }
    static key(eventId) {
        return `event:${eventId}:stream`;
    }
    async handleSceneChanged(payload) {
        try {
            const stream = await this.rebuildStream(payload.event_id);
            this.listeners.forEach((fn) => {
                try {
                    fn(payload.event_id, stream);
                }
                catch (e) {
                    this.logger.warn(`listener error: ${e}`);
                }
            });
        }
        catch (e) {
            this.logger.error(`Failed to rebuild stream for ${payload.event_id}: ${e}`);
        }
    }
    async handleCheckinCreated(payload) {
        try {
            await this.bumpCheckinCount(payload.event_id, 1);
        }
        catch (e) {
            this.logger.warn(`Failed to bump checkin count: ${e}`);
        }
    }
    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    async rebuildStream(eventId) {
        const { state } = await this.eventService.getCurrentState(eventId);
        const event = await this.eventService.findOne(eventId);
        const historyRaw = await this.redis.get(`${ExperienceStreamService_1.key(eventId)}:history`);
        const history = historyRaw
            ? JSON.parse(historyRaw)
            : [];
        const now = Date.now();
        const current = {
            type: state,
            startedAt: now,
        };
        const curIdx = experience_stream_types_1.STREAM_TIMELINE.indexOf(state);
        const queue = curIdx >= 0 && curIdx < experience_stream_types_1.STREAM_TIMELINE.length - 1
            ? experience_stream_types_1.STREAM_TIMELINE.slice(curIdx + 1).map((t) => ({
                type: t,
                startedAt: 0,
            }))
            : [];
        const prev = history.find((h) => !h.endedAt);
        if (prev && prev.type !== current.type) {
            prev.endedAt = now;
            history.push({ type: current.type, startedAt: now });
            const trimmed = history.slice(-HISTORY_MAX);
            await this.redis.set(`${ExperienceStreamService_1.key(eventId)}:history`, JSON.stringify(trimmed), 'EX', STREAM_TTL);
        }
        else if (!prev) {
            history.push({ type: current.type, startedAt: now });
            await this.redis.set(`${ExperienceStreamService_1.key(eventId)}:history`, JSON.stringify(history.slice(-HISTORY_MAX)), 'EX', STREAM_TTL);
        }
        const checkinCount = await this.redis.get(`event:${eventId}:checkin:count`);
        const interactionCount = await this.redis.get(`event:${eventId}:interaction:count`);
        const elapsedMs = now - current.startedAt;
        const suggestions = this.assistant.generate({
            eventId,
            currentState: current.type,
            checkinCount: Number(checkinCount) || 0,
            interactionCount: Number(interactionCount) || 0,
            elapsedMs,
            recentChangeMs: 0,
        });
        const stream = {
            current,
            queue,
            history: history.slice(-HISTORY_MAX),
            suggestions,
            meta: {
                eventId,
                title: event.title || '',
                state: current.type,
                checkinCount: Number(checkinCount) || 0,
                interactionCount: Number(interactionCount) || 0,
                lastUpdatedAt: now,
            },
        };
        await this.redis.set(ExperienceStreamService_1.key(eventId), JSON.stringify(stream), 'EX', STREAM_TTL);
        return stream;
    }
    async getStream(eventId) {
        const cached = await this.redis.get(ExperienceStreamService_1.key(eventId));
        if (cached) {
            try {
                return JSON.parse(cached);
            }
            catch {
            }
        }
        return this.rebuildStream(eventId);
    }
    async bumpCheckinCount(eventId, delta = 1) {
        const newCount = await this.redis.incrby(`event:${eventId}:checkin:count`, delta);
        setImmediate(() => this.rebuildStream(eventId).catch(() => { }));
        return newCount;
    }
};
exports.ExperienceStreamService = ExperienceStreamService;
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.SCENE_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExperienceStreamService.prototype, "handleSceneChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(app_events_1.APP_EVENTS.CHECKIN_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExperienceStreamService.prototype, "handleCheckinCreated", null);
exports.ExperienceStreamService = ExperienceStreamService = ExperienceStreamService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.Redis,
        host_assistant_service_1.HostAssistantService,
        event_service_1.EventService])
], ExperienceStreamService);
//# sourceMappingURL=experience-stream.service.js.map