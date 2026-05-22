import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { EventModule } from './modules/event/event.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { LotteryModule } from './modules/lottery/lottery.module';
import { GlobalUserModule } from './modules/global-user/global-user.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { RedisModule } from './common/modules/redis.module';
import { ScreenModule } from './modules/screen/screen.module';
import { PublicModule } from './modules/public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'sqlite');
        if (dbType === 'sqlite') {
          return {
            type: 'sqljs',
            location: configService.get('DB_NAME', 'flashmeet.sqlite'),
            autoSave: true,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
          };
        }
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_DATABASE', 'flashmeet'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: true,
        };
      },
    }),
    RedisModule,
    ScreenModule,
    PublicModule,
    AuthModule,
    GlobalUserModule,
    EventModule,
    CheckinModule,
    LotteryModule,
    GatewayModule,
  ],
})
export class AppModule {}