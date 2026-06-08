/**
 * experience-stream-types
 * ------------------------------------------------------------
 * Experience Stream 相关类型与常量定义
 * 与后端 backend/src/common/enums/event-status.enum.ts 保持同步
 */

import { EventStatus } from '../services/ws-events';

/** v2.0 标准活动流（用户进入 Live 容器后默认流程） */
export const ACTIVITY_TIMELINE: string[] = [
  EventStatus.STANDBY,
  EventStatus.CHECKIN,
  EventStatus.ICEBREAKER,
  EventStatus.GAME_SHAKE,
  EventStatus.LOTTERY_READY,
  EventStatus.LOTTERY_RUNNING,
  EventStatus.GAME_MATCH,
  EventStatus.ENDED,
];

/** 活动对应的中文标签 / 图标 / 主题色 */
export const ACTIVITY_META: Record<
  string,
  { label: string; icon: string; color: string; gradient: string }
> = {
  [EventStatus.STANDBY]: {
    label: '待机',
    icon: '⏳',
    color: '#8896b0',
    gradient: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
  },
  [EventStatus.CHECKIN]: {
    label: '签到',
    icon: '📍',
    color: '#4ecdc4',
    gradient: 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)',
  },
  [EventStatus.ICEBREAKER]: {
    label: '破冰',
    icon: '💬',
    color: '#667eea',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  [EventStatus.GAME_SHAKE]: {
    label: '摇一摇',
    icon: '📳',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)',
  },
  [EventStatus.LOTTERY_READY]: {
    label: '抽奖',
    icon: '🎁',
    color: '#ff6b6b',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
  },
  [EventStatus.LOTTERY_RUNNING]: {
    label: '抽奖中',
    icon: '🎰',
    color: '#ff6b6b',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
  },
  [EventStatus.GAME_MATCH]: {
    label: 'CP盲盒',
    icon: '💘',
    color: '#ff8a80',
    gradient: 'linear-gradient(135deg, #ff8a80 0%, #ff6b9d 100%)',
  },
  [EventStatus.ENDED]: {
    label: '已结束',
    icon: '✅',
    color: '#66bb6a',
    gradient: 'linear-gradient(135deg, #4fc3f7 0%, #66bb6a 100%)',
  },
};

export { EventStatus };
