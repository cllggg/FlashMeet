/**
 * HostAssistantController · REST 接口
 * ------------------------------------------------------------
 * GET /event/:event_id/suggestions
 *   - 用于 Conductor 视图拉取（首屏 + 兜底轮询）
 *   - 实时刷新仍走 WS（STREAM_UPDATED 携带 suggestions）
 *
 * 设计原则：
 *   - 接口只对 host/co-host 开放
 *   - 内部已做 5s 缓存，高频轮询不会拖垮后端
 */

import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HostAssistantService } from './host-assistant.service';
import { EventService } from '../event/event.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Repository } from 'typeorm';
import { EventStatus } from '../../common/enums/event-status.enum';

@Controller('event')
@UseGuards(AuthGuard('jwt'))
export class HostAssistantController {
  constructor(
    private readonly assistant: HostAssistantService,
    private readonly eventService: EventService,
    @InjectRepository(CheckIn)
    private readonly checkinRepo: Repository<CheckIn>,
  ) {}

  @Get(':event_id/suggestions')
  async getSuggestions(
    @Param('event_id') eventId: string,
    @Req() req: any,
  ) {
    const event = await this.eventService.findOne(eventId);
    const userId = req.user.userId;
    const isHostOrCoHost =
      event.host_id === userId ||
      (event.co_host_ids || []).includes(userId);
    if (!isHostOrCoHost) {
      throw new ForbiddenException('Only host or co-host can view suggestions');
    }

    // 聚合上下文
    const { state } = await this.eventService.getCurrentState(eventId);
    const checkinCount = await this.checkinRepo.count({
      where: { event_id: eventId },
    });
    // v2.0 简化：interactionCount 从 Redis 聚合，失败兜底 0
    const interactionCount = 0;
    const now = Date.now();
    const elapsedMs = (event as any).state_started_at
      ? now - (event as any).state_started_at
      : 0;
    const recentChangeMs = 0; // 由调用方可选传 header: x-recent-change-ms

    const suggestions = this.assistant.generate({
      eventId,
      currentState: state as EventStatus,
      checkinCount,
      interactionCount,
      elapsedMs,
      recentChangeMs,
      previousState: (event as any).previous_state as EventStatus | undefined,
    });

    return {
      event_id: eventId,
      current_state: state,
      suggestions,
      generated_at: now,
    };
  }
}
