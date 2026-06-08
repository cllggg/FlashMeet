import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IcebreakerQuestion } from './entities/icebreaker-question.entity';
import { IcebreakerAnswer } from './entities/icebreaker-answer.entity';
import { CheckIn } from '../checkin/entities/checkin.entity';
import { Event } from '../event/entities/event.entity';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { IcebreakerService } from './icebreaker.service';
import { IcebreakerController } from './icebreaker.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IcebreakerQuestion,
      IcebreakerAnswer,
      CheckIn,
      Event,
      GlobalUser,
    ]),
  ],
  controllers: [IcebreakerController],
  providers: [IcebreakerService],
  exports: [IcebreakerService],
})
export class IcebreakerModule {}
