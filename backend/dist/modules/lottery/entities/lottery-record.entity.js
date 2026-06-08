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
exports.LotteryRecord = void 0;
const typeorm_1 = require("typeorm");
const global_user_entity_1 = require("../../global-user/entities/global-user.entity");
const event_entity_1 = require("../../event/entities/event.entity");
const lottery_pool_entity_1 = require("./lottery-pool.entity");
let LotteryRecord = class LotteryRecord {
    id;
    event_id;
    event;
    user_id;
    user;
    pool_id;
    pool;
    prize_name;
    prize_image_url;
    prize_value;
    won_at;
};
exports.LotteryRecord = LotteryRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LotteryRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LotteryRecord.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => event_entity_1.Event),
    (0, typeorm_1.JoinColumn)({ name: 'event_id' }),
    __metadata("design:type", event_entity_1.Event)
], LotteryRecord.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LotteryRecord.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => global_user_entity_1.GlobalUser),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", global_user_entity_1.GlobalUser)
], LotteryRecord.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LotteryRecord.prototype, "pool_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lottery_pool_entity_1.LotteryPool),
    (0, typeorm_1.JoinColumn)({ name: 'pool_id' }),
    __metadata("design:type", lottery_pool_entity_1.LotteryPool)
], LotteryRecord.prototype, "pool", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LotteryRecord.prototype, "prize_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LotteryRecord.prototype, "prize_image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LotteryRecord.prototype, "prize_value", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LotteryRecord.prototype, "won_at", void 0);
exports.LotteryRecord = LotteryRecord = __decorate([
    (0, typeorm_1.Entity)('lottery_records')
], LotteryRecord);
//# sourceMappingURL=lottery-record.entity.js.map