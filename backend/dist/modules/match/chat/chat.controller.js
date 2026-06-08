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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
let BlindChatController = class BlindChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getMessages(matchId) {
        return this.chatService.getMessages(matchId);
    }
    async sendMessage(matchId, body) {
        return this.chatService.sendMessage(matchId, body.sender_id, body.content);
    }
};
exports.BlindChatController = BlindChatController;
__decorate([
    (0, common_1.Get)(':match_id/messages'),
    __param(0, (0, common_1.Param)('match_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BlindChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':match_id/send'),
    __param(0, (0, common_1.Param)('match_id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BlindChatController.prototype, "sendMessage", null);
exports.BlindChatController = BlindChatController = __decorate([
    (0, common_1.Controller)('match/chat'),
    __metadata("design:paramtypes", [chat_service_1.BlindChatService])
], BlindChatController);
//# sourceMappingURL=chat.controller.js.map