"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IcebreakerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const icebreaker_question_entity_1 = require("./entities/icebreaker-question.entity");
const icebreaker_answer_entity_1 = require("./entities/icebreaker-answer.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const event_entity_1 = require("../event/entities/event.entity");
const global_user_entity_1 = require("../global-user/entities/global-user.entity");
const icebreaker_service_1 = require("./icebreaker.service");
const icebreaker_controller_1 = require("./icebreaker.controller");
let IcebreakerModule = class IcebreakerModule {
};
exports.IcebreakerModule = IcebreakerModule;
exports.IcebreakerModule = IcebreakerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                icebreaker_question_entity_1.IcebreakerQuestion,
                icebreaker_answer_entity_1.IcebreakerAnswer,
                checkin_entity_1.CheckIn,
                event_entity_1.Event,
                global_user_entity_1.GlobalUser,
            ]),
        ],
        controllers: [icebreaker_controller_1.IcebreakerController],
        providers: [icebreaker_service_1.IcebreakerService],
        exports: [icebreaker_service_1.IcebreakerService],
    })
], IcebreakerModule);
//# sourceMappingURL=icebreaker.module.js.map