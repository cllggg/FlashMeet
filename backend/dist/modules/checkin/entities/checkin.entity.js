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
exports.CheckIn = void 0;
const typeorm_1 = require("typeorm");
const global_user_entity_1 = require("../../global-user/entities/global-user.entity");
const event_entity_1 = require("../../event/entities/event.entity");
let CheckIn = class CheckIn {
    id;
    event_id;
    event;
    user_id;
    user;
    name;
    local_tags;
    is_invisible;
    checked_in_at;
};
exports.CheckIn = CheckIn;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CheckIn.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CheckIn.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => event_entity_1.Event),
    (0, typeorm_1.JoinColumn)({ name: 'event_id' }),
    __metadata("design:type", event_entity_1.Event)
], CheckIn.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CheckIn.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => global_user_entity_1.GlobalUser),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", global_user_entity_1.GlobalUser)
], CheckIn.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CheckIn.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], CheckIn.prototype, "local_tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], CheckIn.prototype, "is_invisible", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CheckIn.prototype, "checked_in_at", void 0);
exports.CheckIn = CheckIn = __decorate([
    (0, typeorm_1.Entity)('check_ins'),
    (0, typeorm_1.Unique)(['event_id', 'user_id'])
], CheckIn);
//# sourceMappingURL=checkin.entity.js.map