/**
 * 全局错误码 → 用户可读消息映射
 *
 * 后端错误约定：
 *  - HTTP 4xx/5xx + body.message 给开发者
 *  - body.code 业务码（可选），body.userMessage 给最终用户
 *
 * 前端统一从这里走，不在业务页写硬编码文案。
 */
export interface ApiError {
  /** 业务码，如 'EVENT_NOT_FOUND' */
  code?: string;
  /** 给开发者看的技术消息 */
  message?: string;
  /** 给最终用户看的友好消息（后端可直传） */
  userMessage?: string;
  /** HTTP 状态码 */
  status?: number;
}

const NETWORK_DEFAULT = '网络不太通畅，请检查 Wi-Fi 或移动数据';
const TIMEOUT_DEFAULT = '请求超时，请稍后重试';
const SERVER_DEFAULT = '服务暂时不可用，请稍后再试';

const CODE_MAP: Record<string, string> = {
  // auth
  UNAUTHORIZED: '请先登录',
  TOKEN_EXPIRED: '登录已过期，请重新登录',
  FORBIDDEN: '无权操作',

  // event
  EVENT_NOT_FOUND: '活动不存在或已结束',
  EVENT_ENDED: '活动已结束',
  EVENT_NOT_STARTED: '活动还未开始',

  // checkin
  ALREADY_CHECKED_IN: '你已经签到过啦',
  CHECKIN_FAILED: '签到失败，请重试',

  // icebreaker
  NO_ACTIVE_QUESTION: '当前没有进行中的问题',
  ALREADY_ANSWERED: '你已回答过这道题',
  QUESTION_CLOSED: '问题已结束',

  // lottery
  LOTTERY_NOT_READY: '抽奖还未开始',
  LOTTERY_OUT_OF_STOCK: '奖品已被抽完',
  LOTTERY_NOT_WINNER: '很遗憾，这次没中奖',

  // shake
  SHAKE_NOT_ACTIVE: '摇一摇活动未开始',

  // rate limit
  RATE_LIMITED: '操作太频繁，请稍后再试',

  // generic
  INVALID_PARAMS: '参数有误',
  INTERNAL_ERROR: '服务暂时不可用，请稍后再试',
};

export function mapErrorToMessage(err: ApiError | null | undefined): string {
  if (!err) return SERVER_DEFAULT;

  // 网络层错误
  if (err.status === 0) {
    return err.message?.includes('timeout') ? TIMEOUT_DEFAULT : NETWORK_DEFAULT;
  }

  // 后端直传 userMessage 优先（最贴近后端语义）
  if (err.userMessage) return err.userMessage;

  // 业务码命中
  if (err.code && CODE_MAP[err.code]) {
    return CODE_MAP[err.code];
  }

  // HTTP 状态码兜底
  if (err.status === 401) return '请先登录';
  if (err.status === 403) return '无权操作';
  if (err.status === 404) return '资源不存在';
  if (err.status === 429) return '操作太频繁，请稍后再试';
  if (err.status && err.status >= 500) return SERVER_DEFAULT;

  return err.message || SERVER_DEFAULT;
}

/** 是否值得给用户提供「重试」入口 */
export function isRetryable(err: any): boolean {
  if (!err) return false;
  // 网络断/超时
  if (err.status === 0 || err?.statusCode === 0) return true;
  // 5xx
  const s = err.status ?? err.statusCode;
  if (typeof s === 'number' && s >= 500 && s < 600) return true;
  // 429
  if (s === 429) return true;
  return false;
}
