"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindChatModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
const chat_message_entity_1 = require("./entities/chat-message.entity");
const match_pair_entity_1 = require("../entities/match-pair.entity");
let BlindChatModule = class BlindChatModule {
};
exports.BlindChatModule = BlindChatModule;
exports.BlindChatModule = BlindChatModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([chat_message_entity_1.BlindChatMessage, match_pair_entity_1.MatchPair])],
        controllers: [chat_controller_1.BlindChatController],
        providers: [chat_service_1.BlindChatService],
        exports: [chat_service_1.BlindChatService],
    })
], BlindChatModule);
//# sourceMappingURL=chat.module.js.map