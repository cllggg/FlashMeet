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
exports.IcebreakerService = exports.CURRENT_QUESTION_KEY = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const ioredis_1 = require("ioredis");
const icebreaker_question_entity_1 = require("./entities/icebreaker-question.entity");
const icebreaker_answer_entity_1 = require("./entities/icebreaker-answer.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const event_entity_1 = require("../event/entities/event.entity");
const global_user_entity_1 = require("../global-user/entities/global-user.entity");
const event_status_enum_1 = require("../../common/enums/event-status.enum");
const app_events_1 = require("../../common/constants/app-events");
const CURRENT_QUESTION_KEY = (eventId) => `event:${eventId}:icebreaker:current`;
exports.CURRENT_QUESTION_KEY = CURRENT_QUESTION_KEY;
const CURRENT_QUESTION_TTL_S = 3600;
let IcebreakerService = class IcebreakerService {
    questionRepo;
    answerRepo;
    checkinRepo;
    eventRepo;
    userRepo;
    emitter;
    redis;
    constructor(questionRepo, answerRepo, checkinRepo, eventRepo, userRepo, emitter, redis) {
        this.questionRepo = questionRepo;
        this.answerRepo = answerRepo;
        this.checkinRepo = checkinRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.emitter = emitter;
        this.redis = redis;
    }
    async createQuestion(hostUserId, dto) {
        const event = await this.eventRepo.findOne({
            where: { event_id: dto.event_id },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.host_id !== hostUserId &&
            !event.co_host_ids.includes(hostUserId)) {
            throw new common_1.ForbiddenException('Only host or co-host can create icebreaker');
        }
        const question = this.questionRepo.create({
            event_id: dto.event_id,
            prompt: dto.prompt,
            options: dto.options,
            display_order: dto.display_order ?? 0,
        });
        return this.questionRepo.save(question);
    }
    async publishQuestion(hostUserId, questionId) {
        const question = await this.questionRepo.findOne({
            where: { question_id: questionId },
        });
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        const event = await this.eventRepo.findOne({
            where: { event_id: question.event_id },
        });
        if (!event ||
            (event.host_id !== hostUserId &&
                !event.co_host_ids.includes(hostUserId))) {
            throw new common_1.ForbiddenException('Only host or co-host can publish icebreaker');
        }
        this.emitter.emit(app_events_1.APP_EVENTS.ICEBREAKER_PUBLISHED, {
            event_id: question.event_id,
            question: {
                question_id: question.question_id,
                prompt: question.prompt,
                options: question.options,
            },
        });
        try {
            await this.redis.set((0, exports.CURRENT_QUESTION_KEY)(question.event_id), JSON.stringify({
                question_id: question.question_id,
                prompt: question.prompt,
                options: question.options,
                published_at: Date.now(),
            }), 'EX', CURRENT_QUESTION_TTL_S);
        }
        catch {
        }
        return question;
    }
    async closeQuestion(hostUserId, eventId) {
        const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.host_id !== hostUserId &&
            !event.co_host_ids.includes(hostUserId)) {
            throw new common_1.ForbiddenException('Only host or co-host can close icebreaker');
        }
        try {
            await this.redis.del((0, exports.CURRENT_QUESTION_KEY)(eventId));
        }
        catch { }
        this.emitter.emit(app_events_1.APP_EVENTS.ICEBREAKER_CLOSED, { event_id: eventId });
    }
    async getCurrentQuestion(eventId) {
        try {
            const v = await this.redis.get((0, exports.CURRENT_QUESTION_KEY)(eventId));
            if (v)
                return JSON.parse(v);
        }
        catch { }
        return null;
    }
    async answer(userId, dto) {
        const event = await this.eventRepo.findOne({
            where: { event_id: dto.event_id },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.current_state !== event_status_enum_1.EventStatus.ICEBREAKER) {
            throw new common_1.BadRequestException(`破冰环节未开启，当前活动状态为 ${event.current_state}`);
        }
        const question = await this.questionRepo.findOne({
            where: { question_id: dto.question_id, event_id: dto.event_id },
        });
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        const option = question.options.find((o) => o.key === dto.option_key);
        if (!option)
            throw new common_1.NotFoundException('Option not found');
        const compositeId = `${dto.event_id}:${userId}:${dto.question_id}`;
        const existing = await this.answerRepo.findOne({
            where: { id: compositeId },
        });
        if (existing) {
            throw new common_1.ConflictException('Already answered this question');
        }
        const answer = this.answerRepo.create({
            id: compositeId,
            event_id: dto.event_id,
            user_id: userId,
            question_id: dto.question_id,
            option_key: dto.option_key,
            tag: option.tag,
            color: option.color,
        });
        const saved = await this.answerRepo.save(answer);
        await this.checkinRepo
            .createQueryBuilder()
            .update(checkin_entity_1.CheckIn)
            .set({
            local_tags: () => `CASE WHEN local_tags IS NULL THEN :tag
                WHEN local_tags LIKE :tagPattern THEN local_tags
                ELSE JSON_ARRAY_APPEND(COALESCE(local_tags, JSON_ARRAY()), '$.', JSON_QUOTE(:tag))
           END`,
        })
            .where('event_id = :eid AND user_id = :uid', {
            eid: dto.event_id,
            uid: userId,
            tag: option.tag,
            tagPattern: `%"${option.tag}"%`,
        })
            .setParameters({ tag: option.tag, tagPattern: `%"${option.tag}"%` })
            .execute();
        const checkin = await this.checkinRepo.findOne({
            where: { event_id: dto.event_id, user_id: userId },
            select: ['display_id', 'name'],
        });
        this.emitter.emit(app_events_1.APP_EVENTS.ICEBREAKER_ANSWERED, {
            event_id: dto.event_id,
            user_id: userId,
            display_id: checkin?.display_id || null,
            name: checkin?.name || null,
            option_key: dto.option_key,
            tag: option.tag,
            color: option.color,
        });
        return saved;
    }
    async answerGuest(deviceToken, userToken, dto) {
        let user = null;
        if (userToken) {
            user = await this.userRepo.findOne({ where: { user_token: userToken } });
        }
        if (!user && deviceToken) {
            user = await this.userRepo.findOne({ where: { device_id: deviceToken } });
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found. Please check in first.');
        }
        return this.answer(user.user_id, dto);
    }
    async listQuestions(eventId) {
        return this.questionRepo.find({
            where: { event_id: eventId, is_active: true },
            order: { display_order: 'ASC', created_at: 'ASC' },
        });
    }
    async getStarColors(eventId) {
        const checkins = await this.checkinRepo.find({
            where: { event_id: eventId },
            relations: ['user'],
        });
        const answers = await this.answerRepo.find({ where: { event_id: eventId } });
        const lastByUser = new Map();
        for (const a of answers) {
            const prev = lastByUser.get(a.user_id);
            if (!prev || a.answered_at > prev.answered_at) {
                lastByUser.set(a.user_id, a);
            }
        }
        return checkins.map((c) => {
            const a = lastByUser.get(c.user_id);
            return {
                user_id: c.user_id,
                name: c.name,
                color: a?.color ?? null,
                tag: a?.tag ?? null,
            };
        });
    }
    async getStats(eventId) {
        const answers = await this.answerRepo.find({ where: { event_id: eventId } });
        const uniqueUsers = new Set(answers.map((a) => a.user_id));
        return {
            totalAnswers: answers.length,
            participantCount: uniqueUsers.size,
        };
    }
};
exports.IcebreakerService = IcebreakerService;
exports.IcebreakerService = IcebreakerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(icebreaker_question_entity_1.IcebreakerQuestion)),
    __param(1, (0, typeorm_1.InjectRepository)(icebreaker_answer_entity_1.IcebreakerAnswer)),
    __param(2, (0, typeorm_1.InjectRepository)(checkin_entity_1.CheckIn)),
    __param(3, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(4, (0, typeorm_1.InjectRepository)(global_user_entity_1.GlobalUser)),
    __param(6, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2,
        ioredis_1.Redis])
], IcebreakerService);
//# sourceMappingURL=icebreaker.service.js.map