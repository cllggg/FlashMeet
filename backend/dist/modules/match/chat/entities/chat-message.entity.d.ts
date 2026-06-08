import { MatchPair } from '../../entities/match-pair.entity';
export declare class BlindChatMessage {
    id: string;
    match_id: string;
    match: MatchPair;
    sender_id: string;
    content: string;
    is_system: boolean;
    created_at: Date;
}
