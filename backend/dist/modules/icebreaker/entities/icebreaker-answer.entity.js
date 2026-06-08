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
exports.IcebreakerAnswer = void 0;
const typeorm_1 = require("typeorm");
const event_entity_1 = require("../../event/entities/event.entity");
const icebreaker_question_entity_1 = require("./icebreaker-question.entity");
const global_user_entity_1 = require("../../global-user/entities/global-user.entity");
let IcebreakerAnswer = class IcebreakerAnswer {
    id;
    event_id;
    event;
    user_id;
    user;
    question_id;
    question;
    option_key;
    tag;
    color;
    answered_at;
};
exports.IcebreakerAnswer = IcebreakerAnswer;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], IcebreakerAnswer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IcebreakerAnswer.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => event_entity_1.Event),
    (0, typeorm_1.JoinColumn)({ name: 'event_id' }),
    __metadata("design:type", event_entity_1.Event)
], IcebreakerAnswer.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IcebreakerAnswer.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => global_user_entity_1.GlobalUser),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", global_user_entity_1.GlobalUser)
], IcebreakerAnswer.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IcebreakerAnswer.prototype, "question_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => icebreaker_question_entity_1.IcebreakerQuestion),
    (0, typeorm_1.JoinColumn)({ name: 'question_id' }),
    __metadata("design:type", icebreaker_question_entity_1.IcebreakerQuestion)
], IcebreakerAnswer.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IcebreakerAnswer.prototype, "option_key", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IcebreakerAnswer.prototype, "tag", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IcebreakerAnswer.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IcebreakerAnswer.prototype, "answered_at", void 0);
exports.IcebreakerAnswer = IcebreakerAnswer = __decorate([
    (0, typeorm_1.Entity)('icebreaker_answers'),
    (0, typeorm_1.Index)(['event_id', 'user_id', 'question_id'], { unique: true })
], IcebreakerAnswer);
//# sourceMappingURL=icebreaker-answer.entity.js.map