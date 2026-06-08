import { Event } from '../../event/entities/event.entity';
export interface IcebreakerOption {
    key: string;
    label: string;
    tag: string;
    color: string;
}
export declare class IcebreakerQuestion {
    question_id: string;
    event_id: string;
    event: Event;
    prompt: string;
    options: IcebreakerOption[];
    display_order: number;
    is_active: boolean;
    created_at: Date;
}
