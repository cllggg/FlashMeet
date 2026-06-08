import { EventStatus } from './event-status.enum';
export declare const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]>;
export declare function isTransitionAllowed(from: EventStatus, to: EventStatus): boolean;
