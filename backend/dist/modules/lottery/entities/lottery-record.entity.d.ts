import { GlobalUser } from '../../global-user/entities/global-user.entity';
import { Event } from '../../event/entities/event.entity';
import { LotteryPool } from './lottery-pool.entity';
export declare class LotteryRecord {
    id: string;
    event_id: string;
    event: Event;
    user_id: string;
    user: GlobalUser;
    pool_id: string;
    pool: LotteryPool;
    prize_name: string;
    prize_image_url: string;
    won_at: Date;
}
