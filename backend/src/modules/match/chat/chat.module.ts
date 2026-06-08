import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlindChatController } from './chat.controller';
import { BlindChatService } from './chat.service';
import { BlindChatMessage } from './entities/chat-message.entity';
import { MatchPair } from '../entities/match-pair.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlindChatMessage, MatchPair])],
  controllers: [BlindChatController],
  providers: [BlindChatService],
  exports: [BlindChatService],
})
export class BlindChatModule {}