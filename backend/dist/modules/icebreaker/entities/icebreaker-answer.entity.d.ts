import { Event } from '../../event/entities/event.entity';
import { IcebreakerQuestion } from './icebreaker-question.entity';
import { GlobalUser } from '../../global-user/entities/global-user.entity';
export declare class IcebreakerAnswer {
    id: string;
    event_id: string;
    event: Event;
    user_id: string;
    user: GlobalUser;
    question_id: string;
    question: IcebreakerQuestion;
    option_key: string;
    tag: string;
    color: string;
    answered_at: Date;
}
