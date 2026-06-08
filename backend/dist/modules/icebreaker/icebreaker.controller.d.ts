import { IcebreakerService } from './icebreaker.service';
import { CreateIcebreakerDto } from './dto/create-icebreaker.dto';
import { AnswerIcebreakerDto } from './dto/answer-icebreaker.dto';
export declare class IcebreakerController {
    private readonly service;
    constructor(service: IcebreakerService);
    create(req: any, dto: CreateIcebreakerDto): Promise<import("./entities/icebreaker-question.entity").IcebreakerQuestion>;
    publish(req: any, questionId: string): Promise<import("./entities/icebreaker-question.entity").IcebreakerQuestion>;
    close(req: any, eventId: string): Promise<{
        ok: boolean;
    }>;
    answer(req: any, dto: AnswerIcebreakerDto): Promise<import("./entities/icebreaker-answer.entity").IcebreakerAnswer>;
    answerGuest(dto: AnswerIcebreakerDto, deviceToken?: string, userToken?: string): Promise<import("./entities/icebreaker-answer.entity").IcebreakerAnswer>;
    list(eventId: string): Promise<import("./entities/icebreaker-question.entity").IcebreakerQuestion[]>;
    starColors(eventId: string): Promise<{
        user_id: string;
        color: string | null;
        tag: string | null;
    }[]>;
    current(eventId: string): Promise<{
        event_id: string;
        question: any;
    }>;
    stats(eventId: string): Promise<{
        totalAnswers: number;
        participantCount: number;
    }>;
}
