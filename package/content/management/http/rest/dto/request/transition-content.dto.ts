import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PublishingStatus } from '../../../../../shared/core/enum/publishing-status.enum';

export class TransitionContentDto {
  @IsEnum(PublishingStatus)
  targetState: PublishingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;
}
