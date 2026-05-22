import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { WechatAuthDto } from './dto/wechat-auth.dto';
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    constructor(userRepo: Repository<GlobalUser>, jwtService: JwtService);
    wechatLogin(dto: WechatAuthDto): Promise<{
        access_token: string;
        user: GlobalUser;
    }>;
    validateUser(userId: string): Promise<GlobalUser>;
}
