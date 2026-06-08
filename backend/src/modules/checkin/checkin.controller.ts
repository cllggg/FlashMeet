import {
  Controller,
  Get,
  Post,
  Patch,
  Headers,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CheckinService } from './checkin.service';
import { CheckInDto } from './dto/checkin.dto';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('guest')
  async guestCheckIn(
    @Body() dto: CheckInDto,
    @Headers('x-device-token') deviceToken?: string,
  ) {
    // 签到完成后由 CheckinService 抛 CHECKIN_CREATED 事件，Gateway 监听广播
    return this.checkinService.guestCheckIn(dto, deviceToken);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async checkIn(@Req() req: any, @Body() dto: CheckInDto) {
    return this.checkinService.checkIn(req.user.userId, dto);
  }

  /**
   * 扫码静默召回：多身份召回 + 返回 user_token
   * - 200 found=true → 前端直接进入"已签到"视图
   * - 200 found=false → 前端展示录入表单（可预填 user profile）
   * 优先级: X-User-Token (header) / body.user_token > X-Device-Token > body.phone
   */
  @Post('resolve')
  async resolve(
    @Body() body: { event_id: string; user_token?: string; phone?: string },
    @Headers('x-device-token') deviceToken?: string,
    @Headers('x-user-token') userTokenHeader?: string,
  ) {
    const userToken = body?.user_token || userTokenHeader;
    return this.checkinService.resolve(
      body?.event_id,
      deviceToken,
      userToken,
      body?.phone,
    );
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
