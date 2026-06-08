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
const checkin_dto_1 = require("./dto/checkin.dto");
let CheckinController = class CheckinController {
    checkinService;
    constructor(checkinService) {
        this.checkinService = checkinService;
    }
    async guestCheckIn(dto, deviceToken) {
        return this.checkinService.guestCheckIn(dto, deviceToken);
    }
    async checkIn(req, dto) {
        return this.checkinService.checkIn(req.user.userId, dto);
    }
    async resolve(body, deviceToken, userTokenHeader) {
        const userToken = body?.user_token || userTokenHeader;
        return this.checkinService.resolve(body?.event_id, deviceToken, userToken, body?.phone);
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
    __param(1, (0, common_1.Headers)('x-device-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkin_dto_1.CheckInDto, String]),
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
    (0, common_1.Post)('resolve'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-device-token')),
    __param(2, (0, common_1.Headers)('x-user-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "resolve", null);
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
    __metadata("design:paramtypes", [checkin_service_1.CheckinService])
], CheckinController);
//# sourceMappingURL=checkin.controller.js.map