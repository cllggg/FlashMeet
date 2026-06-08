import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CheckIn } from './entities/checkin.entity';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { Event } from '../event/entities/event.entity';
import { CheckInDto } from './dto/checkin.dto';
export interface ResolveResult {
    found: boolean;
    user_id?: string;
    user_token?: string;
    display_id?: string;
    name?: string;
    nickname?: string;
    phone?: string;
    avatar_url?: string;
    checked_in_at?: Date;
    local_tags?: string[];
    event_id?: string;
    is_repeat?: boolean;
    recall_key?: 'user_token' | 'device_id' | 'wechat_openid' | 'phone';
}
export declare class CheckinService {
    private readonly checkinRepo;
    private readonly eventRepo;
    private readonly userRepo;
    private readonly emitter;
    constructor(checkinRepo: Repository<CheckIn>, eventRepo: Repository<Event>, userRepo: Repository<GlobalUser>, emitter: EventEmitter2);
    checkIn(userId: string, dto: CheckInDto): Promise<CheckIn>;
    guestCheckIn(dto: CheckInDto, deviceToken?: string): Promise<{
        checkin: CheckIn;
        user: GlobalUser;
        isNew: boolean;
        recall_key: string;
    }>;
    resolve(eventId: string, deviceToken?: string, userToken?: string, phone?: string): Promise<ResolveResult>;
    private allocateDisplayId;
    getCheckins(eventId: string): Promise<CheckIn[]>;
    getCheckinCount(eventId: string): Promise<number>;
    updateTags(userId: string, eventId: string, tags: string[]): Promise<CheckIn>;
}
