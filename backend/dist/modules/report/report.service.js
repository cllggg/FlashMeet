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
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("../event/entities/event.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const match_pair_entity_1 = require("../match/entities/match-pair.entity");
const icebreaker_question_entity_1 = require("../icebreaker/entities/icebreaker-question.entity");
const icebreaker_answer_entity_1 = require("../icebreaker/entities/icebreaker-answer.entity");
const lottery_pool_entity_1 = require("../lottery/entities/lottery-pool.entity");
const lottery_record_entity_1 = require("../lottery/entities/lottery-record.entity");
const ioredis_1 = require("ioredis");
const common_2 = require("@nestjs/common");
let ReportService = class ReportService {
    eventRepo;
    checkinRepo;
    matchRepo;
    questionRepo;
    answerRepo;
    poolRepo;
    recordRepo;
    redis;
    constructor(eventRepo, checkinRepo, matchRepo, questionRepo, answerRepo, poolRepo, recordRepo, redis) {
        this.eventRepo = eventRepo;
        this.checkinRepo = checkinRepo;
        this.matchRepo = matchRepo;
        this.questionRepo = questionRepo;
        this.answerRepo = answerRepo;
        this.poolRepo = poolRepo;
        this.recordRepo = recordRepo;
        this.redis = redis;
    }
    async generateReport(eventId) {
        const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
        if (!event)
            throw new Error('Event not found');
        const checkins = await this.checkinRepo.find({ where: { event_id: eventId } });
        const matches = await this.matchRepo.find({ where: { event_id: eventId } });
        const visibleCheckins = checkins.filter((c) => !c.is_invisible);
        const totalCheckins = checkins.length;
        const invisibleCount = checkins.filter((c) => c.is_invisible).length;
        const totalViews = totalCheckins;
        const conversionRate = 100;
        const acceptedMatches = matches.filter((m) => m.status === 'accepted');
        const matchRate = matches.length > 0 ? Math.round((acceptedMatches.length / matches.length) * 100) : 0;
        const questions = await this.questionRepo.find({ where: { event_id: eventId } });
        const questionsPublished = questions.length;
        const answers = await this.answerRepo.find({ where: { event_id: eventId } });
        const uniqueAnswerers = new Set(answers.map((a) => a.user_id));
        const participationRate = visibleCheckins.length > 0
            ? Math.round((uniqueAnswerers.size / visibleCheckins.length) * 100)
            : 0;
        const pools = await this.poolRepo.find({ where: { event_id: eventId } });
        const records = await this.recordRepo.find({ where: { event_id: eventId } });
        const totalDraws = records.length;
        const totalWinners = new Set(records.map((r) => r.user_id)).size;
        let totalShakes = 0;
        let totalShakeParticipants = 0;
        try {
            const key = `event:${eventId}:shake:scores`;
            const all = await this.redis.zrange(key, 0, -1, 'WITHSCORES');
            for (let i = 1; i < all.length; i += 2) {
                const score = parseInt(all[i], 10);
                if (score > 0) {
                    totalShakes += score;
                    totalShakeParticipants += 1;
                }
            }
        }
        catch {
        }
        const totalInteractions = totalCheckins +
            matches.length +
            acceptedMatches.length +
            answers.length +
            totalDraws +
            totalShakeParticipants;
        const highlights = [];
        if (conversionRate >= 80)
            highlights.push('签到转化率优秀，超过80%的观众参与了签到');
        if (acceptedMatches.length >= 3)
            highlights.push(`产生了${acceptedMatches.length}对成功匹配，社交氛围热烈`);
        if (totalCheckins >= 10)
            highlights.push(`签到人数超过10人，活动规模可观`);
        if (matchRate >= 50)
            highlights.push('CP盲盒匹配率超过50%，参与者互动意愿强烈');
        if (questionsPublished > 0 && participationRate >= 60) {
            highlights.push(`破冰问题参与率达${participationRate}%，破冰效果好`);
        }
        if (totalShakeParticipants >= 5) {
            highlights.push(`摇一摇环节共${totalShakeParticipants}人参与，累计${totalShakes}次抖动`);
        }
        if (highlights.length === 0)
            highlights.push('活动数据正常，期待下次更精彩');
        const duration = event.created_at
            ? this.formatDuration(event.created_at, new Date())
            : '未知';
        return {
            event_id: eventId,
            title: event.title,
            duration,
            checkin: {
                total_views: totalViews,
                total_checkins: totalCheckins,
                conversion_rate: conversionRate,
                invisible_count: invisibleCount,
            },
            icebreaker: {
                questions_published: questionsPublished,
                total_answers: answers.length,
                participation_rate: participationRate,
            },
            lottery: {
                total_draws: totalDraws,
                total_winners: totalWinners,
                pool_count: pools.length,
            },
            shake: {
                total_participants: totalShakeParticipants,
                total_shakes: totalShakes,
            },
            match: {
                total_pairs: matches.length,
                accepted_pairs: acceptedMatches.length,
                match_rate: matchRate,
            },
            summary: {
                total_interactions: totalInteractions,
                avg_interaction_per_user: visibleCheckins.length > 0
                    ? Math.round((totalInteractions / visibleCheckins.length) * 10) / 10
                    : 0,
                highlights,
            },
        };
    }
    formatDuration(start, end) {
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        if (hours > 0)
            return `${hours}小时${minutes}分钟`;
        return `${minutes}分钟`;
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(checkin_entity_1.CheckIn)),
    __param(2, (0, typeorm_1.InjectRepository)(match_pair_entity_1.MatchPair)),
    __param(3, (0, typeorm_1.InjectRepository)(icebreaker_question_entity_1.IcebreakerQuestion)),
    __param(4, (0, typeorm_1.InjectRepository)(icebreaker_answer_entity_1.IcebreakerAnswer)),
    __param(5, (0, typeorm_1.InjectRepository)(lottery_pool_entity_1.LotteryPool)),
    __param(6, (0, typeorm_1.InjectRepository)(lottery_record_entity_1.LotteryRecord)),
    __param(7, (0, common_2.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        ioredis_1.Redis])
], ReportService);
//# sourceMappingURL=report.service.js.map