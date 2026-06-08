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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceStreamController = void 0;
const common_1 = require("@nestjs/common");
const experience_stream_service_1 = require("./experience-stream.service");
let ExperienceStreamController = class ExperienceStreamController {
    streamService;
    constructor(streamService) {
        this.streamService = streamService;
    }
    async getStream(eventId) {
        const stream = await this.streamService.getStream(eventId);
        return stream;
    }
};
exports.ExperienceStreamController = ExperienceStreamController;
__decorate([
    (0, common_1.Get)(':event_id/stream'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExperienceStreamController.prototype, "getStream", null);
exports.ExperienceStreamController = ExperienceStreamController = __decorate([
    (0, common_1.Controller)('event'),
    __metadata("design:paramtypes", [experience_stream_service_1.ExperienceStreamService])
], ExperienceStreamController);
//# sourceMappingURL=experience-stream.controller.js.map