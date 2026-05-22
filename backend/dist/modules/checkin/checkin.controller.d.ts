import { CheckinService } from './checkin.service';
import { EventGateway } from '../gateway/event.gateway';
import { CheckInDto } from './dto/checkin.dto';
export declare class CheckinController {
    private readonly checkinService;
    private readonly gateway;
    constructor(checkinService: CheckinService, gateway: EventGateway);
    guestCheckIn(dto: CheckInDto): Promise<{
        checkin: import("./entities/checkin.entity").CheckIn;
        user: {
            user_id: string;
            nickname: string;
            avatar_url: string;
            phone: string;
        };
        isNew: boolean;
    }>;
    checkIn(req: any, dto: CheckInDto): Promise<import("./entities/checkin.entity").CheckIn>;
    getCheckins(eventId: string): Promise<import("./entities/checkin.entity").CheckIn[]>;
    getCheckinCount(eventId: string): Promise<{
        count: number;
    }>;
    updateTags(req: any, eventId: string, body: {
        tags: string[];
    }): Promise<import("./entities/checkin.entity").CheckIn>;
}
