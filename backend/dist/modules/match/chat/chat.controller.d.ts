import { BlindChatService } from './chat.service';
export declare class BlindChatController {
    private readonly chatService;
    constructor(chatService: BlindChatService);
    getMessages(matchId: string): Promise<import("./entities/chat-message.entity").BlindChatMessage[]>;
    sendMessage(matchId: string, body: {
        sender_id: string;
        content: string;
    }): Promise<import("./entities/chat-message.entity").BlindChatMessage>;
}
