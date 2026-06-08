/**
 * activity-meta · 活动元数据（screen 端共享版）
 * ------------------------------------------------------------
 * 与 miniapp/src/composables/experience-stream-types.ts 的 ACTIVITY_META 保持同步。
 * 大屏组件可直接消费，主持人 Conductor 与用户 Live 也用同一份配色与图标。
 */

import { EventStatus } from '../types/enums';

export interface ActivityMeta {
  label: string;
  icon: string;
  color: string;
  gradient: string;
  /** 大屏背景（透明度 0.4，叠加在内容上） */
  ambient: string;
  /** 提示音（如果存在） */
  sound?: string;
}

export const ACTIVITY_META: Record<string, ActivityMeta> = {
  [EventStatus.STANDBY]: {
    label: '待机',
    icon: '⏳',
    color: '#8896b0',
    gradient: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
    ambient: 'rgba(74, 85, 104, 0.35)',
  },
  [EventStatus.CHECKIN]: {
    label: '签到中',
    icon: '✨',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)',
    ambient: 'rgba(255, 215, 0, 0.18)',
    sound: 'checkin',
  },
  [EventStatus.ICEBREAKER]: {
    label: '破冰',
    icon: '💬',
    color: '#ff6b6b',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffd700 100%)',
    ambient: 'rgba(255, 107, 107, 0.18)',
  },
  [EventStatus.LOTTERY_READY]: {
    label: '抽奖准备',
    icon: '🎁',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #764ba2 100%)',
    ambient: 'rgba(255, 215, 0, 0.18)',
  },
  [EventStatus.LOTTERY_RUNNING]: {
    label: '开奖中',
    icon: '🏆',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)',
    ambient: 'rgba(255, 215, 0, 0.28)',
    sound: 'win',
  },
  [EventStatus.GAME_SHAKE]: {
    label: '摇一摇',
    icon: '🎉',
    color: '#667eea',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ambient: 'rgba(102, 126, 234, 0.22)',
    sound: 'shake_start',
  },
  [EventStatus.GAME_MATCH]: {
    label: '同频匹配',
    icon: '💞',
    color: '#ff6b6b',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #764ba2 100%)',
    ambient: 'rgba(255, 107, 107, 0.22)',
  },
  [EventStatus.ENDED]: {
    label: '圆满结束',
    icon: '🌟',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #764ba2 100%)',
    ambient: 'rgba(255, 215, 0, 0.18)',
  },
};

/** 顺序：决定 "下一步" 的判断（与 miniapp 一致） */
export const ACTIVITY_TIMELINE: string[] = [
  EventStatus.STANDBY,
  EventStatus.CHECKIN,
  EventStatus.ICEBREAKER,
  EventStatus.LOTTERY_READY,
  EventStatus.LOTTERY_RUNNING,
  EventStatus.GAME_SHAKE,
  EventStatus.GAME_MATCH,
  EventStatus.ENDED,
];

/** 取下一个活动（不修改原数组） */
export function nextActivityOf(current: string): string | null {
  const idx = ACTIVITY_TIMELINE.indexOf(current);
  if (idx < 0 || idx >= ACTIVITY_TIMELINE.length - 1) return null;
  return ACTIVITY_TIMELINE[idx + 1];
}
