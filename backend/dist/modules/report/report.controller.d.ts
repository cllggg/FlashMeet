import { ReportService } from './report.service';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    getReport(eventId: string): Promise<import("./report.service").EventReport>;
}
