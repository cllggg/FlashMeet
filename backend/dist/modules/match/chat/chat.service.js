"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BlindChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const event_emitter_2 = require("@nestjs/event-emitter");
const chat_message_entity_1 = require("./entities/chat-message.entity");
const match_pair_entity_1 = require("../entities/match-pair.entity");
const app_events_1 = require("../../../common/constants/app-events");
const ICEBREAKER_PROMPTS = [
    '你好！我们的标签好像很相似，共同标签有{tags}，你觉得最准的是哪个？',
    '哈喽！系统说我们很合拍，你平时最喜欢做什么？',
    'Hi~ 看到你的标签里有{tags}，我也是！你是做什么的？',
    '你好呀！没想到在这里遇到同好，{tags}这个领域你也喜欢？',
    '缘分！我们居然有{tags}这几个共同标签，最近有在关注什么吗？',
    'Hey！猜猜我们为什么被匹配到一起？提示：{tags}',
];
let BlindChatService = BlindChatService_1 = class BlindChatService {
    chatRepo;
    matchRepo;
    emitter;
    logger = new common_1.Logger(BlindChatService_1.name);
    constructor(chatRepo, matchRepo, emitter) {
        this.chatRepo = chatRepo;
        this.matchRepo = matchRepo;
        this.emitter = emitter;
    }
    async onMatchAccepted(payload) {
        const pair = payload.pair;
        if (!pair)
            return;
        const tags = pair.common_tags || [];
        await this.sendIcebreakerPrompt(pair.id, tags);
    }
    async getMessages(matchId) {
        return this.chatRepo.find({
            where: { match_id: matchId },
            order: { created_at: 'ASC' },
        });
    }
    async sendMessage(matchId, senderId, content) {
        const pair = await this.matchRepo.findOne({ where: { id: matchId } });
        if (!pair || pair.status !== match_pair_entity_1.MatchStatus.ACCEPTED) {
            throw new Error('Match not accepted');
        }
        const msg = this.chatRepo.create({
            match_id: matchId,
            sender_id: senderId,
            content,
            is_system: false,
        });
        await this.chatRepo.save(msg);
        this.emitter.emit(app_events_1.APP_EVENTS.MATCH_BLIND_CHAT, {
            match_id: matchId,
            message: msg,
        });
        return msg;
    }
    async sendIcebreakerPrompt(matchId, commonTags) {
        const template = ICEBREAKER_PROMPTS[Math.floor(Math.random() * ICEBREAKER_PROMPTS.length)];
        const tagStr = commonTags.slice(0, 3).join('、');
        const content = template.replace('{tags}', tagStr || '共同兴趣');
        const msg = this.chatRepo.create({
            match_id: matchId,
            sender_id: 'system',
            content,
            is_system: true,
        });
        await this.chatRepo.save(msg);
        return msg;
    }
};
exports.BlindChatService = BlindChatService;
__decorate([
    (0, event_emitter_2.OnEvent)(app_events_1.APP_EVENTS.MATCH_ACCEPTED, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BlindChatService.prototype, "onMatchAccepted", null);
exports.BlindChatService = BlindChatService = BlindChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_message_entity_1.BlindChatMessage)),
    __param(1, (0, typeorm_1.InjectRepository)(match_pair_entity_1.MatchPair)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], BlindChatService);
//# sourceMappingURL=chat.service.js.map