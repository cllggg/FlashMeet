import { IsString, IsNotEmpty } from 'class-validator';

export class AnswerIcebreakerDto {
  @IsString()
  @IsNotEmpty()
  event_id: string;

  @IsString()
  @IsNotEmpty()
  question_id: string;

  @IsString()
  @IsNotEmpty()
  option_key: string;
}
