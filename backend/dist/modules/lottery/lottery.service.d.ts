import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { LotteryPool } from './entities/lottery-pool.entity';
import { LotteryRecord } from './entities/lottery-record.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Event } from '../event/entities/event.entity';
import { CreateLotteryPoolDto } from './dto/create-lottery-pool.dto';
import { DrawLotteryDto } from './dto/draw-lottery.dto';
export declare class LotteryService {
    private readonly poolRepo;
    private readonly recordRepo;
    private readonly checkinRepo;
    private readonly eventRepo;
    private readonly redis;
    private readonly emitter;
    private readonly logger;
    constructor(poolRepo: Repository<LotteryPool>, recordRepo: Repository<LotteryRecord>, checkinRepo: Repository<CheckIn>, eventRepo: Repository<Event>, redis: Redis, emitter: EventEmitter2);
    createPool(dto: CreateLotteryPoolDto): Promise<LotteryPool>;
    draw(operatorUserId: string, dto: DrawLotteryDto): Promise<LotteryRecord | null>;
    drawBatch(operatorUserId: string, dto: DrawLotteryDto): Promise<LotteryRecord[]>;
    private drawOne;
    private deductStock;
    getWinners(eventId: string, poolId?: string): Promise<LotteryRecord[]>;
    getWinnersForExport(eventId: string, poolId?: string): Promise<(LotteryRecord & {
        display_id?: string | null;
        phone?: string;
    })[]>;
    getPools(eventId: string): Promise<LotteryPool[]>;
}
