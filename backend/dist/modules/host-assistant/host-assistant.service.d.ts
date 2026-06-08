import { ActivitySuggestion, SuggestionContext } from './host-assistant.types';
export declare class HostAssistantService {
    private readonly logger;
    private cache;
    private static readonly CACHE_TTL_MS;
    generate(ctx: SuggestionContext): ActivitySuggestion[];
    private runRules;
}
