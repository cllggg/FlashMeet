export declare class TelemetryReportDto {
    metric: 'fps' | 'latency' | 'error' | 'event';
    data: Record<string, any>;
    event_id?: string;
    role?: string;
    app_ver?: string;
    client_ts?: number;
    session_id?: string;
}
