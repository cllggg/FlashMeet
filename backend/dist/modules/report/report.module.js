"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const report_controller_1 = require("./report.controller");
const report_service_1 = require("./report.service");
const event_entity_1 = require("../event/entities/event.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const match_pair_entity_1 = require("../match/entities/match-pair.entity");
const icebreaker_question_entity_1 = require("../icebreaker/entities/icebreaker-question.entity");
const icebreaker_answer_entity_1 = require("../icebreaker/entities/icebreaker-answer.entity");
const lottery_pool_entity_1 = require("../lottery/entities/lottery-pool.entity");
const lottery_record_entity_1 = require("../lottery/entities/lottery-record.entity");
let ReportModule = class ReportModule {
};
exports.ReportModule = ReportModule;
exports.ReportModule = ReportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                event_entity_1.Event,
                checkin_entity_1.CheckIn,
                match_pair_entity_1.MatchPair,
                icebreaker_question_entity_1.IcebreakerQuestion,
                icebreaker_answer_entity_1.IcebreakerAnswer,
                lottery_pool_entity_1.LotteryPool,
                lottery_record_entity_1.LotteryRecord,
            ]),
        ],
        controllers: [report_controller_1.ReportController],
        providers: [report_service_1.ReportService],
        exports: [report_service_1.ReportService],
    })
], ReportModule);
//# sourceMappingURL=report.module.js.map