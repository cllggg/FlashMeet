/**
 * 应用内事件常量
 *
 * 业务模块通过 EventEmitter 抛出事件，Gateway 监听后广播到 WebSocket。
 * 这样可以彻底消除业务模块与 Gateway 的循环依赖。
 */
export const APP_EVENTS = {
  // 签到相关
  CHECKIN_CREATED: 'checkin.created',
  CHECKIN_UPDATED: 'checkin.updated',

  // 抽奖相关
  LOTTERY_DRAWN: 'lottery.drawn',
  LOTTERY_POOL_CREATED: 'lottery.pool.created',

  // 摇一摇
  SHAKE_UPDATED: 'shake.updated',
  SHAKE_STARTED: 'shake.started',
  SHAKE_ENDED: 'shake.ended',

  // 状态变更（业务模块抛，Gateway 转发 SCENE_UPDATED）
  SCENE_CHANGED: 'scene.changed',

  // 破冰/渐进式画像
  ICEBREAKER_PUBLISHED: 'icebreaker.published',
  ICEBREAKER_ANSWERED: 'icebreaker.answered',
  ICEBREAKER_CLOSED: 'icebreaker.closed',

  // 主持人变更
  HOST_HEARTBEAT: 'host.heartbeat',
  HOST_OFFLINE: 'host.offline',
  HOST_PROMOTED: 'host.promoted',

  // CP盲盒匹配
  MATCH_GENERATED: 'match.generated',
  MATCH_ACCEPTED: 'match.accepted',
  MATCH_REJECTED: 'match.rejected',
  MATCH_BLIND_CHAT: 'match.blind_chat',
} as const;
