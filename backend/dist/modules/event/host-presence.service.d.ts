import { Redis } from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare const HOST_PRESENCE_KEY: (eventId: string) => string;
export declare const HOST_PRIMARY_KEY: (eventId: string) => string;
export interface HostHeartbeatPayload {
    event_id: string;
    user_id: string;
    ts: number;
}
export declare class HostPresenceService {
    private readonly redis;
    private readonly emitter;
    private readonly logger;
    private localPresence;
    private localPrimary;
    private lastHeartbeat;
    private static readonly HEARTBEAT_COOLDOWN_MS;
    private static readonly HEARTBEAT_TTL_S;
    private static readonly SWEEP_INTERVAL_MS;
    private sweepTimer;
    constructor(redis: Redis, emitter: EventEmitter2);
    start(): void;
    stop(): void;
    recordHeartbeat(eventId: string, userId: string): Promise<void>;
    setPrimary(eventId: string, hostId: string): Promise<void>;
    listActive(eventId: string): Promise<Array<{
        user_id: string;
        ts: number;
    }>>;
    private sweepAll;
    private checkAndPromote;
    private getPrimary;
}
