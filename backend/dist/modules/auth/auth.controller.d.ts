import { AuthService } from './auth.service';
import { WechatAuthDto } from './dto/wechat-auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    wechatLogin(dto: WechatAuthDto): Promise<{
        access_token: string;
        user: import("../global-user/entities/global-user.entity").GlobalUser;
    }>;
}
