import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

export class DrawLotteryDto {
  @IsString()
  event_id: string;

  @IsString()
  pool_id: string;

  @IsString()
  @IsOptional()
  request_id?: string;

  /**
   * 批量抽取数量（默认 1）
   * 服务端会循环调用单次 draw 逻辑，逐个发奖与广播
   */
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  count?: number;

  /**
   * 内定中奖人 user_id 列表（白名单）
   * - 主持人可指定若干 user_id 作为"保底中奖人"
   * - 服务端会优先从该列表中按顺序抽取
   * - 列表耗尽或对应用户不满足资格时，回退到随机抽取
   * - 同一奖池内每个 user_id 只能被"内定"一次（不可重复中奖）
   * - 列表长度不得超过 count（前端自行校验）
   */
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsOptional()
  pre_picked_user_ids?: string[];
}
