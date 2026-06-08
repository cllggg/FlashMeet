/**
 * suggestion-rules
 * ------------------------------------------------------------
 * Host Assistant 规则引擎（v2.0 内置轻量版）
 *
 * Phase 4 会接入后端 AI 推理，本文件先实现"规则建议"以保证 v2.0 上线时
 * 主持人能立即看到有价值的下一步。
 *
 * 规则组成：
 *  - trigger: 触发条件（基于 stream 状态）
 *  - action:  建议的动作（跳转场景 / 打开管理页 / 触发算法）
 *  - tone:    视觉语气（primary/warning/success/info）
 *  - priority:越大越靠前
 *
 * 设计原则：
 *  - 永远只返回最多 3 条建议，避免信息过载
 *  - 同一时刻不重复建议
 *  - 主持人态（role=host）才返回控制类建议；参与者态只返回体验类
 */

import { EventStatus } from '../services/ws-events';

/** 流节点（与 useExperienceStream 保持同步） */
export interface StreamNodeLite {
  type: string;
  startedAt?: number;
  meta?: Record<string, any>;
}

/** 简化的 stream（避免与 useExperienceStream 循环依赖） */
export interface ExperienceStreamLite {
  current: StreamNodeLite | null;
  queue: StreamNodeLite[];
  history: StreamNodeLite[];
  meta: {
    eventId: string;
    title: string;
    state: string;
    checkinCount: number;
    interactionCount: number;
    lastUpdatedAt: number;
  };
}

export type ExperienceRole = 'host' | 'participant' | 'screen';

export interface ActivitySuggestion {
  id: string;
  icon: string;
  title: string;
  reason: string; // 解释"为什么"——这是 v2.0 区别于 v1.x 的关键
  tone: 'primary' | 'warning' | 'success' | 'info';
  priority: number; // 0-100
  action: {
    type:
      | 'change_scene'
      | 'open_icebreaker'
      | 'open_lottery'
      | 'generate_match'
      | 'end_event'
      | 'view_panel';
    target?: string;
  };
}

/** 时间阈值（毫秒） */
const T_3MIN = 3 * 60_000;
const T_5MIN = 5 * 60_000;
const T_10MIN = 10 * 60_000;

export function generateSuggestions(
  stream: ExperienceStreamLite,
  role: ExperienceRole = 'participant',
): ActivitySuggestion[] {
  const out: ActivitySuggestion[] = [];
  const cur = stream.current?.type;
  const checkinCount = stream.meta.checkinCount || 0;
  const curStartedAt = stream.current?.startedAt || Date.now();
  const elapsed = Date.now() - curStartedAt;

  if (role !== 'host') {
    // 参与者只看到引导类建议
    return out;
  }

  // ===== 主持人规则 =====

  // 规则 1：STANDBY 状态超过 0 秒 → 建议开始签到
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
    return out.slice(0, 3);
  }

  // 规则 2：CHECKIN 签到人数 ≥ 3 → 建议破冰
  if (cur === EventStatus.CHECKIN && checkinCount >= 3) {
    out.push({
      id: 'r-icebreaker',
      icon: '💬',
      title: '发起破冰',
      reason: `已有 ${checkinCount} 人签到，气氛正好，破冰问题让大家快速熟悉`,
      tone: 'primary',
      priority: 88,
      action: { type: 'open_icebreaker' },
    });
  }

  // 规则 3：CHECKIN 已 5 分钟且 < 3 人 → 建议再等或提醒
  if (cur === EventStatus.CHECKIN && elapsed > T_5MIN && checkinCount < 3) {
    out.push({
      id: 'r-checkin-wait',
      icon: '⏰',
      title: '签到人数偏少',
      reason: `已签到 ${checkinCount} 人，建议再等 2-3 分钟或先开始破冰`,
      tone: 'info',
      priority: 50,
      action: { type: 'change_scene', target: EventStatus.ICEBREAKER },
    });
  }

  // 规则 4：ICEBREAKER 进行中已 8 分钟 → 建议收尾
  if (cur === EventStatus.ICEBREAKER && elapsed > T_10MIN) {
    out.push({
      id: 'r-end-icebreaker',
      icon: '🎁',
      title: '破冰已热，准备抽奖',
      reason: '破冰已 10 分钟，趁热打铁开始抽奖把气氛推到高潮',
      tone: 'warning',
      priority: 75,
      action: { type: 'open_lottery' },
    });
  }

  // 规则 5：LOTTERY_READY → 一键开抽
  if (cur === EventStatus.LOTTERY_READY) {
    out.push({
      id: 'r-lottery-draw',
      icon: '🎰',
      title: '开始抽奖',
      reason: '确保奖池已配置好，点击进入抽奖环节',
      tone: 'warning',
      priority: 80,
      action: { type: 'change_scene', target: EventStatus.LOTTERY_RUNNING },
    });
  }

  // 规则 6：LOTTERY_RUNNING → 摇一摇
  if (cur === EventStatus.LOTTERY_RUNNING && elapsed > T_3MIN) {
    out.push({
      id: 'r-shake',
      icon: '📳',
      title: '试试摇一摇',
      reason: '抽奖之余用摇一摇带全场动起来，互动数会翻倍',
      tone: 'info',
      priority: 60,
      action: { type: 'change_scene', target: EventStatus.GAME_SHAKE },
    });
  }

  // 规则 7：GAME_SHAKE → CP 盲盒
  if (cur === EventStatus.GAME_SHAKE && elapsed > T_3MIN) {
    out.push({
      id: 'r-match',
      icon: '💘',
      title: 'CP盲盒匹配',
      reason: '摇一摇热身后，开启CP盲盒让参与者找到灵魂搭档',
      tone: 'info',
      priority: 65,
      action: { type: 'generate_match' },
    });
  }

  // 规则 8：GAME_MATCH 超过 10 分钟 → 收官
  if (cur === EventStatus.GAME_MATCH && elapsed > T_10MIN) {
    out.push({
      id: 'r-end',
      icon: '🏁',
      title: '可以收官了',
      reason: 'CP盲盒已 10 分钟，建议结束活动让参与者收到成就卡',
      tone: 'success',
      priority: 70,
      action: { type: 'end_event' },
    });
  }

  // 规则 9：任何状态下，未分配下一步时的兜底
  if (out.length === 0 && cur && cur !== EventStatus.ENDED) {
    const nextNode = stream.queue[0];
    out.push({
      id: 'r-fallback-next',
      icon: '⏭',
      title: '切到下一环节',
      reason: nextNode ? `当前结束后进入【${nextNode.type}】` : '流程未配置，手动切换',
      tone: 'info',
      priority: 30,
      action: { type: 'change_scene', target: nextNode?.type || EventStatus.ENDED },
    });
  }

  // 按优先级排序 + 截断
  return out.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
