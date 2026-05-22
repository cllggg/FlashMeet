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
const passport_1 = require("@nestjs/passport");
const event_service_1 = require("./event.service");
const event_gateway_1 = require("../gateway/event.gateway");
const create_event_dto_1 = require("./dto/create-event.dto");
const update_event_dto_1 = require("./dto/update-event.dto");
let EventController = class EventController {
    eventService;
    gateway;
    constructor(eventService, gateway) {
        this.eventService = eventService;
        this.gateway = gateway;
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
    async update(eventId, req, dto) {
        return this.eventService.update(eventId, req.user.userId, dto);
    }
    async publish(eventId, req) {
        return this.eventService.publish(eventId, req.user.userId);
    }
    async changeScene(eventId, req, body) {
        const newState = await this.eventService.changeScene(eventId, body.target_state, req.user.userId);
        this.gateway.broadcastSceneChange(eventId, newState);
        return { state: newState };
    }
    async shake(eventId, req, body) {
        this.gateway.handleShakeRest(eventId, req.user.userId, body.count || 1);
        return { ok: true };
    }
    async findByHost(req) {
        return this.eventService.findByHost(req.user.userId);
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
exports.EventController = EventController = __decorate([
    (0, common_1.Controller)('event'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => event_gateway_1.EventGateway))),
    __metadata("design:paramtypes", [event_service_1.EventService,
        event_gateway_1.EventGateway])
], EventController);
//# sourceMappingURL=event.controller.js.map