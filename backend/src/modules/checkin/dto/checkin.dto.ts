import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  MaxLength,
  Matches,
} from 'class-validator';

export class CheckInDto {
  @IsString()
  event_id: string;

  @IsString()
  @IsOptional()
  @MaxLength(16)
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsArray()
  @IsOptional()
  local_tags?: string[];

  @IsBoolean()
  @IsOptional()
  is_invisible?: boolean;

  /**
   * 客户端生成的展示 ID（可选）
   * - 形式：{name}#{4位数字}，如 "阿明#7392"
   * - 不传则服务端按 name 生成
   * - 长度上限 32，字符集 [A-Za-z0-9_#]
   */
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_#\u4e00-\u9fa5]+$/, {
    message: 'display_id contains invalid characters',
  })
  display_id?: string;

  /**
   * 服务端签发的稳定身份 Token
   * - 前端从 localStorage 读取并回传
   * - 命中则可合并到既有用户（不创建新行）
   */
  @IsString()
  @IsOptional()
  @MaxLength(80)
  user_token?: string;
}
