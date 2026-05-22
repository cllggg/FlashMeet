import { Repository } from 'typeorm';
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
    constructor(poolRepo: Repository<LotteryPool>, recordRepo: Repository<LotteryRecord>, checkinRepo: Repository<CheckIn>, eventRepo: Repository<Event>, redis: Redis);
    createPool(dto: CreateLotteryPoolDto): Promise<LotteryPool>;
    draw(userId: string, dto: DrawLotteryDto): Promise<LotteryRecord | null>;
    getWinners(eventId: string, poolId?: string): Promise<LotteryRecord[]>;
    getPools(eventId: string): Promise<LotteryPool[]>;
}
