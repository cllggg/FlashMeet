import { IsString } from 'class-validator';

export class WechatAuthDto {
  @IsString()
  code: string;
}
