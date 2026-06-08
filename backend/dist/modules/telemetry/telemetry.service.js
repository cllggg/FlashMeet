"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TelemetryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const common_1 = require("@nestjs/common");
const RING_MAX = 1000;
let TelemetryService = TelemetryService_1 = class TelemetryService {
    logger = new common_1.Logger(TelemetryService_1.name);
    stats = new Map();
    recent = [];
    report(dto) {
        const ts = Date.now();
        this.pushRecent({
            ts,
            metric: dto.metric,
            event_id: dto.event_id,
            role: dto.role,
            data: dto.data,
        });
        if (dto.metric === 'fps' || dto.metric === 'latency') {
            const value = Number(dto.data?.value);
            if (Number.isFinite(value)) {
                this.addSample(dto.metric, dto.event_id, dto.role, value);
            }
        }
        else if (dto.metric === 'error') {
            this.logger.warn(`[telemetry/error] event=${dto.event_id} role=${dto.role} ` +
                `session=${dto.session_id} data=${JSON.stringify(dto.data)}`);
        }
        else if (dto.metric === 'event') {
            this.logger.log(`[telemetry/event] ${dto.data?.name || 'unknown'} ` +
                `event=${dto.event_id} role=${dto.role}`);
        }
        return { ok: true, queued: this.recent.length };
    }
    addSample(metric, eventId, role, v = 0) {
        const k = `${metric}:${eventId || ''}:${role || ''}`;
        let s = this.stats.get(k);
        if (!s) {
            s = { samples: [], count: 0, sum: 0, min: Infinity, max: -Infinity };
            this.stats.set(k, s);
        }
        s.samples.push(v);
        s.count++;
        s.sum += v;
        if (v < s.min)
            s.min = v;
        if (v > s.max)
            s.max = v;
        if (s.samples.length > RING_MAX) {
            const drop = s.samples.shift();
            s.sum -= drop;
            s.count--;
        }
    }
    pushRecent(entry) {
        this.recent.push(entry);
        if (this.recent.length > 200)
            this.recent.shift();
    }
    summary() {
        const out = [];
        for (const [k, s] of this.stats.entries()) {
            const [metric, event_id, role] = k.split(':');
            const sorted = [...s.samples].sort((a, b) => a - b);
            const p = (p) => sorted[Math.floor((sorted.length - 1) * p)];
            out.push({
                metric,
                event_id: event_id || undefined,
                role: role || undefined,
                count: s.count,
                avg: s.count ? +(s.sum / s.count).toFixed(2) : 0,
                p50: +p(0.5).toFixed(2),
                p95: +p(0.95).toFixed(2),
                min: s.min === Infinity ? 0 : s.min,
                max: s.max === -Infinity ? 0 : s.max,
            });
        }
        return out;
    }
    recentErrors(limit = 20) {
        return this.recent
            .filter((r) => r.metric === 'error')
            .slice(-limit)
            .reverse();
    }
};
exports.TelemetryService = TelemetryService;
exports.TelemetryService = TelemetryService = TelemetryService_1 = __decorate([
    (0, common_1.Injectable)()
], TelemetryService);
//# sourceMappingURL=telemetry.service.js.map