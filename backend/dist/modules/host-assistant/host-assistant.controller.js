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
exports.HostAssistantController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const host_assistant_service_1 = require("./host-assistant.service");
const event_service_1 = require("../event/event.service");
const typeorm_1 = require("@nestjs/typeorm");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const typeorm_2 = require("typeorm");
let HostAssistantController = class HostAssistantController {
    assistant;
    eventService;
    checkinRepo;
    constructor(assistant, eventService, checkinRepo) {
        this.assistant = assistant;
        this.eventService = eventService;
        this.checkinRepo = checkinRepo;
    }
    async getSuggestions(eventId, req) {
        const event = await this.eventService.findOne(eventId);
        const userId = req.user.userId;
        const isHostOrCoHost = event.host_id === userId ||
            (event.co_host_ids || []).includes(userId);
        if (!isHostOrCoHost) {
            throw new common_1.ForbiddenException('Only host or co-host can view suggestions');
        }
        const { state } = await this.eventService.getCurrentState(eventId);
        const checkinCount = await this.checkinRepo.count({
            where: { event_id: eventId },
        });
        const interactionCount = 0;
        const now = Date.now();
        const elapsedMs = event.state_started_at
            ? now - event.state_started_at
            : 0;
        const recentChangeMs = 0;
        const suggestions = this.assistant.generate({
            eventId,
            currentState: state,
            checkinCount,
            interactionCount,
            elapsedMs,
            recentChangeMs,
            previousState: event.previous_state,
        });
        return {
            event_id: eventId,
            current_state: state,
            suggestions,
            generated_at: now,
        };
    }
};
exports.HostAssistantController = HostAssistantController;
__decorate([
    (0, common_1.Get)(':event_id/suggestions'),
    __param(0, (0, common_1.Param)('event_id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HostAssistantController.prototype, "getSuggestions", null);
exports.HostAssistantController = HostAssistantController = __decorate([
    (0, common_1.Controller)('event'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(2, (0, typeorm_1.InjectRepository)(checkin_entity_1.CheckIn)),
    __metadata("design:paramtypes", [host_assistant_service_1.HostAssistantService,
        event_service_1.EventService,
        typeorm_2.Repository])
], HostAssistantController);
//# sourceMappingURL=host-assistant.controller.js.map