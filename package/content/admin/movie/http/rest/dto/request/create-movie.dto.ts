import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMovieInputDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly description: string;
}
