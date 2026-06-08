/**
 * experience-stream.types
 * ------------------------------------------------------------
 * 与 miniapp/screen 端的 ExperienceStream 数据契约保持一致。
 * 一份 stream = current + queue + history + suggestions + meta。
 */

import { EventStatus } from '../../common/enums/event-status.enum';
import { ActivitySuggestion } from '../host-assistant/host-assistant.types';

export interface StreamNode {
  type: EventStatus;
  startedAt: number;
  endedAt?: number;
  meta?: Record<string, any>;
}

export interface StreamMeta {
  eventId: string;
  title: string;
  state: EventStatus;
  checkinCount: number;
  interactionCount: number;
  lastUpdatedAt: number;
}

export interface ExperienceStream {
  current: StreamNode | null;
  queue: StreamNode[];
  history: StreamNode[];
  suggestions: ActivitySuggestion[];
  meta: StreamMeta;
}

/** 活动顺序：与前端 ACTIVITY_TIMELINE 保持一致 */
export const STREAM_TIMELINE: EventStatus[] = [
  EventStatus.STANDBY,
  EventStatus.CHECKIN,
  EventStatus.ICEBREAKER,
  EventStatus.LOTTERY_READY,
  EventStatus.LOTTERY_RUNNING,
  EventStatus.GAME_SHAKE,
  EventStatus.GAME_MATCH,
  EventStatus.ENDED,
];
