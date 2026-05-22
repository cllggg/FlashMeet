import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryPool } from './entities/lottery-pool.entity';
import { LotteryRecord } from './entities/lottery-record.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Event } from '../event/entities/event.entity';
import { LotteryService } from './lottery.service';
import { LotteryController } from './lottery.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LotteryPool, LotteryRecord, CheckIn, Event]),
    forwardRef(() => GatewayModule),
  ],
  controllers: [LotteryController],
  providers: [LotteryService],
  exports: [LotteryService],
})
export class LotteryModule {}
