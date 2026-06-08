import { Repository } from 'typeorm';
import { Event } from '../event/entities/event.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { MatchPair } from '../match/entities/match-pair.entity';
import { IcebreakerQuestion } from '../icebreaker/entities/icebreaker-question.entity';
import { IcebreakerAnswer } from '../icebreaker/entities/icebreaker-answer.entity';
import { LotteryPool } from '../lottery/entities/lottery-pool.entity';
import { LotteryRecord } from '../lottery/entities/lottery-record.entity';
import { Redis } from 'ioredis';
export interface EventReport {
    event_id: string;
    title: string;
    duration: string;
    checkin: {
        total_views: number;
        total_checkins: number;
        conversion_rate: number;
        invisible_count: number;
    };
    icebreaker: {
        questions_published: number;
        total_answers: number;
        participation_rate: number;
    };
    lottery: {
        total_draws: number;
        total_winners: number;
        pool_count: number;
    };
    shake: {
        total_participants: number;
        total_shakes: number;
    };
    match: {
        total_pairs: number;
        accepted_pairs: number;
        match_rate: number;
    };
    summary: {
        total_interactions: number;
        avg_interaction_per_user: number;
        highlights: string[];
    };
}
export declare class ReportService {
    private readonly eventRepo;
    private readonly checkinRepo;
    private readonly matchRepo;
    private readonly questionRepo;
    private readonly answerRepo;
    private readonly poolRepo;
    private readonly recordRepo;
    private readonly redis;
    constructor(eventRepo: Repository<Event>, checkinRepo: Repository<CheckIn>, matchRepo: Repository<MatchPair>, questionRepo: Repository<IcebreakerQuestion>, answerRepo: Repository<IcebreakerAnswer>, poolRepo: Repository<LotteryPool>, recordRepo: Repository<LotteryRecord>, redis: Redis);
    generateReport(eventId: string): Promise<EventReport>;
    private formatDuration;
}
