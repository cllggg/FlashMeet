import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { EventModule } from './modules/event/event.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { LotteryModule } from './modules/lottery/lottery.module';
import { GlobalUserModule } from './modules/global-user/global-user.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { IcebreakerModule } from './modules/icebreaker/icebreaker.module';
import { MatchModule } from './modules/match/match.module';
import { ReportModule } from './modules/report/report.module';
import { RedisModule } from './common/modules/redis.module';
import { ScreenModule } from './modules/screen/screen.module';
import { PublicModule } from './modules/public/public.module';
import { HealthModule } from './modules/health/health.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { ShakeGuardMiddleware } from './common/middleware/shake-guard.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    EventEmitterModule.forRoot({
      wildcard: true, // 允许 namespace 事件（如 'checkin.*'）
      delimiter: '.',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'sqlite');
        const isProduction = configService.get('NODE_ENV') === 'production';
        if (dbType === 'sqlite') {
          return {
            type: 'sqljs',
            location: configService.get('DB_NAME', 'flashmeet.sqlite'),
            autoSave: true,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: !isProduction,
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
          synchronize: !isProduction,
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
    IcebreakerModule,
    MatchModule,
    ReportModule,
    GatewayModule,
    HealthModule,
    TelemetryModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
    consumer.apply(ShakeGuardMiddleware).forRoutes({ path: 'event/*path/shake', method: RequestMethod.POST });
  }
}