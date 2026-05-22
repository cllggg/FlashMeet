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
exports.ScreenController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("../event/entities/event.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const lottery_record_entity_1 = require("../lottery/entities/lottery-record.entity");
let ScreenController = class ScreenController {
    eventRepo;
    checkinRepo;
    lotteryRecordRepo;
    constructor(eventRepo, checkinRepo, lotteryRecordRepo) {
        this.eventRepo = eventRepo;
        this.checkinRepo = checkinRepo;
        this.lotteryRecordRepo = lotteryRecordRepo;
    }
    async getEvent(eventId) {
        const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
        if (!event)
            return null;
        return {
            event_id: event.event_id,
            title: event.title,
            description: event.description,
            current_state: event.current_state,
            location: event.location,
            scheduled_at: event.scheduled_at,
        };
    }
    async getCheckins(eventId) {
        const checkins = await this.checkinRepo.find({
            where: { event_id: eventId },
            relations: ['user'],
            order: { checked_in_at: 'ASC' },
        });
        return checkins.map((ci) => ({
            user_id: ci.user_id,
            name: ci.name || ci.user?.nickname || '暗星',
            nickname: ci.user?.nickname || '暗星',
            avatar_url: ci.user?.avatar_url || '',
            phone: ci.user?.phone || '',
            local_tags: ci.local_tags || [],
            checked_in_at: ci.checked_in_at,
        }));
    }
    async getWinners(eventId) {
        return this.lotteryRecordRepo.find({ where: { event_id: eventId } });
    }
};
exports.ScreenController = ScreenController;
__decorate([
    (0, common_1.Get)('event/:event_id'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScreenController.prototype, "getEvent", null);
__decorate([
    (0, common_1.Get)('event/:event_id/checkins'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScreenController.prototype, "getCheckins", null);
__decorate([
    (0, common_1.Get)('event/:event_id/winners'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScreenController.prototype, "getWinners", null);
exports.ScreenController = ScreenController = __decorate([
    (0, common_1.Controller)('screen'),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(checkin_entity_1.CheckIn)),
    __param(2, (0, typeorm_1.InjectRepository)(lottery_record_entity_1.LotteryRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ScreenController);
//# sourceMappingURL=screen.controller.js.map