import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  scheduled_at?: string;

  @IsOptional()
  settings?: Record<string, any>;

  @IsArray()
  @IsOptional()
  co_host_ids?: string[];
}
