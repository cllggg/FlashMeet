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
var MatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const match_pair_entity_1 = require("./entities/match-pair.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const app_events_1 = require("../../common/constants/app-events");
let MatchService = MatchService_1 = class MatchService {
    matchRepo;
    checkinRepo;
    emitter;
    logger = new common_1.Logger(MatchService_1.name);
    constructor(matchRepo, checkinRepo, emitter) {
        this.matchRepo = matchRepo;
        this.checkinRepo = checkinRepo;
        this.emitter = emitter;
    }
    async getTopMatches(eventId, userId, limit = 5) {
        const checkins = await this.checkinRepo.find({
            where: { event_id: eventId, is_invisible: false },
        });
        const users = checkins.map((c) => ({
            user_id: c.user_id,
            display_id: c.display_id || '?',
            name: c.name || '参与者',
            tags: c.local_tags || [],
        }));
        const me = users.find((u) => u.user_id === userId);
        if (!me || me.tags.length === 0)
            return [];
        const scores = users
            .filter((u) => u.user_id !== userId)
            .map((other) => {
            const common = me.tags.filter((t) => other.tags.includes(t));
            const union = new Set([...me.tags, ...other.tags]);
            const score = union.size > 0 ? common.length / union.size : 0;
            return {
                user_a: { user_id: me.user_id, display_id: me.display_id, name: me.name, tags: me.tags },
                user_b: { user_id: other.user_id, display_id: other.display_id, name: other.name, tags: other.tags },
                common_tags: common,
                score: Math.round(score * 100),
            };
        })
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        return scores;
    }
    async generateMatches(eventId) {
        const checkins = await this.checkinRepo.find({
            where: { event_id: eventId, is_invisible: false },
        });
        if (checkins.length < 2) {
            this.logger.warn(`Event ${eventId} has fewer than 2 checkins, cannot match`);
            return [];
        }
        const users = checkins.map((c) => ({
            user_id: c.user_id,
            display_id: c.display_id || '?',
            name: c.name || '参与者',
            tags: c.local_tags || [],
        }));
        const pairs = [];
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                const common = users[i].tags.filter((t) => users[j].tags.includes(t));
                const union = new Set([...users[i].tags, ...users[j].tags]);
                const score = union.size > 0 ? common.length / union.size : 0;
                pairs.push({ a: i, b: j, score, common });
            }
        }
        pairs.sort((x, y) => y.score - x.score);
        const matched = new Set();
        const results = [];
        for (const pair of pairs) {
            if (matched.has(pair.a) || matched.has(pair.b))
                continue;
            if (pair.score < 0.1)
                continue;
            matched.add(pair.a);
            matched.add(pair.b);
            const result = {
                user_a: users[pair.a],
                user_b: users[pair.b],
                common_tags: pair.common,
                score: Math.round(pair.score * 100),
            };
            const entity = this.matchRepo.create({
                event_id: eventId,
                user_a_id: result.user_a.user_id,
                user_b_id: result.user_b.user_id,
                similarity_score: pair.score,
                common_tags: pair.common,
                status: match_pair_entity_1.MatchStatus.PENDING,
            });
            await this.matchRepo.save(entity);
            results.push(result);
        }
        this.logger.log(`Generated ${results.length} match pairs for event ${eventId}`);
        this.emitter.emit(app_events_1.APP_EVENTS.MATCH_GENERATED, {
            event_id: eventId,
            pairs: results,
            total: results.length,
        });
        return results;
    }
    async getMatches(eventId) {
        return this.matchRepo.find({
            where: { event_id: eventId },
            order: { similarity_score: 'DESC' },
        });
    }
    async getMatchesByUser(matchId, userId) {
        if (!matchId || !userId)
            return null;
        const pair = await this.matchRepo.findOne({ where: { id: matchId } });
        if (!pair)
            return null;
        if (pair.user_a_id !== userId && pair.user_b_id !== userId)
            return null;
        return pair;
    }
    async acceptMatch(eventId, userId) {
        const pair = await this.matchRepo.findOne({
            where: [
                { event_id: eventId, user_a_id: userId, status: match_pair_entity_1.MatchStatus.PENDING },
                { event_id: eventId, user_b_id: userId, status: match_pair_entity_1.MatchStatus.PENDING },
                { event_id: eventId, user_a_id: userId, status: match_pair_entity_1.MatchStatus.HALF_ACCEPTED },
                { event_id: eventId, user_b_id: userId, status: match_pair_entity_1.MatchStatus.HALF_ACCEPTED },
            ],
        });
        if (!pair) {
            throw new common_1.NotFoundException('No pending match found for this user');
        }
        if (pair.status === match_pair_entity_1.MatchStatus.HALF_ACCEPTED) {
            if (pair.accepted_by === userId) {
                throw new common_1.ConflictException('You have already accepted this match');
            }
            pair.status = match_pair_entity_1.MatchStatus.ACCEPTED;
            await this.matchRepo.save(pair);
            this.emitter.emit(app_events_1.APP_EVENTS.MATCH_ACCEPTED, {
                event_id: eventId,
                pair,
            });
            return { status: 'matched', pair };
        }
        pair.status = match_pair_entity_1.MatchStatus.HALF_ACCEPTED;
        pair.accepted_by = userId;
        await this.matchRepo.save(pair);
        return { status: 'half', pair };
    }
    async rejectMatch(eventId, userId) {
        const pair = await this.matchRepo.findOne({
            where: [
                { event_id: eventId, user_a_id: userId, status: match_pair_entity_1.MatchStatus.PENDING },
                { event_id: eventId, user_b_id: userId, status: match_pair_entity_1.MatchStatus.PENDING },
                { event_id: eventId, user_a_id: userId, status: match_pair_entity_1.MatchStatus.HALF_ACCEPTED },
                { event_id: eventId, user_b_id: userId, status: match_pair_entity_1.MatchStatus.HALF_ACCEPTED },
            ],
        });
        if (pair) {
            pair.status = match_pair_entity_1.MatchStatus.REJECTED;
            await this.matchRepo.save(pair);
            this.emitter.emit(app_events_1.APP_EVENTS.MATCH_REJECTED, {
                event_id: eventId,
                pair,
            });
        }
    }
};
exports.MatchService = MatchService;
exports.MatchService = MatchService = MatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_pair_entity_1.MatchPair)),
    __param(1, (0, typeorm_1.InjectRepository)(checkin_entity_1.CheckIn)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], MatchService);
//# sourceMappingURL=match.service.js.map