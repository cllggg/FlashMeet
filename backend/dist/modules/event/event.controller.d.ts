import { EventService } from './event.service';
import { EventGateway } from '../gateway/event.gateway';
import { EventStatus } from '../../common/enums/event-status.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventController {
    private readonly eventService;
    private readonly gateway;
    constructor(eventService: EventService, gateway: EventGateway);
    create(req: any, dto: CreateEventDto): Promise<import("./entities/event.entity").Event>;
    findOne(eventId: string): Promise<import("./entities/event.entity").Event>;
    getCurrentState(eventId: string): Promise<{
        state: EventStatus;
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
}
