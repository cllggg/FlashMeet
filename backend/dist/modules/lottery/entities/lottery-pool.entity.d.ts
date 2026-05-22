import { Event } from '../../event/entities/event.entity';
export declare class LotteryPool {
    id: string;
    event_id: string;
    event: Event;
    name: string;
    prizes: PrizeItem[];
    is_completed: boolean;
    created_at: Date;
}
export interface PrizeItem {
    id: string;
    name: string;
    total_count: number;
    remaining_count: number;
    image_url?: string;
}
