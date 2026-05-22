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
exports.CheckinService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const checkin_entity_1 = require("./entities/checkin.entity");
const global_user_entity_1 = require("../global-user/entities/global-user.entity");
const event_entity_1 = require("../event/entities/event.entity");
let CheckinService = class CheckinService {
    checkinRepo;
    eventRepo;
    userRepo;
    constructor(checkinRepo, eventRepo, userRepo) {
        this.checkinRepo = checkinRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
    }
    async checkIn(userId, dto) {
        const existing = await this.checkinRepo.findOne({
            where: { event_id: dto.event_id, user_id: userId },
        });
        if (existing) {
            if (dto.local_tags && dto.local_tags.length > 0) {
                existing.local_tags = [
                    ...new Set([...existing.local_tags, ...dto.local_tags]),
                ];
                return this.checkinRepo.save(existing);
            }
            return existing;
        }
        const event = await this.eventRepo.findOne({
            where: { event_id: dto.event_id },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const checkin = this.checkinRepo.create({
            event_id: dto.event_id,
            user_id: userId,
            name: dto.name,
            local_tags: dto.local_tags || [],
            is_invisible: dto.is_invisible || false,
        });
        const saved = await this.checkinRepo.save(checkin);
        await this.userRepo.increment({ user_id: userId }, 'event_participated_count', 1);
        return saved;
    }
    async guestCheckIn(dto) {
        const event = await this.eventRepo.findOne({
            where: { event_id: dto.event_id },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const phone = dto.phone?.trim();
        let user = null;
        let isNew = false;
        if (phone) {
            user = await this.userRepo.findOne({ where: { phone } });
        }
        if (!user) {
            user = this.userRepo.create({
                wechat_openid: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                nickname: dto.name || '暗星',
                avatar_url: dto.avatar_url || '',
                phone: phone || '',
                role: 'user',
            });
            user = await this.userRepo.save(user);
            isNew = true;
        }
        else {
            if (dto.name && dto.name !== user.nickname) {
                user.nickname = dto.name;
                await this.userRepo.save(user);
            }
            if (dto.avatar_url && dto.avatar_url !== user.avatar_url) {
                user.avatar_url = dto.avatar_url;
                await this.userRepo.save(user);
            }
        }
        const existing = await this.checkinRepo.findOne({
            where: { event_id: dto.event_id, user_id: user.user_id },
        });
        if (existing) {
            return { checkin: existing, user, isNew: false };
        }
        const checkin = this.checkinRepo.create({
            event_id: dto.event_id,
            user_id: user.user_id,
            name: dto.name || user.nickname,
            local_tags: dto.local_tags || [],
            is_invisible: false,
        });
        const saved = await this.checkinRepo.save(checkin);
        await this.userRepo.increment({ user_id: user.user_id }, 'event_participated_count', 1);
        return { checkin: saved, user, isNew };
    }
    async getCheckins(eventId) {
        return this.checkinRepo.find({
            where: { event_id: eventId },
            relations: ['user'],
            order: { checked_in_at: 'ASC' },
        });
    }
    async getCheckinCount(eventId) {
        return this.checkinRepo.count({ where: { event_id: eventId } });
    }
    async updateTags(userId, eventId, tags) {
        const checkin = await this.checkinRepo.findOne({
            where: { event_id: eventId, user_id: userId },
        });
        if (!checkin)
            throw new common_1.NotFoundException('Check-in not found');
        checkin.local_tags = [...new Set([...checkin.local_tags, ...tags])];
        return this.checkinRepo.save(checkin);
    }
};
exports.CheckinService = CheckinService;
exports.CheckinService = CheckinService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(checkin_entity_1.CheckIn)),
    __param(1, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(2, (0, typeorm_1.InjectRepository)(global_user_entity_1.GlobalUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CheckinService);
//# sourceMappingURL=checkin.service.js.map