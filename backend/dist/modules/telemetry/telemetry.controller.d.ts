import { TelemetryService } from './telemetry.service';
import { TelemetryReportDto } from './dto/telemetry-report.dto';
interface BatchPayload {
    batch?: TelemetryReportDto[];
}
export declare class TelemetryController {
    private readonly service;
    constructor(service: TelemetryService);
    report(body: TelemetryReportDto | BatchPayload): {
        ok: boolean;
        queued: number;
    };
    summary(): {
        metric: string;
        event_id?: string;
        role?: string;
        count: number;
        avg: number;
        p50: number;
        p95: number;
        min: number;
        max: number;
    }[];
    recentErrors(): {
        ts: number;
        metric: string;
        event_id?: string;
        role?: string;
        data: Record<string, any>;
    }[];
}
export {};
