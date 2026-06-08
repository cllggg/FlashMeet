import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MatchPair } from './entities/match-pair.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
export interface MatchResult {
    user_a: {
        user_id: string;
        display_id: string;
        name: string;
        tags: string[];
    };
    user_b: {
        user_id: string;
        display_id: string;
        name: string;
        tags: string[];
    };
    common_tags: string[];
    score: number;
}
export declare class MatchService {
    private readonly matchRepo;
    private readonly checkinRepo;
    private readonly emitter;
    private readonly logger;
    constructor(matchRepo: Repository<MatchPair>, checkinRepo: Repository<CheckIn>, emitter: EventEmitter2);
    getTopMatches(eventId: string, userId: string, limit?: number): Promise<MatchResult[]>;
    generateMatches(eventId: string): Promise<MatchResult[]>;
    getMatches(eventId: string): Promise<MatchPair[]>;
    getMatchesByUser(matchId: string, userId: string): Promise<MatchPair | null>;
    acceptMatch(eventId: string, userId: string): Promise<{
        status: 'half' | 'matched';
        pair: MatchPair;
    }>;
    rejectMatch(eventId: string, userId: string): Promise<void>;
}
