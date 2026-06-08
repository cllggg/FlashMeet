import { TelemetryReportDto } from './dto/telemetry-report.dto';
export declare class TelemetryService {
    private readonly logger;
    private stats;
    private recent;
    report(dto: TelemetryReportDto): {
        ok: true;
        queued: number;
    };
    private addSample;
    private pushRecent;
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
    recentErrors(limit?: number): {
        ts: number;
        metric: string;
        event_id?: string;
        role?: string;
        data: Record<string, any>;
    }[];
}
