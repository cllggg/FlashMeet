import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { LotteryPool, PrizeItem } from './entities/lottery-pool.entity';
import { LotteryRecord } from './entities/lottery-record.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Event } from '../event/entities/event.entity';
import { CreateLotteryPoolDto } from './dto/create-lottery-pool.dto';
import { DrawLotteryDto } from './dto/draw-lottery.dto';
import { v4 as uuidv4 } from 'uuid';

const POOL_PRIZE_STOCK_KEY = (poolId: string, prizeId: string) =>
  `lottery:pool:${poolId}:prize:${prizeId}:stock`;

const DRAW_IDEMPOTENT_KEY = (eventId: string, requestId: string) =>
  `lottery:idempotent:${eventId}:${requestId}`;

@Injectable()
export class LotteryService {
  constructor(
    @InjectRepository(LotteryPool)
    private readonly poolRepo: Repository<LotteryPool>,
    @InjectRepository(LotteryRecord)
    private readonly recordRepo: Repository<LotteryRecord>,
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async createPool(dto: CreateLotteryPoolDto): Promise<LotteryPool> {
    const prizes: PrizeItem[] = dto.prizes.map((p) => ({
      id: uuidv4(),
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

    // Initialize Redis stock for each prize
    for (const prize of prizes) {
      await this.redis.set(
        POOL_PRIZE_STOCK_KEY(saved.id, prize.id),
        prize.total_count,
      );
    }

    return saved;
  }

  async draw(
    userId: string,
    dto: DrawLotteryDto,
  ): Promise<LotteryRecord | null> {
    // Idempotency check
    if (dto.request_id) {
      const exists = await this.redis.get(
        DRAW_IDEMPOTENT_KEY(dto.event_id, dto.request_id),
      );
      if (exists) {
        return this.recordRepo.findOne({ where: { id: exists } });
      }
    }

    const pool = await this.poolRepo.findOne({
      where: { id: dto.pool_id, event_id: dto.event_id },
    });
    if (!pool) throw new NotFoundException('Lottery pool not found');
    if (pool.is_completed) throw new BadRequestException('Pool is completed');

    // Get eligible checkins (not already won in this pool)
    const existingWinners = await this.recordRepo.find({
      where: { event_id: dto.event_id, pool_id: dto.pool_id },
    });
    const winnerUserIds = new Set(existingWinners.map((r) => r.user_id));

    const checkins = await this.checkinRepo.find({
      where: { event_id: dto.event_id },
      relations: ['user'],
    });

    const eligible = checkins.filter(
      (c) => !winnerUserIds.has(c.user_id) && !c.is_invisible,
    );

    if (eligible.length === 0) {
      throw new BadRequestException('No eligible participants');
    }

    // Find a prize with remaining stock
    let wonPrize: PrizeItem | null = null;
    for (const prize of pool.prizes) {
      const stockKey = POOL_PRIZE_STOCK_KEY(pool.id, prize.id);
      // Simple Lua atomic deduction
      const remaining = await this.redis.eval(
        `local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
         if stock <= 0 then return -1 end
         redis.call('DECRBY', KEYS[1], 1)
         return stock - 1`,
        1,
        stockKey,
      );

      if (Number(remaining) >= 0) {
        wonPrize = prize;
        break;
      }
    }

    if (!wonPrize) {
      throw new BadRequestException('All prizes are out of stock');
    }

    // Random pick from eligible
    const winner =
      eligible[Math.floor(Math.random() * eligible.length)];

    const record = this.recordRepo.create({
      event_id: dto.event_id,
      user_id: winner.user_id,
      pool_id: dto.pool_id,
      prize_name: wonPrize.name,
      prize_image_url: wonPrize.image_url,
    });

    const savedRecord = await this.recordRepo.save(record);

    // Update remaining_count in DB (eventually consistent)
    const prizeIndex = pool.prizes.findIndex((p) => p.id === wonPrize.id);
    if (prizeIndex >= 0) {
      pool.prizes[prizeIndex].remaining_count--;
      await this.poolRepo.save(pool);
    }

    // Idempotency mark
    if (dto.request_id) {
      await this.redis.set(
        DRAW_IDEMPOTENT_KEY(dto.event_id, dto.request_id),
        savedRecord.id,
        'EX',
        3600,
      );
    }

    return savedRecord;
  }

  async getWinners(eventId: string, poolId?: string): Promise<LotteryRecord[]> {
    const where: any = { event_id: eventId };
    if (poolId) where.pool_id = poolId;
    return this.recordRepo.find({
      where,
      relations: ['user'],
      order: { won_at: 'DESC' },
    });
  }

  async getPools(eventId: string): Promise<LotteryPool[]> {
    return this.poolRepo.find({ where: { event_id: eventId } });
  }
}
