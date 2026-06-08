import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Event } from '../event/entities/event.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { MatchPair } from '../match/entities/match-pair.entity';
import { IcebreakerQuestion } from '../icebreaker/entities/icebreaker-question.entity';
import { IcebreakerAnswer } from '../icebreaker/entities/icebreaker-answer.entity';
import { LotteryPool } from '../lottery/entities/lottery-pool.entity';
import { LotteryRecord } from '../lottery/entities/lottery-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      CheckIn,
      MatchPair,
      IcebreakerQuestion,
      IcebreakerAnswer,
      LotteryPool,
      LotteryRecord,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}