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
exports.LotteryController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const lottery_service_1 = require("./lottery.service");
const create_lottery_pool_dto_1 = require("./dto/create-lottery-pool.dto");
const draw_lottery_dto_1 = require("./dto/draw-lottery.dto");
let LotteryController = class LotteryController {
    lotteryService;
    constructor(lotteryService) {
        this.lotteryService = lotteryService;
    }
    async createPool(dto) {
        return this.lotteryService.createPool(dto);
    }
    async draw(req, dto) {
        if (dto.count && dto.count > 1) {
            return this.lotteryService.drawBatch(req.user.userId, dto);
        }
        return this.lotteryService.draw(req.user.userId, dto);
    }
    async getPools(eventId) {
        return this.lotteryService.getPools(eventId);
    }
    async getWinners(eventId, poolId) {
        return this.lotteryService.getWinners(eventId, poolId);
    }
    async exportWinnersCsv(eventId, poolId, res) {
        const winners = await this.lotteryService.getWinnersForExport(eventId, poolId);
        const escape = (s) => {
            const v = (s ?? '').toString();
            if (/[",\r\n]/.test(v))
                return `"${v.replace(/"/g, '""')}"`;
            return v;
        };
        const lines = ['抽奖时间,DisplayID,昵称,奖品,奖品价值(元),手机号'];
        for (const w of winners) {
            const phone = (w.user?.phone || '').toString();
            const masked = phone
                ? phone.replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2')
                : '';
            lines.push([
                new Date(w.won_at).toISOString(),
                w.display_id || '',
                w.user?.nickname || '',
                w.prize_name || '',
                w.prize_value ?? 0,
                masked,
            ]
                .map(escape)
                .join(','));
        }
        const body = '\uFEFF' + lines.join('\r\n');
        res.setHeader('Content-Disposition', `attachment; filename="winners_${eventId}.csv"`);
        res.send(body);
    }
};
exports.LotteryController = LotteryController;
__decorate([
    (0, common_1.Post)('pool'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lottery_pool_dto_1.CreateLotteryPoolDto]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "createPool", null);
__decorate([
    (0, common_1.Post)('draw'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, draw_lottery_dto_1.DrawLotteryDto]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "draw", null);
__decorate([
    (0, common_1.Get)(':event_id/pools'),
    __param(0, (0, common_1.Param)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "getPools", null);
__decorate([
    (0, common_1.Get)(':event_id/winners'),
    __param(0, (0, common_1.Param)('event_id')),
    __param(1, (0, common_1.Query)('pool_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "getWinners", null);
__decorate([
    (0, common_1.Get)(':event_id/winners/export.csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    __param(0, (0, common_1.Param)('event_id')),
    __param(1, (0, common_1.Query)('pool_id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "exportWinnersCsv", null);
exports.LotteryController = LotteryController = __decorate([
    (0, common_1.Controller)('lottery'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [lottery_service_1.LotteryService])
], LotteryController);
//# sourceMappingURL=lottery.controller.js.map