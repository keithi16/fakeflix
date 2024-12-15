import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEpisodeRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  // @IsNumber()
  @IsNotEmpty()
  season: number;

  // @IsNumber()
  @IsNotEmpty()
  number: number;

  @IsString()
  description: string;
}
