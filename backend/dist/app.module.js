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
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./modules/auth/auth.module");
const event_module_1 = require("./modules/event/event.module");
const checkin_module_1 = require("./modules/checkin/checkin.module");
const lottery_module_1 = require("./modules/lottery/lottery.module");
const global_user_module_1 = require("./modules/global-user/global-user.module");
const gateway_module_1 = require("./modules/gateway/gateway.module");
const redis_module_1 = require("./common/modules/redis.module");
const screen_module_1 = require("./modules/screen/screen.module");
const public_module_1 = require("./modules/public/public.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
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
                        port: configService.get('DB_PORT', 5432),
                        username: configService.get('DB_USERNAME', 'postgres'),
                        password: configService.get('DB_PASSWORD', 'postgres'),
                        database: configService.get('DB_DATABASE', 'flashmeet'),
                        entities: [__dirname + '/**/*.entity{.ts,.js}'],
                        synchronize: true,
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
            gateway_module_1.GatewayModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map