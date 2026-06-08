"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const match_controller_1 = require("./match.controller");
const match_service_1 = require("./match.service");
const match_pair_entity_1 = require("./entities/match-pair.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const chat_module_1 = require("./chat/chat.module");
let MatchModule = class MatchModule {
};
exports.MatchModule = MatchModule;
exports.MatchModule = MatchModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([match_pair_entity_1.MatchPair, checkin_entity_1.CheckIn]), chat_module_1.BlindChatModule],
        controllers: [match_controller_1.MatchController],
        providers: [match_service_1.MatchService],
        exports: [match_service_1.MatchService],
    })
], MatchModule);
//# sourceMappingURL=match.module.js.map