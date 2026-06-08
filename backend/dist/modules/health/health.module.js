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
exports.HealthModule = exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_2 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let HealthController = class HealthController {
    dataSource;
    redis;
    constructor(dataSource, redis) {
        this.dataSource = dataSource;
        this.redis = redis;
    }
    async check() {
        const db = await this.checkDb();
        const redis = await this.checkRedis();
        const ok = db.ok && redis.ok;
        return {
            status: ok ? 'ok' : redis.enabled ? 'degraded' : 'down',
            uptime_s: Math.floor(process.uptime()),
            db,
            redis,
            pid: process.pid,
            ts: Date.now(),
        };
    }
    async checkDb() {
        const start = Date.now();
        try {
            await this.dataSource.query('SELECT 1');
            return { ok: true, latency_ms: Date.now() - start };
        }
        catch (err) {
            return { ok: false, error: err.message };
        }
    }
    async checkRedis() {
        const enabled = process.env.REDIS_ENABLED === undefined
            ? true
            : process.env.REDIS_ENABLED === 'true';
        if (!enabled) {
            return { enabled: false, ok: true };
        }
        const start = Date.now();
        try {
            await this.redis.ping();
            return { enabled: true, ok: true, latency_ms: Date.now() - start };
        }
        catch (err) {
            return { enabled: true, ok: false, error: err.message };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, common_2.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        ioredis_1.Redis])
], HealthController);
let HealthModule = class HealthModule {
};
exports.HealthModule = HealthModule;
exports.HealthModule = HealthModule = __decorate([
    (0, common_1.Module)({
        controllers: [HealthController],
    })
], HealthModule);
//# sourceMappingURL=health.module.js.map