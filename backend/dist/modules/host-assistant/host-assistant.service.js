"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HostAssistantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostAssistantService = void 0;
const common_1 = require("@nestjs/common");
const event_status_enum_1 = require("../../common/enums/event-status.enum");
const T_3MIN = 3 * 60_000;
const T_5MIN = 5 * 60_000;
const T_10MIN = 10 * 60_000;
let HostAssistantService = class HostAssistantService {
    static { HostAssistantService_1 = this; }
    logger = new common_1.Logger(HostAssistantService_1.name);
    cache = new Map();
    static CACHE_TTL_MS = 5_000;
    generate(ctx) {
        const cacheKey = `${ctx.eventId}:${ctx.currentState}:${ctx.checkinCount}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.at < HostAssistantService_1.CACHE_TTL_MS) {
            return cached.suggestions;
        }
        const suggestions = this.runRules(ctx);
        this.cache.set(cacheKey, { suggestions, at: Date.now() });
        return suggestions;
    }
    runRules(ctx) {
        const out = [];
        const { currentState: cur, checkinCount, elapsedMs, recentChangeMs } = ctx;
        const recentChanged = recentChangeMs < 30_000;
        if (cur === event_status_enum_1.EventStatus.STANDBY) {
            out.push({
                id: 'r-start-checkin',
                icon: '🚀',
                title: '开始签到',
                reason: '让参与者扫码入场，自动生成大屏上的暗星图谱',
                tone: 'primary',
                priority: 90,
                action: { type: 'change_scene', target: event_status_enum_1.EventStatus.CHECKIN },
            });
        }
        if (cur === event_status_enum_1.EventStatus.CHECKIN && checkinCount >= 8 && elapsedMs > T_3MIN) {
            out.push({
                id: 'r-checkin-to-icebreaker',
                icon: '💬',
                title: '发起破冰',
                reason: `已有 ${checkinCount} 人签到，氛围刚好适合一句话自我介绍`,
                tone: 'primary',
                priority: 85,
                action: { type: 'change_scene', target: event_status_enum_1.EventStatus.ICEBREAKER },
            });
        }
        if (cur === event_status_enum_1.EventStatus.CHECKIN && checkinCount < 3 && elapsedMs > T_5MIN) {
            out.push({
                id: 'r-checkin-no-arrival',
                icon: '📤',
                title: '主动邀请',
                reason: '签到节奏较慢，建议主持人再次分享二维码或话筒邀约',
                tone: 'warning',
                priority: 70,
                action: { type: 'view_panel', link: '/pages/host/manage' },
            });
        }
        if (cur === event_status_enum_1.EventStatus.ICEBREAKER && elapsedMs > T_10MIN) {
            out.push({
                id: 'r-icebreaker-to-lottery',
                icon: '🎁',
                title: '进入抽奖',
                reason: '破冰环节节奏已充分，建议发奖品提振气氛',
                tone: 'success',
                priority: 75,
                action: { type: 'change_scene', target: event_status_enum_1.EventStatus.LOTTERY_READY },
            });
        }
        if (cur === event_status_enum_1.EventStatus.LOTTERY_READY && elapsedMs > T_3MIN) {
            out.push({
                id: 'r-lottery-start-draw',
                icon: '🏆',
                title: '开始开奖',
                reason: '已展示奖品 3 分钟，参与者已经"准备好"了',
                tone: 'primary',
                priority: 95,
                action: { type: 'change_scene', target: event_status_enum_1.EventStatus.LOTTERY_RUNNING },
            });
        }
        if (cur === event_status_enum_1.EventStatus.GAME_SHAKE && elapsedMs > T_5MIN) {
            out.push({
                id: 'r-shake-to-match',
                icon: '💞',
                title: '进入匹配',
                reason: '摇一摇已嗨够，现在最适合"遇见同频的人"',
                tone: 'success',
                priority: 70,
                action: { type: 'change_scene', target: event_status_enum_1.EventStatus.GAME_MATCH },
            });
        }
        if (cur !== event_status_enum_1.EventStatus.ENDED && elapsedMs > T_10MIN && !recentChanged) {
            out.push({
                id: 'r-end-event',
                icon: '🌟',
                title: '收尾结束',
                reason: '活动已经热闹了一阵，可以发成就卡 + 宣布结束',
                tone: 'info',
                priority: 50,
                action: { type: 'change_scene', target: event_status_enum_1.EventStatus.ENDED },
            });
        }
        if (cur === event_status_enum_1.EventStatus.ENDED) {
            out.push({
                id: 'r-restart-event',
                icon: '♻️',
                title: '复用此活动',
                reason: '同一活动可继续下一场，避免新建一个',
                tone: 'info',
                priority: 60,
                action: { type: 'change_scene', target: event_status_enum_1.EventStatus.STANDBY },
            });
        }
        return out.sort((a, b) => b.priority - a.priority).slice(0, 3);
    }
};
exports.HostAssistantService = HostAssistantService;
exports.HostAssistantService = HostAssistantService = HostAssistantService_1 = __decorate([
    (0, common_1.Injectable)()
], HostAssistantService);
//# sourceMappingURL=host-assistant.service.js.map