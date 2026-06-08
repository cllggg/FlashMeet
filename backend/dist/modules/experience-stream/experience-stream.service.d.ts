import { Redis } from 'ioredis';
import { EventStatus } from '../../common/enums/event-status.enum';
import { ExperienceStream } from './experience-stream.types';
import { HostAssistantService } from '../host-assistant/host-assistant.service';
import { EventService } from '../event/event.service';
export declare class ExperienceStreamService {
    private readonly redis;
    private readonly assistant;
    private readonly eventService;
    private readonly logger;
    private listeners;
    constructor(redis: Redis, assistant: HostAssistantService, eventService: EventService);
    private static key;
    handleSceneChanged(payload: {
        event_id: string;
        state: EventStatus;
        previous_state?: EventStatus;
    }): Promise<void>;
    handleCheckinCreated(payload: {
        event_id: string;
    }): Promise<void>;
    subscribe(fn: (eventId: string, stream: ExperienceStream) => void): () => boolean;
    rebuildStream(eventId: string): Promise<ExperienceStream>;
    getStream(eventId: string): Promise<ExperienceStream>;
    bumpCheckinCount(eventId: string, delta?: number): Promise<number>;
}
