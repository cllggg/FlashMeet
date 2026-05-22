import { LotteryService } from './lottery.service';
import { EventGateway } from '../gateway/event.gateway';
import { CreateLotteryPoolDto } from './dto/create-lottery-pool.dto';
import { DrawLotteryDto } from './dto/draw-lottery.dto';
export declare class LotteryController {
    private readonly lotteryService;
    private readonly gateway;
    constructor(lotteryService: LotteryService, gateway: EventGateway);
    createPool(dto: CreateLotteryPoolDto): Promise<import("./entities/lottery-pool.entity").LotteryPool>;
    draw(req: any, dto: DrawLotteryDto): Promise<import("./entities/lottery-record.entity").LotteryRecord | null>;
    getPools(eventId: string): Promise<import("./entities/lottery-pool.entity").LotteryPool[]>;
    getWinners(eventId: string, poolId?: string): Promise<import("./entities/lottery-record.entity").LotteryRecord[]>;
}
