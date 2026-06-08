import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventGateway } from './event.gateway';
import { EventModule } from '../event/event.module';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { IcebreakerModule } from '../icebreaker/icebreaker.module';
import { MatchModule } from '../match/match.module';
import { ExperienceStreamModule } from '../experience-stream/experience-stream.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GlobalUser]),
    EventModule,
    IcebreakerModule,
    MatchModule,
    ExperienceStreamModule,
  ],
  providers: [EventGateway],
  exports: [EventGateway],
})
export class GatewayModule {}
