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
export declare const STREAM_TIMELINE: EventStatus[];
