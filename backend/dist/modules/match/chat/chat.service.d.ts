import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BlindChatMessage } from './entities/chat-message.entity';
import { MatchPair } from '../entities/match-pair.entity';
export declare class BlindChatService {
    private readonly chatRepo;
    private readonly matchRepo;
    private readonly emitter;
    private readonly logger;
    constructor(chatRepo: Repository<BlindChatMessage>, matchRepo: Repository<MatchPair>, emitter: EventEmitter2);
    onMatchAccepted(payload: {
        event_id: string;
        pair: MatchPair;
    }): Promise<void>;
    getMessages(matchId: string): Promise<BlindChatMessage[]>;
    sendMessage(matchId: string, senderId: string, content: string): Promise<BlindChatMessage>;
    sendIcebreakerPrompt(matchId: string, commonTags: string[]): Promise<BlindChatMessage>;
}
