import { Repository } from 'typeorm';
import { Event } from '../event/entities/event.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { LotteryRecord } from '../lottery/entities/lottery-record.entity';
export declare class ScreenController {
    private readonly eventRepo;
    private readonly checkinRepo;
    private readonly lotteryRecordRepo;
    constructor(eventRepo: Repository<Event>, checkinRepo: Repository<CheckIn>, lotteryRecordRepo: Repository<LotteryRecord>);
    getEvent(eventId: string): Promise<{
        event_id: string;
        title: string;
        description: string;
        current_state: import("../../common/enums/event-status.enum").EventStatus;
        location: string;
        scheduled_at: Date;
    } | null>;
    getCheckins(eventId: string): Promise<{
        user_id: string;
        name: string;
        nickname: string;
        avatar_url: string;
        phone: string;
        local_tags: string[];
        checked_in_at: Date;
    }[]>;
    getWinners(eventId: string): Promise<LotteryRecord[]>;
}
