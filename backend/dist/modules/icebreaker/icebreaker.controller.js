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
exports.IcebreakerController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const icebreaker_service_1 = require("./icebreaker.service");
const create_icebreaker_dto_1 = require("./dto/create-icebreaker.dto");
const answer_icebreaker_dto_1 = require("./dto/answer-icebreaker.dto");
let IcebreakerController = class IcebreakerController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(req, dto) {
        return this.service.createQuestion(req.user.userId, dto);
    }
    async publish(req, questionId) {
        return this.service.publishQuestion(req.user.userId, questionId);
    }
    async close(req, eventId) {
        await this.service.closeQuestion(req.user.userId, eventId);
        return { ok: true };
    }
    async answer(req, dto) {
        return this.service.answer(req.user.userId, dto);
    }
    async answerGuest(dto, deviceToken, userToken) {
        return this.service.answerGuest(deviceToken || '', userToken || '', dto);
    }
    async list(eventId) {
        return this.service.listQuestions(eventId);
    }
    async starColors(eventId) {
        return this.service.getStarColors(eventId);
    }
    async current(eventId) {
        const q = await this.service.getCurrentQuestion(eventId);
        return { event_id: eventId, question: q };
    }
    async stats(eventId) {
        return this.service.getStats(eventId);
    }
};
exports.IcebreakerController = IcebreakerController;
__decorate([
    (0, common_1.Post)('question'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_icebreaker_dto_1.CreateIcebreakerDto]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('question/:question_id/publish'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('question_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)('event/:event_id/close'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "close", null);
__decorate([
    (0, common_1.Post)('answer'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, answer_icebreaker_dto_1.AnswerIcebreakerDto]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "answer", null);
__decorate([
    (0, common_1.Post)('answer/guest'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-device-token')),
    __param(2, (0, common_1.Headers)('x-user-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [answer_icebreaker_dto_1.AnswerIcebreakerDto, String, String]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "answerGuest", null);
__decorate([
    (0, common_1.Get)('event/:event_id/questions'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('event/:event_id/star_colors'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "starColors", null);
__decorate([
    (0, common_1.Get)('event/:event_id/current'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "current", null);
__decorate([
    (0, common_1.Get)('event/:event_id/stats'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IcebreakerController.prototype, "stats", null);
exports.IcebreakerController = IcebreakerController = __decorate([
    (0, common_1.Controller)('icebreaker'),
    __metadata("design:paramtypes", [icebreaker_service_1.IcebreakerService])
], IcebreakerController);
//# sourceMappingURL=icebreaker.controller.js.map