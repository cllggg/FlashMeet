import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScreenController } from './screen.controller';
import { Event } from '../event/entities/event.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { LotteryRecord } from '../lottery/entities/lottery-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, CheckIn, LotteryRecord])],
  controllers: [ScreenController],
})
export class ScreenModule {}