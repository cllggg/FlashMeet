import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LotteryService } from './lottery.service';
import { EventGateway } from '../gateway/event.gateway';
import { CreateLotteryPoolDto } from './dto/create-lottery-pool.dto';
import { DrawLotteryDto } from './dto/draw-lottery.dto';

@Controller('lottery')
@UseGuards(AuthGuard('jwt'))
export class LotteryController {
  constructor(
    private readonly lotteryService: LotteryService,
    @Inject(forwardRef(() => EventGateway))
    private readonly gateway: EventGateway,
  ) {}

  @Post('pool')
  async createPool(@Body() dto: CreateLotteryPoolDto) {
    return this.lotteryService.createPool(dto);
  }

  @Post('draw')
  async draw(@Req() req: any, @Body() dto: DrawLotteryDto) {
    const result = await this.lotteryService.draw(req.user.userId, dto);

    if (result) {
      this.gateway.announceLotteryWinner(dto.event_id, {
        id: result.id,
        user: { user_id: result.user_id, nickname: '幸运儿' },
        prize_name: result.prize_name,
      });
    }

    return result;
  }

  @Get(':event_id/pools')
  async getPools(@Param('event_id') eventId: string) {
    return this.lotteryService.getPools(eventId);
  }

  @Get(':event_id/winners')
  async getWinners(
    @Param('event_id') eventId: string,
    @Query('pool_id') poolId?: string,
  ) {
    return this.lotteryService.getWinners(eventId, poolId);
  }
}
