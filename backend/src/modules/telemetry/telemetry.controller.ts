import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TelemetryService } from './telemetry.service';
import { TelemetryReportDto } from './dto/telemetry-report.dto';

interface BatchPayload {
  batch?: TelemetryReportDto[];
}

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly service: TelemetryService) {}

  /** 客户端上报入口：故意不挂 JwtGuard，避免用户没登录也丢不了错
   *  支持 { batch: [...] } 批量与单条对象两种格式 */
  @Post('report')
  report(@Body() body: TelemetryReportDto | BatchPayload) {
    if (body && 'batch' in body && Array.isArray((body as BatchPayload).batch)) {
      for (const item of (body as BatchPayload).batch!) {
        this.service.report(item);
      }
      return { ok: true, queued: (body as BatchPayload).batch!.length };
    }
    return this.service.report(body as TelemetryReportDto);
  }

  /** 内部调试用（仅管理员可访问） */
  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  summary() {
    return this.service.summary();
  }

  @Get('errors')
  @UseGuards(AuthGuard('jwt'))
  recentErrors() {
    return this.service.recentErrors();
  }
}
