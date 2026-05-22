import { IsString, IsOptional } from 'class-validator';

export class DrawLotteryDto {
  @IsString()
  event_id: string;

  @IsString()
  pool_id: string;

  @IsString()
  @IsOptional()
  request_id?: string;
}
