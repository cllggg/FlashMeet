import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalUser } from './entities/global-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalUser])],
  exports: [TypeOrmModule],
})
export class GlobalUserModule {}
