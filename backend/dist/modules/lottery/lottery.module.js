"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotteryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const lottery_pool_entity_1 = require("./entities/lottery-pool.entity");
const lottery_record_entity_1 = require("./entities/lottery-record.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const event_entity_1 = require("../event/entities/event.entity");
const lottery_service_1 = require("./lottery.service");
const lottery_controller_1 = require("./lottery.controller");
const gateway_module_1 = require("../gateway/gateway.module");
let LotteryModule = class LotteryModule {
};
exports.LotteryModule = LotteryModule;
exports.LotteryModule = LotteryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([lottery_pool_entity_1.LotteryPool, lottery_record_entity_1.LotteryRecord, checkin_entity_1.CheckIn, event_entity_1.Event]),
            (0, common_1.forwardRef)(() => gateway_module_1.GatewayModule),
        ],
        controllers: [lottery_controller_1.LotteryController],
        providers: [lottery_service_1.LotteryService],
        exports: [lottery_service_1.LotteryService],
    })
], LotteryModule);
//# sourceMappingURL=lottery.module.js.map