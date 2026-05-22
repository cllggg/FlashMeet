import { Repository } from 'typeorm';
import type { Response } from 'express';
import { Event } from '../event/entities/event.entity';
export declare class PublicController {
    private readonly eventRepo;
    constructor(eventRepo: Repository<Event>);
    checkinPage(eventId: string, res: Response): Promise<void>;
}
