import { EventStatus } from './event-status.enum';

/**
 * 合法状态转移矩阵
 * - key: 当前状态
 * - value: 允许跳转到的目标状态集合
 *
 * 设计原则：
 * 1. 主持人可"撤销"操作（如从抽奖中切回签到），避免现场失误不可逆
 * 2. ENDED 状态只能重置为 STANDBY（同一活动复用）
 * 3. STANDBY 是唯一起点
 */
export const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.STANDBY]: [
    EventStatus.CHECKIN,
    EventStatus.ICEBREAKER,
    EventStatus.LOTTERY_READY,
    EventStatus.GAME_SHAKE,
    EventStatus.GAME_MATCH,
    EventStatus.ENDED,
  ],
  [EventStatus.CHECKIN]: [
    EventStatus.STANDBY,
    EventStatus.ICEBREAKER,
    EventStatus.LOTTERY_READY,
    EventStatus.GAME_SHAKE,
    EventStatus.GAME_MATCH,
    EventStatus.ENDED,
  ],
  [EventStatus.ICEBREAKER]: [
    EventStatus.STANDBY,
    EventStatus.CHECKIN,
    EventStatus.LOTTERY_READY,
    EventStatus.GAME_SHAKE,
    EventStatus.GAME_MATCH,
    EventStatus.ENDED,
  ],
  [EventStatus.LOTTERY_READY]: [
    EventStatus.STANDBY,
    EventStatus.CHECKIN,
    EventStatus.ICEBREAKER,
    EventStatus.LOTTERY_RUNNING,
    EventStatus.GAME_SHAKE,
    EventStatus.GAME_MATCH,
    EventStatus.ENDED,
  ],
  [EventStatus.LOTTERY_RUNNING]: [
    EventStatus.STANDBY,
    EventStatus.CHECKIN,
    EventStatus.LOTTERY_READY,
    EventStatus.ICEBREAKER,
    EventStatus.GAME_SHAKE,
    EventStatus.GAME_MATCH,
    EventStatus.ENDED,
  ],
  [EventStatus.GAME_SHAKE]: [
    EventStatus.STANDBY,
    EventStatus.LOTTERY_READY,
    EventStatus.CHECKIN,
    EventStatus.ICEBREAKER,
    EventStatus.GAME_MATCH,
    EventStatus.ENDED,
  ],
  [EventStatus.GAME_MATCH]: [
    EventStatus.STANDBY,
    EventStatus.CHECKIN,
    EventStatus.ICEBREAKER,
    EventStatus.LOTTERY_READY,
    EventStatus.GAME_SHAKE,
    EventStatus.ENDED,
  ],
  [EventStatus.ENDED]: [EventStatus.STANDBY],
};

export function isTransitionAllowed(
  from: EventStatus,
  to: EventStatus,
): boolean {
  if (from === to) return true; // 幂等：相同状态允许（前端会重复点击）
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}
