import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../event/entities/event.entity';
import { EventModule } from '../event/event.module';
import { HostAssistantModule } from '../host-assistant/host-assistant.module';
import { ExperienceStreamController } from './experience-stream.controller';
import { ExperienceStreamService } from './experience-stream.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), EventModule, HostAssistantModule],
  controllers: [ExperienceStreamController],
  providers: [ExperienceStreamService],
  exports: [ExperienceStreamService],
})
export class ExperienceStreamModule {}
