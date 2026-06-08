"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const event_gateway_1 = require("./event.gateway");
const event_module_1 = require("../event/event.module");
const global_user_entity_1 = require("../global-user/entities/global-user.entity");
const icebreaker_module_1 = require("../icebreaker/icebreaker.module");
const match_module_1 = require("../match/match.module");
const experience_stream_module_1 = require("../experience-stream/experience-stream.module");
let GatewayModule = class GatewayModule {
};
exports.GatewayModule = GatewayModule;
exports.GatewayModule = GatewayModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([global_user_entity_1.GlobalUser]),
            event_module_1.EventModule,
            icebreaker_module_1.IcebreakerModule,
            match_module_1.MatchModule,
            experience_stream_module_1.ExperienceStreamModule,
        ],
        providers: [event_gateway_1.EventGateway],
        exports: [event_gateway_1.EventGateway],
    })
], GatewayModule);
//# sourceMappingURL=gateway.module.js.map