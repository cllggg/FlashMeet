/**
 * host-assistant.types
 * ------------------------------------------------------------
 * 后端 Host Assistant 与前端 Conductor 共享的数据契约。
 * v2.0：服务端规则引擎（与 miniapp 端客户端版本保持等价，但放在服务端
 *       可以聚合多活动历史 + 后续接入 AI）。
 */

import { EventStatus } from '../../common/enums/event-status.enum';

export type SuggestionTone = 'primary' | 'warning' | 'success' | 'info';

export type SuggestionActionType =
  | 'change_scene'
  | 'open_icebreaker'
  | 'open_lottery'
  | 'generate_match'
  | 'end_event'
  | 'view_panel';

export interface ActivitySuggestion {
  /** 稳定 ID，幂等：相同 ID 表示同一条建议 */
  id: string;
  icon: string;
  title: string;
  /** 解释"为什么"——v2.0 区别于 v1.x 的关键 */
  reason: string;
  tone: SuggestionTone;
  /** 0-100，越大越靠前 */
  priority: number;
  action: {
    type: SuggestionActionType;
    /** change_scene 专用 */
    target?: EventStatus;
    /** 跳转 URL 路径，可选 */
    link?: string;
  };
}

export interface SuggestionContext {
  eventId: string;
  currentState: EventStatus;
  checkinCount: number;
  interactionCount: number;
  /** 距离当前状态开始多久，毫秒 */
  elapsedMs: number;
  /** 主持人是否在 30s 内刚切换过（防抖） */
  recentChangeMs: number;
  /** 上一状态（用于"建议回到上一步"） */
  previousState?: EventStatus;
}
