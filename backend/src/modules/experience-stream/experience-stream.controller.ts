/**
 * ExperienceStreamController · REST 接口
 * ------------------------------------------------------------
 * GET /event/:event_id/stream
 *   - 返回当前 stream 全量（current + queue + history + suggestions + meta）
 *   - 用于首屏拉取 + 兜底轮询
 *   - 实时刷新走 WS（STREAM_UPDATED）
 *
 * 设计原则：
 *   - 不强制鉴权：参与者、主持人都能拉（参与者只用于"看进度"，不做写）
 *   - 关键：与前端 data shape 严格一致
 */

import { Controller, Get, Param } from '@nestjs/common';
import { ExperienceStreamService } from './experience-stream.service';

@Controller('event')
export class ExperienceStreamController {
  constructor(
    private readonly streamService: ExperienceStreamService,
  ) {}

  @Get(':event_id/stream')
  async getStream(@Param('event_id') eventId: string) {
    const stream = await this.streamService.getStream(eventId);
    return stream;
  }
}
