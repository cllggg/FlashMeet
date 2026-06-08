import { ExperienceStreamService } from './experience-stream.service';
export declare class ExperienceStreamController {
    private readonly streamService;
    constructor(streamService: ExperienceStreamService);
    getStream(eventId: string): Promise<import("./experience-stream.types").ExperienceStream>;
}
