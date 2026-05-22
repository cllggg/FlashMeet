import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { EventService } from '../event/event.service';
import { EventStatus } from '../../common/enums/event-status.enum';
export declare class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly redis;
    private readonly eventService;
    server: Server;
    private shakeRateLimit;
    private static readonly SHAKE_COOLDOWN_MS;
    private static readonly SHAKE_BROADCAST_MS;
    private shakeScores;
    private leaderboardIntervals;
    constructor(redis: Redis, eventService: EventService);
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
    handleShakeAction(client: Socket, data: {
        event_id: string;
        user_id: string;
        count: number;
    }): Promise<void>;
    private startShakeLeaderboard;
    private stopShakeLeaderboard;
    notifyUserCheckedIn(eventId: string, user: any): void;
    announceLotteryWinner(eventId: string, winner: any): void;
    broadcastSceneChange(eventId: string, newState: EventStatus): void;
    handleShakeRest(eventId: string, userId: string, count: number): void;
}
