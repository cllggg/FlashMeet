/**
 * HostAssistantService · 主持人 AI 助手（v2.0）
 * ------------------------------------------------------------
 * 职责：
 *   1. 基于规则（v2.0 轻量版）生成主持人"下一步"建议
 *   2. Phase 4.2+ 接入 LLM/AI 推理：聚合历史活动数据，给出"为什么"
 *   3. 缓存建议 5s 避免反复计算
 *
 * 设计原则：
 *   - 永远只返回最多 3 条建议（信息不过载）
 *   - 同一时刻不重复建议
 *   - 主持人态专属（参与者态不应被强推"换场景"）
 *   - 幂等：相同输入必然产生相同 ID 的建议
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventStatus } from '../../common/enums/event-status.enum';
import {
  ActivitySuggestion,
  SuggestionContext,
} from './host-assistant.types';

const T_3MIN = 3 * 60_000;
const T_5MIN = 5 * 60_000;
const T_10MIN = 10 * 60_000;

@Injectable()
export class HostAssistantService {
  private readonly logger = new Logger(HostAssistantService.name);
  private cache = new Map<string, { suggestions: ActivitySuggestion[]; at: number }>();
  private static readonly CACHE_TTL_MS = 5_000;

  /**
   * 主入口：基于上下文生成建议列表（最多 3 条）
   */
  generate(ctx: SuggestionContext): ActivitySuggestion[] {
    const cacheKey = `${ctx.eventId}:${ctx.currentState}:${ctx.checkinCount}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.at < HostAssistantService.CACHE_TTL_MS) {
      return cached.suggestions;
    }

    const suggestions = this.runRules(ctx);
    this.cache.set(cacheKey, { suggestions, at: Date.now() });
    return suggestions;
  }

  /** 规则主体：与 miniapp 端 suggestion-rules.ts 保持等价 */
  private runRules(ctx: SuggestionContext): ActivitySuggestion[] {
    const out: ActivitySuggestion[] = [];
    const { currentState: cur, checkinCount, elapsedMs, recentChangeMs } = ctx;
    const recentChanged = recentChangeMs < 30_000;

    // ===== 规则 1：STANDBY 状态建议开始签到 =====
    if (cur === EventStatus.STANDBY) {
      out.push({
        id: 'r-start-checkin',
        icon: '🚀',
        title: '开始签到',
        reason: '让参与者扫码入场，自动生成大屏上的暗星图谱',
        tone: 'primary',
        priority: 90,
        action: { type: 'change_scene', target: EventStatus.CHECKIN },
      });
    }

    // ===== 规则 2：签到达到 8 人，建议发起破冰暖场 =====
    if (cur === EventStatus.CHECKIN && checkinCount >= 8 && elapsedMs > T_3MIN) {
      out.push({
        id: 'r-checkin-to-icebreaker',
        icon: '💬',
        title: '发起破冰',
        reason: `已有 ${checkinCount} 人签到，氛围刚好适合一句话自我介绍`,
        tone: 'primary',
        priority: 85,
        action: { type: 'change_scene', target: EventStatus.ICEBREAKER },
      });
    }

    // ===== 规则 3：签到中超过 5 分钟还没人加入 → 提示分享 / 结束 =====
    if (cur === EventStatus.CHECKIN && checkinCount < 3 && elapsedMs > T_5MIN) {
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

    // ===== 规则 4：破冰超过 10 分钟 → 切到抽奖抽奖热场 =====
    if (cur === EventStatus.ICEBREAKER && elapsedMs > T_10MIN) {
      out.push({
        id: 'r-icebreaker-to-lottery',
        icon: '🎁',
        title: '进入抽奖',
        reason: '破冰环节节奏已充分，建议发奖品提振气氛',
        tone: 'success',
        priority: 75,
        action: { type: 'change_scene', target: EventStatus.LOTTERY_READY },
      });
    }

    // ===== 规则 5：抽奖准备就绪 → 切到 RUNNING =====
    if (cur === EventStatus.LOTTERY_READY && elapsedMs > T_3MIN) {
      out.push({
        id: 'r-lottery-start-draw',
        icon: '🏆',
        title: '开始开奖',
        reason: '已展示奖品 3 分钟，参与者已经"准备好"了',
        tone: 'primary',
        priority: 95,
        action: { type: 'change_scene', target: EventStatus.LOTTERY_RUNNING },
      });
    }

    // ===== 规则 6：摇一摇超过 5 分钟 → 提示进入匹配 =====
    if (cur === EventStatus.GAME_SHAKE && elapsedMs > T_5MIN) {
      out.push({
        id: 'r-shake-to-match',
        icon: '💞',
        title: '进入匹配',
        reason: '摇一摇已嗨够，现在最适合"遇见同频的人"',
        tone: 'success',
        priority: 70,
        action: { type: 'change_scene', target: EventStatus.GAME_MATCH },
      });
    }

    // ===== 规则 7：通用：随时建议结束 =====
    if (cur !== EventStatus.ENDED && elapsedMs > T_10MIN && !recentChanged) {
      out.push({
        id: 'r-end-event',
        icon: '🌟',
        title: '收尾结束',
        reason: '活动已经热闹了一阵，可以发成就卡 + 宣布结束',
        tone: 'info',
        priority: 50,
        action: { type: 'change_scene', target: EventStatus.ENDED },
      });
    }

    // ===== 规则 8：ENDED 状态建议回到 STANDBY 复用 =====
    if (cur === EventStatus.ENDED) {
      out.push({
        id: 'r-restart-event',
        icon: '♻️',
        title: '复用此活动',
        reason: '同一活动可继续下一场，避免新建一个',
        tone: 'info',
        priority: 60,
        action: { type: 'change_scene', target: EventStatus.STANDBY },
      });
    }

    // 排序 + 截断
    return out.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }
}
