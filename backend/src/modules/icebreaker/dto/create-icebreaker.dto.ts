import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  IsHexColor,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IcebreakerOptionDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsString()
  @IsHexColor()
  color: string;
}

export class CreateIcebreakerDto {
  @IsString()
  @IsNotEmpty()
  event_id: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => IcebreakerOptionDto)
  options: IcebreakerOptionDto[];

  @IsOptional()
  display_order?: number;
}
