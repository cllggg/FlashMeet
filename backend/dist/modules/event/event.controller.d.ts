import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventService } from './event.service';
import { HostPresenceService } from './host-presence.service';
import { EventStatus } from '../../common/enums/event-status.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventController {
    private readonly eventService;
    private readonly emitter;
    private readonly hostPresence;
    constructor(eventService: EventService, emitter: EventEmitter2, hostPresence: HostPresenceService);
    create(req: any, dto: CreateEventDto): Promise<import("./entities/event.entity").Event>;
    findOne(eventId: string): Promise<import("./entities/event.entity").Event>;
    getCurrentState(eventId: string): Promise<{
        state: EventStatus;
    }>;
    getAllowedTransitions(eventId: string): Promise<{
        current_state: EventStatus;
        allowed: EventStatus[];
    }>;
    update(eventId: string, req: any, dto: UpdateEventDto): Promise<import("./entities/event.entity").Event>;
    publish(eventId: string, req: any): Promise<import("./entities/event.entity").Event>;
    changeScene(eventId: string, req: any, body: {
        target_state: EventStatus;
    }): Promise<{
        state: EventStatus;
    }>;
    shake(eventId: string, req: any, body: {
        count: number;
    }): Promise<{
        ok: boolean;
    }>;
    findByHost(req: any): Promise<import("./entities/event.entity").Event[]>;
    presence(eventId: string, req: any): Promise<{
        event_id: string;
        primary_id: string;
        active: {
            user_id: string;
            ts: number;
        }[];
        count: number;
    }>;
}
