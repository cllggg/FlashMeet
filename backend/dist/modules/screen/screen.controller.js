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
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("../event/entities/event.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const lottery_record_entity_1 = require("../lottery/entities/lottery-record.entity");
const event_gateway_1 = require("../gateway/event.gateway");
let ScreenController = class ScreenController {
    eventRepo;
    checkinRepo;
    lotteryRecordRepo;
    config;
    gateway;
    constructor(eventRepo, checkinRepo, lotteryRecordRepo, config, gateway) {
        this.eventRepo = eventRepo;
        this.checkinRepo = checkinRepo;
        this.lotteryRecordRepo = lotteryRecordRepo;
        this.config = config;
        this.gateway = gateway;
    }
    async getEvent(eventId) {
        const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
        if (!event)
            return null;
        const joinUrl = this.config.get('SCREEN_JOIN_URL') ||
            `/#/pages/live/index?eventId=${event.event_id}`;
        return {
            event_id: event.event_id,
            title: event.title,
            description: event.description,
            current_state: event.current_state,
            location: event.location,
            scheduled_at: event.scheduled_at,
            join_url: joinUrl,
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
            display_id: ci.display_id || null,
            avatar_url: ci.user?.avatar_url || '',
            phone: ci.user?.phone || '',
            local_tags: ci.local_tags || [],
            checked_in_at: ci.checked_in_at,
        }));
    }
    async getWinners(eventId) {
        const records = await this.lotteryRecordRepo.find({
            where: { event_id: eventId },
            relations: ['user'],
            order: { won_at: 'ASC' },
        });
        if (records.length > 0) {
            const userIds = [...new Set(records.map((r) => r.user_id))];
            const checkins = await this.checkinRepo
                .createQueryBuilder('c')
                .select(['c.user_id', 'c.display_id'])
                .where('c.event_id = :eid', { eid: eventId })
                .andWhere('c.user_id IN (:...uids)', { uids: userIds })
                .getRawMany();
            const map = new Map(checkins.map((c) => [c.c_user_id, c.c_display_id]));
            return records.map((r) => ({
                ...r,
                display_id: map.get(r.user_id) ?? null,
            }));
        }
        return records;
    }
    async getShakeSession(eventId) {
        const endsAt = this.gateway.getShakeSessionEndsAt(eventId);
        if (endsAt) {
            return { active: true, ends_at: endsAt, server_now: Date.now() };
        }
        const redisSession = await this.gateway.getShakeSessionRedis(eventId);
        if (redisSession) {
            return {
                active: redisSession.ends_at > Date.now(),
                ends_at: redisSession.ends_at,
                server_now: Date.now(),
            };
        }
        return { active: false, ends_at: null, server_now: Date.now() };
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
__decorate([
    (0, common_1.Get)('event/:event_id/shake-session'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScreenController.prototype, "getShakeSession", null);
exports.ScreenController = ScreenController = __decorate([
    (0, common_1.Controller)('screen'),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(checkin_entity_1.CheckIn)),
    __param(2, (0, typeorm_1.InjectRepository)(lottery_record_entity_1.LotteryRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        event_gateway_1.EventGateway])
], ScreenController);
//# sourceMappingURL=screen.controller.js.map