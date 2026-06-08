import { CheckinService } from './checkin.service';
import { CheckInDto } from './dto/checkin.dto';
export declare class CheckinController {
    private readonly checkinService;
    constructor(checkinService: CheckinService);
    guestCheckIn(dto: CheckInDto, deviceToken?: string): Promise<{
        checkin: import("./entities/checkin.entity").CheckIn;
        user: import("../global-user/entities/global-user.entity").GlobalUser;
        isNew: boolean;
        recall_key: string;
    }>;
    checkIn(req: any, dto: CheckInDto): Promise<import("./entities/checkin.entity").CheckIn>;
    resolve(body: {
        event_id: string;
        user_token?: string;
        phone?: string;
    }, deviceToken?: string, userTokenHeader?: string): Promise<import("./checkin.service").ResolveResult>;
    getCheckins(eventId: string): Promise<import("./entities/checkin.entity").CheckIn[]>;
    getCheckinCount(eventId: string): Promise<{
        count: number;
    }>;
    updateTags(req: any, eventId: string, body: {
        tags: string[];
    }): Promise<import("./entities/checkin.entity").CheckIn>;
}
