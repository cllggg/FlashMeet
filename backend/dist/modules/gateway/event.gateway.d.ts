import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { EventService } from '../event/event.service';
import { HostPresenceService } from '../event/host-presence.service';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { IcebreakerService } from '../icebreaker/icebreaker.service';
import { MatchService } from '../match/match.service';
import { EventStatus } from '../../common/enums/event-status.enum';
export declare class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
    private readonly redis;
    private readonly eventService;
    private readonly hostPresence;
    private readonly icebreakerService;
    private readonly matchService;
    private readonly userRepo;
    server: Server;
    private readonly logger;
    private localShakeScores;
    private shakeBuckets;
    private leaderboardIntervals;
    private static readonly SHAKE_BUCKET_MS;
    private static readonly SHAKE_MAX_PER_BUCKET;
    private static readonly SHAKE_BROADCAST_MS;
    private static readonly SHAKE_KEY;
    private shakeActiveEvents;
    private static readonly SHAKE_ACTIVE_KEY;
    private setShakeActive;
    private isShakeActive;
    private userInfoCache;
    private static readonly USER_CACHE_TTL_MS;
    constructor(redis: Redis, eventService: EventService, hostPresence: HostPresenceService, icebreakerService: IcebreakerService, matchService: MatchService, userRepo: Repository<GlobalUser>);
    afterInit(): void;
    private gcShakeBuckets;
    onModuleDestroy(): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, data: {
        event_id: string;
        role: string;
    }): Promise<void>;
    handleChangeScene(client: Socket, data: {
        event_id: string;
        target_state: EventStatus;
        user_id: string;
    }): Promise<void>;
    handleShakeAction(_client: Socket, data: {
        event_id: string;
        user_id: string;
        count: number;
    }): Promise<void>;
    handleHostHeartbeat(_client: Socket, data: {
        event_id: string;
        user_id: string;
    }): Promise<void>;
    handleJoinMatchRoom(client: Socket, data: {
        match_id: string;
        user_id: string;
    }): Promise<void>;
    handleMatchAccept(_client: Socket, data: {
        event_id: string;
        user_id: string;
    }): Promise<void>;
    handleMatchReject(_client: Socket, data: {
        event_id: string;
        user_id: string;
    }): Promise<void>;
    handleCheckinCreated(payload: {
        event_id: string;
        user: any;
    }): void;
    handleLotteryDrawn(payload: {
        event_id: string;
        winner: any;
    }): void;
    handleSceneChanged(payload: {
        event_id: string;
        new_state: EventStatus;
    }): Promise<void>;
    handleShakeUpdated(payload: {
        event_id: string;
        user_id: string;
        count: number;
    }): void;
    handleIcebreakerPublished(payload: {
        event_id: string;
        question: {
            question_id: string;
            prompt: string;
            options: any[];
        };
    }): void;
    handleIcebreakerAnswered(payload: {
        event_id: string;
        user_id: string;
        display_id?: string | null;
        name?: string | null;
        option_key?: string;
        tag: string;
        color: string;
    }): void;
    handleIcebreakerClosed(payload: {
        event_id: string;
    }): void;
    handleHostPromoted(payload: {
        event_id: string;
        new_host_id: string;
        old_host_id: string;
    }): void;
    handleHostOffline(payload: {
        event_id: string;
        user_id: string;
    }): void;
    accumulateShake(eventId: string, userId: string, count: number): Promise<void>;
    private flushShakeBucket;
    startShakeLeaderboard(eventId: string): void;
    private static readonly SHAKE_DEFAULT_DURATION_MS;
    private static readonly SHAKE_SESSION_KEY;
    private shakeSessionTimers;
    private shakeSessionEnds;
    startShakeSession(eventId: string, durationMs?: number): void;
    endShakeSession(eventId: string, silent?: boolean): Promise<void>;
    getShakeSessionEndsAt(eventId: string): number | null;
    getShakeSessionRedis(eventId: string): Promise<{
        ends_at: number;
        duration_ms: number;
        started_at: number;
    } | null>;
    stopShakeLeaderboard(eventId: string): void;
    private getShakeTopN;
    broadcastSceneChange(eventId: string, newState: EventStatus): void;
    private enrichUsers;
    handleMatchGenerated(payload: {
        event_id: string;
        pairs: any[];
        total: number;
    }): void;
    handleMatchAccepted(payload: {
        event_id: string;
        pair: any;
    }): void;
    handleMatchRejected(payload: {
        event_id: string;
        pair: any;
    }): void;
    handleBlindChat(payload: {
        match_id: string;
        message: any;
    }): void;
}
