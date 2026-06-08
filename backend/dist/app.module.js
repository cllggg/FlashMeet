"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./modules/auth/auth.module");
const event_module_1 = require("./modules/event/event.module");
const checkin_module_1 = require("./modules/checkin/checkin.module");
const lottery_module_1 = require("./modules/lottery/lottery.module");
const global_user_module_1 = require("./modules/global-user/global-user.module");
const gateway_module_1 = require("./modules/gateway/gateway.module");
const icebreaker_module_1 = require("./modules/icebreaker/icebreaker.module");
const match_module_1 = require("./modules/match/match.module");
const report_module_1 = require("./modules/report/report.module");
const redis_module_1 = require("./common/modules/redis.module");
const screen_module_1 = require("./modules/screen/screen.module");
const public_module_1 = require("./modules/public/public.module");
const health_module_1 = require("./modules/health/health.module");
const telemetry_module_1 = require("./modules/telemetry/telemetry.module");
const host_assistant_module_1 = require("./modules/host-assistant/host-assistant.module");
const experience_stream_module_1 = require("./modules/experience-stream/experience-stream.module");
const request_id_middleware_1 = require("./common/middleware/request-id.middleware");
const shake_guard_middleware_1 = require("./common/middleware/shake-guard.middleware");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const rate_limit_guard_1 = require("./common/guards/rate-limit.guard");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware).forRoutes('*');
        consumer.apply(shake_guard_middleware_1.ShakeGuardMiddleware).forRoutes({ path: 'event/*path/shake', method: common_1.RequestMethod.POST });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: true,
                delimiter: '.',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
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
                        port: configService.get('DB_PORT', 5432),
                        username: configService.get('DB_USERNAME', 'postgres'),
                        password: configService.get('DB_PASSWORD', 'postgres'),
                        database: configService.get('DB_DATABASE', 'flashmeet'),
                        entities: [__dirname + '/**/*.entity{.ts,.js}'],
                        synchronize: !isProduction,
                        logging: true,
                    };
                },
            }),
            redis_module_1.RedisModule,
            screen_module_1.ScreenModule,
            public_module_1.PublicModule,
            auth_module_1.AuthModule,
            global_user_module_1.GlobalUserModule,
            event_module_1.EventModule,
            checkin_module_1.CheckinModule,
            lottery_module_1.LotteryModule,
            icebreaker_module_1.IcebreakerModule,
            match_module_1.MatchModule,
            report_module_1.ReportModule,
            gateway_module_1.GatewayModule,
            health_module_1.HealthModule,
            telemetry_module_1.TelemetryModule,
            host_assistant_module_1.HostAssistantModule,
            experience_stream_module_1.ExperienceStreamModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: rate_limit_guard_1.RateLimitGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map