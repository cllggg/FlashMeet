import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthGuard } from '@nestjs/passport';
import { EventService } from './event.service';
import { HostPresenceService } from './host-presence.service';
import { EventStatus } from '../../common/enums/event-status.enum';
import { ALLOWED_TRANSITIONS } from '../../common/enums/state-transitions';
import { APP_EVENTS } from '../../common/constants/app-events';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('event')
@UseGuards(AuthGuard('jwt'))
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly emitter: EventEmitter2,
    private readonly hostPresence: HostPresenceService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateEventDto) {
    return this.eventService.create(req.user.userId, dto);
  }

  @Get(':event_id')
  async findOne(@Param('event_id') eventId: string) {
    return this.eventService.findOne(eventId);
  }

  @Get(':event_id/current_state')
  async getCurrentState(@Param('event_id') eventId: string) {
    return this.eventService.getCurrentState(eventId);
  }

  /**
   * 返回当前状态下允许跳转的目标状态列表
   * 前端根据此列表动态渲染切换按钮，避免前后端状态矩阵不一致
   */
  @Get(':event_id/allowed_transitions')
  async getAllowedTransitions(@Param('event_id') eventId: string) {
    const { state } = await this.eventService.getCurrentState(eventId);
    return {
      current_state: state,
      allowed: ALLOWED_TRANSITIONS[state] || [],
    };
  }

  @Patch(':event_id')
  async update(
    @Param('event_id') eventId: string,
    @Req() req: any,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.update(eventId, req.user.userId, dto);
  }

  @Post(':event_id/publish')
  async publish(@Param('event_id') eventId: string, @Req() req: any) {
    return this.eventService.publish(eventId, req.user.userId);
  }

  @Post(':event_id/change_scene')
  async changeScene(
    @Param('event_id') eventId: string,
    @Req() req: any,
    @Body() body: { target_state: EventStatus },
  ) {
    const newState = await this.eventService.changeScene(
      eventId,
      body.target_state,
      req.user.userId,
    );
    // 状态广播由 EventService 抛 SCENE_CHANGED 事件，Gateway 监听处理
    return { state: newState };
  }

  @Post(':event_id/shake')
  async shake(
    @Param('event_id') eventId: string,
    @Req() req: any,
    @Body() body: { count: number },
  ) {
    // 高频事件：直接走 EventEmitter（Gateway 监听后累加 Redis ZSet）
    this.emitter.emit(APP_EVENTS.SHAKE_UPDATED, {
      event_id: eventId,
      user_id: req.user.userId,
      count: body.count || 1,
    });
    return { ok: true };
  }

  @Get('host/my')
  async findByHost(@Req() req: any) {
    return this.eventService.findByHost(req.user.userId);
  }

  /**
   * 列出当前活动在线的 host/co-host 列表
   * 仅 host 与 co-host 可访问
   */
  @Get(':event_id/presence')
  async presence(
    @Param('event_id') eventId: string,
    @Req() req: any,
  ) {
    const event = await this.eventService.findOne(eventId);
    const userId = req.user.userId;
    const isHostOrCoHost =
      event.host_id === userId ||
      (event.co_host_ids || []).includes(userId);
    if (!isHostOrCoHost) {
      throw new ForbiddenException('Only host or co-host can view presence');
    }
    const active = await this.hostPresence.listActive(eventId);
    return {
      event_id: eventId,
      primary_id: event.host_id,
      active,
      count: active.length,
    };
  }
}
