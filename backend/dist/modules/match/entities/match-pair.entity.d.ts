import { Event } from '../../event/entities/event.entity';
export declare enum MatchStatus {
    PENDING = "pending",
    HALF_ACCEPTED = "half_accepted",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
}
export declare class MatchPair {
    id: string;
    event_id: string;
    event: Event;
    user_a_id: string;
    user_b_id: string;
    similarity_score: number;
    common_tags: string[];
    status: MatchStatus;
    accepted_by: string;
    created_at: Date;
}
