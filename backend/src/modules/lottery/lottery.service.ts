import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { LotteryPool, PrizeItem } from './entities/lottery-pool.entity';
import { LotteryRecord } from './entities/lottery-record.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Event } from '../event/entities/event.entity';
import { CreateLotteryPoolDto } from './dto/create-lottery-pool.dto';
import { DrawLotteryDto } from './dto/draw-lottery.dto';
import { APP_EVENTS } from '../../common/constants/app-events';
import { deductPrizeLua } from './lua';
import { v4 as uuidv4 } from 'uuid';

const POOL_PRIZE_STOCK_KEY = (poolId: string, prizeId: string) =>
  `lottery:pool:${poolId}:prize:${prizeId}:stock`;

const DRAW_IDEMPOTENT_KEY = (eventId: string, requestId: string) =>
  `lottery:idempotent:${eventId}:${requestId}`;

const STOCK_EMPTY = -1;
const STOCK_NOT_INIT = -2;

@Injectable()
export class LotteryService {
  private readonly logger = new Logger(LotteryService.name);

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
    private readonly emitter: EventEmitter2,
  ) {}

  async createPool(dto: CreateLotteryPoolDto): Promise<LotteryPool> {
    const prizes: PrizeItem[] = dto.prizes.map((p) => ({
      id: uuidv4(),
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
    operatorUserId: string,
    dto: DrawLotteryDto,
  ): Promise<LotteryRecord | null> {
    return this.drawOne(operatorUserId, dto);
  }

  /**
   * 批量抽取：在一次请求中连抽 N 次（最多 50）
   * - 每一次都走完整的鉴权 + 幂等 + 库存 + 广播
   * - 失败立即停手（避免部分成功的歧义），返回已成功的 records
   * - 内定名单按顺序消费：第 i 次抽取优先用 pre_picked_user_ids[i]
   */
  async drawBatch(
    operatorUserId: string,
    dto: DrawLotteryDto,
  ): Promise<LotteryRecord[]> {
    const count = dto.count ?? 1;
    const pre = dto.pre_picked_user_ids || [];
    const records: LotteryRecord[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const r = await this.drawOne(operatorUserId, {
          ...dto,
          // 关键：每次用不同 request_id 才能绕过幂等拦截
          request_id: dto.request_id
            ? `${dto.request_id}__${i}`
            : `batch_${Date.now()}_${i}`,
          // 内定名单按序消费（已用过的 user_id 也剔除）
          pre_picked_user_ids: pre[i] ? [pre[i]] : undefined,
        });
        if (r) records.push(r);
      } catch (err) {
        this.logger.warn(`drawBatch stop at ${i}/${count}: ${err}`);
        // 已抽到的仍返回
        break;
      }
    }
    return records;
  }

  /** 单次抽取的纯函数（无批处理耦合），供 draw / drawBatch 复用 */
  private async drawOne(
    operatorUserId: string,
    dto: DrawLotteryDto,
  ): Promise<LotteryRecord | null> {
    // 权限校验：只有 host / co-host 可以抽
    const event = await this.eventRepo.findOne({
      where: { event_id: dto.event_id },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (
      event.host_id !== operatorUserId &&
      !event.co_host_ids.includes(operatorUserId)
    ) {
      throw new ForbiddenException(
        'Only host or co-host can draw lottery',
      );
    }

    // 幂等性校验
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

    // Find a prize with remaining stock (Lua 原子扣减)
    let wonPrize: PrizeItem | null = null;
    let lastStockKey: string | null = null;
    let lastDeductError: string | null = null;
    for (const prize of pool.prizes) {
      const stockKey = POOL_PRIZE_STOCK_KEY(pool.id, prize.id);
      let remaining: number;
      try {
        remaining = await this.deductStock(stockKey);
      } catch (err) {
        lastDeductError = (err as Error).message;
        continue;
      }
      if (remaining === STOCK_NOT_INIT) {
        // 库存 key 缺失：从 DB 同步一次后重试
        try {
          await this.redis.set(stockKey, prize.remaining_count);
          remaining = await this.deductStock(stockKey);
        } catch (err) {
          lastDeductError = (err as Error).message;
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
        // Redis 不可用
        throw new BadRequestException(
          `Stock service unavailable: ${lastDeductError}`,
        );
      }
      // 自动标记奖池为完成
      if (!pool.is_completed) {
        pool.is_completed = true;
        await this.poolRepo.save(pool);
      }
      throw new BadRequestException('All prizes are out of stock');
    }

    // Pick winner：
    // 1) 内定名单（pre_picked_user_ids）→ 优先用首个且仍 eligible 的 user_id
    // 2) 否则随机抽取
    const pre = (dto.pre_picked_user_ids || []).find(
      (uid) => !winnerUserIds.has(uid) &&
        checkins.some((c) => c.user_id === uid && !c.is_invisible),
    );
    let winner: CheckIn;
    if (pre) {
      winner = checkins.find((c) => c.user_id === pre)!;
      this.logger.log(
        `drawOne: pre-pick user_id=${pre} for pool=${pool.id}`,
      );
    } else {
      if (eligible.length === 0) {
        throw new BadRequestException('No eligible participants');
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

    let savedRecord: LotteryRecord;
    try {
      savedRecord = await this.recordRepo.save(record);
    } catch (err) {
      // 回滚库存：使用 Lua 脚本原子回滚，确保回滚安全
      if (lastStockKey) {
        try {
          await this.redis.eval(
            "local v = redis.call('get', KEYS[1]); if v then redis.call('set', KEYS[1], tonumber(v) + 1) end return 1",
            1,
            lastStockKey,
          );
        } catch (rollbackErr) {
          // 双写不一致时告警并记录补偿日志
          this.logger.error(
            `CRITICAL: Stock rollback failed for ${lastStockKey}, prize=${wonPrize?.name}, event=${dto.event_id}. ` +
            `Manual compensation required. Error: ${rollbackErr}`,
          );
          // 写入补偿队列（后续可扩展为 Dead Letter Queue）
          try {
            await this.redis.lpush(
              'lottery:compensation:queue',
              JSON.stringify({
                action: 'incr_stock',
                stockKey: lastStockKey,
                eventId: dto.event_id,
                prizeName: wonPrize?.name,
                ts: Date.now(),
              }),
            );
          } catch {}
        }
      }
      throw err;
    }

    // Update remaining_count in DB (eventually consistent)
    const prizeIndex = pool.prizes.findIndex((p) => p.id === wonPrize.id);
    if (prizeIndex >= 0) {
      pool.prizes[prizeIndex].remaining_count = Math.max(
        0,
        pool.prizes[prizeIndex].remaining_count - 1,
      );
      // 当所有奖品库存为 0 时，自动标记完成
      const allZero = pool.prizes.every((p) => p.remaining_count <= 0);
      if (allZero) pool.is_completed = true;
      await this.poolRepo.save(pool);
    }

    // Idempotency mark（最后设置，确保只有成功路径才幂等）
    if (dto.request_id) {
      try {
        await this.redis.set(
          DRAW_IDEMPOTENT_KEY(dto.event_id, dto.request_id),
          savedRecord.id,
          'EX',
          3600,
        );
      } catch {}
    }

    // 抛事件，Gateway 监听后广播中奖信息到全场
    this.emitter.emit(APP_EVENTS.LOTTERY_DRAWN, {
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

  /** Lua 原子扣减，返回剩余库存（>=0）或 STOCK_EMPTY / STOCK_NOT_INIT */
  private async deductStock(stockKey: string): Promise<number> {
    try {
      const r = await this.redis.eval(deductPrizeLua, 1, stockKey);
      return Number(r);
    } catch (err) {
      this.logger.warn(`deductStock ${stockKey} failed: ${err}`);
      throw err;
    }
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

  /**
   * CSV 导出专用：补齐 display_id
   * （display_id 存于 checkin 表，不在 GlobalUser/LotteryRecord 上）
   */
  async getWinnersForExport(
    eventId: string,
    poolId?: string,
  ): Promise<
    (LotteryRecord & { display_id?: string | null; phone?: string })[]
  > {
    const records = await this.getWinners(eventId, poolId);
    if (records.length === 0) return records;
    const userIds = records.map((r) => r.user_id);
    const checkins = await this.checkinRepo
      .createQueryBuilder('c')
      .select(['c.user_id', 'c.display_id'])
      .where('c.event_id = :eid', { eid: eventId })
      .andWhere('c.user_id IN (:...uids)', { uids: userIds })
      .getRawMany<{ c_user_id: string; c_display_id: string | null }>();
    const map = new Map(checkins.map((c) => [c.c_user_id, c.c_display_id]));
    return records.map((r) => ({
      ...r,
      display_id: map.get(r.user_id) ?? null,
    })) as any;
  }

  async getPools(eventId: string): Promise<LotteryPool[]> {
    return this.poolRepo.find({ where: { event_id: eventId } });
  }
}
