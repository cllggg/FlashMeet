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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = exports.EVENT_STATE_KEY = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("./entities/event.entity");
const event_status_enum_1 = require("../../common/enums/event-status.enum");
const ioredis_1 = require("ioredis");
const common_2 = require("@nestjs/common");
const EVENT_STATE_KEY = (eventId) => `event:${eventId}:state`;
exports.EVENT_STATE_KEY = EVENT_STATE_KEY;
let EventService = class EventService {
    eventRepo;
    redis;
    constructor(eventRepo, redis) {
        this.eventRepo = eventRepo;
        this.redis = redis;
    }
    async create(hostId, dto) {
        const event = this.eventRepo.create({
            ...dto,
            host_id: hostId,
            current_state: event_status_enum_1.EventStatus.STANDBY,
            settings: dto.settings || {},
        });
        const saved = await this.eventRepo.save(event);
        await this.redis.set((0, exports.EVENT_STATE_KEY)(saved.event_id), event_status_enum_1.EventStatus.STANDBY);
        return saved;
    }
    async findOne(eventId) {
        const event = await this.eventRepo.findOne({
            where: { event_id: eventId },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return event;
    }
    async getCurrentState(eventId) {
        const cached = await this.redis.get((0, exports.EVENT_STATE_KEY)(eventId));
        if (cached)
            return { state: cached };
        const event = await this.findOne(eventId);
        await this.redis.set((0, exports.EVENT_STATE_KEY)(eventId), event.current_state);
        return { state: event.current_state };
    }
    async update(eventId, userId, dto) {
        const event = await this.findOne(eventId);
        if (event.host_id !== userId) {
            if (!event.co_host_ids.includes(userId)) {
                throw new common_1.ForbiddenException('Only host or co-host can update event');
            }
        }
        Object.assign(event, dto);
        return this.eventRepo.save(event);
    }
    async publish(eventId, userId) {
        const event = await this.findOne(eventId);
        if (event.host_id !== userId) {
            throw new common_1.ForbiddenException('Only host can publish event');
        }
        event.is_published = true;
        return this.eventRepo.save(event);
    }
    async changeScene(eventId, targetState, userId) {
        const event = await this.findOne(eventId);
        if (event.host_id !== userId && !event.co_host_ids.includes(userId)) {
            throw new common_1.ForbiddenException('Only host or co-host can change scene');
        }
        event.current_state = targetState;
        await this.eventRepo.save(event);
        await this.redis.set((0, exports.EVENT_STATE_KEY)(eventId), targetState);
        return targetState;
    }
    async findByHost(hostId) {
        return this.eventRepo.find({ where: { host_id: hostId } });
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, common_2.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        ioredis_1.Redis])
], EventService);
//# sourceMappingURL=event.service.js.map