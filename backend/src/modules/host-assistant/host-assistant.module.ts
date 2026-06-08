import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Event } from '../event/entities/event.entity';
import { EventModule } from '../event/event.module';
import { HostAssistantController } from './host-assistant.controller';
import { HostAssistantService } from './host-assistant.service';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn, Event]), EventModule],
  controllers: [HostAssistantController],
  providers: [HostAssistantService],
  exports: [HostAssistantService],
})
export class HostAssistantModule {}
