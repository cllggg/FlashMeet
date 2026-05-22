import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from '../../common/enums/event-status.enum';
import { Redis } from 'ioredis';
export declare const EVENT_STATE_KEY: (eventId: string) => string;
export declare class EventService {
    private readonly eventRepo;
    private readonly redis;
    constructor(eventRepo: Repository<Event>, redis: Redis);
    create(hostId: string, dto: CreateEventDto): Promise<Event>;
    findOne(eventId: string): Promise<Event>;
    getCurrentState(eventId: string): Promise<{
        state: EventStatus;
    }>;
    update(eventId: string, userId: string, dto: UpdateEventDto): Promise<Event>;
    publish(eventId: string, userId: string): Promise<Event>;
    changeScene(eventId: string, targetState: EventStatus, userId: string): Promise<EventStatus>;
    findByHost(hostId: string): Promise<Event[]>;
}
