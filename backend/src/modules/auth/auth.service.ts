import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalUser } from '../global-user/entities/global-user.entity';
import { WechatAuthDto } from './dto/wechat-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(GlobalUser)
    private readonly userRepo: Repository<GlobalUser>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * MVP: Mock wechat auth. In production, exchange code for openid via WeChat API.
   */
  async wechatLogin(dto: WechatAuthDto) {
    // MVP: use code as mock openid for development
    const openid = `mock_openid_${dto.code}`;

    let user = await this.userRepo.findOne({
      where: { wechat_openid: openid },
    });

    if (!user) {
      user = this.userRepo.create({
        wechat_openid: openid,
        nickname: `User_${Date.now().toString().slice(-6)}`,
        global_tags: [],
        event_participated_count: 0,
        role: 'user',
      });
      user = await this.userRepo.save(user);
    }

    const payload = { sub: user.user_id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { access_token: token, user };
  }

  async validateUser(userId: string): Promise<GlobalUser> {
    const user = await this.userRepo.findOne({ where: { user_id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
