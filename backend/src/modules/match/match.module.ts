import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { MatchPair } from './entities/match-pair.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { BlindChatModule } from './chat/chat.module';

@Module({
  imports: [TypeOrmModule.forFeature([MatchPair, CheckIn]), BlindChatModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}