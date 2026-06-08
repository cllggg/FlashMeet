import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { IcebreakerQuestion } from './entities/icebreaker-question.entity';
import { IcebreakerAnswer } from './entities/icebreaker-answer.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Event } from '../event/entities/event.entity';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { CreateIcebreakerDto } from './dto/create-icebreaker.dto';
import { AnswerIcebreakerDto } from './dto/answer-icebreaker.dto';
export declare const CURRENT_QUESTION_KEY: (eventId: string) => string;
export declare class IcebreakerService {
    private readonly questionRepo;
    private readonly answerRepo;
    private readonly checkinRepo;
    private readonly eventRepo;
    private readonly userRepo;
    private readonly emitter;
    private readonly redis;
    constructor(questionRepo: Repository<IcebreakerQuestion>, answerRepo: Repository<IcebreakerAnswer>, checkinRepo: Repository<CheckIn>, eventRepo: Repository<Event>, userRepo: Repository<GlobalUser>, emitter: EventEmitter2, redis: Redis);
    createQuestion(hostUserId: string, dto: CreateIcebreakerDto): Promise<IcebreakerQuestion>;
    publishQuestion(hostUserId: string, questionId: string): Promise<IcebreakerQuestion>;
    closeQuestion(hostUserId: string, eventId: string): Promise<void>;
    getCurrentQuestion(eventId: string): Promise<any | null>;
    answer(userId: string, dto: AnswerIcebreakerDto): Promise<IcebreakerAnswer>;
    answerGuest(deviceToken: string, userToken: string, dto: AnswerIcebreakerDto): Promise<IcebreakerAnswer>;
    listQuestions(eventId: string): Promise<IcebreakerQuestion[]>;
    getStarColors(eventId: string): Promise<Array<{
        user_id: string;
        color: string | null;
        tag: string | null;
    }>>;
    getStats(eventId: string): Promise<{
        totalAnswers: number;
        participantCount: number;
    }>;
}
