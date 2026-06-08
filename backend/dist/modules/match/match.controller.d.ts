import { MatchService } from './match.service';
export declare class MatchController {
    private readonly matchService;
    constructor(matchService: MatchService);
    getTopMatches(eventId: string, userId: string): Promise<import("./match.service").MatchResult[]>;
    generate(eventId: string): Promise<import("./match.service").MatchResult[]>;
    getMatches(eventId: string): Promise<import("./entities/match-pair.entity").MatchPair[]>;
    accept(eventId: string, body: {
        user_id: string;
    }): Promise<{
        status: "half" | "matched";
        pair: import("./entities/match-pair.entity").MatchPair;
    }>;
    reject(eventId: string, body: {
        user_id: string;
    }): Promise<void>;
}
