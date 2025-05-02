import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateEpisodeResponseDto {
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

  @IsNumber()
  readonly sizeInKb: number | null;

  @IsNumber()
  readonly duration: number | null;
}
