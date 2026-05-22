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
exports.LotteryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_2 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const lottery_pool_entity_1 = require("./entities/lottery-pool.entity");
const lottery_record_entity_1 = require("./entities/lottery-record.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const event_entity_1 = require("../event/entities/event.entity");
const uuid_1 = require("uuid");
const POOL_PRIZE_STOCK_KEY = (poolId, prizeId) => `lottery:pool:${poolId}:prize:${prizeId}:stock`;
const DRAW_IDEMPOTENT_KEY = (eventId, requestId) => `lottery:idempotent:${eventId}:${requestId}`;
let LotteryService = class LotteryService {
    poolRepo;
    recordRepo;
    checkinRepo;
    eventRepo;
    redis;
    constructor(poolRepo, recordRepo, checkinRepo, eventRepo, redis) {
        this.poolRepo = poolRepo;
        this.recordRepo = recordRepo;
        this.checkinRepo = checkinRepo;
        this.eventRepo = eventRepo;
        this.redis = redis;
    }
    async createPool(dto) {
        const prizes = dto.prizes.map((p) => ({
            id: (0, uuid_1.v4)(),
            name: p.name,
            total_count: p.total_count,
            remaining_count: p.total_count,
            image_url: p.image_url,
        }));
        const pool = this.poolRepo.create({
            event_id: dto.event_id,
            name: dto.name,
            prizes,
        });
        const saved = await this.poolRepo.save(pool);
        for (const prize of prizes) {
            await this.redis.set(POOL_PRIZE_STOCK_KEY(saved.id, prize.id), prize.total_count);
        }
        return saved;
    }
    async draw(userId, dto) {
        if (dto.request_id) {
            const exists = await this.redis.get(DRAW_IDEMPOTENT_KEY(dto.event_id, dto.request_id));
            if (exists) {
                return this.recordRepo.findOne({ where: { id: exists } });
            }
        }
        const pool = await this.poolRepo.findOne({
            where: { id: dto.pool_id, event_id: dto.event_id },
        });
        if (!pool)
            throw new common_1.NotFoundException('Lottery pool not found');
        if (pool.is_completed)
            throw new common_1.BadRequestException('Pool is completed');
        const existingWinners = await this.recordRepo.find({
            where: { event_id: dto.event_id, pool_id: dto.pool_id },
        });
        const winnerUserIds = new Set(existingWinners.map((r) => r.user_id));
        const checkins = await this.checkinRepo.find({
            where: { event_id: dto.event_id },
            relations: ['user'],
        });
        const eligible = checkins.filter((c) => !winnerUserIds.has(c.user_id) && !c.is_invisible);
        if (eligible.length === 0) {
            throw new common_1.BadRequestException('No eligible participants');
        }
        let wonPrize = null;
        for (const prize of pool.prizes) {
            const stockKey = POOL_PRIZE_STOCK_KEY(pool.id, prize.id);
            const remaining = await this.redis.eval(`local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
         if stock <= 0 then return -1 end
         redis.call('DECRBY', KEYS[1], 1)
         return stock - 1`, 1, stockKey);
            if (Number(remaining) >= 0) {
                wonPrize = prize;
                break;
            }
        }
        if (!wonPrize) {
            throw new common_1.BadRequestException('All prizes are out of stock');
        }
        const winner = eligible[Math.floor(Math.random() * eligible.length)];
        const record = this.recordRepo.create({
            event_id: dto.event_id,
            user_id: winner.user_id,
            pool_id: dto.pool_id,
            prize_name: wonPrize.name,
            prize_image_url: wonPrize.image_url,
        });
        const savedRecord = await this.recordRepo.save(record);
        const prizeIndex = pool.prizes.findIndex((p) => p.id === wonPrize.id);
        if (prizeIndex >= 0) {
            pool.prizes[prizeIndex].remaining_count--;
            await this.poolRepo.save(pool);
        }
        if (dto.request_id) {
            await this.redis.set(DRAW_IDEMPOTENT_KEY(dto.event_id, dto.request_id), savedRecord.id, 'EX', 3600);
        }
        return savedRecord;
    }
    async getWinners(eventId, poolId) {
        const where = { event_id: eventId };
        if (poolId)
            where.pool_id = poolId;
        return this.recordRepo.find({
            where,
            relations: ['user'],
            order: { won_at: 'DESC' },
        });
    }
    async getPools(eventId) {
        return this.poolRepo.find({ where: { event_id: eventId } });
    }
};
exports.LotteryService = LotteryService;
exports.LotteryService = LotteryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lottery_pool_entity_1.LotteryPool)),
    __param(1, (0, typeorm_1.InjectRepository)(lottery_record_entity_1.LotteryRecord)),
    __param(2, (0, typeorm_1.InjectRepository)(checkin_entity_1.CheckIn)),
    __param(3, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(4, (0, common_2.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        ioredis_1.Redis])
], LotteryService);
//# sourceMappingURL=lottery.service.js.map