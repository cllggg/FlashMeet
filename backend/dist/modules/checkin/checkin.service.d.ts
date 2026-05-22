import { Repository } from 'typeorm';
import { CheckIn } from './entities/checkin.entity';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { Event } from '../event/entities/event.entity';
import { CheckInDto } from './dto/checkin.dto';
export declare class CheckinService {
    private readonly checkinRepo;
    private readonly eventRepo;
    private readonly userRepo;
    constructor(checkinRepo: Repository<CheckIn>, eventRepo: Repository<Event>, userRepo: Repository<GlobalUser>);
    checkIn(userId: string, dto: CheckInDto): Promise<CheckIn>;
    guestCheckIn(dto: CheckInDto): Promise<{
        checkin: CheckIn;
        user: GlobalUser;
        isNew: boolean;
    }>;
    getCheckins(eventId: string): Promise<CheckIn[]>;
    getCheckinCount(eventId: string): Promise<number>;
    updateTags(userId: string, eventId: string, tags: string[]): Promise<CheckIn>;
}
