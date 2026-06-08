import { EventStatus } from '../../common/enums/event-status.enum';
export type SuggestionTone = 'primary' | 'warning' | 'success' | 'info';
export type SuggestionActionType = 'change_scene' | 'open_icebreaker' | 'open_lottery' | 'generate_match' | 'end_event' | 'view_panel';
export interface ActivitySuggestion {
    id: string;
    icon: string;
    title: string;
    reason: string;
    tone: SuggestionTone;
    priority: number;
    action: {
        type: SuggestionActionType;
        target?: EventStatus;
        link?: string;
    };
}
export interface SuggestionContext {
    eventId: string;
    currentState: EventStatus;
    checkinCount: number;
    interactionCount: number;
    elapsedMs: number;
    recentChangeMs: number;
    previousState?: EventStatus;
}
