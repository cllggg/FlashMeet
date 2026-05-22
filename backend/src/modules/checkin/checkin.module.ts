import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckIn } from './entities/checkin.entity';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { Event } from '../event/entities/event.entity';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckIn, Event, GlobalUser]),
    forwardRef(() => GatewayModule),
  ],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
