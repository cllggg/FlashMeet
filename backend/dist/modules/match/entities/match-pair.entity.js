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
exports.MatchPair = exports.MatchStatus = void 0;
const typeorm_1 = require("typeorm");
const event_entity_1 = require("../../event/entities/event.entity");
var MatchStatus;
(function (MatchStatus) {
    MatchStatus["PENDING"] = "pending";
    MatchStatus["HALF_ACCEPTED"] = "half_accepted";
    MatchStatus["ACCEPTED"] = "accepted";
    MatchStatus["REJECTED"] = "rejected";
})(MatchStatus || (exports.MatchStatus = MatchStatus = {}));
let MatchPair = class MatchPair {
    id;
    event_id;
    event;
    user_a_id;
    user_b_id;
    similarity_score;
    common_tags;
    status;
    accepted_by;
    created_at;
};
exports.MatchPair = MatchPair;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MatchPair.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MatchPair.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => event_entity_1.Event),
    (0, typeorm_1.JoinColumn)({ name: 'event_id' }),
    __metadata("design:type", event_entity_1.Event)
], MatchPair.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MatchPair.prototype, "user_a_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MatchPair.prototype, "user_b_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], MatchPair.prototype, "similarity_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], MatchPair.prototype, "common_tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: MatchStatus.PENDING }),
    __metadata("design:type", String)
], MatchPair.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MatchPair.prototype, "accepted_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MatchPair.prototype, "created_at", void 0);
exports.MatchPair = MatchPair = __decorate([
    (0, typeorm_1.Entity)('match_pairs')
], MatchPair);
//# sourceMappingURL=match-pair.entity.js.map