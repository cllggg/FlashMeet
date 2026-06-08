import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PrizeItemDto {
  @IsString()
  name: string;

  @IsNumber()
  total_count: number;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsNumber()
  @IsOptional()
  value?: number;
}

export class CreateLotteryPoolDto {
  @IsString()
  event_id: string;

  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeItemDto)
  prizes: PrizeItemDto[];
}
