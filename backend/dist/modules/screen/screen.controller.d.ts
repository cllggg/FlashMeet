import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Event } from '../event/entities/event.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { LotteryRecord } from '../lottery/entities/lottery-record.entity';
import { EventGateway } from '../gateway/event.gateway';
export declare class ScreenController {
    private readonly eventRepo;
    private readonly checkinRepo;
    private readonly lotteryRecordRepo;
    private readonly config;
    private readonly gateway;
    constructor(eventRepo: Repository<Event>, checkinRepo: Repository<CheckIn>, lotteryRecordRepo: Repository<LotteryRecord>, config: ConfigService, gateway: EventGateway);
    getEvent(eventId: string): Promise<{
        event_id: string;
        title: string;
        description: string;
        current_state: import("../../common/enums/event-status.enum").EventStatus;
        location: string;
        scheduled_at: Date;
        join_url: string;
    } | null>;
    getCheckins(eventId: string): Promise<{
        user_id: string;
        name: string;
        nickname: string;
        display_id: string | null;
        avatar_url: string;
        phone: string;
        local_tags: string[];
        checked_in_at: Date;
    }[]>;
    getWinners(eventId: string): Promise<LotteryRecord[]>;
    getShakeSession(eventId: string): Promise<{
        active: boolean;
        ends_at: number;
        server_now: number;
    } | {
        active: boolean;
        ends_at: null;
        server_now: number;
    }>;
}
