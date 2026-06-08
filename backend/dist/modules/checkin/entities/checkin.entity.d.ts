import { GlobalUser } from '../../global-user/entities/global-user.entity';
import { Event } from '../../event/entities/event.entity';
export declare class CheckIn {
    id: string;
    event_id: string;
    event: Event;
    user_id: string;
    user: GlobalUser;
    name: string;
    local_tags: string[];
    is_invisible: boolean;
    display_id: string;
    checked_in_at: Date;
}
