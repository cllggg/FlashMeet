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
exports.EventController = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const passport_1 = require("@nestjs/passport");
const event_service_1 = require("./event.service");
const host_presence_service_1 = require("./host-presence.service");
const state_transitions_1 = require("../../common/enums/state-transitions");
const app_events_1 = require("../../common/constants/app-events");
const create_event_dto_1 = require("./dto/create-event.dto");
const update_event_dto_1 = require("./dto/update-event.dto");
let EventController = class EventController {
    eventService;
    emitter;
    hostPresence;
    constructor(eventService, emitter, hostPresence) {
        this.eventService = eventService;
        this.emitter = emitter;
        this.hostPresence = hostPresence;
    }
    async create(req, dto) {
        return this.eventService.create(req.user.userId, dto);
    }
    async findOne(eventId) {
        return this.eventService.findOne(eventId);
    }
    async getCurrentState(eventId) {
        return this.eventService.getCurrentState(eventId);
    }
    async getAllowedTransitions(eventId) {
        const { state } = await this.eventService.getCurrentState(eventId);
        return {
            current_state: state,
            allowed: state_transitions_1.ALLOWED_TRANSITIONS[state] || [],
        };
    }
    async update(eventId, req, dto) {
        return this.eventService.update(eventId, req.user.userId, dto);
    }
    async publish(eventId, req) {
        return this.eventService.publish(eventId, req.user.userId);
    }
    async changeScene(eventId, req, body) {
        const newState = await this.eventService.changeScene(eventId, body.target_state, req.user.userId);
        return { state: newState };
    }
    async shake(eventId, req, body) {
        this.emitter.emit(app_events_1.APP_EVENTS.SHAKE_UPDATED, {
            event_id: eventId,
            user_id: req.user.userId,
            count: body.count || 1,
        });
        return { ok: true };
    }
    async findByHost(req) {
        return this.eventService.findByHost(req.user.userId);
    }
    async presence(eventId, req) {
        const event = await this.eventService.findOne(eventId);
        const userId = req.user.userId;
        const isHostOrCoHost = event.host_id === userId ||
            (event.co_host_ids || []).includes(userId);
        if (!isHostOrCoHost) {
            throw new common_1.ForbiddenException('Only host or co-host can view presence');
        }
        const active = await this.hostPresence.listActive(eventId);
        return {
            event_id: eventId,
            primary_id: event.host_id,
            active,
            count: active.length,
        };
    }
};
exports.EventController = EventController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_event_dto_1.CreateEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':event_id'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':event_id/current_state'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getCurrentState", null);
__decorate([
    (0, common_1.Get)(':event_id/allowed_transitions'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getAllowedTransitions", null);
__decorate([
    (0, common_1.Patch)(':event_id'),
    __param(0, (0, common_1.Param)('event_id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_event_dto_1.UpdateEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':event_id/publish'),
    __param(0, (0, common_1.Param)('event_id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':event_id/change_scene'),
    __param(0, (0, common_1.Param)('event_id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "changeScene", null);
__decorate([
    (0, common_1.Post)(':event_id/shake'),
    __param(0, (0, common_1.Param)('event_id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "shake", null);
__decorate([
    (0, common_1.Get)('host/my'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "findByHost", null);
__decorate([
    (0, common_1.Get)(':event_id/presence'),
    __param(0, (0, common_1.Param)('event_id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "presence", null);
exports.EventController = EventController = __decorate([
    (0, common_1.Controller)('event'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [event_service_1.EventService,
        event_emitter_1.EventEmitter2,
        host_presence_service_1.HostPresenceService])
], EventController);
//# sourceMappingURL=event.controller.js.map