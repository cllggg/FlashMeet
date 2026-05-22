import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WechatAuthDto } from './dto/wechat-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat')
  async wechatLogin(@Body() dto: WechatAuthDto) {
    return this.authService.wechatLogin(dto);
  }
}
