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
const event_emitter_1 = require("@nestjs/event-emitter");
const checkin_entity_1 = require("./entities/checkin.entity");
const global_user_entity_1 = require("../global-user/entities/global-user.entity");
const event_entity_1 = require("../event/entities/event.entity");
const event_status_enum_1 = require("../../common/enums/event-status.enum");
const app_events_1 = require("../../common/constants/app-events");
const display_id_1 = require("../../common/utils/display-id");
const user_token_1 = require("../../common/utils/user-token");
let CheckinService = class CheckinService {
    checkinRepo;
    eventRepo;
    userRepo;
    emitter;
    constructor(checkinRepo, eventRepo, userRepo, emitter) {
        this.checkinRepo = checkinRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.emitter = emitter;
    }
    async checkIn(userId, dto) {
        const event = await this.eventRepo.findOne({
            where: { event_id: dto.event_id },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.current_state !== event_status_enum_1.EventStatus.CHECKIN &&
            event.current_state !== event_status_enum_1.EventStatus.STANDBY) {
            throw new common_1.BadRequestException(`签到已关闭，当前活动状态为 ${event.current_state}`);
        }
        const existing = await this.checkinRepo.findOne({
            where: { event_id: dto.event_id, user_id: userId },
        });
        if (existing) {
            if (dto.display_id && !existing.display_id) {
                existing.display_id = dto.display_id;
                await this.checkinRepo.save(existing);
            }
            if (dto.local_tags && dto.local_tags.length > 0) {
                existing.local_tags = [
                    ...new Set([...existing.local_tags, ...dto.local_tags]),
                ];
                return this.checkinRepo.save(existing);
            }
            return existing;
        }
        const display_id = dto.display_id
            ? dto.display_id
            : await this.allocateDisplayId(dto.event_id, dto.name);
        const checkin = this.checkinRepo.create({
            event_id: dto.event_id,
            user_id: userId,
            name: dto.name,
            display_id,
            local_tags: dto.local_tags || [],
            is_invisible: dto.is_invisible || false,
        });
        const saved = await this.checkinRepo.save(checkin);
        await this.userRepo.increment({ user_id: userId }, 'event_participated_count', 1);
        this.emitter.emit(app_events_1.APP_EVENTS.CHECKIN_CREATED, {
            event_id: dto.event_id,
            user: {
                user_id: saved.user_id,
                name: saved.name,
                display_id: saved.display_id,
                local_tags: saved.local_tags,
            },
        });
        return saved;
    }
    async guestCheckIn(dto, deviceToken) {
        const event = await this.eventRepo.findOne({
            where: { event_id: dto.event_id },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.current_state !== event_status_enum_1.EventStatus.CHECKIN &&
            event.current_state !== event_status_enum_1.EventStatus.STANDBY) {
            throw new common_1.BadRequestException(`签到已关闭，当前活动状态为 ${event.current_state}`);
        }
        const phone = dto.phone?.trim();
        const token = deviceToken?.trim();
        const userToken = dto.user_token?.trim();
        let user = null;
        let recall_key = 'new';
        if (userToken) {
            user = await this.userRepo.findOne({ where: { user_token: userToken } });
            if (user)
                recall_key = 'user_token';
        }
        if (!user && token) {
            user = await this.userRepo.findOne({ where: { device_id: token } });
            if (user)
                recall_key = 'device_id';
        }
        if (!user && token) {
            user = await this.userRepo.findOne({
                where: { wechat_openid: `device:${token}` },
            });
            if (user)
                recall_key = 'wechat_openid';
        }
        if (!user && phone) {
            user = await this.userRepo.findOne({ where: { phone } });
            if (user)
                recall_key = 'phone';
        }
        let isNew = false;
        if (!user) {
            const newUser = {
                wechat_openid: token
                    ? `device:${token}`
                    : `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                nickname: dto.name || '暗星',
                avatar_url: dto.avatar_url || '',
                phone: phone || '',
                user_token: (0, user_token_1.generateUserToken)(),
                role: 'user',
            };
            if (token)
                newUser.device_id = token;
            user = this.userRepo.create(newUser);
            user = await this.userRepo.save(user);
            isNew = true;
        }
        else {
            if (!user.user_token) {
                user.user_token = (0, user_token_1.generateUserToken)();
            }
            if (token && !user.device_id) {
                user.device_id = token;
            }
            if (dto.name && dto.name !== user.nickname) {
                user.nickname = dto.name;
            }
            if (dto.avatar_url && dto.avatar_url !== user.avatar_url) {
                user.avatar_url = dto.avatar_url;
            }
            if (phone && !user.phone) {
                user.phone = phone;
            }
            user = await this.userRepo.save(user);
        }
        let existing = await this.checkinRepo.findOne({
            where: { event_id: dto.event_id, user_id: user.user_id },
        });
        if (existing) {
            if (dto.display_id && !existing.display_id) {
                existing.display_id = dto.display_id;
                existing = await this.checkinRepo.save(existing);
            }
            return { checkin: existing, user, isNew: false, recall_key };
        }
        const display_id = dto.display_id
            ? dto.display_id
            : await this.allocateDisplayId(dto.event_id, dto.name || user.nickname);
        const checkin = this.checkinRepo.create({
            event_id: dto.event_id,
            user_id: user.user_id,
            name: dto.name || user.nickname,
            display_id,
            local_tags: dto.local_tags || [],
            is_invisible: false,
        });
        const saved = await this.checkinRepo.save(checkin);
        await this.userRepo.increment({ user_id: user.user_id }, 'event_participated_count', 1);
        this.emitter.emit(app_events_1.APP_EVENTS.CHECKIN_CREATED, {
            event_id: dto.event_id,
            user: {
                user_id: saved.user_id,
                name: saved.name,
                display_id: saved.display_id,
                local_tags: saved.local_tags,
                avatar_url: user.avatar_url,
            },
        });
        return { checkin: saved, user, isNew, recall_key };
    }
    async resolve(eventId, deviceToken, userToken, phone) {
        if (!eventId) {
            throw new common_1.BadRequestException('Missing event_id');
        }
        const token = deviceToken?.trim();
        const ut = userToken?.trim();
        const ph = phone?.trim();
        if (!token && !ut && !ph) {
            return { found: false, event_id: eventId };
        }
        let user = null;
        let recall_key;
        if (ut) {
            user = await this.userRepo.findOne({ where: { user_token: ut } });
            if (user)
                recall_key = 'user_token';
        }
        if (!user && token) {
            user = await this.userRepo.findOne({ where: { device_id: token } });
            if (user)
                recall_key = 'device_id';
        }
        if (!user && token) {
            user = await this.userRepo.findOne({
                where: { wechat_openid: `device:${token}` },
            });
            if (user)
                recall_key = 'wechat_openid';
        }
        if (!user && ph) {
            user = await this.userRepo.findOne({ where: { phone: ph } });
            if (user)
                recall_key = 'phone';
        }
        if (!user) {
            return { found: false, event_id: eventId };
        }
        const checkin = await this.checkinRepo.findOne({
            where: { event_id: eventId, user_id: user.user_id },
        });
        if (!checkin) {
            return {
                found: false,
                event_id: eventId,
                user_id: user.user_id,
                user_token: user.user_token,
                name: user.nickname,
                nickname: user.nickname,
                phone: user.phone,
                avatar_url: user.avatar_url,
                is_repeat: false,
                recall_key,
            };
        }
        return {
            found: true,
            event_id: eventId,
            user_id: user.user_id,
            user_token: user.user_token,
            display_id: checkin.display_id,
            name: checkin.name,
            avatar_url: user.avatar_url,
            checked_in_at: checkin.checked_in_at,
            local_tags: checkin.local_tags,
            is_repeat: true,
            recall_key,
        };
    }
    async allocateDisplayId(eventId, name) {
        const existing = await this.checkinRepo.find({
            where: { event_id: eventId },
            select: ['display_id'],
        });
        const taken = new Set(existing
            .map((c) => c.display_id)
            .filter((x) => !!x));
        return (0, display_id_1.generateDisplayId)(name, taken);
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
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], CheckinService);
//# sourceMappingURL=checkin.service.js.map