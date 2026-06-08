import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IcebreakerService } from './icebreaker.service';
import { CreateIcebreakerDto } from './dto/create-icebreaker.dto';
import { AnswerIcebreakerDto } from './dto/answer-icebreaker.dto';

@Controller('icebreaker')
export class IcebreakerController {
  constructor(private readonly service: IcebreakerService) {}

  @Post('question')
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: any, @Body() dto: CreateIcebreakerDto) {
    return this.service.createQuestion(req.user.userId, dto);
  }

  @Post('question/:question_id/publish')
  @UseGuards(AuthGuard('jwt'))
  async publish(
    @Req() req: any,
    @Param('question_id') questionId: string,
  ) {
    return this.service.publishQuestion(req.user.userId, questionId);
  }

  @Post('event/:event_id/close')
  @UseGuards(AuthGuard('jwt'))
  async close(
    @Req() req: any,
    @Param('event_id') eventId: string,
  ) {
    await this.service.closeQuestion(req.user.userId, eventId);
    return { ok: true };
  }

  @Post('answer')
  @UseGuards(AuthGuard('jwt'))
  async answer(@Req() req: any, @Body() dto: AnswerIcebreakerDto) {
    return this.service.answer(req.user.userId, dto);
  }

  /**
   * Guest 答题：扫码用户无 JWT，通过 X-Device-Token / X-User-Token 识别
   * 与签到流程一致的身份识别机制
   */
  @Post('answer/guest')
  async answerGuest(
    @Body() dto: AnswerIcebreakerDto,
    @Headers('x-device-token') deviceToken?: string,
    @Headers('x-user-token') userToken?: string,
  ) {
    return this.service.answerGuest(
      deviceToken || '',
      userToken || '',
      dto,
    );
  }

  @Get('event/:event_id/questions')
  async list(@Param('event_id') eventId: string) {
    return this.service.listQuestions(eventId);
  }

  @Get('event/:event_id/star_colors')
  async starColors(@Param('event_id') eventId: string) {
    return this.service.getStarColors(eventId);
  }

  /**
   * 公开接口：获取当前活动正在发布的问题（晚入场 / 断线重连恢复）
   * 无快照返回 null
   */
  @Get('event/:event_id/current')
  async current(@Param('event_id') eventId: string) {
    const q = await this.service.getCurrentQuestion(eventId);
    return { event_id: eventId, question: q };
  }

  /**
   * 公开接口：获取活动破冰统计数据（参与人数、总回答数）
   */
  @Get('event/:event_id/stats')
  async stats(@Param('event_id') eventId: string) {
    return this.service.getStats(eventId);
  }
}
