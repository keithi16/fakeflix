import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTvShowResponseDto {
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
  readonly thumbnailUrl?: string;
}
