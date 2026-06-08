import { HostAssistantService } from './host-assistant.service';
import { EventService } from '../event/event.service';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Repository } from 'typeorm';
import { EventStatus } from '../../common/enums/event-status.enum';
export declare class HostAssistantController {
    private readonly assistant;
    private readonly eventService;
    private readonly checkinRepo;
    constructor(assistant: HostAssistantService, eventService: EventService, checkinRepo: Repository<CheckIn>);
    getSuggestions(eventId: string, req: any): Promise<{
        event_id: string;
        current_state: EventStatus;
        suggestions: import("./host-assistant.types").ActivitySuggestion[];
        generated_at: number;
    }>;
}
