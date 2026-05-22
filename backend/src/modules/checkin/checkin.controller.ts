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
import { CheckinService } from './checkin.service';
import { EventGateway } from '../gateway/event.gateway';
import { CheckInDto } from './dto/checkin.dto';

@Controller('checkin')
export class CheckinController {
  constructor(
    private readonly checkinService: CheckinService,
    @Inject(forwardRef(() => EventGateway))
    private readonly gateway: EventGateway,
  ) {}

  @Post('guest')
  async guestCheckIn(@Body() dto: CheckInDto) {
    const { checkin, user, isNew } = await this.checkinService.guestCheckIn(dto);

    if (isNew) {
      this.gateway.notifyUserCheckedIn(dto.event_id, {
        user_id: user.user_id,
        nickname: user.nickname,
        name: checkin.name || user.nickname,
        avatar_url: user.avatar_url,
        phone: user.phone,
        local_tags: checkin.local_tags,
      });
    }

    return {
      checkin,
      user: { user_id: user.user_id, nickname: user.nickname, avatar_url: user.avatar_url, phone: user.phone },
      isNew,
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async checkIn(@Req() req: any, @Body() dto: CheckInDto) {
    const result = await this.checkinService.checkIn(req.user.userId, dto);

    this.gateway.notifyUserCheckedIn(dto.event_id, {
      user_id: result.user_id,
      nickname: req.user.nickname || '暗星',
      name: result.name || req.user.nickname || '暗星',
      avatar_url: req.user.avatar_url,
      local_tags: result.local_tags,
    });

    return result;
  }

  @Get('event/:event_id')
  async getCheckins(@Param('event_id') eventId: string) {
    return this.checkinService.getCheckins(eventId);
  }

  @Get('event/:event_id/count')
  async getCheckinCount(@Param('event_id') eventId: string) {
    const count = await this.checkinService.getCheckinCount(eventId);
    return { count };
  }

  @Patch('event/:event_id/tags')
  async updateTags(
    @Req() req: any,
    @Param('event_id') eventId: string,
    @Body() body: { tags: string[] },
  ) {
    return this.checkinService.updateTags(req.user.userId, eventId, body.tags);
  }
}
