import { Controller, Post, Get, Param, Body, Req, Query } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  /** 为指定活动查询用户的匹配推荐 */
  @Get('event/:event_id/top')
  async getTopMatches(
    @Param('event_id') eventId: string,
    @Query('user_id') userId: string,
  ) {
    return this.matchService.getTopMatches(eventId, userId);
  }

  @Post('event/:event_id/generate')
  async generate(@Param('event_id') eventId: string) {
    return this.matchService.generateMatches(eventId);
  }

  /** 获取活动匹配结果 */
  @Get('event/:event_id')
  async getMatches(@Param('event_id') eventId: string) {
    return this.matchService.getMatches(eventId);
  }

  /** 接受匹配 */
  @Post('event/:event_id/accept')
  async accept(@Param('event_id') eventId: string, @Body() body: { user_id: string }) {
    return this.matchService.acceptMatch(eventId, body.user_id);
  }

  /** 拒绝匹配 */
  @Post('event/:event_id/reject')
  async reject(@Param('event_id') eventId: string, @Body() body: { user_id: string }) {
    return this.matchService.rejectMatch(eventId, body.user_id);
  }
}