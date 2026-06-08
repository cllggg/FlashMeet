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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindChatMessage = void 0;
const typeorm_1 = require("typeorm");
const match_pair_entity_1 = require("../../entities/match-pair.entity");
let BlindChatMessage = class BlindChatMessage {
    id;
    match_id;
    match;
    sender_id;
    content;
    is_system;
    created_at;
};
exports.BlindChatMessage = BlindChatMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BlindChatMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlindChatMessage.prototype, "match_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => match_pair_entity_1.MatchPair),
    (0, typeorm_1.JoinColumn)({ name: 'match_id' }),
    __metadata("design:type", match_pair_entity_1.MatchPair)
], BlindChatMessage.prototype, "match", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlindChatMessage.prototype, "sender_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlindChatMessage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BlindChatMessage.prototype, "is_system", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BlindChatMessage.prototype, "created_at", void 0);
exports.BlindChatMessage = BlindChatMessage = __decorate([
    (0, typeorm_1.Entity)('blind_chat_messages')
], BlindChatMessage);
//# sourceMappingURL=chat-message.entity.js.map