import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  Header,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { LotteryService } from './lottery.service';
import { CreateLotteryPoolDto } from './dto/create-lottery-pool.dto';
import { DrawLotteryDto } from './dto/draw-lottery.dto';

@Controller('lottery')
@UseGuards(AuthGuard('jwt'))
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) {}

  @Post('pool')
  async createPool(@Body() dto: CreateLotteryPoolDto) {
    return this.lotteryService.createPool(dto);
  }

  @Post('draw')
  async draw(@Req() req: any, @Body() dto: DrawLotteryDto) {
    // LotteryService 内部抛 LOTTERY_DRAWN 事件，Gateway 监听后广播
    if (dto.count && dto.count > 1) {
      return this.lotteryService.drawBatch(req.user.userId, dto);
    }
    return this.lotteryService.draw(req.user.userId, dto);
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

  /**
   * 导出中奖名单 CSV
   * - UTF-8 BOM 头确保 Excel 不乱码
   * - 字段：抽奖时间, display_id, 昵称, 奖品, 奖品价值, 手机号
   * - 手机号中间 4 位打码，遵守个保法
   */
  @Get(':event_id/winners/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportWinnersCsv(
    @Param('event_id') eventId: string,
    @Query('pool_id') poolId: string | undefined,
    @Res() res: Response,
  ) {
    const winners = await this.lotteryService.getWinnersForExport(
      eventId,
      poolId,
    );
    const escape = (s: any) => {
      const v = (s ?? '').toString();
      // CSV 转义：含 , " 换行 的字段需用双引号包裹并将 " 转义为 ""
      if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    };
    const lines = ['抽奖时间,DisplayID,昵称,奖品,奖品价值(元),手机号'];
    for (const w of winners) {
      const phone = (w.user?.phone || '').toString();
      const masked = phone
        ? phone.replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2')
        : '';
      lines.push(
        [
          new Date(w.won_at).toISOString(),
          w.display_id || '',
          w.user?.nickname || '',
          w.prize_name || '',
          w.prize_value ?? 0,
          masked,
        ]
          .map(escape)
          .join(','),
      );
    }
    // BOM 头让 Excel 正确识别 UTF-8
    const body = '\uFEFF' + lines.join('\r\n');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="winners_${eventId}.csv"`,
    );
    res.send(body);
  }
}
