import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CheckInDto {
  @IsString()
  event_id: string;

  @IsString()
  @IsOptional()
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
}
