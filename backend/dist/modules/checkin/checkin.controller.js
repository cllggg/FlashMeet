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
exports.CheckinController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const checkin_service_1 = require("./checkin.service");
const event_gateway_1 = require("../gateway/event.gateway");
const checkin_dto_1 = require("./dto/checkin.dto");
let CheckinController = class CheckinController {
    checkinService;
    gateway;
    constructor(checkinService, gateway) {
        this.checkinService = checkinService;
        this.gateway = gateway;
    }
    async guestCheckIn(dto) {
        const { checkin, user, isNew } = await this.checkinService.guestCheckIn(dto);
        if (isNew) {
            this.gateway.notifyUserCheckedIn(dto.event_id, {
                user_id: user.user_id,
                nickname: user.nickname,
                name: checkin.name || user.nickname,
                avatar_url: user.avatar_url,
                phone: user.phone,
                local_tags: checkin.local_tags,
            });
        }
        return {
            checkin,
            user: { user_id: user.user_id, nickname: user.nickname, avatar_url: user.avatar_url, phone: user.phone },
            isNew,
        };
    }
    async checkIn(req, dto) {
        const result = await this.checkinService.checkIn(req.user.userId, dto);
        this.gateway.notifyUserCheckedIn(dto.event_id, {
            user_id: result.user_id,
            nickname: req.user.nickname || '暗星',
            name: result.name || req.user.nickname || '暗星',
            avatar_url: req.user.avatar_url,
            local_tags: result.local_tags,
        });
        return result;
    }
    async getCheckins(eventId) {
        return this.checkinService.getCheckins(eventId);
    }
    async getCheckinCount(eventId) {
        const count = await this.checkinService.getCheckinCount(eventId);
        return { count };
    }
    async updateTags(req, eventId, body) {
        return this.checkinService.updateTags(req.user.userId, eventId, body.tags);
    }
};
exports.CheckinController = CheckinController;
__decorate([
    (0, common_1.Post)('guest'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkin_dto_1.CheckInDto]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "guestCheckIn", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, checkin_dto_1.CheckInDto]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Get)('event/:event_id'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getCheckins", null);
__decorate([
    (0, common_1.Get)('event/:event_id/count'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getCheckinCount", null);
__decorate([
    (0, common_1.Patch)('event/:event_id/tags'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('event_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "updateTags", null);
exports.CheckinController = CheckinController = __decorate([
    (0, common_1.Controller)('checkin'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => event_gateway_1.EventGateway))),
    __metadata("design:paramtypes", [checkin_service_1.CheckinService,
        event_gateway_1.EventGateway])
], CheckinController);
//# sourceMappingURL=checkin.controller.js.map