import { GlobalUser } from '../../global-user/entities/global-user.entity';
import { EventStatus } from '../../../common/enums/event-status.enum';
export declare class Event {
    event_id: string;
    title: string;
    description: string;
    host_id: string;
    host: GlobalUser;
    co_host_ids: string[];
    settings: Record<string, any>;
    current_state: EventStatus;
    is_published: boolean;
    location: string;
    scheduled_at: Date;
    created_at: Date;
    updated_at: Date;
}
