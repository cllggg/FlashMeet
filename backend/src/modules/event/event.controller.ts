import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventService } from './event.service';
import { EventGateway } from '../gateway/event.gateway';
import { EventStatus } from '../../common/enums/event-status.enum';
import { WsEvent } from '../../common/enums/ws-event.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('event')
@UseGuards(AuthGuard('jwt'))
export class EventController {
  constructor(
    private readonly eventService: EventService,
    @Inject(forwardRef(() => EventGateway))
    private readonly gateway: EventGateway,
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

    this.gateway.broadcastSceneChange(eventId, newState);

    return { state: newState };
  }

  @Post(':event_id/shake')
  async shake(
    @Param('event_id') eventId: string,
    @Req() req: any,
    @Body() body: { count: number },
  ) {
    this.gateway.handleShakeRest(eventId, req.user.userId, body.count || 1);
    return { ok: true };
  }

  @Get('host/my')
  async findByHost(@Req() req: any) {
    return this.eventService.findByHost(req.user.userId);
  }
}
