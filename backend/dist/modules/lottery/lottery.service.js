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
var LotteryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotteryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_2 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const ioredis_1 = require("ioredis");
const lottery_pool_entity_1 = require("./entities/lottery-pool.entity");
const lottery_record_entity_1 = require("./entities/lottery-record.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const event_entity_1 = require("../event/entities/event.entity");
const app_events_1 = require("../../common/constants/app-events");
const lua_1 = require("./lua");
const uuid_1 = require("uuid");
const POOL_PRIZE_STOCK_KEY = (poolId, prizeId) => `lottery:pool:${poolId}:prize:${prizeId}:stock`;
const DRAW_IDEMPOTENT_KEY = (eventId, requestId) => `lottery:idempotent:${eventId}:${requestId}`;
const STOCK_EMPTY = -1;
const STOCK_NOT_INIT = -2;
let LotteryService = LotteryService_1 = class LotteryService {
    poolRepo;
    recordRepo;
    checkinRepo;
    eventRepo;
    redis;
    emitter;
    logger = new common_1.Logger(LotteryService_1.name);
    constructor(poolRepo, recordRepo, checkinRepo, eventRepo, redis, emitter) {
        this.poolRepo = poolRepo;
        this.recordRepo = recordRepo;
        this.checkinRepo = checkinRepo;
        this.eventRepo = eventRepo;
        this.redis = redis;
        this.emitter = emitter;
    }
    async createPool(dto) {
        const prizes = dto.prizes.map((p) => ({
            id: (0, uuid_1.v4)(),
            name: p.name,
            total_count: p.total_count,
            remaining_count: p.total_count,
            image_url: p.image_url,
            value: p.value || 0,
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
    async draw(operatorUserId, dto) {
        return this.drawOne(operatorUserId, dto);
    }
    async drawBatch(operatorUserId, dto) {
        const count = dto.count ?? 1;
        const pre = dto.pre_picked_user_ids || [];
        const records = [];
        for (let i = 0; i < count; i++) {
            try {
                const r = await this.drawOne(operatorUserId, {
                    ...dto,
                    request_id: dto.request_id
                        ? `${dto.request_id}__${i}`
                        : `batch_${Date.now()}_${i}`,
                    pre_picked_user_ids: pre[i] ? [pre[i]] : undefined,
                });
                if (r)
                    records.push(r);
            }
            catch (err) {
                this.logger.warn(`drawBatch stop at ${i}/${count}: ${err}`);
                break;
            }
        }
        return records;
    }
    async drawOne(operatorUserId, dto) {
        const event = await this.eventRepo.findOne({
            where: { event_id: dto.event_id },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.host_id !== operatorUserId &&
            !event.co_host_ids.includes(operatorUserId)) {
            throw new common_1.ForbiddenException('Only host or co-host can draw lottery');
        }
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
        let lastStockKey = null;
        let lastDeductError = null;
        for (const prize of pool.prizes) {
            const stockKey = POOL_PRIZE_STOCK_KEY(pool.id, prize.id);
            let remaining;
            try {
                remaining = await this.deductStock(stockKey);
            }
            catch (err) {
                lastDeductError = err.message;
                continue;
            }
            if (remaining === STOCK_NOT_INIT) {
                try {
                    await this.redis.set(stockKey, prize.remaining_count);
                    remaining = await this.deductStock(stockKey);
                }
                catch (err) {
                    lastDeductError = err.message;
                    continue;
                }
            }
            if (remaining === STOCK_EMPTY) {
                continue;
            }
            if (remaining >= 0) {
                wonPrize = prize;
                lastStockKey = stockKey;
                break;
            }
        }
        if (!wonPrize) {
            if (lastDeductError) {
                throw new common_1.BadRequestException(`Stock service unavailable: ${lastDeductError}`);
            }
            if (!pool.is_completed) {
                pool.is_completed = true;
                await this.poolRepo.save(pool);
            }
            throw new common_1.BadRequestException('All prizes are out of stock');
        }
        const pre = (dto.pre_picked_user_ids || []).find((uid) => !winnerUserIds.has(uid) &&
            checkins.some((c) => c.user_id === uid && !c.is_invisible));
        let winner;
        if (pre) {
            winner = checkins.find((c) => c.user_id === pre);
            this.logger.log(`drawOne: pre-pick user_id=${pre} for pool=${pool.id}`);
        }
        else {
            if (eligible.length === 0) {
                throw new common_1.BadRequestException('No eligible participants');
            }
            winner = eligible[Math.floor(Math.random() * eligible.length)];
        }
        const record = this.recordRepo.create({
            event_id: dto.event_id,
            user_id: winner.user_id,
            pool_id: dto.pool_id,
            prize_name: wonPrize.name,
            prize_image_url: wonPrize.image_url,
            prize_value: wonPrize.value || 0,
        });
        let savedRecord;
        try {
            savedRecord = await this.recordRepo.save(record);
        }
        catch (err) {
            if (lastStockKey) {
                try {
                    await this.redis.eval("local v = redis.call('get', KEYS[1]); if v then redis.call('set', KEYS[1], tonumber(v) + 1) end return 1", 1, lastStockKey);
                }
                catch (rollbackErr) {
                    this.logger.error(`CRITICAL: Stock rollback failed for ${lastStockKey}, prize=${wonPrize?.name}, event=${dto.event_id}. ` +
                        `Manual compensation required. Error: ${rollbackErr}`);
                    try {
                        await this.redis.lpush('lottery:compensation:queue', JSON.stringify({
                            action: 'incr_stock',
                            stockKey: lastStockKey,
                            eventId: dto.event_id,
                            prizeName: wonPrize?.name,
                            ts: Date.now(),
                        }));
                    }
                    catch { }
                }
            }
            throw err;
        }
        const prizeIndex = pool.prizes.findIndex((p) => p.id === wonPrize.id);
        if (prizeIndex >= 0) {
            pool.prizes[prizeIndex].remaining_count = Math.max(0, pool.prizes[prizeIndex].remaining_count - 1);
            const allZero = pool.prizes.every((p) => p.remaining_count <= 0);
            if (allZero)
                pool.is_completed = true;
            await this.poolRepo.save(pool);
        }
        if (dto.request_id) {
            try {
                await this.redis.set(DRAW_IDEMPOTENT_KEY(dto.event_id, dto.request_id), savedRecord.id, 'EX', 3600);
            }
            catch { }
        }
        this.emitter.emit(app_events_1.APP_EVENTS.LOTTERY_DRAWN, {
            event_id: dto.event_id,
            winner: {
                record_id: savedRecord.id,
                user_id: winner.user_id,
                name: winner.name || winner.user?.nickname || '中奖用户',
                display_id: winner.display_id || null,
                avatar_url: winner.user?.avatar_url,
                prize_name: wonPrize.name,
                prize_image_url: wonPrize.image_url,
                prize_value: wonPrize.value || 0,
            },
        });
        return savedRecord;
    }
    async deductStock(stockKey) {
        try {
            const r = await this.redis.eval(lua_1.deductPrizeLua, 1, stockKey);
            return Number(r);
        }
        catch (err) {
            this.logger.warn(`deductStock ${stockKey} failed: ${err}`);
            throw err;
        }
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
    async getWinnersForExport(eventId, poolId) {
        const records = await this.getWinners(eventId, poolId);
        if (records.length === 0)
            return records;
        const userIds = records.map((r) => r.user_id);
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
    async getPools(eventId) {
        return this.poolRepo.find({ where: { event_id: eventId } });
    }
};
exports.LotteryService = LotteryService;
exports.LotteryService = LotteryService = LotteryService_1 = __decorate([
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
        ioredis_1.Redis,
        event_emitter_1.EventEmitter2])
], LotteryService);
//# sourceMappingURL=lottery.service.js.map