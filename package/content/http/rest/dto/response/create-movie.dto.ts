import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateMovieResponseDto {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string;
  @IsString()
  @IsNotEmpty()
  readonly title: string;
  @IsString()
  @IsNotEmpty()
  readonly description: string;
  @IsString()
  @IsNotEmpty()
  readonly videoUrl: string;
  @IsString()
  readonly thumbnailUrl?: string;
  @IsNumber()
  @IsNotEmpty()
  readonly sizeInKb: number;
  @IsNotEmpty()
  @IsNumber()
  readonly duration: number;
}
