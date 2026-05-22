"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const screen_controller_1 = require("./screen.controller");
const event_entity_1 = require("../event/entities/event.entity");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const lottery_record_entity_1 = require("../lottery/entities/lottery-record.entity");
let ScreenModule = class ScreenModule {
};
exports.ScreenModule = ScreenModule;
exports.ScreenModule = ScreenModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([event_entity_1.Event, checkin_entity_1.CheckIn, lottery_record_entity_1.LotteryRecord])],
        controllers: [screen_controller_1.ScreenController],
    })
], ScreenModule);
//# sourceMappingURL=screen.module.js.map