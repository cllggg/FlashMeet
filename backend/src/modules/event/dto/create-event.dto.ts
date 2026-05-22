import { IsString, IsOptional, IsDateString, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.scheduled_at !== undefined && o.scheduled_at !== null)
  @IsDateString()
  @IsOptional()
  scheduled_at?: string;

  @IsOptional()
  settings?: Record<string, any>;
}
